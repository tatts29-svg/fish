// v6.40: the delivery cards on the one-day view - drawn for every due-in row, controls wired, no script errors; table stays on Every day
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const [name, vp, mobile] of [['1400', {width: 1400, height: 1000}, false], ['phone', {width: 390, height: 844}, true]]) {
    const page = await (await browser.newContext({viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1})).newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
    // a day with deliveries: 28 Sep has 10 due in
    await page.goto(process.argv[2] + '#day/2026-09-28', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3500);
    const info = await page.evaluate(() => { const cards = [...document.querySelectorAll('#pane-timeline .dcard')];
      const c = cards[0]; return {cards: cards.length, tables: document.querySelectorAll('#pane-timeline table.daytbl').length, maps: document.querySelectorAll('.dcmap').length, photos: document.querySelectorAll('.dcshots img').length,
        first: c ? {key: c.dataset.dckey, plate: c.querySelector('.dcref').textContent.trim(), type: c.querySelector('.dctype').textContent, loc: c.querySelector('.dcloc b').textContent, lamps: c.querySelectorAll('[data-light]').length, done: !!c.querySelector('[data-done]'), next: !!c.querySelector('[data-nextday]'), eta: !!c.querySelector('[data-eta]'), note: !!c.querySelector('[data-dnote]'), pct: (c.querySelector('.dcpct') || {}).textContent, hist: c.querySelectorAll('.dchl li').length, h: Math.round(c.getBoundingClientRect().height)} : null,
        sw: document.documentElement.scrollWidth}; });
    console.log(name, JSON.stringify(info));
    // Every day keeps the table
    await page.evaluate(() => document.querySelector('#pane-timeline [data-view="agenda"]').click()); await page.waitForTimeout(1500);
    console.log(name, 'agenda cards/tables', JSON.stringify(await page.evaluate(() => ({cards: document.querySelectorAll('#pane-timeline .dcard').length, tables: document.querySelectorAll('#pane-timeline table.daytbl').length}))));
    await page.evaluate(() => document.querySelector('#pane-timeline [data-view="day"]').click()); await page.waitForTimeout(1500);
    await page.evaluate(() => { const c = document.querySelector('#pane-timeline .dcard'); if (c) c.scrollIntoView({block: 'start'}); window.scrollBy(0, -8); }); await page.waitForTimeout(600);
    const box = await page.evaluate(() => { const c = document.querySelector('#pane-timeline .dcard'); const r = c.getBoundingClientRect(); return {y: Math.max(0, r.top - 4), h: Math.min(r.height + 8, innerHeight)}; });
    await page.screenshot({path: `tabs610/dcard640_${name}.png`, clip: {x: 0, y: box.y, width: vp.width, height: box.h}});
    console.log(name, 'errors', errs.slice(0, 4));
    await page.context().close(); }
  await browser.close(); })();
