/* Author: Andrew Fisher. v11.36 checks: the Fence closures tab carries the closure lines on the 2026 plan in the card under the
   head: the sheet in an SVG, nine neon lines in three colours where the marked plan puts them (the pink crosses Main Beach Pde at
   Gate 7), zoom to 16000% with the explorer's tiles arriving at level 3, Fit, Open the Map explorer. GET only; the record is compared.
     PAGE=build/GC500_v11.36/GC500_Delivery_Control_hosted.html node tests/test_v1136.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
const near = (p, q, d) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= d;
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#fenceclose', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#fenceclose', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForFunction(() => document.querySelector('#pane-fenceclose .c1136-map .c1136-svg'), null, {timeout: 60000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.36'));
  const card = await p.evaluate(() => { const c = document.querySelector('#pane-fenceclose .c1136-map'); const svg = c.querySelector('.c1136-svg'); const img = svg.querySelector('image');
   const lines = [...svg.querySelectorAll('g.c1136-line')].map(g => ({colour: g.dataset.colour, title: g.querySelector('title').textContent, paths: [...g.querySelectorAll('path')].map(x => x.className.baseVal), d: g.querySelector('path.core').getAttribute('d').slice(0, 40)}));
   const r = svg.getBoundingClientRect();
   return {afterHead: !!(c.previousElementSibling && c.previousElementSibling.classList.contains('f1133-head')), sheetSrc: img.getAttribute('href'), vb: svg.getAttribute('viewBox'), w: r.width, hgt: r.height, lines,
    legend: [...c.querySelectorAll('.c1136-legend li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), dots: c.querySelectorAll('.c1136-legend .clodot').length, buttons: [...c.querySelectorAll('[data-c1136-zoom]')].map(b => b.dataset.c1136Zoom), go: !!c.querySelector('[data-c1136-go="map"]'), pct: c.querySelector('[data-c1136-pct]').textContent,
    noNumbers: ![...c.querySelectorAll('.c1136-legend li')].some(li => /(?<!Gate )\b[1-7]\b/.test(li.textContent)), noAgent: !/claude|codex|agent/i.test(c.textContent), text: c.textContent.slice(0, 2000)}; });
  const cols = card.lines.map(l => l.colour);
  check('the card sits under the head: the 2026 sheet in an SVG at the whole-sheet view, nine lines (3 pink, 2 teal, 4 orange) each with halo, glow and core strokes, zoom buttons, Fit, 100%, Open the Map explorer', card.afterHead && /sheet-overview\.webp$/.test(card.sheetSrc) && card.vb.split(' ')[2] === '2384' && Math.abs(Number(card.vb.split(' ')[1])) < 2 && Math.abs(card.hgt / card.w - 1684 / 2384) < 0.02 && card.lines.length === 9 && cols.filter(c => c === 'pink').length === 3 && cols.filter(c => c === 'teal').length === 2 && cols.filter(c => c === 'orange').length === 4 && card.lines.every(l => l.paths.join(',') === 'halo,glow,core' && /^M\d/.test(l.d)) && card.buttons.join(',') === 'out,in,fit' && card.go && card.pct === '100%', card);
  check('the legend lists the three colours with their places, no mark numbers, no agent names', card.legend.length === 3 && card.dots === 3 && card.noNumbers && card.noAgent && /Gate 6 block/.test(card.legend[0]) && /Gate 7/.test(card.legend[0]) && /Cable Beach/.test(card.legend[1]) && /Higman/.test(card.legend[1]) && /Madison Point/.test(card.legend[2]) && /Hill Pde/.test(card.legend[2]), card.legend);
  const L = await p.evaluate(() => ClosureMap1136.LINES.lines.map(l => ({colour: l.colour, name: l.name, n: l.pts.length, first: l.pts[0], last: l.pts[l.pts.length - 1], xs: [Math.min(...l.pts.map(q => q[0])), Math.max(...l.pts.map(q => q[0]))], ys: [Math.min(...l.pts.map(q => q[1])), Math.max(...l.pts.map(q => q[1]))], pts: l.pts})));
  const by = n => L.filter(l => new RegExp(n).test(l.name))[0];
  const loop = by('Gate 6 block'), north = by('Esplanade north'), west = by('Gate 7'), cable = by('Cable St'), mustang = by('Higman'), river = by('Madison Point'), east = by('Breaker St east'), hillW = by('Hill Pde west'), brW = by('south of Gate 8');
  const crossing = west && west.pts.some((q, i) => i && Math.abs(q[0] - west.pts[i - 1][0]) < 2 && Math.abs(q[1] - west.pts[i - 1][1]) > 12 && q[0] < 115);
  check('the lines run where the marked plan puts them: the pink loop round the Gate 6 block (Esplanade, Ocean Ave, Surfers Paradise Blvd, the diagonal) with its reach west along the Esplanade; the pink Esplanade north side Gate 6 to Gate 5A; the pink Main Beach Pde line crossing at Gate 7 and ending at Gate 8; teal round Cable Beach to Pacific St and along Main Beach Pde at Mustang past Higman St; orange from the chicane to Madison Point and down Ferny Ave, and both sides of Breaker St, Serisier Ave and Hill Pde',
   loop && loop.xs[0] < 1575 && loop.xs[1] > 2025 && loop.ys[0] > 295 && loop.ys[1] < 430 && near(loop.first, [1566, 347], 6) && near(loop.last, [1690, 316], 8)
   && north && north.xs[0] <= 1702 && north.xs[1] >= 2298 && north.ys[0] > 240 && north.ys[1] < 296
   && west && near(west.first, [452, 444], 6) && near(west.last, [194, 628], 6) && crossing && west.ys[0] > 438 && west.ys[1] < 632
   && cable && near(cable.first, [453, 458], 6) && near(cable.last, [326, 613], 4) && cable.xs[1] < 472
   && mustang && near(mustang.first, [1338, 388], 6) && near(mustang.last, [1782, 421], 6) && mustang.ys[0] > 378
   && river && near(river.first, [772, 374], 6) && near(river.last, [1496, 485], 6)
   && east && near(east.first, [228, 469], 8) && east.ys[1] > 940 && east.xs[1] > 300 && hillW && hillW.ys[1] > 940 && brW && near(brW.first, [193, 636], 6) && brW.ys[1] > 825
   && L.every(l => l.pts.every(q => q[0] >= 0 && q[0] <= 2384 && q[1] >= 0 && q[1] <= 1684)), L.map(l => [l.colour, l.name.slice(0, 30), l.n, l.first, l.last]));
  const zoom = await p.evaluate(() => new Promise(res => { const pane = document.getElementById('pane-fenceclose'), svg = pane.querySelector('.c1136-svg'); const vb = () => svg.getAttribute('viewBox').split(' ').map(Number);
   pane.querySelector('[data-c1136-zoom="in"]').click(); pane.querySelector('[data-c1136-zoom="in"]').click(); const w1 = vb()[2], p1 = ClosureMap1136.pct;
   pane.querySelector('[data-c1136-zoom="fit"]').click(); const w2 = vb()[2], p2 = ClosureMap1136.pct;
   ClosureMap1136.setZoom(16000, 108, 461); const w3 = vb()[2], p3 = ClosureMap1136.pct, lvl = ClosureMap1136.level(), b = ClosureMap1136.box();
   const t0 = Date.now(); (function wait(){ const n = ClosureMap1136.tiles(); if (n > 0 || Date.now() - t0 > 12000) res({w1, p1, w2, p2, w3, p3, lvl, tiles: n, b, overflow: document.documentElement.scrollWidth - window.innerWidth, hrefs: [...svg.querySelectorAll('g.tiles image')].slice(0, 2).map(i => i.getAttribute('href').slice(0, 5))}); else setTimeout(wait, 250); })(); }));
  check('zoom in twice gives 256% (the view 2.56 times narrower), Fit returns to 100%, 16000% at Gate 7 shows a 15 pt wide view at tile level 3 with the explorer tiles arriving as blobs; no horizontal overflow', Math.abs(zoom.w1 - 2384 / 2.56) < 0.5 && zoom.p1 === 256 && zoom.w2 === 2384 && zoom.p2 === 100 && Math.abs(zoom.w3 - 2384 / 160) < 0.05 && zoom.p3 === 16000 && zoom.lvl === 3 && zoom.tiles > 0 && zoom.hrefs.every(s => s === 'blob:') && Math.abs(zoom.b.x + zoom.b.w / 2 - 108) < 0.5 && zoom.overflow <= 1, zoom);
  await p.evaluate(() => { const c = document.querySelector('#pane-fenceclose .c1136-map'); c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(1200);
  await p.screenshot({path: path.join(out, 'closures_lines_gate7_16000_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.setZoom(1600, 1990, 330); });
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'closures_lines_gate6_1600_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.fit(); });
  await p.waitForTimeout(800);
  await p.screenshot({path: path.join(out, 'closures_lines_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1136.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
