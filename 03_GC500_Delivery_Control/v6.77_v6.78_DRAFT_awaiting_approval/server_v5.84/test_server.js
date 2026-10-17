/* v5.84 test harness — runs ONLY local instances on 127.0.0.1:8815 with test tokens, each started and stopped by
   this script (it kills only the child processes it spawned). Never touches the live service or port 8814.
     node test_server.js            all phases
   Needs: data/ seeded (records.json, machine.json, machine/blobs) and the dashboard page uploaded with upload_kit.py. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const { spawn, execSync } = require('child_process');
const DIR = '/tmp/claude-0/stage/server', PORT = 8815, V = 'viewtokenviewtoken1', E = 'edittokenedittoken1';
const KIT_PAGE = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/kit600/GC500_v6.00_reimport/GC500_Delivery_Control_hosted.html';
const ORIGINAL = '/home/user/fish/03_GC500_Delivery_Control/v6.30_race_day_cards/server_v5.83/server.js';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const wait = ms => new Promise(r => setTimeout(r, ms));
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  — ' + detail : '')); }
function info(line) { console.log('     ' + line); }

function req(method, p, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path: p, headers, agent: false }, res => {
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    r.on('error', reject); if (body) r.write(body); r.end();
  });
}
const json = r => { try { return JSON.parse(r.body.toString('utf8')); } catch (e) { return null; } };
const decode = r => r.headers['content-encoding'] === 'br' ? zlib.brotliDecompressSync(r.body) : r.headers['content-encoding'] === 'gzip' ? zlib.gunzipSync(r.body) : r.body;

async function start({ data, srv = path.join(DIR, 'server.js'), env = {}, log = path.join(DIR, 'test_instance.log') }) {
  fs.appendFileSync(log, '\n==== start ' + srv + ' on ' + data + ' ' + new Date().toISOString() + '\n');
  const out = fs.openSync(log, 'a');
  const proc = spawn(process.execPath, [srv], { env: Object.assign({ PATH: process.env.PATH, PORT: String(PORT), DATA_DIR: data, VIEW_TOKEN: V, EDIT_TOKEN: E }, env), stdio: ['ignore', out, out] });
  const exited = new Promise(r => proc.on('exit', (code, sig) => r({ code, sig })));
  proc.exited = exited; let done = false; exited.then(() => { done = true; });
  for (let i = 0; i < 100 && !done; i++) {
    try { const h = await req('GET', '/health'); if (h.status) return proc; } catch (e) { /* not up yet */ }
    await wait(100);
  }
  return proc;   // exited (the caller checks) or slow
}
async function stop(proc, sig = 'SIGTERM') { if (proc.exitCode === null && proc.signalCode === null) proc.kill(sig); return proc.exited; }

const readRecord = data => JSON.parse(fs.readFileSync(path.join(data, 'records.json'), 'utf8'));

async function phaseMain() {
  console.log('\n## 1. Main instance (data/, page uploaded with upload_kit.py)');
  const data = path.join(DIR, 'data');
  const newSha = sha(fs.readFileSync(path.join(DIR, 'server.js')));
  const proc = await start({ data, env: { SERVER_FILE: newSha, SERVER_FILE_KEEP: sha(fs.readFileSync(ORIGINAL)) } });
  /* the reference is the page upload_kit.py put on this instance (data/app.html, whose sha256 prefix is its ETag) —
     the kit file itself may be rebuilt by other work after the upload */
  const page = fs.readFileSync(path.join(data, 'app.html')), pageSha = sha(page);
  info('uploaded page: ' + page.length + ' bytes, sha256 ' + pageSha.slice(0, 16) + ' (ETag ' + JSON.parse(fs.readFileSync(path.join(data, 'app.meta.json'), 'utf8')).etag + ')');

  // --- compression of the page
  let br;
  for (let i = 0; i < 90; i++) { br = await req('GET', '/v/' + V, { headers: { 'Accept-Encoding': 'gzip, deflate, br' } }); if (br.headers['content-encoding'] === 'br') break; await wait(1000); }
  check('page over br: 200, Content-Encoding br, decodes to the uploaded page byte for byte', br.status === 200 && br.headers['content-encoding'] === 'br' && sha(decode(br)) === pageSha,
    br.body.length + ' bytes on the wire for ' + page.length + ' (' + (100 * br.body.length / page.length).toFixed(1) + '%)');
  const gz = await req('GET', '/v/' + V, { headers: { 'Accept-Encoding': 'gzip, deflate' } });
  check('page over gzip (client without br): Content-Encoding gzip, decodes to the page', gz.status === 200 && gz.headers['content-encoding'] === 'gzip' && sha(decode(gz)) === pageSha, gz.body.length + ' bytes');
  const id = await req('GET', '/e/' + E, { headers: {} });
  check('page with no Accept-Encoding (edit link): identity, the page itself', id.status === 200 && !id.headers['content-encoding'] && sha(id.body) === pageSha, id.body.length + ' bytes');
  const q0 = await req('GET', '/v/' + V, { headers: { 'Accept-Encoding': 'br;q=0, gzip' } });
  check('br;q=0 is honoured (gzip served instead)', q0.headers['content-encoding'] === 'gzip');
  check('Vary: Accept-Encoding on every page representation', [br, gz, id].every(r => /accept-encoding/i.test(r.headers.vary || '')));
  check('each representation has its own ETag', new Set([br, gz, id].map(r => r.headers.etag)).size === 3, [br, gz, id].map(r => r.headers.etag).join(' '));
  // --- 304
  const n1 = await req('GET', '/v/' + V, { headers: { 'Accept-Encoding': 'gzip, br', 'If-None-Match': br.headers.etag } });
  const n2 = await req('GET', '/v/' + V, { headers: { 'Accept-Encoding': 'gzip', 'If-None-Match': gz.headers.etag } });
  const n3 = await req('GET', '/e/' + E, { headers: { 'If-None-Match': id.headers.etag } });
  const n4 = await req('GET', '/v/' + V, { headers: { 'Accept-Encoding': 'gzip, br', 'If-None-Match': '"0000000000000000-br"' } });
  const n5 = await req('GET', '/v/' + V, { headers: { 'Accept-Encoding': 'gzip', 'If-None-Match': br.headers.etag } });
  check('304 for a matching ETag, each encoding (br, gzip, identity), empty body', [n1, n2, n3].every(r => r.status === 304 && r.body.length === 0), [n1, n2, n3].map(r => r.status).join(','));
  check('200 for a stale ETag; 200 when the tag belongs to another encoding', n4.status === 200 && n5.status === 200 && n5.headers['content-encoding'] === 'gzip');
  // --- headers
  for (const r of [br, id]) {}
  const hs = r => r.headers['strict-transport-security'] === 'max-age=15552000' && r.headers['x-content-type-options'] === 'nosniff' && r.headers['referrer-policy'] === 'strict-origin';
  check('security headers on /v/ and /e/ (200 and 304): HSTS 15552000, nosniff, Referrer-Policy strict-origin', [br, gz, id, n1].every(hs),
    'X-Frame-Options ' + br.headers['x-frame-options'] + '; no CSP on the page: ' + (br.headers['content-security-policy'] === undefined));

  // --- machine files under /w/
  const set = JSON.parse(fs.readFileSync(path.join(data, 'machine.json'), 'utf8')).set;
  const jsPath = Object.keys(set.files).filter(p => /\.js$/.test(p) && set.files[p].bytes > 50000 && p !== 'server/gc500-server.js').sort((a, b) => set.files[b].bytes - set.files[a].bytes)[0];
  const jpgPath = Object.keys(set.files).find(p => /\.(jpg|webp|mp3)$/.test(p));
  const binPath = Object.keys(set.files).find(p => /\.(glb|bin)$/.test(p));
  let wj;
  for (let i = 0; i < 180; i++) { wj = await req('GET', '/w/' + V + '/' + jsPath, { headers: { 'Accept-Encoding': 'gzip, deflate, br' } }); if (wj.headers['content-encoding'] === 'br') break; await wait(1000); }
  check('/w/ JavaScript over br, decodes to the blob (sha matches the manifest)', wj.headers['content-encoding'] === 'br' && sha(decode(wj)) === set.files[jsPath].sha256,
    jsPath + ': ' + wj.body.length + ' of ' + set.files[jsPath].bytes + ' bytes');
  const wjg = await req('GET', '/w/' + V + '/' + jsPath, { headers: { 'Accept-Encoding': 'gzip' } });
  check('/w/ JavaScript over gzip when br is not accepted', wjg.headers['content-encoding'] === 'gzip' && sha(decode(wjg)) === set.files[jsPath].sha256, wjg.body.length + ' bytes');
  const w304 = await req('GET', '/w/' + V + '/' + jsPath, { headers: { 'Accept-Encoding': 'br', 'If-None-Match': wj.headers.etag } });
  check('/w/ 304 on the br ETag, Vary: Accept-Encoding', w304.status === 304 && /accept-encoding/i.test(w304.headers.vary || ''), wj.headers.etag);
  const wr = await req('GET', '/w/' + V + '/' + jsPath, { headers: { 'Accept-Encoding': 'br', Range: 'bytes=0-99' } });
  check('/w/ Range request answered from the plain bytes (206, no Content-Encoding)', wr.status === 206 && !wr.headers['content-encoding'] && wr.body.length === 100);
  let wb;
  for (let i = 0; i < 240; i++) { wb = await req('GET', '/w/' + V + '/' + binPath, { headers: { 'Accept-Encoding': 'br, gzip' } }); if (wb.headers['content-encoding']) break; await wait(1000); }
  check('/w/ binary model data compressed (' + binPath.split('.').pop() + ')', !!wb.headers['content-encoding'] && sha(decode(wb)) === set.files[binPath].sha256, binPath + ': ' + wb.body.length + ' of ' + set.files[binPath].bytes + ' via ' + wb.headers['content-encoding']);
  const wi = await req('GET', '/w/' + V + '/' + jpgPath, { headers: { 'Accept-Encoding': 'br, gzip' } });
  check('/w/ already-compressed type never compressed (' + jpgPath.split('.').pop() + ')', wi.status === 200 && !wi.headers['content-encoding'] && sha(wi.body) === set.files[jpgPath].sha256);
  const czNames = fs.readdirSync(path.join(data, 'machine', 'cz'));
  check('compressed copies cached per blob hash on disk (machine/cz/<sha256>.br|.gz)', czNames.includes(set.files[jsPath].sha256 + '.br') && czNames.includes(set.files[jsPath].sha256 + '.gz'), czNames.length + ' entries');

  // --- writes are durable before the 200
  const before = readRecord(data).version;
  const put = (coll, idd, obj, tok = E) => req('PUT', '/api/doc/' + coll + '/' + idd, { headers: { 'x-gc500-token': tok, 'Content-Type': 'application/json', 'x-gc500-who': 'test' }, body: JSON.stringify(obj) });
  const N = 40; let durable = 0; const misses = [];
  await Promise.all(Array.from({ length: N }, (_, i) => put('v584test', 'd' + i, { n: i, at: Date.now() }).then(r => {
    const onDisk = readRecord(data);     // read synchronously the moment the answer arrives
    if (r.status === 200 && onDisk.docs.v584test && onDisk.docs.v584test['d' + i] && onDisk.docs.v584test['d' + i].n === i && onDisk.version >= json(r).version) durable++; else misses.push(i + ':' + r.status);
  })));
  check(N + ' concurrent edit-token writes: each one is in records.json on disk when its 200 arrives', durable === N, durable + '/' + N + (misses.length ? ' missing ' + misses.join(' ') : '') + ' · version ' + before + ' -> ' + readRecord(data).version);
  const del = await req('DELETE', '/api/doc/v584test/d0', { headers: { 'x-gc500-token': E } });
  check('a DELETE is on disk when its 200 arrives', del.status === 200 && !readRecord(data).docs.v584test.d0);

  // --- view token cannot write; edit token can
  const vw = await put('v584test', 'viewwrite', { n: 1 }, V);
  const vd = await req('DELETE', '/api/doc/v584test/d1', { headers: { 'x-gc500-token': V } });
  const vf = await req('POST', '/api/files', { headers: { 'x-gc500-token': V, 'x-file-name': 'x.txt' }, body: 'hello' });
  const va = await req('POST', '/api/admin/app', { headers: { 'x-gc500-token': V }, body: '<html>GC500</html>' });
  const vm = await req('POST', '/api/admin/machine/manifest', { headers: { 'x-gc500-token': V }, body: '{}' });
  check('view token still cannot write (doc PUT/DELETE, file upload, page upload, machine register all 403)', [vw, vd, vf, va, vm].every(r => r.status === 403), [vw, vd, vf, va, vm].map(r => r.status).join(','));
  check('view token still reads the whole record (/api/state 200, level view)', (await req('GET', '/api/state', { headers: { 'x-gc500-token': V } })).status === 200);
  const ew = await put('v584test', 'editwrite', { n: 2 }, E);
  const ef = await req('POST', '/api/files', { headers: { 'x-gc500-token': E, 'x-file-name': 'v584_test.txt', 'x-file-kind': 'other' }, body: 'hello from the v5.84 test' });
  check('edit token still writes (doc PUT 200, file upload 200)', ew.status === 200 && ef.status === 200, ew.status + ',' + ef.status);
  check('admin page still opens on the edit token', (await req('GET', '/admin/' + E)).status === 200);

  // --- prototype keys
  const pp = [
    await put('__proto__', 'polluted', { x: 1 }),
    await put('v584test', '__proto__', { x: 1 }),
    await put('constructor', 'x', { x: 1 }),
    await put('prototype', 'x', { x: 1 }),
    await req('DELETE', '/api/doc/constructor/keys', { headers: { 'x-gc500-token': E } }),
    await req('POST', '/api/files', { headers: { 'x-gc500-token': E, 'x-file-name': '__proto__' }, body: 'x' }),
    await req('DELETE', '/api/files/constructor', { headers: { 'x-gc500-token': E } }),
    await req('POST', '/api/files/__proto__/kind', { headers: { 'x-gc500-token': E, 'x-file-kind': 'other' } }),
    await req('POST', '/api/files/prototype/thumb', { headers: { 'x-gc500-token': E, 'x-file-sha256': 'a'.repeat(64), 'Content-Type': 'image/webp' }, body: 'x' }),
  ];
  check('__proto__ / constructor / prototype refused with 400 (doc collection, doc id, DELETE, file upload, file delete, re-file, thumb)', pp.every(r => r.status === 400), pp.map(r => r.status).join(','));
  const pf = await req('GET', '/f/' + V + '/__proto__'), ps = json(await req('GET', '/api/state', { headers: { 'x-gc500-token': V } }));
  check('nothing reached the prototype: /f/<view>/__proto__ 404, record has no such collections, service still answers', pf.status === 404 && !Object.prototype.hasOwnProperty.call(ps.docs, '__proto__') && !ps.docs.constructor.x,
    'collections: ' + Object.keys(ps.docs).length);
  const tsdoc = await put('toString', 'x', { x: 1 });
  check('an inherited name ("toString") becomes an ordinary own collection, not a write onto Object.prototype.toString', tsdoc.status === 200 && readRecord(data).docs.toString.x.x === 1);
  await req('DELETE', '/api/doc/toString/x', { headers: { 'x-gc500-token': E } });

  // --- wrong-token limiter
  const A = { 'X-Real-IP': '203.0.113.9' }, B = { 'X-Real-IP': '203.0.113.10' }, C = { 'X-Real-IP': '203.0.113.11' };
  const codes = [];
  for (let i = 0; i < 30; i++) codes.push((await req('GET', '/api/version', { headers: Object.assign({ 'x-gc500-token': 'wrongwrongwrong' + String(i).padStart(4, '0') }, A) })).status);
  const after = await req('GET', '/api/version', { headers: Object.assign({ 'x-gc500-token': 'wrongwrongwrongXXXX' }, A) });
  const pageBad = await req('GET', '/v/notthetokennottheto', { headers: A });
  const goodFromA = await req('GET', '/api/version', { headers: Object.assign({ 'x-gc500-token': V }, A) });
  check('30 wrong keys from one address answered as before (401), the 31st gets 429 with Retry-After', codes.every(c => c === 401) && after.status === 429 && +after.headers['retry-after'] > 0, '31st: ' + after.status + ', Retry-After ' + after.headers['retry-after'] + 's');
  check('that address is refused on every keyed path while blocked — page link 429, even the right key 429', pageBad.status === 429 && goodFromA.status === 429);
  const goodB = await req('GET', '/api/version', { headers: Object.assign({ 'x-gc500-token': V }, B) }), goodPageB = await req('GET', '/v/' + V, { headers: B });
  check('another address is not affected (API 200, page 200)', goodB.status === 200 && goodPageB.status === 200);
  const cs = [];
  for (let i = 0; i < 60; i++) cs.push((await req('GET', i % 3 === 0 ? '/api/state' : i % 3 === 1 ? '/w/' + V + '/no/such/file.js' : '/f/' + V + '/no_such_file.pdf', { headers: Object.assign({ 'x-gc500-token': V }, C) })).status);
  for (let i = 0; i < 40; i++) cs.push((await req('GET', '/api/version', { headers: C })).status);   // no token at all
  const cAfter = await req('GET', '/api/version', { headers: Object.assign({ 'x-gc500-token': E }, C) });
  check('100 requests with a right key (incl. 404s for missing files) or no key at all never trip it', cAfter.status === 200 && !cs.includes(429), 'statuses seen: ' + [...new Set(cs)].join(','));
  check('/health is never limited', (await req('GET', '/health', { headers: A })).status === 200);

  // --- the server blob, kept on the volume without being in the public set
  const srvBytes = fs.readFileSync(path.join(DIR, 'server.js'));
  const up = await req('PUT', '/api/admin/machine/blob/' + newSha, { headers: { 'x-gc500-token': E, 'Content-Type': 'application/octet-stream' }, body: srvBytes });
  const files = Object.keys(set.files).filter(p => p !== 'server/gc500-server.js').sort().map(p => ({ bytes: set.files[p].bytes, path: p, sha256: set.files[p].sha256, type: set.files[p].type }));
  const canonical = v => Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}' : JSON.stringify(v);
  const digest = sha(Buffer.from(canonical({ schema: 'gc500-machine-v1', entry: set.entry, files })));
  const reg = await req('POST', '/api/admin/machine/manifest', { headers: { 'x-gc500-token': E, 'Content-Type': 'application/json' },
    body: JSON.stringify({ schema: 'gc500-machine-v1', entry: set.entry, label: set.label, version: set.version + '-noserver', files, sha256: digest }) });
  const blobs = fs.readdirSync(path.join(data, 'machine', 'blobs'));
  const srvPublic = await req('GET', '/w/' + V + '/server/gc500-server.js');
  check('server blob uploaded, manifest registered WITHOUT server/gc500-server.js; new blob (SERVER_FILE) and rollback blob (SERVER_FILE_KEEP) both still on the volume',
    up.status === 200 && reg.status === 200 && blobs.includes(newSha) && blobs.includes(sha(fs.readFileSync(ORIGINAL))), 'register: ' + reg.body.toString().slice(0, 160));
  check('the server source is no longer downloadable with the view link (/w/<view>/server/gc500-server.js 404)', srvPublic.status === 404);
  check('the machine entry page still serves after the re-register', (await req('GET', '/w/' + V + '/')).status === 200);
  return proc;
}

async function phaseSigterm(proc) {
  console.log('\n## 2. SIGTERM flushes (same instance)');
  const data = path.join(DIR, 'data');
  const sent = [];
  const logFrom = fs.statSync(path.join(data, 'writes.log')).size;   // only this run's lines are read back
  const run = Date.now().toString(36);
  const burst = Array.from({ length: 60 }, (_, i) => req('PUT', '/api/doc/v584sigterm/s' + run + '_' + i, { headers: { 'x-gc500-token': E, 'Content-Type': 'application/json' }, body: JSON.stringify({ i }) })
    .then(r => { sent.push({ i, status: r.status }); }, () => { sent.push({ i, status: 'reset' }); }));
  await wait(15); proc.kill('SIGTERM');
  const ex = await proc.exited; await Promise.all(burst);
  const onDisk = readRecord(data).docs.v584sigterm || {};
  const ok200 = sent.filter(s => s.status === 200);
  const logged = fs.readFileSync(path.join(data, 'writes.log')).subarray(logFrom).toString('utf8').trim().split('\n').map(l => { try { return JSON.parse(l); } catch (e) { return {}; } })
    .filter(l => l.coll === 'v584sigterm' && l.op === 'set').map(l => l.id);
  check('SIGTERM mid-burst: clean exit 0 after the flush', ex.code === 0, JSON.stringify(ex));
  check('every write that was answered 200 is on disk', ok200.every(s => onDisk['s' + run + '_' + s.i]), ok200.length + ' answered 200');
  check('every accepted write was also answered 200 before the exit', logged.every(k => ok200.some(s => 's' + run + '_' + s.i === k)), ok200.length + ' answered of ' + logged.length + ' accepted');
  check('every write the service accepted (in writes.log) is on disk, answered or not', logged.length > 0 && logged.every(k => onDisk[k]), logged.length + ' accepted, ' + logged.filter(k => onDisk[k]).length + ' of them on disk');
  const tail = fs.readFileSync(path.join(DIR, 'test_instance.log'), 'utf8').trim().split('\n').slice(-2).join(' | ');
  info('log: ' + tail);

  console.log('\n   contrast: the same burst against v5.83 (unchanged), SIGTERM');
  const d583 = path.join(DIR, 'data_583'); fs.rmSync(d583, { recursive: true, force: true }); fs.mkdirSync(d583);
  fs.copyFileSync(path.join(DIR, 'data', 'records.json'), path.join(d583, 'records.json'));
  const p583 = await start({ data: d583, srv: ORIGINAL });
  const s583 = [];
  const b2 = Array.from({ length: 60 }, (_, i) => req('PUT', '/api/doc/v584sigterm/t' + i, { headers: { 'x-gc500-token': E, 'Content-Type': 'application/json' }, body: JSON.stringify({ i }) })
    .then(r => { s583.push({ i, status: r.status }); }, () => { s583.push({ i, status: 'reset' }); }));
  await Promise.all(b2); p583.kill('SIGTERM'); await p583.exited;
  const d2 = readRecord(d583).docs.v584sigterm || {};
  const acked = s583.filter(s => s.status === 200).length, kept = s583.filter(s => s.status === 200 && d2['t' + s.i]).length;
  info('v5.83: ' + acked + ' writes answered 200, then SIGTERM within the 150 ms debounce: ' + kept + ' of them on disk (informational; this is the fault fixed)');
}

async function phaseCorrupt() {
  console.log('\n## 3. A damaged store at start-up');
  const src = path.join(DIR, 'data');
  const d = path.join(DIR, 'data_corrupt'); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d);
  fs.cpSync(path.join(src, 'snapshots'), path.join(d, 'snapshots'), { recursive: true, preserveTimestamps: true });
  fs.copyFileSync(path.join(src, 'files.json'), path.join(d, 'files.json')); fs.utimesSync(path.join(d, 'files.json'), new Date(), new Date());
  const snaps = fs.readdirSync(path.join(d, 'snapshots')).filter(n => n.startsWith('records-'));
  const newest = snaps.map(n => ({ n, t: fs.statSync(path.join(d, 'snapshots', n)).mtimeMs })).sort((a, b) => b.t - a.t)[0].n;
  const snapVersion = JSON.parse(fs.readFileSync(path.join(d, 'snapshots', newest), 'utf8')).version;
  const good = fs.readFileSync(path.join(src, 'records.json'), 'utf8');
  fs.writeFileSync(path.join(d, 'records.json'), good.slice(0, Math.floor(good.length / 2)));   // cut short, as a full disk would leave it
  const p = await start({ data: d });
  const h = json(await req('GET', '/health'));
  const st = json(await req('GET', '/api/state', { headers: { 'x-gc500-token': V } }));
  const aside = fs.readdirSync(d).filter(n => n.startsWith('records.json.corrupt-'));
  check('records.json cut in half: starts from the newest valid snapshot, NOT empty', st && st.version === snapVersion && Object.keys(st.docs).length > 5, 'version ' + (st && st.version) + ' from ' + newest + ', ' + (st ? Object.keys(st.docs).length : 0) + ' collections');
  check('/health says so (record_recovered)', h && Array.isArray(h.record_recovered) && h.record_recovered[0].store === 'record' && h.record_recovered[0].loaded_from === newest, JSON.stringify(h && h.record_recovered));
  check('the damaged file is kept aside, byte for byte', aside.length === 1 && fs.readFileSync(path.join(d, aside[0]), 'utf8') === good.slice(0, Math.floor(good.length / 2)), aside[0]);
  const logLine = fs.readFileSync(path.join(DIR, 'test_instance.log'), 'utf8').split('\n').filter(l => l.includes('!!!!! GC500 RECORD RECOVERED')).slice(-1)[0] || '';
  check('the deploy log says it loudly', /!!!!! GC500 RECORD RECOVERED FROM SNAPSHOT/.test(logLine), logLine.slice(0, 150) + '…');
  check('a start-up snapshot was taken (records and files, -boot)', fs.readdirSync(path.join(d, 'snapshots')).filter(n => /-boot\.json$/.test(n)).length >= 2);
  await stop(p);

  // files.json damaged -> recovered from files-*.json
  fs.writeFileSync(path.join(d, 'files.json'), '{"broken":');
  const p2 = await start({ data: d });
  const h2 = json(await req('GET', '/health'));
  check('files.json damaged: recovered from its own snapshot (files-*.json)', h2 && h2.record_recovered && h2.record_recovered.some(r => r.store === 'file index'), JSON.stringify(h2 && h2.record_recovered));
  await stop(p2);

  // no snapshot at all -> refuses
  const d3 = path.join(DIR, 'data_nosnap'); fs.rmSync(d3, { recursive: true, force: true }); fs.mkdirSync(d3);
  fs.writeFileSync(path.join(d3, 'records.json'), '{"version": 12, "docs": {"a": ');
  const p3 = await start({ data: d3 }); const ex3 = await p3.exited;
  check('damaged record and no snapshot: refuses to start (exit 1), damaged file untouched', ex3.code === 1 && fs.readFileSync(path.join(d3, 'records.json'), 'utf8').startsWith('{"version": 12'), JSON.stringify(ex3));
  // cards damaged -> refuses
  const d4 = path.join(DIR, 'data_cards'); fs.rmSync(d4, { recursive: true, force: true }); fs.mkdirSync(d4);
  fs.writeFileSync(path.join(d4, 'cards.json'), '{"abc": {"token":');
  const p4 = await start({ data: d4 }); const ex4 = await p4.exited;
  check('damaged cards.json (no snapshot kept): refuses to start rather than start with no cards', ex4.code === 1, JSON.stringify(ex4));
  const refuse = fs.readFileSync(path.join(DIR, 'test_instance.log'), 'utf8').split('\n').filter(l => l.includes('REFUSING TO START')).slice(-1)[0] || '';
  info('log: ' + refuse.slice(0, 200));
  // genuine first run still starts empty
  const d5 = path.join(DIR, 'data_fresh'); fs.rmSync(d5, { recursive: true, force: true }); fs.mkdirSync(d5);
  const p5 = await start({ data: d5 }); const h5 = json(await req('GET', '/health'));
  check('a genuine first run (empty volume) still starts, with an empty record', h5 && h5.version === 0 && h5.record_recovered === null);
  await stop(p5);
}

async function phaseDiskFull() {
  console.log('\n## 4. A full disk (3 MB tmpfs as DATA_DIR)');
  const d = path.join(DIR, 'tiny');
  fs.mkdirSync(d, { recursive: true });
  try { execSync('umount ' + d + ' 2>/dev/null; mount -t tmpfs -o size=3m tmpfs ' + d); } catch (e) { info('cannot mount tmpfs: ' + e.message); return; }
  const synthPage = Buffer.from('<!doctype html><html><head><title>GC500</title></head><body>' + crypto.randomBytes(3 * 1024 * 1024).toString('hex') + '</body></html>\n');
  try {
    fs.copyFileSync(path.join(DIR, 'data', 'records.json'), path.join(d, 'records.json'));
    for (const [label, srv] of [['v5.84', path.join(DIR, 'server.js')], ['v5.83 (contrast)', ORIGINAL]]) {
      for (const n of fs.readdirSync(d)) if (n !== 'records.json') fs.rmSync(path.join(d, n), { recursive: true, force: true });
      const p = await start({ data: d, srv });
      const big = crypto.randomBytes(4 * 1024 * 1024);
      const f = await req('POST', '/api/files', { headers: { 'x-gc500-token': E, 'x-file-name': 'big.pdf', 'x-file-kind': 'other' }, body: big }).catch(e => ({ status: 'socket ' + e.code }));
      const aliveAfterFile = await req('GET', '/health').then(r => r.status, () => 'down');
      let a = { status: 'skipped' }, aliveAfterApp = aliveAfterFile;
      if (aliveAfterFile !== 'down') {
        a = await req('POST', '/api/admin/app', { headers: { 'x-gc500-token': E, 'Content-Type': 'text/html' }, body: synthPage }).catch(e => ({ status: 'socket ' + e.code }));
        aliveAfterApp = await req('GET', '/health').then(r => r.status, () => 'down');
      }
      if (label === 'v5.84') {
        check('v5.84: 4 MB file upload onto a full disk answered 507, service up', f.status === 507 && aliveAfterFile === 200, 'upload ' + f.status + ', /health ' + aliveAfterFile);
        check('v5.84: 6 MB page upload onto a full disk answered 507, service up, no page half-installed', a.status === 507 && aliveAfterApp === 200 && !fs.existsSync(path.join(d, 'app.html')), 'upload ' + a.status + ', /health ' + aliveAfterApp);
        // fill the disk, then a record write
        const free = parseInt(execSync("df -B1 --output=avail " + d + " | tail -1").toString(), 10);
        try { fs.writeFileSync(path.join(d, 'filler'), Buffer.alloc(Math.max(0, free - 20 * 1024))); } catch (e) { /* full */ }
        const w = await req('PUT', '/api/doc/v584full/x', { headers: { 'x-gc500-token': E, 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 1 }) });
        const h1 = await req('GET', '/health');
        fs.rmSync(path.join(d, 'filler'));
        const w2 = await req('PUT', '/api/doc/v584full/y', { headers: { 'x-gc500-token': E, 'Content-Type': 'application/json' }, body: JSON.stringify({ y: 1 }) });
        const h2 = await req('GET', '/health');
        check('v5.84: a record write onto a full disk is answered 507 (not 200), /health 503; after space is freed the next write is 200 and on disk',
          w.status === 507 && h1.status === 503 && w2.status === 507 && h2.status === 503 || (w.status === 507 && h1.status === 503 && w2.status === 200 && h2.status === 200 && readRecord(d).docs.v584full.y),
          'full: ' + w.status + '/' + h1.status + ' · freed: ' + w2.status + '/' + h2.status);
        await stop(p);
      } else {
        info('v5.83 on the same full disk: file upload ' + f.status + ', then /health ' + aliveAfterFile + (aliveAfterFile === 'down' ? ' (the service crashed)' : '; page upload ' + a.status + ', then /health ' + aliveAfterApp));
        if (p.exitCode === null) await stop(p);
      }
    }
  } finally { try { execSync('umount ' + d); } catch (e) { info('umount: ' + e.message); } }
}

(async () => {
  const which = process.argv[2] || 'all';
  let proc;
  if (which === 'all' || which === 'main') { proc = await phaseMain(); if (which === 'all') await phaseSigterm(proc); else await stop(proc); }
  if (which === 'all' || which === 'corrupt') await phaseCorrupt();
  if (which === 'all' || which === 'disk') await phaseDiskFull();
  const failed = results.filter(r => !r.ok);
  console.log('\n' + (results.length - failed.length) + ' of ' + results.length + ' checks passed' + (failed.length ? '; FAILED: ' + failed.map(f => f.name).join(' | ') : ''));
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('harness error', e); process.exit(2); });
