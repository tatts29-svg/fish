// Author: Andrew Fisher. A small static file server with HTTP Range support, for rendering and testing the Map explorer's
// assets locally (the explorer fetches its tiles by byte range). Read-only; nothing here talks to the live service.
//   node serve_static.cjs <root dir> <port>
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2] || '.'), PORT = +(process.argv[3] || 8891);
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.bin': 'application/octet-stream', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8'};
http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]); const fp = path.join(ROOT, u);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  const size = fs.statSync(fp).size, type = TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream';
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  if (range) { const a = +range[1], b = range[2] ? Math.min(+range[2], size - 1) : size - 1;
    res.writeHead(206, {'content-type': type, 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': b - a + 1, 'accept-ranges': 'bytes', 'cache-control': 'no-store'});
    fs.createReadStream(fp, {start: a, end: b}).pipe(res); return; }
  res.writeHead(200, {'content-type': type, 'content-length': size, 'accept-ranges': 'bytes', 'cache-control': 'no-store'}); fs.createReadStream(fp).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log('serving', ROOT, 'on', PORT));
