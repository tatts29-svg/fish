/* Author: Andrew Fisher. v11.39 checks: the VMS removals tab carries a map under its head - the five boards in their own
   colours on Esri imagery, a dotted route from each board to where it goes with a sane distance (VMS 16 a few tens of metres
   to behind 2 Breaker St, VMS 15 to the T2 runoff, VMS 17 to T10, VMS 13 and 14 to Cypress Ave at the street), labels, tap
   targets, zoom and Fit, a legend with Navigate links; Friday morning is in the mornings and the tab opens on it before
   Saturday; the tiles arrive from Esri; record unchanged, no errors, no writes. GET only.
     PAGE=build/GC500_v11.39/GC500_Delivery_Control_hosted.html node tests/test_v1139.cjs      MOB=1 ...      LIVE=1 ... */
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
 const h = await open(MOB ? {pageFile, hash: '#vmsoff', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#vmsoff', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForFunction(() => document.querySelector('#pane-vmsoff .v1139-map .v1139-svg'), null, {timeout: 60000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.39'));
  const m = await p.evaluate(() => { const pane = document.getElementById('pane-vmsoff'), c = pane.querySelector('.v1139-map'), svg = c.querySelector('.v1139-svg');
   const items = VmsMap1139.items.map(i => ({pos: i.pos, colour: i.colour, from: i.from, spot: i.spot ? i.spot.name : null, approx: !!(i.spot && i.spot.approx), m: i.m, lat: i.lat, lon: i.lon, slat: i.spot && i.spot.lat, slon: i.spot && i.spot.lon}));
   return {afterHead: !!(c.previousElementSibling && c.previousElementSibling.classList.contains('v1132-head')), items, pins: svg.querySelectorAll('g.pins g.v1139-pin').length, spots: svg.querySelectorAll('g.pins g.v1139-spot').length, routes: [...svg.querySelectorAll('line.v1139-route')].map(l => l.getAttribute('stroke')), dash: getComputedStyle(svg.querySelector('line.v1139-route')).strokeDasharray, ve: getComputedStyle(svg.querySelector('line.v1139-route')).vectorEffect,
    navTargets: [...svg.querySelectorAll('[data-v1139-nav]')].map(x => x.dataset.v1139Nav), labels: [...svg.querySelectorAll('text.v1139-lbl')].map(t => t.textContent), legend: [...c.querySelectorAll('.v1139-legend li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), legendLinks: c.querySelectorAll('.v1139-legend a.btn').length, buttons: [...c.querySelectorAll('[data-v1139-zoom]')].map(b => b.dataset.v1139Zoom), pct: c.querySelector('[data-v1139-pct]').textContent, vb: svg.getAttribute('viewBox'), credit: /Esri/.test(c.textContent), noAgent: !/claude|codex|agent/i.test(c.textContent),
    mornings: VmsOff1132.MORNINGS.map(x => x.iso + ' ' + x.label), chosen: VmsOff1132.morning, chooser: [...pane.querySelectorAll('[data-v1132-morning]')].map(b => b.dataset.v1132Morning + (b.classList.contains('primary') ? '*' : ''))}; });
  const byPos = pos => m.items.filter(i => i.pos === pos)[0];
  check('the card sits under the head: five boards, each its own colour (13 red, 14 orange, 15 yellow, 16 cyan, 17 magenta), five solid pins, five spot squares, five dotted routes in the boards’ colours fixed on the screen, tap targets for every pin and spot, labels naming the board, its time and where it goes, a legend of five with ten Navigate links, zoom buttons, Fit, 100%, the imagery credit, no agent names',
   m.afterHead && m.items.length === 5 && ['13', '14', '15', '16', '17'].every(pos => byPos(pos) && byPos(pos).spot) && byPos('13').colour === '#ff3b3b' && byPos('14').colour === '#ff9f1a' && byPos('15').colour === '#ffe600' && byPos('16').colour === '#00e5ff' && byPos('17').colour === '#ff4fd8' && m.pins === 5 && m.spots === 5 && m.routes.length === 5 && m.routes.every((c, i) => m.items.some(x => x.colour === c)) && /7/.test(m.dash) && m.ve === 'non-scaling-stroke' && m.navTargets.length === 10 && m.labels.length === 10 && m.labels.some(t => /VMS 16\*? · from 03:00/.test(t)) && m.labels.some(t => /VMS 16\*? → behind 2 Breaker St/.test(t)) && m.legend.length === 5 && m.legendLinks === 10 && m.buttons.join(',') === 'out,in,fit' && m.pct === '100%' && m.credit && m.noAgent, m);
  check('where each board goes, with sane distances: VMS 16 behind 2 Breaker St within 60 m of the board; VMS 15 to the T2 runoff 100 to 400 m; VMS 17 to the T10 runoff 200 to 700 m; VMS 13 and 14 to Cypress Ave at the street (marked approximate) 1.2 to 2.5 km; VMS 13 and 15 not before 06:00, the others from 03:00',
   byPos('16').spot.indexOf('2 Breaker St') >= 0 && byPos('16').m > 5 && byPos('16').m < 60 && !byPos('16').approx && byPos('15').spot === 'T2 runoff' && byPos('15').m > 100 && byPos('15').m < 400 && !byPos('15').approx && byPos('17').spot === 'T10 runoff' && byPos('17').m > 200 && byPos('17').m < 700 && !byPos('17').approx && ['13', '14'].every(pos => /Cypress Ave/.test(byPos(pos).spot) && byPos(pos).approx && byPos(pos).m > 1200 && byPos(pos).m < 2500) && byPos('13').from === '06:00' && byPos('15').from === '06:00' && ['14', '16', '17'].every(pos => byPos(pos).from === '03:00') && m.legend.filter(t => /street only/.test(t)).length === 2, m.items);
  check('Friday morning is a removal morning ahead of Saturday, Sunday and Monday, and the tab opens on Friday 23 Oct on the day', m.mornings.length === 4 && m.mornings[0] === '2026-10-23 Friday morning' && m.mornings[1] === '2026-10-24 Saturday morning' && m.mornings[3].indexOf('2026-10-26') === 0 && m.chooser.length === 4 && m.chooser[0].indexOf('2026-10-23') === 0 && (new Date(Date.now() + 10 * 3600 * 1000).toISOString().slice(0, 10) !== '2026-10-23' || new Date(Date.now() + 10 * 3600 * 1000).getUTCHours() >= 12 || (m.chosen === '2026-10-23' && m.chooser[0] === '2026-10-23*')), {mornings: m.mornings, chosen: m.chosen, chooser: m.chooser});
  const sat = await p.evaluate(() => new Promise(res => { const svg = document.querySelector('#pane-vmsoff .v1139-svg'); const t0 = Date.now(); (function wait(){ const n = VmsMap1139.tiles().length; if (n > 0 || Date.now() - t0 > 8000) res({n, z: Number(svg.querySelector('g.sat').dataset.z), zoomFn: VmsMap1139.satZoom(), hrefs: VmsMap1139.tiles().slice(0, 2)}); else setTimeout(wait, 200); })(); }));
  check('the Esri imagery tiles are placed for the whole-map view at a zoom between 15 and 18', sat.n > 0 && sat.n <= 150 && sat.z >= 15 && sat.z <= 18 && sat.z === sat.zoomFn && sat.hrefs.every(u => /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+$/.test(u)), sat);
  const zoom = await p.evaluate(() => { const pane = document.getElementById('pane-vmsoff'), svg = pane.querySelector('.v1139-svg'); const w0 = Number(svg.getAttribute('viewBox').split(' ')[2]);
   pane.querySelector('[data-v1139-zoom="in"]').click(); pane.querySelector('[data-v1139-zoom="in"]').click(); const w1 = Number(svg.getAttribute('viewBox').split(' ')[2]), p1 = VmsMap1139.pct, r1 = Number(svg.querySelector('g.v1139-pin circle:nth-child(2)').getAttribute('r')), rr = Number(svg.querySelector('g.v1139-pin circle:nth-child(2)').getAttribute('r')) / w1;
   pane.querySelector('[data-v1139-zoom="fit"]').click(); const w2 = Number(svg.getAttribute('viewBox').split(' ')[2]), p2 = VmsMap1139.pct, r0 = Number(svg.querySelector('g.v1139-pin circle:nth-child(2)').getAttribute('r'));
   VmsMap1139.setZoom(1600, -27.9817267, 153.42943); const w3 = Number(svg.getAttribute('viewBox').split(' ')[2]), p3 = VmsMap1139.pct, z3 = VmsMap1139.satZoom();
   return {w0, w1, p1, w2, p2, w3, p3, z3, r1, r0, ratio: r0 / r1}; });
  check('zoom in twice gives 256% with the pins keeping their screen size (radius scaled with the view), Fit returns to 100%, 1600% on 2 Breaker St asks for zoom-20 imagery (the cap)', zoom.z3 === 20 && Math.abs(zoom.w1 - zoom.w0 / 2.56) < 0.5 && zoom.p1 === 256 && zoom.w2 === zoom.w0 && zoom.p2 === 100 && Math.abs(zoom.ratio - 2.56) < 0.05 && zoom.p3 === 1600 && zoom.z3 >= 20, zoom);
  await p.evaluate(() => { const c = document.querySelector('#pane-vmsoff .v1139-map'); c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(3000);
  await p.screenshot({path: path.join(out, 'vms_map_breaker_1600_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { VmsMap1139.fit(); });
  await p.waitForTimeout(3500);
  await p.screenshot({path: path.join(out, 'vms_map_' + tag + '.png'), fullPage: false});
  const bright = async (sel, file) => { const r = await p.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel); const f = path.join(out, file); await p.screenshot({path: f, clip: {x: r[0], y: r[1], width: r[2], height: Math.min(r[3], 900)}}); const o = require('child_process').execSync('python3 -c "from PIL import Image, ImageStat; im = Image.open(\'' + f + '\').convert(\'L\'); s = ImageStat.Stat(im); print(round(s.mean[0], 1), round(s.stddev[0], 1))"').toString().trim().split(' ').map(Number); return {mean: o[0], sd: o[1]}; };
  const vb = await bright('#pane-vmsoff .v1139-svg', 'vms_map_clip_' + tag + '.png');
  check('the VMS map really draws the imagery (the map area is neither dark nor flat)', vb.mean > 35 && vb.sd > 12, vb);
  await p.evaluate(() => go('fenceclose'));
  await p.waitForFunction(() => document.querySelector('#pane-fenceclose .c1136-svg'), null, {timeout: 60000});
  const cs = await p.evaluate(() => new Promise(res => { const pane = document.getElementById('pane-fenceclose'), svg = pane.querySelector('.c1136-svg'); pane.querySelector('[data-c1136-base="sat"]').click();
   setTimeout(() => { const im = svg.querySelector('g.satw image'); const bb = im ? im.getBoundingClientRect() : null, sr = svg.getBoundingClientRect(); res({n: ClosureMap1136.satTiles().length, so: ClosureMap1136.SO, first: im && [Number(im.getAttribute('x')), Number(im.getAttribute('y'))], bb: bb && [Math.round(bb.left - sr.left), Math.round(bb.top - sr.top), Math.round(bb.width)], svgW: Math.round(sr.width)}); }, 3500); }));
  const cb = await bright('#pane-fenceclose .c1136-svg', 'closures_sat_clip_' + tag + '.png');
  check('the closures map’s satellite layer is laid out from a local origin and really draws: the first tile sits within the map (not millions of pixels off), the map area neither dark nor flat', cs.n > 0 && cs.so && cs.so[0] > 1e8 && cs.first && Math.abs(cs.first[0]) < 20000 && Math.abs(cs.first[1]) < 20000 && cs.bb && Math.abs(cs.bb[0]) < 4 * cs.svgW && Math.abs(cs.bb[1]) < 4 * cs.svgW && cb.mean > 35 && cb.sd > 12, {cs, cb});
  await p.screenshot({path: path.join(out, 'closures_sat_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.setZoom(1600, 1990, 330); });
  await p.waitForTimeout(3500);
  await p.screenshot({path: path.join(out, 'closures_sat_gate6_1600_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { ClosureMap1136.setBase('plan'); ClosureMap1136.fit(); });
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1140_vms.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
