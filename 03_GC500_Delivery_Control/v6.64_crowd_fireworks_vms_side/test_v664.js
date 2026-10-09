// v6.64: spectators as figures on terraces; the VMS side-on; fireworks that spell COATES GC500 2026 and take the camera
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  console.log('crowd', JSON.stringify(await page.evaluate(() => { const S = GC3D.S; return {dress: S.dressStats, err: S.dressError || null, figures: S.crowdMesh && S.crowdMesh.people, figureTris: S.crowdMesh && S.crowdMesh.ni / 3, capsules: S.people && S.people.n}; })));
  const shot = async n => { try { await page.screenshot({path: `tabs610/v664_${n}.png`, timeout: 120000, animations: 'disabled'}); console.log('shot', n); } catch (e) { console.log('shot failed', n); } };
  const at = async (name, s, view, v, veh) => { if (veh) await page.selectOption('#showVehicle', veh); await page.selectOption('#showView', view); await page.waitForTimeout(300);
    const r = await page.evaluate(([s, v]) => { const S = GC3D.S; S.paused = true; S.sim.s = s; S.sim.v = v; for (let i = 0; i < 120; i++) { GC3D.step(1 / 120); if (i % 3 === 0) GC3D.camStep(3 / 120); } S.needsRender = true; return S.shotName; }, [s, v]);
    await page.waitForTimeout(1600); await shot(name); return r; };
  const M = await page.evaluate(() => ({grid: GC3D.S.gridS, L: GC3D.S.CL.L, c: GC3D.S.dressStats.corners}));
  const back = (s, d) => (s - d + M.L) % M.L;
  await at('corner_hero', back(M.c[0], 2), 'hero', 3, 'car');
  await at('corner_chase', back(M.c[1], 3.5), 'chase', 3);
  await at('grid_hero', (M.grid + 4) % M.L, 'hero', 2);
  await at('vms_hero', (M.grid + 30) % M.L, 'hero', 3, 'car_vms');
  await at('vms_chase', (M.grid + 60) % M.L, 'chase', 3);
  await page.selectOption('#showVehicle', 'car');
  await page.selectOption('#showBackdrop', 'circuit3d'); await page.waitForTimeout(9000);
  await page.selectOption('#showView', 'auto'); await page.waitForTimeout(300);
  for (const [n, secs] of [['fw_rise', 1.0], ['fw_burst', 2.2], ['fw_words', 4.2], ['fw_fall', 7.2]]) {
    const st = await page.evaluate((secs) => { const S = GC3D.S; S.paused = true; GC3D.fireworksNow(); GC3D.step(1 / 120); GC3D.render();
      const t0 = S.fw ? S.fw.t0 : null; for (let i = 0; S.fw && S.clock - S.fw.t0 < secs && i < 2000; i++) { GC3D.step(1 / 60); if (i % 2 === 0) { GC3D.camStep(2 / 60); GC3D.buildDynamic(); } }
      GC3D.camStep(1 / 60); S.needsRender = true; return {t0, u: S.fw && +S.fw.u.toFixed(2), cam: S.fw && S.fw.cam, shot: S.shotName, count: S.fwCount, dots: S.fwPlan && S.fwPlan.dots.length}; }, secs);
    await page.waitForTimeout(1600); console.log(n, JSON.stringify(st)); await shot(n);
  }
  console.log('errors', errs.slice(0, 6));
  await browser.close(); })();
