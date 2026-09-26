// v6.33: with Motion: Off stored, the showcase names the cause and its button turns motion on and runs the lap; with the OS asking, it says so and offers no override
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  for (const [name, ctxOpts, offPref] of [['phone-tools-off', {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}, true], ['phone-os-reduce', {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, reducedMotion: 'reduce'}, false]]) {
    const page = await (await browser.newContext(ctxOpts)).newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    if (offPref) await page.addInitScript(() => { try { localStorage.setItem('gc500.motion', 'off'); } catch (e) {} });
    await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
    await page.click('#showStart'); await page.waitForTimeout(7000);
    const a = await page.evaluate(() => ({state: document.querySelector('#showState').textContent, btnHidden: document.querySelector('#showMotionOn').hidden, reduced: SHOW.reduced, mounted: !!GC3D.S, paused: GC3D.S && GC3D.S.paused}));
    console.log(name, 'before', JSON.stringify(a));
    if (!a.btnHidden) { await page.evaluate(() => document.querySelector('#showMotionOn').click()); await page.waitForTimeout(3000);
      const b = await page.evaluate(() => ({state: document.querySelector('#showState').textContent, btnHidden: document.querySelector('#showMotionOn').hidden, reduced: SHOW.reduced, playing: SHOW.playing, paused: GC3D.S && GC3D.S.paused, pref: localStorage.getItem('gc500.motion'), toolsBtn: document.querySelector('#motionBtn').textContent}));
      console.log(name, 'after', JSON.stringify(b)); }
    console.log(name, 'errors', errs.slice(0, 3));
    await page.evaluate(() => { if (GC3D.S) GC3D.S.paused = true; }); await page.waitForTimeout(800);
    try { await page.screenshot({path: `tabs610/v633_${name}.png`, timeout: 120000, animations: 'disabled'}); } catch (e) { console.log('shot failed'); }
    await page.context().close(); }
  await browser.close(); })();
