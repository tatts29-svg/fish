// The Coates Way machine, run from a local folder for testing. Author: Andrew Fisher. Read only.
// Files in ROOT are served from disk (the work in progress); anything else (models, sounds, pictures) is fetched from the
// live machine by GET (toolchain/harness/curlfetch.js keeps a disk cache; GC500_CACHE moves it). Nothing is ever sent to it.
//
// Bound to a manifest (Codex's v8.09 release audit, gap 2): every file fetched from the live machine must be named in
// RIG_MANIFEST (default evidence/manifest_v809.json, the candidate union) and its bytes must match that descriptor's
// sha256 and size, or the page gets a 404 (a path the set does not have, as the live service would answer) or a 502
// (bytes that differ), and the run's errors say so. Files served from a folder named "work" are checked against the
// same descriptors. Every file served is logged with where it came from and its sha256: m.provenance, and appended as
// one JSON line per run to RIG_LOG when that is set.
//
//   const {openMachine} = require('./machine_rig');
//   const m = await openMachine({root: 'v8.09_coates_way_machine_DRAFT/work', W: 1440, H: 900, dpr: 1, mobile: false});
//   ... m.page (Playwright page), m.errors, then await m.close()
//
// or from the shell:  ROOT=<folder> OUT=<dir> [MOB=1] [DPR=2] node machine_rig.js   (opens, waits, screenshots three views)
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const {chromium} = require('playwright');
const LIVE = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/';
const MANIFEST_FILE = process.env.RIG_MANIFEST || path.join(__dirname, 'manifest_v809.json');
const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8')), DESC = new Map(MANIFEST.files.map(f => [f.path, f]));
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const TYPES = {html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json',
  glb: 'model/gltf-binary', bin: 'application/octet-stream', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', hdr: 'image/vnd.radiance', ktx2: 'image/ktx2',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4', mp4: 'video/mp4', webm: 'video/webm', woff2: 'font/woff2', wasm: 'application/wasm'};
function serve(root, log = [], problems = []) {
  const checkLocal = path.basename(root) === 'work', seen = new Set();
  const note = (rec, problem) => { const k = rec.path + '|' + rec.source; if (!seen.has(k)) { seen.add(k); log.push(rec); } if (problem && !problems.includes(problem)) problems.push(problem); };
  const srv = http.createServer(async (req, res) => {
    try {
      const u = decodeURIComponent(req.url.split('?')[0].replace(/^\/+/, '')) || 'index.html';
      if (u.includes('..')) { res.writeHead(400); return res.end(); }
      const f = path.join(root, u), ext = u.split('.').pop().toLowerCase(), d = DESC.get(u);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        const b = fs.readFileSync(f), h = sha256(b), match = !!d && d.sha256 === h && d.bytes === b.length;
        note({path: u, source: 'local', sha256: h, bytes: b.length, inManifest: !!d, match}, checkLocal && !match ? `rig: local ${u} is not the manifest's ${d ? 'bytes' : 'file'} (${MANIFEST.sha256.slice(0, 12)})` : null);
        res.writeHead(200, {'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store'}); return res.end(b);
      }
      if (req.method !== 'GET') { res.writeHead(405); return res.end(); } /* read only: nothing but GET ever leaves this rig */
      if (!d) { note({path: u, source: 'none', inManifest: false}, `rig: ${u} is not in the manifest ${MANIFEST.sha256.slice(0, 12)} (404)`); res.writeHead(404, {'cache-control': 'no-store'}); return res.end(); }
      const r = await curlFetch(LIVE + u + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''), {}, 'GET'), h = sha256(r.body);
      const match = r.status === 200 && h === d.sha256 && r.body.length === d.bytes;
      note({path: u, source: 'live', status: r.status, sha256: h, bytes: r.body.length, match}, match ? null : `rig: live ${u} answered ${r.status} with bytes ${h.slice(0, 12)} not the manifest's ${d.sha256.slice(0, 12)} (502)`);
      if (!match) { res.writeHead(502, {'cache-control': 'no-store'}); return res.end(); }
      res.writeHead(200, Object.assign({}, r.headers, {'content-type': d.type, 'cache-control': 'no-store'})); res.end(r.body);
    } catch (e) { res.writeHead(502); res.end(String(e)); }
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}
async function openMachine({root, W = 1440, H = 900, dpr = 1, mobile = false, query = ''}) {
  const provenance = [], errors = [];
  const srv = await serve(path.resolve(root), provenance, errors), port = srv.address().port;
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const ctx = await browser.newContext({viewport: {width: W, height: H}, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile});
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push('page: ' + String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
  await page.goto(`http://127.0.0.1:${port}/index.html${query}`, {waitUntil: 'domcontentloaded', timeout: 240000});
  return {page, errors, port, close: async () => { await browser.close(); srv.close(); }};
}
module.exports = {openMachine, serve};
if (require.main === module) (async () => {
  const mob = process.env.MOB === '1', m = await openMachine({root: process.env.ROOT, W: mob ? 390 : 1440, H: mob ? 844 : 900, dpr: +(process.env.DPR || (mob ? 2 : 1)), mobile: mob});
  const out = process.env.OUT; fs.mkdirSync(out, {recursive: true}); const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(25000); await m.page.screenshot({path: path.join(out, (mob ? 'phone' : 'desk') + '_car.png')});
  for (const v of ['V8 powertrain', 'The cockpit']) { await m.page.click(`text=${v}`).catch(() => {}); await wait(12000); await m.page.screenshot({path: path.join(out, (mob ? 'phone' : 'desk') + '_' + v.replace(/\W/g, '') + '.png')}); }
  console.log('errors', JSON.stringify(m.errors.slice(0, 10))); await m.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
