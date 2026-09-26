/* GC500 Delivery Control — the hosted record.
 *
 * One small Node service, no dependencies, that
 *   · serves the app (GC500_Delivery_Control_hosted.html, uploaded through the admin page) at two kinds of link:
 *       /v/<VIEW_TOKEN>   anyone with this link can open the page and see the shared record
 *       /e/<EDIT_TOKEN>   opening the page through this link lets that browser change the record
 *   · keeps the shared record: JSON documents in collections (delivery/GN01, fenceDockets/F-AF-0003, ...),
 *     last-writer-wins per document, a version counter the page polls, an hourly snapshot for backups, and an
 *     append-only log of every write with the name the writer typed;
 *   · lets the owner upload a new build of the app and download the record, at /admin/<EDIT_TOKEN>;
 *   · keeps the document library — SWMS, drawings, plates, packs — uploaded on the admin page or from the page
 *     itself through the edit link, listed at /api/files and opened at /f/<token>/<id>.
 *
 * Everything lives on one persistent volume (DATA_DIR). Tokens are the only access control: a link is a key.
 * Names inside records are typed by people, not signed in — the log says who claimed to do what, not who did.
 *
 * Environment: PORT (Railway sets it), DATA_DIR (default /data), VIEW_TOKEN, EDIT_TOKEN (required, 16+ chars).
 * Author: Andrew Fisher · Coates Industrial Solutions · GC500
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { Transform, pipeline } = require('stream');

const PORT = parseInt(process.env.PORT || '8080', 10);
const DATA_DIR = process.env.DATA_DIR || '/data';
const VIEW_TOKEN = String(process.env.VIEW_TOKEN || '');
const EDIT_TOKEN = String(process.env.EDIT_TOKEN || '');
const MAX_DOC = 512 * 1024;            // one document
const MAX_APP = 40 * 1024 * 1024;      // the uploaded page
const MAX_FILE = 160 * 1024 * 1024;    // one document (the A3 laminate set is ~70 MB)
const MAX_THUMB = 200 * 1024;         // a browser-made, static WebP preview
const KEEP_SNAPSHOTS = 96;             // hourly, four days
const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;
const BUILD = 'server v5.83 — THE FORECAST (GET /api/weather/forecast: weatherapi.com forecast.json trimmed to one row a day, held an hour, behind the link token; Andrew Fisher, 26 Sep 2026; nothing else changed) + THE MACHINE SET MAY CARRY THE SATELLITE PLAN EXPLORER AND THE 3D PROOF (its html pages may reach Mapbox tiles, Google 3D tiles and CesiumJS on jsDelivr, and send their origin as referrer; Andrew Fisher, 25 Sep 2026; nothing else changed) + THE GOOGLE KEY FROM THE SERVICE (GOOGLE_MAPS_KEY, a browser key, handed to the page beside the Mapbox token at /api/map-key; Andrew Fisher, 25 Sep 2026; nothing else changed) + everything v5.40 did (the record, the document library, drop photographs, units, stamps, contracts, costs, purchase orders, driver drop cards, texting, the weather, filing, the record moved between references, labour ticked per piece) + THE DROP CARD ANSWERS BACK (v5.56: a card reports on its own link at /d/<token>/report — delivered, in position, installed, levelled, stairs, a note, photographs and the spot somebody stood on — stored as that person\'s word and never as a Coates record, readable at /api/reports behind the edit link only) + A WRITE THAT FAILED IS NEVER ANSWERED 200 (v5.58: cards and reports write-then-rename, 507 on failure; a failed record write refuses every further write with the reason and /health says so; a card\'s day is a Queensland day; a blank position is not a pin at 0,0; the 401st card no longer deletes a live driver link) + THE EXPORT CARRIES BOTH FENCING SIDES (v5.60: fenceRates, what the customer is charged, and fenceCosts, what the fencing crew bill — two fields, never one column) + THE COATES WAY MACHINE (v5.77: the V8 Connected page, its modules, the original cog artwork and its sound, imported on the admin page from the build\'s print/out/machine folder and served at /w/<token>/ to the view link and the edit link, inside the page\'s own Coates Way tab; content-addressed blobs, a set that goes live whole in one write, nothing of the record touched)';   // printed at start so the deploy log says which code runs
/* the weather reading, held for ten minutes so a room full of phones is one call upstream */
const WEATHER_TTL = 10 * 60 * 1000;
let weatherCache = { at: 0, body: null };
/* v5.83 — the day-by-day forecast, held for an hour: a forecast does not change by the minute and the plan's quota is
   finite. Seven days are asked for; the plan decides how many come back and the page shows exactly those. */
const FORECAST_TTL = 60 * 60 * 1000;
let forecastCache = { at: 0, body: null };

if (!TOKEN_RE.test(VIEW_TOKEN) || !TOKEN_RE.test(EDIT_TOKEN) || VIEW_TOKEN === EDIT_TOKEN) {
  console.error('VIEW_TOKEN and EDIT_TOKEN must be set, 16-128 characters of [A-Za-z0-9_-], and different');
  process.exit(1);
}
fs.mkdirSync(path.join(DATA_DIR, 'snapshots'), { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'files'), { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'thumbs'), { recursive: true });

const FILES = {
  records: path.join(DATA_DIR, 'records.json'),
  app: path.join(DATA_DIR, 'app.html'),
  appgz: path.join(DATA_DIR, 'app.html.gz'),
  meta: path.join(DATA_DIR, 'app.meta.json'),
  log: path.join(DATA_DIR, 'writes.log'),
  files: path.join(DATA_DIR, 'files.json'),
  filesDir: path.join(DATA_DIR, 'files'),
  thumbsDir: path.join(DATA_DIR, 'thumbs'),
  cards: path.join(DATA_DIR, 'cards.json'),
  reports: path.join(DATA_DIR, 'reports.json'),
  scoped: path.join(DATA_DIR, 'scoped_reports.json'),   /* v5.63 — replies that name ONE unit */
  sms: path.join(DATA_DIR, 'sms.json'),
  mail: path.join(DATA_DIR, 'mail.json'),
};

// ---------------------------------------------------------------- driver drop cards
/* A drop card is one load's page, made in the app by somebody holding the edit link and posted here whole. It is
   served from its own token — never the view link, which shows the record, the team, the costs and every asset.
   Three rules keep it safe to hand to a carrier:
     · its own namespace. A card token opens a card and nothing else; a view or edit token opens no card.
     · frozen. The card is the HTML that was posted. It cannot change under a driver mid-run, and the server
       never reads the record to build it, so nothing can leak into it that the app did not put there.
     · it stops. After its run day (plus a grace day by default) the link is gone, and what the driver sees is a
       page telling them to ring — not a 404 at a gate at half past four in the morning.
   Every open is logged with the day, so a card that has been opened forty times says so. */
const MAX_CARD = 2 * 1024 * 1024;      // one card, HTML with its pictures inline
const KEEP_CARDS = 400;                // oldest expired cards drop off beyond this
const CARD_TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
let cards = {};
try { cards = JSON.parse(fs.readFileSync(FILES.cards, 'utf8')) || {}; } catch (e) { /* first run */ }
/* v5.58 — A SAVE THAT DID NOT REACH THE DISK IS NOT A SAVE. The 19 Sep 2026 audit: these caught a write error,
   logged it, and let the handler answer 200 — so a full or failed volume handed a driver "Sent. Coates has your
   report" for a report that existed in memory alone and was gone at the next restart. Each write now goes to a
   temporary file and is renamed into place (whole or not at all), and a failure is RETURNED so the handler
   answers with it and the person keeps what they typed. */
function writeWhole(file, obj) {
  const tmp = file + '.tmp.' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, file);
}
function persistCards() { try { writeWhole(FILES.cards, cards); return null; } catch (e) { console.error('cards', e.message); return e; } }
function cardToken() { return crypto.randomBytes(24).toString('base64url'); }
/* v5.58 — A CARD'S DAY IS A QUEENSLAND DAY. This read the UTC date, so a card for 19 Sep stayed live until
   10:00 on the 20th at the circuit (the 19 Sep 2026 audit). The texting cap already counts Queensland days;
   the cards now count the same ones. Moving the service to another region changes nothing here — it is the
   clock at the gate that matters, and that clock is Brisbane's, UTC+10, no daylight saving. */
function qldDay(at) { return new Date((at == null ? Date.now() : at) + 10 * 3600 * 1000).toISOString().slice(0, 10); }
function cardExpired(c, now) { return !!(c.expires && String(now || qldDay()) > c.expires); }
function cardBrief(c) {
  const o = Object.assign({}, c); delete o.html;
  o.bytes = (c.html || '').length; o.opens = (c.opens || []).length;
  o.last_open = (c.opens || []).slice(-1)[0] || null;
  o.expired = cardExpired(c);
  /* v5.56 — a card that has been answered says so in the list, so nobody has to open it to find out */
  const rs = (typeof reports === 'object' && reports ? reports[c.token] : null) || [];
  o.reports = rs.length;
  o.last_report = rs.length ? rs[rs.length - 1].at : null;
  return o;
}
/* The hash of the one script a card carries, for its own Content-Security-Policy. A card with no script gets
   'none' and stays as frozen as it ever was, so an older card posted before v5.56 is not loosened by this. */
function cardScriptHash(html) {
  const m = String(html || '').match(/<script>([\s\S]*?)<\/script>/);
  if (!m) return 'none';
  return 'sha256-' + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64');
}
function pruneCards() {
  const all = Object.values(cards);
  if (all.length <= KEEP_CARDS) return;
  /* v5.58 — Array.filter hands the predicate (card, index, array), and cardExpired took the INDEX as "now":
     String(3) > "2026-12-31", so the fourth card in the list read as expired and the 401st card made could
     delete a live driver link (the 19 Sep 2026 audit). One argument, on purpose. */
  all.filter(c => cardExpired(c)).sort((a, b) => String(a.created).localeCompare(String(b.created)))
     .slice(0, all.length - KEEP_CARDS).forEach(c => { delete cards[c.token]; });
}

// ---------------------------------------------------------------- what the person on the ground reported back
/* v5.56 — a drop card can now be answered. Andrew Fisher's brief of 19 Sep 2026: the person who received the
   load reports what they actually did — delivered, in position, installed, levelled, stairs fitted — with a
   note, photographs and the spot they are standing on.

   WHAT A REPORT IS AND IS NOT. It is what somebody says, with the name they typed on it. Holding a card link
   is not proof of who you are, so a report is stored and shown as REPORTED, never as recorded by Coates, and
   nothing here writes to the record. An editor reads the report and decides. That separation is the whole
   design: the driver's word travels instantly and changes no figure until a person says so.

   THE CARD TOKEN IS STILL ONLY A CARD TOKEN. A report is accepted at /d/<token>/report and nowhere else. It
   can write against its own card and nothing else — not another card, not the record, not a file, not the
   contact list, not a price. A card that has expired takes no report.

   ONLY THE FIELDS SENT. Two people answering the same card, or one person answering twice, must not rub each
   other out. Each submission is its own row, kept whole and in order, and the latest answer per field is what
   reads out — so a photograph sent at ten past does not erase a levelling answer sent at ten. */
const MAX_REPORT = 6 * 1024 * 1024;     // one report: its fields, its note, its photographs inline
const KEEP_REPORTS = 4000;
const REPORT_FIELDS = new Set(['delivered', 'in_position', 'installed', 'levelled', 'stairs']);
const REPORT_ANSWERS = new Set(['yes', 'not yet', 'not applicable']);
let reports = {};
try { reports = JSON.parse(fs.readFileSync(FILES.reports, 'utf8')) || {}; } catch (e) { /* first run */ }
/* v5.63 — scoped replies live apart from the legacy ones on purpose. The legacy /d/<token>/report path is
   unchanged and keeps working for every card already issued, whose HTML is frozen and cannot be rewritten
   by rebuilding the page. A new card gets the scoped route. Two stores, one migration, no card left behind. */
let scoped = {};
try { scoped = JSON.parse(fs.readFileSync(FILES.scoped, 'utf8')) || {}; } catch (e) { /* first run */ }
function persistScoped() { try { writeWhole(FILES.scoped, scoped); return null; } catch (e) { console.error('scoped', e.message); return e; } }
function persistReports() { try { writeWhole(FILES.reports, reports); return null; } catch (e) { console.error('reports', e.message); return e; } }
function reportsFor(token) { return (reports[token] || []).slice(); }
function pruneReports() {
  const tokens = Object.keys(reports);
  let n = tokens.reduce((t, k) => t + reports[k].length, 0);
  if (n <= KEEP_REPORTS) return;
  /* oldest cards first, and only cards that have expired — a live card never loses its reports */
  tokens.filter(k => cards[k] && cardExpired(cards[k]))
        .sort((a, b) => String((cards[a] || {}).created).localeCompare(String((cards[b] || {}).created)))
        .forEach(k => { if (n > KEEP_REPORTS) { n -= reports[k].length; delete reports[k]; } });
}
/* A number the person's phone gave, kept as a number or not at all. A pin with no accuracy is still a pin;
   a pin with letters in it is not a pin. */
/* v5.58 — A BLANK IS NOT A NOUGHT. Number('') is 0 and Number(null) is 0, so an empty latitude and longitude
   arrived as a pin at 0, 0 with an accuracy of 0 m — a false position off the coast of Africa, presented as
   exact (the 19 Sep 2026 audit). Only a real number, written as one, is a number here. */
function num(v, lo, hi) {
  if (v == null || typeof v === 'boolean') return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  if (typeof v !== 'number' && typeof v !== 'string') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
}
/* A retry is the same CONTENT, not merely the same number of photographs. Pin accuracy and
   capture method are part of the evidence; receipt timestamps are deliberately not. */
function reportIdentity(r) {
  const fields = Object.keys(r.fields || {}).sort().map(k => [k, r.fields[k]]);
  const pin = r.pin ? [r.pin.lat, r.pin.lon, r.pin.accuracy_m == null ? null : r.pin.accuracy_m, r.pin.how || null] : null;
  const photos = r.photos || [];
  const hash = crypto.createHash('sha256').update(JSON.stringify([fields, r.note || null, pin, r.name_given || null, photos.length]));
  for (const photo of photos) hash.update('\0').update(photo);
  return hash.digest('hex');
}
/* ------------------------------------------------------------------ SCOPED REPLIES: THE CONTRACT
   Astra's report contract, brought in whole from messaging/report-contract.mjs and converted from ES modules
   to this file's CommonJS by machine, not by hand: the `import` became a destructure of the crypto this file
   already requires, and the `export` keywords came off. Nothing else was touched. The conversion is not
   trusted on my reading of it — their own 29 tests were run against THIS text and all 29 pass.

   It is inlined rather than required because the service ships as ONE file: hosting/railway/make_server_b64.py
   minifies, gzips and base64s this single file into two Railway variables, and a second file would have
   nowhere to go. Pieces sit at 20,054 of the 32,768 characters a variable holds, so there is room.

   What it is: pure validation. No HTTP, no storage, no authentication. The grant it validates against MUST be
   built here from the stored card — never from the request body. See INTEGRATION.md. */
const { createHash } = crypto;   /* server.js already requires crypto */

class ContractError extends Error {
  constructor(code, message) { super(message); this.name = 'ContractError'; this.code = code; }
}
const fail = (code, message) => { throw new ContractError(code, message); };
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const answers = new Set(['yes', 'not yet', 'not applicable']);
const phaseFields = Object.freeze({
  delivery: new Set(['delivered', 'in_position', 'installed', 'levelled', 'stairs']),
  demob: new Set(['ready_for_collection', 'dismantled', 'stairs_removed', 'collected'])
});

function shape(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    fail('shape', `${label} must be a plain object`);
  const own = Reflect.ownKeys(value);
  if (own.length > keys.length) fail('shape', `${label} has too many fields`);
  for (const key of own) {
    if (typeof key !== 'string' || forbidden.has(key) || !keys.includes(key))
      fail('shape', `${label} contains an unsupported field`);
    if (!('value' in Object.getOwnPropertyDescriptor(value, key)))
      fail('shape', `${label} cannot contain getters or setters`);
  }
  return value;
}
function text(value, max, label, blank = false) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))
    fail('value', `${label} must be text of at most ${max} characters`);
  const out = value.trim();
  if (!blank && !out) fail('value', `${label} is required`);
  if (/data\s*:/i.test(out)) fail('inline_data', `${label} cannot contain a data URI`);
  return out;
}
function identifier(value, max, label, pattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/) {
  const out = text(value, max, label);
  if (!pattern.test(out) || forbidden.has(out.toLowerCase())) fail('value', `${label} is not a valid identifier`);
  return out;
}
function list(value, max, label, allowEmpty = false) {
  if (!Array.isArray(value) || value.length > max || (!allowEmpty && !value.length))
    fail('shape', `${label} needs ${allowEmpty ? 'zero' : 'one'} to ${max} entries`);
  // JSON arrays are dense. Reject sparse arrays and extra properties in direct calls too.
  if (Reflect.ownKeys(value).length !== value.length + 1)
    fail('shape', `${label} must be a dense array`);
  for (let i = 0; i < value.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !('value' in descriptor)) fail('shape', `${label} must be a dense data array`);
  }
  return value;
}
function target(value) {
  shape(value, ['assetKey', 'unitKey'], 'target');
  const assetKey = identifier(value.assetKey, 12, 'asset reference', /^[A-Z0-9?_.-]{1,12}$/);
  // null explicitly means reference-level; omitted or blank unit is not silently inferred.
  if (!Object.hasOwn(value, 'unitKey')) fail('target', 'target must include unitKey (null for reference-level)');
  const unitKey = value.unitKey === null ? null : identifier(value.unitKey, 64, 'unit key');
  return { assetKey, unitKey };
}
const targetId = value => JSON.stringify([value.assetKey, value.unitKey]);

/** Commas, semicolons and line breaks separate people; spaces format ONE number. */
function prepareRecipients(input) {
  const raw = text(input, 4000, 'recipients');
  const chunks = raw.split(/[,;\r\n]+/).map(x => x.trim()).filter(Boolean);
  list(chunks, 40, 'recipients');
  const numbers = [], seen = new Set();
  for (const given of chunks) {
    if (given.length > 64 || !/^\+?[\d ()-]+$/.test(given))
      fail('recipient', 'Use a mobile number; separate recipients with a comma, semicolon or new line');
    // Never concatenate two whitespace-separated complete numbers into a recipient.
    const wholeNumbers = given.match(/(?:\+?614\d{8}|04\d{8}|4\d{8})(?=\s|$)/g) || [];
    if (wholeNumbers.length > 1) fail('recipient', 'Separate recipients with a comma, semicolon or new line');
    const compact = given.replace(/[ ()-]/g, '');
    let e164;
    if (/^04\d{8}$/.test(compact)) e164 = '+61' + compact.slice(1);
    else if (/^\+614\d{8}$/.test(compact)) e164 = compact;
    else if (/^614\d{8}$/.test(compact)) e164 = '+' + compact;
    else if (/^4\d{8}$/.test(compact)) e164 = '+61' + compact;
    else if (/^\+[1-9]\d{7,14}$/.test(compact) && !/^\+61/.test(compact)) e164 = compact;
    else fail('recipient', 'Use 04xx xxx xxx or a full international number; separate recipients with punctuation');
    if (!seen.has(e164)) { seen.add(e164); numbers.push(e164); }
  }
  return { numbers, supplied: chunks.length, duplicatesRemoved: chunks.length - numbers.length };
}

/** The caller is responsible for the provenance of this object; no flag can prove trust. */
function validateServerGrant(raw, now) {
  if (!Number.isSafeInteger(now) || now < 0 || now > 253402300799999) fail('clock', 'The wrapper must supply its current server time');
  shape(raw, ['cardId', 'mode', 'allowedKeys', 'expiresAt', 'revokedAt', 'createdBy'], 'server grant');
  const cardId = identifier(raw.cardId, 64, 'card ID');
  if (typeof raw.mode !== 'string' || !Object.hasOwn(phaseFields, raw.mode)) fail('phase', 'Card mode must be delivery or demob');
  if (!Number.isSafeInteger(raw.expiresAt) || raw.expiresAt <= 0 || raw.expiresAt > 253402300799999) fail('grant', 'Card needs an absolute expiry in epoch milliseconds');
  if (!Object.hasOwn(raw, 'revokedAt') || (raw.revokedAt !== null && !Number.isSafeInteger(raw.revokedAt)))
    fail('grant', 'Card needs a server revocation value');
  if (raw.revokedAt !== null) fail('revoked', 'This card has been withdrawn');
  if (now >= raw.expiresAt) fail('expired', 'This card has expired');
  // Existing cards retain a typed editor name, not an authenticated account ID.
  const createdBy = text(raw.createdBy, 80, 'card creator attribution');
  const allowedKeys = list(raw.allowedKeys, 40, 'allowed targets').map(target);
  if (new Set(allowedKeys.map(targetId)).size !== allowedKeys.length) fail('grant', 'Card targets must be unique');
  return { cardId, mode: raw.mode, allowedKeys, expiresAt: raw.expiresAt, revokedAt: null, createdBy };
}
function numeric(value, low, high, label, unknown = false) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    if (unknown) return null;
    fail('pin', `${label} is required; blank is not zero`);
  }
  if (!['number', 'string'].includes(typeof value) ||
      (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())))
    fail('pin', `${label} must be a finite number`);
  const out = Number(value);
  if (!Number.isFinite(out) || out < low || out > high) fail('pin', `${label} is outside its valid range`);
  return Object.is(out, -0) ? 0 : out;
}
function pin(value) {
  shape(value, ['lat', 'lon', 'accuracy_m', 'how'], 'pin');
  if (!['from the phone', 'placed by hand'].includes(value.how)) fail('pin', 'State whether the pin came from the phone or was placed by hand');
  const accuracy = numeric(value.accuracy_m, 0, 100000, 'accuracy', true);
  if (accuracy === 0) fail('pin', 'Measurement accuracy must be positive or unknown, never an exact zero');
  if (value.how === 'placed by hand' && accuracy !== null) fail('pin', 'A hand-placed pin has unknown measurement accuracy');
  return { lat: numeric(value.lat, -90, 90, 'latitude'), lon: numeric(value.lon, -180, 180, 'longitude'), accuracy_m: accuracy, how: value.how };
}

/** One submission targets exactly one allowed reference/unit pair. No apply-to-all. */
function prepareReport(body, { grant: rawGrant, now, fileLookup, canUseFile } = {}) {
  const grant = validateServerGrant(rawGrant, now);
  shape(body, ['submissionId', 'phase', 'target', 'fields', 'photoIds', 'pin', 'note', 'nameGiven'], 'report');
  const submissionId = identifier(body.submissionId, 64, 'submission ID');
  if (body.phase !== grant.mode) fail('phase', 'Report phase does not match its card');
  let selected;
  if (Object.hasOwn(body, 'target')) selected = target(body.target);
  else if (grant.allowedKeys.length === 1) selected = { ...grant.allowedKeys[0] };
  else fail('target', 'Select the individual reference and unit this report is about');
  if (!grant.allowedKeys.some(x => targetId(x) === targetId(selected))) fail('scope', 'That reference/unit is outside this card');
  const changes = {}, fingerprints = [];
  if (Object.hasOwn(body, 'fields')) {
    shape(body.fields, [...phaseFields[grant.mode]], 'status fields');
    const fields = {};
    for (const key of Object.keys(body.fields).sort()) {
      if (!answers.has(body.fields[key])) fail('answer', `${key} must be yes, not yet or not applicable`);
      fields[key] = body.fields[key];
    }
    if (Object.keys(fields).length) changes.fields = fields;
  }
  if (Object.hasOwn(body, 'photoIds')) {
    const ids = list(body.photoIds, 6, 'photo IDs').map(x => identifier(x, 96, 'photo file ID'));
    if (new Set(ids).size !== ids.length) fail('photo', 'A photo file ID should appear once');
    if (typeof fileLookup !== 'function' || typeof canUseFile !== 'function') fail('photo', 'Photo lookup and authorisation callbacks are required');
    for (const id of ids.sort()) {
      const file = fileLookup(id);
      if (!file || file.id !== id || file.deleted === true || file.ready !== true ||
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.mime) ||
          typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(file.sha256))
        fail('photo', 'Photo must be an existing ready image with its server-computed SHA-256');
      if (canUseFile(file, { cardId: grant.cardId, phase: grant.mode, target: { ...selected } }) !== true)
        fail('scope', 'Photo is not available to this card and target');
      fingerprints.push({ id, sha256: file.sha256.toLowerCase() });
    }
    changes.photoIds = ids;
  }
  if (Object.hasOwn(body, 'pin')) changes.pin = pin(body.pin);
  if (Object.hasOwn(body, 'note')) {
    const note = text(body.note, 1200, 'note', true);
    if (note) changes.note = note;
  }
  if (!Object.keys(changes).length) fail('empty', 'Report needs an answer, photo, location or note');
  const nameGiven = body.nameGiven == null ? null : text(body.nameGiven, 80, 'reported name', true) || null;
  const event = {
    schema: 'gc500.scoped-report.v1', submissionId, cardId: grant.cardId, phase: grant.mode,
    target: selected, changes, actor: { nameGiven, verified: false },
    provenance: { source: 'reported on the drop card', cardCreatedBy: grant.createdBy },
    receivedAt: new Date(now).toISOString()
  };
  // Receipt time and the retry ID do not change content. Photo bytes do.
  const content = { ...event, photoContent: fingerprints };
  delete content.receivedAt;
  delete content.submissionId;
  return { event, fingerprint: canonicalFingerprint(content) };
}

/** Stable across object key order; arrays retain order. Hash is not authentication. */
function canonicalFingerprint(value) {
  let nodes = 0;
  const canonical = (v, depth = 0) => {
    if (++nodes > 2000 || depth > 12) fail('fingerprint', 'Content is too large or deeply nested');
    if (v === null || typeof v === 'boolean') return JSON.stringify(v);
    if (typeof v === 'string') {
      if (v.length > 8192) fail('fingerprint', 'Text is too long');
      return JSON.stringify(v);
    }
    if (typeof v === 'number' && Number.isFinite(v)) return JSON.stringify(v);
    if (Array.isArray(v)) {
      list(v, 100, 'fingerprint array', true);
      return '[' + v.map(x => canonical(x, depth + 1)).join(',') + ']';
    }
    if (!v || typeof v !== 'object') fail('fingerprint', 'Content must be finite JSON');
    const keys = Object.keys(v);
    if (keys.length > 100) fail('fingerprint', 'Object is too large');
    shape(v, keys, 'fingerprint object');
    return '{' + keys.sort().map(k => JSON.stringify(k) + ':' + canonical(v[k], depth + 1)).join(',') + '}';
  };
  return createHash('sha256').update(canonical(value)).digest('hex');
}

/** Persist this pair atomically with the event; changed content requires a fresh ID. */
function retryDecision(previousFingerprint, candidateFingerprint) {
  for (const value of [previousFingerprint, candidateFingerprint]) {
    if (value !== null && (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)))
      fail('fingerprint', 'Expected a SHA-256 fingerprint');
  }
  if (candidateFingerprint === null) fail('fingerprint', 'A candidate fingerprint is required');
  if (previousFingerprint === null) return 'create';
  return previousFingerprint === candidateFingerprint ? 'already_saved' : 'conflict';
}

/* The grant, built from the card this service stored, and from nothing the caller sent.
   The expiry is the existing Queensland-day rule turned into an absolute moment so the contract can compare
   it: a card whose last day is D stops working when D ends in Brisbane, which is D+1 00:00 at UTC+10. That is
   the same instant cardExpired() already enforces; it is only written differently. */
function cardGrant(token, c, phase) {
  const end = c.expires ? Date.parse(c.expires + 'T00:00:00+10:00') + 86400000 : null;
  return {
    /* The contract requires an identifier that STARTS with a letter or digit. A card token is
       randomBytes(24).toString('base64url'), and base64url's alphabet includes - and _, so about one token in
       thirty begins with a character it refuses — which would have made roughly three cards in a hundred
       silently unanswerable, and only in production, and only sometimes. Found by a test whose card token
       happened to start with one. The constant 'c' makes it always valid and stays one-to-one with the token,
       which remains the key everything is actually stored under. */
    cardId: 'c' + token,
    mode: phase,
    /* The targets this card was issued for, as the editor chose them and this service stored them.
       A card made before targets existed carries only references, so it authorises those references at
       reference level (unitKey null) and nothing finer — which is honest: a card that never named a unit
       cannot be used to report on one. */
    allowedKeys: (Array.isArray(c.targets) && c.targets.length)
      ? c.targets.map(x => ({ assetKey: x.assetKey, unitKey: x.unitKey === undefined ? null : x.unitKey }))
      : (Array.isArray(c.keys) ? c.keys : []).map(k => ({ assetKey: k, unitKey: null })),
    expiresAt: Number.isFinite(end) ? end : null,
    revokedAt: null,                 /* a withdrawn card is deleted outright, so a live card is not revoked */
    createdBy: c.by || null          /* a typed name the service captured, NOT a verified identity */
  };
}

function cleanReport(body, card) {
  const now = new Date().toISOString();
  const fields = {};
  for (const k of Object.keys(body.fields || {})) {
    if (!REPORT_FIELDS.has(k)) continue;
    const v = String((body.fields || {})[k] || '').trim().toLowerCase();
    if (REPORT_ANSWERS.has(v)) fields[k] = v;          // anything else is not an answer, so it is not stored
  }
  const photos = (Array.isArray(body.photos) ? body.photos : []).slice(0, 6)
    .map(x => (typeof x === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x) ? x : null))
    .filter(Boolean);
  let pin = null;
  if (body.pin && typeof body.pin === 'object') {
    const lat = num(body.pin.lat, -90, 90), lon = num(body.pin.lon, -180, 180);
    if (lat !== null && lon !== null) {
      pin = { lat, lon, accuracy_m: num(body.pin.accuracy_m, 0, 100000),
              how: body.pin.how === 'placed by hand' ? 'placed by hand' : 'from the phone',
              at: now };
    }
  }
  return {
    id: String(body.id || '').slice(0, 64) || crypto.randomBytes(9).toString('base64url'),
    token: card.token, load: card.load || null, keys: (card.keys || []).slice(0, 40),
    /* the name is what they typed. It identifies who the report SAYS it is from and verifies nobody. */
    name_given: String(body.name || '').trim().slice(0, 80) || null,
    fields, note: String(body.note || '').trim().slice(0, 1200) || null,
    photos, pin, at: now,
    source: 'reported on the drop card', verified: false,
  };
}

// ---------------------------------------------------------------- the record
let state = { version: 0, updated: null, docs: {} };
try { state = Object.assign(state, JSON.parse(fs.readFileSync(FILES.records, 'utf8'))); } catch (e) { /* first run */ }
let writeTimer = null;
/* v5.58 — THE DISK IS EITHER TAKING WRITES OR IT IS NOT, AND THE PAGE IS TOLD WHICH. The record's save is
   debounced 150 ms after the answer goes back, which is what keeps a room full of phones from writing the file
   a hundred times a second — but it meant a failed write was a line in the log and nothing else, and the page
   kept getting "saved" for changes that would vanish at the next restart (the 19 Sep 2026 audit). The debounce
   stays; what changes is that a failed write puts the service into a state where every further write is
   refused with 507 and the reason, until a write lands again. A page that gets a 507 keeps the change in its
   queue and says the truth on its footer, which is what the queue is for. Nothing is acknowledged into a hole. */
let diskFault = null;      // the last write error, or null while the disk is taking writes
function persist() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    const tmp = FILES.records + '.tmp';
    fs.writeFile(tmp, JSON.stringify(state), err => {
      if (err) { diskFault = err; console.error('persist', err); logWrite({ at: new Date().toISOString(), what: 'RECORD NOT SAVED', error: err.message }); return; }
      fs.rename(tmp, FILES.records, e2 => {
        if (e2) { diskFault = e2; console.error('persist rename', e2); logWrite({ at: new Date().toISOString(), what: 'RECORD NOT SAVED', error: e2.message }); return; }
        if (diskFault) logWrite({ at: new Date().toISOString(), what: 'record saving again', after: diskFault.message });
        diskFault = null;
      });
    });
  }, 150);
}
function snapshot() {
  const stamp = new Date().toISOString().slice(0, 13).replace(/[-T:]/g, '');
  const f = path.join(DATA_DIR, 'snapshots', 'records-' + stamp + '.json');
  if (fs.existsSync(f)) return;
  try {
    fs.writeFileSync(f, JSON.stringify(state));
    const all = fs.readdirSync(path.join(DATA_DIR, 'snapshots')).filter(n => n.startsWith('records-')).sort();
    all.slice(0, Math.max(0, all.length - KEEP_SNAPSHOTS)).forEach(n => fs.unlinkSync(path.join(DATA_DIR, 'snapshots', n)));
  } catch (e) { console.error('snapshot', e); }
}
setInterval(snapshot, 60 * 60 * 1000).unref();
function logWrite(line) { fs.appendFile(FILES.log, JSON.stringify(line) + '\n', () => {}); }

const SEG = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
function setDoc(coll, id, body, who) {
  if (!SEG.test(coll) || !SEG.test(id) || id === '.' || id === '..') return false;
  state.docs[coll] = state.docs[coll] || {};
  state.docs[coll][id] = body;
  state.version += 1; state.updated = new Date().toISOString();
  logWrite({ at: state.updated, v: state.version, op: 'set', coll, id, by: (body && (body.by || body.done_by || body.recorded_by || body.date_by)) || null, who });
  persist();
  return true;
}
function deleteDoc(coll, id, who) {
  if (!SEG.test(coll) || !SEG.test(id)) return false;
  if (state.docs[coll]) delete state.docs[coll][id];
  state.version += 1; state.updated = new Date().toISOString();
  logWrite({ at: state.updated, v: state.version, op: 'delete', coll, id, who });
  persist();
  return true;
}

// ---------------------------------------------------------------- helpers
function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function level(req, url) {
  const t = req.headers['x-gc500-token'] || url.searchParams.get('t') || '';
  if (t && same(t, EDIT_TOKEN)) return 'edit';
  if (t && same(t, VIEW_TOKEN)) return 'view';
  return null;
}
function send(res, code, body, headers) {
  const h = Object.assign({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }, headers || {});
  if (typeof body === 'object' && !Buffer.isBuffer(body)) { body = JSON.stringify(body); h['Content-Type'] = 'application/json; charset=utf-8'; }
  res.writeHead(code, h); res.end(body);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---------------------------------------------------------------- the app file
function appMeta() { try { return JSON.parse(fs.readFileSync(FILES.meta, 'utf8')); } catch (e) { return null; } }
function serveApp(req, res) {
  if (!fs.existsSync(FILES.app)) return send(res, 503, page('Not ready', '<p>The app has not been uploaded yet. The owner uploads it on the admin page.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
  const meta = appMeta() || {};
  const h = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ETag: meta.etag || '' , 'X-Frame-Options': 'SAMEORIGIN' };
  if (meta.etag && req.headers['if-none-match'] === meta.etag) { res.writeHead(304, h); return res.end(); }
  if (/\bgzip\b/.test(req.headers['accept-encoding'] || '') && fs.existsSync(FILES.appgz)) {
    h['Content-Encoding'] = 'gzip'; h['Vary'] = 'Accept-Encoding';
    res.writeHead(200, h); return fs.createReadStream(FILES.appgz).pipe(res);
  }
  res.writeHead(200, h); fs.createReadStream(FILES.app).pipe(res);
}
async function uploadApp(req, res) {
  let buf;
  try { buf = await readBody(req, MAX_APP); } catch (e) { return send(res, 413, { error: 'too large' }); }
  const text = buf.toString('utf8');
  if (!/GC500/.test(text.slice(0, 5000)) || !/<\/html>\s*$/.test(text.slice(-200))) return send(res, 400, { error: 'that does not look like the GC500 page (a whole HTML document is expected)' });
  const mediaError = hostedMediaGate(text);
  if (mediaError) return send(res, 409, { error: mediaError });
  const etag = '"' + crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16) + '"';
  const ver = (text.match(/'build_version':\s*'([^']+)'/) || text.match(/"build_version":"([^"]+)"/) || [])[1] || null;
  const built = (text.match(/"built":"(\d{4}-\d{2}-\d{2})"/) || [])[1] || null;
  /* the references and the branches the page carries in its head — what a photo or an invoice can be filed
     against. Written by the build from the schedule and branches.json; read here, never typed here. */
  const unesc = s => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const refs = unesc((text.match(/<meta name="gc500-refs" content="([^"]*)"/) || [])[1] || '').split(/\s+/).filter(r => r && REF_RE.test(r));
  const branches = unesc((text.match(/<meta name="gc500-branches" content="([^"]*)"/) || [])[1] || '').split(';').map(s => s.trim()).filter(Boolean)
    .map(s => { const i = s.indexOf('='); return i > 0 ? { code: s.slice(0, i).trim().toUpperCase(), name: s.slice(i + 1).trim() || null } : { code: s.toUpperCase(), name: null }; })
    .filter(b => BRANCH_RE.test(b.code));
  fs.writeFileSync(FILES.app + '.tmp', buf); fs.renameSync(FILES.app + '.tmp', FILES.app);
  fs.writeFileSync(FILES.appgz + '.tmp', zlib.gzipSync(buf, { level: 6 })); fs.renameSync(FILES.appgz + '.tmp', FILES.appgz);
  const meta = { etag, bytes: buf.length, uploaded: new Date().toISOString(), build_version: ver, built, refs, branches };
  fs.writeFileSync(FILES.meta, JSON.stringify(meta));
  logWrite({ at: meta.uploaded, op: 'upload-app', bytes: buf.length, build_version: ver });
  return send(res, 200, meta);
}

// ---------------------------------------------------------------- the document library
// One folder of files and one index. The id is the file name with anything outside [A-Za-z0-9._-] replaced by _,
// the same rule the build uses, so a plate the build lists matches the plate the owner uploads by name alone.
// Uploading a file under an existing id replaces it — that is how a new build of a plate goes out.
let files = {};
try { files = JSON.parse(fs.readFileSync(FILES.files, 'utf8')) || {}; } catch (e) { /* none yet */ }
function persistFiles() {
  const tmp = FILES.files + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(files)); fs.renameSync(tmp, FILES.files);
}
const FILE_ID = /^[A-Za-z0-9._-]{1,200}$/;
const FILE_KINDS = new Set(['swms', 'transport', 'map', 'pack', 'drop-photo', 'photo', 'docket', 'invoice', 'other']);
/* WHAT A FILE IS FILED AGAINST. Andrew Fisher, 16 Sep 2026: "In the admin can we not have Upload here for pics
   that get assigned to locations. At the moment its other." and "Eventually we will have invoices too. STPS
   Invoices KINP Invoices MEAD Invoices NVAC Invoices. Rather we sort this now."
   A photograph is filed against a REFERENCE — P09, WC16, the thing on the schedule it is a picture of — and an
   invoice against a BRANCH, the four Coates branch codes that get the revenue. Both lists come from the uploaded
   page, which built them from the schedule and sources/team/branches.json: one place, read on every app upload,
   so this service never keeps a copy of its own to fall out of date. Before any page is uploaded the four codes
   he named stand in; the page's list replaces them the moment it lands. */
const REF_RE = /^[A-Z0-9?_.-]{1,12}$/;
const BRANCH_RE = /^[A-Z]{2,6}$/;
const BRANCHES_BEFORE_ANY_UPLOAD = ['STPS', 'KINP', 'NVAC', 'MEAD'];
function appRefs() {
  const m = appMeta();
  const base = m && Array.isArray(m.refs) && m.refs.length ? m.refs : null;
  if (!base) return null;
  /* plus anything a person has added in the page since the build — the record's `added` collection carries
     each one's key, and a photograph of a thing added by hand is as real as one of a thing on the schedule */
  const added = Object.values((state.docs && state.docs.added) || {}).map(d => d && String(d.key || '').trim().toUpperCase()).filter(k => k && REF_RE.test(k) && !base.includes(k));
  return added.length ? base.concat([...new Set(added)]) : base;
}
function appBranches() {
  const m = appMeta();
  return m && Array.isArray(m.branches) && m.branches.length ? m.branches : BRANCHES_BEFORE_ANY_UPLOAD.map(code => ({ code, name: null }));
}
/* the fields a kind carries, checked the same way on upload and on re-file: a photo needs its reference, an
   invoice needs its branch and may carry an invoice number and a reference; anything else carries none */
function filing(req, kind) {
  const out = { ref: null, branch: null, invoice_no: null };
  const ref = hdr(req, 'x-file-ref').trim().toUpperCase();
  /* a map may be filed against a reference as well (attach a map, 17 Sep 2026) — offered, never required */
  if (kind === 'photo' || ((kind === 'invoice' || kind === 'map') && ref)) {
    if (!ref) return { error: 'a photograph filed as "Photo of a location" needs the reference it is a picture of (x-file-ref): P09, WC16, GN01 …' };
    if (!REF_RE.test(ref)) return { error: '"' + ref + '" is not a reference this service can file under' };
    const refs = appRefs();
    if (refs && !refs.includes(ref)) return { error: ref + ' is not a reference on the uploaded page, which lists ' + refs.length + ' — the Location box on the admin page offers every one of them' };
    out.ref = ref;
  }
  if (kind === 'invoice') {
    const br = hdr(req, 'x-file-branch').trim().toUpperCase();
    const known = appBranches().map(b => b.code);
    if (!br) return { error: 'an invoice needs the branch it is filed against (x-file-branch): ' + known.join(', ') };
    if (!BRANCH_RE.test(br) || !known.includes(br)) return { error: '"' + br + '" is not a branch this event draws on. The branches are ' + known.join(', ') };
    out.branch = br;
    out.invoice_no = hdr(req, 'x-file-invoice').trim().slice(0, 60) || null;
  }
  return out;
}
const KIND_WORDS = { swms: 'SWMS', transport: 'Transport & lifting', map: 'Map / drawing / plate', pack: 'Pack / report', 'drop-photo': 'Drop photograph (taken in the page)',
  photo: 'Photo of a location', docket: 'Fencing docket', invoice: 'Invoice', other: 'Other' };
function kindWords(f) {
  return (KIND_WORDS[f.kind] || f.kind) + (f.branch ? ' · ' + f.branch : '') + (f.invoice_no ? ' · no. ' + f.invoice_no : '') + (f.ref ? ' · ' + f.ref : '');
}
const TYPES = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv; charset=utf-8', txt: 'text/plain; charset=utf-8' };
const INLINE = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt']);
function fileId(name) { return String(name || '').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/\.{2,}/g, '.').replace(/^\.+/, ''); }
function extOf(name) { return (String(name).split('.').pop() || '').toLowerCase(); }
function hdr(req, name) { try { return decodeURIComponent(String(req.headers[name] || '')); } catch (e) { return String(req.headers[name] || ''); } }
function listFiles() { return { files: Object.values(files).sort((a, b) => String(a.uploaded).localeCompare(String(b.uploaded))) }; }
function uploadFile(req, res) {
  const name = hdr(req, 'x-file-name').slice(0, 200);
  const id = fileId(name), ext = extOf(name);
  if (!name || !FILE_ID.test(id) || id === '.' || id === '..') return send(res, 400, { error: 'a file name is needed (x-file-name)' });
  /* A REFUSAL SHOULD SAY WHERE THE FILE ACTUALLY GOES. Andrew Fisher, 15 Sep 2026, on the deploy that would not
     come up: "i tried uploading the json file in there. As i thought that file goes in there." The record JSON is
     the one file on this page with a Download and no Upload beside it, so assuming this form was its way back in
     is the obvious read. It is not: the record comes back through Import inside the page, or through the build. */
  if (ext === 'json') return send(res, 415, { error: 'the record JSON does not go here. This form is for documents — SWMS, drawings, plates, packs, dockets. The record goes back in through Tools → Import inside the page (edit link), or into the build as sources/ops/as_supplied.json. Nothing you upload here ever changes the record.' });
  if (!TYPES[ext]) return send(res, 415, { error: 'only PDF, JPG, PNG, WebP, DOCX, XLSX, CSV and TXT files are kept' });
  const kind = FILE_KINDS.has(hdr(req, 'x-file-kind')) ? hdr(req, 'x-file-kind') : 'other';
  /* checked before a byte is read: a photo without its reference, or an invoice without its branch, is refused
     here and nothing lands on the volume for somebody to find later with no card to say what it is */
  const fl = filing(req, kind);
  if (fl.error) return send(res, 400, { error: fl.error });
  const title = hdr(req, 'x-file-title').slice(0, 140).trim() || null, note = hdr(req, 'x-file-note').slice(0, 300).trim() || null;
  const who = hdr(req, 'x-gc500-who').slice(0, 80) || null;
  const dest = path.join(FILES.filesDir, id), tmp = dest + '.part';
  const hash = crypto.createHash('sha256');
  let n = 0;
  // streamed to disk with back-pressure; the size cap and the hash ride in one transform
  const counter = new Transform({ transform(c, enc, cb) { n += c.length; if (n > MAX_FILE) return cb(new Error('too large')); hash.update(c); cb(null, c); } });
  pipeline(req, counter, fs.createWriteStream(tmp), err => {
    if (err) {
      try { fs.unlinkSync(tmp); } catch (e) { /* nothing written */ }
      if (!res.headersSent) send(res, err.message === 'too large' ? 413 : 400, { error: err.message === 'too large' ? 'too large (over ' + (MAX_FILE / 1e6) + ' MB)' : 'upload interrupted' });
      return;
    }
    if (!n) { try { fs.unlinkSync(tmp); } catch (e) {} return send(res, 400, { error: 'the file is empty' }); }
    fs.renameSync(tmp, dest);
    const replaced = !!files[id];
    files[id] = { id, name, kind, ref: fl.ref, branch: fl.branch, invoice_no: fl.invoice_no, title, note, bytes: n, sha256: hash.digest('hex'), type: TYPES[ext], uploaded: new Date().toISOString(), by: who };
    persistFiles();
    logWrite({ at: files[id].uploaded, op: replaced ? 'replace-file' : 'upload-file', id, kind, ref: fl.ref, branch: fl.branch, invoice_no: fl.invoice_no, bytes: n, who });
    send(res, 200, files[id]);
  });
}
/* the card, changed in place: the bytes, the name, the hash and the upload time all stay as they were, so this
   can never be mistaken for a new upload of a different document. The kind, and what it is filed against — the
   reference of a photo, the branch and number of an invoice — are what change, and the card keeps what it was. */
function refileFile(req, res, id, who) {
  if (!files[id]) return send(res, 404, { error: 'no such file' });
  const kind = hdr(req, 'x-file-kind');
  if (!FILE_KINDS.has(kind)) return send(res, 400, { error: 'not a kind this service files under: ' + [...FILE_KINDS].join(', ') });
  const fl = filing(req, kind);
  if (fl.error) return send(res, 400, { error: fl.error });
  const f = files[id];
  const was = { kind: f.kind, ref: f.ref || null, branch: f.branch || null, invoice_no: f.invoice_no || null };
  if (was.kind === kind && was.ref === fl.ref && was.branch === fl.branch && was.invoice_no === fl.invoice_no) return send(res, 200, f);
  files[id] = Object.assign({}, f, { kind, ref: fl.ref, branch: fl.branch, invoice_no: fl.invoice_no,
    refiled: { at: new Date().toISOString(), from: was.kind, was, by: who || null } });
  persistFiles();
  logWrite({ at: files[id].refiled.at, op: 're-file', id, kind, ref: fl.ref, branch: fl.branch, invoice_no: fl.invoice_no, from: was.kind, was, who });
  return send(res, 200, files[id]);
}
function deleteFile(res, id, who) {
  if (!files[id]) return send(res, 404, { error: 'no such file' });
  try { fs.unlinkSync(path.join(FILES.filesDir, id)); } catch (e) { /* already gone */ }
  try { fs.unlinkSync(thumbnailPath(id)); } catch (e) { /* no derivative */ }
  delete files[id]; persistFiles();
  logWrite({ at: new Date().toISOString(), op: 'delete-file', id, who });
  return send(res, 200, { ok: true });
}
function serveFile(req, res, id) {
  const f = files[id];
  const fp = path.join(FILES.filesDir, id);
  if (!f || !fs.existsSync(fp)) return send(res, 404, page('Not found', '<p>That file is not on the service. It may not have been uploaded yet.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
  const size = fs.statSync(fp).size, ext = extOf(f.name);
  const etag = '"' + (f.sha256 || '').slice(0, 16) + '"';
  const h = { 'Content-Type': f.type || 'application/octet-stream', 'Cache-Control': 'private, max-age=3600', ETag: etag, 'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Content-Disposition': (INLINE.has(ext) ? 'inline' : 'attachment') + '; filename="' + f.name.replace(/["\\\r\n]/g, '_') + '"' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? parseInt(range[1], 10) : Math.max(0, size - parseInt(range[2], 10));
    let end = range[1] && range[2] ? Math.min(parseInt(range[2], 10), size - 1) : size - 1;
    if (isNaN(start) || isNaN(end) || start > end || start >= size) { res.writeHead(416, { 'Content-Range': 'bytes */' + size }); return res.end(); }
    h['Content-Range'] = 'bytes ' + start + '-' + end + '/' + size; h['Content-Length'] = end - start + 1;
    res.writeHead(206, h); return fs.createReadStream(fp, { start, end }).pipe(res);
  }
  h['Content-Length'] = size;
  res.writeHead(200, h);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(fp).pipe(res);
}


// v5.61: a thumbnail is a derivative, never an original in a smaller box.
function thumbnailPath(id) { return path.join(FILES.thumbsDir, id + '.webp'); }
function atomicBytes(file, bytes) {
  const tmp = file + '.tmp.' + crypto.randomBytes(8).toString('hex');
  let fd;
  try {
    fd = fs.openSync(tmp, 'wx'); fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); fs.closeSync(fd); fd = null;
    fs.renameSync(tmp, file);
    const dir = fs.openSync(path.dirname(file), 'r');
    try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
  } finally {
    if (fd != null) fs.closeSync(fd);
    try { fs.unlinkSync(tmp); } catch (e) { if (e.code !== 'ENOENT') console.error('temporary file cleanup', e.message); }
  }
}
/* Structural validation, not an image decoder: Canvas supplies static VP8/VP8L WebP.
   Chunk bounds, RIFF length, animation flags and dimensions are checked before disk. */
function validThumbnail(b) {
  if (b.length < 20 || b.length > MAX_THUMB || b.toString('ascii', 0, 4) !== 'RIFF' || b.readUInt32LE(4) !== b.length - 8 || b.toString('ascii', 8, 12) !== 'WEBP') return false;
  let at = 12, image = null, canvas = null;
  while (at < b.length) {
    if (at + 8 > b.length) return false;
    const type = b.toString('ascii', at, at + 4), n = b.readUInt32LE(at + 4), start = at + 8, end = start + n;
    if (end > b.length || end + (n & 1) > b.length) return false;
    if (type === 'ANIM' || type === 'ANMF') return false;
    if (type === 'VP8X') {
      if (canvas || at !== 12 || n !== 10 || (b[start] & 2)) return false;
      canvas = [1 + b.readUIntLE(start + 4, 3), 1 + b.readUIntLE(start + 7, 3)];
    } else if (type === 'VP8 ') {
      if (image || n < 10 || (b[start] & 1) || b[start + 3] !== 0x9d || b[start + 4] !== 1 || b[start + 5] !== 0x2a) return false;
      image = [b.readUInt16LE(start + 6) & 0x3fff, b.readUInt16LE(start + 8) & 0x3fff];
    } else if (type === 'VP8L') {
      if (image || n < 5 || b[start] !== 0x2f || (b[start + 4] & 0xe0)) return false;
      const bits = b.readUInt32LE(start + 1);
      image = [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    } else if (!['ALPH', 'ICCP', 'EXIF', 'XMP '].includes(type)) return false;
    at = end + (n & 1);
  }
  return !!image && image.every(n => n > 0 && n <= 480) && (!canvas || (canvas[0] === image[0] && canvas[1] === image[1]));
}
function readThumbnailBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0, large = false;
    req.on('data', c => { n += c.length; if (n > MAX_THUMB) { large = true; chunks.length = 0; } else if (!large) chunks.push(c); });
    req.on('end', () => large ? reject(new Error('too large')) : resolve(Buffer.concat(chunks)));
    req.on('error', reject); req.on('aborted', () => reject(new Error('interrupted')));
  });
}
async function uploadThumbnail(req, res, id) {
  if (!FILE_ID.test(id) || !files[id]) return send(res, 404, { error: 'no such file' });
  const originalHash = String(req.headers['x-file-sha256'] || '');
  if (!/^[a-f0-9]{64}$/.test(originalHash)) return send(res, 400, { error: 'x-file-sha256 must name the original used for this preview' });
  if (files[id].sha256 !== originalHash) return send(res, 409, { error: 'the original changed; make its preview again' });
  if (!/^image\//.test(files[id].type || '')) return send(res, 415, { error: 'only photographs have previews' });
  if (String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'image/webp') return send(res, 415, { error: 'a WebP preview is required' });
  if (Number(req.headers['content-length'] || 0) > MAX_THUMB) return send(res, 413, { error: 'preview is over 200 KiB' });
  let bytes;
  try { bytes = await readThumbnailBody(req); } catch (e) { return send(res, e.message === 'too large' ? 413 : 400, { error: e.message }); }
  if (!validThumbnail(bytes)) return send(res, 415, { error: 'preview must be a static WebP no larger than 480 pixels on either edge' });
  // Another request may have replaced/deleted the original while the body arrived.
  if (!files[id] || files[id].sha256 !== originalHash) return send(res, 409, { error: 'the original changed; make its preview again' });
  const old = files[id], dest = thumbnailPath(id);
  if (old.thumb === true && fs.existsSync(dest)) return send(res, 200, { id, thumb: true, already: true });
  try {
    atomicBytes(dest, bytes);
    files[id] = Object.assign({}, old, { thumb: true });
    atomicBytes(FILES.files, Buffer.from(JSON.stringify(files)));
  } catch (e) {
    files[id] = old;
    console.error('thumbnail save', e.message);
    return send(res, 507, { error: 'preview was not saved; the original is safe. Retry making missing thumbnails.' });
  }
  return send(res, 200, { id, thumb: true });
}
function serveThumbnail(req, res, id) {
  if (!FILE_ID.test(id) || !files[id] || files[id].thumb !== true || !fs.existsSync(thumbnailPath(id))) return send(res, 404, { error: 'preview not made yet' });
  const bytes = fs.readFileSync(thumbnailPath(id));
  const etag = '"' + crypto.createHash('sha256').update(bytes).digest('hex') + '"';
  const h = { 'Content-Type': 'image/webp', 'Content-Length': bytes.length, 'Cache-Control': 'private, max-age=3600', ETag: etag,
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Disposition': 'inline; filename="' + id + '.webp"' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
  res.writeHead(200, h); return res.end(req.method === 'HEAD' ? undefined : bytes);
}

// ---------------------------------------------------------------- hosted built-in media (v5.62)
// These content-addressed files are separate from the document library and never contain its originals.
const MEDIA_SCHEMA = 'gc500-media-v1', MAX_MEDIA = 32 * 1024 * 1024;
const MEDIA_TYPES = {webp:'image/webp',jpg:'image/jpeg',png:'image/png',gif:'image/gif',bmp:'image/bmp',svg:'image/svg+xml',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav',ogg:'audio/ogg',woff2:'font/woff2',woff:'font/woff'};
const MEDIA_NAME = /^([a-f0-9]{64})\.(webp|jpg|png|gif|bmp|svg|mp4|webm|mp3|m4a|wav|ogg|woff2|woff)$/;
const MEDIA_DIR = path.join(DATA_DIR, 'media'), MEDIA_INDEX = path.join(DATA_DIR, 'media.json');
fs.mkdirSync(MEDIA_DIR, {recursive:true});
let mediaIndex = {schema:MEDIA_SCHEMA, assets:{}, manifests:{}};
try { const saved = JSON.parse(fs.readFileSync(MEDIA_INDEX, 'utf8')); if (saved.schema === MEDIA_SCHEMA && saved.assets && saved.manifests) mediaIndex = saved; } catch (e) { /* no imported media yet */ }
function canonicalMedia(v) {
  if (Array.isArray(v)) return '[' + v.map(canonicalMedia).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonicalMedia(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function mediaInventory() {
  return {files:fs.readdirSync(MEDIA_DIR).filter(n => MEDIA_NAME.test(n)).map(file => ({file,bytes:fs.statSync(path.join(MEDIA_DIR,file)).size,sha256:sha256(fs.readFileSync(path.join(MEDIA_DIR,file)))})),
    assets:Object.values(mediaIndex.assets), manifests:Object.keys(mediaIndex.manifests)};
}
function readLimitedBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks=[]; let n=0,large=false;
    req.on('data', c=>{n+=c.length;if(n>limit){large=true;chunks.length=0;}else if(!large)chunks.push(c);});
    req.on('end',()=>large?reject(new Error('too large')):resolve(Buffer.concat(chunks)));
    req.on('error',reject);req.on('aborted',()=>reject(new Error('interrupted')));
  });
}
async function uploadMedia(req, res, file) {
  const parsed=MEDIA_NAME.exec(file); if(!parsed)return send(res,400,{error:'a content-addressed media filename is required'});
  const type=String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
  if(type!==MEDIA_TYPES[parsed[2]])return send(res,415,{error:'media type does not match its extension'});
  if(Number(req.headers['content-length']||0)>MAX_MEDIA)return send(res,413,{error:'media file is too large'});
  let bytes;try{bytes=await readLimitedBody(req,MAX_MEDIA);}catch(e){return send(res,e.message==='too large'?413:400,{error:e.message});}
  if(!bytes.length || sha256(bytes)!==parsed[1])return send(res,400,{error:'media bytes do not match the filename SHA-256'});
  const dest=path.join(MEDIA_DIR,file);let already=false;
  try {
    already=fs.existsSync(dest) && sha256(fs.readFileSync(dest))===parsed[1];
    if(!already)atomicBytes(dest,bytes);
  }catch(e){console.error('media save',e.message);return send(res,507,{error:'media was not saved; retry this file'});}
  return send(res,200,{file,bytes:bytes.length,sha256:parsed[1],already});
}
function validateManifest(input) {
  if(!input || input.schema!==MEDIA_SCHEMA || !Array.isArray(input.assets) || !input.assets.length || input.assets.length>2000 || !/^[a-f0-9]{64}$/.test(input.sha256||''))throw new Error('invalid media manifest');
  const names=new Set(), hashes=new Set();let previous='';
  const assets=input.assets.map(a=>{
    if(!a || Object.keys(a).sort().join(',')!=='bytes,file,scope,sha256,type')throw new Error('invalid media descriptor');
    const n=MEDIA_NAME.exec(a.file||'');
    if(!n || n[1]!==a.sha256 || MEDIA_TYPES[n[2]]!==a.type || !['view','edit'].includes(a.scope) || !Number.isSafeInteger(a.bytes) || a.bytes<1 || a.bytes>MAX_MEDIA)throw new Error('invalid media descriptor');
    if(names.has(a.file)||hashes.has(a.sha256)||a.file<previous)throw new Error('media entries must be unique and sorted by file');
    names.add(a.file);hashes.add(a.sha256);previous=a.file;
    return {file:a.file,sha256:a.sha256,type:a.type,bytes:a.bytes,scope:a.scope};
  });
  const digest=sha256(Buffer.from(canonicalMedia({schema:MEDIA_SCHEMA,assets})));
  if(digest!==input.sha256)throw new Error('manifest SHA-256 does not match');
  return {schema:MEDIA_SCHEMA,assets,sha256:digest};
}
function mediaComplete(assets) {
  for(const a of assets){
    const fp=path.join(MEDIA_DIR,a.file);
    if(!fs.existsSync(fp) || fs.statSync(fp).size!==a.bytes || sha256(fs.readFileSync(fp))!==a.sha256)return a.file;
  }
  return null;
}
async function registerMedia(req,res) {
  let input, manifest;
  try {input=JSON.parse((await readLimitedBody(req,1024*1024)).toString('utf8'));manifest=validateManifest(input);}
  catch(e){return send(res,e.message==='too large'?413:400,{error:e.message});}
  const missing=mediaComplete(manifest.assets);if(missing)return send(res,409,{error:'upload every media file before registering this manifest',file:missing});
  for(const a of manifest.assets){const old=mediaIndex.assets[a.file];if(old && canonicalMedia(old)!==canonicalMedia(a))return send(res,409,{error:'existing media metadata and permissions cannot be changed',file:a.file});}
  const next={schema:MEDIA_SCHEMA,assets:{...mediaIndex.assets},manifests:{...mediaIndex.manifests}};
  for(const a of manifest.assets)next.assets[a.file]=a;
  const already=!!next.manifests[manifest.sha256];next.manifests[manifest.sha256]=manifest.assets.map(a=>a.file);
  try{atomicBytes(MEDIA_INDEX,Buffer.from(JSON.stringify(next)));}catch(e){console.error('media index save',e.message);return send(res,507,{error:'media manifest was not registered; retry'});}
  mediaIndex=next;
  return send(res,200,{sha256:manifest.sha256,files:manifest.assets.length,already});
}
function hostedMediaGate(html) {
  // Only literal JSON is inspected. No uploaded JavaScript is ever executed on the service.
  const start=html.indexOf('const DATA = '); if(start<0)return html.includes('"hostedMedia"')?'linked media page has no literal DATA':null;
  let at=start+13,depth=0,quoted=false,escaped=false,end=-1;
  for(let i=at;i<html.length;i++){
    const c=html[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
    if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}' && --depth===0){end=i+1;break;}
  }
  let data;try{data=JSON.parse(html.slice(at,end));}catch(e){return html.includes('"hostedMedia"')?'linked media DATA is not valid JSON':null;}
  if(!data.hostedMedia)return null;
  const h=data.hostedMedia, known=mediaIndex.manifests[h.manifest];
  if(h.schema!==MEDIA_SCHEMA || !known || !data.media || typeof data.media!=='object')return 'import this hosted page media manifest before uploading the page';
  const items=Object.values(data.media);
  if(items.length!==known.length)return 'page and imported media manifest differ';
  for(const [key,item] of Object.entries(data.media)){
    if(!item || key!==item.sha256 || !known.includes(item.file) || canonicalMedia(item)!==canonicalMedia(mediaIndex.assets[item.file]))return 'page and imported media manifest differ';
  }
  const missing=mediaComplete(known.map(f=>mediaIndex.assets[f]));
  return missing?'hosted media is missing or damaged: '+missing:null;
}
function serveMedia(req,res,token,file) {
  const edit=same(token,EDIT_TOKEN), view=same(token,VIEW_TOKEN);
  if(!edit && !view)return send(res,401,{error:'a view or edit token is needed'});
  if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'GET or HEAD required'},{Allow:'GET, HEAD'});
  const a=mediaIndex.assets[file];
  if(!MEDIA_NAME.test(file)||!a || (!edit && a.scope!=='view'))return send(res,404,{error:'media not available'});
  const fp=path.join(MEDIA_DIR,file);if(!fs.existsSync(fp))return send(res,404,{error:'media not uploaded'});
  const size=fs.statSync(fp).size,etag='"'+a.sha256+'"';
  const headers={'Content-Type':a.type,'Cache-Control':'private, max-age=3600',ETag:etag,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Disposition':'inline; filename="'+file+'"'};
  if(req.headers['if-none-match']===etag){res.writeHead(304,headers);return res.end();}
  let start=0,end=size-1,status=200;
  if(req.headers.range && (!req.headers['if-range'] || req.headers['if-range']===etag)){
    const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(!m || (!m[1]&&!m[2]))return send(res,416,'',{'Content-Range':'bytes */'+size});
    start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));end=m[1]&&m[2]?Math.min(Number(m[2]),size-1):size-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size)return send(res,416,'',{'Content-Range':'bytes */'+size});
    headers['Content-Range']='bytes '+start+'-'+end+'/'+size;status=206;
  }
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);
  if(req.method==='HEAD')return res.end();
  const stream=fs.createReadStream(fp,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
}

// ---------------------------------------------------------------- the Coates Way machine (v5.77)
/* Andrew Fisher, 23 Sep 2026: the machine is part of the GC500, not a separate build, and the whole of it is to be
   reachable from the view page, with everything uploaded to Railway.

   So the machine — The Coates Way · V8 Connected: the cutaway car, its V8, the cog and its 128 parts, the original
   cog artwork, three.js and the sound — is built by build_all.py into print/out/machine/, imported on the admin
   page the way the media folder is, and served here at /w/<token>/<path> to the VIEW link and the edit link
   alike. It opens inside the page's own Coates Way tab; nothing of it sits on another site.

   IT IS A SET OF FILES WITH PATHS, NOT A BAG OF PICTURES. ES modules import one another by path
   (./engine-kinematics.js, ../../three.module.js), so paths are what is served. The bytes, though, are kept
   content-addressed under blobs/<sha256>, and a set goes live in ONE write — when its manifest is registered,
   after every blob it names is already here. A half-finished import can therefore never mix last week's
   car-app.js with this week's engine-kinematics.js in front of a viewer: until the register call, the old set
   is what is served; after it, the new one, whole. Blobs no set names any more are removed at that moment.

   Nothing here reads or writes the record. A manifest is validated the way the media one is: every path
   checked segment by segment (never empty, never starting with a dot, so never . or ..), every extension one
   of the types the machine is made of, every size within bounds, every hash a hash. */
const MACHINE_SCHEMA='gc500-machine-v1', MAX_MACHINE_FILE=48*1024*1024, MAX_MACHINE_TOTAL=192*1024*1024, MAX_MACHINE_FILES=600;
const MACHINE_DIR=path.join(DATA_DIR,'machine'), MACHINE_BLOBS=path.join(MACHINE_DIR,'blobs'), MACHINE_INDEX=path.join(DATA_DIR,'machine.json');
const MACHINE_TYPES={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',
  json:'application/json; charset=utf-8',csv:'text/csv; charset=utf-8',md:'text/plain; charset=utf-8',txt:'text/plain; charset=utf-8',
  glb:'model/gltf-binary',gltf:'model/gltf+json',bin:'application/octet-stream',hdr:'image/vnd.radiance',ktx2:'image/ktx2',
  png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',ico:'image/x-icon',
  mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',m4a:'audio/mp4',woff2:'font/woff2',woff:'font/woff',wasm:'application/wasm'};
const MACHINE_SEG=/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}$/;
fs.mkdirSync(MACHINE_BLOBS,{recursive:true});
let machineIndex={schema:MACHINE_SCHEMA,set:null};   // set: {version,label,built,entry,files:{path:{bytes,sha256,type}},sha256,registered}
try { const saved=JSON.parse(fs.readFileSync(MACHINE_INDEX,'utf8')); if(saved.schema===MACHINE_SCHEMA && (saved.set===null || (saved.set && saved.set.files)))machineIndex=saved; } catch(e) { /* no machine imported yet */ }
function machinePathOk(p){
  if(typeof p!=='string' || !p || p.length>400)return false;
  const segs=p.split('/'); if(segs.length>8)return false;
  for(const s of segs)if(!MACHINE_SEG.test(s))return false;
  return Object.prototype.hasOwnProperty.call(MACHINE_TYPES,extOf(p));
}
function machineBlobPath(sha){ return path.join(MACHINE_BLOBS,sha); }
function machineBlobs(){ try{return fs.readdirSync(MACHINE_BLOBS).filter(n=>/^[a-f0-9]{64}$/.test(n));}catch(e){return [];} }
function machineStatus(){
  const s=machineIndex.set;
  if(!s)return {ready:false};
  const files=Object.values(s.files);
  return {ready:true,version:s.version,label:s.label,built:s.built,entry:s.entry,files:files.length,bytes:files.reduce((a,f)=>a+f.bytes,0),registered:s.registered,sha256:s.sha256};
}
function machineInventory(){
  const have=new Set(machineBlobs());
  return {status:machineStatus(),blobs:[...have].map(sha=>({sha256:sha,bytes:fs.statSync(machineBlobPath(sha)).size}))};
}
/* One blob in: PUT /api/admin/machine/blob/<sha256>, the bytes as the body, their hash checked before the disk.
   A blob already here with the right hash is acknowledged, not rewritten. */
async function uploadMachineBlob(req,res,sha){
  if(!/^[a-f0-9]{64}$/.test(sha))return send(res,400,{error:'a machine file is uploaded under its SHA-256'});
  if(Number(req.headers['content-length']||0)>MAX_MACHINE_FILE)return send(res,413,{error:'machine file is too large'});
  let bytes;try{bytes=await readLimitedBody(req,MAX_MACHINE_FILE);}catch(e){return send(res,e.message==='too large'?413:400,{error:e.message});}
  if(!bytes.length || sha256(bytes)!==sha)return send(res,400,{error:'machine file bytes do not match their SHA-256'});
  const dest=machineBlobPath(sha);let already=false;
  try{ already=fs.existsSync(dest) && fs.statSync(dest).size===bytes.length && sha256(fs.readFileSync(dest))===sha; if(!already)atomicBytes(dest,bytes); }
  catch(e){console.error('machine save',e.message);return send(res,507,{error:'machine file was not saved; retry this file'});}
  return send(res,200,{sha256:sha,bytes:bytes.length,already});
}
function validateMachineManifest(input){
  if(!input || input.schema!==MACHINE_SCHEMA || !Array.isArray(input.files) || !input.files.length || input.files.length>MAX_MACHINE_FILES)throw new Error('invalid machine manifest');
  if(typeof input.entry!=='string' || !machinePathOk(input.entry) || extOf(input.entry)!=='html')throw new Error('a machine manifest names an html entry');
  if(!/^[a-f0-9]{64}$/.test(input.sha256||''))throw new Error('invalid machine manifest');
  const label=typeof input.label==='string'?input.label.slice(0,120):'The Coates Way machine';
  const version=typeof input.version==='string'&&/^[A-Za-z0-9._-]{1,40}$/.test(input.version)?input.version:input.sha256.slice(0,12);
  const built=typeof input.built==='string'&&/^\d{4}-\d{2}-\d{2}(T[0-9:.]+Z)?$/.test(input.built)?input.built:null;
  const files={};let previous='',total=0;
  for(const f of input.files){
    if(!f || Object.keys(f).sort().join(',')!=='bytes,path,sha256,type')throw new Error('invalid machine file descriptor');
    if(!machinePathOk(f.path) || f.path<=previous)throw new Error('machine files must be valid paths, unique and sorted');
    if(!/^[a-f0-9]{64}$/.test(f.sha256||'') || !Number.isSafeInteger(f.bytes) || f.bytes<1 || f.bytes>MAX_MACHINE_FILE)throw new Error('invalid machine file descriptor');
    if(f.type!==MACHINE_TYPES[extOf(f.path)])throw new Error('machine file type does not match its extension: '+f.path);
    total+=f.bytes;if(total>MAX_MACHINE_TOTAL)throw new Error('the machine is larger than this service keeps');
    files[f.path]={bytes:f.bytes,sha256:f.sha256,type:f.type};previous=f.path;
  }
  if(!files[input.entry])throw new Error('the machine manifest does not carry its own entry');
  const digest=sha256(Buffer.from(canonicalMedia({schema:MACHINE_SCHEMA,entry:input.entry,files:input.files})));
  if(digest!==input.sha256)throw new Error('machine manifest digest does not match its files');
  return {version,label,built,entry:input.entry,files,sha256:input.sha256};
}
function machineMissing(files){
  for(const [p,f] of Object.entries(files)){
    const fp=machineBlobPath(f.sha256);
    let ok=false;try{ok=fs.existsSync(fp) && fs.statSync(fp).size===f.bytes;}catch(e){ok=false;}
    if(!ok)return p;
  }
  return null;
}
/* The register call: every blob present, then ONE atomic write of the index, then the blobs nothing names are
   removed. The same manifest registered twice is acknowledged with already:true and changes nothing. */
async function registerMachine(req,res){
  let set;
  try{set=validateMachineManifest(JSON.parse((await readLimitedBody(req,2*1024*1024)).toString('utf8')));}
  catch(e){return send(res,e.message==='too large'?413:400,{error:e.message});}
  const missing=machineMissing(set.files);if(missing)return send(res,409,{error:'upload every machine file before registering this manifest',file:missing});
  const already=!!(machineIndex.set && machineIndex.set.sha256===set.sha256);
  const next={schema:MACHINE_SCHEMA,set:{...set,registered:already?machineIndex.set.registered:new Date().toISOString()}};
  try{atomicBytes(MACHINE_INDEX,Buffer.from(JSON.stringify(next)));}catch(e){console.error('machine index save',e.message);return send(res,507,{error:'machine manifest was not registered; retry'});}
  machineIndex=next;
  const keep=new Set(Object.values(set.files).map(f=>f.sha256));let removed=0;
  for(const sha of machineBlobs())if(!keep.has(sha)){try{fs.unlinkSync(machineBlobPath(sha));removed++;}catch(e){console.error('machine prune',e.message);}}
  return send(res,200,{sha256:set.sha256,version:set.version,files:Object.keys(set.files).length,already,removed});
}
function machineNotReadyPage(){
  return page('The Coates Way machine','<p>The Coates Way machine has not been uploaded to this service yet. The owner imports it on the admin page, from the build\'s <code>print/out/machine</code> folder. The rest of the page is unaffected.</p>');
}
/* /w/<token>/<path>: the view link and the edit link both open it. The entry (index.html) is never cached, so a
   new set shows the moment it is registered; everything else is cached an hour under its own hash, and the
   page asks for the model and the sound with a version in the query string anyway. */
function serveMachine(req,res,token,rel){
  const edit=same(token,EDIT_TOKEN), view=same(token,VIEW_TOKEN);
  if(!edit && !view)return send(res,404,page('Not found','<p>That link is not one of ours.</p>'),{'Content-Type':'text/html; charset=utf-8'});
  if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'GET or HEAD required'},{Allow:'GET, HEAD'});
  const set=machineIndex.set;
  if(rel==='')rel=set?set.entry:'index.html';
  const html=extOf(rel)==='html';
  if(!set)return html?send(res,503,machineNotReadyPage(),{'Content-Type':'text/html; charset=utf-8'}):send(res,404,{error:'the machine has not been uploaded'});
  if(!machinePathOk(rel))return send(res,404,{error:'no such machine file'});
  const f=set.files[rel];if(!f)return html?send(res,404,page('Not found','<p>The machine has no page by that name.</p>'),{'Content-Type':'text/html; charset=utf-8'}):send(res,404,{error:'no such machine file'});
  const fp=machineBlobPath(f.sha256);
  let size=0;try{size=fs.statSync(fp).size;}catch(e){return send(res,404,{error:'machine file missing on the volume; import the machine again'});}
  const etag='"'+f.sha256.slice(0,32)+'"';
  const headers={'Content-Type':f.type,'Cache-Control':html?'no-cache':'private, max-age=3600',ETag:etag,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Referrer-Policy':html?'strict-origin-when-cross-origin':'no-referrer'};
  /* the page runs inside the delivery page's own frame (frame-ancestors 'self') and nowhere else; the import map is
     an inline script, hence 'unsafe-inline' for scripts; the fonts the older mechanism page names are the one
     outside host allowed, and losing them costs typography, not function */
  /* v5.79 — the same set also carries the satellite plan explorer and the 3D proof (Andrew Fisher, 25 Sep 2026): a page in
     it may fetch Mapbox satellite tiles and Google 3D tiles, load CesiumJS from jsDelivr and run its WebAssembly mesh decoders
     ('wasm-unsafe-eval' allows WebAssembly only; string eval stays refused); the html page sends its origin
     as referrer because both keys are restricted to this site's addresses. Nothing else in the policy moved. */
  if(html){headers['X-Frame-Options']='SAMEORIGIN';headers['Content-Security-Policy']="default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://api.mapbox.com https://*.googleapis.com https://cdn.jsdelivr.net; media-src 'self' blob:; connect-src 'self' blob: data: https://api.mapbox.com https://events.mapbox.com https://tile.googleapis.com https://*.googleapis.com https://cdn.jsdelivr.net; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'";}
  if(req.headers['if-none-match']===etag){res.writeHead(304,headers);return res.end();}
  let start=0,end=size-1,status=200;
  if(req.headers.range && (!req.headers['if-range'] || req.headers['if-range']===etag)){
    const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(!m || (!m[1]&&!m[2]))return send(res,416,'',{'Content-Range':'bytes */'+size});
    start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));end=m[1]&&m[2]?Math.min(Number(m[2]),size-1):size-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size)return send(res,416,'',{'Content-Range':'bytes */'+size});
    headers['Content-Range']='bytes '+start+'-'+end+'/'+size;status=206;
  }
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);
  if(req.method==='HEAD')return res.end();
  const stream=fs.createReadStream(fp,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
}

// ---------------------------------------------------------------- pages
function page(title, body) {
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · GC500</title>
<style>body{font:15px/1.5 "Segoe UI",system-ui,sans-serif;color:#14181d;background:#f8f6f4;margin:0;padding:24px 16px}main{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e4e0dc;border-radius:12px;padding:22px 24px}
h1{font-size:20px;margin:0 0 4px}h1 span{color:#ff6a13}.sub{color:#646d77;font-size:13px;margin:0 0 16px}code,.mono{font-family:ui-monospace,Consolas,monospace;font-size:13px}
table{border-collapse:collapse;width:100%;font-size:13.5px;margin:10px 0}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid #f1eeec;vertical-align:top}th{color:#646d77;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.btn{display:inline-block;background:#ff6a13;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;text-decoration:none}.btn.ghost{background:#fff;color:#14181d;border:1px solid #e4e0dc}
.note{background:#fff7f1;border:1px solid #ffd9c0;border-radius:8px;padding:10px 12px;font-size:13px;margin:12px 0}input[type=file]{font-size:13px}#msg{font-size:13px;margin-top:8px;color:#1f6b3a}
#fup label{display:inline-block;margin:0 8px 6px 0}#fup select,#fup input[type=text]{font-size:13px;padding:4px 6px;border:1px solid #cfc9c3;border-radius:6px;max-width:100%}
details.refile{margin-top:4px;font-size:12px}details.refile summary{cursor:pointer;color:#646d77}details.refile select,details.refile input{font-size:12px;padding:3px 5px;border:1px solid #cfc9c3;border-radius:5px;margin:3px 3px 0 0;max-width:100%}</style></head><body><main>
<h1>Coates Industrial Solutions · <span>GC500</span></h1><p class="sub">Delivery control · hosted record · Author: Andrew Fisher</p>${body}</main></body></html>`;
}
/* the Kind box, the same on the upload form and on every card's Re-file: documents, then the one photograph
   kind, then one invoice entry per branch the page names. `f` selects the entry a card already has. */
function kindOptionsHtml(f) {
  const cur = f ? (f.kind === 'invoice' && f.branch ? 'invoice|' + f.branch : f.kind) : 'swms';
  const opt = (v, words) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(words)}</option>`;
  return `<optgroup label="Documents">${opt('swms', 'SWMS')}${opt('transport', 'Transport & lifting')}${opt('map', 'Map / drawing / plate')}${opt('pack', 'Pack / report')}${opt('docket', 'Fencing docket')}${opt('other', 'Other')}</optgroup>`
    + `<optgroup label="Photographs">${opt('photo', 'Photo of a location — filed against a reference')}</optgroup>`
    + `<optgroup label="Invoices">${appBranches().map(b => opt('invoice|' + b.code, b.code + ' invoice' + (b.name ? ' — ' + b.name : ''))).join('')}</optgroup>`
    + (f && f.kind === 'drop-photo' ? `<optgroup label="From the page">${opt('drop-photo', 'Drop photograph (taken in the page)')}</optgroup>` : '');
}
function adminPage(token) {
  const meta = appMeta();
  const refs = appRefs();
  const colls = Object.entries(state.docs).map(([c, d]) => `<tr><td class="mono">${esc(c)}</td><td>${Object.keys(d).length}</td></tr>`).join('') || '<tr><td colspan="2">No records yet.</td></tr>';
  let snaps = [];
  try { snaps = fs.readdirSync(path.join(DATA_DIR, 'snapshots')).filter(n => n.startsWith('records-')).sort().slice(-3); } catch (e) { /* none */ }
  return page('Admin', `
<h2 style="font-size:16px;margin:0 0 6px">The app</h2>
${meta ? `<p>Uploaded <b>${esc(meta.uploaded)}</b> · ${(meta.bytes / 1e6).toFixed(1)} MB · build <b>${esc(meta.build_version || '—')}</b> (${esc(meta.built || '—')})</p>` : '<p><b>No app uploaded yet.</b> Upload GC500_Delivery_Control_hosted.html below.</p>'}
<form id="up"><input type="file" id="f" accept=".html,text/html"> <button class="btn" type="submit">Upload this build</button><div id="msg"></div></form>
<div class="note">Upload the file the build writes as <code>print/out/GC500_Delivery_Control_hosted.html</code>. Everyone gets it the next time they open or refresh their link. Records are kept separately and survive an upload.</div>
<h2 style="font-size:16px;margin:18px 0 6px">Hosted pictures, video and sound</h2>
<p>Import the media folder from the same package before uploading a hosted page that uses it. Existing documents and their photos remain in Documents.</p>
<p><label>Choose media folder <input type="file" id="mediafolder" webkitdirectory directory multiple></label></p>
<p><label>Or choose its files, including manifest.json <input type="file" id="mediafiles" multiple></label></p>
<p><button class="btn ghost" id="mediaimport" type="button">Import media</button></p><div id="mediamsg" role="status" aria-live="polite"></div>
<h2 style="font-size:16px;margin:18px 0 6px">The Coates Way machine</h2>
${(ms => ms.ready ? `<p>On this service: <b>${esc(ms.label)}</b> · build <b>${esc(ms.version)}</b>${ms.built ? ' (' + esc(ms.built) + ')' : ''} · ${ms.files} files · ${(ms.bytes / 1e6).toFixed(1)} MB · imported ${esc(ms.registered)}</p>` : '<p><b>Not on this service yet.</b> The Coates Way tab says so until it is imported.</p>')(machineStatus())}
<p>Import the build's <code>print/out/machine</code> folder. It opens inside the page's Coates Way tab, on the view link and the edit link. A repeat import sends only the files that changed; the new set goes live whole, in one step, when the last file is in.</p>
<p><label>Choose the machine folder <input type="file" id="machinefolder" webkitdirectory directory multiple></label></p>
<p><label>Or choose its files, including machine-manifest.json <input type="file" id="machinefiles" multiple></label></p>
<p><button class="btn ghost" id="machineimport" type="button">Import the machine</button></p><div id="machinemsg" role="status" aria-live="polite"></div>
<h2 style="font-size:16px;margin:18px 0 6px">The record</h2>
<p>Version <b>${state.version}</b> · last write <b>${esc(state.updated || '—')}</b></p>
<table><thead><tr><th>Collection</th><th>Documents</th></tr></thead><tbody>${colls}</tbody></table>
<p><a class="btn ghost" href="/api/export?t=${encodeURIComponent(token)}" download="gc500_record.json">Download the record (JSON, Import-ready)</a></p>
<div class="note"><b>There is no upload beside it, and that is on purpose.</b> This file is a copy to keep, and the way back in is one of two: <b>Tools &rarr; Import</b> inside the page on the edit link, which merges it rather than overwriting; or <code>sources/ops/as_supplied.json</code> in the build. It does not go in the Documents form below and it never goes near the service's settings — the record here is already the live one.</div>
<p class="sub">Hourly snapshots on the volume (last three): ${snaps.map(esc).join(', ') || 'none yet'} · write log: <code>writes.log</code></p>
<h2 style="font-size:16px;margin:18px 0 6px">Documents</h2>
<p>${Object.keys(files).length} file${Object.keys(files).length === 1 ? '' : 's'} on the service · ${(Object.values(files).reduce((a, f) => a + (f.bytes || 0), 0) / 1e6).toFixed(0)} MB. The page's Documents tab lists the drawings, plates and packs the build knows and opens the ones that are here; SWMS uploaded here appear as their own cards.</p>
<p><button class="btn ghost" id="thumbs" type="button">Make missing thumbnails</button></p><div id="thumbmsg" role="status" aria-live="polite"></div>
<datalist id="reflist">${(refs || []).map(r => `<option value="${esc(r)}">`).join('')}</datalist>
<form id="fup"><label>Kind <select id="fkind">${kindOptionsHtml()}</select></label>
  <label id="frefwrap" style="display:none">Location <input type="text" id="fref" list="reflist" placeholder="P09" maxlength="12" autocapitalize="characters" autocomplete="off" style="width:110px"></label>
  <label id="finvwrap" style="display:none">Invoice no. <input type="text" id="finv" placeholder="optional" maxlength="60" style="width:150px"></label>
  <input type="text" id="ftitle" placeholder="Title (optional, single file only)" maxlength="140" style="width:260px;max-width:100%">
  <input type="file" id="ff" multiple> <button class="btn" type="submit">Upload</button><div id="fmsg"></div>
  <div id="fguess" class="note" style="display:none;margin-top:6px"></div></form>
<div class="note">Pick many at once — the whole <code>print/out</code> set if you like. A file uploaded under a name already here replaces it (that is how a new plate goes out). Up to ${MAX_FILE / 1e6} MB a file.
  <br><b>Photo of a location</b> files a picture against the reference it shows — ${refs ? `the Location box offers all ${refs.length} references from build ${esc(meta && meta.build_version || '?')}` : 'upload the page first and the Location box will offer every reference on it'} — and the page shows it inside that reference for everyone, straight away.
  <b>Invoices</b> file against the branch that gets the revenue: ${appBranches().map(b => esc(b.code) + (b.name ? ' (' + esc(b.name) + ')' : '')).join(', ')}.</div>
<table><thead><tr><th>File</th><th>Filed as</th><th>Size</th><th>Uploaded</th><th></th></tr></thead><tbody id="ftab">${Object.values(files).sort((a, b) => a.name.localeCompare(b.name)).map(f =>
  `<tr><td><a href="/f/${encodeURIComponent(token)}/${encodeURIComponent(f.id)}" target="_blank" rel="noopener">${esc(f.title || f.name)}</a>${f.title ? `<br><span class="mono">${esc(f.name)}</span>` : ''}</td><td>${esc(kindWords(f))}${
    f.kind !== 'docket' && f.kind !== 'invoice' && !f.ref && /(^|\D)\d{4,7}(\D|$)/.test(f.name) && /\.(jpe?g|png|webp|pdf)$/i.test(f.name) ? `<br><button class="btn ghost" data-kind="${esc(f.id)}" type="button" style="font-size:11px;padding:2px 6px;margin-top:3px">File as Fencing docket</button>` : ''}${
    f.refiled ? `<br><span class="sub" style="font-size:11px">was ${esc(f.refiled.was ? kindWords(f.refiled.was) : f.refiled.from)}${f.refiled.by ? ' · re-filed by ' + esc(f.refiled.by) : ''}</span>` : ''}
    <details class="refile"><summary>Re-file</summary><select data-rekind="${esc(f.id)}">${kindOptionsHtml(f)}</select>
      <input type="text" data-reref="${esc(f.id)}" list="reflist" placeholder="Location" maxlength="12" autocapitalize="characters" autocomplete="off" value="${esc(f.ref || '')}" style="width:90px${f.kind === 'photo' || f.kind === 'invoice' ? '' : ';display:none'}">
      <input type="text" data-reinv="${esc(f.id)}" placeholder="Invoice no." maxlength="60" value="${esc(f.invoice_no || '')}" style="width:110px${f.kind === 'invoice' ? '' : ';display:none'}">
      <button class="btn ghost" data-refile="${esc(f.id)}" type="button" style="font-size:12px;padding:3px 8px">Apply</button></details></td><td>${(f.bytes / 1e6).toFixed(1)} MB</td><td>${esc(String(f.uploaded).slice(0, 16).replace('T', ' '))}${f.by ? ' · ' + esc(f.by) : ''}</td><td><button class="btn ghost" data-del="${esc(f.id)}" type="button">Remove</button></td></tr>`).join('') || '<tr><td colspan="5">Nothing uploaded yet.</td></tr>'}</tbody></table>
<div class="note">A file whose name carries a number is offered a one-tap <b>File as Fencing docket</b>, and every file has <b>Re-file</b> to change what it is filed as or against. Either changes the card and nothing else — same bytes, same name, same upload time — and says what the card was. The page already matches a paper to its docket by the number in the file name whatever kind it went up under, so this is tidiness, not repair.</div>
<h2 style="font-size:16px;margin:18px 0 6px">Texting</h2>
${smsReady()
  ? `<p>ClickSend is set up · <b id="smsleft">${smsToday().left}</b> of today's <b>${SMS_CAP}</b> left${SMS_FROM ? ` · they arrive from <b>${esc(SMS_FROM)}</b>` : ' · no sender name set, so they arrive from a ClickSend number and a reply reaches nobody'}
     · <button class="btn ghost" id="smsacct" type="button">Check the account</button> <span id="smsbal"></span></p>
   <form id="smsf"><input type="tel" id="smsto" placeholder="0429 352 788" style="width:190px" maxlength="30">
     <input type="text" id="smstx" placeholder="The message" maxlength="480" style="width:100%;max-width:520px;margin-top:6px">
     <div id="smscount" class="sub" style="margin:4px 0"></div>
     <button class="btn ghost" id="smsdry" type="button">Check it, send nothing</button>
     <button class="btn" type="submit" id="smsgo">Send</button><div id="smsmsg"></div></form>
   <div class="note"><b>Nothing sends on its own.</b> A text leaves when you press Send, to that number, with those words. Every one is on the record here with the time, the number, the words and what it cost. A plain message is 160 characters; one curly quote or an em dash drops it to 70, and the count below says so before you send.</div>
   <table><thead><tr><th>Sent</th><th>To</th><th>Words</th><th>Status</th></tr></thead><tbody>${(sms.log || []).slice(-8).reverse().map(m =>
     `<tr><td>${esc(String(m.at).slice(0, 16).replace('T', ' '))}</td><td class="mono">${esc(m.to)}</td><td>${esc(String(m.text).slice(0, 90))}</td><td>${esc(String(m.status || '').toLowerCase())}${m.price ? ' · $' + esc(m.price) : ''}</td></tr>`).join('')
     || '<tr><td colspan="4">Nothing sent yet.</td></tr>'}</tbody></table>`
  : `<p><b>Texting is not set up.</b> It needs two variables on this service: <code>CLICKSEND_USERNAME</code> and <code>CLICKSEND_API_KEY</code>. Optionally <code>SMS_FROM</code> for the name texts arrive from, and <code>SMS_DAILY_CAP</code> (now ${SMS_CAP}).</p>`}
<h2 style="font-size:16px;margin:18px 0 6px">Links</h2>
<table><tbody><tr><td>View (share widely)</td><td class="mono">/v/${esc(VIEW_TOKEN)}</td></tr><tr><td>Edit (the few who update)</td><td class="mono">/e/${esc(EDIT_TOKEN)}</td></tr></tbody></table>
<div class="note">A link is a key. Anyone holding the edit link can change the record; anyone with the view link can read all of it. Change a token in the service's variables to cut a link off.</div>
<script>
document.getElementById('up').onsubmit = async e => { e.preventDefault(); const f = document.getElementById('f').files[0]; const m = document.getElementById('msg');
  if (!f) { m.textContent = 'Choose the file first.'; return; } m.textContent = 'Uploading ' + (f.size/1e6).toFixed(1) + ' MB…';
  try { const r = await fetch('/api/admin/app', {method: 'POST', headers: {'x-gc500-token': ${JSON.stringify(token)}, 'Content-Type': 'text/html'}, body: f});
    const j = await r.json(); m.textContent = r.ok ? 'Uploaded — build ' + (j.build_version || '?') + '. Everyone gets it on their next open.' : 'Refused: ' + (j.error || r.status); if (r.ok) setTimeout(() => location.reload(), 1500); }
  catch (err) { m.textContent = 'Upload failed: ' + err; } };
/* one Kind value is "kind" or "invoice|BRANCH"; the headers the service checks are split out of it here */
function filingHeaders(sel, ref, inv) {
  var parts = String(sel || '').split('|'), h = {'x-file-kind': parts[0]};
  if (parts[1]) h['x-file-branch'] = parts[1];
  if (ref) h['x-file-ref'] = encodeURIComponent(String(ref).trim().toUpperCase());
  if (inv) h['x-file-invoice'] = encodeURIComponent(String(inv).trim());
  return h;
}
function showFor(sel, refEl, invEl) {
  var k = String(sel || '').split('|')[0];
  if (refEl) refEl.style.display = (k === 'photo' || k === 'invoice') ? '' : 'none';
  if (invEl) invEl.style.display = k === 'invoice' ? '' : 'none';
}
(function(){ var fk = document.getElementById('fkind'); var on = function(){ showFor(fk.value, document.getElementById('frefwrap'), document.getElementById('finvwrap')); }; fk.addEventListener('change', on); on(); })();

const thumbnailToken = ${JSON.stringify(token)};
const mediaPick = document.getElementById('mediafiles'), mediaFolder = document.getElementById('mediafolder');
const mediaGo = document.getElementById('mediaimport'), mediaMsg = document.getElementById('mediamsg');
let mediaWorking = false;
mediaGo.onclick = async function () {
  if(mediaWorking)return;
  const selected=Array.from(mediaFolder.files.length?mediaFolder.files:mediaPick.files), byName=new Map(selected.map(f=>[f.name,f]));
  const manifestFile=byName.get('manifest.json');if(!manifestFile){mediaMsg.textContent='Choose the media folder, or all media files including manifest.json.';return;}
  mediaWorking=true;mediaGo.disabled=true;
  try {
    const manifest=JSON.parse(await manifestFile.text());
    if(manifest.schema!=='gc500-media-v1'||!Array.isArray(manifest.assets))throw new Error('that is not a GC500 media manifest');
    const inventoryResponse=await fetch('/api/admin/media',{headers:{'x-gc500-token':thumbnailToken},cache:'no-store'});
    const inventory=await inventoryResponse.json();if(!inventoryResponse.ok)throw new Error(inventory.error||'cannot read media list');
    const saved=new Map(inventory.files.map(f=>[f.file,f]));let sent=0,skipped=0;
    for(let i=0;i<manifest.assets.length;i++){
      const item=manifest.assets[i],existing=saved.get(item.file);
      mediaMsg.textContent='Media '+(i+1)+' of '+manifest.assets.length+'; uploaded '+sent+', already saved '+skipped+'.';
      if(existing&&existing.bytes===item.bytes&&existing.sha256===item.sha256){skipped++;continue;}
      const file=byName.get(item.file);if(!file)throw new Error('missing '+item.file+'; choose the complete media folder');
      const r=await fetch('/api/admin/media/'+encodeURIComponent(item.file),{method:'PUT',headers:{'x-gc500-token':thumbnailToken,'Content-Type':item.type},body:file});
      const j=await r.json();if(!r.ok)throw new Error(j.error||('media upload refused: '+r.status));sent++;
    }
    mediaMsg.textContent='All media files are saved. Checking the complete set…';
    const r=await fetch('/api/admin/media/manifest',{method:'POST',headers:{'x-gc500-token':thumbnailToken,'Content-Type':'application/json'},body:JSON.stringify(manifest)});
    const j=await r.json();if(!r.ok)throw new Error(j.error||('manifest refused: '+r.status));
    mediaMsg.textContent='Media ready: '+j.files+' files. Upload the matching hosted HTML above. Repeating this import skips files already saved.';
  }catch(err){mediaMsg.textContent='Import paused: '+(err.message||err)+'. Saved files are kept; press Import media again to resume.';}
  finally{mediaWorking=false;mediaGo.disabled=false;}
};
mediaFolder.onchange=()=>{mediaPick.value='';};mediaPick.onchange=()=>{mediaFolder.value='';};

/* v5.77 — the Coates Way machine: the folder's files go up under their hashes (only the ones not already here),
   then the manifest registers the set in one step. The hashes are the build's; a file whose size disagrees with
   its manifest line is refused here before a byte is sent. */
const machinePick=document.getElementById('machinefiles'), machineFolder=document.getElementById('machinefolder');
const machineGo=document.getElementById('machineimport'), machineMsg=document.getElementById('machinemsg');
let machineWorking=false;
function machineRel(f){ const p=f.webkitRelativePath||''; if(!p)return f.name; const segs=p.split('/'); return segs.length>1?segs.slice(1).join('/'):f.name; }
machineGo.onclick=async function(){
  if(machineWorking)return;
  const selected=Array.from(machineFolder.files.length?machineFolder.files:machinePick.files), byPath=new Map(selected.map(f=>[machineRel(f),f]));
  const manifestFile=byPath.get('machine-manifest.json');
  if(!manifestFile){machineMsg.textContent='Choose the machine folder (the build writes it as print/out/machine), or all of its files including machine-manifest.json.';return;}
  machineWorking=true;machineGo.disabled=true;
  try{
    const manifest=JSON.parse(await manifestFile.text());
    if(manifest.schema!=='gc500-machine-v1'||!Array.isArray(manifest.files))throw new Error('that is not a GC500 machine manifest');
    const invResponse=await fetch('/api/admin/machine',{headers:{'x-gc500-token':thumbnailToken},cache:'no-store'});
    const inv=await invResponse.json();if(!invResponse.ok||!inv.blobs)throw new Error(inv.error||'cannot read the machine list');
    const have=new Map(inv.blobs.map(b=>[b.sha256,b.bytes]));let sent=0,skipped=0;
    for(let i=0;i<manifest.files.length;i++){
      const item=manifest.files[i];
      machineMsg.textContent='Machine file '+(i+1)+' of '+manifest.files.length+' ('+item.path+'); uploaded '+sent+', already saved '+skipped+'.';
      if(have.get(item.sha256)===item.bytes){skipped++;continue;}
      const file=byPath.get(item.path);if(!file)throw new Error('missing '+item.path+'; choose the complete machine folder');
      if(file.size!==item.bytes)throw new Error(item.path+' is not the file the manifest describes ('+file.size+' bytes, expected '+item.bytes+')');
      const r=await fetch('/api/admin/machine/blob/'+item.sha256,{method:'PUT',headers:{'x-gc500-token':thumbnailToken,'Content-Type':'application/octet-stream'},body:file});
      const j=await r.json();if(!r.ok)throw new Error(j.error||('machine upload refused: '+r.status));sent++;have.set(item.sha256,item.bytes);
    }
    machineMsg.textContent='All machine files are saved. Registering the set…';
    const r=await fetch('/api/admin/machine/manifest',{method:'POST',headers:{'x-gc500-token':thumbnailToken,'Content-Type':'application/json'},body:JSON.stringify(manifest)});
    const j=await r.json();if(!r.ok)throw new Error(j.error||('manifest refused: '+r.status));
    machineMsg.textContent='The machine is live: build '+j.version+', '+j.files+' files'+(j.already?' (this set was already the live one)':'')+'. Open The Coates Way tab on the page to see it.';
  }catch(err){machineMsg.textContent='Import paused: '+(err.message||err)+'. Saved files are kept; press Import the machine again to resume.';}
  finally{machineWorking=false;machineGo.disabled=false;}
};
machineFolder.onchange=()=>{machinePick.value='';};machinePick.onchange=()=>{machineFolder.value='';};

async function makeAdminThumbnail(file) {
  if (!/^image\\//i.test(file.type || '') && !/\\.(jpe?g|png|webp)$/i.test(file.name || '')) return null;
  let image, objectUrl, canvas;
  try {
    if (typeof createImageBitmap === 'function') {
      try { image = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* Image fallback */ }
    }
    if (!image) {
      objectUrl = URL.createObjectURL(file); image = await new Promise((resolve, reject) => {
        const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error('cannot read photograph')); im.src = objectUrl;
      });
    }
    const w = image.naturalWidth || image.width, h = image.naturalHeight || image.height;
    if (!(w > 0 && h > 0)) throw new Error('photograph has no dimensions');
    const scale = Math.min(1, 480 / Math.max(w, h)); canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.78));
    if (!blob || blob.type !== 'image/webp' || blob.size > 200 * 1024) throw new Error('this browser could not make a small WebP preview');
    return blob;
  } finally {
    if (image && image.close) image.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (canvas) { canvas.width = 1; canvas.height = 1; }
  }
}
async function postAdminThumbnail(f, blob) {
  const r = await fetch('/api/files/' + encodeURIComponent(f.id) + '/thumb', { method: 'POST',
    headers: { 'x-gc500-token': thumbnailToken, 'x-file-sha256': f.sha256, 'Content-Type': 'image/webp' }, body: blob });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || ('preview refused: ' + r.status)); return j;
}
const preparedThumbnails = new Map();
document.getElementById('thumbs').onclick = async function () {
  const button = this, msg = document.getElementById('thumbmsg'); if (button.disabled) return; button.disabled = true;
  let made = 0, failed = 0;
  try {
    const r = await fetch('/api/files', { headers: { 'x-gc500-token': thumbnailToken }, cache: 'no-store' });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || 'cannot read file list');
    const missing = j.files.filter(f => f.thumb !== true && /^image\\//.test(f.type || ''));
    for (let n = 0; n < missing.length; n++) {
      const f = missing[n], key = f.id + ':' + f.sha256;
      msg.textContent = 'Making preview ' + (n + 1) + ' of ' + missing.length + ': ' + f.name + '. Completed ' + made + ', retry needed ' + failed + '.';
      try {
        let blob = preparedThumbnails.get(key);
        if (!blob) {
          const response = await fetch('/f/' + encodeURIComponent(thumbnailToken) + '/' + encodeURIComponent(f.id) + '?v=' + f.sha256, { cache: 'no-store' });
          if (!response.ok) throw new Error('original could not be read');
          const original = await response.blob();
          if (crypto.subtle) {
            const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await original.arrayBuffer()))).map(b => b.toString(16).padStart(2, '0')).join('');
            if (hash !== f.sha256) throw new Error('original changed; retry this photograph');
          }
          blob = await makeAdminThumbnail(original); if (!blob) throw new Error('not a photograph');
          preparedThumbnails.set(key, blob);
        }
        await postAdminThumbnail(f, blob); preparedThumbnails.delete(key); made++;
      } catch (err) { failed++; }
    }
    msg.textContent = made + ' previews saved. ' + (failed ? failed + ' need a retry. Press Make missing thumbnails again; completed ones are skipped.' : 'All photographs have previews.');
  } catch (err) { msg.textContent = 'Stopped: ' + err.message + '. Press again to resume.'; }
  finally { button.disabled = false; }
};

document.getElementById('fup').onsubmit = async e => {
  e.preventDefault(); const form = e.currentTarget; if (form.dataset.busy === '1') return;
  const input = document.getElementById('ff'), fs_ = Array.from(input.files || []), m = document.getElementById('fmsg');
  if (!fs_.length) { m.textContent = 'Choose one or more files first.'; return; }
  const sel = document.getElementById('fkind').value, title = fs_.length === 1 ? document.getElementById('ftitle').value.trim() : '';
  const ref = document.getElementById('fref').value, inv = document.getElementById('finv').value;
  if (sel === 'photo' && !ref.trim()) { m.textContent = 'Say which location the picture is of in the Location box.'; return; }
  form.dataset.busy = '1'; const button = form.querySelector('button[type=submit]'); button.disabled = true;
  let n = 0, pending = 0, error = '';
  try {
    for (const f of fs_) {
      m.textContent = 'Uploading ' + f.name + ' — ' + (n + 1) + ' of ' + fs_.length + '…';
      let preview = null, previewError = false;
      try { preview = await makeAdminThumbnail(f); } catch (err) { previewError = true; }
      const r = await fetch('/api/files', {method: 'POST', headers: Object.assign({'x-gc500-token': thumbnailToken, 'Content-Type': f.type || 'application/octet-stream',
        'x-file-name': encodeURIComponent(f.name), 'x-file-title': encodeURIComponent(title), 'x-gc500-who': 'admin'}, filingHeaders(sel, ref, inv)), body: f});
      const j = await r.json(); if (!r.ok) throw new Error(f.name + ': ' + (j.error || r.status));
      n++;
      if (preview) { try { await postAdminThumbnail(j, preview); } catch (err) { previewError = true; preparedThumbnails.set(j.id + ':' + j.sha256, preview); } }
      if (previewError) pending++;
    }
  } catch (err) { error = err.message || String(err); }
  finally {
    // Clear successful selections so a preview failure never asks to upload the original again.
    input.value = ''; form.dataset.busy = ''; button.disabled = false;
    m.textContent = n + ' originals saved.' + (pending ? ' ' + pending + ' previews pending — use Make missing thumbnails.' : '')
      + (error ? ' ' + error + '. Choose only the files that were not saved to retry.' : '');
    if (!pending && !error) setTimeout(() => location.reload(), 1000);
  }
};
/* Re-file on a card: the Kind box, a Location box for a photo or an invoice, an invoice number for an invoice */
document.querySelectorAll('[data-rekind]').forEach(s => s.addEventListener('change', () => {
  const id = s.dataset.rekind;
  showFor(s.value, document.querySelector('[data-reref="' + CSS.escape(id) + '"]'), document.querySelector('[data-reinv="' + CSS.escape(id) + '"]')); }));
document.querySelectorAll('[data-refile]').forEach(b => b.onclick = async () => {
  const id = b.dataset.refile, was = b.textContent; b.disabled = true; b.textContent = 'Filing…';
  const sel = document.querySelector('[data-rekind="' + CSS.escape(id) + '"]').value;
  const ref = document.querySelector('[data-reref="' + CSS.escape(id) + '"]').value, inv = document.querySelector('[data-reinv="' + CSS.escape(id) + '"]').value;
  try { const r = await fetch('/api/files/' + encodeURIComponent(id) + '/kind', {method: 'POST',
      headers: Object.assign({'x-gc500-token': ${JSON.stringify(token)}, 'x-gc500-who': 'admin'}, filingHeaders(sel, ref, inv))});
    if (r.ok) location.reload(); else { const j = await r.json().catch(() => ({})); b.disabled = false; b.textContent = 'Could not re-file: ' + (j.error || r.status); }
  } catch (err) { b.disabled = false; b.textContent = was; } });
/* the Kind box picks itself when the files chosen are named after dockets — 36503.jpg and the rest. It only
   ever offers: the box stays exactly where a person last put it if they have touched it. */
(function(){
  var ff = document.getElementById('ff'), fk = document.getElementById('fkind'), hint = document.getElementById('fguess');
  if (!ff || !fk || !hint) return;
  fk.addEventListener('change', function(){ fk.dataset.touched = '1'; });
  ff.addEventListener('change', function(){
    var names = Array.prototype.map.call(ff.files || [], function(f){ return f.name; });
    var dk = names.filter(function(n){ return /^\\d{4,7}\\s*(\\(\\d+\\))?\\.(jpe?g|png|webp|pdf)$/i.test(n); });
    if (dk.length && dk.length === names.length) {
      if (fk.dataset.touched !== '1') fk.value = 'docket';
      hint.style.display = ''; hint.innerHTML = '<b>' + dk.length + (dk.length === 1 ? ' file is' : ' files are') + ' named like a docket number.</b> Kind is set to <b>Fencing docket</b> — change it if that is wrong.';
    } else { hint.style.display = 'none'; hint.textContent = ''; }
  });
})();
document.querySelectorAll('[data-kind]').forEach(b => b.onclick = async () => {
  const was = b.textContent; b.disabled = true; b.textContent = 'Filing…';
  try { const r = await fetch('/api/files/' + encodeURIComponent(b.dataset.kind) + '/kind', {method: 'POST',
      headers: {'x-gc500-token': ${JSON.stringify(token)}, 'x-file-kind': 'docket', 'x-gc500-who': 'admin'}});
    if (r.ok) location.reload(); else { const j = await r.json().catch(() => ({})); b.disabled = false; b.textContent = 'Could not re-file: ' + (j.error || r.status); }
  } catch (err) { b.disabled = false; b.textContent = was; } });
document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Press again to remove'; setTimeout(() => { b.dataset.sure = ''; b.textContent = 'Remove'; }, 4000); return; }
  const r = await fetch('/api/files/' + encodeURIComponent(b.dataset.del), {method: 'DELETE', headers: {'x-gc500-token': ${JSON.stringify(token)}}}); if (r.ok) location.reload(); else b.textContent = 'Could not remove'; });
(function(){
  var f = document.getElementById('smsf'); if (!f) return;
  var TOK = ${JSON.stringify(token)};
  var to = document.getElementById('smsto'), tx = document.getElementById('smstx'),
      cnt = document.getElementById('smscount'), msg = document.getElementById('smsmsg'), go = document.getElementById('smsgo');
  /* the same arithmetic the sender does, so the count here is the count that gets charged */
  var GSM = '@\\u00a3$\\u00a5\\u00e8\\u00e9\\u00f9\\u00ec\\u00f2\\u00c7\\n\\u00d8\\u00f8\\r\\u00c5\\u00e5\\u0394_\\u03a6\\u0393\\u039b\\u03a9\\u03a0\\u03a8\\u03a3\\u0398\\u039e\\u00c6\\u00e6\\u00df\\u00c9 !"#\\u00a4%&\\'()*+,-./0123456789:;<=>?\\u00a1ABCDEFGHIJKLMNOPQRSTUVWXYZ\\u00c4\\u00d6\\u00d1\\u00dc\\u00a7\\u00bfabcdefghijklmnopqrstuvwxyz\\u00e4\\u00f6\\u00f1\\u00fc\\u00e0';
  var EXT = '\\f^{}\\\\[~]|\\u20ac';
  function shape(s){ var u = 0, plain = true, odd = [];
    for (var i = 0; i < s.length; i++) { var c = s[i];
      if (GSM.indexOf(c) >= 0) u += 1; else if (EXT.indexOf(c) >= 0) u += 2;
      else { plain = false; if (odd.indexOf(c) < 0 && odd.length < 6) odd.push(c); } }
    return plain ? {u: u, parts: u <= 160 ? 1 : Math.ceil(u / 153), plain: true, odd: odd}
                 : {u: s.length, parts: s.length <= 70 ? 1 : Math.ceil(s.length / 67), plain: false, odd: odd}; }
  function redraw(){ var s = shape(tx.value);
    cnt.innerHTML = s.u + ' characters · <b>' + s.parts + ' text' + (s.parts === 1 ? '' : 's') + '</b>'
      + (s.plain ? '' : ' · <span style="color:#b3261e">' + s.odd.join(' ') + ' ' + (s.odd.length === 1 ? 'is' : 'are')
         + ' not in the plain alphabet, so every text is 70 characters instead of 160 — <button class="btn ghost" type="button" id="smsfix" style="padding:2px 8px">write it plainly</button></span>');
    var fix = document.getElementById('smsfix');
    if (fix) fix.onclick = function(){ tx.value = tx.value.replace(/[\\u2018\\u2019\\u201b]/g, "'").replace(/[\\u201c\\u201d]/g, '"')
      .replace(/[\\u2013\\u2014]/g, '-').replace(/\\u2026/g, '...').replace(/\\u00a0/g, ' ').replace(/[\\u2022\\u00b7]/g, '-'); redraw(); }; }
  tx.oninput = redraw; redraw();
  async function post(dry){
    msg.textContent = dry ? 'Checking…' : 'Sending…';
    var r = await fetch('/api/sms', {method: 'POST', headers: {'x-gc500-token': TOK, 'Content-Type': 'application/json', 'x-gc500-who': 'admin page'},
      body: JSON.stringify({to: [to.value], text: tx.value, dry_run: !!dry})});
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { msg.style.color = '#b3261e'; msg.textContent = (j.error || ('refused (' + r.status + ')'))
      + (j.numbers ? ' ' + j.numbers.map(function(n){ return n.given + ' — ' + n.why; }).join('; ') : ''); return; }
    msg.style.color = '#1f6b3a';
    if (dry) { msg.textContent = 'Reads as ' + j.to.join(', ') + ' · ' + j.shape.parts + ' text' + (j.shape.parts === 1 ? '' : 's')
      + ' · ' + j.today.left + " left of today's " + j.today.cap + '. Nothing sent.'; return; }
    var went = (j.messages || []).filter(function(m){ return String(m.status || '').toUpperCase().indexOf('SUCCESS') >= 0; });
    msg.textContent = went.length + ' of ' + (j.messages || []).length + ' sent'
      + (j.clicksend && j.clicksend.says ? ' · ClickSend says: ' + j.clicksend.says : '')
      + (j.error ? ' · ' + j.error : '');
    document.getElementById('smsleft').textContent = j.today.left;
    if (went.length) setTimeout(function(){ location.reload(); }, 2500);
  }
  document.getElementById('smsdry').onclick = function(){ post(true); };
  f.onsubmit = function(e){ e.preventDefault();
    if (go.dataset.sure !== '1') { go.dataset.sure = '1'; go.textContent = 'Press again to send'; setTimeout(function(){ go.dataset.sure = ''; go.textContent = 'Send'; }, 8000); return; }
    go.dataset.sure = ''; go.textContent = 'Send'; post(false); };
  document.getElementById('smsacct').onclick = async function(){
    var b = document.getElementById('smsbal'); b.textContent = 'checking…';
    var r = await fetch('/api/sms/account?t=' + encodeURIComponent(TOK)); var j = await r.json();
    b.textContent = r.ok ? ('balance ' + j.balance + ' ' + (j.currency || '') + ' · username ' + (j.username || '?'))
      : ('ClickSend refused: ' + (j.says || j.error || r.status)); };
})();
</script>`);
}

// ---------------------------------------------------------------- routing
// ---------------------------------------------------------------- texting a driver
/* A drop card is only any use if the driver has the link in his hand at four in the morning. This is how it gets
   there. Five rules, and they are the whole design:

     · nothing sends itself. There is no schedule here, no trigger, no "and then it texts them". Every message
       leaves because somebody holding the edit link pressed Send for that message, to those numbers, with that
       wording in front of them. A cron job that texts drivers is one bad date away from waking up a yard at 2am.
     · the account is Andrew Fisher's. Its username and key are Railway variables he sets himself. They are not in
       the page, not in the record, not in a link, not in this file and not in any log line. Unset, this answers
       "not set up" and sends nothing.
     · the cap is a wall, not a warning. SMS_DAILY_CAP messages a day, counted in Queensland time because that is
       where the job is. Past it, the send is refused before a single message leaves — a loop in somebody's browser
       cannot run up a bill.
     · all or nothing. One bad number fails the whole send before anything goes, so nobody is left wondering which
       four of the six drivers got it.
     · every message is on the record: when, to whom, the exact words, what it cost, what ClickSend said back.

   On the wording: these are operational messages to people who gave their number for this job — where to go, what
   is on the truck, who to ring. Keep them to that. Anything that reads as marketing is a different thing under the
   Spam Act and needs consent and an unsubscribe, which this deliberately does not pretend to provide. */
const SMS_USER = String(process.env.CLICKSEND_USERNAME || '').trim();
const SMS_KEY = String(process.env.CLICKSEND_API_KEY || '').trim();
/* Who a text comes from. A name is at most 11 characters and, since 1 July 2026, has to be registered with the
   ACMA Sender ID Register or it arrives labelled "Unverified". A number is up to 15 digits with a leading + and
   needs no register — but it has to be one ClickSend has verified as yours (Sender IDs › Own Numbers), and then a
   driver's reply lands on that phone, which is the best of the three. */
const SMS_FROM = (s => (/^\+?\d{6,15}$/.test(s.replace(/\s/g, '')) ? s.replace(/\s/g, '') : s.slice(0, 11)))(String(process.env.SMS_FROM || '').trim());
const SMS_CAP = Math.max(0, parseInt(process.env.SMS_DAILY_CAP || '500', 10) || 0);
const SMS_AT_ONCE = 50;                 // recipients in one press of Send
const SMS_MAX_CHARS = 480;              // three GSM segments and a bit — past this it is a phone call, not a text
const SMS_KEEP = 500;                   // messages kept on the record here
const SMS_TIMEOUT = 20000;

/* ---------------------------------------------------------------- email
   Andrew Fisher, 13 Sep 2026: "when we send a email. It should attach the pdf and drop location into the email
   itself. With a details and pics. Nicely formatted."

   A mailto: link cannot do that — it carries plain text and it cannot attach anything, and no page can work
   round it. A service can. This sends through the same ClickSend account the texts already go through, which
   means one account, one bill and one place the sending is switched off.

   ClickSend will only send FROM an address it has verified, and it refers to that address by an id rather than
   by the address itself — so EMAIL_FROM_ID is the id of the verified sender, read from /v3/email/addresses.
   The admin page lists them so nobody has to guess. With no id set, the endpoint refuses and says so rather
   than sending from somewhere unexpected.

   Everything the texting side does, this does: a daily cap that is a wall and not a warning, counted before the
   wire rather than after; a dry run that sends nothing; every send on the record with who asked for it and what
   ClickSend said back. */
const EMAIL_FROM_ID = String(process.env.CLICKSEND_EMAIL_FROM_ID || '').trim();
const EMAIL_FROM_NAME = String(process.env.CLICKSEND_EMAIL_FROM_NAME || 'Coates Industrial Solutions · GC500').trim().slice(0, 60);
const EMAIL_CAP = Math.max(0, parseInt(process.env.EMAIL_DAILY_CAP || '200', 10) || 0);
const EMAIL_AT_ONCE = 20;               // recipients in one press of Send
const EMAIL_MAX_BYTES = 9 * 1024 * 1024; // body and attachments together, before base64 — mail servers stop near 10 MB
const EMAIL_KEEP = 300;
let mail = { sent: {}, log: [] };
try { mail = Object.assign(mail, JSON.parse(fs.readFileSync(FILES.mail, 'utf8')) || {}); } catch (e) { /* first run */ }
function persistMail() { try { fs.writeFileSync(FILES.mail, JSON.stringify(mail)); } catch (e) { console.error('mail', e.message); } }
function emailReady() { return !!(SMS_USER && SMS_KEY && EMAIL_FROM_ID); }
function emailToday() { const d = smsDay(); return { day: d, sent: mail.sent[d] || 0, cap: EMAIL_CAP, left: Math.max(0, EMAIL_CAP - (mail.sent[d] || 0)) }; }
/* An address is read, not guessed at. Anything with a space, a comma, two @ signs or no dot after the @ is
   handed back rather than sent to, because a bounce nobody sees is worse than a refusal somebody reads. */
function emailAddress(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return { ok: false, was: v, why: 'empty' };
  if (s.length > 254) return { ok: false, was: s.slice(0, 40) + '…', why: 'longer than an address can be' };
  if (!/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[A-Za-z]{2,}$/.test(s)) return { ok: false, was: s, why: 'does not read as an email address' };
  return { ok: true, email: s };
}

let sms = { sent: {}, log: [] };        // sent: {'2026-09-11': 12} · log: the last SMS_KEEP messages
try { sms = Object.assign(sms, JSON.parse(fs.readFileSync(FILES.sms, 'utf8')) || {}); } catch (e) { /* first run */ }
function persistSms() { try { fs.writeFileSync(FILES.sms, JSON.stringify(sms)); } catch (e) { console.error('sms', e.message); } }
function smsReady() { return !!(SMS_USER && SMS_KEY); }
/* Queensland does not put the clocks forward, so the day here is always UTC+10. Getting this wrong would hand
   somebody a fresh 500 at ten in the morning. */
function smsDay(at) { return new Date((at == null ? Date.now() : at) + 10 * 3600 * 1000).toISOString().slice(0, 10); }
function smsToday() { const d = smsDay(); return { day: d, sent: sms.sent[d] || 0, cap: SMS_CAP, left: Math.max(0, SMS_CAP - (sms.sent[d] || 0)) }; }

/* What a phone can carry in one message. A plain text runs 160 characters a segment; one curly quote or one em
   dash tips the whole message into the 70-character alphabet, so a 120-character message quietly becomes two. The
   app shows this before the send, which is why it is worked out here rather than guessed at. */
const GSM = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM_EXT = '\f^{}\\[~]|€';
function smsShape(text) {
  const s = String(text == null ? '' : text);
  let units = 0, plain = true;
  const odd = [];
  for (const ch of s) {
    if (GSM.indexOf(ch) >= 0) units += 1;
    else if (GSM_EXT.indexOf(ch) >= 0) units += 2;
    else { plain = false; if (odd.indexOf(ch) < 0 && odd.length < 8) odd.push(ch); }
  }
  if (!plain) {
    const u = s.length;                 // UTF-16 units: an emoji is two, which is what the phone counts
    return { encoding: 'UCS-2', units: u, parts: u <= 70 ? 1 : Math.ceil(u / 67), characters: [...s].length, not_plain: odd };
  }
  return { encoding: 'GSM-7', units, parts: units <= 160 ? 1 : Math.ceil(units / 153), characters: [...s].length, not_plain: [] };
}

/* A number, read the way people actually write them down: 0412 345 678, +61 412 345 678, 61412345678, or with
   the leading zero dropped off a spreadsheet. A landline is named as a landline rather than refused as "invalid",
   because the fix for a landline is to ring it. */
function smsNumber(raw) {
  const s = String(raw == null ? '' : raw).trim();
  const d = s.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  if (!d) return { ok: false, given: s, why: 'blank' };
  let e164 = null;
  if (/^04\d{8}$/.test(d)) e164 = '+61' + d.slice(1);
  else if (/^\+614\d{8}$/.test(d)) e164 = d;
  else if (/^614\d{8}$/.test(d)) e164 = '+' + d;
  else if (/^4\d{8}$/.test(d)) e164 = '+61' + d;              // the leading zero lost in a spreadsheet
  else if (/^\+[1-9]\d{7,14}$/.test(d)) e164 = d;             // somewhere other than here, written in full
  if (!e164) {
    const local = d.replace(/^\+?61/, '0');
    if (/^0[2378]\d{8}$/.test(local)) return { ok: false, given: s, why: 'that is a landline — a text will not get there, it needs a ring' };
    return { ok: false, given: s, why: 'not a mobile number this can read — write it 04xx xxx xxx' };
  }
  return { ok: true, given: s, e164 };
}

/* The real address, always, in production. The override exists so the tests can stand a pretend ClickSend in
   front of this and prove the cap, the refusals and the record without a message ever leaving the building — and
   it is ignored when NODE_ENV is production, so no variable can ever point the account's key somewhere else. */
const SMS_BASE = (process.env.NODE_ENV !== 'production' && process.env.CLICKSEND_BASE)
  ? String(process.env.CLICKSEND_BASE) : 'https://rest.clicksend.com/v3';
async function clicksend(path_, init) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), SMS_TIMEOUT);
  try {
    /* The headers are set LAST and on purpose. Spreading init over a default object would let a caller's own
       headers replace the whole block, Authorization and all — which reads as "ClickSend says unauthorised" and
       takes an afternoon to find. */
    const go = Object.assign({ method: 'GET' }, init || {});
    go.signal = ctl.signal;
    go.headers = Object.assign({
      'Authorization': 'Basic ' + Buffer.from(SMS_USER + ':' + SMS_KEY).toString('base64'),
      'Accept': 'application/json',
    }, (init && init.headers) || {});
    const r = await fetch(SMS_BASE + path_, go);
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* ClickSend answered with something that is not JSON */ }
    return { status: r.status, json, text: json ? null : text.slice(0, 400) };
  } finally { clearTimeout(timer); }
}

/* ClickSend's own words for what happened to each message, read without assuming the shape of the answer. If the
   reply ever changes underneath us, this says "ClickSend answered something I do not recognise" and hands over
   what it actually said, rather than reporting a success nobody can verify. */
function smsResults(json) {
  const d = (json && (json.data || json)) || {};
  const list = Array.isArray(d.messages) ? d.messages : (Array.isArray(d) ? d : null);
  if (!list) return null;
  return list.map(m => ({
    to: m && (m.to || m.recipient) || null,
    status: m && (m.status || m.response) || null,
    message_id: m && (m.message_id || m.messageId || m.id) || null,
    price: m && (m.message_price != null ? m.message_price : (m.price != null ? m.price : null)),
    parts: m && (m.message_parts != null ? m.message_parts : null),
    said: m && (m.custom_string || null),
  }));
}
function smsWent(r) { return !!(r && String(r.status || '').toUpperCase().indexOf('SUCCESS') >= 0); }

function smsBrief(n) {
  return { today: smsToday(), configured: smsReady(), from: SMS_FROM || null,
    from_is: SMS_FROM ? 'the name SMS_FROM is set to' : 'a ClickSend number — replies come back to ClickSend, not to a phone',
    at_once: SMS_AT_ONCE, max_characters: SMS_MAX_CHARS,
    sent: (sms.log || []).slice(-(n || 40)).reverse() };
}

/* Send one drop as an email: the formatted body the app built, the pictures carried as inline attachments, and
   a file attached where one has been handed over. The body is HTML the APP composed — the same function that
   draws the printed sheet's figures — so this service never writes a word of what goes out. It checks, caps,
   sends and records. */
async function emailSend(req, res, who) {
  if (!emailReady()) {
    return send(res, 501, { configured: false, error: SMS_USER && SMS_KEY
      ? 'Email is not finished being set up. ClickSend will only send from an address it has verified, and CLICKSEND_EMAIL_FROM_ID is not set on this service. Verify a sender in ClickSend, then put its id in that variable.'
      : 'Email is not set up on this server yet. It needs CLICKSEND_USERNAME, CLICKSEND_API_KEY and CLICKSEND_EMAIL_FROM_ID.' });
  }
  let body;
  try { body = JSON.parse((await readBody(req, 24 * 1024 * 1024)).toString('utf8')); }
  catch (e) { return send(res, 400, { error: 'a JSON object is expected' }); }
  if (!body || typeof body !== 'object') return send(res, 400, { error: 'a JSON object is expected' });

  const subject = String(body.subject == null ? '' : body.subject).trim().slice(0, 180);
  const html = String(body.html == null ? '' : body.html);
  if (!subject) return send(res, 400, { error: 'the email has no subject' });
  if (!html) return send(res, 400, { error: 'there is nothing to send' });

  const raw = Array.isArray(body.to) ? body.to : [body.to];
  if (!raw.length || raw.length > EMAIL_AT_ONCE) return send(res, 400, { error: 'between one and ' + EMAIL_AT_ONCE + ' addresses in one send' });
  const read = raw.map(emailAddress);
  const bad = read.filter(x => !x.ok);
  // all or nothing, the same as the texts: nobody should have to work out which three of the five got it
  if (bad.length) return send(res, 400, { error: 'nothing was sent. ' + bad.length + ' of ' + read.length + ' addresses did not read:', addresses: bad });
  const to = [];
  read.forEach(x => { if (to.indexOf(x.email) < 0) to.push(x.email); });

  /* Attachments arrive already base64 from the page. They are measured, named and typed here, and anything
     without all three is refused rather than sent as a nameless blob. */
  const atts = Array.isArray(body.attachments) ? body.attachments : [];
  if (atts.length > 12) return send(res, 400, { error: 'that is more than twelve attachments' });
  let bytes = Buffer.byteLength(html, 'utf8');
  const out_atts = [];
  for (const a of atts) {
    const content = String((a && a.content) || '');
    const filename = String((a && a.filename) || '').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 90);
    const type = String((a && a.type) || '').slice(0, 90);
    if (!content || !filename || !type) return send(res, 400, { error: 'every attachment needs content, a filename and a type' });
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(content)) return send(res, 400, { error: filename + ' is not base64' });
    bytes += Math.floor(content.length * 3 / 4);
    out_atts.push({ content: content.replace(/\s+/g, ''), type, filename,
      disposition: a.content_id ? 'inline' : 'attachment',
      content_id: a.content_id ? String(a.content_id).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 60) : filename });
  }
  if (bytes > EMAIL_MAX_BYTES) {
    return send(res, 413, { error: 'nothing was sent. That email is ' + (bytes / 1048576).toFixed(1)
      + ' MB and the limit here is ' + (EMAIL_MAX_BYTES / 1048576).toFixed(0) + ' MB — most mail servers refuse more. Send it with fewer pictures, or without the attachment.' });
  }

  const today = emailToday();
  if (to.length > today.left) {
    return send(res, 429, { error: 'nothing was sent. That is ' + to.length + ' emails and ' + today.left
      + ' left of today\'s ' + EMAIL_CAP + '. The count starts again at midnight Queensland time.', today });
  }

  const at = new Date().toISOString();
  const plan = { to, subject, attachments: out_atts.map(a => ({ filename: a.filename, type: a.type, inline: a.disposition === 'inline' })),
                 bytes, from_id: EMAIL_FROM_ID, from_name: EMAIL_FROM_NAME, today };
  if (body.dry_run) return send(res, 200, Object.assign({ dry_run: true, sent: false }, plan));

  mail.sent[today.day] = (mail.sent[today.day] || 0) + to.length;
  Object.keys(mail.sent).forEach(d => { if (d < smsDay(Date.now() - 90 * 86400000)) delete mail.sent[d]; });
  persistMail();

  let out;
  try {
    out = await clicksend('/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: to.map(x => ({ email: x, name: x.split('@')[0] })),
        from: { email_address_id: Number(EMAIL_FROM_ID) || EMAIL_FROM_ID, name: EMAIL_FROM_NAME },
        subject, body: html,
        attachments: out_atts.length ? out_atts : undefined,
      }),
    });
  } catch (e) {
    const why = e && e.name === 'AbortError' ? 'ClickSend did not answer within ' + (SMS_TIMEOUT / 1000) + ' seconds'
      : ('could not reach ClickSend: ' + (e && e.message));
    mail.log = (mail.log || []).concat(to.map(x => ({ at, to: x, subject, by: who || null, status: 'UNKNOWN', why }))).slice(-EMAIL_KEEP);
    persistMail();
    logWrite({ at, what: 'email unknown', n: to.length, by: who || null, why });
    return send(res, 502, { error: why + '. These are counted against today and marked unknown — check ClickSend before sending them again.', today: emailToday(), to });
  }

  const ok = out.status >= 200 && out.status < 300;
  const says = (out.json && (out.json.response_msg || out.json.message)) || out.text || null;
  mail.log = (mail.log || []).concat(to.map(x => ({ at, to: x, subject, by: who || null,
    status: ok ? 'SENT' : 'REFUSED', http: out.status, says, attachments: out_atts.length }))).slice(-EMAIL_KEEP);
  persistMail();
  logWrite({ at, what: ok ? 'email sent' : 'email refused', n: to.length, by: who || null, http: out.status });
  return send(res, ok ? 200 : 502, Object.assign({ sent: ok, http: out.status, says, today: emailToday() }, plan));
}

async function smsSend(req, res, who) {
  if (!smsReady()) {
    return send(res, 501, { error: 'Texting is not set up on this server yet. CLICKSEND_USERNAME and CLICKSEND_API_KEY are the two Railway variables it needs.', configured: false });
  }
  let body;
  try { body = JSON.parse((await readBody(req, 64 * 1024)).toString('utf8')); }
  catch (e) { return send(res, 400, { error: 'a JSON object is expected' }); }
  if (!body || typeof body !== 'object') return send(res, 400, { error: 'a JSON object is expected' });

  const text = String(body.text == null ? '' : body.text).trim();
  if (!text) return send(res, 400, { error: 'there is no message to send' });
  if (text.length > SMS_MAX_CHARS) return send(res, 400, { error: 'that message is ' + text.length + ' characters — the limit here is ' + SMS_MAX_CHARS + '. Past that it wants to be a phone call.' });
  const shape = smsShape(text);

  const raw = Array.isArray(body.to) ? body.to : [body.to];
  if (!raw.length || raw.length > SMS_AT_ONCE) return send(res, 400, { error: 'between one and ' + SMS_AT_ONCE + ' numbers in one send' });
  const read = raw.map(smsNumber);
  const bad = read.filter(x => !x.ok);
  // all or nothing: nobody should have to work out which four of the six got it
  if (bad.length) return send(res, 400, { error: 'nothing was sent. ' + bad.length + ' of ' + read.length + ' numbers did not read:', numbers: bad });
  const to = [];
  read.forEach(x => { if (to.indexOf(x.e164) < 0) to.push(x.e164); });   // the same number twice is one message

  const today = smsToday();
  if (to.length > today.left) {
    return send(res, 429, { error: 'nothing was sent. That is ' + to.length + ' messages and ' + today.left + ' left of today\'s ' + SMS_CAP
      + '. The count starts again at midnight Queensland time.', today });
  }

  const at = new Date().toISOString();
  const plan = { to, text, shape, from: SMS_FROM || null, messages: to.length, segments: to.length * shape.parts, today };
  if (body.dry_run) return send(res, 200, Object.assign({ dry_run: true, sent: false }, plan));

  /* Counted before the wire, not after. If this server dies mid-request the messages may still have gone, and a
     cap that only counts what came back cleanly is not a cap. */
  sms.sent[today.day] = (sms.sent[today.day] || 0) + to.length;
  Object.keys(sms.sent).forEach(d => { if (d < smsDay(Date.now() - 90 * 86400000)) delete sms.sent[d]; });
  persistSms();

  let out;
  try {
    out = await clicksend('/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: to.map(n => ({ source: 'gc500', body: text, to: n, from: SMS_FROM || undefined })) }),
    });
  } catch (e) {
    const why = e && e.name === 'AbortError' ? 'ClickSend did not answer within ' + (SMS_TIMEOUT / 1000) + ' seconds' : ('could not reach ClickSend: ' + (e && e.message));
    const entry = to.map(n => ({ at, to: n, text, by: who || null, parts: shape.parts, encoding: shape.encoding, status: 'UNKNOWN', why }));
    sms.log = (sms.log || []).concat(entry).slice(-SMS_KEEP); persistSms();
    logWrite({ at, what: 'sms unknown', n: to.length, by: who || null, why });
    return send(res, 502, { error: why + '. These are counted against today and marked unknown — check ClickSend before sending them again.', today: smsToday(), to });
  }

  const results = smsResults(out.json);
  const byNumber = {};
  (results || []).forEach(r => { if (r.to) byNumber[String(r.to).replace(/[^\d+]/g, '')] = r; });
  const entries = to.map(n => {
    const r = byNumber[n] || (results && results.length === to.length ? results[to.indexOf(n)] : null);
    return { at, to: n, text, by: who || null, parts: (r && r.parts) || shape.parts, encoding: shape.encoding,
      status: r ? (r.status || 'UNKNOWN') : (out.status === 200 ? 'UNKNOWN' : 'FAILED'),
      message_id: r ? r.message_id : null, price: r ? r.price : null,
      why: results ? null : ('ClickSend answered ' + out.status + ' in a shape this does not recognise') };
  });
  sms.log = (sms.log || []).concat(entries).slice(-SMS_KEEP);
  /* Messages ClickSend refused outright never left, so they are given back to the day's allowance. */
  const refused = entries.filter(e => String(e.status).toUpperCase() === 'FAILED').length;
  if (refused) { sms.sent[today.day] = Math.max(0, (sms.sent[today.day] || 0) - refused); }
  persistSms();
  logWrite({ at, what: 'sms', n: to.length, went: entries.filter(e => smsWent(e)).length, by: who || null, http: out.status });

  const went = entries.filter(e => smsWent(e)).length;
  return send(res, out.status === 200 && went ? 200 : 502, {
    sent: went, of: to.length, messages: entries, today: smsToday(),
    clicksend: { http: out.status, response_code: out.json && out.json.response_code, says: (out.json && out.json.response_msg) || out.text || null,
      total_price: out.json && out.json.data && out.json.data.total_price },
    error: went === to.length ? undefined
      : (went ? 'Some went and some did not — the list says which.'
              : 'Nothing went. ClickSend answered ' + out.status + (out.json && out.json.response_msg ? ': ' + out.json.response_msg : '') + '.'),
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p === '/health') return send(res, diskFault ? 503 : 200, { ok: !diskFault, disk: diskFault ? diskFault.message : 'writing', version: state.version, app: fs.existsSync(FILES.app), files: Object.keys(files).length,
      cards: Object.keys(cards).length, cards_live: Object.values(cards).filter(c => !cardExpired(c)).length, machine: !!machineIndex.set });
    if (p === '/' ) return send(res, 200, page('GC500', '<p>This page opens from its link. If you have one, use it; if not, ask Andrew Fisher.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
    let m;
    if ((m = p.match(/^\/(v|e)\/([A-Za-z0-9_-]+)\/?$/))) {
      const ok = (m[1] === 'e' && same(m[2], EDIT_TOKEN)) || (m[1] === 'v' && same(m[2], VIEW_TOKEN));
      if (!ok) return send(res, 404, page('Not found', '<p>That link is not one of ours.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
      return serveApp(req, res);
    }
    if ((m = p.match(/^\/m\/([^/]*)\/([^/]+)$/))) return serveMedia(req, res, m[1], decodeURIComponent(m[2]));
    /* v5.77 — the Coates Way machine, under the same key as the page. /w/<token> without the slash is sent to
       /w/<token>/ so the page's relative imports resolve beside it. */
    if ((m = p.match(/^\/w\/([A-Za-z0-9_-]+)$/))) {
      if (!(same(m[1], EDIT_TOKEN) || same(m[1], VIEW_TOKEN))) return send(res, 404, page('Not found', '<p>That link is not one of ours.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
      return send(res, 302, '', { Location: '/w/' + m[1] + '/' + (url.search || '') });
    }
    if ((m = p.match(/^\/w\/([A-Za-z0-9_-]+)\/(.*)$/))) {
      let rel; try { rel = decodeURIComponent(m[2]); } catch (e) { return send(res, 404, { error: 'no such machine file' }); }
      return serveMachine(req, res, m[1], rel);
    }
    if ((m = p.match(/^\/f\/([^/]*)\/([^/]+)\/thumb$/))) {
      if (!(same(m[1], EDIT_TOKEN) || same(m[1], VIEW_TOKEN))) return send(res, 401, { error: 'a view or edit token is needed' });
      if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'GET or HEAD required' }, { Allow: 'GET, HEAD' });
      return serveThumbnail(req, res, decodeURIComponent(m[2]));
    }
    if ((m = p.match(/^\/f\/([A-Za-z0-9_-]+)\/([^/]+)$/))) {
      if (!(same(m[1], EDIT_TOKEN) || same(m[1], VIEW_TOKEN))) return send(res, 404, page('Not found', '<p>That link is not one of ours.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
      return serveFile(req, res, decodeURIComponent(m[2]));
    }
    /* v5.56 — the person on the ground answering their own card. Its own token, its own card, and nothing
       else: this route reads no record, writes no record, and returns nothing about the job it was not
       already showing. An expired card takes no report. What comes back is stored as REPORTED, with the name
       they typed, and changes no figure anywhere until an editor says so. */
    /* v5.63 — THE SCOPED REPLY: one unit, named, and nothing else touched.
       The fault this fixes, from Andrew Fisher's own list: a reference that carries two buildings could not be
       answered for ONE of them. Every reply landed on the whole reference, so "installed" meant both or
       neither, and one pin moved for two buildings. The contract below refuses a reply that does not name its
       target, and refuses a target this card was not issued for.

       What is trusted and what is not: the grant is built HERE, from the card this service stored
       (cardGrant), and never from the request. A body may carry a grant, a verified-identity claim or a file's
       MIME type and every one of them is ignored. The typed name stays attribution, not identity.

       Retries are keyed to card ID PLUS submission ID, with the fingerprint of what was first saved. The same
       submission with the same content is acknowledged without a second report; the same submission with
       CHANGED content is an explicit 409, never a quiet success — an edited reply must take a new submission
       ID, which is the browser's job and is checked here rather than assumed. */
    if ((m = p.match(/^\/d\/([A-Za-z0-9_-]+)\/report\/scoped$/)) && req.method === 'POST') {
      const token = m[1], c = cards[token];
      if (!c || !CARD_TOKEN_RE.test(token)) return send(res, 404, { error: 'that link is not one of ours, or it has been withdrawn' });
      if (cardExpired(c)) return send(res, 410, { error: 'this card stopped working the day after the run — ring the number on it' });
      let body;
      /* bounded small on purpose: six file IDs, five short answers, a note and a pin. Photographs go to the
         file service by their own route and arrive here as IDs, so nothing large belongs in this body. */
      try { body = JSON.parse((await readBody(req, 16 * 1024)).toString('utf8')); } catch (e) {
        return send(res, 400, { error: 'that did not arrive as a report' });
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'a report needs a JSON object' });
      const phase = body.phase === 'demob' ? 'demob' : 'delivery';
      let prepared;
      try {
        prepared = prepareReport(body, {
          grant: cardGrant(token, c, phase),
          now: Date.now(),
          /* the file must already be in this service's own index, stored and hashed. A browser's word that a
             file exists, or what type it is, counts for nothing here. */
          fileLookup: id => { const f = files[id]; return f ? { id, mime: f.type || null, ready: true, sha256: f.sha256 || null } : null; },
          /* AND IT MUST BE A FILE THIS CARD PUT THERE — which nothing can be yet, deliberately.
             Uploaded files carry id, name, kind, ref, branch, bytes, sha256, type, uploaded and by. They do
             NOT carry the card that sent them, because the scoped upload route does not exist yet; Astra's
             integration notes list it as outstanding. So there is no honest way to tell a photograph this
             card took from any other photograph on the job, and "any valid ID on the job" is exactly the
             check that would let one card attach another card's evidence to its own reply.
             Until that route exists this refuses every file, by name, so the reply is still usable for the
             answers and the pin and nobody is left wondering why a photograph vanished. It is a refusal with
             a reason, not a silent drop, and it becomes a real check the moment uploads are attributed. */
          canUseFile: (f) => !!(f && f.ready && files[f.id] && files[f.id].card === token)
        });
      } catch (e) {
        const code = e && e.code || null;
        if (code === 'file' || code === 'photo' || code === 'photoIds') {
          return send(res, 409, { error: 'photographs cannot be attached to a scoped reply yet — the upload route that ties a '
            + 'photograph to this card is not built. The answers, the note and the position can be sent now.', code });
        }
        return send(res, 400, { error: e && e.message ? e.message : 'that report could not be read', code });
      }
      const list = scoped[token] = scoped[token] || [];
      const already = list.find(r => r.submission_id === prepared.event.submissionId);
      if (already) {
        const verdict = retryDecision(already.fingerprint, prepared.fingerprint);
        if (verdict === 'already_saved') return send(res, 200, { saved: true, already: true, id: already.id, at: already.at });
        return send(res, 409, { error: 'this submission ID was already used for a different report — an edited reply needs a new one', id: already.id, at: already.at });
      }
      const rec = {
        id: crypto.randomBytes(9).toString('base64url'),
        submission_id: prepared.event.submissionId,
        fingerprint: prepared.fingerprint,
        at: new Date().toISOString(),
        card: token,
        event: prepared.event
      };
      list.push(rec);
      const werr = persistScoped();
      if (werr) {
        /* written first, answered second. A reply that did not reach the disk is never called saved. */
        scoped[token] = list.filter(r => r.id !== rec.id);
        if (!scoped[token].length) delete scoped[token];
        logWrite({ at: new Date().toISOString(), what: 'scoped report NOT SAVED', token, error: werr.message });
        return send(res, 507, { error: 'the service could not save that report — nothing was stored; try again when you have signal' });
      }
      logWrite({ at: new Date().toISOString(), what: 'scoped report', token, target: prepared.event.target, phase });
      return send(res, 200, { saved: true, id: rec.id, at: rec.at, target: prepared.event.target });
    }
    if ((m = p.match(/^\/d\/([A-Za-z0-9_-]+)\/report$/)) && req.method === 'POST') {
      const c = cards[m[1]];
      if (!c || !CARD_TOKEN_RE.test(m[1])) return send(res, 404, { error: 'that link is not one of ours, or it has been withdrawn' });
      if (cardExpired(c)) return send(res, 410, { error: 'this card stopped working the day after the run — ring the number on it' });
      let body;
      try { body = JSON.parse((await readBody(req, MAX_REPORT)).toString('utf8')); } catch (e) {
        return send(res, 400, { error: 'that did not arrive as a report' });
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'a report needs a JSON object' });
      const rep = cleanReport(body, Object.assign({ token: m[1] }, c));
      if (!Object.keys(rep.fields).length && !rep.note && !rep.photos.length && !rep.pin) {
        return send(res, 400, { error: 'nothing was answered, so nothing was saved' });
      }
      reports[m[1]] = reports[m[1]] || [];
      /* the same report sent twice — a second tap, a retry on a bad signal — is one report, not two.
         v5.58 — but the same ID carrying DIFFERENT answers is a second report, not a retry (the 19 Sep 2026
         audit: a card that reused its ID had its second report thrown away as "already sent"). A retry sends
         the identical snapshot; anything else under a reused ID gets its own ID and is kept. */
      const identity = reportIdentity(rep);
      const family = reports[m[1]].filter(r => r.id === rep.id || r.retry_of === rep.id);
      const already = family.find(r => reportIdentity(r) === identity);
      if (already) return send(res, 200, { saved: true, already: true, id: already.id, at: already.at });
      if (family.length) {
        rep.retry_of = rep.id;
        rep.id = rep.id + '.' + crypto.randomBytes(4).toString('base64url');
      }
      reports[m[1]].push(rep);
      pruneReports();
      const werr = persistReports();
      if (werr) {
        /* it is not saved, so it is not in memory either — a retry must not be told "already sent" */
        reports[m[1]] = reports[m[1]].filter(r => r.id !== rep.id);
        if (!reports[m[1]].length) delete reports[m[1]];
        logWrite({ at: rep.at, what: 'card report NOT SAVED', token: m[1], load: c.load, error: werr.message });
        return send(res, 507, { error: 'Coates could not keep this report — the service could not write to its disk. Nothing was saved; press Send again in a minute.' });
      }
      logWrite({ at: rep.at, what: 'card report', token: m[1], load: c.load, by_name_given: rep.name_given,
                 fields: Object.keys(rep.fields), photos: rep.photos.length, pin: !!rep.pin });
      return send(res, 200, { saved: true, id: rep.id, at: rep.at });
    }
    /* a driver's drop card. Its own token namespace: a view or edit token opens nothing here, and a card token
       opens nothing else. No record is read to answer it. */
    if ((m = p.match(/^\/d\/([A-Za-z0-9_-]+)\/?$/))) {
      const c = cards[m[1]];
      const ring = c && c.contact && c.contact.phone
        ? `<p>Ring <b>${esc(c.contact.name || 'the Coates events project manager')}</b> on <a href="tel:${esc(String(c.contact.phone).replace(/[^0-9+]/g, ''))}">${esc(c.contact.phone)}</a>.</p>`
        : '<p>Ring the Coates events project manager whose name is on your paperwork.</p>';
      if (!c || !CARD_TOKEN_RE.test(m[1])) {
        return send(res, 404, page('Not found', '<p>That link is not one of ours, or it has been withdrawn.</p>'
          + '<p>Ring the Coates events project manager whose name is on your paperwork.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
      }
      if (cardExpired(c)) {
        return send(res, 410, page('This drop card has expired', `<p>This card was for <b>${esc(c.title || 'a load')}</b> on ${esc(c.run_date || 'its run day')}. It stopped working the day after the run.</p>${ring}`),
          { 'Content-Type': 'text/html; charset=utf-8' });
      }
      c.opens = (c.opens || []).concat([new Date().toISOString()]).slice(-200);
      persistCards();
      logWrite({ at: new Date().toISOString(), what: 'card open', token: m[1], load: c.load, title: c.title });
      /* v5.56 — THE CARD NOW ANSWERS BACK, AND THE POLICY SAYS EXACTLY HOW MUCH. It used to be frozen: no
         script, no network, nothing. It now carries one script of its own, and that script is named here BY
         ITS HASH — so the card runs the code the app put in it and nothing else, even if something else were
         ever to get into the HTML. `connect-src 'self'` lets it reach its own /report on this service and no
         other address on earth. Everything else stays shut: no library, no third party, no frame, no form
         posting anywhere. */
      const csp = "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; "
        + "script-src '" + cardScriptHash(c.html) + "'; connect-src 'self'; form-action 'none'; "
        + "base-uri 'none'; frame-ancestors 'none'";
      return send(res, 200, c.html, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': csp,
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      });
    }
    if ((m = p.match(/^\/admin\/([A-Za-z0-9_-]+)\/?$/))) {
      if (!same(m[1], EDIT_TOKEN)) return send(res, 404, page('Not found', '<p>That link is not one of ours.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
      return send(res, 200, adminPage(m[1]), { 'Content-Type': 'text/html; charset=utf-8' });
    }
    if (p.startsWith('/api/')) {
      const lv = level(req, url);
      if (!lv) return send(res, 401, { error: 'a view or edit token is needed' });
      if (p === '/api/version' && req.method === 'GET') return send(res, 200, { version: state.version, updated: state.updated, level: lv });
      /* The weather at the circuit, for the board on Where we are. Andrew Fisher, 12 Sep 2026: "be good to have
         the updated weather and wind conditions i have an account with weatherapi.com."

         THE KEY LIVES HERE AND NOWHERE ELSE. It is the environment variable WEATHERAPI_KEY, set by Andrew on
         Railway — it is never written into the page, never sent to a browser, and never appears in a log or an
         error. This endpoint fetches the reading, hands back only the few fields the board shows, and caches it
         for ten minutes so a room full of phones is one call. With no key set it answers 503 and says so in
         words, and the board then shows nothing in place of a temperature. */
      /* The live map's key (v5.51). Andrew Fisher, 18 Sep 2026: he has a Mapbox account — and then the token,
         a PUBLIC one (pk.) restricted in Mapbox's console to this service's address, so it draws a map from here
         and from nowhere else. It is the environment variable MAPBOX_TOKEN, set by Andrew on Railway. Unlike the
         weather key it is handed to the browser on purpose: the map tiles are fetched by the phone straight from
         Mapbox, which is what a public token is for, and the URL restriction is what keeps it ours. Behind the
         link token like the rest of the API, so the address alone gives a stranger nothing. A secret token (sk.)
         is never handed out, whatever the variable holds. */
      if (p === '/api/map-key' && req.method === 'GET') {
        /* v5.78 — the Google browser key rides in the same answer (GOOGLE_MAPS_KEY, Andrew Fisher, 25 Sep 2026). Each key is
           handed out only when it looks like the public kind it must be; a wrong-looking one is named, never handed out. */
        const tok = String(process.env.MAPBOX_TOKEN || '').trim(), gk = String(process.env.GOOGLE_MAPS_KEY || '').trim();
        const okTok = /^pk\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{16,}$/.test(tok), okG = /^AIza[0-9A-Za-z_-]{30,}$/.test(gk);
        if (!tok && !gk) return send(res, 404, { error: 'no live map key is set on this service' }, { 'Cache-Control': 'no-store' });
        if (tok && !okTok && !okG) return send(res, 503, { error: 'the live map key on this service is not a Mapbox public token (pk.) — nothing handed out' }, { 'Cache-Control': 'no-store' });
        const out = { provider: 'mapbox', restrictedTo: 'the address list on the token in the Mapbox console' };
        if (okTok) out.token = tok; else if (tok) out.mapbox_error = 'MAPBOX_TOKEN is not a public (pk.) token — nothing handed out';
        if (okG) out.google = { key: gk, restrictedTo: 'the address list on the key in Google Cloud' }; else if (gk) out.google_error = 'GOOGLE_MAPS_KEY is not a browser key (AIza…) — nothing handed out';
        return send(res, 200, out, { 'Cache-Control': 'private, max-age=300' });
      }
      if (p === '/api/weather/forecast' && req.method === 'GET') {
        /* v5.83 — the forecast for the day cards (Andrew Fisher, 26 Sep 2026). Same key, same token rule, same
           silence about upstream error text. One trimmed row per day; nothing is worked out here. */
        const key = process.env.WEATHERAPI_KEY || '';
        if (!key) return send(res, 503, { error: 'no weather key is set on this service yet' }, { 'Cache-Control': 'no-store' });
        const now = Date.now();
        if (forecastCache.at && now - forecastCache.at < FORECAST_TTL && forecastCache.body) {
          return send(res, 200, forecastCache.body, { 'Cache-Control': 'public, max-age=900' });
        }
        const q = process.env.WEATHER_Q || 'Surfers Paradise, Queensland, Australia';
        const u = 'https://api.weatherapi.com/v1/forecast.json?key=' + encodeURIComponent(key) + '&q=' + encodeURIComponent(q) + '&days=7&aqi=no&alerts=no';
        try {
          const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000);
          const r = await fetch(u, { signal: ac.signal });
          clearTimeout(t);
          if (!r.ok) {
            const why = r.status === 401 || r.status === 403 ? 'the weather service refused the key'
                      : 'the weather service answered ' + r.status;
            return send(res, 502, { error: why }, { 'Cache-Control': 'no-store' });
          }
          const j = await r.json();
          const l = (j && j.location) || {}, fd = ((j && j.forecast) || {}).forecastday;
          if (!Array.isArray(fd) || !fd.length) return send(res, 502, { error: 'the weather service answered without a forecast' }, { 'Cache-Control': 'no-store' });
          const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
          const days = fd.map(f => { const d = f.day || {}, a = f.astro || {};
            return { date: f.date || null, code: num((d.condition || {}).code), text: (d.condition || {}).text || null,
                     max_c: num(d.maxtemp_c), min_c: num(d.mintemp_c), avg_c: num(d.avgtemp_c),
                     rain_pc: num(d.daily_chance_of_rain), rain_mm: num(d.totalprecip_mm), wind_kph: num(d.maxwind_kph),
                     humidity: num(d.avghumidity), sunrise: a.sunrise || null, sunset: a.sunset || null }; })
            .filter(d => d.date && d.max_c !== null);
          if (!days.length) return send(res, 502, { error: 'the weather service answered without a reading' }, { 'Cache-Control': 'no-store' });
          const body = { location: { name: l.name || null, region: l.region || null, localtime: l.localtime || null }, days };
          forecastCache = { at: now, body };
          return send(res, 200, body, { 'Cache-Control': 'public, max-age=900' });
        } catch (e) {
          return send(res, 504, { error: 'the weather service did not answer' }, { 'Cache-Control': 'no-store' });
        }
      }
      if (p === '/api/weather' && req.method === 'GET') {
        const key = process.env.WEATHERAPI_KEY || '';
        /* the variable's name stays out of the answer — whoever holds the link is not always whoever runs the
           service. It is in hosting/railway/README.md and in the line the service prints when it starts. */
        if (!key) return send(res, 503, { error: 'no weather key is set on this service yet' }, { 'Cache-Control': 'no-store' });
        const now = Date.now();
        if (weatherCache.at && now - weatherCache.at < WEATHER_TTL && weatherCache.body) {
          return send(res, 200, weatherCache.body, { 'Cache-Control': 'public, max-age=300' });
        }
        const q = process.env.WEATHER_Q || 'Surfers Paradise, Queensland, Australia';
        const u = 'https://api.weatherapi.com/v1/current.json?key=' + encodeURIComponent(key) + '&q=' + encodeURIComponent(q) + '&aqi=no';
        try {
          const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000);
          const r = await fetch(u, { signal: ac.signal });
          clearTimeout(t);
          if (!r.ok) {
            /* never echo the upstream body: it can carry the key back in its error text */
            const why = r.status === 401 || r.status === 403 ? 'the weather service refused the key'
                      : 'the weather service answered ' + r.status;
            return send(res, 502, { error: why }, { 'Cache-Control': 'no-store' });
          }
          const j = await r.json();
          const c = (j && j.current) || {}, l = (j && j.location) || {};
          if (typeof c.temp_c !== 'number') return send(res, 502, { error: 'the weather service answered without a reading' }, { 'Cache-Control': 'no-store' });
          /* only what the board shows — nothing is added, nothing is worked out here */
          const body = { location: { name: l.name || null, region: l.region || null, localtime: l.localtime || null },
                         current: { temp_c: c.temp_c, feelslike_c: c.feelslike_c, condition: { text: (c.condition || {}).text || null },
                                    wind_kph: c.wind_kph, wind_dir: c.wind_dir, gust_kph: c.gust_kph,
                                    humidity: c.humidity, precip_mm: c.precip_mm, is_day: c.is_day,
                                    last_updated: c.last_updated || null } };
          weatherCache = { at: now, body };
          return send(res, 200, body, { 'Cache-Control': 'public, max-age=300' });
        } catch (e) {
          return send(res, 504, { error: 'the weather service did not answer' }, { 'Cache-Control': 'no-store' });
        }
      }
      if (p === '/api/state' && req.method === 'GET') return send(res, 200, { version: state.version, updated: state.updated, level: lv, docs: state.docs });
      if (p === '/api/export' && req.method === 'GET') {
        // the shape the build reads (pipeline/ops_layer.py) — collections folded back the way the page folds them
        const fold = require_fold();
        return send(res, 200, fold(state), { 'Content-Disposition': 'attachment; filename="gc500_record.json"' });
      }
      if ((m = p.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/))) {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view but not change the record' });
        /* v5.58 — while the disk is refusing writes, so does this: the page keeps the change queued and says so */
        if (diskFault) return send(res, 507, { error: 'the service cannot write to its disk right now (' + diskFault.message + ') — your change is kept on this device and will go when it can', version: state.version });
        const coll = decodeURIComponent(m[1]), id = decodeURIComponent(m[2]);
        if (req.method === 'PUT') {
          let body;
          try { body = JSON.parse((await readBody(req, MAX_DOC)).toString('utf8')); } catch (e) { return send(res, 400, { error: 'a JSON object is expected' }); }
          if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'a JSON object is expected' });
          return setDoc(coll, id, body, req.headers['x-gc500-who'] || null) ? send(res, 200, { version: state.version }) : send(res, 400, { error: 'bad path' });
        }
        if (req.method === 'DELETE') return deleteDoc(coll, id, req.headers['x-gc500-who'] || null) ? send(res, 200, { version: state.version }) : send(res, 400, { error: 'bad path' });
      }
      /* drop cards: made by somebody holding the edit link, listed so they can be withdrawn, never readable
         through this API by a view link — a card is handed to a driver, not published to everyone with the link */
      if (p === '/api/cards' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not the drop cards' });
        return send(res, 200, { cards: Object.values(cards).map(cardBrief).sort((a, b) => String(b.created).localeCompare(String(a.created))) });
      }
      /* v5.56 — what the people on the ground have reported back. Behind the EDIT link like the cards
         themselves: a report carries a name somebody typed, photographs of a site and a position, and that is
         not published to everyone holding a view link. The page shows every one of these as reported and
         never as recorded — the separation is kept here as well as there. */
      if (p === '/api/reports' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not the card reports' });
        const tok = url.searchParams.get('token');
        const out = {};
        for (const k of (tok ? [tok] : Object.keys(reports))) {
          if (!reports[k]) continue;
          const c = cards[k] || null;
          out[k] = {
            load: c ? c.load : null, title: c ? c.title : null, run_date: c ? c.run_date : null,
            card_withdrawn: !c, expired: c ? cardExpired(c) : null,
            reports: reports[k].map(r => Object.assign({}, r)),
          };
        }
        return send(res, 200, { reports: out, cards_with_reports: Object.keys(out).length,
                                total: Object.values(out).reduce((n, v) => n + v.reports.length, 0) });
      }
      if (p === '/api/cards' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view but not make drop cards' });
        /* answer an oversized card before reading it: cutting the socket mid-upload leaves the person who pressed
           the button looking at "network error" instead of being told the card is too big */
        const declared = parseInt(req.headers['content-length'] || '0', 10);
        if (Number.isFinite(declared) && declared > MAX_CARD) {
          return send(res, 413, { error: 'that card is ' + Math.round(declared / 1024) + ' KB — the limit is ' + Math.round(MAX_CARD / 1024) + ' KB. Leave the close-up picture off it.' });
        }
        let body;
        try { body = JSON.parse((await readBody(req, MAX_CARD)).toString('utf8')); } catch (e) { return send(res, 400, { error: 'a JSON object is expected, under ' + Math.round(MAX_CARD / 1024) + ' KB' }); }
        if (!body || typeof body !== 'object' || typeof body.html !== 'string' || !body.html.trim()) return send(res, 400, { error: 'a card needs its html' });
        if (body.html.length > MAX_CARD) return send(res, 413, { error: 'that card is bigger than ' + Math.round(MAX_CARD / 1024) + ' KB' });
        const day = /^\d{4}-\d{2}-\d{2}$/;
        if (body.expires != null && !day.test(String(body.expires))) return send(res, 400, { error: 'expires is a day, yyyy-mm-dd' });
        if (body.run_date != null && !day.test(String(body.run_date))) return send(res, 400, { error: 'run_date is a day, yyyy-mm-dd' });
        const token = CARD_TOKEN_RE.test(String(body.token || '')) && cards[body.token] ? String(body.token) : cardToken();
        const prev = cards[token];
        cards[token] = {
          token,
          load: String(body.load == null ? '' : body.load).slice(0, 60),
          title: String(body.title || '').slice(0, 160),
          run_date: body.run_date || null,
          expires: body.expires || null,
          contact: body.contact && typeof body.contact === 'object'
            ? { name: String(body.contact.name || '').slice(0, 80), phone: String(body.contact.phone || '').slice(0, 30) } : null,
          html: body.html,
          /* v5.56 — the references this card's load carries, so a report that comes back off it says which
             things on the job it is about. Checked against the reference shape, never taken as typed. */
          keys: (Array.isArray(body.keys) ? body.keys : [])
            .map(k => String(k).trim().toUpperCase()).filter(k => REF_RE.test(k)).slice(0, 40),
          /* v5.63 — AND THE INDIVIDUAL UNITS, so a reply can name ONE of them.
             keys above are references; a reference can carry two buildings, and until now a card could only
             ever be answered at reference level — which is exactly why "installed" meant both buildings or
             neither. A target is {assetKey, unitKey}; unitKey null explicitly means the whole reference, and
             is never inferred from a blank. Both halves are checked here, against the reference shape and a
             bounded unit, so a card is issued for the targets the editor chose and a reply naming anything
             else is refused by the grant rather than by hope. */
          targets: (Array.isArray(body.targets) ? body.targets : [])
            .map(x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : null).filter(Boolean)
            .map(x => ({ assetKey: String(x.assetKey == null ? '' : x.assetKey).trim().toUpperCase(),
                         unitKey: x.unitKey == null ? null : String(x.unitKey).trim().slice(0, 64) }))
            .filter(x => REF_RE.test(x.assetKey) && (x.unitKey === null || x.unitKey.length > 0))
            .slice(0, 40),
          created: prev ? prev.created : new Date().toISOString(),
          updated: new Date().toISOString(),
          by: String(req.headers['x-gc500-who'] || '').slice(0, 80) || null,
          opens: prev ? (prev.opens || []) : [],
        };
        pruneCards();
        const cerr = persistCards();
        if (cerr) {
          if (prev) cards[token] = prev; else delete cards[token];
          logWrite({ at: new Date().toISOString(), what: 'card NOT SAVED', token, error: cerr.message });
          return send(res, 507, { error: 'the service could not write the card to its disk — nothing was made; try again in a minute' });
        }
        logWrite({ at: new Date().toISOString(), what: prev ? 'card updated' : 'card made', token, load: cards[token].load, by: cards[token].by });
        return send(res, 200, { token, url: '/d/' + token, card: cardBrief(cards[token]) });
      }
      if ((m = p.match(/^\/api\/cards\/([A-Za-z0-9_-]+)$/)) && req.method === 'DELETE') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link cannot withdraw drop cards' });
        if (!cards[m[1]]) return send(res, 404, { error: 'no such card' });
        const gone = cards[m[1]]; delete cards[m[1]];
        const withdrawError = persistCards();
        if (withdrawError) {
          cards[m[1]] = gone;
          logWrite({ at: new Date().toISOString(), what: 'card withdrawal NOT SAVED', token: m[1], error: withdrawError.message });
          return send(res, 507, { error: 'the service could not save the withdrawal — this link is still active; try again when storage is working' });
        }
        logWrite({ at: new Date().toISOString(), what: 'card withdrawn', token: m[1], load: gone.load, by: req.headers['x-gc500-who'] || null });
        return send(res, 200, { withdrawn: m[1] });
      }
      /* texting. The edit link only: a view link can read the record, and that is not the same thing as being
         able to spend money out of Andrew's ClickSend account. */
      if (p === '/api/sms' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not send texts' });
        return send(res, 200, smsBrief(parseInt(url.searchParams.get('n') || '40', 10) || 40));
      }
      if (p === '/api/sms' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not send texts' });
        return smsSend(req, res, String(req.headers['x-gc500-who'] || '').slice(0, 80) || null);
      }
      if (p === '/api/email' && req.method === 'GET') {
        return send(res, 200, { configured: emailReady(), from_id: EMAIL_FROM_ID || null, from_name: EMAIL_FROM_NAME,
          today: emailToday(), at_once: EMAIL_AT_ONCE, max_bytes: EMAIL_MAX_BYTES });
      }
      if (p === '/api/email' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not send email' });
        return emailSend(req, res, String(req.headers['x-gc500-who'] || '').slice(0, 80) || null);
      }
      if (p === '/api/email/addresses' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link cannot see the sending addresses' });
        if (!SMS_USER || !SMS_KEY) return send(res, 501, { error: 'ClickSend is not set up on this server yet.', configured: false });
        try {
          const out = await clicksend('/email/addresses', {});
          const d = (out.json && out.json.data) || {};
          const rows = (d.data || d || []).map ? (d.data || []) : [];
          return send(res, out.status === 200 ? 200 : 502, { http: out.status,
            addresses: (Array.isArray(rows) ? rows : []).map(r => ({ id: r.email_address_id, email: r.email_address, verified: !!r.verified })),
            says: (out.json && out.json.response_msg) || out.text || null });
        } catch (e) { return send(res, 502, { error: 'could not reach ClickSend: ' + (e && e.message) }); }
      }
      if (p === '/api/sms/account' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link cannot see the texting account' });
        if (!smsReady()) return send(res, 501, { error: 'Texting is not set up on this server yet.', configured: false });
        try {
          const out = await clicksend('/account', {});
          const d = (out.json && out.json.data) || {};
          return send(res, out.status === 200 ? 200 : 502, { http: out.status, balance: d.balance == null ? null : d.balance,
            currency: d.currency && (d.currency.currency_code || d.currency) || null, username: d.username || null,
            says: (out.json && out.json.response_msg) || out.text || null });
        } catch (e) {
          return send(res, 502, { error: 'could not reach ClickSend: ' + (e && e.message) });
        }
      }
      if ((m = p.match(/^\/api\/files\/([^/]+)\/thumb$/)) && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required to make previews' });
        return uploadThumbnail(req, res, decodeURIComponent(m[1]));
      }
      if (p === '/api/files' && req.method === 'GET') return send(res, 200, listFiles());
      if (p === '/api/files' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view but not add files' });
        return uploadFile(req, res);
      }
      if ((m = p.match(/^\/api\/files\/([^/]+)$/)) && req.method === 'DELETE') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link cannot remove files' });
        return deleteFile(res, decodeURIComponent(m[1]), req.headers['x-gc500-who'] || null);
      }
      /* PUTTING A FILE IN THE RIGHT DRAWER WITHOUT SENDING IT AGAIN. Andrew Fisher, 15 Sep 2026: "i added the
         fencing dockets as other in admin nothing matching." The bytes were right; only the Kind box was wrong,
         and re-uploading fifteen photographs to fix a dropdown is work nobody should do. The file itself is
         untouched — this changes one word on its card and writes it to the log like every other change. */
      if ((m = p.match(/^\/api\/files\/([^/]+)\/kind$/)) && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link cannot re-file documents' });
        return refileFile(req, res, decodeURIComponent(m[1]), req.headers['x-gc500-who'] || null);
      }
      /* what a photo or an invoice can be filed against, as the uploaded page lists them — so a form anywhere
         (the admin page, the page's own Documents tab, the command line) offers the same choices */
      if (p === '/api/files/filing' && req.method === 'GET') return send(res, 200, { kinds: [...FILE_KINDS], refs: appRefs() || [], branches: appBranches(), from_build: (appMeta() || {}).build_version || null });
      /* v5.77 — the machine: what is on this service (either link), and the import (edit link only) */
      if (p === '/api/machine' && req.method === 'GET') return send(res, 200, machineStatus());
      if (p === '/api/admin/machine' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return send(res, 200, machineInventory());
      }
      if (p === '/api/admin/machine/manifest' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return registerMachine(req, res);
      }
      if ((m = p.match(/^\/api\/admin\/machine\/blob\/([a-f0-9]{64})$/)) && req.method === 'PUT') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return uploadMachineBlob(req, res, m[1]);
      }
      if (p === '/api/admin/media' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return send(res, 200, mediaInventory());
      }
      if (p === '/api/admin/media/manifest' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return registerMedia(req, res);
      }
      if ((m = p.match(/^\/api\/admin\/media\/([^/]+)$/)) && req.method === 'PUT') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return uploadMedia(req, res, decodeURIComponent(m[1]));
      }
      if (p === '/api/admin/app' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return uploadApp(req, res);
      }
      return send(res, 404, { error: 'no such call' });
    }
    return send(res, 404, page('Not found', '<p>Nothing here.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: 'server error' });
  }
});

/* The record, folded back into the export shape the page and the build share. Kept in step with the page's
   SYNC_COLLS: map collections carry the key in _k, value collections carry {_k, v}, lists carry their id in _k. */
function require_fold() {
  return st => {
    const docs = st.docs || {};
    const strip = d => { const o = Object.assign({}, d); delete o._k; return o; };
    const map = c => { const o = {}; Object.values(docs[c] || {}).forEach(d => { if (d && d._k != null) o[d._k] = strip(d); }); return o; };
    const val = c => { const o = {}; Object.values(docs[c] || {}).forEach(d => { if (d && d._k != null) o[d._k] = d.v; }); return o; };
    const list = c => Object.values(docs[c] || {}).filter(d => d && d._k != null).map(strip);
    const q = (docs.fenceQuote || {}).quote;
    const records = { schema: 'gc500-as-supplied-1', operator: null, added: list('added'), accessories: val('accessories'), notes: val('notes'),
      assetNumbers: val('assetNumbers'), rates: val('rates'), accRates: val('accRates'), fenceRates: val('fenceRates'), fenceCosts: val('fenceCosts'), weeks: val('weeks'), stamps: val('stamps'), supplied: map('supplied'),
      variances: list('variances'), fenceDockets: list('fenceDockets'), fenceQuote: q ? strip(q) : null, fenceDone: map('fenceDone'),
      breakdowns: list('breakdowns'), delivery: map('delivery'), contracts: map('contracts'), rental: val('rental'),
      branch: val('branch'), loads: map('loads'), costs: list('costs'), purchaseOrders: map('purchaseOrders'),
      /* Where a thing goes when somebody types over the schedule's wording, and the asset numbers taken off.
         `deleted` was written out as an empty object here, which meant a number taken off on a phone came back
         the moment the record went round through this export; `locations` was not folded at all. Both travel
         now, the same way every other value collection does. */
      locations: val('locations'), deleted: val('deleted'),
      /* And what a thing IS when somebody types over the schedule's wording — the other half of the same pair
         as `locations`, and folded the same way, so a description typed on a phone survives the round trip. */
      descs: val('descs'),
      /* v5.22, the master edit: the item type and the quantity typed over the schedule's (value maps keyed by
         reference, like descs) and everything set aside with a way back (keyed by the record's own id). */
      items: val('items'), qtys: val('qtys'), aside: val('aside'),
      /* v5.24: a record moved to another reference, the day a hire is charged from, a map attached to a reference */
      moves: val('moves'), hireStart: val('hireStart'), mapRef: val('mapRef'), fixes: val('fixes'),
      /* v5.54/v5.55: the way IN to a drop, and a position put there from outside. A fix says where the thing
         is; an entry says where to turn in; a place is a position somebody set without standing at it. All
         three are value maps keyed the same way and fold identically. Missing from here meant an entry pin and
         a placed position synced between phones and then vanished from the service's export and from any
         record made off it. Andrew Fisher, 21 Sep 2026: "If something is placed. Its to be placed." */
      entries: val('entries'), places: val('places'),
      /* v5.53: a reference given to a schedule row carried under its task id — keyed by the task id */
      givenRefs: val('givenRefs'),
      /* v5.38: labour ticked per piece of equipment (keyed "REF|discipline|item|line") and hours over the event
         (keyed "role|day") — Andrew Fisher, 17 Sep 2026. Value maps, folded like weeks and hireStart. */
      labour: val('labour'), eventHours: val('eventHours'), minDays: val('minDays'),
      /* and who set each stamped field — keyed exactly as `stamps` is, folded so a name survives the round trip */
      by: val('by'),
      /* What somebody has to do, and who has to do it — a list, the same as the breakdowns. */
      actions: list('actions'),
      /* The photographs taken at a drop — pointers into this service's own document library, keyed by GC500
         reference. The bytes live under /data/files and are served from /f/<token>/<id>; what travels in the
         record is only {id, name, slot, by, at, caption}. Folded here so a photograph survives an export and
         the round trip back through gc500ctl restore. */
      dropPhotos: map('dropPhotos'),
      /* The things inside a reference, keyed by reference: the eight VMS boards on T0001 with their own names,
         their own asset numbers and the numbered place each stands at. Folded here so the join survives an
         export and the round trip back through gc500ctl restore. */
      units: map('units'),
      /* The signed fencing hire agreement attached to its docket, keyed by docket id. Folded here so the
         paper behind a quantity survives an export and the round trip back through gc500ctl restore. */
      docketPapers: map('docketPapers') };
    return { schema: 'gc500-as-supplied-1', _about: 'Exported from the hosted record. Drop this into sources/ops/as_supplied.json and rebuild.',
      committed_by: null, committed_on: new Date().toISOString().slice(0, 10), exported: new Date().toISOString(), source: 'hosted record v' + st.version,
      supplied: records.supplied, variances: records.variances, delivery: records.delivery, fence_dockets: records.fenceDockets,
      fence_quote: records.fenceQuote, breakdowns: records.breakdowns, fence_done: records.fenceDone,
      contracts: records.contracts, rental: records.rental, branch: records.branch, loads: records.loads,
      costs: records.costs, purchaseOrders: records.purchaseOrders,
      locations: records.locations, descs: records.descs, items: records.items, qtys: records.qtys, aside: records.aside,
      moves: records.moves, hireStart: records.hireStart, mapRef: records.mapRef, fixes: records.fixes, givenRefs: records.givenRefs,
      labour: records.labour, eventHours: records.eventHours, minDays: records.minDays,
      by: records.by, deleted: records.deleted, actions: records.actions,
      dropPhotos: records.dropPhotos, units: records.units, docketPapers: records.docketPapers, records };
  };
}

server.listen(PORT, () => console.log('GC500 hosted record on :' + PORT + ' · ' + BUILD + ' · data in ' + DATA_DIR
  + ' · records v' + state.version + ' · files ' + Object.keys(files).length
  + ' · drop cards ' + Object.keys(cards).length + ' (' + Object.values(cards).filter(c => !cardExpired(c)).length + ' live)'
  + ' · texting ' + (smsReady() ? ('on, ' + SMS_CAP + ' a day' + (SMS_FROM ? ', from ' + SMS_FROM : '')) : 'not set up')
  /* never the key, only whether one is there — the deploy log is read by whoever can see the project */
  + ' · weather ' + (process.env.WEATHERAPI_KEY ? ('on, ' + (process.env.WEATHER_Q || 'Surfers Paradise, Queensland, Australia')) : 'off — set WEATHERAPI_KEY to turn it on')
  + ' · live map ' + (/^pk\./.test(String(process.env.MAPBOX_TOKEN || '')) ? 'on (Mapbox public token)' : process.env.MAPBOX_TOKEN ? 'OFF — MAPBOX_TOKEN is not a public (pk.) token' : 'off — set MAPBOX_TOKEN to turn it on')
  /* v5.78 — never the key, only whether one is there */
  + ' · 3D satellite ' + (/^AIza[0-9A-Za-z_-]{30,}$/.test(String(process.env.GOOGLE_MAPS_KEY || '')) ? 'on (Google browser key from GOOGLE_MAPS_KEY)' : process.env.GOOGLE_MAPS_KEY ? 'OFF — GOOGLE_MAPS_KEY is not a browser key (AIza…)' : 'off — set GOOGLE_MAPS_KEY, or paste the key on About')));
