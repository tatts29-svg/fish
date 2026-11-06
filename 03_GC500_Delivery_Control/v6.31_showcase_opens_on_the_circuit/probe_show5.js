const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage();
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  for (const back of ['circuit3d', 'circuit3d_day']) {
    await page.selectOption('#showBackdrop', back); await page.waitForTimeout(8000);
    await page.evaluate(() => { if (GC3D.S) { GC3D.S.paused = true; } });
    await page.waitForTimeout(1500);
    const st = await page.evaluate(() => ({back: document.querySelector('#showcase').dataset.back, mounted: !!GC3D.S, look: GC3D.S && GC3D.S.look && GC3D.S.look.name, car: !!(GC3D.S && GC3D.S.car), carFocus: getComputedStyle(document.querySelector('#showCarFocus')).display, focusOn: document.querySelector('#showcase').classList.contains('car-focus')}));
    console.log(back, JSON.stringify(st));
    try { await page.screenshot({path: `tabs610/probe_show5_${back}.png`, timeout: 120000, animations: 'disabled'}); console.log('shot ok'); } catch (e) { console.log('shot failed', String(e).slice(0, 80)); }
  }
  await browser.close(); })();
