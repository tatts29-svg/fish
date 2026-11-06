/* Author: Andrew Fisher. Server v5.90 - the deploy and the rollback, rehearsed on this machine only. Local servers on
   127.0.0.1 with fake tokens and a throw-away DATA_DIR; never touches Railway or the live service.
     TMPDIR=<scratch> node rehearse_deploy.js
   It walks the README's Upload steps: the live v5.89 running from its blob; the v5.90 blob staged with
   PUT /api/admin/machine/blob/<sha>; the start command's copy (machine/blobs/$SERVER_FILE -> server.js, hash checked,
   "server from volume blob <sha>"); v5.90 up with SERVER_FILE and SERVER_FILE_KEEP set; a tracker made and ticked;
   rolled back to v5.89 (the card opens and accepts a new signed tick); rolled forward with ticks, voids and signatures kept. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { spawn } = require('child_process');
const NEW = path.join(__dirname, 'server.js');
const OLD = path.join(__dirname, '..', 'server_v5.89_servicing_tracker_DRAFT', 'server.js');
const CLOCK = path.join(__dirname, 'fake_clock.js');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'servicing_tracker_DRAFT', 'tracker_data.json'), 'utf8'));
const E = 'local-edit-token-589', V = 'local-view-token-589';
/* Five earlier rollback blobs confirmed by the owner against the live inventory, 18 Oct 2026. */
const EARLIER_KEEP = ['d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc', 'f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9', '76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684',
  '264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14',
  'b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd'];
const wait = ms => new Promise(r => setTimeout(r, ms));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + ' — ' + JSON.stringify(detail === undefined ? null : detail).slice(0, 500)); } };
function req(port, method, p, headers = {}, body = null) {
  return new Promise(resolve => {
    const data = body == null ? null : (Buffer.isBuffer(body) || typeof body === 'string' ? body : JSON.stringify(body));
    const h = Object.assign({}, headers); if (data != null) h['Content-Length'] = Buffer.byteLength(data);
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers: h, agent: false }, res => {
      const c = []; res.on('data', x => c.push(x)); res.on('end', () => { const t = Buffer.concat(c).toString(); let j = null; try { j = JSON.parse(t); } catch (e) {} resolve({ status: res.statusCode, headers: res.headers, json: j, text: t }); });
    });
    r.on('error', e => resolve({ status: 0, error: e.code, headers: {}, json: null, text: '' }));
    if (data != null) r.write(data); r.end();
  });
}
const freePort = () => new Promise(r => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
/* the start command, as DEPLOY.md describes it: copy the named blob to the app folder and run it */
async function boot(data, app, serverFile, keep, fakeNow) {
  const blob = path.join(data, 'machine', 'blobs', serverFile);
  if (!fs.existsSync(blob) || !fs.statSync(blob).size) return { bootLine: 'blob ' + serverFile.slice(0, 8) + ' missing: the live start command would fall back to SERVER_B64 (v5.78)', health: null, stop: async () => {} };
  fs.copyFileSync(blob, path.join(app, 'server.js'));
  const bootLine = 'server from volume blob ' + serverFile + ' · sha256sum /app/server.js ' + sha(fs.readFileSync(path.join(app, 'server.js')));
  const port = await freePort(), log = path.join(data, 'server.log'), mark = fs.existsSync(log) ? fs.statSync(log).size : 0;
  const out = fs.openSync(log, 'a');
  const proc = spawn(process.execPath, ['-r', CLOCK, path.join(app, 'server.js')], { env: { PATH: process.env.PATH, PORT: String(port), DATA_DIR: data, VIEW_TOKEN: V, EDIT_TOKEN: E,
    SERVER_FILE: serverFile, SERVER_FILE_KEEP: keep.join(','), MMS_FROM: 'shared', FAKE_NOW: fakeNow }, stdio: ['ignore', out, out] });
  let exited = null; proc.on('exit', c => { exited = c; });
  let health = null; for (let i = 0; i < 150 && !health && exited === null; i++) { const r = await req(port, 'GET', '/health'); if (r.status) health = r.json; else await wait(100); }
  await wait(100);
  const banner = fs.readFileSync(log, 'utf8').slice(mark);
  return { port, health, banner, bootLine, stop: async () => { if (exited === null) { proc.kill('SIGTERM'); for (let i = 0; i < 100 && exited === null; i++) await wait(50); } } };
}
const EH = { 'x-gc500-token': E, 'Content-Type': 'application/json', 'x-gc500-who': 'rehearsal' };

(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-589-deploy-')), app = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-589-app-'));
  const oldBytes = fs.readFileSync(OLD), newBytes = fs.readFileSync(NEW), OLD_SHA = sha(oldBytes), NEW_SHA = sha(newBytes);
  fs.mkdirSync(path.join(data, 'machine', 'blobs'), { recursive: true });
  fs.writeFileSync(path.join(data, 'machine', 'blobs', OLD_SHA), oldBytes);   /* the live service has v5.89 on its volume */
  fs.writeFileSync(path.join(data, 'records.json'), JSON.stringify({ version: 9704, updated: '2026-10-18T00:00:00.000Z', docs: { delivery: { GN01: { _k: 'GN01', status: 'delivered' } } } }));
  const recordHash = sha(fs.readFileSync(path.join(data, 'records.json')));
  check('0. the live server is v5.89 cb32d00e…', OLD_SHA === 'cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c', OLD_SHA);

  /* today: v5.89 running from its blob */
  let S = await boot(data, app, OLD_SHA, EARLIER_KEEP, '2026-10-20T10:00:00+10:00');
  check('1. before: v5.89 boots from its blob (the start command line names it)', S.health && S.health.build === 'v5.89' && S.bootLine.endsWith(OLD_SHA), [S.bootLine, S.health]);
  /* stage: PUT the new blob, check the inventory lists both */
  let r = await req(S.port, 'PUT', '/api/admin/machine/blob/' + NEW_SHA, { 'x-gc500-token': E }, newBytes);
  const inv = await req(S.port, 'GET', '/api/admin/machine', EH);
  check('2. stage: the v5.90 blob goes up under its SHA-256 and the inventory lists it beside v5.89', r.status === 200 && r.json.sha256 === NEW_SHA && inv.json.blobs.some(b => b.sha256 === NEW_SHA) && inv.json.blobs.some(b => b.sha256 === OLD_SHA), [r.json, inv.json && inv.json.blobs.map(b => b.sha256.slice(0, 8))]);
  const wrong = await req(S.port, 'PUT', '/api/admin/machine/blob/' + NEW_SHA, { 'x-gc500-token': E }, Buffer.concat([newBytes, Buffer.from(' ')]));
  check('3. a blob whose bytes do not match its name is refused (a cut-short upload cannot be booted)', wrong.status === 400, wrong.json);
  const ver = (await req(S.port, 'GET', '/api/version', EH)).json.version;
  await S.stop();

  /* the one Railway change: SERVER_FILE = v5.90, SERVER_FILE_KEEP = v5.89 + every earlier entry; one redeploy */
  S = await boot(data, app, NEW_SHA, [OLD_SHA].concat(EARLIER_KEEP), '2026-10-25T10:00:00+10:00');
  check('4. after the redeploy: the deploy log line names the v5.90 blob and sha256sum matches it', S.bootLine === 'server from volume blob ' + NEW_SHA + ' · sha256sum /app/server.js ' + NEW_SHA, S.bootLine);
  check('5. /health: ok, build v5.90, the record version unchanged, nothing recovered, no ticks yet', S.health && S.health.ok && S.health.build === 'v5.90' && S.health.version === ver && S.health.record_recovered === null && S.health.tracker_ticks === 0, S.health);
  check('6. the banner names v5.90, keeps the server blobs off the public set, and says nothing was recovered', /server v5\.90 — THE SERVICING TRACKER/.test(S.banner) && /server blob [2-9] kept off the public set/.test(S.banner) && !/RECOVERED FROM SNAPSHOT/.test(S.banner), S.banner.slice(-300));
  const view = await req(S.port, 'GET', '/api/ticks', { 'x-gc500-token': V });
  check('7. a view key cannot see the tracker list (403)', view.status === 403, view.json);
  const lines = []; DATA.areas.forEach(a => a.refs.forEach(x => x.lines.forEach(l => lines.push({ id: l.id, ref: x.ref, kind: l.kind, qty: l.qty }))));
  r = await req(S.port, 'POST', '/api/cards', EH, { load: 'servicing-tracker:GC500-2026', run_date: '2026-10-22', expires: '2026-10-26', title: 'GC500 servicing tracker', keys: [], targets: [],
    html: '<!doctype html><title>t</title><script>/* card */</script>', tracker: { days: DATA.days.map(d => ({ id: d.id, plan: d.plan })), lines, plans: DATA.plans } });
  const T = r.json.token, SIG = r.json.tracker.links;
  const tick = { id: 't' + crypto.randomBytes(12).toString('base64url'), ref: 'WC07', sig: SIG.WC07, line: 'WC07-FWF', task: 'pump', day: '2026-10-25', done: true, undoes: [], tapped_at: null };
  const t1 = await req(S.port, 'POST', '/d/' + T + '/ticks', { 'Content-Type': 'application/json' }, { ticks: [tick] });
  check('8. on v5.90 the tracker is made and WC07 is ticked', r.status === 200 && t1.status === 200, [r.status, t1.json]);
  const voidedTick = Object.assign({}, tick, { id: 't' + crypto.randomBytes(12).toString('base64url'), task: 'clean' });
  const tv = await req(S.port, 'POST', '/d/' + T + '/ticks', { 'Content-Type': 'application/json' }, { ticks: [voidedTick] });
  const vv = await req(S.port, 'POST', '/api/ticks/void', EH, { token: T, ids: [voidedTick.id], reason: 'local compatibility fixture' });
  const auditBefore = await req(S.port, 'GET', '/api/ticks?token=' + T + '&voided=1&voids=1&links=1', EH);
  check('8a. v5.90 saves a void audit while retaining the original signature', tv.status === 200 && vv.status === 200 && auditBefore.json.ticks.some(t => t.id === voidedTick.id && t.voided) && auditBefore.json.voids.some(v => v.ids.includes(voidedTick.id)) && auditBefore.json.links.WC07 === SIG.WC07);
  await S.stop();

  /* rollback: SERVER_FILE back to v5.89 (v5.90 kept in SERVER_FILE_KEEP); one redeploy */
  S = await boot(data, app, OLD_SHA, [NEW_SHA].concat(EARLIER_KEEP), '2026-10-25T10:10:00+10:00');
  const card = await req(S.port, 'GET', '/d/' + T), ticks = await req(S.port, 'GET', '/d/' + T + '/ticks');
  check('9. ROLLBACK: v5.89 boots from its blob on the same volume, record version unchanged', S.health && S.health.build === 'v5.89' && S.health.ok && S.health.version === ver && S.bootLine.endsWith(OLD_SHA), S.health);
  check('10. ...the tracker card and its saved ticks remain available on v5.89', card.status === 200 && ticks.status === 200 && ticks.json.ticks.some(t => t.id === tick.id), [card.status, ticks.status]);
  const oldAudit = await req(S.port, 'GET', '/api/ticks?token=' + T, EH);
  check('10a. v5.89 reads the v5.90 void history and signing links without repair', oldAudit.status === 200 && oldAudit.json.voids.some(v => v.ids.includes(voidedTick.id)) && oldAudit.json.links.WC07 === SIG.WC07 && !ticks.json.ticks.some(t => t.id === voidedTick.id));
  const rollbackTick = Object.assign({}, tick, { id: 't' + crypto.randomBytes(12).toString('base64url'), task: 'clean' });
  const rollbackPost = await req(S.port, 'POST', '/d/' + T + '/ticks', { 'Content-Type': 'application/json' }, { ticks: [rollbackTick] });
  const rollbackRead = await req(S.port, 'GET', '/d/' + T + '/ticks');
  check('10b. v5.89 accepts a fresh signed tick against the v5.90 store', rollbackPost.status === 200 && rollbackRead.status === 200 && rollbackRead.json.ticks.some(t => t.id === rollbackTick.id));
  check('11. ...and the v5.90 blob is still on the volume for the roll forward', fs.existsSync(path.join(data, 'machine', 'blobs', NEW_SHA)), null);
  await S.stop();

  /* roll forward again */
  S = await boot(data, app, NEW_SHA, [OLD_SHA].concat(EARLIER_KEEP), '2026-10-25T10:20:00+10:00');
  const back = await req(S.port, 'GET', '/d/' + T + '/ticks');
  const t2 = await req(S.port, 'POST', '/d/' + T + '/ticks', { 'Content-Type': 'application/json' }, { ticks: [Object.assign({}, tick, { id: 't' + crypto.randomBytes(12).toString('base64url'), task: 'lock' })] });
  const finalAudit = await req(S.port, 'GET', '/api/ticks?token=' + T + '&voided=1&voids=1&links=1', EH);
  check('12. roll forward: both active ticks survive and the original printed signature accepts another tick', S.health && S.health.build === 'v5.90' && back.status === 200 && back.json.ticks.some(t => t.id === tick.id) && back.json.ticks.some(t => t.id === rollbackTick.id) && !back.json.ticks.some(t => t.id === voidedTick.id) && t2.status === 200, [back.status, t2.status]);
  check('12a. roll forward retains the void audit and unchanged signing link', finalAudit.status === 200 && finalAudit.json.ticks.some(t => t.id === voidedTick.id && t.voided) && finalAudit.json.voids.some(v => v.ids.includes(voidedTick.id)) && finalAudit.json.links.WC07 === SIG.WC07 && finalAudit.json.active_ticks === 3 && finalAudit.json.historical_ticks === 4);
  check('12b. all four boots preserve the exact operational record bytes and version', S.health.version === ver && sha(fs.readFileSync(path.join(data, 'records.json'))) === recordHash);
  await S.stop();

  /* the trap the README warns about: SERVER_FILE naming a blob that is not there */
  const typo = await boot(data, app, NEW_SHA.replace(/^./, c => (c === 'a' ? 'b' : 'a')), [OLD_SHA], '2026-10-25T10:30:00+10:00');
  check('13. a typo in SERVER_FILE: there is no such blob, and the live start command would boot the old SERVER_B64 server (roll back at once)', typo.health === null && /missing/.test(typo.bootLine), typo.bootLine);

  console.log(`${pass}/${pass + fail} v5.90 deploy rehearsal checks passed (local only)`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
