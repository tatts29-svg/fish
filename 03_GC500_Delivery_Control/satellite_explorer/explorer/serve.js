// preview stand-in: serves the explorer folder over https and mocks /api/map-key by asking the live dashboard
// service for its answer (the token reaches the page over localhost only; nothing is written to disk)
const https = require('https'), fs = require('fs'), path = require('path');
const DIR = process.argv[4] ? require('path').resolve(process.argv[4]) : __dirname, PORT = +process.argv[2] || 8796, KEYDIR = process.argv[3] || path.join(DIR, '..', '..');
const CT = {html: 'text/html; charset=utf-8', js: 'text/javascript', json: 'application/json', gz: 'application/octet-stream', bin: 'application/octet-stream', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', css: 'text/css'};
function liveKey(cb) {
  const req = https.request({host: 'gc500-production.up.railway.app', path: '/api/map-key', headers: {'x-gc500-token': 'Coates-GC500-2026'}}, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => cb(r.statusCode, b)); });
  req.on('error', e => cb(502, JSON.stringify({error: String(e)}))); req.end();
}
https.createServer({key: fs.readFileSync(path.join(KEYDIR, 'localhost.key')), cert: fs.readFileSync(path.join(KEYDIR, 'localhost.crt'))}, (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/api/map-key') return liveKey((c, b) => { res.writeHead(c, {'content-type': 'application/json', 'cache-control': 'no-store'}); res.end(b); });
  const f = path.join(DIR, p === '/' ? 'index.html' : p);
  if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  const size = fs.statSync(f).size, ct = CT[path.extname(f).slice(1)] || 'application/octet-stream', m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  if (m) { const a = +m[1], b = m[2] ? Math.min(+m[2], size - 1) : size - 1; if (a > b || a >= size) { res.writeHead(416, {'content-range': 'bytes */' + size}); return res.end(); }
    res.writeHead(206, {'content-type': ct, 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': b - a + 1, 'accept-ranges': 'bytes', 'cache-control': 'no-cache'}); return fs.createReadStream(f, {start: a, end: b}).pipe(res); }
  res.writeHead(200, {'content-type': ct, 'content-length': size, 'accept-ranges': 'bytes', 'cache-control': 'no-cache'});
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('explorer preview on https://localhost:' + PORT + '/'));
