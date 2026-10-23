/* Author: Andrew Fisher. v11.50 checks: the Fence closures map draws the lines lifted off the marked plan of 23 Oct 2026 as
   one bright colour - a solid core on a dark edge, no glow or filter - in straight runs; the line is 16 pt wide on the
   plan at the fit view and never more than 14 px on the screen as the view zooms; the runs cover the marked streets; the
   Plan / Satellite switch, the 16000% zoom and the legend of one. GET only; the record is compared. Screenshots for Andrew.
     PAGE=build/GC500_v11.50/GC500_Delivery_Control_hosted.html node tests/test_v1150.cjs      MOB=1 ...      LIVE=1 ... */
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
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.50'));
  const card = await p.evaluate(() => { const c = document.querySelector('#pane-fenceclose .c1136-map'); const svg = c.querySelector('.c1136-svg'); const gs = [...svg.querySelectorAll('g.c1136-line')];
   const cs = el => getComputedStyle(el); const core = gs[0].querySelector('path.core'), edge = gs[0].querySelector('path.edge');
   const vb = svg.getAttribute('viewBox').split(' ').map(Number), pxPerPt = svg.clientWidth / vb[2];
   return {lines: gs.length, parts: gs.every(g => g.children.length === 3 && g.querySelector('path.edge') && g.querySelector('path.core') && g.querySelector('title')), noGlow: !svg.querySelector('path.halo, path.glow') && !/filter/.test(svg.innerHTML),
    coreStroke: cs(core).stroke, edgeStroke: cs(edge).stroke, coreW: parseFloat(cs(core).strokeWidth), edgeW: parseFloat(cs(edge).strokeWidth), corePx: parseFloat(cs(core).strokeWidth) * pxPerPt, cap: cs(core).strokeLinecap, join: cs(core).strokeLinejoin, ve: cs(core).vectorEffect,
    sameColour: gs.every(g => cs(g.querySelector('path.core')).stroke === cs(core).stroke), vb, pct: ClosureMap1136.pct, lw: ClosureMap1136.lineWidth(),
    buttons: [...c.querySelectorAll('[data-c1136-zoom],[data-c1136-base]')].map(b => b.dataset.c1136Zoom || b.dataset.c1136Base), planOn: c.querySelector('[data-c1136-base="plan"]').classList.contains('primary'), legend: c.querySelectorAll('.c1136-legend li').length, dot: c.querySelector('.c1136-legend .clodot.one') ? cs(c.querySelector('.c1136-legend .clodot.one')).backgroundColor : null,
    sub: (c.querySelector('p.sub') || {}).textContent || '', noAgent: !/claude|codex|agent/i.test(c.textContent), noColours: !/pink|teal|orange/i.test(c.querySelector('.c1136-legend').textContent)}; });
  check('the card: one bright colour on every line (core #ff1fd4 on a dark edge), a solid line with no halo, glow or filter, round caps and joins, the width the engine sets (16 pt on the plan on a desktop, 4 px on the screen on a phone), the zoom and base buttons, Plan on, a legend of one with the dot in the same colour, no colour names, no agent names',
   card.lines >= 12 && card.parts && card.noGlow && card.coreStroke === 'rgb(255, 31, 212)' && card.edgeStroke === 'rgb(58, 0, 48)' && Math.abs(card.coreW - card.lw) < 0.05 && card.coreW >= 15.99 && card.edgeW > card.coreW * 1.3 && card.corePx <= 14.2 && card.corePx >= 3.9 && card.cap === 'round' && card.join === 'round' && card.ve !== 'non-scaling-stroke' && card.sameColour && card.pct === 100 && card.buttons.join(',') === 'out,in,fit,plan,sat' && card.planOn && card.legend === 1 && card.dot === 'rgb(255, 31, 212)' && /one bright colour/.test(card.sub) && /23 Oct 2026/.test(card.sub) && card.noAgent && card.noColours, card);
  const L = await p.evaluate(() => ClosureMap1136.LINES.lines.map(l => ({name: l.name, pts: l.pts})));
  const len = l => l.pts.slice(1).reduce((s, q, k) => s + Math.hypot(q[0] - l.pts[k][0], q[1] - l.pts[k][1]), 0);
  const total = L.reduce((s, l) => s + len(l), 0), verts = L.reduce((s, l) => s + l.pts.length, 0);
  const minSeg = Math.min(...L.flatMap(l => l.pts.slice(1).map((q, k) => Math.hypot(q[0] - l.pts[k][0], q[1] - l.pts[k][1]))));
  const near = (x, y, r) => L.some(l => l.pts.some(q => Math.hypot(q[0] - x, q[1] - y) <= r) || l.pts.slice(1).some((q, k) => { const a = l.pts[k], dx = q[0] - a[0], dy = q[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy)) <= r; }));
  const streets = {'Main Beach Pde at Narrowneck (S18)': [1421, 384], 'Main Beach Pde west (S21)': [568, 420], 'the Esplanade': [1869, 292], 'Ocean Ave down to Surfers Paradise Blvd': [2003, 483], 'Ferny Ave diagonal': [1424, 441], 'Breaker St': [192, 560], 'Pacific St / Cable Beach': [330, 618], 'Hill Pde': [291, 860], 'Helen Park': [254, 964], 'Madison Point': [1177, 375], 'Serisier Ave': [227, 770]};
  const miss = Object.keys(streets).filter(k => !near(streets[k][0], streets[k][1], 12));
  check('the lines are straight runs that cover the marked streets: few vertices for their length (under 2.2 per 100 pt), no segment shorter than 5 pt, about 5,000 to 5,600 pt in all, and a line within 12 pt of eleven named spots read off the marked plan',
   verts / (total / 100) < 2.2 && minSeg >= 5 && total > 4900 && total < 5700 && miss.length === 0, {verts, total: Math.round(total), minSeg: Math.round(minSeg * 10) / 10, miss, lines: L.length});
  const zoomed = await p.evaluate(() => { ClosureMap1136.setZoom(400, 1870, 300); const svg = document.querySelector('#pane-fenceclose .c1136-svg'); const core = svg.querySelector('g.c1136-line path.core'); const vb = svg.getAttribute('viewBox').split(' ').map(Number); const pxPerPt = svg.clientWidth / vb[2]; const w = parseFloat(getComputedStyle(core).strokeWidth);
   return {pct: ClosureMap1136.pct, w, px: w * pxPerPt, lw: ClosureMap1136.lineWidth()}; });
  check('at 400% the line is held between 4 and 14 px on the screen (14 px on a desktop: its plan width falls), the same width the engine reports', zoomed.pct === 400 && zoomed.px <= 14.2 && zoomed.px >= 3.9 && Math.abs(zoomed.w - zoomed.lw) < 0.05, zoomed);
  await p.evaluate(() => { const c = document.querySelector('#pane-fenceclose .c1136-map'); c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_plan_esplanade_400_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.setZoom(400, 230, 560); }); await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_plan_breaker_400_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.setZoom(250, 1000, 380); }); await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_plan_mainbeach_250_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.fit(); }); await p.waitForTimeout(3000);
  await p.screenshot({path: path.join(out, 'closures_plan_fit_' + tag + '.png'), fullPage: false});
  const sat = await p.evaluate(() => new Promise(res => { const pane = document.getElementById('pane-fenceclose'), svg = pane.querySelector('.c1136-svg');
   pane.querySelector('[data-c1136-base="sat"]').click();
   const t0 = Date.now(); (function wait(){ const n = ClosureMap1136.satTiles().length; if (n > 0 || Date.now() - t0 > 8000) res({base: ClosureMap1136.base, cls: svg.classList.contains('sat'), n, z: Number(svg.querySelector('g.satw').dataset.z), credit: !pane.querySelector('.c1136-credit').hidden && /Esri/.test(pane.querySelector('.c1136-credit').textContent), linesAfter: svg.lastElementChild.classList.contains('lines'), edgeOp: getComputedStyle(svg.querySelector('g.c1136-line path.edge')).opacity}); else setTimeout(wait, 200); })(); }));
  check('Satellite: Esri tiles under the lines at the fit zoom (15 to 17), the credit shown, the lines the top layer with the dark edge stronger on imagery', sat.base === 'sat' && sat.cls && sat.n > 0 && sat.z >= 15 && sat.z <= 17 && sat.credit && sat.linesAfter && Number(sat.edgeOp) >= 0.65, sat);
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_sat_fit_' + tag + '.png'), fullPage: false});
  const deep = await p.evaluate(() => new Promise(res => { const svg = document.querySelector('#pane-fenceclose .c1136-svg'); ClosureMap1136.setZoom(1600, 1870, 300);
   const t0 = Date.now(); (function wait(){ const n = ClosureMap1136.satTiles().length; if ((n > 0 && Number(svg.querySelector('g.satw').dataset.z) >= 19) || Date.now() - t0 > 8000) { const core = svg.querySelector('g.c1136-line path.core'); const vb = svg.getAttribute('viewBox').split(' ').map(Number); res({pct: ClosureMap1136.pct, z: Number(svg.querySelector('g.satw').dataset.z), n, px: parseFloat(getComputedStyle(core).strokeWidth) * svg.clientWidth / vb[2]}); } else setTimeout(wait, 200); })(); }));
  check('1600% on satellite at the Esplanade: Esri tiles at zoom 19 or 20, the line still 14 px on the screen', deep.pct === 1600 && deep.z >= 19 && deep.z <= 20 && deep.n > 0 && Math.abs(deep.px - 14) < 0.6, deep);
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_sat_esplanade_1600_' + tag + '.png'), fullPage: false});
  const top = await p.evaluate(() => new Promise(res => { const svg = document.querySelector('#pane-fenceclose .c1136-svg'); ClosureMap1136.setZoom(16000, 192, 560);
   const t0 = Date.now(); (function wait(){ const n = ClosureMap1136.satTiles().length; if ((n > 0 && Number(svg.querySelector('g.satw').dataset.z) >= 20) || Date.now() - t0 > 8000) res({pct: ClosureMap1136.pct, z: Number(svg.querySelector('g.satw').dataset.z), n, w: svg.getAttribute('viewBox').split(' ')[2]}); else setTimeout(wait, 200); })(); }));
  check('16000% on Breaker St on satellite: the view 15 pt wide, Esri tiles at zoom 20 (the sharpest real imagery), a couple of dozen at most', top.pct === 16000 && top.z === 20 && top.n > 0 && top.n <= 24 && Math.abs(Number(top.w) - 2384 / 160) < 0.05, top);
  const back = await p.evaluate(() => { const pane = document.getElementById('pane-fenceclose'), svg = pane.querySelector('.c1136-svg'); ClosureMap1136.fit(); pane.querySelector('[data-c1136-base="plan"]').click();
   return {base: ClosureMap1136.base, cls: svg.classList.contains('sat'), n: ClosureMap1136.satTiles().length, creditHidden: pane.querySelector('.c1136-credit').hidden, pct: ClosureMap1136.pct}; });
  check('Plan brings the drawing back and empties the satellite layer', back.base === 'plan' && !back.cls && back.n === 0 && back.creditHidden && back.pct === 100, back);
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1150.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
