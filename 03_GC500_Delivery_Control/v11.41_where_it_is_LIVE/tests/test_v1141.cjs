/* Author: Andrew Fisher. v11.41 checks: under the Map explorer a "Where it is" satellite map with every VMS board the record
   places (28, the seven off the sheet among them) and every generator (14: 13 pinned, GN25 listed as without a position),
   the removal boards in their colours, generators as green squares with their units, All / VMS / Generators filter, tap
   targets, Navigate links, zoom, Fit, Esri tiles; the same boards-only map under the VMS boards tab's head; the map really
   draws; record unchanged, no errors, no writes. GET only.
     PAGE=build/GC500_v11.41/GC500_Delivery_Control_hosted.html node tests/test_v1141.cjs      MOB=1 ...      LIVE=1 ... */
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
 const h = await open(MOB ? {pageFile, hash: '#map', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#map', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForFunction(() => document.querySelector('#pane-map .s1141-map[data-s1141="map"] .s1141-svg'), null, {timeout: 60000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.41'));
  const m = await p.evaluate(() => { const pane = document.getElementById('pane-map'), c = pane.querySelector('.s1141-map[data-s1141="map"]'), svg = c.querySelector('.s1141-svg'); const M = SatMap1141.maps.map;
   const items = M.items.map(i => ({kind: i.kind, id: i.id, lat: i.lat, lon: i.lon, colour: i.colour, units: i.units || [], how: i.how.slice(0, 40)}));
   return {afterExp: !!(c.previousElementSibling && c.previousElementSibling.id === 'expcard'), wrapped: SatMap1141.wrapped, items, pins: svg.querySelectorAll('g.pins g.s1141-pin').length, genPins: svg.querySelectorAll('g.pins g.s1141-pin.gen rect').length, vmsPins: svg.querySelectorAll('g.pins g.s1141-pin.vms circle').length, navTargets: svg.querySelectorAll('[data-s1141-nav]').length,
    labels: [...svg.querySelectorAll('text.s1141-lbl')].map(t => t.textContent), list: [...c.querySelectorAll('.s1141-list li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), noneRows: [...c.querySelectorAll('.s1141-list li.s1141-none')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), links: c.querySelectorAll('.s1141-list a.btn').length, buttons: [...c.querySelectorAll('[data-s1141-zoom],[data-s1141-filter]')].map(b => b.dataset.s1141Zoom || b.dataset.s1141Filter), pct: c.querySelector('[data-s1141-pct]').textContent, credit: /Esri/.test(c.textContent), noAgent: !/claude|codex|agent/i.test(c.textContent), sub: c.querySelector('.sub').textContent}; });
  const vms = m.items.filter(i => i.kind === 'vms'), gens = m.items.filter(i => i.kind === 'gen'), placed = m.items.filter(i => Number.isFinite(i.lat) && Number.isFinite(i.lon));
  const off = ['01', '02', '03', '07', '23', '09', '10'].map(id => vms.find(b => b.id === id));
  check('the card sits under the Map explorer: 28 boards (the seven off the sheet with positions) and 14 generators (13 placed, GN25 without a position), both renders wrapped, a pin per placed reference with a tap target, the removal boards in their colours, generators as green squares, labels, a list with a Navigate link per placed reference, GN25 listed as without a position, All / VMS / Generators and the zoom buttons, 100%, the credit, no agent names',
   m.afterExp && m.wrapped.map && m.wrapped.vms && vms.length === 28 && gens.length === 14 && placed.length === 41 && off.every(b => b && Number.isFinite(b.lat)) && m.pins === 41 && m.vmsPins === 28 && m.genPins === 13 && m.navTargets === 41 && vms.find(b => b.id === '16').colour === '#00e5ff' && vms.find(b => b.id === '13').colour === '#ff3b3b' && vms.find(b => b.id === '04').colour === '#c77dff' && gens.every(g => g.colour === '#3ddc84') && m.labels.length === 41 && m.labels.some(t => /VMS 10/.test(t)) && m.labels.some(t => /^GN23$/.test(t)) && m.list.length === 42 && m.links === 41 && m.noneRows.length === 1 && /GN25/.test(m.noneRows[0]) && /no position on the record/.test(m.noneRows[0]) && gens.find(g => g.id === 'GN?') && gens.find(g => g.id === 'GN?').units.join(',') === '1316182,1316183' && m.list.some(t => /GN\?/.test(t) && /1316182/.test(t)) && m.buttons.join(',') === 'out,in,fit,all,vms,gen' && m.pct === '100%' && m.credit && m.noAgent && /1 reference has no position/.test(m.sub), {counts: {vms: vms.length, gens: gens.length, placed: placed.length, pins: m.pins, labels: m.labels.length, list: m.list.length, links: m.links}, off: off.map(b => b && [b.id, b.lat, b.lon]), noneRows: m.noneRows, buttons: m.buttons, sub: m.sub.slice(0, 200)});
  const filt = await p.evaluate(() => { const c = document.querySelector('#pane-map .s1141-map[data-s1141="map"]'), svg = c.querySelector('.s1141-svg');
   c.querySelector('[data-s1141-filter="gen"]').click(); const g = {pins: svg.querySelectorAll('g.pins g.s1141-pin').length, gen: svg.querySelectorAll('g.pins g.s1141-pin.gen').length, hidden: [...c.querySelectorAll('.s1141-list li')].filter(li => li.hidden).length, shown: [...c.querySelectorAll('.s1141-list li')].filter(li => !li.hidden).map(li => li.dataset.kind), on: c.querySelector('[data-s1141-filter="gen"]').classList.contains('primary')};
   c.querySelector('[data-s1141-filter="vms"]').click(); const v = {pins: svg.querySelectorAll('g.pins g.s1141-pin').length, vms: svg.querySelectorAll('g.pins g.s1141-pin.vms').length, hidden: [...c.querySelectorAll('.s1141-list li')].filter(li => li.hidden).length};
   c.querySelector('[data-s1141-filter="all"]').click(); const a = {pins: svg.querySelectorAll('g.pins g.s1141-pin').length, hidden: [...c.querySelectorAll('.s1141-list li')].filter(li => li.hidden).length};
   return {g, v, a}; });
  check('the filter: Generators shows the 13 generator pins and the 14 generator rows (GN25 among them), VMS boards the 28 board pins and rows, All everything', filt.g.pins === 13 && filt.g.gen === 13 && filt.g.hidden === 28 && filt.g.shown.every(k => k === 'gen') && filt.g.shown.length === 14 && filt.g.on && filt.v.pins === 28 && filt.v.vms === 28 && filt.v.hidden === 14 && filt.a.pins === 41 && filt.a.hidden === 0, filt);
  const sat = await p.evaluate(() => new Promise(res => { const t0 = Date.now(); (function wait(){ const n = SatMap1141.tiles('map').length; if (n > 0 || Date.now() - t0 > 8000) res({n, z: SatMap1141.satZoom('map'), hrefs: SatMap1141.tiles('map').slice(0, 2)}); else setTimeout(wait, 200); })(); }));
  check('Esri tiles placed for the whole-map view (zoom 14 to 17, the boards span several kilometres)', sat.n > 0 && sat.n <= 160 && sat.z >= 14 && sat.z <= 17 && sat.hrefs.every(u => /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+$/.test(u)), sat);
  const zoom = await p.evaluate(() => { const c = document.querySelector('#pane-map .s1141-map[data-s1141="map"]'), svg = c.querySelector('.s1141-svg'); const w0 = Number(svg.getAttribute('viewBox').split(' ')[2]);
   c.querySelector('[data-s1141-zoom="in"]').click(); c.querySelector('[data-s1141-zoom="in"]').click(); const w1 = Number(svg.getAttribute('viewBox').split(' ')[2]), p1 = SatMap1141.pct('map');
   c.querySelector('[data-s1141-zoom="fit"]').click(); const w2 = Number(svg.getAttribute('viewBox').split(' ')[2]), p2 = SatMap1141.pct('map');
   SatMap1141.setZoom('map', 6400, -27.986293, 153.427771); const w3 = Number(svg.getAttribute('viewBox').split(' ')[2]), p3 = SatMap1141.pct('map'), z3 = SatMap1141.satZoom('map'); return {w0, w1, p1, w2, p2, w3, p3, z3}; });
  check('zoom in twice gives 256%, Fit returns to 100%, 6400% on GN23 asks for zoom-19 (a phone) or zoom-20 (the cap) imagery', Math.abs(zoom.w1 - zoom.w0 / 2.56) < 0.5 && zoom.p1 === 256 && zoom.w2 === zoom.w0 && zoom.p2 === 100 && zoom.p3 === 6400 && zoom.z3 >= 19 && zoom.z3 <= 20, zoom);
  await p.evaluate(() => { document.querySelector('#pane-map .s1141-map[data-s1141="map"]').scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(3000);
  await p.screenshot({path: path.join(out, 'where_gn23_6400_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => { SatMap1141.fit('map'); });
  await p.waitForTimeout(3500);
  await p.screenshot({path: path.join(out, 'where_map_' + tag + '.png'), fullPage: false});
  const bright = async (sel, file) => { const r = await p.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel); const f = path.join(out, file); await p.screenshot({path: f, clip: {x: r[0], y: Math.max(0, r[1]), width: r[2], height: Math.min(r[3], 900)}}); const o = require('child_process').execSync('python3 -c "from PIL import Image, ImageStat; im = Image.open(\'' + f + '\').convert(\'L\'); s = ImageStat.Stat(im); print(round(s.mean[0], 1), round(s.stddev[0], 1))"').toString().trim().split(' ').map(Number); return {mean: o[0], sd: o[1]}; };
  const vb = await bright('#pane-map .s1141-map[data-s1141="map"] .s1141-svg', 'where_map_clip_' + tag + '.png');
  check('the map really draws the imagery (neither dark nor flat)', vb.mean > 35 && vb.sd > 12, vb);
  await p.evaluate(() => go('vms'));
  await p.waitForFunction(() => document.querySelector('#pane-vms .s1141-map[data-s1141="vms"] .s1141-svg'), null, {timeout: 60000});
  await p.waitForTimeout(1500);
  const v = await p.evaluate(() => { const pane = document.getElementById('pane-vms'), c = pane.querySelector('.s1141-map[data-s1141="vms"]'), svg = c.querySelector('.s1141-svg'); const M = SatMap1141.maps.vms;
   return {afterHead: !!(c.previousElementSibling && c.previousElementSibling.classList.contains('v1024-head')), items: M.items.length, kinds: [...new Set(M.items.map(i => i.kind))], pins: svg.querySelectorAll('g.pins g.s1141-pin').length, filter: c.querySelectorAll('[data-s1141-filter]').length, list: c.querySelectorAll('.s1141-list li').length, none: c.querySelectorAll('.s1141-list li.s1141-none').length}; });
  check('under the VMS boards tab’s head: the 28 boards alone, 28 pins and rows, no filter, none without a position', v.afterHead && v.items === 28 && v.kinds.join() === 'vms' && v.pins === 28 && v.filter === 0 && v.list === 28 && v.none === 0, v);
  await p.evaluate(() => { document.querySelector('#pane-vms .s1141-map[data-s1141="vms"]').scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(3500);
  await p.screenshot({path: path.join(out, 'where_vms_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1141.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
