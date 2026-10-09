// Screens for Andrew: normal header, a category picked with Clear on the map, Fencing open with Close, and a 3D round trip.
const {open} = require('./xembed'); const OUT = process.env.OUT;
(async () => { const MOB = !!process.env.MOB, tag = (MOB ? 'phone' : 'desktop') + (process.env.TAG || '');
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('map')); const fh = await p.waitForSelector('#pane-map iframe'); const f = await fh.contentFrame();
  await f.waitForFunction(() => window.GC500Explorer && GC500Explorer.state && GC500Explorer.state.ready, null, {timeout: 90000}); await p.waitForTimeout(3500);
  const shot = async n => { await (MOB ? fh.screenshot({path: `${OUT}/${tag}_${n}.png`}) : fh.screenshot({path: `${OUT}/${tag}_${n}.png`})); };
  await shot('1_open');
  await f.evaluate(() => { const c = [...document.querySelectorAll('#chips .chip')].find(x => /Generators/.test(x.textContent)) || document.querySelector('#chips .chip'); c.click(); if (typeof panel813 === 'function' && matchMedia('(max-width:900px)').matches) panel813(false); });
  await p.waitForTimeout(2500); await shot('2_category_with_clear');
  await f.evaluate(() => { const b = document.getElementById('x864Clear'); if (b && !b.hidden) b.click(); });
  await f.evaluate(() => document.getElementById('fenceMode').click()); await p.waitForTimeout(2500); await shot('3_fencing_open');
  if (MOB) { await f.evaluate(() => panel813(false)); await p.waitForTimeout(800); await shot('4_fencing_map'); }
  await f.evaluate(() => document.getElementById('fenceMode').click()); await p.waitForTimeout(600);
  // 3D there and back
  const has3d = await f.evaluate(() => !!(GC500Explorer.mode3d)); let in3d = null, back = null;
  if (has3d) { await f.evaluate(() => GC500Explorer.mode3d(true)); await p.waitForTimeout(4000); in3d = await f.evaluate(() => document.body.classList.contains('in3d')); await f.evaluate(() => GC500Explorer.mode3d(false)); await p.waitForTimeout(1500); back = await f.evaluate(() => !document.body.classList.contains('in3d') && GC500Explorer.state.ready); }
  console.log(JSON.stringify({tag, errors: s.errors, blocked: s.counts.blocked, has3d, in3d, back})); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
