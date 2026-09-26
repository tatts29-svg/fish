// the scene's own View chooser (Drone, Wide, Overhead) with the car placed beside a grandstand / marshal post
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  const at = async (name, where, view) => {
    await page.selectOption('#showView', view); await page.waitForTimeout(400);
    await page.evaluate((where) => { const S = GC3D.S, CL = S.CL; let s = 0;
      if (where === 'stand') { const st = S.stands.find(x => !x.out) || S.stands[0]; let bd = 1e9; for (let q = 0; q < CL.L; q += .5) { const p = CL.at(q); const d = Math.hypot(p[0] - st.at[0], p[1] - st.at[1]); if (d < bd) { bd = d; s = q; } } s = (s - 4 + CL.L) % CL.L; }
      else if (where === 'marshal') { s = (S.marshals[0].s - 5 + CL.L) % CL.L; }
      else if (where === 'grid') { s = (S.gridS - 1 + CL.L) % CL.L; }
      S.sim.s = s; S.sim.v = 4; S.paused = false; }, where);
    await page.waitForTimeout(1200); await page.evaluate(() => { GC3D.S.paused = true; }); await page.waitForTimeout(1000);
    const v = await page.evaluate(() => (GC3D.viewReport && GC3D.viewReport().view) || document.querySelector('#showView').value);
    try { await page.screenshot({path: `tabs610/v652d_${name}.png`, timeout: 120000, animations: 'disabled'}); console.log(name, 'view', v); } catch (e) { console.log('shot failed', name); } };
  await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  await at('day_stand_heli', 'stand', 'heli'); await at('day_stand_wide', 'stand', 'wide'); await at('day_marshal_heli', 'marshal', 'heli'); await at('day_top', 'grid', 'top');
  await page.selectOption('#showBackdrop', 'circuit3d'); await page.waitForTimeout(9000);
  await at('night_stand_heli', 'stand', 'heli');
  console.log('errors', errs.slice(0, 4));
  await browser.close(); })();
