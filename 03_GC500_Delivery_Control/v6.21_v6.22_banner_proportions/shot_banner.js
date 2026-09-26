const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const [name, vp, mobile] of [['1366', {width: 1366, height: 768}, false], ['1024', {width: 1024, height: 768}, false], ['phone', {width: 390, height: 844}, true]]) {
    const page = await (await browser.newContext({viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile})).newPage();
    await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3500);
    if (process.argv[3] === 'sample') await page.evaluate(() => { const f = todayFigures(); f.list = allAssets().filter(a => { try { return !!aerialPointFor(a); } catch (e) { return false; } }).slice(0, 10); f.due = f.list.length; hzMapPins(f); });
    await page.waitForTimeout(500);
    const h = await page.evaluate(() => Math.ceil(document.querySelector('header.top').getBoundingClientRect().height));
    await page.screenshot({path: `tabs610/banner622_${name}.png`, clip: {x: 0, y: 0, width: vp.width, height: Math.min(vp.height, h + 4)}}); console.log(name, 'header', h, 'sw', await page.evaluate(() => document.documentElement.scrollWidth));
    await page.context().close(); }
  await browser.close(); })();
