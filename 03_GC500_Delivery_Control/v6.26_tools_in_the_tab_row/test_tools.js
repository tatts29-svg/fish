const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const [name, vp, mobile] of [['1400', {width: 1400, height: 800}, false], ['phone', {width: 390, height: 844}, true]]) {
    const page = await (await browser.newContext({viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile})).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3500);
    const where = await page.evaluate(() => { const t = document.querySelector('.tools'); const r = t.getBoundingClientRect(); return {inTabs: !!t.closest('nav.tabs'), right: Math.round(r.right), top: Math.round(r.top), header: Math.round(document.querySelector('header.top').getBoundingClientRect().height), car: getComputedStyle(document.querySelector('.hzcar')).display, sw: document.documentElement.scrollWidth}; });
    if (mobile) await page.evaluate(() => document.querySelector('nav.tabs').scrollTo({left: 9999}));
    await page.evaluate(() => document.querySelector('#moreBtn').scrollIntoView({inline: 'end'})); await page.click('#moreBtn'); await page.waitForTimeout(500);
    const menu = await page.evaluate(() => { const m = document.querySelector('#moreMenu'); const r = m.getBoundingClientRect(); return {hidden: m.hidden, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), winH: innerHeight, winW: innerWidth, visible: r.width > 0 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1 && r.left >= -1}; });
    await page.screenshot({path: `tabs610/tools626_${name}.png`, clip: {x: 0, y: 0, width: vp.width, height: Math.min(vp.height, where.header + 320)}});
    // switch tabs and confirm Tools survives the rebuild
    await page.keyboard.press('Escape'); await page.evaluate(() => go('plant')); await page.waitForTimeout(800);
    const after = await page.evaluate(() => ({stillInTabs: !!document.querySelector('nav.tabs .tools')}));
    console.log(name, JSON.stringify({where, menu, after, errs})); await page.context().close(); }
  await browser.close(); })();
