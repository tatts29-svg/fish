// v6.32: a device asking for reduced motion (OS setting, or Motion: Off in Tools) still gets the 3D circuit and the car, as a still frame
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  for (const [name, ctxOpts, motionOffPref] of [['phone-os-reduce', {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, reducedMotion: 'reduce'}, false], ['laptop-tools-off', {viewport: {width: 1200, height: 700}}, true]]) {
    const page = await (await browser.newContext(ctxOpts)).newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    if (motionOffPref) await page.addInitScript(() => { try { localStorage.setItem('gc500.motion', 'off'); } catch (e) {} });
    await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
    await page.click('#showStart'); await page.waitForTimeout(1500);
    await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
    const s = await page.evaluate(() => ({motionOff: motionOff(), reduced: SHOW.reduced, back: document.querySelector('#showcase').dataset.back, mounted: !!GC3D.S, paused: GC3D.S && GC3D.S.paused, car: !!(GC3D.S && GC3D.S.car), failed: GC3D.failed, state: document.querySelector('#showState').textContent, pauseBtn: document.querySelector('#showPause').textContent}));
    console.log(name, JSON.stringify(s), 'errors', errs.slice(0, 3));
    await page.selectOption('#showBackdrop', 'circuit'); await page.waitForTimeout(1500);
    console.log(name, 'flat circuit under reduced motion:', JSON.stringify(await page.evaluate(() => ({raf: LAPS.raf, mounted: !!GC3D.S}))));
    await page.selectOption('#showBackdrop', 'circuit3d'); await page.waitForTimeout(9000);
    try { await page.screenshot({path: `tabs610/v632_${name}.png`, timeout: 120000, animations: 'disabled'}); console.log('shot ok'); } catch (e) { console.log('shot failed', String(e).slice(0, 80)); }
    await page.context().close(); }
  await browser.close(); })();
