// Author: Andrew Fisher. Copy of toolchain/harness/open_page.js that can also serve the Map explorer's files from a local folder (LOCAL=dir); every write is still aborted.
// Open a GC500 build in headless Chromium AT THE LIVE ADDRESS, reading the live record, without touching it.
// The page itself is served from the local build file; every other request is a GET to the live service through curl.
// Every write the page tries (PUT, POST, DELETE) is ABORTED, so a test can never change the live record.
//
//   const {open} = require('./open_page');
//   const s = await open({pageFile: 'build/GC500_v7.44/GC500_Delivery_Control_hosted.html', mobile: true, W: 390, H: 844, dpr: 2});
//   ... s.page (Playwright page), s.errors (page errors), s.counts ...; await s.browser.close();
//
// Chromium: set CHROMIUM_PATH to a browser binary, or let Playwright use the one `npx playwright install chromium` put down.
const {chromium, devices} = require('playwright'); const fs = require('fs'); const {curlFetch} = require('../../toolchain/harness/curlfetch');
const XB = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/';
const HOST = 'https://gc500-production.up.railway.app';
async function open({pageFile, hash = '', W = 1440, H = 900, dpr = 1, mobile = false, gl = false}) {
  const launch = {args: gl ? ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--no-sandbox', '--lang=en-AU'],
    env: Object.assign({}, process.env, {LANG: 'en_AU.UTF-8', LANGUAGE: 'en_AU'})};
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext(Object.assign(mobile ? {...devices['iPhone 13'], viewport: {width: W, height: H}, deviceScaleFactor: dpr} : {viewport: {width: W, height: H}, deviceScaleFactor: dpr}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  const counts = {page: 0, live: 0, blocked: 0};
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (process.env.LOCAL && u.startsWith(XB)) { const rel = decodeURIComponent(u.slice(XB.length).split('?')[0].split('#')[0]) || 'index.html'; const f = require('path').join(process.env.LOCAL, rel); if (fs.existsSync(f) && fs.statSync(f).isFile()) { counts.local = (counts.local||0)+1; const ext = require('path').extname(f); const ct = {'.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8'}[ext] || 'application/octet-stream'; return route.fulfill({status: 200, headers: {'content-type': ct, 'cache-control': 'no-store'}, body: fs.readFileSync(f)}); } }
    if (pageFile && r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) { counts.page++; return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: fs.readFileSync(pageFile)}); }
    const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');
    if (r.method() !== 'GET' && !okPost) { counts.blocked++; return route.abort(); }
    let res; try { counts.live++; res = await curlFetch(u, r.headers(), r.method(), r.postData()); } catch (e) { if (process.env.GC500_DEBUG) console.error('FETCHFAIL', u.slice(0, 120), String(e && e.message).slice(-240).replace(/\n/g, ' ')); try { return await route.abort('failed'); } catch (_) { return; } } try { return await route.fulfill(res); } catch (e) { if (process.env.GC500_DEBUG) console.error('FULFILLFAIL', u.slice(0, 120), String(e && e.message).slice(0, 200)); } });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  await page.goto(HOST + '/v/Coates-GC500-2026/' + hash, {waitUntil: 'load', timeout: 180000}); return {browser, page, errors, counts};
}
module.exports = {open};
