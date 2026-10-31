const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const w of [1024, 1100, 1180, 1280]) { const page = await (await browser.newContext({viewport: {width: w, height: 768}})).newPage();
    await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3000);
    const r = await page.evaluate(W => { const out = []; for (const el of document.querySelectorAll('header *')) { const b = el.getBoundingClientRect(); if (b.right > W + 1 && b.width > 0 && b.width < 3000) out.push(el.tagName + '.' + String(el.className).slice(0, 24) + ' r=' + Math.round(b.right) + ' w=' + Math.round(b.width)); } return {sw: document.documentElement.scrollWidth, wide: out.slice(0, 8)}; }, w);
    console.log(w, JSON.stringify(r)); await page.context().close(); }
  await browser.close(); })();
