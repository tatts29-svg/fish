/* Author: Andrew Fisher. v11.44 checks: the removals map and the "Where it is" maps are drawn in the plan's frame - east
   (the beach) at the top, south (Surfers Paradise) to the right - with the imagery placed through the georeferencing from a
   local origin and really drawing; pins, routes and spots where they were; zoom, Fit and the finder's zoom land on the same
   points in the new frame; record unchanged, no errors, no writes. GET only.
     PAGE=build/GC500_v11.44/GC500_Delivery_Control_hosted.html node tests/test_v1144.cjs      MOB=1 ...      LIVE=1 ... */
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
 const bright = async (sel, file) => { const r = await p.evaluate(s => { const e = document.querySelector(s); e.scrollIntoView({block: 'start'}); const b = e.getBoundingClientRect(); const y = Math.max(0, b.top); return [Math.max(0, b.left), y, Math.min(b.width, window.innerWidth - Math.max(0, b.left)), Math.min(b.bottom, window.innerHeight) - y]; }, sel); const f = path.join(out, file); await p.waitForTimeout(400); await p.screenshot({path: f, clip: {x: r[0], y: r[1], width: Math.max(10, r[2]), height: Math.max(10, r[3])}}); const o = require('child_process').execSync('python3 -c "from PIL import Image, ImageStat; im = Image.open(\'' + f + '\').convert(\'L\'); s = ImageStat.Stat(im); print(round(s.mean[0], 1), round(s.stddev[0], 1))"').toString().trim().split(' ').map(Number); return {mean: o[0], sd: o[1]}; };
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForFunction(() => document.querySelector('#pane-vmsoff .v1139-map .v1139-svg') && window.VmsMap1139 && VmsMap1139.pt, null, {timeout: 60000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.44'));
  const fr = await p.evaluate(() => { const a = VmsMap1139.pt(-27.9818, 153.4291), e = VmsMap1139.pt(-27.9818, 153.4311), s = VmsMap1139.pt(-27.9838, 153.4291); const b = SatMap1141.pt(-27.9818, 153.4291), be = SatMap1141.pt(-27.9818, 153.4311);
   return {east: {dx: e[0] - a[0], dy: e[1] - a[1]}, south: {dx: s[0] - a[0], dy: s[1] - a[1]}, same: Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(e[0] - be[0]) < 1e-6, gate7: VmsMap1139.pt(-27.981102, 153.429085)}; });
  check('the plan’s frame: a point 200 m east (toward the beach) sits higher on the map, a point 220 m south sits to the right, both maps share the fit, and the Gate 7 crossing lands at its sheet point (108, 461) within 2 pt', fr.east.dy < -200 && Math.abs(fr.east.dx) < 15 && fr.south.dx > 200 && Math.abs(fr.south.dy) < 15 && fr.same && Math.abs(fr.gate7[0] - 108) < 2 && Math.abs(fr.gate7[1] - 461) < 2, fr);
  const vm = await p.evaluate(() => new Promise(res => { const svg = document.querySelector('#pane-vmsoff .v1139-svg'); const t0 = Date.now(); (function w(){ const n = VmsMap1139.tiles().length; if (n > 0 || Date.now() - t0 > 8000) { const im = svg.querySelector('g.satw image'), sr = svg.getBoundingClientRect(), bb = im ? im.getBoundingClientRect() : null; const pin16 = svg.querySelector('g.v1139-pin circle:nth-child(2)'); const items = VmsMap1139.items;
   const i16 = items.find(i => i.pos === '16'); res({n, z: Number(svg.querySelector('g.satw').dataset.z), tf: svg.querySelector('g.satw').getAttribute('transform').slice(0, 7), first: im && [Number(im.getAttribute('x')), Number(im.getAttribute('y'))], bbIn: bb && Math.abs(bb.left - sr.left) < 4 * sr.width && Math.abs(bb.top - sr.top) < 4 * sr.width, pins: svg.querySelectorAll('g.v1139-pin').length, routes: svg.querySelectorAll('line.v1139-route').length, spotAbove: i16 && i16.sp && i16.sp[1] < i16.bp[1], m16: i16 && i16.m}); } else setTimeout(w, 200); })(); }));
  check('the removals map: imagery placed through the matrix from a local origin (tile coordinates small, the first tile within the map), five pins and five routes, VMS 16’s spot behind 2 Breaker St above its board (east is up), 29 m', vm.n > 0 && vm.tf === 'matrix(' && vm.first && Math.abs(vm.first[0]) < 30000 && Math.abs(vm.first[1]) < 30000 && vm.bbIn && vm.pins === 5 && vm.routes === 5 && vm.spotAbove && vm.m16 > 5 && vm.m16 < 60, vm);
  await p.evaluate(() => { document.querySelector('#pane-vmsoff .v1139-map').scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(3000);
  const vb = await bright('#pane-vmsoff .v1139-svg', 'vms_map_planup_clip_' + tag + '.png');
  check('the removals map really draws the imagery', vb.mean > 35 && vb.sd > 12, vb);
  await p.screenshot({path: path.join(out, 'vms_map_planup_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => go('map'));
  await p.waitForFunction(() => document.querySelector('#pane-map .s1141-map[data-s1141="map"] .s1141-svg'), null, {timeout: 60000});
  await p.waitForTimeout(1500);
  const wm = await p.evaluate(() => new Promise(res => { const t0 = Date.now(); (function w(){ const n = SatMap1141.tiles('map').length; if (n > 0 || Date.now() - t0 > 8000) { const M = SatMap1141.maps.map; const b = M.items; const v01 = b.find(i => i.id === '01'), v10 = b.find(i => i.id === '10'), g25 = b.find(i => i.id === 'GN25'); const p01 = SatMap1141.pt(v01.lat, v01.lon), p10 = SatMap1141.pt(v10.lat, v10.lon);
   const svg = M.svg(); res({n, z: SatMap1141.satZoom('map'), pins: svg.querySelectorAll('g.s1141-pin').length, items: b.length, southRight: p10[0] > p01[0] + 1000, gn25none: g25 && !Number.isFinite(g25.lat), tf: svg.querySelector('g.satw').getAttribute('transform').slice(0, 7)}); } else setTimeout(w, 200); })(); }));
  check('the "Where it is" map under the explorer: 41 pins of 42 references, tiles placed through the matrix, VMS 10 (Old Burleigh Rd, south) well to the right of VMS 01 (north), GN25 still without a position', wm.n > 0 && wm.pins === 41 && wm.items === 42 && wm.southRight && wm.gn25none && wm.tf === 'matrix(', wm);
  const z = await p.evaluate(() => { const M = SatMap1141.maps.map; const g = M.items.find(i => i.id === 'GN23'); SatMap1141.setZoom('map', 6400, g.lat, g.lon); const c = SatMap1141.pt(g.lat, g.lon); return {pct: SatMap1141.pct('map'), dx: Math.abs(M.view.cx - c[0]), dy: Math.abs(M.view.cy - c[1]), z: SatMap1141.satZoom('map')}; });
  check('6400% on GN23 centres the view on its sheet point at zoom 19 or 20', z.pct === 6400 && z.dx < 0.01 && z.dy < 0.01 && z.z >= 19 && z.z <= 20, z);
  await p.waitForTimeout(3000);
  const wb = await bright('#pane-map .s1141-map[data-s1141="map"] .s1141-svg', 'where_gn23_planup_clip_' + tag + '.png');
  check('the zoomed map really draws the imagery', wb.mean > 35 && wb.sd > 12, wb);
  await p.screenshot({path: path.join(out, 'where_gn23_planup_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { SatMap1141.fit('map'); });
  await p.waitForTimeout(3500);
  await p.screenshot({path: path.join(out, 'where_map_planup_' + tag + '.png'), fullPage: false});
  const fd = await p.evaluate(async () => { const i = document.getElementById('q'); i.focus(); i.value = 'VMS 10'; i.dispatchEvent(new Event('input', {bubbles: true})); await new Promise(r => setTimeout(r, 700)); finderPick(0);
   return new Promise(res => { const t0 = Date.now(); (function w(){ const M = window.SatMap1141 && SatMap1141.maps.vms; const pct = M ? SatMap1141.pct('vms') : null; if ((state.tab === 'vms' && pct && pct > 100) || Date.now() - t0 > 8000) { const b = VMS1024.boards().find(x => x.pos === '10'); const pp = VMS1024.position(b); const c = SatMap1141.pt(pp.lat, pp.lon); res({tab: state.tab, pct, dx: M && M.view ? Math.abs(M.view.cx - c[0]) : null, dy: M && M.view ? Math.abs(M.view.cy - c[1]) : null, pins: M ? M.svg().querySelectorAll('g.s1141-pin').length : 0}); } else setTimeout(w, 200); })(); }); });
  check('the finder’s "VMS 10" still lands on the VMS boards map at 1600% centred on the board, now in the plan’s frame; 28 pins there', fd.tab === 'vms' && fd.pct === 1600 && fd.dx < 0.01 && fd.dy < 0.01 && fd.pins === 28, fd);
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'vms_boards_vms10_planup_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1144.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
