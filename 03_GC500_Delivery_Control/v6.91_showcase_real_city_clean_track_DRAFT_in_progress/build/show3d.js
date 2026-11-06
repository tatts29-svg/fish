// the real-city showcase draft: load, drive, each camera, screenshots (GET only, plus Google tiles)
const {open} = require('./harness3');
const OUT = '/tmp/claude-0/stage2/show3dshots/'; require('fs').mkdirSync(OUT, {recursive: true});
const W = +(process.env.W || 1440), H = +(process.env.H || 810), tag = process.env.TAG || 'desk';
async function settle(p, max = 90000) { const t0 = Date.now(); await p.waitForTimeout(1500); while (Date.now() - t0 < max) { if (await p.evaluate(() => { try { return tileset.tilesLoaded; } catch (e) { return false; } })) break; await p.waitForTimeout(1500); } await p.waitForTimeout(1000); }
(async () => { process.env.GL = '1';
  const s = await open({prefix: '/w/Coates-GC500-2026/showcase3d/', dirs: ['/tmp/claude-0/stage2/showcase3d'], W, H, mobile: tag === 'phone', dpr: tag === 'phone' ? 2 : 1, log: () => {}}); const p = s.page; const res = {};
  await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 240000}); res.boot = await p.evaluate(() => window.__bootError || 'ok');
  if (res.boot !== 'ok') { console.log(JSON.stringify(res)); console.log(s.errors); await s.browser.close(); return; }
  res.h = await p.evaluate(() => ({readings: window.__trackReadings, h: __S.h, chunks: (typeof roadPrims !== 'undefined') ? roadPrims.length : null, clip: tileset.clippingPolygons ? tileset.clippingPolygons.length : null}));
  const shots = process.env.CAMS ? process.env.CAMS.split(',') : ['chase', 'blimp', 'heli', 'tv'];
  const spots = (process.env.SPOTS || '900,1700').split(',').map(Number);
  for (const sp of spots) {
    for (const c of shots) {
      await p.evaluate(([c, sp]) => { GC500_SHOW.setCam(c); __S.playing = false; GC500_SHOW.jump(sp); __S.v = 40; }, [c, sp]);
      // let the camera settle on the car (frames advance even when paused)
      await p.waitForTimeout(2500); await settle(p); await p.waitForTimeout(1500);
      await p.screenshot({path: `${OUT}${tag}_${sp}_${c}.png`, timeout: 180000});
    }
  }
  // it drives: a few seconds of play
  await p.evaluate(() => { GC500_SHOW.setCam('chase'); __S.playing = true; }); const s0 = await p.evaluate(() => __S.s); await p.waitForTimeout(5000); res.moved = Math.round(await p.evaluate(() => __S.s) - s0); res.v = await p.evaluate(() => Math.round(__S.v * 3.6));
  res.renderError = await p.evaluate(() => { const e = document.querySelector('.cesium-widget-errorPanel'); return e ? e.innerText.slice(0, 300) : null; }); res.errors = s.errors; res.counts = s.counts; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
