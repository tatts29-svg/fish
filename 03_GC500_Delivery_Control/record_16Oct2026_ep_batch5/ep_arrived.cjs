#!/usr/bin/env node
/* Author: Andrew Fisher. Event Portables FWF units arrived and installed on a reference, recorded through the page's
   own controls exactly as the 14 Oct 2026 operation did (record_14Oct2026_event_portables): one unit identity record
   per number (unit925Save, the drawer's own save, after its clash checks), the supplied count (setSupplied), the
   install tick (setLabour), the delivery date (setDate) and the complete tick (setDone, which also sets the light
   green, on site).

     node ep_arrived.cjs                 DRY RUN (default): the page is opened read-only through the harness, every write
                                         it tries is ABORTED, and the script prints what --apply would send.
     node ep_arrived.cjs --apply         needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA in the environment.
     options: --spec <file> (default ep_spec.json beside this script)

   Spec: {"day": "2026-10-16", "by": "Andrew Fisher", "owner": "event-portables", "item": "FWF", "partial": false,
          "rows": [{"ref": "WC29", "numbers": ["0598", ...]}, {"ref": "WC28", "numbers": ["0102"]}]}.
   The count of numbers must equal the reference's FWF quantity (with "partial": true, fewer: the units and the
   supplied count go on and nothing is ticked). A row with "topup": true completes a reference that already carries
   units from an earlier partial arrival: its existing units plus these numbers must equal the quantity, the supplied
   count becomes the total, and the install, date and complete ticks go on. A row with "over": true and a "note" may
   carry MORE units than the schedule asks (the person counted them on site): all go on, the supplied count is the real
   total, and the note goes on the delivery record. No number may already be active anywhere.

   --apply, in order: before snapshot of GET /api/state (kept beside this script as the backup) -> the public page's
   sha256 must equal GC500_EXPECTED_PAGE_SHA -> Chromium opens /e/<key>#plant with the sender held and a write gate
   that aborts every non-GET not on the plan -> the startup queue must be empty or no-ops -> the stage -> the queued
   writes must all be documents about these references (unit records, supplied, labour, delivery, their stamps and
   by), none removed -> release the sender, allow exactly those PUTs once each -> settle (90 s) -> GET /api/state
   again -> verify and report_<UTC>.json. The key is never printed, logged or stored. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'ep_spec.json');
const token = process.env.GC500_EDIT_TOKEN || '', expectedSha = process.env.GC500_EXPECTED_PAGE_SHA || '';
const redact = s => token ? String(s).split(token).join('[key]') : String(s);
const canon = x => JSON.stringify((function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; })(x));
const same = (a, b) => canon(a) === canon(b);
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const utc = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const log = (...a) => console.log(...a.map(redact));
const fail = m => { throw new Error(redact(m)); };

// ---------------------------------------------------------------------------------------------- the spec
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
if (!/^\d{4}-\d{2}-\d{2}$/.test(spec.day || '')) fail('spec.day must be the arrival day, YYYY-MM-DD');
if (!Array.isArray(spec.rows) || !spec.rows.length) fail('spec.rows must list the references and their numbers');
const seenNo = new Set();
spec.rows.forEach(r => { if (!/^[A-Z]{1,3}[0-9]+$/.test(r.ref || '')) fail('a row needs a reference like WC29 or PG03'); if (r.moved_from && !/^[A-Z]{1,3}[0-9]+$/.test(r.moved_from)) fail(r.ref + ': moved_from must be a reference'); if (!Array.isArray(r.numbers) || !r.numbers.length) fail(r.ref + ' needs its numbers'); r.numbers.forEach(n => { if (!/^[0-9]{4}$/.test(n)) fail(r.ref + ': ' + n + ' is not a four-digit Event Portables number'); if (seenNo.has(n)) fail('duplicate number ' + n); seenNo.add(n); }); });
if (spec.owner !== 'event-portables') fail('spec.owner must be event-portables');
if (spec.item !== 'FWF') fail('spec.item must be FWF');
if (typeof spec.by !== 'string' || !spec.by.trim()) fail('spec.by must be a name');
if (/\bvia\b/i.test(spec.by)) fail('spec.by must be the person, with no agent suffix');
const PARTIAL = !!spec.partial; const TOPUP = new Set(spec.rows.filter(r => r.topup).map(r => r.ref)); if (PARTIAL && TOPUP.size) fail('partial and topup do not mix'); /* fewer numbers than the reference asks: the units and the supplied count go on, nothing is ticked complete */
const REVERT = spec.revert_from || null; if (REVERT && (!/^[A-Z]{1,3}[0-9]+$/.test(REVERT.ref || '') || !Number.isInteger(REVERT.supplied) || !REVERT.why)) fail('revert_from needs ref, supplied and why');
const ROWS = spec.rows, REFS = [...new Set(ROWS.map(r => r.ref).concat(ROWS.map(r => r.moved_from).filter(Boolean)).concat(REVERT ? [REVERT.ref] : []))], REF = REFS.join('+'), NOTE = 'Arrival and installation confirmed by ' + spec.by + ', ' + (d => `${d.getUTCDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]} ${d.getUTCFullYear()}`)(new Date(spec.day + 'T00:00:00Z')) + '.';
const ALLOWED_COLLS = new Set(['loads', 'stamps', 'by', 'supplied', 'labour', 'delivery']);
spec.rows.forEach(r => { if (r.over && (typeof r.note !== 'string' || !r.note.trim())) fail(r.ref + ': over needs a note'); });
const docIdDecode = id => String(id).replace(/~2f~/g, '/').replace(/~7c~/g, '|').replace(/~20~/g, ' ').replace(/~26~/g, '&');
const allowed = k => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (!ALLOWED_COLLS.has(c)) return false; const d = docIdDecode(id); if (d.indexOf('unit925/') === 0 || d.indexOf('loads/unit925/') === 0) return true; return REFS.some(r => d === r || d.indexOf(r + '|') === 0 || d.indexOf('/' + r + '|') >= 0 || d.indexOf('/' + r + '/') >= 0 || d === 'delivery/' + r || d === 'dnote/' + r || d === 'supplied/' + r || d.indexOf('supplied/' + r + '/') === 0); };

// ---------------------------------------------------------------------------------------------- curl with headers on stdin
let seq = 0;
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
function curlGet(url, headers) {
  const tmp = path.join(os.tmpdir(), 'gc500-ep-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
  const cfg = ['url = ' + quote(url), 'silent', 'show-error', 'compressed', 'max-time = 180', 'dump-header = ' + quote(hf), 'output = ' + quote(bf)];
  for (const [k, v] of Object.entries(headers || {})) cfg.push('header = ' + quote(k + ': ' + v));
  return new Promise((resolve, reject) => {
    const c = spawn('curl', ['--config', '-'], {stdio: ['pipe', 'ignore', 'pipe']}); let err = '';
    c.stderr.on('data', d => err += d); c.on('error', reject);
    c.on('close', code => {
      try {
        if (code) return reject(new Error(redact(err) || 'curl failed'));
        const blocks = fs.readFileSync(hf, 'utf8').split(/\r?\n\r?\n/).filter(x => /^HTTP\//.test(x));
        const status = Number((blocks.at(-1) || 'HTTP/1.1 0').split(/\r?\n/)[0].split(' ')[1]);
        resolve({status, body: fs.readFileSync(bf)});
      } catch (e) { reject(e); } finally { fs.rmSync(hf, {force: true}); fs.rmSync(bf, {force: true}); }
    });
    c.stdin.end(cfg.join('\n') + '\n');
  });
}
async function publicState() {
  const r = await curlGet(HOST + '/api/state', {'x-gc500-token': VIEW_TOKEN, 'cache-control': 'no-cache'});
  if (r.status !== 200) fail('GET /api/state answered ' + r.status);
  const s = JSON.parse(r.body); if (!s || typeof s.version !== 'number' || !s.docs || typeof s.docs !== 'object') fail('/api/state is not a record');
  return s;
}
function playwright() { try { return require(path.join(TOOLCHAIN, 'node_modules', 'playwright')); } catch (_) { return require('playwright'); } }

// ---------------------------------------------------------------------------------------------- functions run INSIDE the page
function pageReady() { return typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length; }
function pageHasControls() {
  const missing = ['assetOf', 'gcModel925', 'unit925Save', 'setDeliveryNote', 'setSupplied', 'setLabour', 'setDate', 'setDone', 'deliveryOf', 'chargeLines', 'qtyOf', 'labourKey', 'isRef', 'whoAmI', 'mayWrite', 'capability', 'toDocs', 'fromDocs', 'syncStage', 'syncSend', 'syncWaiting', 'persist'].filter(f => typeof window[f] !== 'function');
  return {missing, hasS: typeof S === 'object' && !!S, hasColls: typeof SYNC_COLLS === 'object', level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status};
}
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot(spec) {
  const one = ref => { const a = assetOf(ref); if (!a) return null; const d = deliveryOf(ref), l = chargeLines(a).find(x => x.item === 'FWF');
    return {name: a.name, plan: a.first_date || null, asked: l ? qtyOf(l) : null, single: chargeLines(a).every(x => x.item === 'FWF'), fwf: gcModel925(a, {loading: false}).rows.filter(r => r.source !== 'history' && r.active !== false && r.item === 'FWF').map(r => r.assetNo + '/' + r.owner), lines: chargeLines(a).map(x => x.item + ' × ' + qtyOf(x)), units: gcModel925(a, {loading: false}).rows.filter(r => r.source !== 'history' && r.active !== false).map(r => r.assetNo + '/' + r.owner),
      supplied: (S.supplied || {})[ref] || null, install: !!(S.labour || {})[labourKey(ref, 'Toilets & amenities', 'FWF', 'install')], light: d.state, done: !!d.done, date: ((S.delivery || {})[ref] || {}).date || null}; };
  const taken = new Set(); allAssets().forEach(a => { if (a._cancelled || movedAway(a.key)) return; gcModel925(a, {loading: false}).rows.forEach(u => { if (u.active !== false && u.source !== 'history' && u.assetNo) taken.add(a.key + '/' + u.assetNo); }); });
  return JSON.parse(JSON.stringify({
    operator: S.operator || null, today: todayIso(),
    refs: Object.fromEntries(spec.refs.map(r => [r, one(r)])),
    taken: spec.numbers.map(n => [...taken].filter(t => t.endsWith('/' + n))).flat(),
    queue: Object.fromEntries(Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length)),
    inflight: Object.keys(SYNC.inflight || {}), waiting: syncWaiting(), status: SYNC.status, level: SYNC.level, readonly: SYNC.readonly
  }));
}
function holdSender() {
  if (typeof syncSend !== 'function') throw new Error('syncSend missing');
  if (!window.__heldSend) { window.__heldSend = syncSend; syncSend = function () { clearTimeout(SYNC.timer); SYNC.timer = null; syncStage(); }; }
  return true;
}
function releaseSender() { if (!window.__heldSend) throw new Error('sender was not held'); syncSend = window.__heldSend; delete window.__heldSend; syncSend(); return true; }
function alignStartupQueue(serverDocs) {
  const canon = x => JSON.stringify((function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; })(x));
  if (!window.__heldSend || Object.keys(SYNC.inflight || {}).length) throw new Error('the sender is not held, or a write is already in flight');
  syncStage();
  const restored = [], differing = [];
  for (const [name, q] of Object.entries(SYNC.queue || {})) {
    if (!Object.keys(q).length) continue;
    const original = serverDocs[name] || {};
    for (const [id, body] of Object.entries(q)) if (body === null || canon(body) !== canon(original[id])) differing.push(name + '/' + id);
    if (differing.length) continue;
    if (canon(toDocs(name)) !== canon(original)) { differing.push(name + ' (collection differs in value)'); continue; }
    SYNC_COLLS[name].set(fromDocs(name, JSON.parse(JSON.stringify(original)))); restored.push(name);
  }
  if (differing.length) throw new Error('startup queue holds real changes, not no-ops: ' + differing.join(', '));
  if (restored.length) { if (!persist() || SYNC.unkept) throw new Error('could not persist the realigned record'); syncStage(); }
  const left = Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length).map(([n]) => n);
  if (left.length) throw new Error('queue still holds: ' + left.join(', '));
  return {restored};
}
function applyOps(spec) {
  const dry = !!spec.dry; /* a read-only run: the harness aborts every write, so the page is told it may edit */
  if (dry) { capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; }
  S.operator = spec.by;
  const who = whoAmI(); if (who !== spec.by) throw new Error('whoAmI() did not return ' + spec.by);
  if (!mayWrite('unit identification')) throw new Error('mayWrite() is false - this is not an edit link');
  const out = [];
  spec.rows.forEach(p => {
    if (!isRef(p.ref)) throw new Error(p.ref + ' is not a reference on the page');
    const a = assetOf(p.ref), l = chargeLines(a).find(x => x.item === 'FWF');
    const have = gcModel925(a, {loading: false}).rows.filter(r => r.source !== 'history' && r.active !== false && r.item === 'FWF').length, total = have + p.numbers.length;
    if (!l || (spec.partial ? !(p.numbers.length < qtyOf(l)) : (p.over ? !(total > qtyOf(l)) : qtyOf(l) !== total))) throw new Error(p.ref + ': the FWF quantity is ' + (l ? qtyOf(l) : 'none') + ', not ' + total + ' (' + have + ' already on, ' + p.numbers.length + ' now) - nothing done');
    if (have && !p.topup) throw new Error(p.ref + ' already carries ' + have + ' units - a row needs topup: true to complete it');
    if (p.over) { if (!p.note) throw new Error(p.ref + ': an over-supply row needs its note'); if (setDeliveryNote(p.ref, p.note) === false) throw new Error(p.ref + ': note refused'); out.push({ref: p.ref, note: p.note}); }
    const single = chargeLines(a).every(x => x.item === 'FWF');
    if (p.moved_from) { const fa = assetOf(p.moved_from); if (!fa) throw new Error(p.moved_from + ' is not on the page'); p.numbers.forEach(no => { const u = gcModel925(fa, {loading: false}).rows.find(r => r.source !== 'history' && r.active !== false && r.assetNo === no && r.owner === spec.owner); if (!u) throw new Error(no + ' is not on ' + p.moved_from); const rm = UnitIdentity1006.remove(p.moved_from, u.id, UnitIdentity1006.token(u)); if (!rm || !rm.ok) throw new Error(p.moved_from + ' ' + no + ': ' + (rm && rm.reason)); out.push({ref: p.moved_from, removed: no}); }); }
    p.numbers.forEach(no => { const r = unit925Save(p.ref, {item: 'FWF', owner: spec.owner, assetNo: no, label: 'FWF', branch: '', note: spec.note, sourceKey: ''}, '', 'null', ''); if (!r || !r.ok || r.kept === false) throw new Error(p.ref + ' ' + no + ': ' + (r && r.reason)); out.push({ref: p.ref, unit: no, key: r.key || null}); });
    if (setSupplied(p.ref, 'FWF', {supplied: 'FWF', qty_supplied: total}) === false) throw new Error(p.ref + ': supplied refused'); out.push({ref: p.ref, supplied: total});
    if (spec.partial) { out.push({ref: p.ref, complete: false, why: p.numbers.length + ' of ' + qtyOf(l) + ' - a partial arrival, nothing ticked'}); return; }
    if (!setLabour(p.ref, 'Toilets & amenities', 'FWF', 'install', true)) throw new Error(p.ref + ': install tick refused'); out.push({ref: p.ref, install: true});
    if (single) { if (!setDate(p.ref, spec.day, 'in')) throw new Error(p.ref + ': date refused'); if (!setDone(p.ref, true)) throw new Error(p.ref + ': complete refused'); out.push({ref: p.ref, date: spec.day, complete: true, plan: a.first_date || null}); }
    else out.push({ref: p.ref, complete: false, why: 'the reference carries other items too - the complete tick is left for the person'});
  });
  if (spec.revert) { const v = spec.revert, a = assetOf(v.ref); if (!a) throw new Error(v.ref + ' is not on the page');
    const left = gcModel925(a, {loading: false}).rows.filter(r => r.source !== 'history' && r.active !== false && r.item === 'FWF').length; if (left !== v.supplied) throw new Error(v.ref + ' carries ' + left + ' FWF units after the move, not ' + v.supplied);
    if (setSupplied(v.ref, 'FWF', {supplied: 'FWF', qty_supplied: v.supplied}) === false) throw new Error(v.ref + ': supplied refused');
    if (!setLabour(v.ref, 'Toilets & amenities', 'FWF', 'install', false)) throw new Error(v.ref + ': install untick refused');
    if (!setDone(v.ref, false)) throw new Error(v.ref + ': complete untick refused');
    if (!setDate(v.ref, '', 'in')) throw new Error(v.ref + ': date reset refused');
    if (setDeliveryNote(v.ref, v.note || '') === false) throw new Error(v.ref + ': note refused');
    out.push({ref: v.ref, reverted: true, supplied: v.supplied, why: v.why}); }
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); } /* the dry run sends NOW, inside the poll window, so the aborted PUT is seen */
  return out;
}

// ---------------------------------------------------------------------------------------------- the run
(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`ep_arrived ${applying ? 'APPLY' : 'DRY RUN'} - ${ROWS.map(r => r.ref + ': ' + r.numbers.join(', ')).join('; ')} (${spec.owner}, ${spec.item}, ${spec.day}) - by ${spec.by}`);
    const before = await publicState();
    log(`before: record version ${before.version} updated ${before.updated}`);
    if (applying) { const bk = path.join(HERE, 'backup_state_' + started + '.json'); fs.writeFileSync(bk, JSON.stringify(before, null, 1) + '\n', {mode: 0o600}); log('backup of the whole record before: ' + bk); }
    const unitDocs = docs => Object.entries(docs.loads || {}).filter(([k, v]) => k.startsWith('unit925~2f~') && v && REFS.includes(v.ref)).map(([k, v]) => ({key: k, ref: v.ref, assetNo: v.assetNo, owner: v.owner, active: v.active !== false}));
    REFS.forEach(r => { const d = (before.docs.delivery || {})[r] || {}; log(`  ${r}: light ${d.state || 'none'} · done ${d.done ?? null} · supplied ${JSON.stringify((before.docs.supplied || {})[r] || null)} · units ${JSON.stringify(unitDocs(before.docs).filter(u => u.ref === r && u.active).map(u => u.assetNo))}`); });
    const ALLNO = ROWS.flatMap(r => r.numbers);
    const everywhere = []; for (const [k, v] of Object.entries(before.docs.loads || {})) if (k.startsWith('unit925~2f~') && v && v.active !== false && ALLNO.includes(v.assetNo) && v.owner === spec.owner && !ROWS.some(r => r.moved_from === v.ref && r.numbers.includes(v.assetNo))) everywhere.push(v.ref + '/' + v.assetNo);
    log(`  these numbers active on the record already: ${everywhere.length ? everywhere.join(', ') : 'none'}`);
    if (everywhere.length) fail('a number is already active elsewhere - nothing done');

    let page, harness = null;
    const counts = {blocked: 0, mapSessions: 0}, refused = [], sent = new Set(), acks = new Map(); let writesAllowed = false, expected = new Map(), fatal = null, injected = false;
    const stop = m => { writesAllowed = false; if (!fatal) fatal = new Error(redact(m)); };

    if (applying) {
      if (!token) fail('GC500_EDIT_TOKEN is not set - nothing applied');
      if (!/^[a-f0-9]{64}$/.test(expectedSha)) fail('GC500_EXPECTED_PAGE_SHA must be the 64-hex sha256 of the public page the operator reviewed');
      const live = await curlGet(HOST + '/v/' + VIEW_TOKEN, {'cache-control': 'no-cache'});
      if (live.status !== 200) fail('public page answered ' + live.status);
      const got = sha256(live.body);
      if (got !== expectedSha) fail('the public page is ' + got + ', not the reviewed ' + expectedSha + ' - nothing applied');
      log(`public page sha256 ${got} matches (${live.body.length} bytes)`);
      const {chromium} = playwright();
      const launch = {args: ['--no-sandbox', '--lang=en-AU']}; if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
      browser = await chromium.launch(launch);
      const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
      page = await ctx.newPage();
      page.on('pageerror', e => stop('page error: ' + e.message));
      await ctx.route('**/*', async route => {
        const req = route.request(), url = req.url(), method = req.method();
        if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
        let u; try { u = new URL(url); } catch (_) { return route.abort(); }
        if (method === 'GET') {
          if (u.origin === HOST && u.pathname === '/api/state' && !injected) { injected = true; try { await page.evaluate(holdSender); } catch (e) { stop('could not hold the page sender: ' + e.message); return route.abort(); } }
          return route.continue();
        }
        if (method === 'POST' && u.origin === 'https://tile.googleapis.com' && u.pathname === '/v1/createSession') { counts.mapSessions++; return route.abort(); }
        const m = u.origin === HOST && u.pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/);
        if (!m || (method !== 'PUT' && method !== 'DELETE')) { counts.blocked++; refused.push({method, path: u.pathname}); stop('unexpected write ' + method + ' ' + u.pathname); return route.abort(); }
        const key = decodeURIComponent(m[1]) + '/' + decodeURIComponent(m[2]);
        if (method === 'DELETE' && expected.get(key) !== 'null') { counts.blocked++; refused.push({method, key}); stop('removal outside the plan: ' + key); return route.abort(); }
        let body = null; try { body = method === 'DELETE' ? null : JSON.parse(req.postData() || 'null'); } catch (_) { body = undefined; }
        if (!writesAllowed || !expected.has(key) || (method === 'PUT' && canon(body) !== expected.get(key))) { counts.blocked++; refused.push({method, key}); stop('write outside the plan: ' + key); return route.abort(); }
        if (sent.has(key)) { counts.blocked++; refused.push({method, key, retry: true}); stop('automatic retry refused: ' + key); return route.abort(); }
        sent.add(key); return route.continue();
      });
      page.on('response', r => { const q = r.request(); if (q.method() !== 'PUT' && q.method() !== 'DELETE') return; const m = new URL(r.url()).pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/); if (m) acks.set(decodeURIComponent(m[1]) + '/' + decodeURIComponent(m[2]), r.status()); });
      await page.goto(HOST + '/e/' + token + '#plant', {waitUntil: 'load', timeout: 180000});
    } else {
      let pageFile = argValue('--page') || process.env.PAGE || null;
      if (!pageFile) {
        pageFile = tempPage = path.join(os.tmpdir(), 'gc500-live-page-' + process.pid + '.html');
        const live = await curlGet(HOST + '/v/' + VIEW_TOKEN, {'cache-control': 'no-cache'});
        if (live.status !== 200) fail('public page answered ' + live.status);
        fs.writeFileSync(pageFile, live.body); log(`dry run page: the live page fetched now (${live.body.length} bytes, sha256 ${sha256(live.body)})`);
      } else log(`dry run page: ${pageFile} (${fs.statSync(pageFile).size} bytes, sha256 ${sha256(fs.readFileSync(pageFile))})`);
      const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
      harness = await open({pageFile, hash: '#plant'}); browser = harness.browser; page = harness.page;
    }

    await page.waitForFunction(pageReady, null, {timeout: 180000});
    if (fatal) throw fatal;
    const controls = await page.evaluate(pageHasControls);
    if (controls.missing.length || !controls.hasS || !controls.hasColls) fail('page controls missing: ' + controls.missing.join(', '));
    log(`page live: level ${controls.level}, readonly ${controls.readonly}`);
    const pageBefore = await page.evaluate(pageSnapshot, {refs: REFS, numbers: ALLNO});
    const pageDocsBefore = await page.evaluate(pageDocs);
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');
    if (applying && pageBefore.today !== spec.day) fail('the page\'s day is ' + pageBefore.today + ', not the spec\'s ' + spec.day);
    REFS.forEach(r => { if (!pageBefore.refs[r]) fail(r + ' is not an asset on the page'); log(`  page before: ${r} "${pageBefore.refs[r].name}" asked ${pageBefore.refs[r].asked} · units ${JSON.stringify(pageBefore.refs[r].units)} · supplied ${JSON.stringify(pageBefore.refs[r].supplied)} · install ${pageBefore.refs[r].install} · light ${pageBefore.refs[r].light}, complete ${pageBefore.refs[r].done}`); });
    ROWS.forEach(p => { const asked = pageBefore.refs[p.ref].asked, have = pageBefore.refs[p.ref].fwf.length, total = have + p.numbers.length; if (p.over) log('  ' + p.ref + ' OVER: ' + total + ' units against the schedule\'s ' + asked + ' - all go on, the note says so'); if (PARTIAL ? !(p.numbers.length < asked) : (p.over ? !(total > asked) : asked !== total)) fail(p.ref + ' asks for ' + asked + ' FWF, ' + have + ' on and ' + p.numbers.length + ' given' + (PARTIAL ? ' (partial needs fewer than asked)' : '') + ' - nothing done'); if (have && !p.topup) fail(p.ref + ' already carries units - nothing done'); if (p.topup) { if (!have) fail(p.ref + ' is marked topup but carries no units'); log('  ' + p.ref + ' TOP-UP: ' + have + ' on (' + pageBefore.refs[p.ref].units.join(', ') + ') + ' + p.numbers.length + ' now = ' + total + (total === asked ? '' : ' (schedule ' + asked + ')')); } });
    if (PARTIAL) log('  PARTIAL: the units and the supplied count go on; no install tick, no date, no complete tick');
    { const stray = pageBefore.taken.filter(t => !ROWS.some(r => r.moved_from && t.startsWith(r.moved_from + '/') && r.numbers.includes(t.slice(r.moved_from.length + 1)))); if (stray.length) fail('a number is already on the page: ' + stray.join(', ') + ' - nothing done'); }
    ROWS.filter(r => r.moved_from).forEach(r => { const on = pageBefore.refs[r.moved_from].units; const missing = r.numbers.filter(n => !on.includes(n + '/' + spec.owner)); if (missing.length) fail(r.ref + ': ' + missing.join(', ') + ' not on ' + r.moved_from + ' to move'); log('  ' + r.ref + ' MOVE from ' + r.moved_from + ': ' + r.numbers.join(', ')); });

    if (applying) {
      if (!controls.level || controls.level !== 'edit' || controls.readonly) fail('the service did not grant edit on this link (level ' + controls.level + ')');
      const aligned = await page.evaluate(alignStartupQueue, before.docs);
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else {
      if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);
    }

    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyOps, {rows: ROWS, owner: spec.owner, item: spec.item, day: spec.day, note: NOTE, by: spec.by, partial: PARTIAL, revert: REVERT, dry: !applying}).catch(e => fail('stage: ' + e.message));
    log('stage: ' + results.map(r => r.removed ? r.ref + ' removed ' + r.removed : r.reverted ? r.ref + ' reverted to ' + r.supplied + ' (' + r.why + ')' : r.unit ? r.ref + ' unit ' + r.unit : r.supplied ? r.ref + ' supplied ' + r.supplied : r.note ? r.ref + ' note' : r.install ? r.ref + ' install' : r.complete ? r.ref + ' dated ' + r.date + ', complete' : r.ref + ' not completed (' + r.why + ')').join('; '));
    const pageAfter = await page.evaluate(pageSnapshot, {refs: REFS, numbers: ALLNO});
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (pageDocsAfter[c][id] == null) { if (REVERT && c === 'labour' && docIdDecode(id) === REVERT.ref + '|Toilets & amenities|FWF|install') { expected.set(k, 'null'); log('plan removes ' + k + ' (the install tick comes off ' + REVERT.ref + ')'); continue; } fail('plan would REMOVE ' + k + ' - refused'); } expected.set(k, canon(pageDocsAfter[c][id])); }
    const refOk = (r, p) => r && p.numbers.every(n => r.units.includes(n + '/' + spec.owner)) && r.supplied && r.supplied.items.some(i => i.asked === 'FWF' && i.qty_supplied === r.fwf.length) && (PARTIAL ? !r.install && !r.done : r.install && (!r.single ? true : r.done && r.light === 'on site' && (r.date === spec.day || (r.date === null && pageBefore.refs[p.ref].plan === spec.day)))); /* the page keeps no date when the arrival is on its plan day */
    if (REVERT) { const r = pageAfter.refs[REVERT.ref]; if (!(r && r.fwf.length === REVERT.supplied && r.supplied && r.supplied.items.some(i => i.asked === 'FWF' && i.qty_supplied === REVERT.supplied) && !r.install && !r.done && r.date === null)) fail(REVERT.ref + ' is not reverted after the stage: ' + JSON.stringify(r)); }
    ROWS.forEach(p => { if (!refOk(pageAfter.refs[p.ref], p)) fail(p.ref + ' does not carry the units, the supplied count, the install tick, the date and the complete tick after the stage: ' + JSON.stringify(pageAfter.refs[p.ref])); });
    REFS.forEach(r => log(`  page after: ${r} units ${JSON.stringify(pageAfter.refs[r].units)} · supplied ${JSON.stringify(pageAfter.refs[r].supplied.items)} · install ${pageAfter.refs[r].install} · light ${pageAfter.refs[r].light}, complete ${pageAfter.refs[r].done}, date ${pageAfter.refs[r].date}`));
    const queued = Object.entries(pageAfter.queue).flatMap(([c, q]) => Object.keys(q).map(id => c + '/' + id));
    const unexpectedQueue = queued.filter(k => !expected.has(k) || !same(pageAfter.queue[k.slice(0, k.indexOf('/'))][k.slice(k.indexOf('/') + 1)], JSON.parse(expected.get(k))));
    if (applying && unexpectedQueue.length) fail('the page queued writes outside the plan: ' + unexpectedQueue.join(', ') + ' - nothing sent');

    if (!applying) {
      await new Promise(r => setTimeout(r, 1500));
      const blockedAfter = harness.counts.blocked, blockedMap = harness.counts.blockedMapSessions || 0;
      log(`writes the page tried: ${blockedAfter - blockedBefore} new aborted non-GET request(s) after the stage (aborted total ${blockedAfter}${blockedMap ? ', map sessions ' + blockedMap : ''}); page errors: ${harness.errors.length}`);
      log(`plan --apply would send (${expected.size}): ${[...expected.keys()].join(', ')}`);
      if (blockedAfter <= blockedBefore) fail('the page did not attempt a write after the stage - the dry run cannot confirm the write path');
      if (harness.errors.length) fail('page errors: ' + harness.errors.join(' | '));
      log('DRY RUN PASSED - nothing reached the service');
      return;
    }

    // ---------------------------------------------------------------------------------------- APPLY: release exactly the planned writes
    if (!same((await publicState()).docs, before.docs)) fail('the record changed before release - nothing sent');
    if (fatal) throw fatal;
    writesAllowed = true;
    await page.evaluate(releaseSender);
    const deadline = Date.now() + 90000;
    for (;;) {
      if (fatal) throw fatal;
      const st = await page.evaluate(() => ({status: SYNC.status, unkept: !!SYNC.unkept, waiting: syncWaiting(), queueEmpty: Object.keys(SYNC.queue || {}).every(k => !Object.keys(SYNC.queue[k]).length), inflight: Object.keys(SYNC.inflight || {}).length}));
      if (st.unkept || ['offline', 'unreachable', 'error', 'stopped', 'paused', 'revoked'].includes(st.status)) fail('sync is ' + st.status + (st.unkept ? ' (unkept)' : '') + ' - inspect the service before any retry');
      if (st.queueEmpty && !st.inflight && st.waiting === 0 && [...expected.keys()].every(k => acks.get(k) === 200 || (expected.get(k) === 'null' && (acks.get(k) === 204 || acks.get(k) === 200)))) break;
      if (Date.now() > deadline) fail('the writes did not settle in 90 s (acknowledged: ' + [...acks.entries()].map(([k, s]) => k + '=' + s).join(', ') + ') - no automatic retry');
      await new Promise(r => setTimeout(r, 200));
    }
    writesAllowed = false;
    log(`acknowledged: ${[...acks.entries()].map(([k, s]) => k + ' ' + s).join(', ')}`);

    const after = await publicState();
    const pick = docs => Object.fromEntries([...expected.keys()].map(k => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); return [k, (docs[c] || {})[id] === undefined ? null : docs[c][id]]; }));
    const verify = {ok: true, problems: [], otherDocsChanged: [], serialisationDiffers: []};
    const afterUnits = unitDocs(after.docs);
    ROWS.forEach(p => {
      p.numbers.forEach(n => { if (!afterUnits.some(d => d.ref === p.ref && d.assetNo === n && d.owner === spec.owner && d.active)) verify.problems.push(p.ref + ' does not carry ' + n + ' active on the service'); });
      const sd = (after.docs.delivery || {})[p.ref] || {}, sp = (after.docs.supplied || {})[p.ref] || {};
      if (p.moved_from) p.numbers.forEach(n => { if (afterUnits.some(d => d.ref === p.moved_from && d.assetNo === n && d.active)) verify.problems.push(n + ' is still active on ' + p.moved_from); });
      const have = afterUnits.filter(d => d.ref === p.ref && d.owner === spec.owner && d.active).length; if (!(sp.items || []).some(i => i.asked === 'FWF' && i.qty_supplied === have)) verify.problems.push(p.ref + ': the supplied count is not on the service');
      if (PARTIAL) { if (sd.done === true) verify.problems.push(p.ref + ': a partial arrival must not be ticked complete'); }
      else if (pageBefore.refs[p.ref].single && ((p.over && sd.note !== p.note) || sd.done !== true || sd.state !== 'on site' || !(sd.date === spec.day || (!sd.date && pageBefore.refs[p.ref].plan === spec.day)))) verify.problems.push(p.ref + ': the complete tick, the green light or the date is not on the service');
    });
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(after.docs)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(after.docs[c] || {})])) {
      const k = c + '/' + id; if (expected.has(k)) continue;
      const was = (before.docs[c] || {})[id], now = (after.docs[c] || {})[id];
      if (!same(was ?? null, now ?? null)) verify.otherDocsChanged.push(k);
      else if (JSON.stringify(was) !== JSON.stringify(now)) verify.serialisationDiffers.push(k);
    }
    if (REVERT) { const sd = (after.docs.delivery || {})[REVERT.ref] || {}, sp = (after.docs.supplied || {})[REVERT.ref] || {}; if (!(sp.items || []).some(i => i.asked === 'FWF' && i.qty_supplied === REVERT.supplied)) verify.problems.push(REVERT.ref + ': supplied is not ' + REVERT.supplied + ' on the service'); if (sd.done === true || sd.date) verify.problems.push(REVERT.ref + ': still ticked complete or dated on the service'); if ((after.docs.labour || {})[REVERT.ref + '~7c~Toilets~20~~26~~20~amenities~7c~FWF~7c~install']) verify.problems.push(REVERT.ref + ': install tick still on the service'); }
    if (verify.otherDocsChanged.length) verify.problems.push('other documents changed: ' + verify.otherDocsChanged.join(', '));
    for (const k of expected.keys()) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (expected.get(k) === 'null' ? (after.docs[c] || {})[id] !== undefined : canon((after.docs[c] || {})[id]) !== expected.get(k)) verify.problems.push(k + ' on the service is not what the page sent'); }
    verify.ok = !verify.problems.length;
    const report = {author: 'Andrew Fisher', started, finished: new Date().toISOString(), mode: 'apply', spec, pageSha256: expectedSha,
      version: {before: before.version, after: after.version}, updated: {before: before.updated, after: after.updated},
      stage: results, writes: [...expected.keys()].map(k => ({key: k, status: acks.get(k) ?? null})), refused, mapSessionsBlocked: counts.mapSessions,
      docs: {before: pick(before.docs), after: pick(after.docs)}, verification: verify};
    const out = path.join(HERE, 'report_' + started + '.json');
    fs.writeFileSync(out, redact(JSON.stringify(report, null, 1)) + '\n', {mode: 0o600});
    log(`record version ${before.version} -> ${after.version}; other documents unchanged in value: ${!verify.otherDocsChanged.length}${verify.serialisationDiffers.length ? ' (key order only differs for ' + verify.serialisationDiffers.length + ': ' + verify.serialisationDiffers.slice(0, 5).join(', ') + ')' : ''}`);
    log(verify.ok ? `VERIFIED - ${ROWS.map(p => p.ref + ' carries ' + p.numbers.join(', ') + ', supplied ' + p.numbers.length + (PARTIAL ? ' (partial, nothing ticked)' : ', installed, dated, complete')).join('; ')} on the service` : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
    log('report: ' + out);
    if (!verify.ok) exitCode = 1;
  } catch (e) {
    console.error('STOP: ' + redact(e && e.message || e)); if (process.env.GC500_DEBUG) console.error(redact(e && e.stack || '')); exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (tempPage) fs.rmSync(tempPage, {force: true});
    process.exit(exitCode);
  }
})();
