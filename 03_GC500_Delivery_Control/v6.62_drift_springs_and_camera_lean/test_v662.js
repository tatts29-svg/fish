// v6.62: the slide is a spring, weight transfer settles, the fronts steer; the lens breathes and the frame leans
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  await page.evaluate(() => { const l = document.querySelector('#showLoop'); if (l && !l.checked) l.click(); });
  await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  await page.evaluate(() => { document.querySelector('#showNext') && document.querySelector('#showNext').click(); });
  await page.waitForTimeout(1500);
  await page.selectOption('#showVehicle', 'car');
  // a deterministic run on the sim itself (no frame-rate dependence): step it and record the springs
  const trace = await page.evaluate(() => { const S = GC3D.S, m = S.sim, out = []; S.paused = true;
    m.s = S.gridS + 5; if (S.clock < 5) S.clock = 5; m.v = S.tune.vmax * .5;
    let mx = {slip: 0, steer: 0, roll: 0, pitch: 0, camRoll: 0, fovKick: 0}, mn = {steer: 0}, over = 0, prevSlip = 0, peak = 0;
    for (let i = 0; i < 120 * 40; i++) { GC3D.step(1 / 120); if (i % 4 === 0) { S.forceShot = 'chase'; GC3D.camStep(4 / 120); }
      mx.slip = Math.max(mx.slip, Math.abs(m.slip)); mx.steer = Math.max(mx.steer, m.steer || 0); mn.steer = Math.min(mn.steer, m.steer || 0);
      mx.roll = Math.max(mx.roll, Math.abs(m.roll)); mx.pitch = Math.max(mx.pitch, Math.abs(m.pitch)); mx.camRoll = Math.max(mx.camRoll, Math.abs(S.camRoll || 0)); mx.fovKick = Math.max(mx.fovKick, S.fovKick || 0);
      if (!Number.isFinite(m.slip) || !Number.isFinite(m.roll) || !Number.isFinite(m.pitch)) return {bad: i};
      if (i % 240 === 0) out.push([+(i / 120).toFixed(0), +m.v.toFixed(1), +m.slip.toFixed(3), +(m.steer || 0).toFixed(3), +m.roll.toFixed(3), +(S.camRoll || 0).toFixed(3), +(S.fovKick || 0).toFixed(3)]); }
    S.forceShot = null; return {mx, mn, out, lap: m.lap}; });
  console.log(JSON.stringify(trace));
  // frames: find a proper slide, then shoot it from several rigs
  for (const view of ['chase', 'onboard', 'hero', 'heli']) {
    await page.selectOption('#showView', view); await page.waitForTimeout(300);
    const st = await page.evaluate(() => { const S = GC3D.S, m = S.sim; S.paused = true;
      for (let i = 0; i < 120 * 30; i++) { GC3D.step(1 / 120); if (i % 4 === 0) GC3D.camStep(4 / 120); if (Math.abs(m.slip) > .26 && i > 240) break; }
      S.needsRender = true; GC3D.camStep(0); return {slip: +m.slip.toFixed(3), steer: +(m.steer || 0).toFixed(3), camRoll: +(S.camRoll || 0).toFixed(3), fov: +S.cam.fov.toFixed(2), shot: S.shotName}; });
    await page.waitForTimeout(1500);
    console.log(view, JSON.stringify(st));
    try { await page.screenshot({path: `tabs610/v662_${view}.png`, timeout: 120000, animations: 'disabled'}); } catch (e) { console.log('shot failed', view); }
  }
  console.log('errors', errs.slice(0, 6));
  await browser.close(); })();
