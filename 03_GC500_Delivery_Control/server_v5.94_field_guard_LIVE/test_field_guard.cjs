/* Author: Andrew Fisher. Server v5.94 — the delivery field guard and the snapshot read.
   Real HTTP against the server.js beside this file, on 127.0.0.1 only, with a throw-away DATA_DIR and fake tokens.
   No request leaves this machine and nothing touches the live record. Run: node test_field_guard.cjs */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), crypto = require('crypto');
const assert = require('assert/strict'), { spawn } = require('child_process');

const EDIT = 'local-test-editor', VIEW = 'local-test-viewer';
const SERVER = path.join(__dirname, 'server.js');
const V593 = path.join(__dirname, '../server_v5.93_lock_declaration_LIVE/server.js');
const CLOCK = path.join(__dirname, '../server_v5.90_servicing_tracker_DRAFT/fake_clock.js');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-field-guard-'));
const SNAPS = path.join(dir, 'snapshots'), RECORDS = path.join(dir, 'records.json'), LOG = path.join(dir, 'writes.log');
let child = null, port = 0, checks = 0;
const check = (label, ok, detail) => { if (!ok) { console.error('FAIL ' + label, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600)); } assert(ok, label); checks++; console.log('PASS ' + label); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const J = v => JSON.stringify(v === undefined ? null : v);

/* one request; token: 'edit' | 'view' | 'wrong' | null; raw: a body sent exactly as given */
function request(method, url, { body, raw, token = 'edit' } = {}) {
  return new Promise((resolve, reject) => {
    const data = raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : null;
    const headers = {};
    if (token) headers['x-gc500-token'] = token === 'edit' ? EDIT : token === 'view' ? VIEW : 'wrong-key-0000000000';
    headers['x-gc500-who'] = 'Field Guard Test';
    if (data !== null) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(data); }
    const r = http.request({ host: '127.0.0.1', port, method, path: url, headers }, s => {
      const parts = []; s.on('data', x => parts.push(x));
      s.on('end', () => { const buf = Buffer.concat(parts); let j; try { j = JSON.parse(buf.toString('utf8')); } catch (e) { j = undefined; } resolve({ status: s.statusCode, headers: s.headers, buf, j }); });
    });
    r.on('error', reject); r.end(data === null ? undefined : data);
  });
}
async function stop() { if (child) { const c = child; child = null; c.kill('SIGTERM'); await new Promise(r => c.once('exit', r)); } }
async function start(file = SERVER) {
  port = await new Promise(r => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const n = s.address().port; s.close(() => r(n)); }); });
  const fd = fs.openSync(path.join(dir, 'server.log'), 'a');
  /* the environment is spelled out: nothing from the caller's environment but PATH reaches the server */
  child = spawn(process.execPath, ['-r', CLOCK, file], { env: { PATH: process.env.PATH, PORT: String(port), DATA_DIR: dir, EDIT_TOKEN: EDIT, VIEW_TOKEN: VIEW, FAKE_NOW: '2026-10-24T10:00:00+10:00' }, stdio: ['ignore', fd, fd] });
  for (let i = 0; i < 200; i++) { try { const r = await request('GET', '/health', { token: null }); if (r.status === 200) return r.j; } catch (e) { /* not up yet */ } await wait(50); }
  throw Error('server did not start');
}
const disk = () => JSON.parse(fs.readFileSync(RECORDS, 'utf8'));
const logLines = () => (fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []);
async function keptLine(v) { for (let i = 0; i < 60; i++) { const l = logLines().find(x => x.what === 'delivery fields kept' && x.v === v); if (l) return l; await wait(25); } return null; }
async function settleLog() { await wait(150); }

/* every successful write must move the record on by exactly one version */
let version = 0;
async function putDoc(coll, id, body, opts = {}) {
  const r = await request('PUT', '/api/doc/' + coll + '/' + id, Object.assign({ body }, opts));
  if (r.status === 200) { assert.equal(r.j.version, version + 1, 'one version per write'); version = r.j.version; }
  return r;
}
async function stored(coll, id) { const r = await request('GET', '/api/state'); return r.j.docs[coll] && r.j.docs[coll][id]; }

const T1 = '2026-10-26T10:00:00.000Z', T2 = '2026-10-26T11:00:00.000Z', T3 = '2026-10-26T12:00:00.000Z';
const PROTECTED = ['ready1231', 'ready1231_at', 'ready1231_by', 'ready1231_why', 'ready1231_history',
  'ready1238_units', 'ready1238_history', 'pickup1238_units', 'pickup1238_history',
  'emptied', 'emptied_at', 'emptied_by', 'emptied_history', 'timeline841', 'loading872', 'handling875'];
/* a delivery document as the current page (v12.42.1) writes one: every family present, and _k last, because the page's
   toDocs builds each document as Object.assign({}, r, {_k: k}) */
const full = k => Object.assign({}, {
  state: 'on site', set_at: T1, by: 'Test Operator', history: [{ state: 'on site', at: T1, by: 'Test Operator' }],
  done: true, done_at: T1, done_by: 'Test Operator', done_history: [{ done: true, at: T1, by: 'Test Operator' }],
  eta: '07:30', note: 'gate 3',
  ready1231: true, ready1231_at: T2, ready1231_by: 'Test Ready', ready1231_why: '', ready1231_history: [{ ready: true, at: T2, by: 'Test Ready', why: '' }],
  ready1238_units: { U1: { on: true, at: T2, by: 'Test Ready', why: '', doc: 'D1' }, U2: { on: false, at: T2, by: 'Test Ready', why: 'still in use' } },
  ready1238_history: [{ unit: 'U1', ready: true, at: T2, by: 'Test Ready', why: '' }, { unit: 'U2', ready: false, at: T2, by: 'Test Ready', why: 'still in use' }],
  pickup1238_units: { U1: { at: '2026-10-28T07:00:00+10:00', note: 'first run', by: 'Test Booker', set: T2 } },
  pickup1238_history: [{ unit: 'U1', pickup: '2026-10-28T07:00:00+10:00', note: 'first run', by: 'Test Booker', at: T2 }],
  emptied: true, emptied_at: T1, emptied_by: 'Test Pump', emptied_history: [{ emptied: true, at: T1, by: 'Test Pump' }],
  timeline841: { stage: 3, at: T1, by: 'Test Operator' }, loading872: { L1: { side: 'driver', by: 'Test Operator', at: T1 } },
  handling875: { method: 'forklift', by: 'Test Operator', at: T1 },
}, { _k: k });
/* the same document as a page from before those fields existed writes it: the protected families gone */
const stale = d => { const o = {}; Object.keys(d).forEach(k => { if (!PROTECTED.includes(k)) o[k] = d[k]; }); return o; };
/* The page's own fold and rebuild of one stored document (live v12.42.1): fromDocs strips _k
   (strip = d => { const o = Object.assign({}, d); delete o._k; return o; }) and toDocs puts it back last
   (Object.assign({}, r, {_k: k})). syncStageLive queues any document whose rebuilt text is not the text it folded. */
const strip = d => { const o = Object.assign({}, d); delete o._k; return o; };
const rebuilt = d => Object.assign({}, strip(d), { _k: d._k });
const roundTrips = d => J(rebuilt(d)) === J(d);
/* The page's live sync for delivery documents, cut down to what decides which documents a page sends (live v12.42.1):
     syncFold      SYNC.last[id] = JSON.stringify(stored document); the record becomes fromDocs(stored)
     syncStageLive a document is queued when JSON.stringify(toDocs()[id]) !== SYNC.last[id]
     syncSettled   after a 200, SYNC.last[id] = the text that was sent
   A page that has folded a document and then saves anything sends every queued document, its own older copy included. */
function page() {
  let S = {}, last = {};
  const toDocs = () => { const out = {}; Object.entries(S).forEach(([k, r]) => { if (r && typeof r === 'object') out[k] = Object.assign({}, r, { _k: k }); }); return out; };
  const fromDocs = docs => { const o = {}; Object.values(docs).forEach(d => { if (d && d._k != null) o[d._k] = strip(d); }); return o; };
  const staged = () => { const d = toDocs(); return Object.keys(d).filter(id => JSON.stringify(d[id]) !== last[id]); };
  return {
    async fold() { const docs = (await request('GET', '/api/state')).j.docs.delivery || {}; last = {}; Object.entries(docs).forEach(([id, b]) => { last[id] = JSON.stringify(b); }); S = fromDocs(docs); },
    staged,
    edit(fn) { fn(S); },
    async save() { const d = toDocs(), sent = []; for (const id of staged()) { const r = await putDoc('delivery', id, d[id]); if (r.status === 200) { last[id] = JSON.stringify(d[id]); sent.push(id); } } return sent; },
  };
}
/* The page's own history join, word for word from Singles1238's keepUnits (live v12.42.1), with its two line keys */
const hj = (x, y, k) => { const a = Array.isArray(x) ? x : [], seen = new Set(a.map(k)), add = (Array.isArray(y) ? y : []).filter(h => h && !seen.has(k(h))); return add.length ? a.concat(add).sort((p, q) => String(p.at || '').localeCompare(String(q.at || '')) || k(p).localeCompare(k(q))).slice(-400) : null; };
const hr = h => (h.unit || '') + '|' + h.ready + '|' + h.at, hp = h => (h.unit || '') + '|' + (h.pickup || '') + '|' + h.at;

(async () => {
  try {
    /* ================================================================= start-up and the capability */
    let health = await start();
    check('1. health says v5.94 with delivery_field_guard_version 1 beside the earlier capabilities',
      health.build === 'v5.94' && health.delivery_field_guard_version === 1 && health.lock_declarations_version === 1 && health.crew_groups_version === 1 && health.ok, health);
    const card = { load: 'servicing-tracker:LOCAL', title: 'Synthetic servicing', run_date: '2026-10-23', expires: '2026-10-26', keys: [], html: '<!doctype html><title>Local only</title>',
      tracker: { days: [{ id: '2026-10-23', plan: 'night' }], lines: [{ id: 'TEST-FWF', ref: 'TEST', kind: 'fwf', qty: 1 }], plans: { fwf: { night: ['pump', 'clean', 'refill', 'lockup'] } } } };
    let r = await request('POST', '/api/cards', { body: card });
    check('2. a synthetic tracker card is made on the local server', r.status === 200 && r.j.token, r.j);
    const route = '/d/' + r.j.token + '/ticks', sig = r.j.tracker.links.TEST;
    r = await request('GET', route, { token: null });
    check('3. the crew read reports delivery_field_guard_version 1 beside lock_declarations_version', r.status === 200 && r.j.delivery_field_guard_version === 1 && r.j.lock_declarations_version === 1, r.j);
    r = await request('POST', route, { token: null, body: { ticks: [{ id: crypto.randomBytes(16).toString('hex'), ref: 'TEST', sig, line: 'TEST-FWF', task: 'pump', day: '2026-10-23', done: true, undoes: [], tapped_at: '2026-10-23T15:00:00Z' }] } });
    check('4. the tick save acknowledgement reports delivery_field_guard_version 1', r.status === 200 && r.j.delivery_field_guard_version === 1 && r.j.lock_declarations_version === 1, r.j);
    version = (await request('GET', '/api/version')).j.version;

    /* ================================================================= the guard */
    const d1 = full('TST01');
    r = await putDoc('delivery', 'TST01', d1);
    check('5. a brand-new delivery document is stored exactly as sent (byte for byte, on the disk)', r.status === 200 && J(disk().docs.delivery.TST01) === J(d1));
    await settleLog();
    check('6. ...and no "fields kept" line is logged for it', !logLines().some(l => l.what === 'delivery fields kept' && l.v === version));

    const s1 = Object.assign(stale(d1), { state: 'in transit', set_at: T3, history: d1.history.concat([{ state: 'in transit', at: T3, by: 'Old Tab' }]), eta: '08:15' });
    const before = version;
    r = await putDoc('delivery', 'TST01', s1);
    let got = disk().docs.delivery.TST01;
    check('7. a stale write is answered 200 and moves the record on by exactly one version', r.status === 200 && r.j.version === before + 1 && (await request('GET', '/api/version')).j.version === before + 1, r.j);
    check('8. every protected field the stale write left out is kept, value for value (byte-equal JSON)', PROTECTED.every(k => J(got[k]) === J(d1[k])), PROTECTED.filter(k => J(got[k]) !== J(d1[k])));
    check('9. ...and the fields it did send are stored as sent (state, set_at, history, eta)', got.state === 'in transit' && got.set_at === T3 && J(got.history) === J(s1.history) && got.eta === '08:15', got);
    check('10. ...and nothing else is added or lost: the stored fields are the sent ones plus the kept ones',
      J(Object.keys(got).sort()) === J([...new Set(Object.keys(s1).concat(PROTECTED))].sort()), Object.keys(got));
    check('10a. ...in the order the page writes a document: the sent fields, then the kept ones (list order), then _k last',
      J(Object.keys(got)) === J(Object.keys(s1).filter(k => k !== '_k').concat(PROTECTED, ['_k'])), Object.keys(got));
    const served = (await request('GET', '/api/state')).j.docs.delivery.TST01;
    check('10b. ...so the stored text reads back through the page\'s own fromDocs and toDocs unchanged (on the disk and as served)',
      roundTrips(got) && roundTrips(served) && J(served) === J(got));
    check('11. ...and the change is on the disk before it is answered (records.json version matches)', disk().version === r.j.version);
    let line = await keptLine(r.j.version);
    check('12. the write log says which fields were kept, for which document, and how many units',
      line && line.coll === 'delivery' && line.id === 'TST01' && J(line.kept) === J(PROTECTED) && line.unitsKept === 3, line);
    check('13. ...beside the ordinary "set" line of the same version', logLines().some(l => l.op === 'set' && l.v === r.j.version && l.id === 'TST01' && l.who === 'Field Guard Test'));
    const lineText = fs.readFileSync(LOG, 'utf8').split('\n').find(l => l.includes('"delivery fields kept"') && l.includes('"v":' + r.j.version + ','));
    check('14. ...and that line carries names and a count, never a value or a unit id',
      J(Object.keys(line).sort()) === J(['at', 'coll', 'id', 'kept', 'unitsKept', 'v', 'what']) && !/Test Ready|Test Booker|Test Pump|forklift|still in use|"U1"|"U2"|first run/.test(lineText), lineText);

    /* the incident's size: 68 documents written back stale in a row */
    const ids68 = Array.from({ length: 68 }, (_, i) => 'BULK' + String(i + 1).padStart(2, '0'));
    for (const id of ids68) await putDoc('delivery', id, full(id));
    const v68 = version;
    for (const id of ids68) { const x = full(id); x.note = 'rewritten by an old tab'; await putDoc('delivery', id, stale(x)); }
    const dk = disk().docs.delivery;
    await settleLog();
    const lines68 = logLines().filter(l => l.what === 'delivery fields kept' && l.v > v68 && l.v <= v68 + 68);
    check('15. 68 stale documents in a row: 68 versions, every protected field on every one kept, the new note on every one',
      version === v68 + 68 && ids68.every(id => PROTECTED.every(k => J(dk[id][k]) === J(full(id)[k])) && dk[id].note === 'rewritten by an old tab'));
    check('16. ...and 68 "fields kept" log lines, one per document, 3 units each', lines68.length === 68 && new Set(lines68.map(l => l.id)).size === 68 && lines68.every(l => l.unitsKept === 3 && l.kept.length === 16), lines68.length);
    check('16a. ...and every one of the 68 has _k last and reads back through the page\'s fromDocs and toDocs unchanged',
      ids68.every(id => Object.keys(dk[id]).pop() === '_k' && roundTrips(dk[id])), ids68.filter(id => !roundTrips(dk[id])).length);

    /* the review's two-page case: after a stale write, phones P and Q both fold the record; Q marks a reference picked
       up and Not ready; P, still holding its earlier copy, saves an unrelated change before its next poll */
    const P = page(), Q = page();
    await P.fold(); await Q.fold();
    check('16b. after the stale writes, a current page that folds the record has nothing of its own to send (no guarded document looks changed)',
      P.staged().length === 0 && Q.staged().length === 0, P.staged().length);
    Q.edit(S => { const x = S.BULK01; x.state = 'picked up'; x.set_at = T3; x.by = 'Phone Q'; x.history = x.history.concat([{ state: 'picked up', at: T3, by: 'Phone Q' }]);
      x.ready1231 = false; x.ready1231_at = T3; x.ready1231_by = 'Phone Q'; x.ready1231_why = 'gone'; x.ready1231_history = x.ready1231_history.concat([{ ready: false, at: T3, by: 'Phone Q', why: 'gone' }]); });
    const qSent = await Q.save();
    P.edit(S => { S.BULK02.note = 'phone P only'; });
    const pSent = await P.save();
    got = disk().docs.delivery.BULK01;
    check('16c. ...Q sends only its reference, and P\'s unrelated save sends only P\'s: Q\'s picked up and Not ready survive',
      J(qSent) === J(['BULK01']) && J(pSent) === J(['BULK02']) && got.state === 'picked up' && got.ready1231 === false && got.ready1231_history.length === 2
      && disk().docs.delivery.BULK02.note === 'phone P only', { qSent, pSent, state: got.state });

    /* _k goes back to the end only when a field is added: a body from another writer with _k first */
    const kFirst = d => Object.assign({ _k: d._k }, strip(d));
    await putDoc('delivery', 'TSK01', kFirst(full('TSK01')));
    r = await putDoc('delivery', 'TSK01', kFirst(stale(full('TSK01'))));
    got = disk().docs.delivery.TSK01;
    check('16d. a body sent with _k first that has fields added gets _k moved to the end, the other fields in the order sent',
      r.status === 200 && J(Object.keys(got)) === J(Object.keys(stale(full('TSK01'))).filter(k => k !== '_k').concat(PROTECTED, ['_k'])), Object.keys(got));
    await putDoc('delivery', 'TSK02', kFirst(Object.assign(full('TSK02'), { ready1238_units: { A: { on: true, at: T2, by: 'Test Ready', why: '' } } })));
    const merged = kFirst(Object.assign(full('TSK02'), { ready1238_units: { B: { on: true, at: T3, by: 'Test Ready', why: '' } } }));
    r = await putDoc('delivery', 'TSK02', merged);
    got = disk().docs.delivery.TSK02;
    check('16e. ...while a write where a unit map is only merged in place keeps exactly the order it was sent in (_k still first)',
      r.status === 200 && J(Object.keys(got)) === J(Object.keys(merged)) && J(Object.keys(got.ready1238_units)) === J(['B', 'A']), Object.keys(got));

    /* an explicit null is the sender's word */
    await putDoc('delivery', 'TST02', full('TST02'));
    r = await putDoc('delivery', 'TST02', Object.assign(stale(full('TST02')), { ready1231: null, ready1238_units: null, pickup1238_history: null, emptied: null }));
    got = await stored('delivery', 'TST02');
    check('17. an explicit null clears: ready1231, ready1238_units, pickup1238_history and emptied stored as null',
      r.status === 200 && got.ready1231 === null && got.ready1238_units === null && got.pickup1238_history === null && got.emptied === null, got);
    check('18. ...while the fields it left out are still kept', ['ready1231_at', 'ready1231_history', 'pickup1238_units', 'ready1238_history', 'emptied_at', 'handling875'].every(k => J(got[k]) === J(full('TST02')[k])));
    line = await keptLine(r.j.version);
    check('19. ...and the log names only the fields kept (12), not the nulled ones; units kept = the 1 booking map copied whole',
      line && line.kept.length === 12 && !line.kept.includes('ready1231') && !line.kept.includes('ready1238_units') && line.unitsKept === 1, line);

    /* a sent value stands as sent: no clock merge on the scalars, and no merge of the histories beside them */
    await putDoc('delivery', 'TST03', full('TST03'));
    const s3 = Object.assign(full('TST03'), { ready1231: false, ready1231_at: T1, ready1231_why: 'older word', ready1231_history: [{ ready: false, at: T1, by: 'Test Ready', why: 'older word' }],
      emptied_history: [] });
    r = await putDoc('delivery', 'TST03', s3);
    check('20. sent fields stand as sent: an older ready1231 stamp, a shorter ready1231 history and an empty Emptied history are stored exactly (byte for byte)', r.status === 200 && J(await stored('delivery', 'TST03')) === J(s3));
    await settleLog();
    check('21. ...and nothing kept, so no "fields kept" line', !logLines().some(l => l.what === 'delivery fields kept' && l.v === r.j.version));

    /* the two unit histories join the way the page's keepUnits joins them, so a unit entry the map merge keeps keeps its line */
    const rl = (unit, ready, at, by = 'Test Ready', why = '') => ({ unit, ready, at, by, why });
    const pl = (unit, pickup, at, by = 'Test Booker') => ({ unit, pickup, note: '', by, at });
    const phoneA = Object.assign(full('TSH01'), {
      ready1238_units: Object.assign({}, full('TSH01').ready1238_units, { U3: { on: true, at: T3, by: 'Phone A', why: '' } }),
      ready1238_history: full('TSH01').ready1238_history.concat([rl('U3', true, T3, 'Phone A')]),
      pickup1238_units: Object.assign({}, full('TSH01').pickup1238_units, { U3: { at: '2026-10-29T07:00:00+10:00', note: '', by: 'Phone A', set: T3 } }),
      pickup1238_history: full('TSH01').pickup1238_history.concat([pl('U3', '2026-10-29T07:00:00+10:00', T3, 'Phone A')]) });
    await putDoc('delivery', 'TSH01', phoneA);
    const phoneB = Object.assign(full('TSH01'), {   /* phone B has not read phone A's tick or booking yet */
      ready1238_units: Object.assign({}, full('TSH01').ready1238_units, { U4: { on: true, at: T3, by: 'Phone B', why: '' } }),
      ready1238_history: full('TSH01').ready1238_history.concat([rl('U4', true, T3, 'Phone B')]),
      pickup1238_units: Object.assign({}, full('TSH01').pickup1238_units, { U4: { at: '2026-10-29T08:00:00+10:00', note: '', by: 'Phone B', set: T3 } }),
      pickup1238_history: full('TSH01').pickup1238_history.concat([pl('U4', '2026-10-29T08:00:00+10:00', T3, 'Phone B')]) });
    r = await putDoc('delivery', 'TSH01', phoneB);
    got = disk().docs.delivery.TSH01;
    const lineFor = (list, u, e, word) => list.some(h => h.unit === u && h.at === (word === 'ready' ? e.at : e.set) && (word === 'ready' ? h.ready === e.on : (h.pickup || '') === e.at));
    check('20a. two phones on one reference: both units kept in each map, and each history holds both phones\' lines, joined and ordered exactly as the page\'s keepUnits would',
      r.status === 200 && J(Object.keys(got.ready1238_units).sort()) === J(['U1', 'U2', 'U3', 'U4']) && J(Object.keys(got.pickup1238_units).sort()) === J(['U1', 'U3', 'U4'])
      && J(got.ready1238_history) === J(hj(phoneB.ready1238_history, phoneA.ready1238_history, hr)) && J(got.pickup1238_history) === J(hj(phoneB.pickup1238_history, phoneA.pickup1238_history, hp)), got.ready1238_history);
    check('20b. ...so no unit stands Ready or booked in a map without its history line',
      Object.entries(got.ready1238_units).every(([u, e]) => lineFor(got.ready1238_history, u, e, 'ready')) && Object.entries(got.pickup1238_units).every(([u, e]) => lineFor(got.pickup1238_history, u, e, 'pickup')));
    line = await keptLine(r.j.version);
    check('20c. ...and the log names the two maps and the two histories, with the 2 unit entries kept (A\'s tick and booking)',
      line && J(line.kept) === J(['ready1238_units', 'ready1238_history', 'pickup1238_units', 'pickup1238_history']) && line.unitsKept === 2 && roundTrips(got), line);

    /* a history line already sent (same unit, word and stamp) is not added twice, and the sent copy stands */
    await putDoc('delivery', 'TSH02', full('TSH02'));
    const sameKey = Object.assign(full('TSH02'), { ready1238_history: [rl('U1', true, T2, 'Other Name'), rl('U2', false, T2, 'Test Ready', 'still in use')] });
    r = await putDoc('delivery', 'TSH02', sameKey);
    check('20d. a stored line whose unit, word and stamp the sent list already has is not added: the sent list is stored exactly as sent',
      r.status === 200 && J(disk().docs.delivery.TSH02) === J(sameKey));
    await settleLog();
    check('20e. ...with no "fields kept" line', !logLines().some(l => l.what === 'delivery fields kept' && l.v === r.j.version));

    /* the page's cut to the newest 400 lines */
    const minute = i => new Date(Date.parse('2026-10-26T00:00:00.000Z') + i * 60e3).toISOString();
    const long = Array.from({ length: 400 }, (_, i) => rl('U' + (i % 7), i % 2 === 0, minute(i)));
    await putDoc('delivery', 'TSH03', Object.assign(full('TSH03'), { ready1238_history: long }));
    const cut = Object.assign(full('TSH03'), { ready1238_history: long.slice(1).concat([rl('U9', true, minute(400))]) });   /* a page that ticked once more and cut its list to 400 */
    r = await putDoc('delivery', 'TSH03', cut);
    check('20f. a page that ticked once more and cut its list to the newest 400 is stored exactly as sent (the join comes to the same 400 lines)',
      r.status === 200 && J(disk().docs.delivery.TSH03) === J(cut));
    const gap = Object.assign(full('TSH03'), { ready1238_history: long.slice(1).filter((_, i) => i !== 199).concat([rl('U9', true, minute(400)), rl('U8', true, minute(401))]) });
    r = await putDoc('delivery', 'TSH03', gap);
    got = disk().docs.delivery.TSH03.ready1238_history;
    check('20g. ...and a list missing a line from the middle gets it back, still cut to the newest 400 in the page\'s order',
      r.status === 200 && got.length === 400 && J(got) === J(hj(gap.ready1238_history, cut.ready1238_history, hr)) && got.some(h => h.at === minute(200)) && got[0].at === minute(2), got.length);

    /* lists the page never writes are left as sent and never stop the write */
    await putDoc('delivery', 'TSH04', full('TSH04'));
    const oddSent = Object.assign(full('TSH04'), { ready1238_history: [null, rl('U7', true, T3)], pickup1238_history: { not: 'a list' } });
    r = await putDoc('delivery', 'TSH04', oddSent);
    check('20h. a sent history holding a null line, or one that is not a list, is stored exactly as sent (200)', r.status === 200 && J(disk().docs.delivery.TSH04) === J(oddSent));
    await putDoc('delivery', 'TSH05', null, { raw: J(full('TSH05')).replace('"ready1238_history":[', '"ready1238_history":[null,{"unit":"U5","ready":true,"at":{"toString":1,"valueOf":1}},') });
    r = await putDoc('delivery', 'TSH05', Object.assign(full('TSH05'), { ready1238_history: [rl('U7', true, T3)] }));
    got = disk().docs.delivery.TSH05.ready1238_history;
    check('20i. stored lines the join cannot read (null, an object for a stamp) are left out of the join and never stop the write; the readable ones are added',
      r.status === 200 && got.length === 3 && J(got) === J([full('TSH05').ready1238_history[0], full('TSH05').ready1238_history[1], rl('U7', true, T3)]), got);

    /* the unit maps merge by the page's own rule */
    const ru = (on, at, why = '') => ({ on, at, by: 'Test Ready', why });
    await putDoc('delivery', 'TST04', Object.assign(full('TST04'), { ready1238_units: { A: ru(true, T2), B: ru(true, T1), C: ru(true, T1) } }));
    r = await putDoc('delivery', 'TST04', Object.assign(full('TST04'), { ready1238_units: { A: ru(false, T1, 'older'), B: ru(false, T3, 'newer'), D: ru(true, T3) } }));
    got = (await stored('delivery', 'TST04')).ready1238_units;
    check('22. ready1238_units: the stored entry wins where its "at" is later (A)', J(got.A) === J(ru(true, T2)), got);
    check('23. ...the incoming entry wins where its "at" is later (B)', J(got.B) === J(ru(false, T3, 'newer')), got);
    check('24. ...no unit on either side is dropped (C only stored, D only incoming)', J(got.C) === J(ru(true, T1)) && J(got.D) === J(ru(true, T3)) && Object.keys(got).length === 4, Object.keys(got));
    line = await keptLine(r.j.version);
    check('25. ...and the log names ready1238_units with 2 units kept (A, C)', line && J(line.kept) === J(['ready1238_units']) && line.unitsKept === 2, line);

    await putDoc('delivery', 'TST05', Object.assign(full('TST05'), { ready1238_units: { E: ru(true, T2) } }));
    await putDoc('delivery', 'TST05', Object.assign(full('TST05'), { ready1238_units: { E: ru(false, T2, 'wet') } }));
    await putDoc('delivery', 'TST06', Object.assign(full('TST06'), { ready1238_units: { E: ru(false, T2, 'wet') } }));
    r = await putDoc('delivery', 'TST06', Object.assign(full('TST06'), { ready1238_units: { E: ru(true, T2) } }));
    const e5 = (await stored('delivery', 'TST05')).ready1238_units.E, e6 = (await stored('delivery', 'TST06')).ready1238_units.E;
    check('26. the same stamp: the smaller JSON wins whichever copy arrives first (Not ready over Ready, both ways)',
      J(e5) === J(ru(false, T2, 'wet')) && J(e6) === J(ru(false, T2, 'wet')) && J(ru(false, T2, 'wet')) < J(ru(true, T2)), { e5, e6 });
    line = await keptLine(r.j.version);
    check('27. ...and where the stored entry won the tie it is logged as 1 unit kept', line && line.unitsKept === 1, line);

    const bk = (at, set, note = '') => ({ at, note, by: 'Test Booker', set });
    await putDoc('delivery', 'TST07', Object.assign(full('TST07'), { pickup1238_units: { P: bk('2026-10-27T09:00:00+10:00', T3) } }));
    await putDoc('delivery', 'TST07', Object.assign(full('TST07'), { pickup1238_units: { P: bk('2026-10-29T09:00:00+10:00', T2) } }));
    await putDoc('delivery', 'TST08', Object.assign(full('TST08'), { pickup1238_units: { P: bk('2026-10-27T09:00:00+10:00', T2) } }));
    await putDoc('delivery', 'TST08', Object.assign(full('TST08'), { pickup1238_units: { P: bk('2026-10-26T09:00:00+10:00', T3) } }));
    check('28. pickup1238_units is judged by "set" (when the booking was written), not by "at" (the booked time): the later set wins both ways',
      J((await stored('delivery', 'TST07')).pickup1238_units.P) === J(bk('2026-10-27T09:00:00+10:00', T3)) && J((await stored('delivery', 'TST08')).pickup1238_units.P) === J(bk('2026-10-26T09:00:00+10:00', T3)));
    await putDoc('delivery', 'TST09', Object.assign(full('TST09'), { pickup1238_units: { Q: bk('2026-10-28T07:00:00+10:00', T2, 'n') } }));
    await putDoc('delivery', 'TST09', Object.assign(full('TST09'), { pickup1238_units: { Q: bk('', T2) } }));
    await putDoc('delivery', 'TST10', Object.assign(full('TST10'), { pickup1238_units: { Q: bk('', T2) } }));
    await putDoc('delivery', 'TST10', Object.assign(full('TST10'), { pickup1238_units: { Q: bk('2026-10-28T07:00:00+10:00', T2, 'n') } }));
    check('29. the same "set" stamp: a cleared booking wins over a booking, whichever copy arrives first',
      J((await stored('delivery', 'TST09')).pickup1238_units.Q) === J(bk('', T2)) && J((await stored('delivery', 'TST10')).pickup1238_units.Q) === J(bk('', T2)));

    await putDoc('delivery', 'TST11', Object.assign(full('TST11'), { ready1238_units: { R: ru(true, T1), N: null, M: ru(true, T1) } }));
    await putDoc('delivery', 'TST11', Object.assign(full('TST11'), { ready1238_units: { R: { on: false, by: 'Test Ready', why: '' }, M: null, K: ru(true, T2) } }));
    got = (await stored('delivery', 'TST11')).ready1238_units;
    check('30. an entry with no stamp loses to a stamped one, a null incoming entry gives way to the stored entry, and a stored null unit is kept',
      J(got.R) === J(ru(true, T1)) && J(got.M) === J(ru(true, T1)) && got.N === null && Object.prototype.hasOwnProperty.call(got, 'N') && J(got.K) === J(ru(true, T2)), got);

    const noMaps = stale(full('TST12')), withMaps = full('TST12');
    await putDoc('delivery', 'TST12', noMaps);
    r = await putDoc('delivery', 'TST12', withMaps);
    check('31. maps sent where the stored document has none are stored exactly as sent', J(await stored('delivery', 'TST12')) === J(withMaps));
    await settleLog();
    check('32. ...with no "fields kept" line', !logLines().some(l => l.what === 'delivery fields kept' && l.v === r.j.version));

    /* the current page's own writes are untouched */
    await putDoc('delivery', 'TST13', full('TST13'));
    const tick = full('TST13');
    tick.ready1238_units = { U1: Object.assign(ru(false, T3, 'not yet'), { doc: 'D1' }), U2: tick.ready1238_units.U2, U3: ru(true, T3) };
    tick.ready1238_history = tick.ready1238_history.concat([{ unit: 'U1', ready: false, at: T3, by: 'Test Ready', why: 'not yet' }, { unit: 'U3', ready: true, at: T3, by: 'Test Ready', why: '' }]);
    tick.pickup1238_units = { U1: bk('', T3) };
    tick.pickup1238_history = tick.pickup1238_history.concat([{ unit: 'U1', pickup: '', note: '', by: 'Test Booker', at: T3 }]);
    r = await putDoc('delivery', 'TST13', tick);
    check('33. a current setUnitReady/setBooking write (superset maps, later stamps) is stored byte for byte as sent', J(disk().docs.delivery.TST13) === J(tick));
    await settleLog();
    check('34. ...with no "fields kept" line', !logLines().some(l => l.what === 'delivery fields kept' && l.v === r.j.version));

    const dated = Object.assign(full('TST14'), { date: '2026-10-26', date_by: 'Test Operator', date_at: T1, done_date_only: true, done_effective_date: '2026-10-25', done_recorded_at: T1 });
    await putDoc('delivery', 'TST14', dated);
    const cleared = full('TST14'); delete cleared.eta; delete cleared.note; cleared.done_at = T3;
    r = await putDoc('delivery', 'TST14', cleared);
    got = await stored('delivery', 'TST14');
    check('35. clears the page makes on purpose still clear: eta, note, the date group and the dated-complete trio are gone',
      ['eta', 'note', 'date', 'date_by', 'date_at', 'done_date_only', 'done_effective_date', 'done_recorded_at'].every(k => !(k in got)) && J(got) === J(cleared), Object.keys(got));

    /* only the delivery collection is guarded */
    for (const coll of ['units', 'Delivery', 'deliveryNotes']) {
      await putDoc(coll, 'TST01', full('TST01'));
      r = await putDoc(coll, 'TST01', stale(full('TST01')));
      check('36. collection "' + coll + '" is untouched: the stale body is stored exactly as sent', J(disk().docs[coll].TST01) === J(stale(full('TST01'))));
    }
    await settleLog();
    check('37. ...and no "fields kept" line names any other collection', logLines().filter(l => l.what === 'delivery fields kept').every(l => l.coll === 'delivery'));

    /* a unit called "__proto__" is a unit, never a prototype */
    await putDoc('delivery', 'TST15', null, { raw: J(full('TST15')).replace('"ready1238_units":{', '"ready1238_units":{"__proto__":{"on":true,"at":"' + T2 + '","by":"Test Ready","why":""},') });
    r = await putDoc('delivery', 'TST15', Object.assign(full('TST15'), { ready1238_units: { U9: ru(true, T3) } }));
    got = (await stored('delivery', 'TST15')).ready1238_units;
    check('38. a stored unit named "__proto__" is kept as an ordinary unit when the incoming map leaves it out',
      Object.prototype.hasOwnProperty.call(got, '__proto__') && J(got['__proto__']) === J(ru(true, T2)) && got.U9 && got.U1 && Object.keys(got).length === 4, Object.keys(got));
    health = (await request('GET', '/health', { token: null })).j;
    check('39. ...and the service is unharmed', health.ok && health.build === 'v5.94');

    /* DELETE is not guarded in v5.94 (README, known limits) */
    r = await request('DELETE', '/api/doc/delivery/TST02');
    if (r.status === 200) version = r.j.version;
    check('40. DELETE of a delivery document still deletes it (v5.94 guards writes only)', r.status === 200 && !(await stored('delivery', 'TST02')));
    r = await putDoc('delivery', 'TST02', stale(full('TST02')));
    check('41. ...and a write after the delete has no stored copy to keep from: stored exactly as sent', J(await stored('delivery', 'TST02')) === J(stale(full('TST02'))));

    /* refusals change nothing */
    const vBefore = version;
    r = await request('PUT', '/api/doc/delivery/TST01', { body: stale(full('TST01')), token: 'view' });
    check('42. a view link still cannot write (403), and the version does not move', r.status === 403 && (await request('GET', '/api/version')).j.version === vBefore);
    r = await request('PUT', '/api/doc/delivery/TST01', { raw: '[1,2]' });
    check('43. a body that is not an object is refused (400) before the guard, and the version does not move', r.status === 400 && (await request('GET', '/api/version')).j.version === vBefore);

    /* ================================================================= restart: the kept fields are on the disk */
    const recordsBefore = fs.readFileSync(RECORDS);
    await stop(); health = await start();
    got = await stored('delivery', 'TST01');
    check('44. after a restart the kept fields are still there and nothing was recovered from a snapshot',
      PROTECTED.every(k => J(got[k]) === J(d1[k])) && got.state === 'in transit' && health.record_recovered === null && health.ok);

    /* ================================================================= the snapshot read */
    let list = await request('GET', '/api/admin/snapshots');
    const own = fs.readdirSync(SNAPS).filter(n => /^records-\d{12}-boot\.json$/.test(n));
    check('45. the server took its own boot snapshot at start, and the edit key lists it (name, bytes, mtime)',
      list.status === 200 && Array.isArray(list.j) && own.length === 1 && list.j.length === 1 && list.j[0].name === own[0]
      && list.j[0].bytes === fs.statSync(path.join(SNAPS, own[0])).size && list.j[0].mtime === fs.statSync(path.join(SNAPS, own[0])).mtime.toISOString()
      && J(Object.keys(list.j[0])) === J(['name', 'bytes', 'mtime']), { list: list.j, own });
    r = await request('GET', '/api/admin/snapshot/' + own[0]);
    check('46. the server\'s own snapshot reads back byte for byte: equal to the file and to records.json as it stood at the restart',
      r.status === 200 && r.buf.equals(fs.readFileSync(path.join(SNAPS, own[0]))) && r.buf.equals(recordsBefore) && JSON.parse(r.buf.toString()).docs.delivery.TST01.ready1231 === true);
    check('47. ...sent as application/json, never cached', /^application\/json/.test(r.headers['content-type']) && r.headers['cache-control'] === 'no-store', r.headers);

    /* placed files: three valid record snapshots dated before the server's own (1, 7 and 35 hours earlier, whole
       seconds), and things that must never be listed or served */
    const base = Math.floor(fs.statSync(path.join(SNAPS, own[0])).mtimeMs / 1000) * 1000, hoursBefore = h => new Date(base - h * 3600e3).toISOString();
    const placed = {
      'records-2026102611.json': { at: hoursBefore(7), body: J({ version: 11100, updated: '2026-10-26T11:40:00.000Z', docs: { delivery: { X1: { _k: 'X1', note: 'hour 11' } } } }) },
      'records-2026102617.json': { at: hoursBefore(1), body: J({ version: 11251, updated: '2026-10-26T17:30:00.000Z', docs: { delivery: { X1: { _k: 'X1', note: 'hour 17' } } } }) },
      'records-202610250745-boot.json': { at: hoursBefore(35), body: J({ version: 10981, updated: '2026-10-25T07:40:00.000Z', docs: {} }) },
    };
    const decoys = {
      'files-2026102617.json': '["FILES-DECOY"]', 'ticks-2026102617.json': '{"secret":"TICKS-DECOY"}', 'ticks-202610261745-made.json': '{"secret":"TICKS-DECOY"}',
      '.tmp-records-999': '{"TMP-DECOY":1}', 'records-2026102617.json.bak': '{"BAK-DECOY":1}', 'records-20261026.json': '{"SHORT-DECOY":1}',
      'records-2026102617-boot.json': '{"BOOT10-DECOY":1}', 'records-202610261745.json': '{"HOUR12-DECOY":1}', 'notes.txt': 'NOTES-DECOY', 'RECORDS-2026102617.json': '{"CASE-DECOY":1}',
    };
    for (const [n, x] of Object.entries(placed)) { fs.writeFileSync(path.join(SNAPS, n), x.body); fs.utimesSync(path.join(SNAPS, n), new Date(x.at), new Date(x.at)); }
    for (const [n, b] of Object.entries(decoys)) fs.writeFileSync(path.join(SNAPS, n), b);
    fs.mkdirSync(path.join(SNAPS, 'records-2026102612.json'));   /* a folder with a valid-looking name */
    const dirState = () => J(fs.readdirSync(SNAPS).sort().map(n => { const st = fs.lstatSync(path.join(SNAPS, n)); return [n, st.size, st.mtimeMs, st.isFile()]; }));
    const folderBefore = dirState();
    const bodies = [];
    const rq = async (...a) => { const x = await request(...a); bodies.push(x.buf.toString('utf8')); return x; };

    list = await rq('GET', '/api/admin/snapshots');
    check('48. the list holds the record snapshots only, newest first by modification time: own boot, hour 17, hour 11, the 25 Oct boot',
      list.status === 200 && J(list.j.map(x => x.name)) === J([own[0], 'records-2026102617.json', 'records-2026102611.json', 'records-202610250745-boot.json']), list.j.map(x => x.name));
    check('49. ...each with its true size and modification time', Object.entries(placed).every(([n, x]) => { const e = list.j.find(y => y.name === n); return e && e.bytes === Buffer.byteLength(x.body) && e.mtime === new Date(x.at).toISOString(); }));
    let allSame = true;
    for (const [n, x] of Object.entries(placed)) { r = await rq('GET', '/api/admin/snapshot/' + n); allSame = allSame && r.status === 200 && r.buf.equals(Buffer.from(x.body)); }
    check('50. every listed snapshot reads back byte for byte', allSame);
    r = await rq('GET', '/api/admin/snapshot/records-2026102618.json');
    check('51. a well-formed name that is not there is 404', r.status === 404 && r.j.error === 'no such snapshot', r.j);

    const badNames = [
      'files-2026102617.json', 'ticks-2026102617.json', 'ticks-202610261745-made.json', '.tmp-records-999', 'records-2026102617.json.bak',
      'records-20261026.json', 'records-2026102617-boot.json', 'records-202610261745.json', 'RECORDS-2026102617.json', 'notes.txt', 'records-2026102612.json',
      '..%2Frecords.json', '..%2F..%2Frecords.json', '..%2Fsnapshots%2Fticks-2026102617.json', '%2e%2e%2Fticks-2026102617.json', 'snapshots%2Fticks-2026102617.json',
      'records-2026102617.json%00', 'records-2026102617.json%2F', 'records%2D2026102617.json', 'records-2026102617%2Ejson', '%2Fetc%2Fpasswd', '%5C..%5Crecords.json',
      'records-2026102617.json%20', 'records-2026102617.json;x', 'records-2026102617.json%3F', 'records-%32026102617.json',
    ];
    const refused = [];
    for (const n of badNames) { r = await rq('GET', '/api/admin/snapshot/' + n); if (r.status !== 404) refused.push([n, r.status]); }
    check('52. ' + badNames.length + ' bad names with the edit key are all 404: files-*, ticks-*, temporary, near misses, a folder, encoded slashes, dots, NUL and other encodings', refused.length === 0, refused);
    const dotPaths = ['/api/admin/snapshot/../../records.json', '/api/admin/snapshot/../../../records.json', '/api/admin/snapshot/%2e%2e/%2e%2e/ticks-2026102617.json', '/api/admin/snapshot/./../snapshot/ticks-2026102617.json', '/api/admin/snapshot//records-2026102617.json'];
    const dotBad = [];
    for (const u of dotPaths) { r = await rq('GET', u); if (r.status !== 404) dotBad.push([u, r.status]); }
    check('53. dot segments in the address never reach a file (404 for each)', dotBad.length === 0, dotBad);
    check('54. no answer in this section carried a ticks or files snapshot, a decoy, or records.json',
      !bodies.some(b => /TICKS-DECOY|FILES-DECOY|TMP-DECOY|BAK-DECOY|SHORT-DECOY|BOOT10-DECOY|HOUR12-DECOY|NOTES-DECOY|CASE-DECOY/.test(b)) && !bodies.some(b => b === fs.readFileSync(RECORDS, 'utf8')));

    for (const [u, label] of [['/api/admin/snapshots', 'list'], ['/api/admin/snapshot/records-2026102617.json', 'read']]) {
      const v = await rq('GET', u, { token: 'view' }), none = await rq('GET', u, { token: null }), wrong = await rq('GET', u, { token: 'wrong' });
      check('55. the ' + label + ': view link 403, no key 401, wrong key 401 (as the other /api/admin reads)',
        v.status === 403 && v.j.error === 'edit token required' && none.status === 401 && wrong.status === 401, [v.status, none.status, wrong.status]);
    }
    const machineView = await request('GET', '/api/admin/machine', { token: 'view' }), machineNone = await request('GET', '/api/admin/machine', { token: null });
    check('56. ...the same answers /api/admin/machine gives', machineView.status === 403 && machineNone.status === 401);
    r = await rq('GET', '/api/admin/snapshot/ticks-2026102617.json', { token: 'view' });
    check('57. a bad name with a view link is 403: the key is checked before the name', r.status === 403);
    r = await rq('GET', '/api/admin/snapshots?t=' + EDIT, { token: null });
    const rq2 = await rq('GET', '/api/admin/snapshot/records-2026102617.json?t=' + VIEW, { token: null });
    check('58. the key in the address works as on /api/export: ?t=<edit> lists, ?t=<view> is 403', r.status === 200 && r.j.length === 4 && rq2.status === 403);
    const methods = [];
    for (const m of ['PUT', 'POST', 'DELETE']) { r = await rq(m, '/api/admin/snapshot/records-2026102617.json', { raw: '{}' }); methods.push(r.status); }
    check('59. PUT, POST and DELETE on a snapshot are not calls (404)', methods.every(s => s === 404), methods);
    check('60. reading and listing wrote nothing into the snapshot folder (names, sizes, times unchanged)', dirState() === folderBefore);

    /* ================================================================= rollback to v5.93 and back */
    for (const n of Object.keys(placed).concat(Object.keys(decoys))) fs.unlinkSync(path.join(SNAPS, n));
    fs.rmdirSync(path.join(SNAPS, 'records-2026102612.json'));
    await stop(); health = await start(V593);
    got = await stored('delivery', 'TST01');
    r = await request('GET', '/api/admin/snapshots');
    check('61. ROLLBACK: v5.93 starts on v5.94\'s data, recovers nothing, keeps the kept fields, and has no snapshot read',
      health.build === 'v5.93' && health.record_recovered === null && !('delivery_field_guard_version' in health) && PROTECTED.every(k => J(got[k]) === J(d1[k])) && r.status === 404, health);
    await stop(); health = await start();
    got = await stored('delivery', 'TST01');
    check('62. ...and forward again on v5.94: the same record, the guard back on', health.build === 'v5.94' && health.delivery_field_guard_version === 1 && health.record_recovered === null && PROTECTED.every(k => J(got[k]) === J(d1[k])));

    console.log(JSON.stringify({ author: 'Andrew Fisher', server_sha256: crypto.createHash('sha256').update(fs.readFileSync(SERVER)).digest('hex'), passed: checks, failed: 0, local_only: true }));
  } finally { await stop(); }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
