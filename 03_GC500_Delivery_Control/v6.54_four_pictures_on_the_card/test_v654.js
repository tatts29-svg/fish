// v6.54: every card carries four picture places; the plan and aerial crops load; photographs fill the right places
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const [name, vp, mobile] of [['1400', {width: 1400, height: 1000}, false], ['phone', {width: 390, height: 844}, true]]) {
    const page = await (await browser.newContext({viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1})).newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/503/.test(m.text())) errs.push(m.text().slice(0, 160)); });
    await page.goto(process.argv[2] + '#day/2026-09-28', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(4000);
    const info = await page.evaluate(() => { const cards = [...document.querySelectorAll('#pane-timeline .dcard')];
      return {cards: cards.length, pics: cards.map(c => [...c.querySelectorAll('.dcpic')].map(p => (p.classList.contains('empty') ? 'empty:' : 'pic:') + p.querySelector('em').textContent)).slice(0, 4),
        imgs: [...document.querySelectorAll('.dcpic img')].length, loaded: [...document.querySelectorAll('.dcpic img')].filter(i => i.complete && i.naturalWidth > 0).length,
        srcs: [...new Set([...document.querySelectorAll('.dcpic img')].map(i => i.src.replace(/^.*\/m\/[^/]+\//, 'm/').slice(0, 30)))].slice(0, 4), sw: document.documentElement.scrollWidth}; });
    console.log(name, JSON.stringify(info));
    await page.evaluate(() => { const c = document.querySelector('#pane-timeline .dcard'); c.scrollIntoView({block: 'start'}); window.scrollBy(0, -8); }); await page.waitForTimeout(1500);
    const box = await page.evaluate(() => { const r = document.querySelector('#pane-timeline .dcard').getBoundingClientRect(); return {y: Math.max(0, r.top - 4), h: Math.min(r.height + 8, innerHeight)}; });
    await page.screenshot({path: `tabs610/dcard654_${name}.png`, clip: {x: 0, y: box.y, width: vp.width, height: box.h}});
    console.log(name, 'errors', errs.slice(0, 4));
    await page.context().close(); }
  await browser.close(); })();
