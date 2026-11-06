const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(4000); await page.evaluate(t => go(t), 'fencing'); await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const b = document.querySelector('main button.day'); const chain = []; let p = b && b.parentElement; for (let i = 0; p && i < 4; i++, p = p.parentElement) { const cs = getComputedStyle(p); chain.push({tag: p.tagName, cls: String(p.className).slice(0, 40), ox: cs.overflowX, disp: cs.display, w: p.clientWidth, sw: p.scrollWidth, flexWrap: cs.flexWrap}); }
    const card = document.querySelector('.hzcluster .num'); const cardHtml = card ? card.parentElement.outerHTML.replace(/\s+/g, ' ').slice(0, 900) : null;
    const cl = card ? [card.parentElement.className, card.parentElement.clientWidth, card.parentElement.scrollWidth, getComputedStyle(card.parentElement).overflow] : null;
    return {dayChain: chain, dayHtml: b ? b.outerHTML.replace(/\s+/g, ' ').slice(0, 300) : null, cardHtml, cl};
  });
  console.log(JSON.stringify(info)); await browser.close(); })();
