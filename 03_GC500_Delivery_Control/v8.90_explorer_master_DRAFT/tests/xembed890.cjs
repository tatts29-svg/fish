// Author: Andrew Fisher. Opens a GC500 build in headless Chromium AT THE LIVE ADDRESS, reading the live record without
// touching it (toolchain/harness/open_page.js), and serves the Map explorer's files from local folders:
//   CODE=<folder with index.html, explorer.js, ...>   ASSETS=<folder with drawing-scene.bin, vt/, underlay/, ...>
// Byte-range requests (the tile pyramid) are honoured. Every write the page tries (PUT, POST, DELETE) is still aborted.
const {chromium, devices} = require('playwright'); const fs = require('fs'), path = require('path');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const XB = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/', HOST = 'https://gc500-production.up.railway.app';
const TYPES = {'.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.bin': 'application/octet-stream', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg'};
async function open({pageFile, hash = '', W = 1440, H = 900, dpr = 1, mobile = false, gl = false}) {
  const launch = {args: gl ? ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--no-sandbox', '--lang=en-AU'], env: Object.assign({}, process.env, {LANG: 'en_AU.UTF-8', LANGUAGE: 'en_AU'})};
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext(Object.assign(mobile ? {...devices['iPhone 13'], viewport: {width: W, height: H}, deviceScaleFactor: dpr} : {viewport: {width: W, height: H}, deviceScaleFactor: dpr}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  const counts = {page: 0, live: 0, blocked: 0, local: 0, ranges: 0, missing: [], localPaths: new Set(), liveExplorer: 0};
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (u.startsWith(XB)) {
      const rel = decodeURIComponent(u.slice(XB.length).split('?')[0].split('#')[0]) || 'index.html';
      const f = rel.startsWith('assets/') ? (process.env.ASSETS ? path.join(process.env.ASSETS, rel.slice(7)) : null) : (process.env.CODE ? path.join(process.env.CODE, rel) : null);
      if (f && fs.existsSync(f) && fs.statSync(f).isFile()) {
        counts.local++; counts.localPaths.add(rel); const buf = fs.readFileSync(f), ct = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
        const range = /^bytes=(\d+)-(\d*)$/.exec(r.headers()['range'] || '');
        if (range) { counts.ranges++; const a = +range[1], b = range[2] ? Math.min(+range[2], buf.length - 1) : buf.length - 1;
          return route.fulfill({status: 206, headers: {'content-type': ct, 'content-range': `bytes ${a}-${b}/${buf.length}`, 'accept-ranges': 'bytes', 'cache-control': 'no-store'}, body: buf.subarray(a, b + 1)}); }
        return route.fulfill({status: 200, headers: {'content-type': ct, 'accept-ranges': 'bytes', 'cache-control': 'no-store'}, body: buf});
      }
      if (f) counts.missing.push(rel);          // a local set was asked for and lacks this file: it falls through to live, and is reported
      counts.liveExplorer++;
    }
    if (pageFile && r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) { counts.page++; return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: fs.readFileSync(pageFile)}); }
    const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');
    if (r.method() !== 'GET' && !okPost) { counts.blocked++; return route.abort(); }
    let res; try { counts.live++; res = await curlFetch(u, r.headers(), r.method(), r.postData()); } catch (e) { if (process.env.GC500_DEBUG) console.error('FETCHFAIL', u.slice(0, 120), String(e && e.message).slice(-240).replace(/\n/g, ' ')); try { return await route.abort('failed'); } catch (_) { return; } }
    try { return await route.fulfill(res); } catch (e) { if (process.env.GC500_DEBUG) console.error('FULFILLFAIL', u.slice(0, 120), String(e && e.message).slice(0, 200)); } });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  const consoleErrors = []; page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  const badResponses = []; page.on('response', r => { if (r.status() >= 400) badResponses.push(r.status() + ' ' + r.url().slice(0, 160)); });
  counts.badResponses = badResponses;
  await page.goto(HOST + '/v/Coates-GC500-2026/' + hash, {waitUntil: 'load', timeout: 180000}); return {browser, page, errors, consoleErrors, counts};
}
/* the dashboard's Map tab with the explorer ready inside it */
async function openMap(opts = {}) {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('map')); const fh = await p.waitForSelector('#pane-map iframe', {timeout: 30000}); const f = await fh.contentFrame();
  await f.waitForFunction(() => window.GC500Explorer && GC500Explorer.state && GC500Explorer.state.ready && window.__ready, null, {timeout: 150000});
  await p.waitForTimeout(opts.settle || 3000);
  return Object.assign(s, {f, fh, MOB});
}
module.exports = {open, openMap};
