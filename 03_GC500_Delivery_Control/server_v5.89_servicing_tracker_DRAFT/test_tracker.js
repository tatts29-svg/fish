/* Author: Andrew Fisher. Server v5.89 - the servicing tracker. Local servers only: 127.0.0.1, fake tokens, a throw-away
   DATA_DIR from mkdtemp (set TMPDIR to choose where), the server's clock set by fake_clock.js (test only). Never calls
   the live service; sends no message; stops only the processes it started.
     TMPDIR=<scratch> node test_tracker.js
   The tracker list is Andrew's own, read from ../servicing_tracker_DRAFT/tracker_data.json (75 references, 83 lines). */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { spawn } = require('child_process');
const SRV = path.join(__dirname, 'server.js');
const OLD = path.join(__dirname, '..', 'server_v5.87_pictures_from_shared_number_LIVE', 'server.js');   // the live v5.87, for the rollback check
const CLOCK = path.join(__dirname, 'fake_clock.js');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'servicing_tracker_DRAFT', 'tracker_data.json'), 'utf8'));
const E = 'local-edit-token-589', V = 'local-view-token-589';
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + ' — ' + JSON.stringify(detail === undefined ? null : detail).slice(0, 600)); } };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const exists = f => fs.existsSync(f);
const linesOf = f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean);

function req(port, method, p, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const data = body == null ? null : (typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
    const h = Object.assign({}, headers);
    if (data != null && h['Content-Length'] === undefined && !h['Transfer-Encoding']) h['Content-Length'] = Buffer.byteLength(data);
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers: h, agent: false }, res => {
      const c = []; res.on('data', x => c.push(x)); res.on('end', () => { const t = Buffer.concat(c).toString(); let j = null; try { j = JSON.parse(t); } catch (e) {} resolve({ status: res.statusCode, headers: res.headers, json: j, text: t }); });
    });
    r.on('error', e => resolve({ status: 0, error: e.code || e.message, headers: {}, json: null, text: '' }));
    if (data != null) r.write(data); r.end();
  });
}
const freePort = () => new Promise(r => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const newData = label => fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-589-' + label + '-'));
async function start(data, fakeNow, server = SRV) {
  const port = await freePort();
  const log = fs.openSync(path.join(data, 'server.log'), 'a');
  const env = { PATH: process.env.PATH, PORT: String(port), DATA_DIR: data, VIEW_TOKEN: V, EDIT_TOKEN: E, PUBLIC_BASE: 'http://127.0.0.1:' + port };
  if (fakeNow) env.FAKE_NOW = fakeNow;
  const proc = spawn(process.execPath, ['-r', CLOCK, server], { env, stdio: ['ignore', log, log] });
  let exited = null; proc.on('exit', code => { exited = code; });
  let health = null;
  for (let i = 0; i < 150 && !health && exited === null; i++) { const r = await req(port, 'GET', '/health'); if (r.status) health = r.json; else await wait(100); }
  const stop = async () => { if (exited === null) { proc.kill('SIGTERM'); for (let i = 0; i < 100 && exited === null; i++) await wait(50); } };
  return { port, proc, data, health, stop, exited: () => exited };
}
const EH = (ip = '10.9.0.1') => ({ 'x-gc500-token': E, 'Content-Type': 'application/json', 'x-gc500-who': 'test', 'x-real-ip': ip });
const VH = (ip = '10.9.0.2') => ({ 'x-gc500-token': V, 'Content-Type': 'application/json', 'x-real-ip': ip });
const PH = (ip = '10.8.0.1') => ({ 'Content-Type': 'application/json', 'x-real-ip': ip });

/* Andrew's list, as the edit link will post it */
const LINES = [];
DATA.areas.forEach(a => a.refs.forEach(r => r.lines.forEach(l => LINES.push({ id: l.id, ref: r.ref, kind: l.kind, qty: l.qty }))));
const AREA = {}; DATA.areas.forEach(a => { AREA[a.n] = a.refs.flatMap(r => r.lines.map(l => ({ id: l.id, ref: r.ref, kind: l.kind, qty: l.qty }))); });
const TRACKER = { days: DATA.days.map(d => ({ id: d.id, plan: d.plan })), lines: LINES, plans: DATA.plans };
const CARD_HTML = '<!doctype html><meta charset="utf-8"><title>GC500 servicing tracker</title><p>test card</p><script>/* the card */</script>';
const cardBody = extra => Object.assign({ load: 'servicing-tracker:GC500-2026', run_date: '2026-10-22', expires: '2026-10-26', title: 'GC500 servicing tracker',
  keys: [], targets: [], contact: { name: 'Andrew Fisher', phone: '0400000000' }, html: CARD_HTML, tracker: TRACKER }, extra || {});
const clone = o => JSON.parse(JSON.stringify(o));
let SIG = {};
const newId = () => 't' + crypto.randomBytes(12).toString('base64url');   // 17 characters, as a phone would make
const tk = (ref, line, task, day, extra) => Object.assign({ id: newId(), ref, sig: SIG[ref], line, task, day, done: true, undoes: [] }, extra || {});
let ipn = 0;   /* each phone call from its own address unless a check names one, so the per-address limits only bite where tested */
const nextIp = () => { ipn++; return '10.' + (100 + (ipn >> 16 & 63)) + '.' + (ipn >> 8 & 255) + '.' + (ipn & 255); };
const post = (port, token, ticks, ip) => req(port, 'POST', '/d/' + token + '/ticks', PH(ip || nextIp()), { ticks });
const read = (port, token, since = 0, ip) => req(port, 'GET', '/d/' + token + '/ticks?since=' + since, PH(ip || nextIp()));
/* the contract's rule for one job on one day: done while any uncancelled done:true remains; its time is the earliest
   uncancelled tapped_at, never later than its server 'at' */
function jobState(ticks, line, task, day) {
  const mine = ticks.filter(t => t.line === line && t.task === task && t.day === day);
  const cancelled = new Set(mine.filter(t => !t.done).flatMap(t => t.undoes));
  const live = mine.filter(t => t.done && !cancelled.has(t.id));
  if (!live.length) return { done: false, time: null };
  return { done: true, time: new Date(Math.min(...live.map(t => Math.min(Date.parse(t.tapped_at || t.at), Date.parse(t.at))))).toISOString() };
}
/* area % = done jobs / all jobs for the day, a job weighted by its line's qty, rounded down */
function areaPct(ticks, areaLines, day) {
  const plan = DATA.days.find(d => d.id === day).plan; let all = 0, done = 0;
  for (const l of areaLines) for (const task of DATA.plans[l.kind][plan]) { all += l.qty; if (jobState(ticks, l.id, task, day).done) done += l.qty; }
  return Math.floor(done * 100 / all);
}

(async () => {
  const keep = [];   // data folders, named at the end
  /* ===================================================================================== RUN 1: the main session
     The server's clock: Sunday 25 Oct 10:00 Gold Coast time, so every configured day has started. */
  const D1 = newData('main'); keep.push(D1);
  fs.writeFileSync(path.join(D1, 'records.json'), JSON.stringify({ version: 41, updated: '2026-10-18T00:00:00.000Z', docs: { delivery: { GN01: { _k: 'GN01', status: 'delivered' } } } }));
  const recSha = sha(path.join(D1, 'records.json'));
  let S = await start(D1, '2026-10-25T10:00:00+10:00');
  const P = S.port, TF = path.join(D1, 'tracker_ticks.jsonl'), LOG = path.join(D1, 'writes.log');
  check('1. /health says build v5.89 and keeps no ticks yet', S.health && S.health.build === 'v5.89' && S.health.tracker_ticks === 0, S.health);
  const ver0 = (await req(P, 'GET', '/api/version', EH())).json;

  /* ---- making a tracker card, and what is refused */
  let r = await req(P, 'POST', '/api/cards', VH(), cardBody());
  check('2. the view link cannot make a tracker (403)', r.status === 403, r.json);
  r = await req(P, 'POST', '/api/cards', { 'Content-Type': 'application/json', 'x-real-ip': '10.9.0.3' }, cardBody());
  check('3. no key cannot make a tracker (401)', r.status === 401, r.json);
  const broken = [
    ['tracker is a string', b => { b.tracker = 'all of them'; }],
    ['no plans', b => { delete b.tracker.plans; }],
    ['no days', b => { b.tracker.days = []; }],
    ['a day that does not exist (2026-13-45)', b => { b.tracker.days[0].id = '2026-13-45'; }],
    ['a day listed twice', b => { b.tracker.days[1].id = b.tracker.days[0].id; }],
    ['a line listed twice', b => { b.tracker.lines[1].id = b.tracker.lines[0].id; }],
    ['a line of a kind with no plan', b => { b.tracker.lines[0].kind = 'boat'; }],
    ['a quantity of 0', b => { b.tracker.lines[0].qty = 0; }],
    ['a quantity written as text', b => { b.tracker.lines[0].qty = '3'; }],
    ['__proto__ as a line id', b => { b.tracker.lines[0].id = '__proto__'; }],
    ['a reference with a space', b => { b.tracker.lines[0].ref = 'WC 07'; }],
    ['a kind missing the plan a day asks for (tank, final)', b => { delete b.tracker.plans.tank.final; }],
    ['a task that is not a plain word', b => { b.tracker.plans.fwf.night = ['pump', 'Water!']; }],
    ['a task listed twice', b => { b.tracker.plans.fwf.night = ['pump', 'pump']; }],
    ['no expires', b => { delete b.expires; }],
    ['expires on the last service day (its service runs to 08:00 the next morning)', b => { b.expires = '2026-10-25'; }],
  ];
  const refused = [];
  for (const [label, f] of broken) { const b = clone(cardBody()); f(b); const x = await req(P, 'POST', '/api/cards', EH(), b); if (!(x.status === 400 && x.json && x.json.code === 'bad_tracker')) refused.push([label, x.status, x.json]); }
  check('4. every broken tracker list is refused 400 with its reason (' + broken.length + ' kinds), never quietly dropped', refused.length === 0, refused);
  r = await req(P, 'GET', '/api/cards', EH());
  check('5. ...and nothing was made by any of them: no card, no tracker file', r.json.cards.length === 0 && !exists(TF), { cards: r.json.cards.length, file: exists(TF) });

  r = await req(P, 'POST', '/api/cards', EH(), cardBody({ keys: ['WC07'], targets: [{ assetKey: 'WC07', unitKey: null }] }));
  const T = r.json && r.json.token, made = r.json;
  SIG = (made && made.tracker && made.tracker.links) || {};
  const refs = [...new Set(LINES.map(l => l.ref))];
  check('6. the edit link makes the tracker: a token, and tracker.links holds a 16-character signature for all 75 references (SPARE too)',
    r.status === 200 && /^[A-Za-z0-9_-]{32}$/.test(T) && refs.length === 75 && refs.every(x => /^[A-Za-z0-9_-]{16}$/.test(SIG[x])) && SIG.SPARE && made.tracker.key_new === true && made.tracker.lines === 83,
    { status: r.status, refs: Object.keys(SIG).length, key_new: made && made.tracker && made.tracker.key_new });
  check('7. a tracker card files under no reference: keys [] and targets [] even when posted with them; its 83 lines and 4 days are kept',
    made.card.keys.length === 0 && made.card.targets.length === 0 && made.card.tracker.lines.length === 83 && made.card.tracker.days.length === 4 && made.card.tracker.lines.find(l => l.id === 'WC07-FWF').qty === 20, made.card);
  check('8. all 75 signatures are different', new Set(Object.values(SIG)).size === 75, null);
  r = await req(P, 'POST', '/api/cards', EH(), { load: 'driver:GN01', run_date: '2026-10-22', expires: '2026-10-23', title: 'GN01 drop', keys: ['GN01'], html: CARD_HTML });
  const DRIVER = r.json.token;
  check('9. a driver card is made exactly as before: no tracker on it', r.status === 200 && !('tracker' in r.json.card) && !r.json.tracker && r.json.card.keys[0] === 'GN01', r.json);
  r = await req(P, 'POST', '/api/cards', EH(), cardBody());
  check('10. a second live tracker for the same load with no token: 409 and the token of the one already live', r.status === 409 && r.json.code === 'tracker_exists' && r.json.token === T, r.json);
  r = await req(P, 'POST', '/api/cards', EH(), cardBody({ token: 'unknownunknownunknownunknown' }));
  check('11. ...the same with a token that is not a card (409, the live token)', r.status === 409 && r.json.token === T, r.json);
  r = await req(P, 'POST', '/api/cards', EH(), cardBody({ token: DRIVER }));
  check('12. ...and turning another card into a second tracker for the load (409)', r.status === 409 && r.json.token === T, r.json);
  const noTracker = cardBody({ token: T }); delete noTracker.tracker;
  r = await req(P, 'POST', '/api/cards', EH(), noTracker);
  const still = await read(P, T);
  check('13. a tracker card re-posted without its tracker: 409, and the tracker still answers', r.status === 409 && r.json.code === 'tracker_required' && still.status === 200, { post: r.json, read: still.status });
  const firstBytes = fs.readFileSync(TF), firstIno = fs.statSync(TF).ino;
  const KEY = JSON.parse(linesOf(TF).find(l => JSON.parse(l).e === 'key')).key;
  check('14. the secret is 32 random bytes, on the service only (one key line in the tracker file)', /^[A-Za-z0-9_-]{43}$/.test(KEY) && Buffer.from(KEY, 'base64url').length === 32, null);
  check('15. each signature is base64url(HMAC-SHA256(secret, token:REF)) cut to 16', SIG.WC07 === crypto.createHmac('sha256', Buffer.from(KEY, 'base64url')).update(T + ':WC07').digest('base64url').slice(0, 16), null);

  /* ---- signatures */
  r = await post(P, T, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-23', { sig: SIG.WC07 })]);
  check("16. WC07's signature cannot tick WC06 (403)", r.status === 403 && r.json.code === 'bad_sig' && r.json.index === 0, r.json);
  r = await post(P, T, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-23', { sig: undefined })]);
  check('17. a tick with no signature is refused (403)', r.status === 403 && r.json.code === 'bad_sig', r.json);
  r = await post(P, T, [tk('WC07', 'WC06-FWF', 'pump', '2026-10-23')]);
  check("18. a right signature cannot reach another reference's line (400 line)", r.status === 400 && r.json.code === 'line', r.json);
  const A1 = tk('WC06', 'WC06-FWF', 'pump', '2026-10-23', { tapped_at: '2026-10-23T21:00:00+10:00' });
  r = await post(P, T, [A1]);
  check('19. WC06 with its own signature: saved, seq 1', r.status === 200 && r.json.saved.length === 1 && r.json.saved[0].seq === 1 && r.json.saved[0].already === false && typeof r.json.epoch === 'string', r.json);

  /* ---- the jobs each kind has on each day */
  const one = async t => (await post(P, T, [t])).json;
  let j = await one(tk('WC06', 'WC06-FWF', 'water', '2026-10-25'));
  check('20. no water on Sunday (400 task)', j.code === 'task', j);
  j = await one(tk('WC06', 'WC06-FWF', 'lock', '2026-10-24'));
  const lockSun = await one(tk('WC06', 'WC06-FWF', 'lock', '2026-10-25'));
  check('21. locked & confirmed empty refused before Sunday, taken on Sunday', j.code === 'task' && lockSun.saved && lockSun.saved.length === 1, [j, lockSun]);
  const tankOk = await one(tk('WC20', 'WC20-WASTETAN', 'pump', '2026-10-23'));
  const tankClean = await one(tk('WC20', 'WC20-WASTETAN', 'clean', '2026-10-23'));
  const tankWater = await one(tk('WC20', 'WC20-WASTETAN', 'water', '2026-10-24'));
  const tankLock = await one(tk('WC20', 'WC20-WASTETAN', 'lock', '2026-10-25'));
  check('22. a waste tank is only pumped out (clean, water and lock refused)', tankOk.saved && tankClean.code === 'task' && tankWater.code === 'task' && tankLock.code === 'task', [tankOk, tankClean, tankWater, tankLock]);
  const blockWater = await one(tk('WC17', 'WC17-TOILETBL', 'water', '2026-10-23'));
  const blockPump = await one(tk('WC17', 'WC17-TOILETBL', 'pump', '2026-10-23'));
  const blockClean = await one(tk('WC17', 'WC17-TOILETBL', 'clean', '2026-10-23'));
  const blockLock = await one(tk('WC17', 'WC17-TOILETBL', 'lock', '2026-10-25'));
  check('23. a toilet block (WC17) is pumped out and cleaned, never watered; Sunday adds the lock', blockWater.code === 'task' && blockPump.saved && blockClean.saved && blockLock.saved, [blockWater, blockPump, blockClean, blockLock]);
  const tankedPump = await one(tk('WC20', 'WC20-TOILETBL', 'pump', '2026-10-23')), tankedClean = await one(tk('WC20', 'WC20-TOILETBL', 'clean', '2026-10-23'));
  const sewerPump = await one(tk('WC15', 'WC15-TOILETBL', 'pump', '2026-10-25')), sewerLock = await one(tk('WC15', 'WC15-TOILETBL', 'lock', '2026-10-25'));
  check("23b. a block with its own tank (WC20) or on the sewer (WC15) is cleaned only (Andrew's job rules): no pump-out; Sunday adds the lock", tankedPump.code === 'task' && tankedClean.saved && sewerPump.code === 'task' && sewerLock.saved, [tankedPump, tankedClean, sewerPump, sewerLock]);
  const d26 = await one(tk('WC06', 'WC06-FWF', 'pump', '2026-10-26')), d21 = await one(tk('WC06', 'WC06-FWF', 'pump', '2026-10-21'));
  check('24. a day that is not on the tracker is refused (400 day)', d26.code === 'day' && d21.code === 'day', [d26, d21]);
  const thu = await one(tk('WC06', 'WC06-FWF', 'water', '2026-10-22'));
  check('25. Thursday ("is a just in case") takes the night jobs', thu.saved && thu.saved.length === 1, thu);

  /* ---- retries */
  await wait(150);   /* writes.log is appended in the background: let the last line land before counting */
  const before = linesOf(TF).length, logTicks = () => linesOf(LOG).filter(l => JSON.parse(l).what === 'tracker ticks').length, lt0 = logTicks();
  r = await post(P, T, [A1]);
  check('26. the same tick again (a lost reply, a retry): already, same seq, nothing new stored or logged', r.status === 200 && r.json.saved[0].already === true && r.json.saved[0].seq === 1 && linesOf(TF).length === before && logTicks() === lt0, r.json);
  r = await post(P, T, [Object.assign({}, A1, { task: 'clean' })]);
  check('27. the same id for a different tick: 409, nothing stored', r.status === 409 && r.json.code === 'id_reused' && linesOf(TF).length === before, r.json);
  const lone = tk('WC10', 'WC10-FWF', 'pump', '2026-10-23');
  r = await post(P, T, [lone, Object.assign({}, A1, { task: 'water' })]);
  const afterBatch = (await read(P, T)).json;
  check('28. one bad tick in a POST keeps none of it (the phone drops that one and sends the rest)', r.status === 409 && r.json.index === 1 && !afterBatch.ticks.some(t => t.id === lone.id), r.json);
  r = await post(P, T, Array.from({ length: 21 }, () => ({})));
  const r0 = await post(P, T, []);
  check('29. 1 to 20 ticks a POST: 21 and 0 are refused', r.status === 400 && r0.status === 400 && r.json.code === 'bad_body', [r.json, r0.json]);
  /* how many real ticks fit the 2 KB body (the longest line and reference on the list, a full phone time) */
  const fat = n => Array.from({ length: n }, (_, i) => tk('WC100', 'WC100-FWFTRAIL', ['water', 'clean', 'pump'][i % 3], ['2026-10-22', '2026-10-23', '2026-10-24'][Math.floor(i / 3) % 3],
    { tapped_at: '2026-10-23T21:13:05.123Z', id: 't' + crypto.randomBytes(15).toString('base64url') }));
  let fit = 0; while (Buffer.byteLength(JSON.stringify({ ticks: fat(fit + 1) })) <= 2048) fit++;
  r = await post(P, T, fat(fit), '10.8.0.9');
  check('30. ' + fit + ' full-size ticks fit one 2 KB POST, and all ' + fit + ' are saved with consecutive seqs', r.status === 200 && r.json.saved.length === fit && r.json.saved.every((s, i) => i === 0 || s.seq === r.json.saved[i - 1].seq + 1), r.json);

  /* ---- unticks name what they cancel */
  const B1 = tk('WC09', 'WC09-FWF', 'pump', '2026-10-23', { tapped_at: '2026-10-23T22:00:00+10:00' });
  const A2 = tk('WC09', 'WC09-FWF', 'pump', '2026-10-23', { tapped_at: '2026-10-23T21:30:00+10:00' });
  await post(P, T, [A2], '10.8.0.21'); await post(P, T, [B1], '10.8.0.22');
  r = await post(P, T, [tk('WC09', 'WC09-FWF', 'pump', '2026-10-23', { done: false, undoes: [A2.id] })], '10.8.0.21');
  let all = (await read(P, T)).json.ticks, st = jobState(all, 'WC09-FWF', 'pump', '2026-10-23');
  check("31. phone A's late untick cancels only A's tick: B's newer tick stands and the job stays done at B's time", r.status === 200 && st.done && st.time === new Date('2026-10-23T22:00:00+10:00').toISOString(), st);
  await post(P, T, [tk('WC09', 'WC09-FWF', 'pump', '2026-10-23', { done: false, undoes: [B1.id] })], '10.8.0.22');
  all = (await read(P, T)).json.ticks; st = jobState(all, 'WC09-FWF', 'pump', '2026-10-23');
  check('32. ...and when B unticks its own, the job is not done', !st.done, st);
  const u1 = await one(tk('WC09', 'WC09-FWF', 'clean', '2026-10-23', { done: false, undoes: [B1.id] }));
  const u2 = await one(tk('WC09', 'WC09-FWF', 'pump', '2026-10-23', { done: false, undoes: [] }));
  const u3 = await one(tk('WC09', 'WC09-FWF', 'pump', '2026-10-23', { done: false, undoes: [newId()] }));
  const u4 = await one(tk('WC09', 'WC09-FWF', 'pump', '2026-10-23', { done: true, undoes: [B1.id] }));
  check('33. an untick must name a tick of the same job and day; a tick cancels nothing (all 400 undoes)', [u1, u2, u3, u4].every(x => x.code === 'undoes'), [u1, u2, u3, u4]);
  const C1 = tk('WC11', 'WC11-FWF', 'pump', '2026-10-23');
  r = await post(P, T, [C1, tk('WC11', 'WC11-FWF', 'pump', '2026-10-23', { done: false, undoes: [C1.id] })]);
  all = (await read(P, T)).json.ticks;
  check('34. a tick and its untick in one POST (an outbox draining): both kept, job not done', r.status === 200 && r.json.saved.length === 2 && !jobState(all, 'WC11-FWF', 'pump', '2026-10-23').done, r.json);
  /* the phone's clock */
  const early = await one(tk('WC12', 'WC12-FWF', 'pump', '2026-10-25', { tapped_at: '2026-10-25T09:00:00+10:00' }));
  const ahead = await one(tk('WC12', 'WC12-FWF', 'clean', '2026-10-25', { tapped_at: new Date(Date.parse(early.now) + 5 * 60000).toISOString() }));
  const old = await one(tk('WC12', 'WC12-FWF', 'lock', '2026-10-25', { tapped_at: '2026-10-20T09:00:00+10:00' }));
  const slack = await one(tk('WC13', 'WC13-FWF', 'pump', '2026-10-23', { tapped_at: '2026-10-23T05:00:00+10:00' }));
  const junk = await one(tk('WC13', 'WC13-FWF', 'clean', '2026-10-23', { tapped_at: 'yesterday-ish' }));
  all = (await read(P, T)).json.ticks; const by = id => all.find(t => t.id === id);
  check("35. the phone's time is kept as the phone's when it is sensible: earlier than arrival kept", by(early.saved[0].id).tapped_at === new Date('2026-10-25T09:00:00+10:00').toISOString(), by(early.saved[0].id));
  check('36. ...a phone clock ahead of the service is held to the arrival time (never in the future)', by(ahead.saved[0].id).tapped_at === by(ahead.saved[0].id).at, by(ahead.saved[0].id));
  check('37. ...a time days before its service day, or one that is not a time, is dropped (null)', by(old.saved[0].id).tapped_at === null && by(junk.saved[0].id).tapped_at === null, [by(old.saved[0].id), by(junk.saved[0].id)]);
  check('38. ...a time up to 6 h before 08:00 of its day is kept (a crew that started early)', by(slack.saved[0].id).tapped_at === new Date('2026-10-23T05:00:00+10:00').toISOString(), by(slack.saved[0].id));
  /* the weighting the card and the page show (worked out there, from what the service hands them) */
  await post(P, T, ['pump', 'water', 'clean'].map(task => tk('WC07', 'WC07-FWF', task, '2026-10-24')));
  const area = Object.keys(AREA).find(n => AREA[n].some(l => l.id === 'WC07-FWF'));
  all = (await read(P, T)).json.ticks;
  const pct = areaPct(all, AREA[area], '2026-10-24'), allJobs = AREA[area].reduce((n, l) => n + l.qty * DATA.plans[l.kind].night.length, 0);
  check('39. WC07 weighs its 20 FWF: all three of its Saturday jobs done makes area ' + area + ' ' + pct + '% (60 of ' + allJobs + ' jobs, rounded down)', pct === Math.floor(60 * 100 / allJobs) && pct > 0, { pct, allJobs });

  /* ---- rate limits and caps */
  let codes = [];
  for (let i = 0; i < 61; i++) codes.push((await req(P, 'POST', '/d/' + T + '/ticks', PH('10.7.0.1'), {})));
  const last = codes[60];
  const other = await req(P, 'POST', '/d/' + T + '/ticks', PH('10.7.0.2'), {});
  check('40. 60 POSTs a minute from one address; the 61st gets 429 with Retry-After; another address is not held', codes.slice(0, 60).every(x => x.status === 400) && last.status === 429 && Number(last.headers['retry-after']) >= 1 && last.json.code === 'slow_down' && other.status === 400, { last: last.status, ra: last.headers['retry-after'], other: other.status });
  codes = [];
  for (let i = 0; i < 121; i++) codes.push((await read(P, T, 0, '10.7.1.1')).status);
  check('41. 120 reads a minute from one address; the 121st gets 429', codes.slice(0, 120).every(s => s === 200) && codes[120] === 429, codes.slice(118));
  const capTicks = [];
  let prev = null, capStatus = [];
  for (let i = 0; i < 13; i++) {
    const t = i % 2 === 0 ? tk('WC10', 'WC10-FWF', 'clean', '2026-10-23') : tk('WC10', 'WC10-FWF', 'clean', '2026-10-23', { done: false, undoes: [prev.id] });
    const x = await post(P, T, [t], '10.7.2.' + i); capStatus.push(x.json.code || x.status); if (x.status === 200) capTicks.push(t.id); prev = t;
  }
  check('42. a job takes 12 ticks and unticks on one day; the 13th is refused (400 job_cap)', capStatus.slice(0, 12).every(s => s === 200) && capStatus[12] === 'job_cap', capStatus);
  r = await req(P, 'POST', '/api/ticks/void', EH(), { token: T, ids: capTicks.slice(0, 2) });
  const afterVoid = await post(P, T, [tk('WC10', 'WC10-FWF', 'clean', '2026-10-23')], '10.7.2.99');
  check('43. voiding two of them (a flood) makes room again', r.status === 200 && r.json.voided.length === 2 && afterVoid.status === 200, [r.json, afterVoid.json]);
  codes = [];
  for (let i = 0; i < 31; i++) codes.push(await req(P, 'GET', '/d/' + crypto.randomBytes(18).toString('base64url') + '/ticks', PH('10.7.3.1')));
  check('44. unknown tokens on /ticks are wrong keys and counted: 404 "withdrawn" thirty times, then 429 (as JSON, for the card)', codes.slice(0, 30).every(x => x.status === 404 && x.json && x.json.code === 'withdrawn') && codes[30].status === 429 && codes[30].json !== null, codes.slice(28).map(x => [x.status, x.text.slice(0, 60)]));
  codes = [];
  for (let i = 0; i < 35; i++) codes.push((await req(P, 'GET', '/d/' + DRIVER + '/ticks', PH('10.7.4.1'))).json.code);
  const afterDriver = await read(P, T, 0, '10.7.4.1');
  check('45. a driver card on /ticks is a right key: 404 "no_tracker", never counted (35 of them, then the tracker still answers)', codes.every(c => c === 'no_tracker') && afterDriver.status === 200, { codes: codes.slice(0, 3), after: afterDriver.status });
  codes = [];
  for (let i = 0; i < 18; i++) {
    codes.push((await req(P, 'POST', '/d/' + T + '/report', PH('10.7.5.1'), { fields: { delivered: 'yes' }, note: 'x' })).json.code);
    codes.push((await req(P, 'POST', '/d/' + T + '/report/scoped', PH('10.7.5.1'), { phase: 'delivery' })).json.code);
  }
  const afterReports = await read(P, T, 0, '10.7.5.1');
  check('46. both report routes answer 404 on a tracker card ("no_reports"), not counted (36 of them, then the tracker still answers)', codes.every(c => c === 'no_reports') && afterReports.status === 200 && !exists(path.join(D1, 'reports.json')) && !exists(path.join(D1, 'scoped_reports.json')), { codes: codes.slice(0, 2), after: afterReports.status });

  /* ---- 413 */
  r = await req(P, 'POST', '/d/' + T + '/ticks', PH('10.7.6.1'), JSON.stringify({ ticks: fat(fit + 6) }));
  check('47. a body over 2 KB is answered 413 before it is read', r.status === 413 && r.json.code === 'too_big', { status: r.status, json: r.json });
  r = await req(P, 'POST', '/d/' + T + '/ticks', Object.assign(PH('10.7.6.2'), { 'Transfer-Encoding': 'chunked' }), 'x'.repeat(6000));
  const healthAfter = await req(P, 'GET', '/health');
  check('48. an oversized body with no length is cut off and the service stays up', r.status !== 200 && healthAfter.status === 200, { status: r.status, err: r.error });

  /* ---- reading writes nothing; opening is noted at most once a minute */
  const cardsSha = sha(path.join(D1, 'cards.json')), logSize = fs.statSync(LOG).size, tfSize = fs.statSync(TF).size;
  for (let i = 0; i < 40; i++) await read(P, T, 0, '10.7.7.' + (i % 4));
  check('49. 40 reads change nothing on the disk (cards.json, writes.log, the tracker file)', sha(path.join(D1, 'cards.json')) === cardsSha && fs.statSync(LOG).size === logSize && fs.statSync(TF).size === tfSize, null);
  const opens = [];
  for (let i = 0; i < 10; i++) opens.push(await req(P, 'GET', '/d/' + T, PH('10.7.8.1')));
  await wait(150);
  const openLines = linesOf(LOG).map(l => JSON.parse(l)).filter(l => l.what === 'card open' && l.token === T);
  check('50. ten scans of the tracker card: all served with the card CSP, written once (one "card open" line), not ten times',
    opens.every(x => x.status === 200 && /script-src 'sha256-/.test(x.headers['content-security-policy'] || '')) && openLines.length === 1, { lines: openLines.length });

  /* ---- own properties only */
  const op = [
    await req(P, 'GET', '/d/propertyIsEnumerable', PH('10.7.9.1')),
    await req(P, 'GET', '/d/propertyIsEnumerable/ticks', PH('10.7.9.1')),
    await req(P, 'POST', '/d/propertyIsEnumerable/report', PH('10.7.9.1'), { note: 'x' }),
    await req(P, 'POST', '/d/propertyIsEnumerable/ticks', PH('10.7.9.1'), { ticks: [{}] }),
  ];
  check('51. propertyIsEnumerable is not a card on any /d/ route (404 each, where v5.87 served a blank 200)', op.every(x => x.status === 404) && op[1].json.code === 'withdrawn', op.map(x => x.status));
  const del = await req(P, 'DELETE', '/api/cards/constructor', EH());
  const rep = await req(P, 'GET', '/api/reports?token=constructor', EH());
  const tp = await req(P, 'GET', '/api/ticks?token=__proto__', EH()), tc = await req(P, 'GET', '/api/ticks?token=constructor', EH()), th = await req(P, 'GET', '/api/ticks?token=hasOwnProperty', EH());
  check('52. DELETE /api/cards/constructor is 404; /api/reports?token=constructor is an empty 200 (v5.87: 500); /api/ticks for inherited names is 404',
    del.status === 404 && rep.status === 200 && rep.json.total === 0 && [tp, tc, th].every(x => x.status === 404), [del.status, rep.status, tp.status, tc.status, th.status]);

  /* ---- the edit link's own view, and the void */
  r = await req(P, 'GET', '/api/ticks?token=' + T, VH());
  const r401 = await req(P, 'GET', '/api/ticks?token=' + T, { 'x-real-ip': '10.9.0.9' });
  check('53. /api/ticks: the view link 403, no key 401', r.status === 403 && r401.status === 401, [r.status, r401.status]);
  r = await req(P, 'GET', '/api/ticks?token=' + T, EH());
  const adm = r.json;
  check('54. /api/ticks on the edit link: the list (83 lines), the 75 signatures, every tick, the key kept', r.status === 200 && adm.tracker.lines.length === 83 && Object.keys(adm.links).length === 75 && adm.links.WC07 === SIG.WC07 && adm.key_kept === true && adm.ticks.length === adm.seq && adm.voids.length === 1, { lines: adm.tracker && adm.tracker.lines.length, links: Object.keys(adm.links || {}).length, ticks: adm.ticks && adm.ticks.length, seq: adm.seq });
  r = await req(P, 'GET', '/api/ticks', EH());
  check('55. /api/ticks with no token lists the trackers, without signatures', r.status === 200 && r.json.trackers.some(x => x.token === T && x.tracker === true) && !/links/.test(r.text), r.json);
  const ep0 = (await read(P, T)).json.epoch, lines0 = linesOf(TF).length;
  r = await req(P, 'POST', '/api/ticks/void', EH(), { token: T, ids: [A1.id, lockSun.saved[0].id] });
  const rd = (await read(P, T)).json, adm2 = (await req(P, 'GET', '/api/ticks?token=' + T, EH())).json;
  check('56. a void is one line of its own (nothing removed), the epoch moves on, the voided ticks leave the phones\' read and stay on the edit link marked',
    r.status === 200 && linesOf(TF).length === lines0 + 1 && rd.epoch !== ep0 && !rd.ticks.some(t => t.id === A1.id) && adm2.ticks.find(t => t.id === A1.id).voided === true, { epoch: [ep0, rd.epoch], lines: [lines0, linesOf(TF).length] });
  r = await post(P, T, [A1]);
  const rd2 = (await read(P, T)).json;
  check('57. a phone sending a voided tick again is told "already" (voided) and it does not come back', r.status === 200 && r.json.saved[0].already === true && r.json.saved[0].voided === true && !rd2.ticks.some(t => t.id === A1.id), r.json);
  const vU = await req(P, 'POST', '/api/ticks/void', EH(), { token: T, ids: ['nonexistentnonexistent'] });
  const vV = await req(P, 'POST', '/api/ticks/void', VH(), { token: T, ids: [A2.id] });
  const vA = await req(P, 'POST', '/api/ticks/void', EH(), { token: T, ids: [A1.id] });
  check('58. void: an id that is not a tick 400; the view link 403; voiding again says already', vU.status === 400 && vU.json.code === 'unknown_ids' && vV.status === 403 && vA.status === 200 && vA.json.already[0] === A1.id, [vU.status, vV.status, vA.json]);

  /* ---- re-post keeps the token, the signatures and the ticks */
  const beforeRepost = (await read(P, T)).json;
  r = await req(P, 'POST', '/api/cards', EH(), cardBody({ token: T, title: 'GC500 servicing tracker (fixed)' }));
  const afterRepost = (await read(P, T)).json;
  check('59. "Update the tracker": the same token, the same 75 signatures (the laminated sheets keep working), every tick kept',
    r.status === 200 && r.json.token === T && r.json.tracker.key_new === false && JSON.stringify(r.json.tracker.links) === JSON.stringify(SIG) && afterRepost.seq === beforeRepost.seq && afterRepost.ticks.length === beforeRepost.ticks.length,
    { status: r.status, key_new: r.json.tracker && r.json.tracker.key_new });

  /* ---- no signature, and never the secret, in any listing or file but the store */
  const texts = {
    'GET /d/<t>/ticks': (await read(P, T, 0, '10.7.10.1')).text,
    'GET /api/cards': (await req(P, 'GET', '/api/cards', EH())).text,
    'GET /api/ticks (list)': (await req(P, 'GET', '/api/ticks', EH())).text,
    'writes.log': fs.readFileSync(LOG, 'utf8'), 'cards.json': fs.readFileSync(path.join(D1, 'cards.json'), 'utf8'),
    'tracker_ticks.jsonl': fs.readFileSync(TF, 'utf8'), 'server.log': fs.readFileSync(path.join(D1, 'server.log'), 'utf8'),
  };
  const sigHits = Object.entries(texts).filter(([, t]) => Object.values(SIG).some(s => t.includes(s))).map(([k]) => k);
  check('60. no signature in the phones\' read, the card list, the tracker list, writes.log, cards.json, the tick store or the server log', sigHits.length === 0, sigHits);
  const keyHits = Object.entries(texts).filter(([k, t]) => k !== 'tracker_ticks.jsonl' && t.includes(KEY)).map(([k]) => k)
    .concat((await req(P, 'GET', '/api/ticks?token=' + T, EH())).text.includes(KEY) ? ['GET /api/ticks?token'] : []);
  check('61. the secret appears nowhere but its own store (not even on the edit link)', keyHits.length === 0, keyHits);

  /* ---- no record writes at all */
  const ver1 = (await req(P, 'GET', '/api/version', EH())).json;
  const logRows = linesOf(LOG).map(l => JSON.parse(l));
  const allowed = new Set(['card made', 'card updated', 'card open', 'tracker ticks', 'tracker ticks voided']);
  check('62. NO RECORD WRITES: records.json byte for byte, /api/version unchanged, no op:set or op:delete in writes.log, every line a card or tracker line',
    sha(path.join(D1, 'records.json')) === recSha && ver1.version === ver0.version && ver0.version === 41 && !logRows.some(l => l.op) && logRows.every(l => allowed.has(l.what)),
    { ver: [ver0.version, ver1.version], odd: logRows.filter(l => !allowed.has(l.what)).slice(0, 3) });

  /* ---- append-only */
  const finalBytes = fs.readFileSync(TF);
  check('63. the tick file is only ever appended: same file (inode), the first bytes unchanged, every line whole JSON',
    fs.statSync(TF).ino === firstIno && finalBytes.slice(0, firstBytes.length).equals(firstBytes) && linesOf(TF).every(l => { try { JSON.parse(l); return true; } catch (e) { return false; } }), null);
  const seqNow = (await read(P, T)).json.seq, epochNow = (await read(P, T)).json.epoch;
  await S.stop();
  const banner = fs.readFileSync(path.join(D1, 'server.log'), 'utf8');
  check('64. the start-up banner names v5.89 and the tracker', /server v5\.89 — THE SERVICING TRACKER/.test(banner) && /servicing tracker \d+ tracker/.test(banner), banner.slice(0, 200));

  /* ===================================================================================== RUN 2: a normal restart */
  S = await start(D1, '2026-10-25T11:00:00+10:00');
  let rr = (await read(S.port, T)).json;
  r = await post(S.port, T, [tk('WC15', 'WC15-TOILETBL', 'clean', '2026-10-25')]);
  const snaps = fs.readdirSync(path.join(D1, 'snapshots'));
  check('65. after a restart: the same epoch, every tick, and the old signatures still tick', rr.epoch === epochNow && rr.seq === seqNow && r.status === 200, { epoch: [epochNow, rr.epoch], seq: [seqNow, rr.seq], post: r.status });
  check('66. the ticks are snapshotted at start, and at once when a tracker key is made', snaps.some(n => /^ticks-\d{12}-boot\.json$/.test(n)) && snaps.some(n => /^ticks-\d{12}-made\.json$/.test(n)), snaps.filter(n => n.startsWith('ticks')));
  const seq2 = (await read(S.port, T)).json.seq, ep2 = (await read(S.port, T)).json.epoch;
  await S.stop();

  /* ===================================================================================== RUN 3: a last line cut short */
  fs.appendFileSync(TF, '{"e":"tick","token":"' + T + '","id":"cutshortcutsh');
  S = await start(D1, '2026-10-25T11:05:00+10:00');
  rr = (await read(S.port, T)).json;
  r = await post(S.port, T, [tk('WC16', 'WC16-TOILETBL', 'clean', '2026-10-25')]);
  check('67. a last line cut short (a crash mid-write): the service starts, drops it and says so; nothing else lost; no recovery, same epoch',
    S.health && S.health.ok && S.health.record_recovered === null && /cut short/.test(JSON.stringify(S.health.tracker_notes)) && rr.seq === seq2 && rr.epoch === ep2 && r.status === 200
    && fs.readFileSync(TF, 'utf8').endsWith('\n') && linesOf(TF).every(l => { try { JSON.parse(l); return true; } catch (e) { return false; } }), S.health);
  const seq3 = (await read(S.port, T)).json.seq, ep3 = (await read(S.port, T)).json.epoch;
  await S.stop();

  /* ===================================================================================== RUN 4: a damaged line in the middle */
  const nTicks = linesOf(TF).filter(l => l.includes('"e":"tick"')).length;
  let ls = fs.readFileSync(TF, 'utf8').split('\n'); const mid = ls.findIndex((l, i) => i > 3 && l.includes('"e":"tick"'));
  ls[mid] = 'garbage{'; fs.writeFileSync(TF, ls.join('\n'));
  S = await start(D1, '2026-10-25T11:10:00+10:00');
  rr = (await read(S.port, T)).json;
  const adm4 = (await req(S.port, 'GET', '/api/ticks?token=' + T, EH())).json;
  r = await post(S.port, T, [tk('WC17', 'WC17-TOILETBL', 'clean', '2026-10-25')]);
  const rec4 = S.health && S.health.record_recovered;
  check('68. a damaged line in the middle: set aside, every good line kept, the snapshot fills the gap, the epoch changes, /health names it',
    S.health && S.health.ok && rec4 && rec4[0].store === 'tracker ticks' && /would not read/.test(rec4[0].reason) && exists(path.join(D1, rec4[0].damaged_copy))
    && rr.epoch !== ep3 && adm4.ticks.length === nTicks && adm4.seq === seq3 && r.status === 200, { rec4, ticks: [nTicks, adm4.ticks.length], seq: [seq3, adm4.seq] });
  const seq4 = (await read(S.port, T)).json.seq, ep4 = (await read(S.port, T)).json.epoch;
  await S.stop();

  /* ===================================================================================== RUN 5: the file lost, snapshots there */
  fs.unlinkSync(TF);
  S = await start(D1, '2026-10-25T11:15:00+10:00');
  rr = (await read(S.port, T)).json;
  r = await post(S.port, T, [tk('WC19', 'WC19-FWF', 'pump', '2026-10-25')]);
  const rec5 = S.health && S.health.record_recovered;
  check('69. the tick file lost: recovered from the newest snapshot, the key with it (old signatures still tick), a new epoch, /health says so',
    S.health && S.health.ok && rec5 && /missing although snapshots/.test(rec5[0].reason) && r.status === 200 && rr.epoch !== ep4 && rr.seq > 0, { rec5, post: r.json });

  /* ===================================================================================== RUN 5b: a write that fails */
  const seq5 = (await read(S.port, T)).json.seq;
  fs.renameSync(TF, TF + '.away'); fs.mkdirSync(TF);
  const failing = tk('WC21', 'WC21-FWF', 'pump', '2026-10-25');
  const f1 = await post(S.port, T, [failing]);
  fs.rmdirSync(TF); fs.renameSync(TF + '.away', TF);
  const f2 = await post(S.port, T, [failing]);
  rr = (await read(S.port, T)).json; const ep5 = rr.epoch;
  check('70. a tick the disk would not take is answered 507 and kept nowhere; the retry is saved (not "already") at the next seq, once',
    f1.status === 507 && f1.json.code === 'disk' && f2.status === 200 && f2.json.saved[0].already === false && f2.json.saved[0].seq === seq5 + 1 && rr.ticks.filter(t => t.id === failing.id).length === 1, [f1.json, f2.json]);
  await S.stop();
  const D12 = newData('rollback'); keep.push(D12);
  fs.cpSync(D1, D12, { recursive: true });
  S = await start(D1, '2026-10-25T11:20:00+10:00');
  rr = (await read(S.port, T)).json;
  check('71. ...and after a restart the file reads clean with that tick once (no half line glued to the next)', S.health.record_recovered === null && S.health.tracker_notes === null && rr.ticks.filter(t => t.id === failing.id).length === 1, S.health);
  await S.stop();

  /* ===================================================================================== RUN 6: after 2026-10-26, it has finished */
  S = await start(D1, '2026-10-27T09:00:00+10:00');
  const g = await read(S.port, T), pz = await post(S.port, T, [tk('WC23', 'WC23-FWF', 'pump', '2026-10-25')]);
  const pg = await req(S.port, 'GET', '/d/' + T, PH()), ad = await req(S.port, 'GET', '/api/ticks?token=' + T, EH());
  check('72. after 26 Oct the tracker has finished: 410 to a read, a tick and the card page ("servicing tracker has finished"); the edit link still has every tick',
    g.status === 410 && g.json.code === 'expired' && pz.status === 410 && pg.status === 410 && /servicing tracker has finished/.test(pg.text) && ad.status === 200 && ad.json.expired === true && ad.json.ticks.length > 0, [g.status, pz.status, pg.status, ad.json && ad.json.expired]);
  await S.stop();

  /* ===================================================================================== RUN 7: rollback to v5.87 on v5.89's data */
  S = await start(D12, '2026-10-25T11:30:00+10:00', OLD);
  const oc = await req(S.port, 'GET', '/d/' + T, PH('10.6.0.1'));
  const ot = []; for (let i = 0; i < 35; i++) ot.push(await req(S.port, 'GET', '/d/' + T + '/ticks', PH('10.6.0.2')));
  const oafter = await req(S.port, 'GET', '/d/' + T, PH('10.6.0.2')), ocards = await req(S.port, 'GET', '/api/cards', EH());
  check('73. ROLLBACK: v5.87 starts on v5.89\'s data and still serves the tracker card', S.health && S.health.build === 'v5.87' && S.health.ok && oc.status === 200, S.health);
  check('74. ...its /ticks is v5.87\'s plain page 404 (the card says "being updated"), never counted (35, then the card still opens)', ot.every(x => x.status === 404 && /text\/html/.test(x.headers['content-type'])) && oafter.status === 200, ot.slice(0, 1).map(x => [x.status, x.headers['content-type']]));
  check('75. ...and v5.87\'s card list carries no signature and no secret (the secret is not on the card)', ocards.status === 200 && !Object.values(SIG).some(s => ocards.text.includes(s)) && !ocards.text.includes(KEY), null);
  await S.stop();
  S = await start(D12, '2026-10-25T11:40:00+10:00');
  rr = (await read(S.port, T)).json;
  r = await post(S.port, T, [tk('WC24', 'WC24-FWF', 'pump', '2026-10-25')]);
  check('76. ...and back on v5.89: every tick, the same epoch, the old signatures still tick', rr.seq === seq5 + 1 && rr.epoch === ep5 && rr.ticks.some(t => t.id === failing.id) && r.status === 200 && S.health.record_recovered === null, { seq: rr.seq, epoch: [ep5, rr.epoch], post: r.status });
  await S.stop();

  /* ===================================================================================== RUN 8: the 08:00 boundary */
  const D8 = newData('boundary'); keep.push(D8);
  S = await start(D8, '2026-10-23T07:59:57.000+10:00');
  r = await req(S.port, 'POST', '/api/cards', EH(), cardBody()); SIG = r.json.tracker.links; const T8 = r.json.token;
  const b1 = await post(S.port, T8, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-23')]);
  const b2 = await post(S.port, T8, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-22')]);
  const r8 = (await read(S.port, T8)).json, sd1 = r8.service_day;
  await wait(Math.max(0, Date.parse('2026-10-23T08:00:00.300+10:00') - Date.parse(r8.now)));
  const b3 = await post(S.port, T8, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-23')]);
  const b4 = await post(S.port, T8, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-24')]);
  const sd2 = (await read(S.port, T8)).json.service_day;
  check("77. at 07:59 on Friday it is still Thursday's service: a Friday tick is refused (future_day), Thursday's is taken", b1.status === 400 && b1.json.code === 'future_day' && b2.status === 200 && sd1 === '2026-10-22', [b1.json, b2.status, sd1]);
  check("78. at 08:00 Friday's service starts: Friday is taken, Saturday is still refused", b3.status === 200 && b4.status === 400 && b4.json.code === 'future_day' && sd2 === '2026-10-23', [b3.status, b4.json, sd2]);
  await S.stop();
  S = await start(D8, '2026-10-18T12:00:00+10:00');
  const b5 = await post(S.port, T8, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-22')]);
  check('79. before the event (18 Oct) no day can be ticked, Thursday included', b5.status === 400 && b5.json.code === 'future_day', b5.json);
  await S.stop();

  /* ===================================================================================== RUN 9: the per-tracker limit */
  const D9 = newData('pertoken'); keep.push(D9);
  S = await start(D9, '2026-10-25T10:00:00+10:00');
  r = await req(S.port, 'POST', '/api/cards', EH(), cardBody()); SIG = r.json.tracker.links; const T9 = r.json.token;
  let held = 0;
  for (let a = 0; a < 20; a++) for (let i = 0; i < 60; i++) { const x = await req(S.port, 'POST', '/d/' + T9 + '/ticks', PH('10.5.' + a + '.1'), {}); if (x.status === 429) held++; }
  const over = await post(S.port, T9, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-23')], '10.5.250.1');
  const stillReads = await read(S.port, T9, 0, '10.5.250.2');
  check('80. 1,200 POSTs an hour to one tracker from every address together; the next is 429 from any address; reads still answer',
    held === 0 && over.status === 429 && Number(over.headers['retry-after']) > 60 && stillReads.status === 200, { held, over: over.status, ra: over.headers['retry-after'] });
  await S.stop();

  /* ===================================================================================== RUN 10: the whole store's cap */
  const D10 = newData('full'); keep.push(D10);
  const FT = 'seedseedseedseedseedseed', N = 24999, rows = [JSON.stringify({ e: 'epoch', epoch: 'seed01', at: '2026-10-24T00:00:00.000Z', why: 'test seed' })];
  for (let i = 1; i <= N; i++) rows.push(JSON.stringify({ e: 'tick', token: FT, id: 'seedtick' + String(i).padStart(10, '0'), seq: i, ref: 'WC06', line: 'WC06-FWF', task: 'pump', day: '2026-10-23', done: true, undoes: [], at: '2026-10-24T00:00:00.000Z', tapped_at: null }));
  fs.writeFileSync(path.join(D10, 'tracker_ticks.jsonl'), rows.join('\n') + '\n');
  S = await start(D10, '2026-10-25T10:00:00+10:00');
  r = await req(S.port, 'POST', '/api/cards', EH(), cardBody()); SIG = r.json.tracker.links; const T10 = r.json.token;
  const full1 = await post(S.port, T10, [tk('WC06', 'WC06-FWF', 'pump', '2026-10-23')]);
  const full2 = await post(S.port, T10, [tk('WC06', 'WC06-FWF', 'water', '2026-10-23')]);
  check('81. the store holds 25,000 ticks in all; the next is refused 507 "full"', S.health.tracker_ticks === N && full1.status === 200 && full2.status === 507 && full2.json.code === 'full', [S.health.tracker_ticks, full1.status, full2.json]);
  await S.stop();

  /* ===================================================================================== RUN 11: damaged, and nothing to recover from */
  const D11 = newData('nosnap'); keep.push(D11);
  fs.writeFileSync(path.join(D11, 'tracker_ticks.jsonl'), 'this is not a tick\n{"half":\n');
  S = await start(D11, '2026-10-25T10:00:00+10:00');
  const rec11 = S.health && S.health.record_recovered;
  check('82. a damaged tick file with no snapshot never stops the service: it starts, sets the file aside and starts the ticks empty, and says so',
    S.health && S.health.ok && rec11 && rec11[0].store === 'tracker ticks' && /started empty/.test(rec11[0].loaded_from) && exists(path.join(D11, rec11[0].damaged_copy)) && S.health.tracker_ticks === 0, rec11);
  await S.stop();

  console.log(`${pass}/${pass + fail} v5.89 servicing tracker checks passed`);
  console.log('data folders (throw-away): ' + keep.map(k => path.basename(k)).join(', '));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
