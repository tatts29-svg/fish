const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 1366, height: 768}, deviceScaleFactor: 2})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3000);
  const c = await page.evaluate(() => { const r = document.querySelector('#hzcluster').getBoundingClientRect(); return {x: r.left - 8, y: r.top - 8, width: r.width + 16, height: r.height + 16}; });
  await page.screenshot({path: 'tabs610/cluster_zoom.png', clip: c}); console.log(JSON.stringify(c)); await browser.close(); })();
