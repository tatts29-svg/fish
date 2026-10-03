// v6.52: the crowd, roofs, marshals and gantry mount without error; day and night views from wide, drone and chase
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  for (const [back, views] of [['circuit3d_day', ['wide', 'heli', 'chase']], ['circuit3d', ['heli', 'chase']]]) {
    await page.selectOption('#showBackdrop', back); await page.waitForTimeout(9000);
    const st = await page.evaluate(() => { const S = GC3D.S; return {mounted: !!S, stands: S.standStats, people: S.people && S.people.n, flashPts: S.crowdPts && S.crowdPts.length, marshals: S.marshals && S.marshals.length, gantry: !!S.gantry, decorTris: S.standDecor && S.standDecor.ni / 3}; });
    console.log(back, JSON.stringify(st));
    for (const v of views) {
      await page.evaluate(v => { GC3D.setView(v); GC3D.S.paused = false; }, v); await page.waitForTimeout(v === 'chase' ? 6000 : 3500);
      await page.evaluate(() => { GC3D.S.paused = true; }); await page.waitForTimeout(1200);
      try { await page.screenshot({path: `tabs610/v652_${back}_${v}.png`, timeout: 120000, animations: 'disabled'}); } catch (e) { console.log('shot failed', v); }
    }
  }
  console.log('errors', errs.slice(0, 6));
  await browser.close(); })();
