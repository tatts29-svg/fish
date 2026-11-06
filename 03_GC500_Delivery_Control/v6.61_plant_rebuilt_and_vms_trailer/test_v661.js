// v6.61: the rebuilt plant and the #26 towing the VMS - build, draw, drive, close-ups day and night
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500); await page.evaluate(() => { const l = document.querySelector('#showLoop'); if (l && !l.checked) l.click(); });
  const only = (process.argv[3] || 'forklift,boom,scissor,car_vms').split(',');
  const shot = async (name) => { try { await page.screenshot({path: `tabs610/v661_${name}.png`, timeout: 120000, animations: 'disabled'}); } catch (e) { console.log('shot failed', name); } };
  const drive = async (v, view, ahead, secs) => {
    await page.selectOption('#showVehicle', v); await page.selectOption('#showView', view); await page.waitForTimeout(400);
    await page.evaluate((ahead) => { const S = GC3D.S; S.sim.s = (S.gridS + ahead) % S.CL.L; S.sim.v = 8; S.paused = false; if (S.clock < 5) S.clock = 5; clearInterval(window.__keep); window.__keep = setInterval(() => { GC3D.S.paused = false; }, 50); }, ahead);
    await page.waitForTimeout(secs * 1000); await page.evaluate(() => { clearInterval(window.__keep); GC3D.S.paused = true; }); await page.waitForTimeout(900);
    return page.evaluate(() => { const S = GC3D.S; return {vehicle: S.vehicle, key: S.vehicleKey, tow: !!S.towVms, parts: S.raceCarParts && S.raceCarParts.length, tris: S.raceCarStats && S.raceCarStats.triangles,
      trailer: S.trailer ? {hd: +S.trailer.hd.toFixed(3), roll: +S.trailer.roll.toFixed(3), spin: +S.trailer.spin.toFixed(1)} : null, tparts: S.trailerParts && S.trailerParts.length, lit: GC3D.vmsTexInfo, sway: S.sway && +S.sway.r.toFixed(3), v: +S.sim.v.toFixed(2)}; });
  };
  await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  for (const v of only) {
    for (const view of ['hero', 'chase']) { const st = await drive(v, view, 40, 3.5); console.log(v, view, JSON.stringify(st)); await shot(`day_${v}_${view}`); }
  }
  if (only.includes('car_vms')) { await page.selectOption('#showBackdrop', 'circuit3d'); await page.waitForTimeout(9000);
    const st = await drive('car_vms', 'hero', 80, 3.5); console.log('night car_vms', JSON.stringify(st)); await shot('night_car_vms_hero');
    await drive('car_vms', 'heli', 120, 3); await shot('night_car_vms_heli'); }
  await page.selectOption('#showVehicle', 'car'); await page.waitForTimeout(800);
  console.log('back to car', JSON.stringify(await page.evaluate(() => ({key: GC3D.S.vehicleKey, tow: !!GC3D.S.towVms, pref: localStorage.getItem('gc500.showvehicle')}))));
  console.log('errors', errs.slice(0, 6));
  await browser.close(); })();
