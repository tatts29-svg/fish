// The Coates Way machine, run from a local folder for testing. Author: Andrew Fisher. Read only.
// Files in ROOT are served from disk (the work in progress); anything else (models, sounds, pictures) is fetched once
// from the live machine by GET and cached. Nothing is ever sent to the live service.
//
//   const {openMachine} = require('./machine_rig');
//   const m = await openMachine({root: 'v8.08_coates_way_machine_DRAFT/work', W: 1440, H: 900, dpr: 1, mobile: false});
//   ... m.page (Playwright page), m.errors, then await m.close()
//
// or from the shell:  ROOT=<folder> OUT=<dir> [MOB=1] [DPR=2] node machine_rig.js   (opens, waits, screenshots three views)
const http = require('http'), fs = require('fs'), path = require('path');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const {chromium} = require('playwright');
const LIVE = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/';
const TYPES = {html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json',
  glb: 'model/gltf-binary', bin: 'application/octet-stream', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', hdr: 'image/vnd.radiance', ktx2: 'image/ktx2',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4', mp4: 'video/mp4', webm: 'video/webm', woff2: 'font/woff2', wasm: 'application/wasm'};
function serve(root) {
  const srv = http.createServer(async (req, res) => {
    try {
      const u = decodeURIComponent(req.url.split('?')[0].replace(/^\/+/, '')) || 'index.html';
      if (u.includes('..')) { res.writeHead(400); return res.end(); }
      const f = path.join(root, u), ext = u.split('.').pop().toLowerCase();
      if (fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, {'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store'}); return res.end(fs.readFileSync(f)); }
      if (req.method !== 'GET') { res.writeHead(405); return res.end(); } /* read only: nothing but GET ever leaves this rig */
      const r = await curlFetch(LIVE + u + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''), {}, 'GET');
      res.writeHead(r.status, Object.assign({}, r.headers, {'cache-control': 'no-store'})); res.end(r.body);
    } catch (e) { res.writeHead(502); res.end(String(e)); }
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}
async function openMachine({root, W = 1440, H = 900, dpr = 1, mobile = false, query = ''}) {
  const srv = await serve(path.resolve(root)), port = srv.address().port;
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
