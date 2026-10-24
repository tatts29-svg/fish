#!/usr/bin/env node
/* Author: Andrew Fisher. Fridges moved from a plant line to a building through the page's own controls: each number
   taken off the line's unit record (UnitIdentity1006.remove - archived, active:false, who and when), then attached to
   the building as a Fridge accessory through the drawer's own Accessories form (openAsset, type Fridge, the number,
   quantity 1, Add - with the drawer's own duplicate checks).

     node fridges_to_p46.cjs                 DRY RUN (default): read-only through the harness, every write ABORTED.
     node fridges_to_p46.cjs --apply         needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA.
     options: --spec <file> (default fridges_spec.json beside this script)

   Spec: {"from": "T0265", "to": "P46", "owner": "coates", "numbers": ["1311992", "1283996"], "by": "Andrew Fisher"}.

   --apply, in order: before snapshot of GET /api/state (kept beside this script as the backup) -> the public page's
   sha256 must equal GC500_EXPECTED_PAGE_SHA -> Chromium opens /e/<key>#plant with the sender held and a write gate
   that aborts every non-GET not on the plan -> the startup queue must be empty or no-ops -> the stage -> the queued
   writes must all be the line's unit records (and their stamps and by) and the building's accessories document with
   the page's putting-back record beside it, none removed -> release the sender, allow exactly those PUTs once each
   -> settle (90 s) -> GET /api/state again -> verify and report_<UTC>.json. The key is never printed, logged or
   stored. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'fridges_spec.json');
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
const REFRX = /^[A-Z][A-Z0-9]{0,7}(-[A-Z0-9]{1,4})?$/;
if (!REFRX.test(spec.from || '') || !REFRX.test(spec.to || '') || spec.from === spec.to) fail('spec.from and spec.to must be two different references');
if (!Array.isArray(spec.numbers) || !spec.numbers.length || !spec.numbers.every(n => /^[0-9]{4,12}$/.test(n)) || new Set(spec.numbers).size !== spec.numbers.length) fail('spec.numbers must be distinct asset numbers');
if (typeof spec.owner !== 'string' || !spec.owner) fail('spec.owner must be the owning company');
if (typeof spec.by !== 'string' || !spec.by.trim()) fail('spec.by must be a name');
if (/\bvia\b/i.test(spec.by)) fail('spec.by must be the person, with no agent suffix');
const FROM = spec.from, TO = spec.to, NUMBERS = spec.numbers, REFS = [FROM, TO], REF = FROM + '->' + TO;
const ALLOWED_COLLS = new Set(['loads', 'stamps', 'by', 'accessories', 'deleted']);
const docIdDecode = id => String(id).replace(/~2f~/g, '/').replace(/~7c~/g, '|').replace(/~20~/g, ' ').replace(/~26~/g, '&');
const allowed = k => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (!ALLOWED_COLLS.has(c)) return false; const d = docIdDecode(id); if (d.indexOf('unit925/') === 0 || d.indexOf('loads/unit925/') === 0) return true; return d === TO || d.indexOf('acc/' + TO + '/') >= 0; };

// ---------------------------------------------------------------------------------------------- curl with headers on stdin
let seq = 0;
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
function curlGet(url, headers) {
  const tmp = path.join(os.tmpdir(), 'gc500-fr-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
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
  const missing = ['assetOf', 'gcModel925', 'openAsset', 'isRef', 'whoAmI', 'mayWrite', 'capability', 'toDocs', 'fromDocs', 'syncStage', 'syncSend', 'syncWaiting', 'persist'].filter(f => typeof window[f] !== 'function');
  return {missing, hasS: typeof S === 'object' && !!S, hasColls: typeof SYNC_COLLS === 'object', level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status};
}
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot(spec) {
  const units = ref => { const a = assetOf(ref); return a ? gcModel925(a, {loading: false}).rows.filter(r => r.source !== 'history' && r.active !== false).map(r => ({assetNo: r.assetNo, owner: r.owner, item: r.item, id: r.id, docKey: r.docKey || '', source: r.source})) : null; };
  const accs = ref => { const a = assetOf(ref); return a ? (a.accessories || []).map(x => ({type: x.type, qty: x.qty, asset_no: x.asset_no, origin: x.origin})) : null; };
  const elsewhere = []; allAssets().forEach(a => { if (a._cancelled || movedAway(a.key)) return; (a.accessories || []).forEach(x => { if (x.asset_no && spec.numbers.includes(String(x.asset_no))) elsewhere.push(a.key + '/' + x.asset_no + ' (accessory)'); }); if (a.key !== spec.from) gcModel925(a, {loading: false}).rows.forEach(u => { if (u.active !== false && u.source !== 'history' && spec.numbers.includes(String(u.assetNo))) elsewhere.push(a.key + '/' + u.assetNo + ' (unit)'); }); });
  return JSON.parse(JSON.stringify({
    operator: S.operator || null, hasUI: typeof UnitIdentity1006 === 'object' && typeof UnitIdentity1006.remove === 'function',
    fromUnits: units(spec.from), toAccs: accs(spec.to), toName: (assetOf(spec.to) || {}).name || null, fromName: (assetOf(spec.from) || {}).name || null, elsewhere,
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
  if (!mayWrite('unit number')) throw new Error('mayWrite() is false - this is not an edit link');
  if (!isRef(spec.from) || !isRef(spec.to)) throw new Error('a reference is not on the page');
  const rows = ref => gcModel925(assetOf(ref), {loading: false}).rows.filter(r => r.source !== 'history' && r.active !== false);
  const out = [];
  /* off the line first, every one */
  spec.numbers.forEach(n => {
    const u = rows(spec.from).find(r => r.assetNo === n && r.owner === spec.owner);
    if (!u) throw new Error(spec.from + ' does not carry ' + n + ' for ' + spec.owner + ' - nothing done');
    const r = UnitIdentity1006.remove(spec.from, u.id, UnitIdentity1006.token(u));
    if (!r || !r.ok) throw new Error(spec.from + ' take off ' + n + ' refused: ' + (r && r.reason));
    out.push({ref: spec.from, off: n, docKey: u.docKey || null});
  });
  /* then onto the building through the drawer's own Accessories form */
  spec.numbers.forEach(n => {
    const before = ((S.accessories || {})[spec.to] || []).length;
    openAsset(spec.to);
    const sel = document.querySelector('#drawer #accType'), qty = document.querySelector('#drawer #accQty'), no = document.querySelector('#drawer #accNo'), desc = document.querySelector('#drawer #accDesc'), add = document.querySelector('#drawer #accAdd');
    if (!sel || !qty || !no || !desc || !add) throw new Error('the drawer did not open its Accessories form for ' + spec.to);
    sel.value = 'Fridge'; if (sel.value !== 'Fridge') throw new Error('the drawer does not offer Fridge');
    qty.value = '1'; no.value = n; desc.value = '';
    add.click();
    const list = (S.accessories || {})[spec.to] || [];
    if (list.length !== before + 1) throw new Error('the drawer did not add a row for ' + n + ' (' + before + ' -> ' + list.length + ')');
    const row = list[list.length - 1];
    if (row.type !== 'Fridge' || row.qty !== 1 || String(row.asset_no) !== n || row.origin !== 'added in this page') throw new Error('the row is not what was asked: ' + JSON.stringify(row));
    out.push({ref: spec.to, on: n, added_at: row.added_at});
  });
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); } /* the dry run sends NOW, inside the poll window, so the aborted PUT is seen */
  return out;
}

// ---------------------------------------------------------------------------------------------- the run
(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`fridges ${applying ? 'APPLY' : 'DRY RUN'} - ${NUMBERS.join(', ')} off ${FROM} (unit records) and onto ${TO} as Fridge accessories - by ${spec.by}`);
    const before = await publicState();
    log(`before: record version ${before.version} updated ${before.updated}`);
    if (applying) { const bk = path.join(HERE, 'backup_state_' + started + '.json'); fs.writeFileSync(bk, JSON.stringify(before, null, 1) + '\n', {mode: 0o600}); log('backup of the whole record before: ' + bk); }
    const unitDocs = docs => Object.entries(docs.loads || {}).filter(([k, v]) => k.startsWith('unit925~2f~') && v && v.ref === FROM).map(([k, v]) => ({key: k, ref: v.ref, assetNo: v.assetNo, owner: v.owner, active: v.active !== false}));
    unitDocs(before.docs).forEach(d => log(`  ${d.ref}: ${d.assetNo} (${d.owner}) ${d.active ? 'active' : 'archived'} · ${d.key}`));
    const accRows = docs => (((docs.accessories || {})[TO] || {}).v || []);
    log(`  ${TO} accessories document rows: ${accRows(before.docs).map(r => r.type + (r.asset_no ? ' ' + r.asset_no : '')).join(', ') || 'none'}`);

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
    const pageBefore = await page.evaluate(pageSnapshot, {from: FROM, to: TO, numbers: NUMBERS});
    const pageDocsBefore = await page.evaluate(pageDocs);
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');
    if (!pageBefore.hasUI) fail('the page has no unit-identity controls');
    if (!pageBefore.fromUnits || !pageBefore.toAccs) fail('a reference is not an asset on the page');
    log(`  page before: ${FROM} "${pageBefore.fromName}" units ${JSON.stringify(pageBefore.fromUnits.map(u => u.assetNo + ' (' + u.owner + ')'))}`);
    log(`  page before: ${TO} "${pageBefore.toName}" accessories ${JSON.stringify(pageBefore.toAccs.map(x => x.type + (x.asset_no ? ' ' + x.asset_no : '')))}`);
    NUMBERS.forEach(n => { if (!pageBefore.fromUnits.some(u => u.assetNo === n && u.owner === spec.owner)) fail(FROM + ' does not carry ' + n + ' - nothing done'); if (pageBefore.toAccs.some(x => String(x.asset_no) === n)) fail(TO + ' already carries ' + n + ' - nothing done'); });
    if (pageBefore.elsewhere.length) fail('a number is on another reference: ' + pageBefore.elsewhere.join(', ') + ' - nothing done');

    if (applying) {
      if (!controls.level || controls.level !== 'edit' || controls.readonly) fail('the service did not grant edit on this link (level ' + controls.level + ')');
      const aligned = await page.evaluate(alignStartupQueue, before.docs);
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else {
      if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);
    }

    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyOps, {from: FROM, to: TO, owner: spec.owner, numbers: NUMBERS, by: spec.by, dry: !applying}).catch(e => fail('stage: ' + e.message));
    log('stage: ' + results.map(r => r.ref + (r.off ? ' off ' + r.off : ' fridge ' + r.on + ' on')).join(', '));
    const pageAfter = await page.evaluate(pageSnapshot, {from: FROM, to: TO, numbers: NUMBERS});
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (pageDocsAfter[c][id] == null) fail('plan would REMOVE ' + k + ' - refused'); expected.set(k, canon(pageDocsAfter[c][id])); }
    const ok = NUMBERS.every(n => !pageAfter.fromUnits.some(u => u.assetNo === n) && pageAfter.toAccs.some(x => x.type === 'Fridge' && String(x.asset_no) === n));
    if (!ok) fail('after the stage the numbers are not off ' + FROM + ' and on ' + TO + ': ' + JSON.stringify({from: pageAfter.fromUnits, to: pageAfter.toAccs}));
    log(`  page after: ${FROM} units ${JSON.stringify(pageAfter.fromUnits.map(u => u.assetNo))} · ${TO} accessories ${JSON.stringify(pageAfter.toAccs.map(x => x.type + (x.asset_no ? ' ' + x.asset_no : '')))}`);
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
    const afterUnits = unitDocs(after.docs), afterAcc = accRows(after.docs);
    NUMBERS.forEach(n => {
      if (afterUnits.some(d => d.assetNo === n && d.active)) verify.problems.push(FROM + ' still carries ' + n + ' active on the service');
      if (!afterUnits.some(d => d.assetNo === n && !d.active)) verify.problems.push(FROM + ': the archived record for ' + n + ' is not on the service');
      if (!afterAcc.some(r => r.type === 'Fridge' && String(r.asset_no) === n)) verify.problems.push(TO + ' does not carry fridge ' + n + ' on the service');
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
    log(verify.ok ? `VERIFIED - ${NUMBERS.join(', ')} archived on ${FROM} and attached to ${TO} as fridges on the service` : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
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
