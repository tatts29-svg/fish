// Author: Andrew Fisher. Pre-renders the drawing's tile pyramid (transparent, no sheet white, no aerial underlay) with
// the explorer's own renderer (scene-worker.js in Chromium), level by level: device px per sheet pt = 2^L, 512 px tiles,
// empty tiles not written. Also renders arbitrary views for comparisons.
//   node render_tiles.cjs tiles <served root url> <underlay ids json file> <out dir> [levels]          -> <out>/L{L}/{tx}_{ty}.png + levels.json
//   node render_tiles.cjs views <served root url> <underlay ids json file> <out dir> <views.json>      -> <out>/<name>.png
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const [, , KIND, URLROOT, UNDER, OUT, EXTRA] = process.argv; const VT = 512, W = 2384, H = 1684;
const LEVELS = (KIND === 'tiles' && EXTRA ? EXTRA : '-0.75,-0.5,-0.25,0,0.25,0.5,0.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25').split(',').map(Number);
(async () => {
  const underlay = JSON.stringify(JSON.parse(fs.readFileSync(UNDER, 'utf8')));
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 800, height: 600}, deviceScaleFactor: 1})).newPage();
  page.on('pageerror', e => console.error('pageerror', e.message)); page.on('console', m => { if (m.type() === 'error') console.error('console', m.text()); });
  await page.goto(URLROOT + 'render.html?underlay=' + encodeURIComponent(underlay), {waitUntil: 'load', timeout: 120000});
  await page.waitForFunction(() => window.__ready || window.__error, null, {timeout: 180000});
  const err = await page.evaluate(() => window.__error); if (err) throw new Error('scene: ' + err);
  console.log('scene ready:', await page.evaluate(() => JSON.stringify({count: window.__count, sha: window.__meta.sha256.slice(0, 12)})));
  fs.mkdirSync(OUT, {recursive: true});
  if (KIND === 'views') {
    const views = JSON.parse(fs.readFileSync(EXTRA, 'utf8'));
    for (const v of views) {   // {name, x, y, w, h, px, mode, white}
      const scale = v.px / v.w, Wp = Math.round(v.w * scale), Hp = Math.round(v.h * scale);
      const b64 = await page.evaluate(({v, scale, Wp, Hp}) => renderView({x: v.x, y: v.y, w: v.w, h: v.h, scale}, Wp, Hp, v.mode || 'hybrid', !!v.white), {v, scale, Wp, Hp});
      fs.writeFileSync(path.join(OUT, v.name + '.png'), Buffer.from(b64 || '', 'base64')); console.log('view', v.name, Wp + 'x' + Hp, b64 ? 'drawn' : 'empty');
    }
  } else {
    const summary = [];
    for (const L of LEVELS) {
      const s = Math.pow(2, L), span = VT / s, nx = Math.ceil(W / span), ny = Math.ceil(H / span); const dir = path.join(OUT, 'L' + L); fs.mkdirSync(dir, {recursive: true});
      let written = 0, empty = 0; const t0 = Date.now();
      for (let ty = 0; ty < ny; ty++) {
        const row = await page.evaluate(async ({ty, nx, VT, s, span}) => { const out = [];
          for (let tx = 0; tx < nx; tx++) out.push(await renderView({x: tx * span, y: ty * span, w: span, h: span, scale: s}, VT, VT, 'hybrid', false));
          return out; }, {ty, nx, VT, s, span});
        row.forEach((b64, tx) => { if (!b64) { empty++; return; } fs.writeFileSync(path.join(dir, tx + '_' + ty + '.png'), Buffer.from(b64, 'base64')); written++; });
      }
      summary.push({L, scale: s, nx, ny, written, empty, ms: Date.now() - t0}); console.log('level', L, 'tiles', nx + 'x' + ny, 'written', written, 'empty', empty, 'ms', Date.now() - t0);
      fs.writeFileSync(path.join(OUT, 'levels.json'), JSON.stringify(summary, null, 1));
    }
  }
  await browser.close(); console.log('done');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
