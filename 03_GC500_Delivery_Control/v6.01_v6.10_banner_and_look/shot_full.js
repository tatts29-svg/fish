const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 1366, height: 768}})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(4000);
  for (const t of process.argv[3].split(',')) { await page.evaluate(k => go(k), t); await page.waitForTimeout(2000);
    const h = await page.evaluate(() => document.querySelector('main').scrollHeight);
    await page.setViewportSize({width: 1366, height: Math.min(h + 400, 6000)}); await page.waitForTimeout(800);
    await page.screenshot({path: `tabs/full_${t}.jpg`, quality: 70, fullPage: true}); await page.setViewportSize({width: 1366, height: 768}); }
  await browser.close(); })();
