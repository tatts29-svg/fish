// per tab: JS render time vs style+layout time, element count
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const mode = process.argv[3] || 'desk';
  const ctx = await browser.newContext({viewport: mode === 'phone' ? {width: 390, height: 844} : {width: 1280, height: 800}, isMobile: mode === 'phone', hasTouch: mode === 'phone'});
  const page = await ctx.newPage(); await page.goto(process.argv[2], {waitUntil: 'load'}); await page.waitForTimeout(2500);
  const tabs = await page.evaluate(() => [...document.querySelectorAll('#tabs [data-tab]')].map(b => b.dataset.tab));
  for (const t of tabs.concat(['today'])) {
    const r = await page.evaluate(t => { const a = performance.now(); go(t); const b = performance.now(); document.body.offsetHeight; const c = performance.now();
      const p = document.querySelector('#pane-' + t); return {t, js: Math.round(b - a), layout: Math.round(c - b), els: p ? p.getElementsByTagName('*').length : -1, total: document.getElementsByTagName('*').length}; }, t);
    console.log(mode, JSON.stringify(r)); await page.waitForTimeout(1200);
  }
  await browser.close(); })();
