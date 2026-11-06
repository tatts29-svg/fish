const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 1280, height: 800}})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load'}); await page.waitForTimeout(2000);
  const tab = process.argv[3], sel = process.argv[4];
  await page.evaluate(t => go(t), tab); await page.waitForTimeout(1500);
  console.log(await page.evaluate(sel => [...document.querySelectorAll(sel)].map(e => '### ' + e.innerText.replace(/\n{2,}/g, '\n')).join('\n\n').slice(0, 9000), sel));
  await browser.close(); })();
