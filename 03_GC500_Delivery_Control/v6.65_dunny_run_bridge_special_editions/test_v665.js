// v6.65: the Dunny Run, the overhead bridge, the crowd behind the barriers, people in the stands, the Special Editions panel
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  const shot = async n => { try { await page.screenshot({path: `tabs610/v665_${n}.png`, timeout: 120000, animations: 'disabled'}); console.log('shot', n); } catch (e) { console.log('shot failed', n); } };
  console.log('scene', JSON.stringify(await page.evaluate(() => { const S = GC3D.S; let bad = 0; const cm = S.crowdMesh; return {dress: S.dressStats, err: S.dressError || null, figures: cm && cm.people, stands: S.standStats, marshals: (S.marshals || []).length,
    vehLabelVisible: getComputedStyle(document.querySelector('#showVehicleL')).display, seTrig: !document.querySelector('#seTrig').hidden}; })));
  // Special Editions panel
  await page.evaluate(() => document.querySelector('#seTrig').click()); await page.waitForTimeout(500); await shot('se_panel');
  console.log('se', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#sePanel .se-item')].map(b => b.textContent))));
  await page.evaluate(() => document.querySelector('#sePanel .se-item[data-v="car_loo"]').click()); await page.waitForTimeout(600);
  console.log('picked', JSON.stringify(await page.evaluate(() => ({key: GC3D.S.vehicleKey, kind: GC3D.S.towKind, sel: document.querySelector('#showVehicle').value, pref: localStorage.getItem('gc500.showvehicle')}))));
  await page.evaluate(() => { document.querySelector('#sePanel').hidden = true; });
  const at = async (name, s, view, v) => { await page.selectOption('#showView', view); await page.waitForTimeout(300);
    await page.evaluate(([s, v]) => { const S = GC3D.S; S.paused = true; S.sim.s = s; S.sim.v = v; for (let i = 0; i < 120; i++) { GC3D.step(1 / 120); if (i % 3 === 0) GC3D.camStep(3 / 120); } S.needsRender = true; }, [s, v]);
    await page.waitForTimeout(1600); await shot(name); };
  const M = await page.evaluate(() => ({grid: GC3D.S.gridS, L: GC3D.S.CL.L, c: GC3D.S.dressStats.corners, b: GC3D.S.dressStats.bridgeAt, stand: (() => { const S = GC3D.S, st = S.stands[0]; if (!st) return null; let best = 0, bd = 1e9; for (let s = 0; s < S.CL.L; s += .5) { const p = S.CL.at(s), d = Math.hypot(p[0] - st.at[0], p[1] - st.at[1]); if (d < bd) { bd = d; best = s; } } return best; })()}));
  console.log('marks', JSON.stringify(M));
  const back = (s, d) => (s - d + M.L) % M.L;
  // the loo door at a main corner
  await page.selectOption('#showView', 'hero'); await page.waitForTimeout(300);
  for (const [n, want] of [['loo_open', 'open']]) {
    const st = await page.evaluate(([c0, want]) => { const S = GC3D.S, m = S.sim; S.paused = true; if (want === 'open') { m.s = (c0 - 6 + S.CL.L) % S.CL.L + S.CL.L; m.v = S.tune.vmax * .5; S.loo = null; S.trailer = null; }
      for (let i = 0; i < 1500; i++) { GC3D.step(1 / 60); GC3D.trailerStep(S); GC3D.looStep(S); if (i % 2 === 0) GC3D.camStep(2 / 60); if (S.loo && S.loo.ph === want && S.clock - S.loo.t0 > (want === 'open' ? .9 : 1.7)) break; }
      GC3D.camStep(1 / 60); S.needsRender = true; return {ph: S.loo && S.loo.ph, a: S.loo && +S.loo.a.toFixed(2), arm: S.loo && +S.loo.arm.toFixed(2), shot: S.shotName, cut: !!S._looCut}; }, [M.c[0], want]);
    await page.waitForTimeout(1700); console.log(n, JSON.stringify(st)); await shot(n);
  }
  await page.evaluate(() => { document.querySelector('#showVehicle').value = 'car'; GC3D.setVehicle('car'); });
  if (M.b != null) { await at('bridge_chase', back(M.b, 7), 'chase', 3); await at('bridge_heli', M.b, 'heli', 3); }
  if (M.stand != null) await at('stand_hero', back(M.stand, 1), 'hero', 3);
  await at('corner_heli', M.c[1], 'heli', 3);
  await page.evaluate(() => { document.querySelector('#showVehicle').value = 'car_vms'; GC3D.setVehicle('car_vms'); });
  await at('vms_low', (M.grid + 40) % M.L, 'hero', 3);
  console.log('errors', errs.slice(0, 6));
  await browser.close(); })();
