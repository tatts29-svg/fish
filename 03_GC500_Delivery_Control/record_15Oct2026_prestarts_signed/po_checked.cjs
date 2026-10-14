#!/usr/bin/env node
/* Author: Andrew Fisher. Record on four purchase orders that Andrew has checked them, through the page's own
   native control (setPo), so every derived figure stays consistent.

     node po_checked.cjs                 DRY RUN (default): the page is opened read-only through the harness, every
                                         write it tries is ABORTED, and the script prints what --apply would send.
     node po_checked.cjs --apply         needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA in the environment.
     options: --spec <file> (default po_checked_spec.json beside this script)
              --page <file> or PAGE=<file>: the page to serve in the dry run (default: the live page, fetched now)
              CHROMIUM_PATH: the browser binary (otherwise Playwright's own)

   Spec: {"numbers": [...], "by": "Andrew Fisher", "at": "<ISO>", "note": "..."}. For each number the script calls
   setPo(no, {checked: {by, at}}) with S.operator = spec.by, which is what the v10.19 page reads as the tick.

   --apply, in order: before snapshot of GET /api/state (view token, curl with the headers on stdin) -> the public
   page's sha256 must equal GC500_EXPECTED_PAGE_SHA -> Chromium opens /e/<key>#fencing with the page's sender held
   back and a write gate that aborts every non-GET not on the plan -> wait for SYNC.status === 'live' -> the page's
   startup queue must be empty or serialisation-only no-ops -> setPo x N -> the queued writes must be exactly
   purchaseOrders/<no>, stamps/po~2f~<no> and by/po~2f~<no> for those numbers -> release the sender, allow exactly
   those PUTs once each -> wait until the queue and inflight are empty (90 s) -> GET /api/state again -> verify each
   P/O has checked {by, at} and every other document is unchanged -> po_report_<UTC>.json (before/after of just
   those docs). The key is never printed, logged or stored; it is redacted from every string written. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'po_checked_spec.json');
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
if (!Array.isArray(spec.numbers) || !spec.numbers.length || !spec.numbers.every(n => /^\d{4,12}$/.test(String(n)))) fail('spec.numbers must be 4-12 digit strings');
if (typeof spec.by !== 'string' || !spec.by.trim()) fail('spec.by must be a name');
if (/\bvia\b/i.test(spec.by)) fail('spec.by must be the person, with no agent suffix');
if (typeof spec.at !== 'string' || isNaN(Date.parse(spec.at)) || new Date(spec.at).toISOString() !== spec.at) fail('spec.at must be an exact ISO time like 2026-10-14T14:31:00.000Z');
const NUMBERS = spec.numbers.map(String);
const ALLOWED = new Set(NUMBERS.flatMap(no => ['purchaseOrders/' + no, 'stamps/po~2f~' + no, 'by/po~2f~' + no]));

// ---------------------------------------------------------------------------------------------- curl with headers on stdin
let seq = 0;
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
function curlGet(url, headers) {
  const tmp = path.join(os.tmpdir(), 'gc500-po-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
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
  const missing = ['setPo', 'poAll', 'poOf', 'whoAmI', 'mayWrite', 'capability', 'toDocs', 'fromDocs', 'syncStage', 'syncSend', 'syncWaiting', 'persist'].filter(f => typeof window[f] !== 'function');
  return {missing, hasS: typeof S === 'object' && !!S, hasColls: typeof SYNC_COLLS === 'object', level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status};
}
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot(numbers) {
  return JSON.parse(JSON.stringify({
    operator: S.operator || null,
    poAll: poAll().filter(o => numbers.includes(o.number)).map(o => ({number: o.number, amount: o.amount, checked: o.checked === undefined ? null : o.checked, updated_by: o.updated_by, updated_at: o.updated_at})),
    raw: Object.fromEntries(numbers.map(no => [no, (S.purchaseOrders || {})[no] || null])),
    stamps: Object.fromEntries(numbers.map(no => [no, (S.stamps || {})['po/' + no] || null])),
    by: Object.fromEntries(numbers.map(no => [no, (S.by || {})['po/' + no] || null])),
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
/* the page sometimes queues documents at startup whose only difference from the service copy is JSON key order;
   put the service's order back so the queue is empty, and refuse if anything queued differs in VALUE */
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
function applyChecks(spec) {
  const dry = !!spec.dry; /* a read-only run: the harness aborts every write, so the page is told it may edit */
  if (dry) { capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; }
  S.operator = spec.by;
  if (whoAmI() !== spec.by) throw new Error('whoAmI() did not return ' + spec.by);
  if (!mayWrite('the purchase order')) throw new Error('mayWrite() is false - this is not an edit link');
  const results = [];
  for (const no of spec.numbers) {
    if (!poOf(no)) throw new Error('P/O ' + no + ' is not on the page');
    if (!(S.purchaseOrders || {})[no]) throw new Error('P/O ' + no + ' has no record document to update');
    const ok = setPo(no, {checked: {by: spec.by, at: spec.at}});
    results.push({number: no, ok});
    if (!ok) throw new Error('setPo refused ' + no);
  }
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); } /* the dry run sends NOW, inside the poll window, so the aborted PUT is seen */
  return results;
}

// ---------------------------------------------------------------------------------------------- the run
(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`po_checked ${applying ? 'APPLY' : 'DRY RUN'} - ${NUMBERS.length} purchase orders: ${NUMBERS.join(', ')} - by ${spec.by} at ${spec.at}`);
    const before = await publicState();
    log(`before: record version ${before.version} updated ${before.updated}`);
    const pick = docs => Object.fromEntries([...ALLOWED].map(k => { const [c, id] = k.split('/'); return [k, (docs[c] || {})[id] === undefined ? null : docs[c][id]]; }));
    const beforeDocs = pick(before.docs);
    for (const no of NUMBERS) {
      const d = (before.docs.purchaseOrders || {})[no];
      if (!d) fail('P/O ' + no + ' is not in docs.purchaseOrders');
      log(`  ${no}: amount ${d.amount} · updated_by ${JSON.stringify(d.updated_by)} · checked ${JSON.stringify(d.checked === undefined ? null : d.checked)} · stamp ${JSON.stringify(((before.docs.stamps || {})['po~2f~' + no] || {}).v)} · by-doc ${JSON.stringify(((before.docs.by || {})['po~2f~' + no] || {}).v)}`);
    }
    const alreadyChecked = NUMBERS.filter(no => { const c = (before.docs.purchaseOrders[no] || {}).checked; return c && c.by === spec.by && c.at === spec.at; });
    if (alreadyChecked.length === NUMBERS.length) { log('every purchase order already carries exactly this check - nothing to do'); return; }

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
    const pageBefore = await page.evaluate(pageSnapshot, NUMBERS);
    const pageDocsBefore = await page.evaluate(pageDocs);
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');

    if (applying) {
      if (!controls.level || controls.level !== 'edit' || controls.readonly) fail('the service did not grant edit on this link (level ' + controls.level + ')');
      const aligned = await page.evaluate(alignStartupQueue, before.docs);
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else {
      if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);
    }

    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyChecks, {numbers: NUMBERS, by: spec.by, at: spec.at, dry: !applying}).catch(e => fail('setPo stage: ' + e.message));
    log('setPo: ' + results.map(r => r.number + (r.ok ? ' ok' : ' REFUSED')).join(', '));
    const pageAfter = await page.evaluate(pageSnapshot, NUMBERS);
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !ALLOWED.has(k));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('setPo changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const [c, id] = k.split('/'); if (pageDocsAfter[c][id] == null) fail('plan would REMOVE ' + k + ' - refused'); expected.set(k, canon(pageDocsAfter[c][id])); }
    for (const no of NUMBERS) { const d = pageDocsAfter.purchaseOrders[no]; if (!d || !d.checked || d.checked.by !== spec.by || d.checked.at !== spec.at) fail('P/O ' + no + ' does not carry the check after setPo'); if (d.updated_by !== spec.by) fail('P/O ' + no + ' updated_by is ' + d.updated_by); }
    const queued = Object.entries(pageAfter.queue).flatMap(([c, q]) => Object.keys(q).map(id => c + '/' + id));
    const unexpectedQueue = queued.filter(k => !expected.has(k) || !same(pageAfter.queue[k.split('/')[0]][k.split('/')[1]], JSON.parse(expected.get(k))));
    if (applying && unexpectedQueue.length) fail('the page queued writes outside the plan: ' + unexpectedQueue.join(', ') + ' - nothing sent');

    for (const no of NUMBERS) {
      const b = pageBefore.poAll.find(o => o.number === no) || {}, a = pageAfter.poAll.find(o => o.number === no) || {};
      log(`  ${no}: poAll().checked ${JSON.stringify(b.checked)} -> ${JSON.stringify(a.checked)} · record doc checked ${JSON.stringify((pageBefore.raw[no] || {}).checked ?? null)} -> ${JSON.stringify((pageAfter.raw[no] || {}).checked ?? null)} · updated_by ${JSON.stringify((pageAfter.raw[no] || {}).updated_by)} · stamp ${JSON.stringify(pageBefore.stamps[no])} -> ${JSON.stringify(pageAfter.stamps[no])} · by-doc ${JSON.stringify(pageAfter.by[no])}`);
    }
    if (pageAfter.poAll.some(o => o.checked == null) && pageAfter.poAll.length) log('  (poAll() shows checked only once the v10.19 page is live; the record document carries it now)');

    if (!applying) {
      await new Promise(r => setTimeout(r, 1500));
      const blockedAfter = harness.counts.blocked, blockedMap = harness.counts.blockedMapSessions || 0;
      log(`writes the page tried: ${blockedAfter - blockedBefore} new aborted non-GET request(s) after setPo (aborted total ${blockedAfter}${blockedMap ? ', map sessions ' + blockedMap : ''}); page errors: ${harness.errors.length}`);
      log(`plan --apply would send (${expected.size}): ${[...expected.keys()].join(', ')}`);
      if (blockedAfter <= blockedBefore) fail('the page did not attempt a write after setPo - the dry run cannot confirm the write path');
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
    const afterDocs = pick(after.docs);
    const verify = {ok: true, problems: [], otherDocsChanged: [], serialisationDiffers: []};
    for (const no of NUMBERS) {
      const d = (after.docs.purchaseOrders || {})[no];
      if (!d || !d.checked || d.checked.by !== spec.by || d.checked.at !== spec.at) verify.problems.push('P/O ' + no + ' does not carry checked {by, at} on the service');
      else if (d.updated_by !== spec.by) verify.problems.push('P/O ' + no + ' updated_by is ' + JSON.stringify(d.updated_by));
    }
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(after.docs)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(after.docs[c] || {})])) {
      const k = c + '/' + id; if (ALLOWED.has(k)) continue;
      const was = (before.docs[c] || {})[id], now = (after.docs[c] || {})[id];
      if (!same(was ?? null, now ?? null)) verify.otherDocsChanged.push(k);
      else if (JSON.stringify(was) !== JSON.stringify(now)) verify.serialisationDiffers.push(k);
    }
    if (verify.otherDocsChanged.length) verify.problems.push('other documents changed: ' + verify.otherDocsChanged.join(', '));
    for (const k of expected.keys()) { const [c, id] = k.split('/'); if (canon((after.docs[c] || {})[id]) !== expected.get(k)) verify.problems.push(k + ' on the service is not what the page sent'); }
    verify.ok = !verify.problems.length;
    const report = {author: 'Andrew Fisher', started, finished: new Date().toISOString(), mode: 'apply', spec, pageSha256: expectedSha,
      version: {before: before.version, after: after.version}, updated: {before: before.updated, after: after.updated},
      writes: [...expected.keys()].map(k => ({key: k, status: acks.get(k) ?? null})), refused, mapSessionsBlocked: counts.mapSessions,
      auditDocs: NUMBERS.map(no => ({number: no, stamp: 'stamps/po~2f~' + no, by: 'by/po~2f~' + no})),
      docs: {before: beforeDocs, after: afterDocs}, verification: verify};
    const out = path.join(HERE, 'po_report_' + started + '.json');
    fs.writeFileSync(out, redact(JSON.stringify(report, null, 1)) + '\n', {mode: 0o600});
    log(`record version ${before.version} -> ${after.version}; other documents unchanged in value: ${!verify.otherDocsChanged.length}${verify.serialisationDiffers.length ? ' (key order only differs for ' + verify.serialisationDiffers.length + ': ' + verify.serialisationDiffers.slice(0, 5).join(', ') + ')' : ''}`);
    log(verify.ok ? 'VERIFIED - each purchase order carries the check on the service' : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
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
