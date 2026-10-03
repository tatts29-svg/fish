// typing into search on each tab: time from key to the next painted frame, and the settle redraw's long task
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({type: 'longtask', buffered: true}); } catch (e) {} });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(process.argv[2], {waitUntil: 'load'}); await page.waitForTimeout(2500);
  for (const tab of ['today', 'plant', 'map', 'timeline', 'progress']) {
    await page.evaluate(t => go(t), tab); await page.waitForTimeout(1500); await page.evaluate(() => window.__lt.splice(0));
    await page.focus('#q'); const keys = [];
    for (const ch of 'WC12') { const t0 = Date.now(); await page.keyboard.type(ch); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); keys.push(Date.now() - t0); await page.waitForTimeout(60); }
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => ({finder: [...document.querySelectorAll('#finder [role=option]')].length, first: ((document.querySelector('#finder [role=option]') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 60), lt: window.__lt.splice(0)}));
    const t1 = Date.now(); await page.click('#qx').catch(() => {}); await page.waitForTimeout(700);
    console.log(tab, JSON.stringify({keys, ...r, clear: await page.evaluate(() => window.__lt.splice(0))}));
  }
  console.log('errors', JSON.stringify(errs)); await browser.close(); })();
