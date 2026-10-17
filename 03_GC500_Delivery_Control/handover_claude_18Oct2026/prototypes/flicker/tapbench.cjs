/* Tab press to page shown, no screencast (so frame capture does not cost anything). env PAGE, CPU, TABS (comma list). */
const {chromium, devices} = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const PAGE = process.env.PAGE, CPU = +(process.env.CPU || 4), TABS = (process.env.TABS || 'timeline,today,plant,today').split(',');
(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU']});
  const ctx = await browser.newContext(Object.assign({...devices['iPhone 13'], viewport: {width: 390, height: 844}, deviceScaleFactor: 2}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8'}, body: fs.readFileSync(PAGE)});
    if (r.method() !== 'GET' && !(r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession'))) return route.abort();
    try { return await route.fulfill(await curlFetch(u, r.headers(), r.method(), r.postData())); } catch (e) { try { await route.abort('failed'); } catch (_) {} } });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: CPU});
  const t0 = Date.now();
  await page.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/', {waitUntil: 'load', timeout: 240000});
  await page.waitForFunction(() => document.documentElement.getAttribute('data-refresh904') === 'ready', null, {timeout: 240000, polling: 500});
  const readyWall = Date.now() - t0;
  await page.waitForTimeout(20000);
  const out = {page: PAGE.split('/').pop(), readyWall, taps: []};
  for (const k of TABS) {
    const r = await page.evaluate(k => new Promise(res => { const b = document.querySelector('#tabs [data-tab="' + k + '"]'); const t = performance.now(); b.click();
      const check = () => { const p = document.getElementById('pane-' + k); if (p && p.offsetHeight > 0 && state.tab === k) requestAnimationFrame(() => res(Math.round(performance.now() - t))); else setTimeout(check, 16); }; setTimeout(check, 0); }), k);
    out.taps.push([k, r]); await page.waitForTimeout(6000);
  }
  console.log(JSON.stringify(out));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
