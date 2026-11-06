const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext()).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load'}); await page.waitForTimeout(2000);
  console.log(JSON.stringify(await page.evaluate(() => holdAssets(() => { const m = moneySummary(todayIso());
    return {categories: m.categories, servicing: m.servicing, streams: (m.streams || []).map(s => ({k: s.key || s.name, charge: s.charge, cost: s.cost})), missing: m.missing_short, caveats: m.caveats_short, breakeven: m.breakeven, breakeven_hours: m.breakeven_hours}; })), null, 1).slice(0, 6000));
  await browser.close(); })();
