#!/usr/bin/env node
/* Author: Andrew Fisher. After the 16 Oct de-duplication the service holds the surviving copy of each week-1 agreement
   under its suffixed id (F-AF-0001·d9d2 …) and 36592 under F-AFV-0035·2904. The page, on load, gives a record whose
   base id is now unique its plain id back (F-AF-0001, F-AFV-0035): the same document under the plain key, the suffixed
   key removed. Every other runner refuses to start while that tidy sits in the startup queue, so this one lets the
   page write exactly that tidy and nothing else.

     node settle_rekey.cjs               DRY RUN (default): the page is opened read-only through the harness, every write
                                         it tries is ABORTED, and the script prints what --apply would send.
     node settle_rekey.cjs --apply       needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA in the environment.

   The plan is accepted only if every queued change is a rename: a new plain-key document identical to an existing
   suffixed one apart from id/_k, and the removal of that suffixed key; any other change stops the run. Backup of the
   whole record first, held sender, a write gate that allows exactly the planned PUTs and DELETEs once each, settle,
   read back, verify, report_<UTC>.json. The key is never printed, logged or stored. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const applying = args.includes('--apply');
const token = process.env.GC500_EDIT_TOKEN || '', expectedSha = process.env.GC500_EXPECTED_PAGE_SHA || '';
const redact = s => token ? String(s).split(token).join('[key]') : String(s);
const canon = x => JSON.stringify((function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; })(x));
const same = (a, b) => canon(a) === canon(b);
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const utc = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const log = (...a) => console.log(...a.map(redact));
const fail = m => { throw new Error(redact(m)); };
const docIdDecode = id => String(id).replace(/~([0-9a-f]{2})~/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

// ---------------------------------------------------------------------------------------------- curl with headers on stdin
let seq = 0;
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
function curlGet(url, headers) {
  const tmp = path.join(os.tmpdir(), 'gc500-settle-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
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
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageState() { return {level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status, inflight: Object.keys(SYNC.inflight || {}).length, waiting: syncWaiting(), queue: Object.fromEntries(Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length))}; }
function holdSender() {
  if (typeof syncSend !== 'function') throw new Error('syncSend missing');
  if (!window.__heldSend) { window.__heldSend = syncSend; syncSend = function () { clearTimeout(SYNC.timer); SYNC.timer = null; syncStage(); }; }
  return true;
}
function stageNow() { syncStage(); return {level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status, inflight: Object.keys(SYNC.inflight || {}).length, waiting: syncWaiting(), queue: Object.fromEntries(Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length))}; }
function releaseSender() { if (!window.__heldSend) throw new Error('sender was not held'); syncSend = window.__heldSend; delete window.__heldSend; syncSend(); return true; }
function dryRelease() { capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); return true; }

// ---------------------------------------------------------------------------------------------- the plan: renames only
function renamePlan(serverDocs, pageDocsNow) {
  const plan = new Map(), pairs = [];
  const s = serverDocs.fenceDockets || {}, p = pageDocsNow.fenceDockets || {};
  const gone = Object.keys(s).filter(k => !(k in p)), born = Object.keys(p).filter(k => !(k in s));
  for (const k of Object.keys(s)) if (k in p && !same(s[k], p[k])) fail('fenceDockets/' + k + ' changed in value on load - not a rename; nothing sent');
  for (const nk of born) {
    const nd = p[nk]; const base = docIdDecode(nk);
    const ok = gone.filter(gk => { const gd = s[gk]; const strip = d => { const o = Object.assign({}, d); delete o.id; delete o._k; return o; }; return docIdDecode(gk).startsWith(base + '·') && same(strip(gd), strip(nd)) && nd.id === base && nd._k === base; });
    if (ok.length !== 1) fail('fenceDockets/' + nk + ' is not the plain id of exactly one suffixed document (' + ok.join(', ') + '); nothing sent');
    pairs.push({from: ok[0], to: nk}); plan.set('fenceDockets/' + nk, canon(nd)); plan.set('fenceDockets/' + ok[0], 'null');
  }
  const unpaired = gone.filter(gk => !pairs.some(x => x.from === gk)); if (unpaired.length) fail('removed without a plain copy: ' + unpaired.join(', ') + '; nothing sent');
  for (const c of new Set([...Object.keys(serverDocs), ...Object.keys(pageDocsNow)])) { if (c === 'fenceDockets') continue; for (const id of new Set([...Object.keys(serverDocs[c] || {}), ...Object.keys(pageDocsNow[c] || {})])) if (!same((serverDocs[c] || {})[id] ?? null, (pageDocsNow[c] || {})[id] ?? null)) fail('a change outside fenceDockets on load: ' + c + '/' + id + '; nothing sent'); }
  return {plan, pairs};
}

// ---------------------------------------------------------------------------------------------- the run
(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`settle_rekey ${applying ? 'APPLY' : 'DRY RUN'} - let the page give the surviving fencing records their plain ids back`);
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
      const got = sha256(live.body); if (got !== expectedSha) fail('the public page is ' + got + ', not the reviewed ' + expectedSha + ' - nothing applied');
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
      const pageFile = tempPage = path.join(os.tmpdir(), 'gc500-live-page-' + process.pid + '.html');
      const live = await curlGet(HOST + '/v/' + VIEW_TOKEN, {'cache-control': 'no-cache'});
      if (live.status !== 200) fail('public page answered ' + live.status);
      fs.writeFileSync(pageFile, live.body); log(`dry run page: the live page fetched now (${live.body.length} bytes, sha256 ${sha256(live.body)})`);
      const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
      harness = await open({pageFile, hash: '#plant'}); browser = harness.browser; page = harness.page;
    }
    await page.waitForFunction(pageReady, null, {timeout: 180000});
    if (fatal) throw fatal;
    const st = await page.evaluate(stageNow);
    log(`page live: level ${st.level}, readonly ${st.readonly}; startup queue holds ${Object.values(st.queue).reduce((n, q) => n + Object.keys(q).length, 0)} document(s)`);
    const pageDocsNow = await page.evaluate(pageDocs);
    const {plan, pairs} = renamePlan(before.docs, pageDocsNow);
    expected = plan;
    pairs.forEach(x => log(`  ${docIdDecode(x.from)} -> ${docIdDecode(x.to)}`));
    log(`plan: ${pairs.length} rename(s), ${expected.size} document(s): ${pairs.length} PUT, ${pairs.length} DELETE`);
    const queued = Object.entries(st.queue).flatMap(([c, q]) => Object.keys(q).map(id => c + '/' + id));
    const outside = queued.filter(k => !expected.has(k));
    if (outside.length) fail('the startup queue holds documents outside the rename plan: ' + outside.join(', ') + ' - nothing sent');
    const missing = [...expected.keys()].filter(k => !queued.includes(k)); if (missing.length) fail('the plan is not fully queued: ' + missing.join(', '));

    if (!applying) {
      const blockedBefore = harness.counts.blocked;
      await page.evaluate(dryRelease);
      await new Promise(r => setTimeout(r, 2500));
      log(`writes the page tried: ${harness.counts.blocked - blockedBefore} aborted non-GET request(s); page errors: ${harness.errors.length}`);
      if (harness.counts.blocked <= blockedBefore) fail('the page did not attempt a write - the dry run cannot confirm the write path');
      if (harness.errors.length) fail('page errors: ' + harness.errors.join(' | '));
      log('DRY RUN PASSED - nothing reached the service');
      return;
    }
    if (st.level !== 'edit' || st.readonly) fail('the service did not grant edit on this link (level ' + st.level + ')');
    if (!same((await publicState()).docs, before.docs)) fail('the record changed before release - nothing sent');
    if (fatal) throw fatal;
    writesAllowed = true;
    await page.evaluate(releaseSender);
    const deadline = Date.now() + 120000;
    for (;;) {
      if (fatal) throw fatal;
      const s2 = await page.evaluate(() => ({status: SYNC.status, unkept: !!SYNC.unkept, waiting: syncWaiting(), queueEmpty: Object.keys(SYNC.queue || {}).every(k => !Object.keys(SYNC.queue[k]).length), inflight: Object.keys(SYNC.inflight || {}).length}));
      if (s2.unkept || ['offline', 'unreachable', 'error', 'stopped', 'paused', 'revoked'].includes(s2.status)) fail('sync is ' + s2.status + (s2.unkept ? ' (unkept)' : '') + ' - inspect the service before any retry');
      if (s2.queueEmpty && !s2.inflight && s2.waiting === 0 && [...expected.keys()].every(k => acks.get(k) === 200 || (expected.get(k) === 'null' && (acks.get(k) === 204 || acks.get(k) === 200)))) break;
      if (Date.now() > deadline) fail('the writes did not settle in 120 s (acknowledged: ' + [...acks.entries()].map(([k, s]) => k + '=' + s).join(', ') + ') - no automatic retry');
      await new Promise(r => setTimeout(r, 200));
    }
    writesAllowed = false;
    log(`acknowledged: ${acks.size} (${[...acks.values()].filter(s => s === 200 || s === 204).length} ok)`);
    const after = await publicState();
    const verify = {ok: true, problems: [], otherDocsChanged: []};
    for (const [k, v] of expected) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); const now = (after.docs[c] || {})[id]; if (v === 'null' ? now !== undefined : canon(now) !== v) verify.problems.push(k + ' on the service is not what was planned'); }
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(after.docs)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(after.docs[c] || {})])) { const k = c + '/' + id; if (expected.has(k)) continue; if (!same((before.docs[c] || {})[id] ?? null, (after.docs[c] || {})[id] ?? null)) verify.otherDocsChanged.push(k); }
    if (verify.otherDocsChanged.length) verify.problems.push('other documents changed: ' + verify.otherDocsChanged.join(', '));
    verify.ok = !verify.problems.length;
    const report = {author: 'Andrew Fisher', started, finished: new Date().toISOString(), mode: 'apply', pageSha256: expectedSha, version: {before: before.version, after: after.version}, updated: {before: before.updated, after: after.updated}, renames: pairs.map(x => ({from: docIdDecode(x.from), to: docIdDecode(x.to)})), writes: [...expected.keys()].map(k => ({key: k, status: acks.get(k) ?? null})), refused, verification: verify};
    const out = path.join(HERE, 'report_settle_' + started + '.json');
    fs.writeFileSync(out, redact(JSON.stringify(report, null, 1)) + '\n', {mode: 0o600});
    log(`record version ${before.version} -> ${after.version}`);
    log(verify.ok ? `VERIFIED - ${pairs.length} records carry their plain ids on the service, nothing else changed` : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
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
