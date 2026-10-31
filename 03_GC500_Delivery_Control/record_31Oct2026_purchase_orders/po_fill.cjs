#!/usr/bin/env node
/* Author: Andrew Fisher. Put purchase orders on the shared record through the page's own setPo (the function behind the
   Finance handover card's Add button), so every derived figure reads them the same way:
     po_add - a purchase order the record does not hold yet: setPo(number, patch), verified field by field

     node po_fill.cjs                DRY RUN (default): the page is opened read-only through the harness, every write it
                                     tries is ABORTED, and the script prints what --apply would send.
     node po_fill.cjs --apply    needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA in the environment.
     options: --spec <file> (default po_spec.json beside this script); --page <file> or PAGE=<file> for the dry run.

   --apply, in order: before snapshot of GET /api/state (view token; kept beside this script as the backup) -> the public
   page's sha256 must equal GC500_EXPECTED_PAGE_SHA -> Chromium opens /e/<key>#costs with the page's sender held back and
   a write gate that aborts every non-GET not on the plan -> wait for SYNC.status === 'live' -> the startup queue must be
   empty or serialisation-only no-ops -> every row written in the page, in order, by the page's own function; one failure
   and nothing is sent -> the queued writes must all be the planned rows and the page's audit documents beside them
   (stamps, by, the undo of an earlier set-aside) -> release the sender, allow exactly those writes once each -> wait until
   the queue and inflight are empty (90 s) -> GET /api/state again -> verify every row on the service and that every other
   document is unchanged -> report_<UTC>.json. The key is never printed, logged or stored; it is redacted from every string. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'po_spec.json');
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
const DATERE = /^\d{4}-\d{2}-\d{2}$/, TIMERE = /^\d{2}:\d{2}$/;
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unnamed'; /* the page's ourSlug */
const idOf = o => String(o.number);
const BRANCHES = ['KINP', 'NVAC', 'STPS', 'MEAD'];
spec.ops.forEach((o, i) => {
  const at = 'ops[' + i + '] ';
  if (o.op !== 'po_add') fail(at + 'unknown op ' + o.op);
  if (!/^\d{4,12}$/.test(String(o.number || ''))) fail(at + 'a purchase order number is 4 to 12 digits');
  const p = o.patch; if (!p || typeof p !== 'object') fail(at + 'needs the patch');
  if (typeof p.supplier_name !== 'string' || !p.supplier_name.trim() || p.supplier_name.length > 60) fail(at + 'needs the supplier, 60 characters at most');
  if (!BRANCHES.includes(p.branch)) fail(at + 'branch must be one of ' + BRANCHES.join(', '));
  if (p.revenue_branch != null && !BRANCHES.includes(p.revenue_branch)) fail(at + 'revenue_branch must be a branch or null');
  if (!(typeof p.amount === 'number' && p.amount >= 0)) fail(at + 'amount must be a number, zero or more');
  if (typeof p.what !== 'string' || !p.what.trim() || p.what.length > 80) fail(at + 'what: a description, 80 characters at most');
  if (!['fencing', 'toilets', 'transport', 'labour', 'other'].includes(p.stream)) fail(at + 'stream must be one the form offers');
  if (typeof o.why !== 'string' || !o.why.trim()) fail(at + 'needs why');
});
const PLANNED = spec.ops.map(idOf);
if (new Set(PLANNED).size !== PLANNED.length) fail('a purchase order is in the spec twice');
/* the documents this operation may touch: the planned orders and the stamp and author documents the page keeps beside them */
const ALLOWED_COLLS = new Set(['purchaseOrders', 'stamps', 'by']);
const docIdDecode = id => String(id).replace(/~([0-9a-f]{2})~/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const allowed = (k) => { const c = k.slice(0, k.indexOf('/')), id = docIdDecode(k.slice(k.indexOf('/') + 1)); if (!ALLOWED_COLLS.has(c)) return false;
  if (c === 'purchaseOrders') return PLANNED.includes(id);
  const m = id.match(/^po\/(\d+)$/); return !!m && PLANNED.includes(m[1]); };

// ---------------------------------------------------------------------------------------------- curl with headers on stdin
let seq = 0;
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
function curlGet(url, headers) {
  const tmp = path.join(os.tmpdir(), 'gc500-wb-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
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
  const missing = ['addOurCost', 'setOurCost', 'ourRawOf', 'ourCostOf', 'tombedHere', 'gradeOurs', 'ourSlug', 'whoAmI', 'mayWrite', 'capability', 'syncStage', 'syncSend', 'syncWaiting', 'toDocs', 'fromDocs', 'persist'].filter(n => typeof window[n] !== 'function');
  return {missing, hasS: typeof S === 'object' && !!S, hasColls: typeof SYNC_COLLS === 'object', level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status};
}
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot() {
  return JSON.parse(JSON.stringify({operator: S.operator || null, costs: (S.costs || []).filter(c => c && c.kind === 'labour').length, pos: Object.keys(S.purchaseOrders || {}).length,
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
  if (!mayWrite('the purchase order')) throw new Error('mayWrite() is false - this is not an edit link');
  if (typeof setPo !== 'function' || typeof poOf !== 'function') throw new Error('the page has no setPo / poOf');
  const out = [], flashes = []; const oldFlash = typeof flash === 'function' ? flash : null; if (oldFlash) flash = m => { flashes.push(String(m)); };
  try {
    for (const op of spec.ops) {
      const n = String(op.number), r = {op: op.op, id: n}; flashes.length = 0;
      try {
        if (poOf(n)) throw new Error('PO ' + n + ' is already on the record - change it on its own row');
        if (!setPo(n, Object.assign({}, op.patch))) throw new Error('setPo refused: ' + flashes.join(' | '));
        const held = (S.purchaseOrders || {})[n]; if (!held) throw new Error('the order is not held after setPo');
        for (const [k, v] of Object.entries(op.patch)) if (JSON.stringify(held[k] ?? null) !== JSON.stringify(v ?? null)) throw new Error(k + ' is held as ' + JSON.stringify(held[k]) + ', not ' + JSON.stringify(v));
        const o = poOf(n) || {};
        r.view = {supplier: o.supplier_name, branch: o.branch, revenue_branch: o.revenue_branch || null, amount: o.amount, stream: o.stream, confirmed: o.confirmed, by: held.by};
        r.result = 'added - ' + flashes.join(' | ');
      } catch (e) { r.result = 'ERROR: ' + e.message; r.error = true; }
      out.push(r);
    }
  } finally { if (oldFlash) flash = oldFlash; }
  const bad = out.filter(r => r.error);
  if (bad.length) throw new Error(bad.length + ' op(s) failed - nothing sent: ' + bad.map(r => r.op + ' ' + r.id + ': ' + r.result).join(' | '));
  if (typeof save === 'function') save();
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); } /* the dry run sends NOW, inside the poll window, so the aborted PUT is seen */
  return out;
}

// ---------------------------------------------------------------------------------------------- the run
(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`po_fill ${applying ? 'APPLY' : 'DRY RUN'} - ${spec.ops.length} purchase order(s) to add`);
    const before = await publicState();
    log(`before: record version ${before.version} updated ${before.updated}`);
    if (applying) { const bk = path.join(HERE, 'backup_state_' + started + '.json'); fs.writeFileSync(bk, JSON.stringify(before, null, 1) + '\n', {mode: 0o600}); log('backup of the whole record before: ' + bk); }

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
        if (!writesAllowed || !expected.has(key) || canon(body) !== expected.get(key)) { counts.blocked++; refused.push({method, key}); stop('write outside the plan: ' + key); return route.abort(); }
        if (sent.has(key)) { counts.blocked++; refused.push({method, key, retry: true}); stop('automatic retry refused: ' + key); return route.abort(); }
        sent.add(key); return route.continue();
      });
      page.on('response', r => { const q = r.request(); if (q.method() !== 'PUT' && q.method() !== 'DELETE') return; const m = new URL(r.url()).pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/); if (m) acks.set(decodeURIComponent(m[1]) + '/' + decodeURIComponent(m[2]), r.status()); });
      await page.goto(HOST + '/e/' + token + '#costs', {waitUntil: 'load', timeout: 180000});
    } else {
      let pageFile = argValue('--page') || process.env.PAGE || null;
      if (!pageFile) {
        pageFile = tempPage = path.join(os.tmpdir(), 'gc500-live-page-' + process.pid + '.html');
        const live = await curlGet(HOST + '/v/' + VIEW_TOKEN, {'cache-control': 'no-cache'});
        if (live.status !== 200) fail('public page answered ' + live.status);
        fs.writeFileSync(pageFile, live.body); log(`dry run page: the live page fetched now (${live.body.length} bytes, sha256 ${sha256(live.body)})`);
      } else log(`dry run page: ${pageFile} (${fs.statSync(pageFile).size} bytes, sha256 ${sha256(fs.readFileSync(pageFile))})`);
      const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
      harness = await open({pageFile, hash: '#costs'}); browser = harness.browser; page = harness.page;
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
    log(`  page before: ${pageBefore.pos} purchase orders on the record`);

    if (applying) {
      if (!controls.level || controls.level !== 'edit' || controls.readonly) fail('the service did not grant edit on this link (level ' + controls.level + ')');
      const aligned = await page.evaluate(alignStartupQueue, before.docs);
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);

    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyOps, {ops: spec.ops, by: spec.by, dry: !applying}).catch(e => fail('stage: ' + e.message));
    results.forEach(r => log(`stage: ${r.op} ${r.id} - ${r.result}${r.usable === false ? ' - NOT USABLE: ' + (r.problems || []).join('; ') : ''}${r.problems && r.problems.length && r.usable !== false ? ' - noted: ' + r.problems.join('; ') : ''}`));
    const pageAfter = await page.evaluate(pageSnapshot);
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (pageDocsAfter[c][id] == null) fail('the stage removed ' + k + ' - nothing sent'); expected.set(k, canon(pageDocsAfter[c][id])); }
    const checkDocs = (docs, where) => { const problems = [];
      for (const op of spec.ops) { const id = idOf(op), d = (docs.purchaseOrders || {})[id];
        if (!d) { problems.push('PO ' + id + ' is not held ' + where); continue; }
        for (const [k, v] of Object.entries(op.patch)) if (JSON.stringify(d[k] ?? null) !== JSON.stringify(v ?? null)) problems.push('PO ' + id + ' ' + k + ' is ' + JSON.stringify(d[k]) + ' not ' + JSON.stringify(v) + ' ' + where);
        if (String(d.number) !== id) problems.push('PO ' + id + ' does not carry its number ' + where); }
      return problems; };
    const stageProblems = checkDocs(pageDocsAfter, 'after the stage'); if (stageProblems.length) fail(stageProblems.join(' | '));
    log(`  page after: ${pageAfter.pos} purchase orders on the record`);
    const queued = Object.entries(pageAfter.queue).flatMap(([c, q]) => Object.keys(q).map(id => c + '/' + id));
    const unexpectedQueue = queued.filter(k => !expected.has(k) || !same(pageAfter.queue[k.slice(0, k.indexOf('/'))][k.slice(k.indexOf('/') + 1)], JSON.parse(expected.get(k))));
    if (applying && unexpectedQueue.length) fail('the page queued writes outside the plan: ' + unexpectedQueue.join(', ') + ' - nothing sent');

    if (!applying) {
      await new Promise(r => setTimeout(r, 1500));
      const blockedAfter = harness.counts.blocked;
      log(`writes the page tried: ${blockedAfter - blockedBefore} new aborted non-GET request(s) after the stage (aborted total ${blockedAfter}); page errors: ${harness.errors.length}`);
      log(`plan --apply would send (${expected.size}): ${[...expected.keys()].join(', ')}`);
      if (blockedAfter <= blockedBefore) fail('the page did not attempt a write after the stage - the dry run cannot confirm the write path');
      if (harness.errors.length) fail('page errors: ' + harness.errors.join(' | '));
      fs.writeFileSync(path.join(HERE, 'dryrun_' + started + '.json'), redact(JSON.stringify({author: 'Andrew Fisher', started, mode: 'dry', spec, stage: results, plan: [...expected.keys()]}, null, 1)) + '\n');
      log('DRY RUN PASSED - nothing reached the service');
      return;
    }

    // ---------------------------------------------------------------------------------------- APPLY: release exactly the planned writes
    if (!same((await publicState()).docs, before.docs)) fail('the record changed before release - nothing sent');
    if (fatal) throw fatal;
    writesAllowed = true;
    await page.evaluate(releaseSender);
    const deadline = Date.now() + 300000;
    for (;;) {
      if (fatal) throw fatal;
      const st = await page.evaluate(() => ({status: SYNC.status, unkept: !!SYNC.unkept, waiting: syncWaiting(), queueEmpty: Object.keys(SYNC.queue || {}).every(k => !Object.keys(SYNC.queue[k]).length), inflight: Object.keys(SYNC.inflight || {}).length}));
      if (st.unkept || ['offline', 'unreachable', 'error', 'stopped', 'paused', 'revoked'].includes(st.status)) fail('sync is ' + st.status + (st.unkept ? ' (unkept)' : '') + ' - inspect the service before any retry');
      if (st.queueEmpty && !st.inflight && st.waiting === 0 && [...expected.keys()].every(k => acks.get(k) === 200)) break;
      if (Date.now() > deadline) fail('the writes did not settle in 300 s (acknowledged: ' + [...acks.entries()].map(([k, s]) => k + '=' + s).join(', ') + ') - no automatic retry');
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
    log(`record version ${before.version} -> ${after.version}; ${expected.size} document(s) written; verification ${verify.ok ? 'OK' : 'PROBLEMS: ' + verify.problems.join(' | ')}`);
    log('report: ' + out);
    if (!verify.ok) exitCode = 2;
  } catch (e) {
    console.error('FAILED: ' + redact(e && e.message || e)); exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (tempPage) fs.rmSync(tempPage, {force: true});
    process.exit(exitCode);
  }
})();
