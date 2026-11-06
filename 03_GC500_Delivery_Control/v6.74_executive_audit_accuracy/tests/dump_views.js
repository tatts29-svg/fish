// the rendered text of every view, as a reader sees it (the auditor's method), to reproduce each finding
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 1363, height: 936}})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load'}); await page.waitForTimeout(2500);
  const tag = process.argv[3] || 'now';
  require('fs').writeFileSync(`audit_text/${tag}_header.txt`, await page.evaluate(() => document.querySelector('header.top').innerText));
  const tabs = await page.evaluate(() => TABS.map(t => t[0]).filter(k => !TABS_OFF.has(k)));
  for (const t of tabs) { await page.evaluate(t => go(t), t); await page.waitForTimeout(1800);
    await page.evaluate(() => document.querySelectorAll('.pane.on details').forEach(d => d.open = true)); await page.waitForTimeout(300);
    require('fs').writeFileSync(`audit_text/${tag}_${t}.txt`, await page.evaluate(() => document.querySelector('.pane.on').innerText)); }
  console.log('dumped', tabs.join(','));
  await browser.close(); })();
