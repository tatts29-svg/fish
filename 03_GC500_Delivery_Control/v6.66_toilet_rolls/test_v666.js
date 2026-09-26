// v6.66: toilet rolls tumble out of the dunny door and unreel paper down the road
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  await page.evaluate(() => { document.querySelector('#showVehicle').value = 'car_loo'; showVehicleSet('car_loo'); });
  await page.getByRole('button', {name: 'Pause'}).click(); await page.waitForTimeout(500);
  await page.selectOption('#showView', 'hero'); await page.waitForTimeout(300);
  const c0 = await page.evaluate(() => GC3D.S.dressStats.corners[0]);
  // up to the corner until the door opens
  console.log('open', JSON.stringify(await page.evaluate((c0) => { const S = GC3D.S, m = S.sim; S.paused = true; m.s = (c0 - 6 + S.CL.L) % S.CL.L + S.CL.L; m.v = S.tune.vmax * .5; S.loo = null; S.trailer = null; S.rolls = [];
    for (let i = 0; i < 1500; i++) { GC3D.step(1 / 60); GC3D.trailerStep(S); GC3D.looStep(S); if (i % 2 === 0) GC3D.camStep(2 / 60); if (S.loo && S.loo.ph === 'open' && S.clock - S.loo.t0 > .1) break; }
    return {ph: S.loo.ph, u: +(S.clock - S.loo.t0).toFixed(2)}; }, c0)));
  // now frame by frame, drawing, so the rolls come out and fly
  const run = async (frames) => page.evaluate((frames) => { const S = GC3D.S; for (let f = 0; f < frames; f++) { for (let j = 0; j < 3; j++) { GC3D.step(1 / 60); GC3D.trailerStep(S); GC3D.looStep(S); } GC3D.camStep(3 / 60); GC3D.render(); }
    S.needsRender = true; return {ph: S.loo && S.loo.ph, rolls: (S.rolls || []).map(r => ({y: +r.p[1].toFixed(2), ground: !!r.ground, trail: r.trail.length})), paperTris: S.paperBatch && S.paperBatch.i.length / 3, shot: S.shotName}; }, frames);
  console.log('fly', JSON.stringify(await run(14))); await page.waitForTimeout(1500); await page.screenshot({path: 'tabs610/v666_rolls_fly.png', timeout: 120000, animations: 'disabled'});
  console.log('land', JSON.stringify(await run(22))); await page.waitForTimeout(1500); await page.screenshot({path: 'tabs610/v666_rolls_land.png', timeout: 120000, animations: 'disabled'});
  // and from the drone, the paper down the road
  await page.selectOption('#showView', 'heli'); await page.waitForTimeout(300);
  console.log('after', JSON.stringify(await run(10))); await page.waitForTimeout(1500); await page.screenshot({path: 'tabs610/v666_rolls_heli.png', timeout: 120000, animations: 'disabled'});
  console.log('errors', errs.slice(0, 6));
  await browser.close(); })();
