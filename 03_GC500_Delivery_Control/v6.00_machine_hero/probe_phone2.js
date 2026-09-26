const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(4000); await page.evaluate(t => go(t), process.argv[3] || 'fencing'); await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const wide = []; for (const el of document.querySelectorAll('main *')) { if (el.closest('.tblwrap')) continue; const r = el.getBoundingClientRect(); if (r.right > 392 && r.width > 0) wide.push(el.tagName + '.' + String(el.className).slice(0, 30) + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width)); }
    const clock = [...document.querySelectorAll('header *, .brandrow *, .hzbanner *')].filter(e => e.children.length === 0 && /\d\d:\d\d/.test(e.textContent)).map(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const p = e.parentElement; return {tag: e.tagName, cls: e.className, text: e.textContent.trim(), fs: cs.fontSize, w: Math.round(r.width), sw: e.scrollWidth, parent: p.className, pw: p.clientWidth, psw: p.scrollWidth, pov: getComputedStyle(p).overflow}; });
    return {wide: wide.slice(0, 12), clock};
  });
  console.log(JSON.stringify(info)); await browser.close(); })();
