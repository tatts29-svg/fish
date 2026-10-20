/* Author: Andrew Fisher. Server v5.90 - the servicing tracker. Local servers only: 127.0.0.1, fake tokens, a throw-away
   DATA_DIR from mkdtemp (set TMPDIR to choose where), the server's clock set by fake_clock.js (test only). Never calls
   the live service; sends no message; stops only the processes it started.
     TMPDIR=<scratch> node test_tracker.js
   The tracker list is Andrew's own, read from ../servicing_tracker_DRAFT/tracker_data.json (75 references, 83 lines). */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { spawn } = require('child_process');
const SRV = path.join(__dirname, 'server.js');
const OLD = process.env.GC500_ROLLBACK_SERVER || path.join(__dirname, '..', 'server_v5.87_pictures_from_shared_number_LIVE', 'server.js');   // the live v5.87, for the rollback check
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

/* Additional regression probes for the v5.90 review findings. */
(async () => {
  let S;
  try {
    const D = newData('edge590');
    fs.writeFileSync(path.join(D,'records.json'), JSON.stringify({version:41,updated:'2026-10-18T00:00:00.000Z',docs:{}}));
    const recordHash=sha(path.join(D,'records.json'));
    S=await start(D,'2026-10-25T10:00:00+10:00');
    let r=await req(S.port,'POST','/api/cards',EH(),cardBody());
    const T=r.json.token; SIG=r.json.tracker.links; const originalSig=SIG.WC06;
    const noContact=(await req(S.port,'POST','/api/cards',EH(),cardBody({load:'servicing-tracker:no-contact',contact:null}))).json.token;
    const html=await req(S.port,'GET','/d/'+T);
    const sw=await req(S.port,'GET','/d/'+T+'/sw.js');
    check('worker route exact source and tracker CSP',sw.status===200&&sw.text===fs.readFileSync(path.join(__dirname,'tracker_sw.js'),'utf8')&&sw.headers['service-worker-allowed']==='/d/'+T&&sw.headers['cache-control']==='no-store'&&html.headers['content-security-policy'].includes("worker-src 'self'"));
    const hashOfScript = text => 'sha256-' + crypto.createHash('sha256').update(text.match(/<script>([\s\S]*?)<\/script>/)[1], 'utf8').digest('base64');
    const initialRead = await read(S.port,T);
    const initialHash = hashOfScript(html.text);
    check('crew metadata hashes the exact served script and matches its CSP without signing data',initialRead.status===200&&initialRead.json.card_script_hash===initialHash&&html.headers['content-security-policy'].includes("script-src '"+initialHash+"'")&&!('links' in initialRead.json)&&!('key' in initialRead.json)&&!JSON.stringify(initialRead.json).includes(originalSig));
    const changedHtml = CARD_HTML.replace('/* the card */', '/* same days, revised quantity and contact display */\nvar fixtureQuantity = 2;');
    const update = await req(S.port,'POST','/api/cards',EH(),cardBody({token:T,html:changedHtml}));
    const updatedRead = await read(S.port,T), updatedHtml = await req(S.port,'GET','/d/'+T);
    check('same-token card change updates script identity with unchanged days and preserved signatures',update.status===200&&update.json.tracker.links.WC06===originalSig&&updatedHtml.text===changedHtml&&updatedRead.json.card_script_hash===hashOfScript(updatedHtml.text)&&updatedRead.json.card_script_hash!==initialHash&&JSON.stringify(updatedRead.json.days)===JSON.stringify(initialRead.json.days));
    const stableRead = await read(S.port,T,updatedRead.json.seq);
    check('unchanged incremental read keeps the exact script identity',stableRead.status===200&&stableRead.json.card_script_hash===updatedRead.json.card_script_hash&&stableRead.json.ticks.length===0);
    const driver=(await req(S.port,'POST','/api/cards',EH(),cardBody({load:'driver',tracker:undefined}))).json.token;
    const dh=await req(S.port,'GET','/d/'+driver), dw=await req(S.port,'GET','/d/'+driver+'/sw.js');
    check('ordinary driver card keeps CSP/cache and no tracker worker',dh.status===200&&!dh.headers['content-security-policy'].includes('worker-src')&&dh.headers['cache-control']==='no-store'&&dw.status===404);
    const madeTick=tk('WC06','WC06-FWF','pump','2026-10-23');
    await post(S.port,T,[madeTick]);
    r=await req(S.port,'GET','/api/ticks?token='+T,EH());
    check('admin default contains ticks but no signing links or void history',r.status===200&&r.json.ticks.length===1&&!('links' in r.json)&&!('voids' in r.json)&&!r.json.more&&r.json.seq===1);
    r=await req(S.port,'GET','/api/ticks?token='+T+'&links=1',EH());
    check('explicit printing returns current links without exposing secret',r.status===200&&r.json.links.WC06===originalSig&&!('key' in r.json));
    await S.stop(); S=null;
    // Simulate lost tick store and its snapshots. The saved card survives, as on a restore from record export.
    fs.unlinkSync(path.join(D,'tracker_ticks.jsonl'));
    for(const f of fs.readdirSync(path.join(D,'snapshots'))) if(f.startsWith('ticks-')) fs.unlinkSync(path.join(D,'snapshots',f));
    S=await start(D,'2026-10-25T10:00:00+10:00');
    const beforeCards=sha(path.join(D,'cards.json'));
    r=await req(S.port,'POST','/api/cards',EH(),cardBody({token:T}));
    check('ordinary update after key loss refuses409 key_lost and preserves cards file',r.status===409&&r.json.code==='key_lost'&&r.json.reprint_required===true&&sha(path.join(D,'cards.json'))===beforeCards);
    const pending=await post(S.port,T,[tk('WC06','WC06-FWF','clean','2026-10-23')]);
    check('old laminated code remains recoverable no_key instead of silent bad_sig',pending.status===503&&pending.json.code==='no_key');
    r=await req(S.port,'POST','/api/cards',EH(),cardBody({token:T,rekey:true}));
    check('only explicit rekey creates replacement signatures',r.status===200&&r.json.tracker.key_new===true&&r.json.tracker.links.WC06!==originalSig);
    SIG=r.json.tracker.links;
    const replacementSig=SIG.WC06;
    const oldCode=await post(S.port,T,[tk('WC06','WC06-FWF','clean','2026-10-23',{sig:originalSig})]);
    const newCode=await post(S.port,T,[tk('WC06','WC06-FWF','clean','2026-10-23')]);
    check('explicitly replaced codes enforce new signature',oldCode.status===403&&newCode.status===200);
    await S.stop(); S=null;
    const TF=path.join(D,'tracker_ticks.jsonl');
    const keys=linesOf(TF).map(JSON.parse).filter(e=>e.e==='key');
    function seed(total,voidN){
      const rows=[{e:'epoch',epoch:'edge590',at:'2026-10-24T00:00:00.000Z'},...keys];
      for(let i=1;i<=total;i++) rows.push({e:'tick',token:T,id:'seedtick'+String(i).padStart(10,'0'),seq:i,ref:'WC06',line:'seed-line',task:'pump',day:'2026-10-23',done:true,undoes:[],at:'2026-10-24T00:00:00.000Z',tapped_at:null});
      for(let i=1;i<=voidN;i+=2000) rows.push({e:'void',token:T,vid:'void'+i,ids:Array.from({length:Math.min(2000,voidN-i+1)},(_,j)=>'seedtick'+String(i+j).padStart(10,'0')),at:'2026-10-24T00:00:00.000Z'});
      fs.writeFileSync(TF,rows.map(e=>JSON.stringify(e)).join('\n')+'\n');
    }
    seed(25000,0);
    S=await start(D,'2026-10-25T10:00:00+10:00');
    r=await post(S.port,T,[tk('WC06','WC06-FWF','pump','2026-10-23')]);
    check('active per-tracker25000 cap blocks new ticks',r.status===507&&r.json.code==='full');
    const test=(await req(S.port,'POST','/api/cards',EH(),cardBody({load:'servicing-tracker:TEST'}))).json;
    const testSig=SIG; SIG=test.tracker.links;
    const separate=await post(S.port,test.token,[tk('WC06','WC06-FWF','pump','2026-10-23')]); SIG=testSig;
    check('full real tracker does not consume TEST allowance',separate.status===200);
    const v=await req(S.port,'POST','/api/ticks/void',EH(),{token:T,ids:['seedtick0000000001']});
    const freed=await post(S.port,T,[tk('WC06','WC06-FWF','pump','2026-10-23')]);
    check('void releases active capacity without deleting history',v.status===200&&freed.status===200);
    const first=await req(S.port,'GET','/api/ticks?token='+T,EH());
    const next=await req(S.port,'GET','/api/ticks?token='+T+'&since='+first.json.seq,EH());
    check('admin cursor caps2000 ticks and advances through voided rows',first.json.ticks.length===2000&&first.json.seq===2001&&first.json.more&&next.json.ticks.length===2000&&next.json.ticks[0].seq===2002&&first.json.active_ticks===25000&&first.json.historical_ticks===25001);
    const audit=await req(S.port,'GET','/api/ticks?token='+T+'&voided=1&voids=1',EH());
    check('explicit audit includes marked voided tick and bounded void cursor',audit.json.ticks[0].voided===true&&audit.json.voids.length===1&&audit.json.void_seq===1&&!audit.json.void_more);
    const end=await req(S.port,'GET','/api/ticks?token='+T+'&since=25001',EH());
    check('up-to-date incremental poll returns zero ticks and stable cursor',end.json.ticks.length===0&&!end.json.more&&end.json.seq===25001);
    await S.stop(); S=null;
    S=await start(D,'2026-10-25T10:00:00+10:00');
    r=await req(S.port,'GET','/api/ticks?token='+T+'&since=25000',EH());
    check('active count and audit history survive restart',r.json.active_ticks===25000&&r.json.historical_ticks===25001&&r.json.ticks.length===1);
    await S.stop(); S=null;
    seed(30000,29999);
    S=await start(D,'2026-10-25T10:00:00+10:00');
    r=await post(S.port,T,[tk('WC06','WC06-FWF','pump','2026-10-23')]);
    const active=await req(S.port,'GET','/api/ticks?token='+T+'&voids=1',EH());
    const moreVoid=await req(S.port,'GET','/api/ticks?token='+T+'&voids=1&void_since='+active.json.void_seq,EH());
    check('voided history above old global cap does not block real crews',r.status===200&&active.json.active_ticks===2&&active.json.historical_ticks===30001&&active.json.ticks.length===2);
    check('void history is independently paged by bounded id count',active.json.voids.flatMap(v=>v.ids).length===2000&&active.json.void_more&&active.json.void_seq===1&&moreVoid.json.void_seq===2);
    await S.stop(); S=null;
    seed(100000,100000);
    S=await start(D,'2026-10-25T10:00:00+10:00');
    r=await post(S.port,T,[tk('WC06','WC06-FWF','pump','2026-10-23')]);
    check('retained history has separate100000 per-tracker ceiling',r.status===507&&r.json.code==='history_full'&&r.json.full===true);
    const test2=(await req(S.port,'POST','/api/cards',EH(),cardBody({load:'servicing-tracker:TEST2'}))).json;
    SIG=test2.tracker.links;
    r=await post(S.port,test2.token,[tk('WC06','WC06-FWF','pump','2026-10-23')]);
    check('history-full tracker cannot block another tracker',r.status===200);
    check('all probes preserve the operational record bytes',sha(path.join(D,'records.json'))===recordHash);
    await S.stop(); S=null;
    S=await start(D,'2026-10-27T10:00:00+10:00');
    const missing=await req(S.port,'GET','/d/unknown_tracker_link');
    const expired=await req(S.port,'GET','/d/'+noContact);
    check('withdrawn link keeps the exact v5.89 fallback wording',missing.status===404&&missing.text.includes('Ring the Coates events project manager whose name is on your paperwork.')&&!missing.text.includes('Contact the Coates events project manager on site.'));
    check('expired no-contact card keeps the exact v5.89 fallback wording',expired.status===410&&expired.text.includes('Ring the Coates events project manager whose name is on your paperwork.')&&!expired.text.includes('Contact the Coates events project manager on site.'));
    await S.stop(); S=null;
    console.log(`${pass}/${pass+fail} v5.90 additional reliability checks passed`);
    process.exitCode=fail?1:0;
  } finally {if(S) await S.stop();}
})().catch(e=>{console.error(e);process.exitCode=1;});
