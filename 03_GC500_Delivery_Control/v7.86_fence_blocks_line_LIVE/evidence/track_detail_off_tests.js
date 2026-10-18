// v7.86 - Showcase Track detail off until it covers the whole lap. Author: Andrew Fisher. Read-only: GETs only, writes aborted.
//   PAGE=<built page> BASE=<live page> [MOB=1] [OUT=<json>] node track_detail_off_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
const ready = p => p.waitForFunction(() => typeof showOpen === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000});
const look = async p => { await p.evaluate(() => { try { showOpen(); } catch (e) { window.__openErr = String(e.message || e); } }); await new Promise(r => setTimeout(r, 4000));
  return p.evaluate(() => { const sc = document.getElementById('showcase'); return {button: !!document.getElementById('detail781Button'), open: !!sc && !sc.hidden && getComputedStyle(sc).display !== 'none',
    controls: ['showView', 'showQuality', 'showBackdrop', 'showPace'].filter(id => document.getElementById(id)), enabled: !!(window.GC3D && GC3D.preview781 && GC3D.preview781.enabled), openErr: window.__openErr || null}; }); };
(async () => {
  const MOB = !!process.env.MOB, view = MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 1000};
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)});
  const b = await open(Object.assign({pageFile: process.env.BASE}, view)); await ready(b.page); const before = await look(b.page); await b.browser.close();
  const s = await open(Object.assign({pageFile: process.env.PAGE}, view)), p = s.page; await ready(p); const after = await look(p);
  ok('T1 the live v7.85 shows the Track detail button (what is being taken out)', before.button, JSON.stringify(before));
  ok('T2 the Showcase still opens, with its own controls (view, detail, backdrop, speed)', after.open && after.controls.length === before.controls.length && !after.openErr, JSON.stringify(after));
  ok('T3 there is no Track detail button, and the part-built scene is not on', !after.button && !after.enabled, JSON.stringify({button: after.button, enabled: after.enabled}));
  ok('E1 no page errors', !s.errors.length, JSON.stringify(s.errors).slice(0, 200));
  const passed = T.filter(t => t.pass).length;
  T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + ' — ' + t.detail.slice(0, 300)));
  console.log(passed + '/' + T.length + ' ' + (MOB ? 'phone' : 'desktop'));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, passed, of: T.length, tests: T}, null, 1));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})();
