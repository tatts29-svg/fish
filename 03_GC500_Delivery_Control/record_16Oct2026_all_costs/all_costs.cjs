#!/usr/bin/env node
/* Author: Andrew Fisher. "I want us to have all cost in now please. Include demob and pick up charges. I want all
   costs showing as complete if I have it on site on my records, I want it all as done" (Andrew, 16 Oct 2026). For
   every reference with its light on site: every priced line the card carries for each item it holds - install, level,
   steps, clean, fire extinguisher, demob and any other priced line - ticked for every unit; the delivery and pick-up
   transport legs ticked; and the reference ticked complete. A tick a person took off (a stamp with the tick off) is
   never put back, per unit and per reference, and a complete a person took off stays off. Through the page's own
   setLabour and setDone. Dry run by default; --apply with GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA, backup first,
   held sender, write gate, read-back, report. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'all_spec.json');
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
if (typeof spec.by !== 'string' || !spec.by.trim() || /\bvia\b/i.test(spec.by)) fail('spec.by must be the person');
const ALLOWED_COLLS = new Set(['labour', 'stamps', 'by', 'delivery']);
let REFS = new Set();
const docIdDecode = id => String(id).replace(/~([0-9a-f]{2})~/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const allowed = k => { const c = k.slice(0, k.indexOf('/')), d = docIdDecode(k.slice(k.indexOf('/') + 1)); if (!ALLOWED_COLLS.has(c)) return false; const r = d.replace(/^(labour|delivery|levelled|steps)\//, '').split('|')[0].split('/')[0]; return REFS.has(r) || REFS.has(d); };

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
function pageSnapshot() { return {queue: Object.fromEntries(Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length)), waiting: syncWaiting(), level: SYNC.level, readonly: SYNC.readonly, done: null, state: null}; }
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
  const L = () => S.labour || {}, ST = () => S.stamps || {};
  /* spec.ours: stamps this operation's own interrupted run left without their tick (16 Oct 09:09 AEST) - not a person's
     untick. spec.clear: stamps to take off entirely so the line reads as never ticked. spec.lines / spec.refs narrow
     the run (Andrew, 16 Oct: "don't add things I never ticked" - no fire extinguishers). */
  const OURS = new Set(spec.ours || []), ONLY = spec.lines ? new Set(spec.lines) : null, REFSET = spec.refs ? new Set(spec.refs) : null;
  const offAt = k => !OURS.has(k) && !!ST()['labour/' + k] && !L()[k];
  const plan = [], done = [], skipped = {off: 0, refOff: 0, doneOff: []}, offList = [], refs = new Set(), cleared = [];
  for (const k of (spec.clear || [])) { if (L()[k]) throw new Error('clear asked on a ticked line ' + k); if (ST()['labour/' + k]) { delete S.stamps['labour/' + k]; if (S.by) delete S.by['labour/' + k]; cleared.push(k); refs.add(k.split('|')[0].split('/')[0]); } }
  if (cleared.length) save();
  holdAssets(() => {
    let T = {}; try { T = buildingTransportModel831() || {}; } catch (e) {}
    for (const a of allAssets()) {
      if (spec.max && refs.size >= spec.max) break;
      if (a._cancelled || movedAway(a.key)) continue; if (REFSET && !REFSET.has(a.key)) continue; const d = deliveryOf(a.key); if (d.state !== 'on site') continue;
      const ls = chargeLines(a) || []; if (!ls.length) continue;
      for (const l of ls) {
        const info = labourLinesFor(a.key, l.discipline, l.item, a.key, undefined, a);
        const units = labourUnits(a, l.item);
        for (const x of (info.lines || [])) { const line = x.key; if (ONLY && !ONLY.has(line)) continue;
          const refKey = labourKey(a.key, l.discipline, l.item, line);
          if (offAt(refKey)) { skipped.refOff++; offList.push(a.key + ' ' + l.item + ' ' + line); continue; }
          (units.length ? units : [undefined]).forEach(u => { if (labourTicked(a.key, l.discipline, l.item, line, u, a)) return; const k = labourKey(a.key, l.discipline, l.item, line, u); if (u !== undefined && offAt(k)) { skipped.off++; offList.push(a.key + ' ' + l.item + ' ' + line + ' ' + u); return; }
            plan.push({ref: a.key, disc: l.discipline, item: l.item, line, unit: u, rate: x.rate || 0}); refs.add(a.key); }); }
      }
      for (const leg of ['delivery', 'pickup']) { if (ONLY && !ONLY.has(leg)) continue;
        const row = (T.rows || []).find(r => r.ref === a.key && r.leg === leg && !['held', 'excluded', 'included'].includes(r.state)); if (!row) continue;
        const k = (typeof legKey === 'function' && legKey(a, leg)) || labourKey(a.key, ls[0].discipline, ls[0].item, leg);
        if (L()[k]) continue; if (offAt(k)) { skipped.off++; offList.push(a.key + ' ' + leg + ' leg'); continue; }
        plan.push({ref: a.key, disc: ls[0].discipline, item: ls[0].item, line: leg, unit: undefined, rate: Number(row.additional) || 0, key: k}); refs.add(a.key);
      }
      if (!d.done && !(ONLY && !ONLY.has('complete'))) { if (d.done_by || d.done_at) skipped.doneOff.push(a.key); else done.push(a.key); }
    }
  });
  const r0 = render; render = function () {}; /* one redraw at the end, not one per tick */
  try { plan.forEach(p => { if (!setLabour(p.ref, p.disc, p.item, p.line, true, p.unit)) throw new Error('setLabour refused ' + [p.ref, p.item, p.line, p.unit].join(' ')); if (p.key && !L()[p.key]) throw new Error('leg tick did not land on ' + p.key); }); done.forEach(k => { setDone(k, true); if (!deliveryOf(k).done) throw new Error('setDone did not land on ' + k); }); }
  finally { render = r0; }
  try { render(); } catch (e) {}
  const by = {}; plan.forEach(p => { by[p.line] = (by[p.line] || 0) + 1; });
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); }
  const money = {}; plan.forEach(p => { money[p.line] = Math.round(((money[p.line] || 0) + (p.rate || 0)) * 100) / 100; });
  return [{k: 'plan', ticked: true, now: plan.length + ' ticks on ' + refs.size + ' references · ' + JSON.stringify(by) + ' · at the card $' + Math.round(plan.reduce((n, p) => n + (p.rate || 0), 0) * 100) / 100 + ' ' + JSON.stringify(money) + ' · complete ticked on ' + done.length + ' · stamps cleared ' + cleared.length + ' · left off as a person set: ' + (skipped.off + skipped.refOff) + ' ticks, complete off on ' + skipped.doneOff.length,
   refs: [...refs], done, offList, doneOff: skipped.doneOff, sample: plan.slice(0, 12).map(p => p.ref + ' ' + p.item + ' ' + p.line + (p.unit ? ' ' + p.unit : ''))}];
}

(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`all-costs ${applying ? 'APPLY' : 'DRY RUN'} - everything on site: every priced card line incl. fire extinguisher and demob, delivery and pick-up legs, complete - by ${spec.by}`);
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
    const pageBefore = await page.evaluate(pageSnapshot);
    log('page loaded');
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
    const results = await page.evaluate(applyOps, Object.assign({}, spec, {dry: !applying})).catch(e => fail('stage: ' + e.message));
    log('stage: ' + results.map(r => r.now + ' · e.g. ' + r.sample.join('; ')).join('; '));
    const pageAfter = await page.evaluate(pageSnapshot);
    REFS = new Set(results[0].refs || []); log('references: ' + REFS.size);
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (pageDocsAfter[c][id] == null) { const dk = docIdDecode(id); if (c === 'stamps' && dk.startsWith('labour/') && (spec.clear || []).includes(dk.slice(7))) { expected.set(k, 'null'); continue; } fail('plan would REMOVE ' + k + ' - refused'); } expected.set(k, canon(pageDocsAfter[c][id])); }
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
    const deadline = Date.now() + 600000;
    for (;;) {
      if (fatal) throw fatal;
      const st = await page.evaluate(() => ({status: SYNC.status, unkept: !!SYNC.unkept, waiting: syncWaiting(), queueEmpty: Object.keys(SYNC.queue || {}).every(k => !Object.keys(SYNC.queue[k]).length), inflight: Object.keys(SYNC.inflight || {}).length}));
      if (st.unkept || ['offline', 'unreachable', 'error', 'stopped', 'paused', 'revoked'].includes(st.status)) fail('sync is ' + st.status + (st.unkept ? ' (unkept)' : '') + ' - inspect the service before any retry');
      if (st.queueEmpty && !st.inflight && st.waiting === 0 && [...expected.keys()].every(k => acks.get(k) === 200 || (expected.get(k) === 'null' && (acks.get(k) === 204 || acks.get(k) === 200)))) break;
      if (Date.now() > deadline) fail('the writes did not settle in 600 s (acknowledged: ' + [...acks.entries()].map(([k, s]) => k + '=' + s).join(', ') + ') - no automatic retry');
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
    log(verify.ok ? `VERIFIED - ${results[0].now}; every written document on the service as the page sent it` : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
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
