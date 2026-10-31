const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true})).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(4000);
  await page.screenshot({path: 'tabs610/phone_today.png'});
  await page.evaluate(() => go('timeline')); await page.waitForTimeout(1800); await page.screenshot({path: 'tabs610/phone_timeline.png'});
  const sw = await page.evaluate(() => ({doc: document.documentElement.scrollWidth, main: document.querySelector('main').scrollWidth, pod: (() => { const p = document.querySelector('#hztd'); const r = p.getBoundingClientRect(); return {w: Math.round(r.width), right: Math.round(r.right), h: Math.round(r.height)}; })()}));
  console.log(JSON.stringify({sw, errs})); await browser.close(); })();
