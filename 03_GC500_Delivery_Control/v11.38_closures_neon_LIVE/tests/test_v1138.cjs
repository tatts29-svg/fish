/* Author: Andrew Fisher. v11.38 checks: the Fence closures map's lines are thin neon strokes set onto the footpath side (the
   pink north of Main Beach Pde's north fence west of Gate 7, south of the south fence east of it, west of Breaker St's west
   fence; the orange east of Breaker St's east fence); the pink's west reach climbs the access path clear of the Esplanade
   compound; the Satellite button swaps the drawing for Esri imagery placed through the explorer's georeferencing with the
   lines on top and a credit, Plan brings the drawing back; the v11.36 handle, zoom and legend still there. GET only; the
   record is compared.
     PAGE=build/GC500_v11.38/GC500_Delivery_Control_hosted.html node tests/test_v1138.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#fenceclose', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#fenceclose', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForFunction(() => document.querySelector('#pane-fenceclose .c1136-map .c1136-svg'), null, {timeout: 60000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.38'));
  const card = await p.evaluate(() => { const c = document.querySelector('#pane-fenceclose .c1136-map'); const svg = c.querySelector('.c1136-svg'); const g = svg.querySelector('g.c1136-line');
   const w = cls => getComputedStyle(g.querySelector('path.' + cls)).strokeWidth;
   return {vb: svg.getAttribute('viewBox'), lines: svg.querySelectorAll('g.c1136-line').length, halo: w('halo'), glow: w('glow'), core: w('core'), ve: getComputedStyle(g.querySelector('path.core')).vectorEffect,
    buttons: [...c.querySelectorAll('[data-c1136-zoom],[data-c1136-base]')].map(b => b.dataset.c1136Zoom || b.dataset.c1136Base), planOn: c.querySelector('[data-c1136-base="plan"]').classList.contains('primary'), satOn: c.querySelector('[data-c1136-base="sat"]').classList.contains('primary'),
    creditHidden: c.querySelector('.c1136-credit').hidden, clip: !!svg.querySelector('clipPath#c1136clip path'), satGroup: !!svg.querySelector('g.sat g.satw[transform^="matrix("]'), sheetVis: getComputedStyle(svg.querySelector('.c1136-sheet')).visibility, base: ClosureMap1136.base, geo: !!(ClosureMap1136.GEO && ClosureMap1136.GEO.A && ClosureMap1136.GEO.Ai), legend: c.querySelectorAll('.c1136-legend li').length, noAgent: !/claude|codex|agent/i.test(c.textContent)}; });
  check('the card: nine lines as thin neon strokes (halo 7 px, glow 3 px, core 1.2 px, widths fixed on the screen), the zoom buttons, Plan on and Satellite off with the credit hidden, the satellite group placed by the georeferencing matrix and clipped, the drawing visible, legend of three, no agent names', card.lines === 9 && card.halo === '7px' && card.glow === '3px' && card.core === '1.2px' && card.ve === 'non-scaling-stroke' && card.buttons.join(',') === 'out,in,fit,plan,sat' && card.planOn && !card.satOn && card.creditHidden && card.clip && card.satGroup && card.sheetVis === 'visible' && card.base === 'plan' && card.geo && card.legend === 3 && card.noAgent, card);
  const L = await p.evaluate(() => ClosureMap1136.LINES.lines.map(l => ({colour: l.colour, name: l.name, pts: l.pts})));
  const by = n => L.filter(l => l.name.indexOf(n) >= 0)[0];
  const west = by('Gate 7'), east = by('Breaker St east'), loop = by('Gate 6 block');
  const xAt = (pts, y) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return NaN; };
  const northPart = west.pts.filter(q => q[0] > 250 && q[0] < 420), southPart = west.pts.filter(q => q[0] > 125 && q[0] < 185 && q[1] > 460 && q[1] < 480), breakerW = [520, 550, 580].map(y => [xAt(west.pts, y), y]), breakerE = [520, 550, 580].map(y => [xAt(east.pts, y), y]);
  const firstEast = loop.pts.findIndex(q => q[0] > 1700), lastEast = loop.pts.length - 1 - [...loop.pts].reverse().findIndex(q => q[0] > 1700);
  const climb = loop.pts.slice(0, firstEast).filter(q => q[1] > 321 && q[1] < 344), closing = loop.pts.slice(lastEast + 1).filter(q => q[1] > 320 && q[1] < 360);
  const mean = a => a.reduce((s, q) => s + q[1], 0) / a.length;
  check('the lines sit on the footpath side: the pink north of Main Beach Pde’s north fence (y below 449, mean below 446.5, between x 250 and 420), south of the south fence east of Gate 7 (y above 470.5), west of Breaker St’s west fence (x below 193.5); the orange east of the east fence (x above 218); the pink’s west reach climbs the access path between the compound and Meriton (x 1676 to 1684) and the loop closes down Meriton’s west edge (x 1683 to 1693)',
   northPart.length >= 4 && northPart.every(q => q[1] < 449) && mean(northPart) < 446.5 && southPart.length >= 1 && southPart.every(q => q[1] > 470.5) && breakerW.length >= 2 && breakerW.every(q => q[0] < 193.5) && breakerE.length >= 2 && breakerE.every(q => q[0] > 218) && climb.length >= 1 && climb.every(q => q[0] > 1676 && q[0] < 1684) && closing.length >= 1 && closing.every(q => q[0] > 1683 && q[0] < 1693),
   {northPart, southPart, breakerW, breakerE, climb, closing});
  const sat = await p.evaluate(() => new Promise(res => { const pane = document.getElementById('pane-fenceclose'), svg = pane.querySelector('.c1136-svg');
   pane.querySelector('[data-c1136-base="sat"]').click();
   const t0 = Date.now(); (function wait(){ const n = ClosureMap1136.satTiles().length; if (n > 0 || Date.now() - t0 > 8000) { const im = svg.querySelector('g.satw image'); res({base: ClosureMap1136.base, cls: svg.classList.contains('sat'), n, z: Number(svg.querySelector('g.satw').dataset.z), zoomFn: ClosureMap1136.satZoom(), hrefs: ClosureMap1136.satTiles().slice(0, 2), sheetVis: getComputedStyle(svg.querySelector('.c1136-sheet')).visibility, tilesVis: getComputedStyle(svg.querySelector('g.tiles')).visibility, credit: !pane.querySelector('.c1136-credit').hidden && /Esri/.test(pane.querySelector('.c1136-credit').textContent), satOn: pane.querySelector('[data-c1136-base="sat"]').classList.contains('primary'), planOn: pane.querySelector('[data-c1136-base="plan"]').classList.contains('primary'), linesAfter: svg.lastElementChild.classList.contains('lines'), first: im ? [im.getAttribute('x'), im.getAttribute('width')] : null}); } else setTimeout(wait, 200); })(); }));
  check('Satellite: the drawing and its tiles hidden, Esri World Imagery tiles placed under the lines at a zoom that fits the whole-plan view (15 to 17), the credit shown, the button states swapped, the lines the top layer', sat.base === 'sat' && sat.cls && sat.n > 0 && sat.n <= 120 && sat.z >= 15 && sat.z <= 17 && sat.z === sat.zoomFn && sat.hrefs.every(u => /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+$/.test(u)) && sat.sheetVis === 'hidden' && sat.tilesVis === 'hidden' && sat.credit && sat.satOn && !sat.planOn && sat.linesAfter, sat);
  const deep = await p.evaluate(() => new Promise(res => { const svg = document.querySelector('#pane-fenceclose .c1136-svg'); ClosureMap1136.setZoom(16000, 108, 461);
   const t0 = Date.now(); (function wait(){ const n = ClosureMap1136.satTiles().length; if (n > 0 && Number(svg.querySelector('g.satw').dataset.z) >= 20 || Date.now() - t0 > 8000) res({pct: ClosureMap1136.pct, z: Number(svg.querySelector('g.satw').dataset.z), n, w: svg.getAttribute('viewBox').split(' ')[2]}); else setTimeout(wait, 200); })(); }));
  check('16000% at the Gate 7 crossing on satellite: the view 15 pt wide, Esri tiles at zoom 21, only a handful of them', deep.pct === 16000 && deep.z === 21 && deep.n > 0 && deep.n <= 12 && Math.abs(Number(deep.w) - 2384 / 160) < 0.05, deep);
  await p.evaluate(() => { const c = document.querySelector('#pane-fenceclose .c1136-map'); c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_sat_gate7_16000_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.setZoom(1600, 1990, 330); });
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_sat_gate6_1600_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.fit(); });
  await p.waitForTimeout(3000);
  await p.screenshot({path: path.join(out, 'closures_sat_' + tag + '.png'), fullPage: false});
  const back = await p.evaluate(() => { const pane = document.getElementById('pane-fenceclose'), svg = pane.querySelector('.c1136-svg'); pane.querySelector('[data-c1136-base="plan"]').click();
   return {base: ClosureMap1136.base, cls: svg.classList.contains('sat'), n: ClosureMap1136.satTiles().length, creditHidden: pane.querySelector('.c1136-credit').hidden, sheetVis: getComputedStyle(svg.querySelector('.c1136-sheet')).visibility, planOn: pane.querySelector('[data-c1136-base="plan"]').classList.contains('primary')}; });
  check('Plan brings the drawing back and empties the satellite layer', back.base === 'plan' && !back.cls && back.n === 0 && back.creditHidden && back.sheetVis === 'visible' && back.planOn, back);
  await p.waitForTimeout(1200);
  await p.screenshot({path: path.join(out, 'closures_plan_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.setZoom(1600, 1990, 330); });
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_plan_gate6_1600_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.setZoom(2400, 200, 462); });
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_plan_gate7_2400_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.fit(); });
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1138.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
