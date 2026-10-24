/* Author: Andrew Fisher. Local server and fake provider only. Never calls live GC500 or ClickSend. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), assert = require('assert');
const { spawn } = require('child_process');
const E = 'local-edit-token-586', V = 'local-view-token-586', results = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
function check(name, fn) { fn(); results.push(name); console.log('PASS ' + name); }
const listen = s => new Promise((resolve, reject) => { s.once('error', reject); s.listen(0, '127.0.0.1', () => resolve(s.address().port)); });
const request = (port, method, route, token, body) => new Promise((resolve, reject) => {
  const req = http.request({ host: '127.0.0.1', port, path: route, method,
    headers: { 'x-gc500-token': token || '', 'Content-Type': 'application/json' } }, res => {
    const parts = []; res.on('data', b => parts.push(b)); res.on('end', () => {
      const text = Buffer.concat(parts).toString(); let json; try { json = JSON.parse(text); } catch (_) { json = null; }
      resolve({ status: res.statusCode, json, text });
    });
  });
  req.on('error', reject); if (body) req.write(JSON.stringify(body)); req.end();
});
let server, fake, temporary;
(async () => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-delivery-586-'));
  const stamp = '2026-10-01T08:00:00.000Z';
  const names = ['sms-delivered', 'sms-pending', 'sms-failed', 'sms-temporary', 'sms-missing', 'sms-unsupported', 'sms-wrong-id', 'sms-wrong-kind', 'sms-malformed', 'sms-private',
    'mms-delivered', 'mms-pending', 'mms-failed', 'mms-temporary', 'mms-completed', 'mms-wrong-to', 'mms-inbound', 'mms-secret', 'mms-missing'];
  const seed = names.map((id, i) => ({ message_id: id, to: '+61412345678', text: 'local fixture', at: stamp, status: 'SUCCESS', ...(id.startsWith('mms') ? { kind: 'mms' } : {}) }));
  fs.writeFileSync(path.join(temporary, 'records.json'), JSON.stringify({ version: 1, docs: {} }));
  fs.writeFileSync(path.join(temporary, 'sms.json'), JSON.stringify({ sent: {}, log: seed }));
  const calls = []; let mmsMode = 'normal', count = 0;
  const reply = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  fake = http.createServer(async (req, res) => {
    const buffers = []; for await (const b of req) buffers.push(b);
    const raw = Buffer.concat(buffers).toString(); const body = raw ? JSON.parse(raw) : null;
    calls.push({ method: req.method, url: req.url, body });
    if (req.url.includes('/receipts/')) {
      const id = req.url.split('/').pop();
      if (id === 'sms-missing') return reply(res, 404, { error: 'no receipt' });
      if (id === 'sms-unsupported') return reply(res, 501, { error: 'unsupported' });
      if (id === 'sms-malformed') return reply(res, 200, { response_code: 'SUCCESS', data: [] });
      if (id === 'sms-private') return reply(res, 401, { error: 'fake-secret-key private-account body-text' });
      const code = id === 'sms-delivered' ? 201 : id === 'sms-failed' ? 301 : id === 'sms-temporary' ? 300 : 200;
      return reply(res, 200, { response_code: 'SUCCESS', data: { message_id: id === 'sms-wrong-id' ? 'unrelated-message' : id,
        status_code: String(code), error_code: code === 301 ? 12 : null, status_text: 'fake-secret-key', body: 'body-text',
        message_type: id === 'sms-wrong-kind' ? 'mms' : 'sms', _api_username: 'private-account' } });
    }
    if (req.url.startsWith('/v3/mms/history')) {
      if (mmsMode === 'unsupported') return reply(res, 404, { error: 'fake-secret-key' });
      if (mmsMode === 'malformed') return reply(res, 200, { response_code: 'SUCCESS', data: { unknown: [] } });
      if (mmsMode === 'truncated') return reply(res, 200, { response_code: 'SUCCESS', data: { last_page: 99, data: Array.from({ length: 100 }, (_, i) => ({ message_id: 'foreign-' + i, body: 'foreign-body' })) } });
      const rows = seed.filter(e => e.kind === 'mms' && e.message_id !== 'mms-missing').map(e => ({ ...e,
        direction: e.message_id === 'mms-inbound' ? 'in' : 'out', to: e.message_id === 'mms-wrong-to' ? '+61499999999' : e.to,
        status: e.message_id === 'mms-completed' ? 'Completed' : e.message_id === 'mms-failed' || e.message_id === 'mms-temporary' ? 'Failed' : 'Sent',
        status_code: e.message_id === 'mms-delivered' || e.message_id === 'mms-secret' ? '201' : e.message_id === 'mms-failed' ? '301' : e.message_id === 'mms-temporary' ? '300' : null,
        body: 'body-text', _api_username: 'private-account', error_text: 'fake-secret-key', _media_file_url: 'private-media-url' }));
      rows.push({ message_id: 'foreign-message', direction: 'out', to: '+61400000000', status_code: 201, body: 'foreign-body' });
      return reply(res, 200, { response_code: 'SUCCESS', data: { data: rows, last_page: 1 } });
    }
    if (req.url === '/v3/sms/send' || req.url === '/v3/mms/send') {
      const message = body.messages[0].body;
      if (message === 'network-error') return req.socket.destroy();
      if (message === 'malformed-provider') return reply(res, 503, { error: 'fake-secret-key private-account body-text' });
      if (message === 'global-rejection') return reply(res, 401, { response_code: 'INVALID_CREDENTIALS', response_msg: 'fake-secret-key' });
      const messages = body.messages.map((m, i) => ({ to: m.to, status: message === 'mixed' && i === 1 ? 'INVALID_RECIPIENT'
        : message === 'substring' ? 'UNSUCCESSFUL' : 'SUCCESS', message_id: 'local-send-' + (++count), message_price: 0.1 }));
      if (message === 'reordered') { messages[0].status = 'INVALID_RECIPIENT'; messages.reverse(); messages.forEach(m => { m.to = m.to.slice(1); }); }
      if (message === 'wrong-recipients') messages.forEach(m => { m.to = '+61488888888'; });
      return reply(res, 200, { response_code: 'SUCCESS', response_msg: 'fake-secret-key', data: { messages, total_price: 0.1 } });
    }
    return reply(res, 404, { error: 'Unexpected local provider route' });
  });
  const fakePort = await listen(fake);
  const reserve = http.createServer(); const port = await listen(reserve); await new Promise(r => reserve.close(r));
  const logfile = fs.openSync(path.join(temporary, 'server.log'), 'w');
  server = spawn(process.execPath, [path.join(__dirname, 'server.js')], { env: { PATH: process.env.PATH, PORT: String(port), DATA_DIR: temporary,
    EDIT_TOKEN: E, VIEW_TOKEN: V, CLICKSEND_USERNAME: 'local-user', CLICKSEND_API_KEY: 'fake-secret-key',
    SMS_FROM: '+61477777777', SMS_DAILY_CAP: '1000', CLICKSEND_BASE: 'http://127.0.0.1:' + fakePort + '/v3' }, stdio: ['ignore', logfile, logfile] });
  let up; for (let i = 0; i < 100; i++) { try { up = await request(port, 'GET', '/health'); break; } catch (_) { await wait(50); } }
  check('server v5.86 starts', () => assert.equal(up.json.build, 'v5.86'));
  const status = (ids, token = E) => request(port, 'GET', '/api/sms/status?ids=' + encodeURIComponent(ids.join(',')), token);
  let r = await status(['sms-delivered'], V);
  check('view auth cannot inspect delivery', () => { assert.equal(r.status, 403); assert.equal(calls.length, 0); });
  r = await status(['sms-delivered'], 'wrong');
  check('bad auth cannot inspect delivery', () => { assert.notEqual(r.status, 200); assert.equal(calls.length, 0); });
  r = await status(['sms-delivered', 'foreign-message']);
  check('unknown ID fails whole lookup before provider reads', () => { assert.equal(r.status, 404); assert.equal(calls.length, 0); });
  for (const ids of [[], ['../account'], Array.from({ length: 51 }, (_, i) => 'sms-' + i)]) {
    r = await status(ids); check('malformed or over-limit request rejected: ' + ids.length, () => { assert.equal(r.status, 400); assert.equal(calls.length, 0); });
  }
  const smsBefore = fs.readFileSync(path.join(temporary, 'sms.json'), 'utf8');
  r = await status(names.filter(n => n.startsWith('sms')));
  const byId = Object.fromEntries(r.json.messages.map(e => [e.message_id, e]));
  for (const [name, state] of Object.entries({ 'sms-delivered': 'delivered', 'sms-pending': 'pending', 'sms-failed': 'failed', 'sms-temporary': 'pending',
    'sms-missing': 'pending', 'sms-unsupported': 'unsupported', 'sms-wrong-id': 'unknown', 'sms-wrong-kind': 'unknown', 'sms-malformed': 'unknown', 'sms-private': 'unknown' }))
    check(name + ' classified ' + state, () => assert.equal(byId[name].delivery_status, state));
  check('receipt response omits provider secrets, bodies and account', () => assert(!/fake-secret-key|body-text|private-account|status_text|error_text/.test(r.text)));
  check('receipt lookup does not modify local log', () => assert.equal(fs.readFileSync(path.join(temporary, 'sms.json'), 'utf8'), smsBefore));
  r = await status(names.filter(n => n.startsWith('mms')));
  const mmsById = Object.fromEntries(r.json.messages.map(e => [e.message_id, e]));
  for (const [name, state] of Object.entries({ 'mms-delivered': 'delivered', 'mms-pending': 'pending', 'mms-failed': 'failed', 'mms-temporary': 'pending',
    'mms-completed': 'unknown', 'mms-wrong-to': 'pending', 'mms-inbound': 'pending', 'mms-secret': 'delivered', 'mms-missing': 'pending' }))
    check(name + ' classified ' + state, () => assert.equal(mmsById[name].delivery_status, state));
  check('MMS lookup omits foreign messages, body, media URLs and provider credentials', () => assert(!/foreign-|body-text|private-media|fake-secret-key|private-account/.test(r.text)));
  const historyCall = calls.find(c => c.url.startsWith('/v3/mms/history'));
  check('MMS uses documented dated bounded history', () => { const q = new URL(historyCall.url, 'http://local').searchParams;
    assert.equal(q.get('date_from'), String(Date.parse(stamp) / 1000 - 60)); assert.equal(q.get('date_to'), String(Date.parse(stamp) / 1000 + 60)); assert.equal(q.get('limit'), '100'); });
  for (const [mode, state] of [['unsupported', 'unsupported'], ['malformed', 'unknown'], ['truncated', 'unknown']]) {
    mmsMode = mode; const before = calls.length; r = await status(['mms-missing']);
    check('MMS ' + mode + ' reports ' + state, () => { assert.equal(r.json.messages[0].delivery_status, state); if (mode === 'truncated') assert.equal(calls.length - before, 5); });
  }
  check('all receipt/provider reads are GET, never mark-as-read', () => assert(calls.every(c => c.method === 'GET' && !c.url.includes('receipts-read'))));
  const send = (text, to = ['0412345678', '0412345679'], extra = {}) => request(port, 'POST', extra.picture ? '/api/mms' : '/api/sms', E, { to, text, ...extra });
  r = await send('mixed');
  check('mixed submission reports one accepted and one rejected', () => { assert.equal(r.status, 200); assert.equal(r.json.sent, 1); assert.equal(r.json.accepted, 1); assert.equal(r.json.rejected, 1); assert.equal(r.json.unknown, 0); assert.equal(r.json.messages[1].submission_status, 'rejected'); });
  check('acceptance is pending delivery', () => assert.equal(r.json.messages[0].delivery_status, 'pending'));
  check('submission does not echo arbitrary provider response words', () => assert(!r.text.includes('fake-secret-key')));
  r = await send('substring');
  check('UNSUCCESSFUL substring never counts as acceptance or definite rejection', () => { assert.equal(r.json.accepted, 0); assert.equal(r.json.rejected, 0); assert.equal(r.json.unknown, 2); assert.equal(r.status, 502); });
  r = await send('reordered');
  check('provider recipients match normalized number, not array order', () => { assert.equal(r.json.messages[0].submission_status, 'rejected'); assert.equal(r.json.messages[1].submission_status, 'accepted'); });
  r = await send('wrong-recipients');
  check('unmatched provider recipients are unknown', () => assert.equal(r.json.unknown, 2));
  r = await send('malformed-provider');
  check('malformed provider 503 is unknown and never claims nothing sent', () => { assert.equal(r.json.unknown, 2); assert.equal(r.json.rejected, 0); assert(!r.text.includes('fake-secret-key')); });
  r = await send('network-error');
  check('provider network failure includes per-recipient unknown and retry warning', () => { assert.equal(r.json.unknown, 2); assert.equal(r.json.messages[0].submission_status, 'unknown'); assert(/before sending again/.test(r.json.error)); });
  r = await send('global-rejection');
  check('documented global rejection is explicit and returns allowance', () => { assert.equal(r.json.rejected, 2); assert.equal(r.json.unknown, 0); assert(!r.text.includes('fake-secret-key')); });
  const pic = Buffer.alloc(1500); pic[0] = 255; pic[1] = 216; pic[2] = 255;
  r = await send('mixed', ['0412345678', '0412345679'], { picture: 'data:image/jpeg;base64,' + pic.toString('base64') });
  check('MMS uses the same truthful submission contract', () => { assert.equal(r.json.accepted, 1); assert.equal(r.json.rejected, 1); assert.equal(r.json.messages[0].kind, 'mms'); assert.equal(r.json.messages[0].delivery_status, 'pending'); });
  check('test provider calls stay on explicit messaging routes', () => assert(calls.every(c => /^\/v3\/(sms\/(send|receipts\/)|mms\/(send|history\?))/.test(c.url))));
  console.log(results.length + '/' + results.length + ' checks passed. No live calls or messages.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => {
  if (server && server.exitCode == null) await new Promise(r => { server.once('exit', r); server.kill('SIGTERM'); });
  if (fake) await new Promise(r => fake.close(r));
  if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
});
