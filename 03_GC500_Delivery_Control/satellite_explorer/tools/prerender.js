// Pre-renders the drawing (no sheet white, no aerial underlay) as a transparent tile pyramid, level by level, with the
// same SVG renderer the viewer uses, in Chromium. Levels are device px per sheet pt: 2^L for L in the list. Tiles are
// 512 px; empty tiles are not written (the viewer treats a missing tile as empty). Output: explorer/assets/vt/L{L}/{tx}_{ty}.png
// plus vt/manifest.json.   node prerender.js https://localhost:8796/ [levels]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const URL = process.argv[2] || 'https://localhost:8796/'; const LEVELS = (process.argv[3] || '-0.75,-0.5,-0.25,0,0.25,0.5,0.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25').split(',').map(Number);
const OUT = path.join(__dirname, 'explorer', 'assets', 'vt'); const VT = 512, W = 2384, H = 1684;
(async () => {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + fs.readFileSync(path.join(__dirname, '..', 'spki.txt'), 'utf8').trim()]});
  const page = await (await browser.newContext({viewport: {width: 800, height: 600}, ignoreHTTPSErrors: true})).newPage();
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.goto(URL, {waitUntil: 'load', timeout: 120000}); await page.waitForFunction(() => window.__ready, null, {timeout: 120000});
  await page.evaluate(() => GC500Explorer.setMode('hybrid'));                       // the worker then renders without the underlay or the white
  const manifest = {tile: VT, levels: [], sheet: [W, H], note: 'transparent raster of the drawing\'s vectors, raster symbols and lettering; device px per sheet pt = 2^L'};
  for (const L of LEVELS) {
    const s = Math.pow(2, L), span = VT / s, nx = Math.ceil(W / span), ny = Math.ceil(H / span); fs.mkdirSync(path.join(OUT, 'L' + L), {recursive: true});
    let written = 0, empty = 0; const t0 = Date.now();
    for (let ty = 0; ty < ny; ty++) {
      const row = await page.evaluate(async ({L, ty, nx, VT, s, span}) => {
        const out = [];
        for (let tx = 0; tx < nx; tx++) {
          const view = {x: tx * span, y: ty * span, w: span, h: span, scale: s / (window.devicePixelRatio || 1)};
          const res = await svgFromWorker(view, VT, VT); if (!res.count) { out.push(null); continue; }
          const {img, url} = await loadSvg(res.svg).promise; const c = document.createElement('canvas'); c.width = VT; c.height = VT; c.getContext('2d').drawImage(img, 0, 0, VT, VT); URL.revokeObjectURL(url);
          const blob = await new Promise(r => c.toBlob(r, 'image/png')); out.push(await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(blob); }));
        }
        return out;
      }, {L, ty, nx, VT, s, span});
      row.forEach((b64, tx) => { if (!b64) { empty++; return; } fs.writeFileSync(path.join(OUT, 'L' + L, tx + '_' + ty + '.png'), Buffer.from(b64, 'base64')); written++; });
    }
    manifest.levels.push({L, scale: s, nx, ny, written, empty, ms: Date.now() - t0}); console.log('level', L, 'tiles', nx + 'x' + ny, 'written', written, 'empty', empty, 'ms', Date.now() - t0);
    fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  }
  await browser.close(); console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
