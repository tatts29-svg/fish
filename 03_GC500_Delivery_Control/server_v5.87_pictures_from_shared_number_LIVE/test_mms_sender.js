/* Author: Andrew Fisher. Server v5.87 - which sender a picture message and a text go from. Local server and a pretend
   ClickSend only; never calls the live service or ClickSend; no real message is sent.
     node test_mms_sender.js */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { spawn } = require('child_process');
const SRV = path.join(__dirname, 'server.js');
const E = 'local-edit-token-587', V = 'local-view-token-587';
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + ' — ' + JSON.stringify(detail)); } };
function jpegBytes(padTo) {
  const b = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////////////////////////wgALCABAAEABAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64');
  const n = padTo - b.length - 4;
  const com = Buffer.concat([Buffer.from([0xFF, 0xFE, (n + 2) >> 8, (n + 2) & 255]), Buffer.alloc(n, 0x20)]);
  return Buffer.concat([b.slice(0, 2), com, b.slice(2)]);
}
function req(port, method, p, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers, agent: false }, res => {
      const c = []; res.on('data', x => c.push(x)); res.on('end', () => { const t = Buffer.concat(c).toString(); let j = null; try { j = JSON.parse(t); } catch (e) {} resolve({ status: res.statusCode, json: j, text: t }); });
    });
    r.on('error', reject); if (body) r.write(body); r.end();
  });
}
const freePort = () => new Promise(r => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });

async function run(label, extraEnv) {
  const seen = [];
  const cs = http.createServer((rq, rs) => {
    const c = []; rq.on('data', x => c.push(x)); rq.on('end', () => {
      let body = null; try { body = JSON.parse(Buffer.concat(c).toString()); } catch (e) {}
      seen.push({ url: rq.url, body });
      const msgs = ((body && body.messages) || []).map((m, i) => ({ to: m.to, status: 'SUCCESS', message_id: 'local-' + i }));
      rs.writeHead(200, { 'Content-Type': 'application/json' });
      rs.end(JSON.stringify({ http_code: 200, response_code: 'SUCCESS', response_msg: 'queued', data: { messages: msgs } }));
    });
  });
  const csPort = await freePort(); await new Promise(r => cs.listen(csPort, '127.0.0.1', r));
  const port = await freePort();
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-587-'));
  const log = fs.openSync(path.join(data, 'server.log'), 'a');
  const env = Object.assign({ PATH: process.env.PATH, PORT: String(port), DATA_DIR: data, VIEW_TOKEN: V, EDIT_TOKEN: E,
    CLICKSEND_USERNAME: 'pretend', CLICKSEND_API_KEY: 'pretend-key', CLICKSEND_BASE: 'http://127.0.0.1:' + csPort + '/v3',
    PUBLIC_BASE: 'http://127.0.0.1:' + port, SMS_DAILY_CAP: '20' }, extraEnv);
  const proc = spawn(process.execPath, [SRV], { env, stdio: ['ignore', log, log] });
  let up = false; for (let i = 0; i < 100 && !up; i++) { try { await req(port, 'GET', '/health'); up = true; } catch (e) { await wait(100); } }
  const H = { 'x-gc500-token': E, 'Content-Type': 'application/json', 'x-gc500-who': 'test' };
  const pic = 'data:image/jpeg;base64,' + jpegBytes(1500).toString('base64');
  const out = { seen };
  out.health = (await req(port, 'GET', '/health')).json;
  out.brief = (await req(port, 'GET', '/api/mms', H)).json;
  out.dry = (await req(port, 'POST', '/api/mms', H, JSON.stringify({ to: '0412345678', text: 'local test', picture: pic, dry_run: true }))).json;
  out.mms = await req(port, 'POST', '/api/mms', H, JSON.stringify({ to: '0412345678', text: 'local test picture', picture: pic }));
  out.sms = await req(port, 'POST', '/api/sms', H, JSON.stringify({ to: '0412345678', text: 'local test text' }));
  proc.kill('SIGTERM'); cs.close(); await wait(200);
  out.banner = fs.readFileSync(path.join(data, 'server.log'), 'utf8');
  return out;
}

(async () => {
  /* 1. MMS_FROM=shared: the picture goes with no "from"; the text still from SMS_FROM */
  let r = await run('shared', { SMS_FROM: '+61400000001', MMS_FROM: 'shared' });
  const mmsCall = r.seen.find(s => s.url.endsWith('/mms/send')), smsCall = r.seen.find(s => s.url.endsWith('/sms/send'));
  check('health says v5.87', r.health && r.health.build === 'v5.87', r.health);
  check('shared: the brief names a ClickSend shared number and needs nothing more', r.brief.from === 'a ClickSend shared number' && r.brief.from_needed === false && r.brief.from_shared === true, r.brief);
  check('shared: the dry run sends nothing and names the shared number', r.dry.dry_run === true && r.dry.from === 'a ClickSend shared number' && !r.seen.some(s => s.body && s.body.dry_run), r.dry);
  check('shared: the picture message is accepted (200)', r.mms.status === 200, r.mms.text.slice(0, 200));
  check('shared: ClickSend is asked with NO "from" on every message', mmsCall && mmsCall.body.messages.every(m => !('from' in m)), mmsCall && mmsCall.body.messages);
  check('shared: the media file and recipient still go', mmsCall && /\/p\/[0-9a-f]{64}\.jpg$/.test(mmsCall.body.media_file) && mmsCall.body.messages[0].to === '+61412345678', mmsCall && mmsCall.body);
  check('shared: the plain text still goes from SMS_FROM', smsCall && smsCall.body.messages.every(m => m.from === '+61400000001'), smsCall && smsCall.body.messages);
  check('shared: the start-up banner says pictures go from a ClickSend shared number', /pictures from a ClickSend shared number/.test(r.banner), r.banner.slice(0, 300));

  /* 2. MMS_FROM unset: exactly as v5.86 - pictures from SMS_FROM */
  r = await run('unset', { SMS_FROM: '+61400000001' });
  const m2 = r.seen.find(s => s.url.endsWith('/mms/send'));
  check('unset: pictures go from SMS_FROM, as v5.86', m2 && m2.body.messages.every(m => m.from === '+61400000001'), m2 && m2.body.messages);
  check('unset: the brief names SMS_FROM', r.brief.from === '+61400000001' && r.brief.from_needed === false && r.brief.from_shared === false, r.brief);

  /* 3. MMS_FROM a number: pictures from that number, texts from SMS_FROM */
  r = await run('number', { SMS_FROM: '+61400000001', MMS_FROM: '+61 400 000 002' });
  const m3 = r.seen.find(s => s.url.endsWith('/mms/send')), s3 = r.seen.find(s => s.url.endsWith('/sms/send'));
  check('number: pictures go from MMS_FROM (spaces removed)', m3 && m3.body.messages.every(m => m.from === '+61400000002'), m3 && m3.body.messages);
  check('number: texts still go from SMS_FROM', s3 && s3.body.messages.every(m => m.from === '+61400000001'), s3 && s3.body.messages);

  /* 4. no sender at all: pictures refused 501 before ClickSend, as v5.86; shared alone is enough */
  r = await run('none', {});
  check('no sender: a picture is refused 501 and ClickSend is not asked', r.mms.status === 501 && !r.seen.some(s => s.url.endsWith('/mms/send')), r.mms.text.slice(0, 200));
  r = await run('shared-only', { MMS_FROM: 'shared' });
  const m5 = r.seen.find(s => s.url.endsWith('/mms/send'));
  check('MMS_FROM=shared with no SMS_FROM: the picture goes, with no "from"', r.mms.status === 200 && m5 && m5.body.messages.every(m => !('from' in m)), r.mms.text.slice(0, 200));

  console.log(`${pass}/${pass + fail} v5.87 sender checks passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
