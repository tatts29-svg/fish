#!/usr/bin/env node
/* Author: Andrew Fisher. Record, on the shared record, the signed Advanced papers Andrew photographed on 16 Oct 2026,
   through the page's own paper forms so every derived figure stays consistent:
     service_note - a green-book service note (recordServiceNote: number, date, where, the crew's hours as the note
                    writes them, metres if the note says, what it says, who signed)
     collection   - a blue-book collection form (recordCollection: number, removal date, location, the counts collected,
                    the hire agreement written on it, who signed, notes) - counts only, no charge, credit or metres inferred

     node service_notes_fill.cjs            DRY RUN (default): the page is opened read-only through the harness, every
                                            write it tries is ABORTED, and the script prints what --apply would send.
     node service_notes_fill.cjs --apply    needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA in the environment.
     options: --spec <file> (default notes_spec.json beside this script)
              --page <file> or PAGE=<file>: the page to serve in the dry run (default: the live page, fetched now)

   Spec: {"by": "Andrew Fisher", "ops": [{"op": "service_note", "note_no": "24475", ...}, {"op": "collection", ...}]}.

   --apply, in order: before snapshot of GET /api/state (view token; kept beside this script as the backup) -> the
   public page's sha256 must equal GC500_EXPECTED_PAGE_SHA -> Chromium opens /e/<key>#fencing with the page's sender
   held back and a write gate that aborts every non-GET not on the plan -> wait for SYNC.status === 'live' -> the
   startup queue must be empty or serialisation-only no-ops -> every paper recorded in the page, in order, by the page's
   own function; a paper already on the books is refused by the page and stops the run; one failure and nothing is
   sent -> the queued writes must all be the new papers' own documents (serviceNotes, fenceCollections) and the page's
   audit documents beside them (stamps, by), none removed -> release the sender, allow exactly those PUTs once each ->
   wait until the queue and inflight are empty (90 s) -> GET /api/state again -> verify every paper on the service and
   that every other document is unchanged -> report_<UTC>.json. The key is never printed, logged or stored; it is
   redacted from every string. The photographs of the papers go up separately (upload_originals.cjs). */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'notes_spec.json');
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
if (typeof spec.by !== 'string' || !spec.by.trim()) fail('spec.by must be a name');
if (/\bvia\b/i.test(spec.by)) fail('spec.by must be the person, with no agent suffix');
if (!Array.isArray(spec.ops) || !spec.ops.length) fail('spec.ops must be a list');
const NORE = /^\d{3,8}$/, DATERE = /^\d{4}-\d{2}-\d{2}$/;
const COUNT_KEYS = ['flat_feet_ccb', 'mesh_panel', 'hoarding_panel', 'cc_barrier', 'base', 'clamp', 'brace', 'dog_bar', 'hand_rail', 'ped_gate', 'wheels'];
spec.ops.forEach((o, i) => {
  const at = 'ops[' + i + '] ';
  if (o.op === 'service_note') {
    if (!NORE.test(o.note_no || '')) fail(at + 'needs the note number'); if (!DATERE.test(o.date || '')) fail(at + 'needs a date');
    if (!(Number(o.labour_hours) > 0)) fail(at + 'needs the crew\'s hours'); if (!String(o.location || '').trim()) fail(at + 'needs where');
    if (o.metres !== '' && o.metres != null && !(Number(o.metres) > 0)) fail(at + 'metres must be a number or blank');
  } else if (o.op === 'collection') {
    if (!NORE.test(o.collection_no || '')) fail(at + 'needs the form number'); if (!DATERE.test(o.date || '')) fail(at + 'needs a removal date');
    if (!String(o.location || '').trim()) fail(at + 'needs a location');
    if (!o.collected || typeof o.collected !== 'object' || !Object.keys(o.collected).length) fail(at + 'needs collected counts');
    for (const [k, v] of Object.entries(o.collected)) { if (!COUNT_KEYS.includes(k)) fail(at + 'unknown count ' + k); if (!Number.isInteger(v) || v < 0) fail(at + k + ' must be a whole number'); }
  } else fail(at + 'unknown op ' + o.op);
});
const NOTE_NOS = spec.ops.filter(o => o.op === 'service_note').map(o => o.note_no), COLL_NOS = spec.ops.filter(o => o.op === 'collection').map(o => o.collection_no);
if (new Set([...NOTE_NOS, ...COLL_NOS]).size !== NOTE_NOS.length + COLL_NOS.length) fail('a paper number is in the spec twice');
/* the documents this operation may touch: the new papers' own documents and the audit documents the page keeps beside them */
const ALLOWED_COLLS = new Set(['serviceNotes', 'fenceCollections', 'stamps', 'by']);
const docIdDecode = id => String(id).replace(/~2f~/g, '/').replace(/~7c~/g, '|').replace(/~20~/g, ' ').replace(/~26~/g, '&');
const NEW_IDS = new Set(); /* the ids the page gives the new papers, learned at the stage */
const allowed = (k, body, docs) => { const c = k.slice(0, k.indexOf('/')), id = docIdDecode(k.slice(k.indexOf('/') + 1)); if (!ALLOWED_COLLS.has(c)) return false;
  if (c === 'serviceNotes') return !!body && NOTE_NOS.includes(String(body.note_no));
  if (c === 'fenceCollections') return !!body && COLL_NOS.includes(String(body.collection_no));
  const m = id.match(/^(serviceNotes|fenceCollections)\/(.+)$/); return !!m && NEW_IDS.has(m[2]); };

// ---------------------------------------------------------------------------------------------- curl with headers on stdin
let seq = 0;
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
function curlGet(url, headers) {
  const tmp = path.join(os.tmpdir(), 'gc500-sn-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
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
  const missing = ['recordServiceNote', 'recordCollection', 'paperNoTaken', 'whoAmI', 'mayWrite', 'capability', 'weekOf', 'bump', 'syncStage', 'syncSend', 'syncWaiting', 'toDocs', 'fromDocs', 'persist'].filter(n => typeof window[n] !== 'function' && (() => { try { return typeof eval(n) !== 'function'; } catch (_) { return true; } })());
  return {missing, hasS: typeof S === 'object' && !!S, hasColls: typeof SYNC_COLLS === 'object', level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status};
}
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot() {
  return JSON.parse(JSON.stringify({operator: S.operator || null,
    notes: (S.serviceNotes || []).map(n => n.note_no), collections: (S.fenceCollections || []).map(c => c.collection_no),
    queue: Object.fromEntries(Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length)),
    inflight: Object.keys(SYNC.inflight || {}), waiting: syncWaiting(), status: SYNC.status, level: SYNC.level, readonly: SYNC.readonly}));
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
  if (!mayWrite('a service note')) throw new Error('mayWrite() is false - this is not an edit link');
  const out = [], flashes = []; const oldFlash = typeof flash === 'function' ? flash : null; if (oldFlash) flash = m => { flashes.push(String(m)); };
  try {
    for (const op of spec.ops) {
      const r = {op: op.op, no: op.note_no || op.collection_no}; flashes.length = 0;
      try {
        if (op.op === 'service_note') {
          if (paperNoTaken(op.note_no)) throw new Error('service note ' + op.note_no + ' is already on the books');
          const n = recordServiceNote({note_no: op.note_no, date: op.date, location: op.location, labour_hours: String(op.labour_hours), crew_note: op.crew_note || '', metres: op.metres === '' || op.metres == null ? '' : String(op.metres), note: op.note || '', signed_by: op.signed_by || ''});
          if (!n || !n.id) throw new Error('the page did not record it: ' + flashes.join(' | '));
          const held = (S.serviceNotes || []).find(x => x.id === n.id); if (!held || held.note_no !== op.note_no || held.labour_hours !== Math.round(Number(op.labour_hours) * 100) / 100) throw new Error('the note is not held as sent');
          r.id = n.id; r.result = 'recorded as ' + n.id + ' - ' + n.labour_hours + ' h' + (n.metres ? ', ' + n.metres + ' m' : '') + ' - ' + flashes.join(' | ');
        } else if (op.op === 'collection') {
          const collected = Object.fromEntries(Object.entries(op.collected).map(([k, v]) => [k, String(v)]));
          const c = recordCollection({collection_no: op.collection_no, date: op.date, location: op.location, collected, hire_agreements_written: op.hire_agreements_written || '', signed_by: op.signed_by || '', note: op.note || ''});
          if (!c || !c.id) throw new Error('the page did not record it: ' + flashes.join(' | '));
          const held = (S.fenceCollections || []).find(x => x.id === c.id); if (!held || held.collection_no !== op.collection_no) throw new Error('the form is not held as sent');
          for (const [k, v] of Object.entries(op.collected)) if (held.collected[k] !== v) throw new Error('count ' + k + ' is ' + held.collected[k] + ', not ' + v);
          r.id = c.id; r.result = 'recorded as ' + c.id + ' - ' + Object.entries(held.collected).map(([k, v]) => v + ' ' + k).join(', ') + ' - ' + flashes.join(' | ');
        } else throw new Error('unknown op ' + op.op);
      } catch (e) { r.result = 'ERROR: ' + e.message; r.error = true; }
      out.push(r);
    }
  } finally { if (oldFlash) flash = oldFlash; }
  const bad = out.filter(r => r.error);
  if (bad.length) throw new Error(bad.length + ' op(s) failed - nothing sent: ' + bad.map(r => r.op + ' ' + r.no + ': ' + r.result).join(' | '));
  if (typeof save === 'function') save();
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); } /* the dry run sends NOW, inside the poll window, so the aborted PUT is seen */
  return out;
}

// ---------------------------------------------------------------------------------------------- the run
(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`service_notes_fill ${applying ? 'APPLY' : 'DRY RUN'} - ${NOTE_NOS.length} service note(s) ${NOTE_NOS.join(', ')}${COLL_NOS.length ? ' and ' + COLL_NOS.length + ' collection form(s) ' + COLL_NOS.join(', ') : ''} - by ${spec.by}`);
    const before = await publicState();
    log(`before: record version ${before.version} updated ${before.updated}`);
    if (applying) { const bk = path.join(HERE, 'backup_state_' + started + '.json'); fs.writeFileSync(bk, JSON.stringify(before, null, 1) + '\n', {mode: 0o600}); log('backup of the whole record before: ' + bk); }
    const onBooks = [...Object.values(before.docs.serviceNotes || {}).map(n => n && n.note_no), ...Object.values(before.docs.fenceCollections || {}).map(c => c && c.collection_no), ...Object.values(before.docs.fenceDockets || {}).map(d => d && d.docket_no)].map(String);
    const dup = [...NOTE_NOS, ...COLL_NOS].filter(n => onBooks.includes(n)); if (dup.length) fail('already on the books: ' + dup.join(', ') + ' - nothing to do for those; take them out of the spec');
    log(`before: ${Object.keys(before.docs.serviceNotes || {}).length} service notes and ${Object.keys(before.docs.fenceCollections || {}).length} collection forms on the record; none of the spec's numbers among them`);

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
        if (!m || method !== 'PUT') { counts.blocked++; refused.push({method, path: u.pathname}); stop('unexpected write ' + method + ' ' + u.pathname); return route.abort(); }
        const key = decodeURIComponent(m[1]) + '/' + decodeURIComponent(m[2]);
        let body = null; try { body = JSON.parse(req.postData() || 'null'); } catch (_) { body = undefined; }
        if (!writesAllowed || !expected.has(key) || canon(body) !== expected.get(key)) { counts.blocked++; refused.push({method, key}); stop('write outside the plan: ' + key); return route.abort(); }
        if (sent.has(key)) { counts.blocked++; refused.push({method, key, retry: true}); stop('automatic retry refused: ' + key); return route.abort(); }
        sent.add(key); return route.continue();
      });
      page.on('response', r => { const q = r.request(); if (q.method() !== 'PUT') return; const m = new URL(r.url()).pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/); if (m) acks.set(decodeURIComponent(m[1]) + '/' + decodeURIComponent(m[2]), r.status()); });
      await page.goto(HOST + '/e/' + token + '#fencing', {waitUntil: 'load', timeout: 180000});
    } else {
      let pageFile = argValue('--page') || process.env.PAGE || null;
      if (!pageFile) {
        pageFile = tempPage = path.join(os.tmpdir(), 'gc500-live-page-' + process.pid + '.html');
        const live = await curlGet(HOST + '/v/' + VIEW_TOKEN, {'cache-control': 'no-cache'});
        if (live.status !== 200) fail('public page answered ' + live.status);
        fs.writeFileSync(pageFile, live.body); log(`dry run page: the live page fetched now (${live.body.length} bytes, sha256 ${sha256(live.body)})`);
      } else log(`dry run page: ${pageFile} (${fs.statSync(pageFile).size} bytes, sha256 ${sha256(fs.readFileSync(pageFile))})`);
      const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
      harness = await open({pageFile, hash: '#fencing'}); browser = harness.browser; page = harness.page;
    }

    await page.waitForFunction(pageReady, null, {timeout: 180000});
    if (fatal) throw fatal;
    const controls = await page.evaluate(pageHasControls);
    if (controls.missing.length || !controls.hasS || !controls.hasColls) fail('page controls missing: ' + controls.missing.join(', '));
    log(`page live: level ${controls.level}, readonly ${controls.readonly}`);
    const pageBefore = await page.evaluate(pageSnapshot);
    const pageDocsBefore = await page.evaluate(pageDocs);
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');
    log(`  page before: ${pageBefore.notes.length} service notes (last ${pageBefore.notes.slice(-3).join(', ')}), ${pageBefore.collections.length} collection forms (last ${pageBefore.collections.slice(-3).join(', ')})`);

    if (applying) {
      if (!controls.level || controls.level !== 'edit' || controls.readonly) fail('the service did not grant edit on this link (level ' + controls.level + ')');
      const aligned = await page.evaluate(alignStartupQueue, before.docs);
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else {
      if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);
    }

    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyOps, {ops: spec.ops, by: spec.by, dry: !applying}).catch(e => fail('stage: ' + e.message));
    results.forEach(r => { if (r.id) NEW_IDS.add(r.id); log(`stage: ${r.op} ${r.no} - ${r.result}`); });
    const pageAfter = await page.evaluate(pageSnapshot);
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k, pageDocsAfter[k.slice(0, k.indexOf('/'))][k.slice(k.indexOf('/') + 1)], pageDocsAfter));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (pageDocsAfter[c][id] == null) fail('the plan would remove ' + k + ' - nothing sent'); expected.set(k, canon(pageDocsAfter[c][id])); }
    const checkDocs = (docs, where) => { const problems = [];
      const notes = Object.values(docs.serviceNotes || {}), colls = Object.values(docs.fenceCollections || {});
      for (const op of spec.ops) {
        if (op.op === 'service_note') { const n = notes.find(x => x && String(x.note_no) === op.note_no); if (!n) problems.push('service note ' + op.note_no + ' is not held ' + where); else if (n.labour_hours !== Math.round(Number(op.labour_hours) * 100) / 100 || n.date !== op.date || n.location !== op.location.trim()) problems.push('service note ' + op.note_no + ' differs ' + where); }
        if (op.op === 'collection') { const c = colls.find(x => x && String(x.collection_no) === op.collection_no); if (!c) problems.push('collection form ' + op.collection_no + ' is not held ' + where); else if (c.date !== op.date || Object.entries(op.collected).some(([k, v]) => c.collected[k] !== v)) problems.push('collection form ' + op.collection_no + ' differs ' + where); }
      } return problems; };
    const stageProblems = checkDocs(pageDocsAfter, 'after the stage'); if (stageProblems.length) fail(stageProblems.join(' | '));
    log(`  page after: ${pageAfter.notes.length} service notes, ${pageAfter.collections.length} collection forms`);
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
      if (st.queueEmpty && !st.inflight && st.waiting === 0 && [...expected.keys()].every(k => acks.get(k) === 200)) break;
      if (Date.now() > deadline) fail('the writes did not settle in 90 s (acknowledged: ' + [...acks.entries()].map(([k, s]) => k + '=' + s).join(', ') + ') - no automatic retry');
      await new Promise(r => setTimeout(r, 200));
    }
    writesAllowed = false;
    log(`acknowledged: ${[...acks.entries()].map(([k, s]) => k + ' ' + s).join(', ')}`);

    const after = await publicState();
    const pick = docs => Object.fromEntries([...expected.keys()].map(k => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); return [k, (docs[c] || {})[id] === undefined ? null : docs[c][id]]; }));
    const verify = {ok: true, problems: [], otherDocsChanged: [], serialisationDiffers: []};
    verify.problems.push(...checkDocs(after.docs, 'on the service'));
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(after.docs)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(after.docs[c] || {})])) {
      const k = c + '/' + id; if (expected.has(k)) continue;
      const was = (before.docs[c] || {})[id], now = (after.docs[c] || {})[id];
      if (!same(was ?? null, now ?? null)) verify.otherDocsChanged.push(k);
      else if (JSON.stringify(was) !== JSON.stringify(now)) verify.serialisationDiffers.push(k);
    }
    if (verify.otherDocsChanged.length) verify.problems.push('other documents changed: ' + verify.otherDocsChanged.join(', '));
    for (const k of expected.keys()) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); const v = (after.docs[c] || {})[id]; if (canon(v === undefined ? null : v) !== expected.get(k)) verify.problems.push(k + ' is not on the service as sent'); }
    verify.ok = !verify.problems.length;
    const report = {author: 'Andrew Fisher', started, finished: new Date().toISOString(), mode: 'apply', spec, pageSha256: expectedSha,
      version: {before: before.version, after: after.version}, updated: {before: before.updated, after: after.updated},
      stage: results, writes: [...expected.keys()].map(k => ({key: k, status: acks.get(k) ?? null})), refused, mapSessionsBlocked: counts.mapSessions,
      docs: {before: pick(before.docs), after: pick(after.docs)}, verification: verify};
    const out = path.join(HERE, 'report_' + started + '.json');
    fs.writeFileSync(out, redact(JSON.stringify(report, null, 1)) + '\n', {mode: 0o600});
    log(`record version ${before.version} -> ${after.version}; other documents unchanged in value: ${!verify.otherDocsChanged.length}${verify.serialisationDiffers.length ? ' (key order only differs for ' + verify.serialisationDiffers.length + ')' : ''}`);
    log(verify.ok ? `VERIFIED - every paper holds on the service (${expected.size} documents written)` : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
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
