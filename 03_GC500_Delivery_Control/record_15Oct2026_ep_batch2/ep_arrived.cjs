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

   Spec: {"day": "2026-10-15", "by": "Andrew Fisher", "owner": "event-portables", "item": "FWF", "partial": false,
          "rows": [{"ref": "WC29", "numbers": ["0598", ...]}, {"ref": "WC28", "numbers": ["0102"]}]}.
   The count of numbers must equal the reference's FWF quantity (with "partial": true, fewer: the units and the
   supplied count go on and nothing is ticked); no number may already be active anywhere.

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
spec.rows.forEach(r => { if (!/^WC[0-9]+$/.test(r.ref || '')) fail('a row needs a toilet reference like WC29'); if (!Array.isArray(r.numbers) || !r.numbers.length) fail(r.ref + ' needs its numbers'); r.numbers.forEach(n => { if (!/^[0-9]{4}$/.test(n)) fail(r.ref + ': ' + n + ' is not a four-digit Event Portables number'); if (seenNo.has(n)) fail('duplicate number ' + n); seenNo.add(n); }); });
if (spec.owner !== 'event-portables') fail('spec.owner must be event-portables');
if (spec.item !== 'FWF') fail('spec.item must be FWF');
if (typeof spec.by !== 'string' || !spec.by.trim()) fail('spec.by must be a name');
if (/\bvia\b/i.test(spec.by)) fail('spec.by must be the person, with no agent suffix');
const PARTIAL = !!spec.partial; /* fewer numbers than the reference asks: the units and the supplied count go on, nothing is ticked complete */
const ROWS = spec.rows, REFS = ROWS.map(r => r.ref), REF = REFS.join('+'), NOTE = 'Arrival and installation confirmed by ' + spec.by + ', ' + (d => `${d.getUTCDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]} ${d.getUTCFullYear()}`)(new Date(spec.day + 'T00:00:00Z')) + '.';
const ALLOWED_COLLS = new Set(['loads', 'stamps', 'by', 'supplied', 'labour', 'delivery']);
const docIdDecode = id => String(id).replace(/~2f~/g, '/').replace(/~7c~/g, '|').replace(/~20~/g, ' ').replace(/~26~/g, '&');
const allowed = k => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (!ALLOWED_COLLS.has(c)) return false; const d = docIdDecode(id); if (d.indexOf('unit925/') === 0 || d.indexOf('loads/unit925/') === 0) return true; return REFS.some(r => d === r || d.indexOf(r + '|') === 0 || d.indexOf('/' + r + '|') >= 0 || d.indexOf('/' + r + '/') >= 0 || d === 'delivery/' + r || d === 'supplied/' + r || d.indexOf('supplied/' + r + '/') === 0); };

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
  const missing = ['assetOf', 'gcModel925', 'unit925Save', 'setSupplied', 'setLabour', 'setDate', 'setDone', 'deliveryOf', 'chargeLines', 'qtyOf', 'labourKey', 'isRef', 'whoAmI', 'mayWrite', 'capability', 'toDocs', 'fromDocs', 'syncStage', 'syncSend', 'syncWaiting', 'persist'].filter(f => typeof window[f] !== 'function');
  return {missing, hasS: typeof S === 'object' && !!S, hasColls: typeof SYNC_COLLS === 'object', level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status};
}
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot(spec) {
  const one = ref => { const a = assetOf(ref); if (!a) return null; const d = deliveryOf(ref), l = chargeLines(a).find(x => x.item === 'FWF');
    return {name: a.name, asked: l ? qtyOf(l) : null, units: gcModel925(a, {loading: false}).rows.filter(r => r.source !== 'history' && r.active !== false).map(r => r.assetNo + '/' + r.owner),
      supplied: (S.supplied || {})[ref] || null, install: !!(S.labour || {})[labourKey(ref, 'Toilets & amenities', 'FWF', 'install')], light: d.state, done: !!d.done, date: ((S.delivery || {})[ref] || {}).date || null, plan: a.first_date || null}; };
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
    if (!l || (spec.partial ? !(p.numbers.length < qtyOf(l)) : qtyOf(l) !== p.numbers.length)) throw new Error(p.ref + ': the FWF quantity is ' + (l ? qtyOf(l) : 'none') + ', not ' + p.numbers.length + ' - nothing done');
    const single = chargeLines(a).every(x => x.item === 'FWF');
    p.numbers.forEach(no => { const r = unit925Save(p.ref, {item: 'FWF', owner: spec.owner, assetNo: no, label: 'FWF', branch: '', note: spec.note, sourceKey: ''}, '', 'null', ''); if (!r || !r.ok || r.kept === false) throw new Error(p.ref + ' ' + no + ': ' + (r && r.reason)); out.push({ref: p.ref, unit: no, key: r.key || null}); });
    if (setSupplied(p.ref, 'FWF', {supplied: 'FWF', qty_supplied: p.numbers.length}) === false) throw new Error(p.ref + ': supplied refused'); out.push({ref: p.ref, supplied: p.numbers.length});
    if (spec.partial) { out.push({ref: p.ref, complete: false, why: p.numbers.length + ' of ' + qtyOf(l) + ' - a partial arrival, nothing ticked'}); return; }
    if (!setLabour(p.ref, 'Toilets & amenities', 'FWF', 'install', true)) throw new Error(p.ref + ': install tick refused'); out.push({ref: p.ref, install: true});
    if (single) { if (!setDate(p.ref, spec.day, 'in')) throw new Error(p.ref + ': date refused'); if (!setDone(p.ref, true)) throw new Error(p.ref + ': complete refused'); out.push({ref: p.ref, date: spec.day, complete: true}); }
    else out.push({ref: p.ref, complete: false, why: 'the reference carries other items too - the complete tick is left for the person'});
  });
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
    const everywhere = []; for (const [k, v] of Object.entries(before.docs.loads || {})) if (k.startsWith('unit925~2f~') && v && v.active !== false && ALLNO.includes(v.assetNo) && v.owner === spec.owner) everywhere.push(v.ref + '/' + v.assetNo);
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
    const pageBefore = await page.evaluate(pageSnapshot, {refs: REFS, numbers: ALLNO});
    const pageDocsBefore = await page.evaluate(pageDocs);
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');
    if (applying && pageBefore.today !== spec.day) fail('the page\'s day is ' + pageBefore.today + ', not the spec\'s ' + spec.day);
    REFS.forEach(r => { if (!pageBefore.refs[r]) fail(r + ' is not an asset on the page'); log(`  page before: ${r} "${pageBefore.refs[r].name}" asked ${pageBefore.refs[r].asked} · units ${JSON.stringify(pageBefore.refs[r].units)} · supplied ${JSON.stringify(pageBefore.refs[r].supplied)} · install ${pageBefore.refs[r].install} · light ${pageBefore.refs[r].light}, complete ${pageBefore.refs[r].done}`); });
    ROWS.forEach(p => { const asked = pageBefore.refs[p.ref].asked; if (PARTIAL ? !(p.numbers.length < asked) : asked !== p.numbers.length) fail(p.ref + ' asks for ' + asked + ' FWF, ' + p.numbers.length + ' numbers given' + (PARTIAL ? ' (partial needs fewer than asked)' : '') + ' - nothing done'); if (pageBefore.refs[p.ref].units.length) fail(p.ref + ' already carries units - nothing done'); });
    if (PARTIAL) log('  PARTIAL: the units and the supplied count go on; no install tick, no date, no complete tick');
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
    const results = await page.evaluate(applyOps, {rows: ROWS, owner: spec.owner, item: spec.item, day: spec.day, note: NOTE, by: spec.by, partial: PARTIAL, dry: !applying}).catch(e => fail('stage: ' + e.message));
    log('stage: ' + results.map(r => r.unit ? r.ref + ' unit ' + r.unit : r.supplied ? r.ref + ' supplied ' + r.supplied : r.install ? r.ref + ' install' : r.complete ? r.ref + ' dated ' + r.date + ', complete' : r.ref + ' not completed (' + r.why + ')').join('; '));
    const pageAfter = await page.evaluate(pageSnapshot, {refs: REFS, numbers: ALLNO});
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (pageDocsAfter[c][id] == null) fail('plan would REMOVE ' + k + ' - refused'); expected.set(k, canon(pageDocsAfter[c][id])); }
    const refOk = (r, p) => r && p.numbers.every(n => r.units.includes(n + '/' + spec.owner)) && r.supplied && r.supplied.items.some(i => i.asked === 'FWF' && i.qty_supplied === p.numbers.length) && (PARTIAL ? !r.install && !r.done : r.install && r.done && r.light === 'on site' && (r.date === spec.day || (r.date == null && r.plan === spec.day))); /* the page stores no date when the day IS the plan day */
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
      if (st.queueEmpty && !st.inflight && st.waiting === 0 && [...expected.keys()].every(k => acks.get(k) === 200)) break;
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
      if (!(sp.items || []).some(i => i.asked === 'FWF' && i.qty_supplied === p.numbers.length)) verify.problems.push(p.ref + ': the supplied count is not on the service');
      if (PARTIAL) { if (sd.done === true) verify.problems.push(p.ref + ': a partial arrival must not be ticked complete'); }
      else if (sd.done !== true || sd.state !== 'on site' || !(sd.date === spec.day || (sd.date == null && pageAfter.refs[p.ref].plan === spec.day))) verify.problems.push(p.ref + ': the complete tick, the green light or the date is not on the service');
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
