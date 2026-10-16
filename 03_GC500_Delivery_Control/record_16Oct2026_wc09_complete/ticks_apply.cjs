#!/usr/bin/env node
/* Author: Andrew Fisher. Ticks on one reference through the page's own tick buttons (the seven-symbol row, v10.33:
   sym1033Toggle - the same handler a tap runs). Andrew, 16 Oct 2026: "WC09 should be complete ... the 2 x toilet blocks
   are all done, each should have delivery, install, level, steps, clean, demob, pick up". Only symbols not already
   fully ticked are tapped; a tick Andrew took off (a stamp with the tick off) is never put back. Demob and pick up are
   the end-of-hire charges and are not tapped. Dry run by default; --apply with GC500_EDIT_TOKEN and
   GC500_EXPECTED_PAGE_SHA, backup first, held sender, write gate, read-back, report. The key is never printed. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'ticks_spec.json');
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
if (!/^[A-Z]{1,3}[0-9]+$/.test(spec.ref || '')) fail('spec.ref must be a reference');
if (!Array.isArray(spec.symbols) || spec.symbols.some(s => !['delivery', 'install', 'levelling', 'steps', 'cleaning'].includes(s))) fail('spec.symbols: delivery, install, levelling, steps, cleaning only');
if (spec.restamp != null && (!Array.isArray(spec.restamp) || spec.restamp.some(x => !x.disc || !x.item || !['install'].includes(x.line)))) fail('spec.restamp: [{disc, item, line: install}]');
if (!spec.symbols.length && !(spec.restamp || []).length && !spec.complete) fail('nothing to do');
if (typeof spec.by !== 'string' || !spec.by.trim() || /\bvia\b/i.test(spec.by)) fail('spec.by must be the person');
const REF = spec.ref;
const ALLOWED_COLLS = new Set(['labour', 'stamps', 'by', 'delivery']);
const docIdDecode = id => String(id).replace(/~([0-9a-f]{2})~/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const allowed = k => { const c = k.slice(0, k.indexOf('/')), d = docIdDecode(k.slice(k.indexOf('/') + 1)); if (!ALLOWED_COLLS.has(c)) return false; return d === REF || d.indexOf(REF + '|') === 0 || d.indexOf('/' + REF + '|') >= 0 || d.endsWith('/' + REF) || d.indexOf('/' + REF + '/') >= 0; };

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
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot(ref) { const st = sym1033State(ref); return {state: Object.fromEntries(Object.entries(st).map(([k, v]) => [k, v && v.applies ? {on: v.on, of: v.of, all: v.all, off: !!v.off} : null])), done: !!deliveryOf(ref).done, today: todayIso(),
  queue: Object.fromEntries(Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length)), waiting: syncWaiting(), level: SYNC.level, readonly: SYNC.readonly}; }
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
  const dry = !!spec.dry; if (dry) { capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; }
  S.operator = spec.by; if (whoAmI() !== spec.by) throw new Error('whoAmI() did not return ' + spec.by);
  const out = [];
  for (const k of spec.symbols) {
    const st = sym1033State(spec.ref)[k];
    if (!st || !st.applies) { out.push({k, skipped: 'does not apply'}); continue; }
    if (st.off) { out.push({k, skipped: 'taken off by a person - left off'}); continue; }
    const done = st.of != null ? st.all : st.on; if (done) { out.push({k, skipped: 'already ticked'}); continue; }
    if (!sym1033Toggle(spec.ref, k)) throw new Error(k + ': the tick button refused');
    const after = sym1033State(spec.ref)[k]; const ok = after.of != null ? after.all : after.on; if (!ok) throw new Error(k + ': not ticked after the tap');
    out.push({k, ticked: true, now: after.of != null ? after.on + '/' + after.of : 'on'});
  }
  (spec.restamp || []).forEach(x => { /* the same tick saved again, so its stamp follows the latest arrival count (the Toilets card counts an install only when its tick is newer than the receipt) */
    if (!labourTicked(spec.ref, x.disc, x.item, x.line)) throw new Error(x.item + ' ' + x.line + ' is not ticked - restamp only re-saves an existing tick');
    if (!setLabour(spec.ref, x.disc, x.item, x.line, true)) throw new Error(x.item + ' ' + x.line + ': setLabour refused');
    out.push({k: x.item + ' ' + x.line, ticked: true, now: 're-saved'}); });
  if (spec.complete) { if (deliveryOf(spec.ref).done) out.push({k: 'complete', skipped: 'already complete'}); else { if (!setDone(spec.ref, true)) throw new Error('complete refused'); out.push({k: 'complete', ticked: true, now: 'complete'}); } }
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); }
  return out;
}

(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`ticks ${applying ? 'APPLY' : 'DRY RUN'} - ${REF}: ${spec.symbols.join(', ')} - by ${spec.by}`);
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
    const pageBefore = await page.evaluate(pageSnapshot, REF);
    log('page before: ' + JSON.stringify(pageBefore.state) + ' complete ' + pageBefore.done);
    const pageDocsBefore = await page.evaluate(pageDocs);
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');
    if (applying) {
      if (pageBefore.level !== 'edit' || pageBefore.readonly) fail('the service did not grant edit on this link (level ' + pageBefore.level + ')');
      const aligned = await page.evaluate(alignStartupQueue, before.docs);
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else {
      if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);
    }

    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyOps, {ref: REF, symbols: spec.symbols, restamp: spec.restamp || [], complete: !!spec.complete, by: spec.by, dry: !applying}).catch(e => fail('stage: ' + e.message));
    log('stage: ' + results.map(r => r.k + (r.ticked ? ' ticked (' + r.now + ')' : ' skipped: ' + r.skipped)).join('; '));
    const pageAfter = await page.evaluate(pageSnapshot, REF);
    log('page after: ' + JSON.stringify(pageAfter.state));
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (pageDocsAfter[c][id] == null) { fail('plan would REMOVE ' + k + ' - refused'); } expected.set(k, canon(pageDocsAfter[c][id])); }
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
    for (const r of results.filter(x => x.ticked)) { /* read back through the page's own reading of the service copy */ }
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(after.docs)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(after.docs[c] || {})])) {
      const k = c + '/' + id; if (expected.has(k)) continue;
      const was = (before.docs[c] || {})[id], now = (after.docs[c] || {})[id];
      if (!same(was ?? null, now ?? null)) verify.otherDocsChanged.push(k);
      else if (JSON.stringify(was) !== JSON.stringify(now)) verify.serialisationDiffers.push(k);
    }
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
    log(verify.ok ? `VERIFIED - ${REF}: ${results.map(r => r.k + (r.ticked ? ' ticked' : ' ' + r.skipped)).join('; ')}; every written document on the service as the page sent it` : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
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
