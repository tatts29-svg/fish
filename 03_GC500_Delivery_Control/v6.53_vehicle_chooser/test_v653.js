// v6.53: each vehicle builds, draws and drives; the chooser is kept on the device; the car comes back
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 200)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  console.log('chooser', JSON.stringify(await page.evaluate(() => ({hidden: document.querySelector('#showVehicleL').hidden, value: document.querySelector('#showVehicle').value, vmax0: +GC3D.S.tune.vmax.toFixed(3)}))));
  for (const v of ['forklift', 'boom', 'scissor', 'tractor', 'car']) {
    await page.selectOption('#showVehicle', v); await page.waitForTimeout(500);
    await page.evaluate(() => { const S = GC3D.S; S.sim.s = (S.gridS + 30) % S.CL.L; S.sim.v = 6; S.paused = false; }); await page.waitForTimeout(4000);
    await page.evaluate(() => { GC3D.S.paused = true; }); await page.waitForTimeout(1000);
    const st = await page.evaluate(() => { const S = GC3D.S; return {vehicle: S.vehicle, tag: S.raceCarGeometryQuality, parts: S.raceCarParts && S.raceCarParts.length, tris: S.raceCarStats && S.raceCarStats.triangles, vmax: +S.tune.vmax.toFixed(3), vRate: GC3D.sound && GC3D.sound.vRate, pref: localStorage.getItem('gc500.showvehicle'), v: +S.sim.v.toFixed(2)}; });
    console.log(v, JSON.stringify(st));
    try { await page.screenshot({path: `tabs610/v653_${v}.png`, timeout: 120000, animations: 'disabled'}); } catch (e) { console.log('shot failed', v); }
  }
  console.log('errors', errs.slice(0, 6));
  await browser.close(); })();
