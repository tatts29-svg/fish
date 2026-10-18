// Copy of toolchain/harness/open_page.js open() with one addition: `before(page, cdp)` runs before navigation so a
// CPU profile / coverage can cover the page load. Routing is IDENTICAL: page file served at the live address, every
// other request a GET through curlFetch, EVERY write aborted.
const {chromium, devices} = require('playwright'); const fs = require('fs'); const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch');
const HOST = 'https://gc500-production.up.railway.app';
async function open({pageFile, hash = '', W = 1440, H = 900, dpr = 1, mobile = false, init = '', cpu = 0, before = null}) {
  const launch = {args: ['--no-sandbox', '--lang=en-AU'], env: Object.assign({}, process.env, {LANG: 'en_AU.UTF-8', LANGUAGE: 'en_AU'})};
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext(Object.assign(mobile ? {...devices['iPhone 13'], viewport: {width: W, height: H}, deviceScaleFactor: dpr} : {viewport: {width: W, height: H}, deviceScaleFactor: dpr}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  const counts = {page: 0, live: 0, blocked: 0};
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (pageFile && r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) { counts.page++; return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: fs.readFileSync(pageFile)}); }
    const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');
    if (r.method() !== 'GET' && !okPost) { counts.blocked++; return route.abort(); }
    let res; try { counts.live++; res = await curlFetch(u, r.headers(), r.method(), r.postData()); } catch (e) { try { return await route.abort('failed'); } catch (_) { return; } } try { return await route.fulfill(res); } catch (e) {} });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage(); const errors = [];
  const cdp = await ctx.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: cpu});
  page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  if (before) await before(page, cdp);
  await page.goto(HOST + '/v/Coates-GC500-2026/' + hash, {waitUntil: 'load', timeout: 300000}); return {browser, page, errors, counts, cdp};
}
module.exports = {open};
