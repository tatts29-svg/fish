/* time to the record on screen (data-refresh904 = ready) and main-thread long-task time before it; no screencast */
const {chromium, devices} = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const PAGE = process.env.PAGE, CPU = +(process.env.CPU || 4);
(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU']});
  const ctx = await browser.newContext(Object.assign({...devices['iPhone 13'], viewport: {width: 390, height: 844}, deviceScaleFactor: 2}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8'}, body: fs.readFileSync(PAGE)});
    if (r.method() !== 'GET' && !(r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession'))) return route.abort();
    try { return await route.fulfill(await curlFetch(u, r.headers(), r.method(), r.postData())); } catch (e) { try { await route.abort('failed'); } catch (_) {} } });
  await ctx.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push([e.startTime, e.duration]))).observe({type: 'longtask', buffered: true}); } catch (e) {}
    const sa = Element.prototype.setAttribute; window.__ready = null; Element.prototype.setAttribute = function (n, v) { if (n === 'data-refresh904' && v === 'ready' && window.__ready == null) window.__ready = performance.now(); return sa.apply(this, arguments); }; });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: CPU});
  await page.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/', {waitUntil: 'load', timeout: 240000});
  await page.waitForFunction(() => window.__ready != null, null, {timeout: 240000, polling: 500});
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => ({ready: Math.round(window.__ready), ltBefore: Math.round(window.__lt.filter(x => x[0] < window.__ready).reduce((a, b) => a + b[1], 0))}));
  console.log(JSON.stringify({page: PAGE.split('/').pop(), ...r}));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
