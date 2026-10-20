const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const w of [1366, 1024]) { const page = await (await browser.newContext({viewport: {width: w, height: 768}})).newPage();
    await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3000);
    const h = await page.evaluate(() => document.querySelector('header.top').getBoundingClientRect().height);
    await page.screenshot({path: `tabs610/header_${w}.png`, clip: {x: 0, y: 0, width: w, height: Math.ceil(h) + 4}}); console.log(w, 'header height', h); await page.context().close(); }
  await browser.close(); })();
