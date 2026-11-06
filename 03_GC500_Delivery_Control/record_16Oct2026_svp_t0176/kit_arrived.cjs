#!/usr/bin/env node
/* Author: Andrew Fisher. The broadcast compound's forklifts and track mats turned up (16 Oct 2026) with no reference on
   the schedule to record them against (contract 9992300-MEAD: the TV order), so each gets a reference the way Andrew
   added FL01, FL02 and NVLT on 25 Sep: the Add tab's own addReference (trade, type, asset number, location, plan day,
   branch, note), then the delivery record through the same controls as every arrival: the day they came (setDate; the
   plan day is the order's 17 Oct, so the 16 Oct arrival is kept as the date), the light on site (setLight), the delivery
   note (setDeliveryNote) and, for the track mats, the supplied count (setSupplied). Nothing is ticked complete.

     node kit_arrived.cjs                DRY RUN (default): the page is opened read-only through the harness, every write
                                         it tries is ABORTED, and the script prints what --apply would send.
     node kit_arrived.cjs --apply        needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA in the environment.
     options: --spec <file> (default kit_spec.json beside this script)

   Spec: {"day": "2026-10-16", "by": "Andrew Fisher", "branch": "MEAD",
          "rows": [{"key": "FL03", "disc": "Other", "type": "Forklift 5T", "no": "1321364", "loc": "TV compound", "from": "2026-10-17", "name": "...", "note": "..."},
                   {"key": "TM01", "disc": "Ground protection", "type": "Trakmat", "no": "", "qty": 10, ...}]}.
   A key must not already be a reference on the page; an asset number must not already be on any reference.

   --apply, in order: before snapshot of GET /api/state (kept beside this script as the backup) -> the public page's
   sha256 must equal GC500_EXPECTED_PAGE_SHA -> Chromium opens /e/<key>#plant with the sender held and a write gate
   that aborts every non-GET not on the plan -> the startup queue must be empty or no-ops -> the stage -> the queued
   writes must all be documents about these references (added, notes, branch, delivery, supplied, their stamps and by),
   none removed -> release the sender, allow exactly those PUTs once each -> settle (90 s) -> GET /api/state again ->
   verify and report_<UTC>.json. The key is never printed, logged or stored. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'kit_spec.json');
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
if (!Array.isArray(spec.rows) || !spec.rows.length) fail('spec.rows must list the references to add');
if (typeof spec.by !== 'string' || !spec.by.trim()) fail('spec.by must be a name');
if (/\bvia\b/i.test(spec.by)) fail('spec.by must be the person, with no agent suffix');
if (!/^[A-Z]{2,6}$/.test(spec.branch || '')) fail('spec.branch must be the costing branch code');
const seenKey = new Set(), seenNo = new Set();
spec.rows.forEach(r => {
  if (!/^[A-Z][A-Z0-9]{0,7}$/.test(r.key || '')) fail('a row needs a reference like FL03'); if (seenKey.has(r.key)) fail('reference ' + r.key + ' twice'); seenKey.add(r.key);
  if (!r.disc || !r.type) fail(r.key + ' needs the trade and the type');
  if (r.no && !/^[A-Za-z0-9-]{1,24}$/.test(r.no)) fail(r.key + ': ' + r.no + ' is not an asset number'); if (r.no) { if (seenNo.has(r.no)) fail('duplicate number ' + r.no); seenNo.add(r.no); }
  if (r.qty != null && !(Number.isInteger(r.qty) && r.qty > 0)) fail(r.key + ': qty must be a whole number');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.from || '')) fail(r.key + ' needs the plan day'); if (!String(r.loc || '').trim()) fail(r.key + ' needs a location');
  if (typeof r.note !== 'string' || !r.note.trim() || r.note.length > 1000) fail(r.key + ' needs its delivery note');
});
const ROWS = spec.rows, KEYS = ROWS.map(r => r.key), ALLNO = ROWS.map(r => r.no).filter(Boolean);
const ALLOWED_COLLS = new Set(['added', 'notes', 'branch', 'delivery', 'supplied', 'stamps', 'by']);
const docIdDecode = id => String(id).replace(/~([0-9a-f]{2})~/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const allowed = k => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (!ALLOWED_COLLS.has(c)) return false; const d = docIdDecode(id);
  return KEYS.some(r => d === r || d.endsWith('/' + r) || d.indexOf(r + '|') === 0 || d.indexOf('/' + r + '|') >= 0 || d.indexOf('/' + r + '/') >= 0); };

// ---------------------------------------------------------------------------------------------- curl with headers on stdin
let seq = 0;
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
function curlGet(url, headers) {
  const tmp = path.join(os.tmpdir(), 'gc500-kit-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
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
  const missing = ['addReference', 'assetOf', 'setSupplied', 'setDate', 'setLight', 'setDeliveryNote', 'deliveryOf', 'chargeLines', 'qtyOf', 'isRef', 'whoAmI', 'mayWrite', 'capability', 'toDocs', 'fromDocs', 'syncStage', 'syncSend', 'syncWaiting', 'persist'].filter(f => typeof window[f] !== 'function');
  return {missing, hasS: typeof S === 'object' && !!S, hasColls: typeof SYNC_COLLS === 'object', level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status};
}
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot(spec) {
  const one = key => { const a = assetOf(key); if (!a) return {exists: false}; const d = deliveryOf(key);
    return {exists: true, name: a.name, plan: a.first_date || null, lines: chargeLines(a).map(x => x.item + ' × ' + qtyOf(x)), numbers: a.asset_numbers || [], added: (S.added || []).some(x => x.key === key),
      supplied: (S.supplied || {})[key] || null, light: d.state, done: !!d.done, date: ((S.delivery || {})[key] || {}).date || null, note: ((S.delivery || {})[key] || {}).note || null, branch: (S.branch || {})[key] || null}; };
  const taken = []; allAssets().forEach(a => { if (a._cancelled || movedAway(a.key)) return; (a.asset_numbers || []).forEach(n => { if (spec.numbers.includes(String(n))) taken.push(a.key + '/' + n); }); gcModel925(a, {loading: false}).rows.forEach(u => { if (u.active !== false && u.source !== 'history' && u.assetNo && spec.numbers.includes(u.assetNo)) taken.push(a.key + '/' + u.assetNo); }); });
  return JSON.parse(JSON.stringify({
    operator: S.operator || null, today: todayIso(),
    refs: Object.fromEntries(spec.keys.map(r => [r, one(r)])), taken,
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
  if (!mayWrite('a reference')) throw new Error('mayWrite() is false - this is not an edit link');
  const out = [];
  spec.rows.forEach(p => {
    if (isRef(p.key)) throw new Error(p.key + ' is already a reference on the page');
    const key = addReference({key: p.key, disc: p.disc, type: p.type, no: p.no || '', name: p.name || '', loc: p.loc, from: p.from, to: '', srcRow: '', note: '', branch: spec.branch});
    if (key !== p.key) throw new Error(p.key + ': addReference answered ' + JSON.stringify(key));
    if (!isRef(p.key)) throw new Error(p.key + ' is not a reference after adding');
    out.push({key: p.key, added: true, type: p.type, no: p.no || null});
    if (p.qty) { if (setSupplied(p.key, p.type, {supplied: p.type, qty_supplied: p.qty}) === false) throw new Error(p.key + ': supplied refused'); out.push({key: p.key, supplied: p.qty}); }
    if (setDeliveryNote(p.key, p.note) === false) throw new Error(p.key + ': note refused'); out.push({key: p.key, note: p.note});
    if (!setDate(p.key, spec.day, 'in')) throw new Error(p.key + ': date refused');
    if (!setLight(p.key, 'on site')) throw new Error(p.key + ': light refused');
    out.push({key: p.key, dated: true, date: spec.day, light: 'on site'});
  });
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); } /* the dry run sends NOW, inside the poll window, so the aborted PUT is seen */
  return out;
}

// ---------------------------------------------------------------------------------------------- the run
(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`kit_arrived ${applying ? 'APPLY' : 'DRY RUN'} - ${ROWS.map(r => r.key + ' ' + r.type + (r.no ? ' ' + r.no : '') + (r.qty ? ' × ' + r.qty : '')).join('; ')} (${spec.day}, branch ${spec.branch}) - by ${spec.by}`);
    const before = await publicState();
    log(`before: record version ${before.version} updated ${before.updated}`);
    if (applying) { const bk = path.join(HERE, 'backup_state_' + started + '.json'); fs.writeFileSync(bk, JSON.stringify(before, null, 1) + '\n', {mode: 0o600}); log('backup of the whole record before: ' + bk); }
    KEYS.forEach(r => { if ((before.docs.added || {})[r] || (before.docs.delivery || {})[r]) fail(r + ' already has a record on the service - nothing done'); });
    const everywhere = []; for (const [k, v] of Object.entries(before.docs.loads || {})) if (k.startsWith('unit925~2f~') && v && v.active !== false && ALLNO.includes(v.assetNo)) everywhere.push(v.ref + '/' + v.assetNo); for (const [k, v] of Object.entries(before.docs.assetNumbers || {})) (v && v.v || []).forEach(n => { if (ALLNO.includes(String(n))) everywhere.push(k + '/' + n); });
    log(`  these numbers on the record already: ${everywhere.length ? everywhere.join(', ') : 'none'}`);
    if (everywhere.length) fail('a number is already on the record - nothing done');

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
    const pageBefore = await page.evaluate(pageSnapshot, {keys: KEYS, numbers: ALLNO});
    const pageDocsBefore = await page.evaluate(pageDocs);
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');
    if (applying && pageBefore.today !== spec.day) fail('the page\'s day is ' + pageBefore.today + ', not the spec\'s ' + spec.day);
    KEYS.forEach(r => { if (pageBefore.refs[r].exists) fail(r + ' is already a reference on the page - nothing done'); log(`  page before: ${r} is free`); });
    if (pageBefore.taken.length) fail('a number is already on the page: ' + pageBefore.taken.join(', ') + ' - nothing done');

    if (applying) {
      if (!controls.level || controls.level !== 'edit' || controls.readonly) fail('the service did not grant edit on this link (level ' + controls.level + ')');
      const aligned = await page.evaluate(alignStartupQueue, before.docs);
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else {
      if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);
    }

    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyOps, {rows: ROWS, day: spec.day, by: spec.by, branch: spec.branch, dry: !applying}).catch(e => fail('stage: ' + e.message));
    log('stage: ' + results.map(r => r.added ? r.key + ' added (' + r.type + (r.no ? ' ' + r.no : '') + ')' : r.supplied ? r.key + ' supplied ' + r.supplied : r.note ? r.key + ' note' : r.key + ' dated ' + r.date + ', light ' + r.light).join('; '));
    const pageAfter = await page.evaluate(pageSnapshot, {keys: KEYS, numbers: ALLNO});
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (pageDocsAfter[c][id] == null) fail('plan would REMOVE ' + k + ' - refused'); expected.set(k, canon(pageDocsAfter[c][id])); }
    const refOk = (r, p) => r && r.exists && r.added && (!p.no || r.numbers.map(String).includes(p.no)) && (!p.qty || (r.supplied && r.supplied.items.some(i => i.asked === p.type && i.qty_supplied === p.qty))) && r.note === p.note && !r.done && r.light === 'on site' && r.date === spec.day && r.branch === spec.branch;
    ROWS.forEach(p => { if (!refOk(pageAfter.refs[p.key], p)) fail(p.key + ' does not carry the reference, the number, the note, the date and the light after the stage, or something was ticked: ' + JSON.stringify(pageAfter.refs[p.key])); });
    KEYS.forEach(r => log(`  page after: ${r} "${pageAfter.refs[r].name}" plan ${pageAfter.refs[r].plan} lines ${JSON.stringify(pageAfter.refs[r].lines)} numbers ${JSON.stringify(pageAfter.refs[r].numbers)} · supplied ${JSON.stringify(pageAfter.refs[r].supplied)} · light ${pageAfter.refs[r].light}, complete ${pageAfter.refs[r].done}, date ${pageAfter.refs[r].date}, branch ${pageAfter.refs[r].branch}, note ${JSON.stringify(pageAfter.refs[r].note)}`));
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
    ROWS.forEach(p => {
      const ad = (after.docs.added || {})[p.key], sd = (after.docs.delivery || {})[p.key] || {}, sp = (after.docs.supplied || {})[p.key] || {};
      if (!ad || ad.key !== p.key || (p.no && !(ad.asset_numbers || []).map(String).includes(p.no))) verify.problems.push(p.key + ': the added reference is not on the service as planned');
      if (p.qty && !(sp.items || []).some(i => i.asked === p.type && i.qty_supplied === p.qty)) verify.problems.push(p.key + ': the supplied count is not on the service');
      if (sd.note !== p.note) verify.problems.push(p.key + ': the delivery note is not on the service');
      if (sd.done === true) verify.problems.push(p.key + ': must not be ticked complete');
      if (sd.state !== 'on site' || sd.date !== spec.day) verify.problems.push(p.key + ': the light on site or the date is not on the service');
    });
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(after.docs)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(after.docs[c] || {})])) {
      const k = c + '/' + id; if (expected.has(k)) continue;
      const was = (before.docs[c] || {})[id], now = (after.docs[c] || {})[id];
      if (!same(was ?? null, now ?? null)) verify.otherDocsChanged.push(k);
      else if (JSON.stringify(was) !== JSON.stringify(now)) verify.serialisationDiffers.push(k);
    }
    if (verify.otherDocsChanged.length) verify.problems.push('other documents changed: ' + verify.otherDocsChanged.join(', '));
    for (const k of expected.keys()) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (canon((after.docs[c] || {})[id]) !== expected.get(k)) verify.problems.push(k + ' on the service is not what the page sent'); }
    verify.ok = !verify.problems.length;
    const report = {author: 'Andrew Fisher', started, finished: new Date().toISOString(), mode: 'apply', spec, pageSha256: expectedSha,
      version: {before: before.version, after: after.version}, updated: {before: before.updated, after: after.updated},
      stage: results, writes: [...expected.keys()].map(k => ({key: k, status: acks.get(k) ?? null})), refused, mapSessionsBlocked: counts.mapSessions,
      docs: {before: pick(before.docs), after: pick(after.docs)}, verification: verify};
    const out = path.join(HERE, 'report_' + started + '.json');
    fs.writeFileSync(out, redact(JSON.stringify(report, null, 1)) + '\n', {mode: 0o600});
    log(`record version ${before.version} -> ${after.version}; other documents unchanged in value: ${!verify.otherDocsChanged.length}${verify.serialisationDiffers.length ? ' (key order only differs for ' + verify.serialisationDiffers.length + ': ' + verify.serialisationDiffers.slice(0, 5).join(', ') + ')' : ''}`);
    log(verify.ok ? `VERIFIED - ${ROWS.map(p => p.key + ' (' + p.type + (p.no ? ' ' + p.no : '') + (p.qty ? ' × ' + p.qty : '') + ') added, on site ' + spec.day + ', nothing ticked').join('; ')} on the service` : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
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
