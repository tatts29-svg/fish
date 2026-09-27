// the upgraded 3D proof (local draft files served in place of the live ones; GET only, plus Google tiles)
const {open} = require('./harness3');
const OUT = '/tmp/claude-0/stage2/p3dshots/'; require('fs').mkdirSync(OUT, {recursive: true});
const W = +(process.env.W || 1440), H = +(process.env.H || 900), tag = process.env.TAG || 'desk';
async function settle(p, max = 120000) { const t0 = Date.now(); await p.waitForTimeout(1500); while (Date.now() - t0 < max) { if (await p.evaluate(() => window.__allLoaded)) break; await p.waitForTimeout(1500); } await p.waitForTimeout(1500); }
(async () => { process.env.GL = '1';
  const s = await open({prefix: '/w/Coates-GC500-2026/poc3d/', dirs: ['/tmp/claude-0/stage2/poc3d'], W, H, mobile: tag === 'phone', dpr: tag === 'phone' ? 2 : 1, log: () => {}}); const p = s.page;
  const res = {};
  await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 180000});
  res.boot = await p.evaluate(() => window.__bootError || 'ok');
  await p.waitForFunction(() => window.GC500_3D.state.pins > 0, null, {timeout: 30000}).catch(() => {});
  res.state = await p.evaluate(() => { const s = window.GC500_3D.state; return {pins: s.pins, q: s.quality, rs: viewer.resolutionScale, sse: tileset.maximumScreenSpaceError, msaa: viewer.scene.msaaSamples, fxaa: viewer.scene.postProcessStages.fxaa.enabled, heading: Math.round(s.heading)}; });
  res.chips = await p.evaluate(() => [...document.querySelectorAll('#chips button')].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? ' ✓' : '')));
  res.facing0 = await p.textContent('#facing');
  await settle(p); await p.screenshot({path: OUT + tag + '_1_overhead.png', timeout: 120000});
  await p.evaluate(() => window.GC500_3D.fly('angled', 0)); await settle(p); await p.screenshot({path: OUT + tag + '_2_angled.png', timeout: 120000});
  // search and fly
  await p.fill('#q', 'WC23'); await p.waitForTimeout(300); res.hits = await p.evaluate(() => [...document.querySelectorAll('#hits [data-i]')].map(b => b.textContent.trim()).slice(0, 4));
  await p.press('#q', 'Enter'); await p.waitForTimeout(2500); await settle(p); res.statusAfterFind = await p.evaluate(() => document.getElementById('status').innerText.slice(0, 160));
  await p.screenshot({path: OUT + tag + '_3_find_wc23.png', timeout: 120000});
  // compass: face north, then west
  for (const d of [0, 270]) { await p.evaluate(d => document.querySelector(`#dial [data-face="${d}"]`).click(), d); await p.waitForFunction(() => !faceAnim, null, {timeout: 30000}); res["face" + d] = {heading: await p.evaluate(() => Math.round(window.GC500_3D.state.heading)), label: await p.textContent('#facing')}; }
  await settle(p, 60000); await p.screenshot({path: OUT + tag + '_4_facing_west.png', timeout: 120000});
  // orbit on, a moment, off by a touch of the map
  const h0 = await p.evaluate(() => window.GC500_3D.state.heading); await p.evaluate(() => document.getElementById('orbitBtn').click()); await p.waitForTimeout(2500);
  const h1 = await p.evaluate(() => window.GC500_3D.state.heading); res.orbit = {turned: Math.round(((h1 - h0) + 540) % 360 - 180), pressed: await p.getAttribute('#orbitBtn', 'aria-pressed')};
  await p.mouse.move(W / 2, H / 2); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(300); res.orbitStopped = await p.getAttribute('#orbitBtn', 'aria-pressed');
  // chips: toggle toilets off, count shown entities
  res.toiletsShownBefore = await p.evaluate(() => viewer.entities.values.filter(e => e.show && e._gc && e._gc.t === 'toilets').length);
  await p.evaluate(() => document.querySelector('#chips [data-t="toilets"]').click()); res.toiletsShownAfter = await p.evaluate(() => viewer.entities.values.filter(e => e.show && e._gc && e._gc.t === 'toilets').length);
  await p.evaluate(() => document.querySelector('#chips [data-t="toilets"]').click());
  // close view with pins and labels
  await p.evaluate(() => window.GC500_3D.fly('close', 0)); await settle(p); await p.screenshot({path: OUT + tag + '_5_close.png', timeout: 120000});
  res.credits = await p.evaluate(() => [...new Set([...document.querySelectorAll('.cesium-widget-credits *')].map(e => e.textContent.trim()).filter(Boolean))].slice(0, 6));
  res.errors = s.errors; res.counts = s.counts;
  console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
