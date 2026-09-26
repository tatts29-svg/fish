// v6.63: race-day dressing - tyre walls, fence banners, braking boards, gantry words, rooftop plant and billboards, more crowd
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  console.log('dress', JSON.stringify(await page.evaluate(() => ({stats: GC3D.S.dressStats, err: GC3D.S.dressError || null, decorTris: GC3D.S.standDecor && GC3D.S.standDecor.ni / 3, people: GC3D.S.people && GC3D.S.people.n}))));
  const at = async (name, s, view, v) => { await page.selectOption('#showView', view); await page.waitForTimeout(300);
    await page.evaluate(([s, v]) => { const S = GC3D.S; S.paused = true; S.sim.s = s; S.sim.v = v; for (let i = 0; i < 90; i++) { GC3D.step(1 / 120); if (i % 3 === 0) GC3D.camStep(3 / 120); } S.needsRender = true; }, [s, v]);
    await page.waitForTimeout(1600);
    try { await page.screenshot({path: `tabs610/v663_${name}.png`, timeout: 120000, animations: 'disabled'}); console.log('shot', name); } catch (e) { console.log('shot failed', name); } };
  const marks = await page.evaluate(() => ({grid: GC3D.S.gridS, L: GC3D.S.CL.L, m: (GC3D.S.dressStats && GC3D.S.dressStats.corners) || [], M: GC3D.M_PER_PT}));
  console.log('marks', JSON.stringify(marks));
  const back = (s, d) => (s - d + marks.L) % marks.L;
  await at('grid_gantry', (marks.grid + 6.5) % marks.L, 'hero', 2);
  if (marks.m[0] != null) { await at('corner0_hero', back(marks.m[0], 2.5), 'hero', 3); await at('corner0_chase', back(marks.m[0], 4), 'chase', 3); }
  if (marks.m[1] != null) await at('corner1_hero', back(marks.m[1], 2), 'hero', 3);
  if (marks.m[2] != null) await at('corner2_heli', marks.m[2], 'heli', 3);
  if (marks.m[3] != null) await at('corner3_hero', back(marks.m[3], 2), 'hero', 3);
  await at('wide', marks.grid, 'wide', 3);
  await page.selectOption('#showBackdrop', 'circuit3d'); await page.waitForTimeout(9000);
  if (marks.m[0] != null) await at('night_corner0_hero', back(marks.m[0], 2.5), 'hero', 3);
  console.log('errors', errs.slice(0, 6));
  await browser.close(); })();
