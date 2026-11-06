/* does the first-time milestone celebration still fire, with the same areas? (cpu 1, phone) */
const {chromium, devices} = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
(async () => { const PAGE = process.env.PAGE;
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const ctx = await browser.newContext(Object.assign({...devices['iPhone 13'], viewport: {width: 390, height: 844}, deviceScaleFactor: 2}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8'}, body: fs.readFileSync(PAGE)});
    if (r.method() !== 'GET' && !(r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession'))) return route.abort();
    try { return await route.fulfill(await curlFetch(u, r.headers(), r.method(), r.postData())); } catch (e) { try { await route.abort('failed'); } catch (_) {} } });
  await ctx.addInitScript(() => { window.__burst = 0; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('ms1026-screen')) window.__burst++; }))).observe(document, {childList: true, subtree: true}); });
  const page = await ctx.newPage();
  await page.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/', {waitUntil: 'load', timeout: 180000});
  await page.waitForFunction(() => document.documentElement.getAttribute('data-refresh904') === 'ready', null, {timeout: 180000});
  await page.waitForTimeout(8000);
  console.log(JSON.stringify(await page.evaluate(() => ({page: location.pathname, bursts: window.__burst, seen: MS1025.seen(), unseenAfter: MS1026.unseenNow().length, banner: (document.getElementById('ms1026') || {}).innerText}))));
  await browser.close(); })();
