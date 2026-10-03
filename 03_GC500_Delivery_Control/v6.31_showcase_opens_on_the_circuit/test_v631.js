// v6.31: a fresh browser opens the showcase on the 3D night circuit with the car; Tools carries Start showcase on every tab
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  for (const [name, vp, mobile] of [['1400', {width: 1400, height: 900}, false], ['phone', {width: 390, height: 844}, true]]) {
    const page = await (await browser.newContext({viewport: vp, isMobile: mobile, hasTouch: mobile})).newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(process.argv[2] + '#timeline', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
    const r = await page.evaluate(() => { document.querySelector('#moreBtn').click(); const b = document.querySelector('#showcaseBtn'); const vis = b && b.getBoundingClientRect().height > 0; if (b) b.click();
      return {btn: !!b, vis, menuClosed: document.querySelector('#moreMenu').hidden, open: !document.querySelector('#showcase').hidden}; });
    await page.waitForTimeout(7000);
    const s = await page.evaluate(() => ({back: document.querySelector('#showcase').dataset.back, sel: document.querySelector('#showBackdrop').value, mounted: !!GC3D.S, car: !!(GC3D.S && GC3D.S.car), failed: GC3D.failed, stored: localStorage.getItem('gc500.showback')}));
    console.log(name, JSON.stringify(r), JSON.stringify(s), 'errors', errs.slice(0, 3));
    await page.context().close(); }
  await browser.close(); })();
