/* server v5.85 MMS tests - LOCAL ONLY. Starts one server on a free port with test tokens and a throw-away DATA_DIR,
   and a pretend ClickSend on another port (CLICKSEND_BASE, honoured when NODE_ENV is not production). Nothing
   reaches the live service or the real ClickSend; only the two processes this script starts are stopped.
     node test_mms.js */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { spawn } = require('child_process');
const SRV = path.join(__dirname, 'server.js'), V = 'viewtokenviewtoken1', E = 'edittokenedittoken1';
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  - ' + detail : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

/* a small real JPEG: a 64x64 grey square written by hand (baseline, one component), then padded with a COM segment
   so it clears the server's 1 kB floor */
function jpegBytes(padTo) {
  const b = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////////////////////////wgALCABAAEABAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64');
  if (!padTo || b.length >= padTo) return b;
  const n = padTo - b.length - 4;
  const com = Buffer.concat([Buffer.from([0xFF, 0xFE, (n + 2) >> 8, (n + 2) & 255]), Buffer.alloc(n, 0x20)]);
  return Buffer.concat([b.slice(0, 2), com, b.slice(2)]);
}

function req(port, method, p, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers, agent: false }, res => {
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    r.on('error', reject); if (body) r.write(body); r.end();
  });
}
const json = r => { try { return JSON.parse(r.body.toString('utf8')); } catch (e) { return null; } };
const freePort = () => new Promise(r => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });

(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-mms-'));
  fs.writeFileSync(path.join(data, 'records.json'), JSON.stringify({ version: 1, updated: new Date().toISOString(), docs: {} }));
  const port = await freePort(), csPort = await freePort();

  /* the pretend ClickSend: records what it is asked, fetches the media_file as the real one would, answers SUCCESS */
  const seen = [];
  const cs = http.createServer(async (rq, rs) => {
    const chunks = []; rq.on('data', c => chunks.push(c)); rq.on('end', async () => {
      const bodyText = Buffer.concat(chunks).toString('utf8'); let body = null; try { body = JSON.parse(bodyText); } catch (e) { /* not json */ }
      const rec = { method: rq.method, url: rq.url, auth: rq.headers.authorization || null, body, fetched: null };
      if (rq.url.endsWith('/mms/send') && body && body.media_file) {
        try { const u = new URL(body.media_file); const got = await req(u.port, 'GET', u.pathname); rec.fetched = { status: got.status, type: got.headers['content-type'], bytes: got.body.length, sha: sha(got.body), cache: got.headers['cache-control'] }; }
        catch (e) { rec.fetched = { error: e.message }; }
      }
      seen.push(rec);
      if (rq.url.endsWith('/mms/send')) {
        const msgs = ((body && body.messages) || []).map((m, i) => ({ to: m.to, status: 'SUCCESS', message_id: 'mms-' + i, message_price: 0.36, message_parts: 1 }));
        rs.writeHead(200, { 'Content-Type': 'application/json' }); return rs.end(JSON.stringify({ http_code: 200, response_code: 'SUCCESS', response_msg: 'Messages queued for delivery.', data: { total_price: 0.36 * msgs.length, total_count: msgs.length, queued_count: msgs.length, messages: msgs } }));
      }
      rs.writeHead(404, { 'Content-Type': 'application/json' }); rs.end('{"error":"pretend clicksend: no such path"}');
    });
  });
  await new Promise(r => cs.listen(csPort, '127.0.0.1', r));

  const log = fs.openSync(path.join(data, 'server.log'), 'a');
  const env = { PATH: process.env.PATH, PORT: String(port), DATA_DIR: data, VIEW_TOKEN: V, EDIT_TOKEN: E,
    CLICKSEND_USERNAME: 'pretend', CLICKSEND_API_KEY: 'pretend-key', CLICKSEND_BASE: 'http://127.0.0.1:' + csPort + '/v3', SMS_FROM: 'Coates', SMS_DAILY_CAP: '5' };
  const proc = spawn(process.execPath, [SRV], { env, stdio: ['ignore', log, log] });
  let up = false; for (let i = 0; i < 100 && !up; i++) { try { const h = await req(port, 'GET', '/health'); if (h.status) up = true; } catch (e) { await wait(100); } }
  check('server starts', up);
  const health = json(await req(port, 'GET', '/health'));
  check('health says build v5.85', health && health.build === 'v5.85', health && health.build);

  const H = tok => ({ 'x-gc500-token': tok, 'Content-Type': 'application/json', 'x-gc500-who': 'test' });
  const pic = jpegBytes(1500), picUrl = 'data:image/jpeg;base64,' + pic.toString('base64');

  /* the brief */
  let r = await req(port, 'GET', '/api/mms', { headers: H(V) }); check('GET /api/mms on the view link is refused', r.status === 403, r.status);
  r = await req(port, 'GET', '/api/mms', { headers: H(E) }); let j = json(r);
  check('GET /api/mms on the edit link: configured, from Coates, limits', r.status === 200 && j.configured === true && j.from === 'Coates' && j.max_bytes === 250000 && j.subject_max === 20 && j.today.cap === 5, JSON.stringify(j).slice(0, 200));
  check('the brief knows the service address from the Host header', j.public_base === 'http://127.0.0.1:' + port, j.public_base);

  /* refusals */
  r = await req(port, 'POST', '/api/mms', { headers: H(V), body: JSON.stringify({ to: '0412345678', text: 'x', picture: picUrl }) }); check('POST on the view link is refused', r.status === 403, r.status);
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: '0412345678', text: 'Coates GC500: P36', picture: '' }) }); check('no picture: 400, nothing sent', r.status === 400 && /no picture/.test(json(r).error), json(r).error);
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: '0412345678', text: 'Coates GC500: P36', picture: 'data:image/png;base64,' + Buffer.alloc(2000, 1).toString('base64') }) }); check('a PNG is refused', r.status === 400 && /JPEG/.test(json(r).error), json(r).error);
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: '0412345678', text: 'Coates GC500: P36', picture: 'data:image/jpeg;base64,' + Buffer.alloc(2000, 1).toString('base64') }) }); check('bytes that are not a JPEG are refused', r.status === 400 && /not a JPEG/.test(json(r).error), json(r).error);
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: '0412345678', text: 'Coates GC500: P36', picture: 'data:image/jpeg;base64,' + jpegBytes(260000).toString('base64') }) }); check('a picture over 250 kB is refused', r.status === 400 && /250 kB/.test(json(r).error), json(r).error);
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: '0412345678', text: 'x'.repeat(1501), picture: picUrl }) }); check('a body over 1,500 characters is refused', r.status === 400 && /1500/.test(json(r).error), json(r).error);
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: '0712345678', text: 'Coates GC500: P36', picture: picUrl }) }); check('a landline is refused, named as a landline', r.status === 400 && /landline/.test(JSON.stringify(json(r))), (json(r).numbers || [])[0] && json(r).numbers[0].why);
  check('nothing reached ClickSend so far', seen.length === 0, seen.length);
  check('no picture kept for a refused send', !fs.existsSync(path.join(data, 'mms')) || fs.readdirSync(path.join(data, 'mms')).length === 0);

  /* dry run: the picture is kept and addressable, nothing is sent */
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: ['0412 345 678', '+61412345678'], text: 'Coates GC500: P36 - Portable building', subject: 'Coates GC500 P36 where it goes', picture: picUrl, dry_run: true }) }); j = json(r);
  check('dry run: 200, sent false, one number twice is one message', r.status === 200 && j.dry_run === true && j.sent === false && j.messages === 1 && j.to[0] === '+61412345678', JSON.stringify(j).slice(0, 160));
  check('dry run: the subject is trimmed to 20', j.subject.length <= 20 && j.subject === 'Coates GC500 P36 whe', j.subject);
  check('dry run: the picture is named by its hash and address', j.picture && j.picture.sha256 === sha(pic) && j.picture.url === 'http://127.0.0.1:' + port + '/p/' + sha(pic) + '.jpg', j.picture && j.picture.url);
  check('dry run: nothing reached ClickSend', seen.length === 0);
  r = await req(port, 'GET', '/p/' + sha(pic) + '.jpg'); check('the picture is served with no key, as image/jpeg, cached a day', r.status === 200 && r.headers['content-type'] === 'image/jpeg' && sha(r.body) === sha(pic) && /public/.test(r.headers['cache-control']), r.status + ' ' + r.headers['content-type']);
  r = await req(port, 'HEAD', '/p/' + sha(pic) + '.jpg'); check('HEAD works', r.status === 200 && r.body.length === 0);
  r = await req(port, 'GET', '/p/' + 'a'.repeat(64) + '.jpg'); check('an unknown hash is 404', r.status === 404);
  r = await req(port, 'GET', '/p/notahash.jpg'); check('a name that is not a hash never reaches the picture folder', r.status === 404);
  r = await req(port, 'GET', '/p/../records.json'); check('no path escapes', r.status === 404);

  /* the real send, against the pretend ClickSend */
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: '0412 345 678', text: 'Coates GC500: P36 - Portable building\nGPS -27.986807, 153.428251 (master plan)\nhttps://maps.google.com/?q=1', picture: picUrl }) }); j = json(r);
  check('send: 200, 1 of 1 went', r.status === 200 && j.sent === 1 && j.of === 1, JSON.stringify(j).slice(0, 200));
  const call = seen[seen.length - 1];
  check('ClickSend was asked at /v3/mms/send with Basic auth', call && call.url === '/v3/mms/send' && /^Basic /.test(call.auth || ''), call && call.url);
  check('the request carries media_file, subject, body, to, from, source', call && call.body && call.body.media_file === j.picture.url && call.body.messages[0].subject === 'Coates GC500' && call.body.messages[0].to === '+61412345678' && call.body.messages[0].from === 'Coates' && call.body.messages[0].source === 'gc500' && /P36/.test(call.body.messages[0].body), call && JSON.stringify(call.body).slice(0, 220));
  check('ClickSend could fetch the picture: 200 image/jpeg, the same bytes', call && call.fetched && call.fetched.status === 200 && call.fetched.type === 'image/jpeg' && call.fetched.sha === sha(pic), call && JSON.stringify(call.fetched));
  check('the answer records ClickSend\'s price and message id', j.messages[0].price === 0.36 && j.messages[0].message_id === 'mms-0' && j.clicksend.total_price === 0.36, JSON.stringify(j.messages[0]));
  check('counted against today: 4 of 5 left', j.today.left === 4, j.today.left);
  r = await req(port, 'GET', '/api/mms', { headers: H(E) }); j = json(r);
  check('the brief lists the picture message with kind mms and its hash', j.sent.length === 1 && j.sent[0].kind === 'mms' && j.sent[0].picture === sha(pic) && j.sent[0].status === 'SUCCESS', JSON.stringify(j.sent[0]).slice(0, 200));
  r = await req(port, 'GET', '/api/sms', { headers: H(E) }); j = json(r);
  check('the texts brief shares the same log and cap (4 left)', j.today.left === 4 && j.sent.some(e => e.kind === 'mms'), j.today.left);
  check('the log on disk carries it', fs.existsSync(path.join(data, 'sms.json')) && /"kind":"mms"/.test(fs.readFileSync(path.join(data, 'sms.json'), 'utf8')));

  /* the cap is a wall */
  r = await req(port, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: ['0412345671', '0412345672', '0412345673', '0412345674', '0412345675'], text: 'Coates GC500: P36', picture: picUrl }) });
  check('five more with four left: 429, nothing sent', r.status === 429 && seen.length === 1, r.status);

  /* the same picture twice is one file; pictures are swept after 14 days */
  const files = fs.readdirSync(path.join(data, 'mms')); check('one picture file, named by its hash', files.length === 1 && files[0] === sha(pic) + '.jpg', files.join());

  /* no sender: MMS refused plainly (a second instance without SMS_FROM) */
  await new Promise(r2 => { proc.on('exit', r2); proc.kill('SIGTERM'); });
  const port2 = await freePort(); const env2 = Object.assign({}, env, { PORT: String(port2) }); delete env2.SMS_FROM;
  const proc2 = spawn(process.execPath, [SRV], { env: env2, stdio: ['ignore', log, log] });
  up = false; for (let i = 0; i < 100 && !up; i++) { try { const h = await req(port2, 'GET', '/health'); if (h.status) up = true; } catch (e) { await wait(100); } }
  r = await req(port2, 'POST', '/api/mms', { headers: H(E), body: JSON.stringify({ to: '0412345678', text: 'Coates GC500: P36', picture: picUrl }) });
  check('without SMS_FROM a picture message is refused with the reason (501)', r.status === 501 && /SMS_FROM/.test(json(r).error), json(r).error);
  r = await req(port2, 'GET', '/api/mms', { headers: H(E) }); check('the brief says a sender is needed', json(r).from_needed === true);
  r = await req(port2, 'GET', '/p/' + sha(pic) + '.jpg'); check('the earlier picture is still served by the restarted service (kept on the disk)', r.status === 200);
  await new Promise(r2 => { proc2.on('exit', r2); proc2.kill('SIGTERM'); });
  cs.close();

  const failed = results.filter(x => !x.ok).length;
  console.log('\n' + (results.length - failed) + ' / ' + results.length + ' pass' + (failed ? ' - ' + failed + ' FAILED' : ''));
  fs.rmSync(data, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
