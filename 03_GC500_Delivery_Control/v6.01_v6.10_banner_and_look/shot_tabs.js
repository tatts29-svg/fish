const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 1366, height: 768}, deviceScaleFactor: 1})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(4000);
  const tabs = await page.evaluate(() => TABS.map(t => t[0]).filter(k => !TABS_OFF.has(k)));
  console.log(tabs.join(','));
  for (const t of tabs) { await page.evaluate(k => go(k), t); await page.waitForTimeout(1800); await page.screenshot({path: `tabs/${t}.jpg`, quality: 80}); }
  await browser.close(); })();
