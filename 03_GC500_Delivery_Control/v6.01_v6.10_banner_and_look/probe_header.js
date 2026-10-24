const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const w of [1366, 1280, 1024]) {
    const page = await (await browser.newContext({viewport: {width: w, height: 768}})).newPage();
    await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3000);
    const r = await page.evaluate(() => { const q = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right), Math.round(b.width)]; };
      const h = document.querySelector('header.top'); const cs = getComputedStyle(h);
      return {header: [h.clientWidth, cs.display, cs.flexWrap], brand: q('.brand, .brandrow'), search: q('#search, .search, input[type=search]'), cluster: q('#hzcluster'), tools: q('.tools'), tpod: q('#tpod'), cd: q('#hzcd'), td: q('#hztd'), rec: q('#recstrip'), sw: document.documentElement.scrollWidth}; });
    console.log(w, JSON.stringify(r)); await page.context().close();
  }
  await browser.close(); })();
