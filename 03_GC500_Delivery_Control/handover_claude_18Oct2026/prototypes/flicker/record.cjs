/* Flicker recorder (read only). Same routing as toolchain/harness/open_page.js (writes aborted), plus a CDP screencast
   started BEFORE navigation so every painted frame from first paint is kept with its timestamp.
   env: PAGE (html file), OUT (dir), CPU (throttle), IDLE (ms after nav before tab tour, default 90000), SHOTS=1 also
   take a screenshot every 100 ms (slow; off by default - screencast already gives every frame the compositor makes). */
const {chromium, devices} = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const HOST = 'https://gc500-production.up.railway.app';
const DELAY = +(process.env.DELAY_API || 0); const PAGE = process.env.PAGE, OUT = process.env.OUT, CPU = +(process.env.CPU || 4), IDLE = +(process.env.IDLE || 90000);
const TOUR = (process.env.TOUR || 'plant:12000,today:12000,map:15000,plant:10000,today:8000').split(',').map(x => x.split(':')).map(([k, ms]) => [k, +ms]);
fs.mkdirSync(path.join(OUT, 'frames'), {recursive: true});
const INIT = fs.readFileSync(path.join(__dirname, 'init_probe.js'), 'utf8') + (process.env.EXTRA_INIT ? '\n' + fs.readFileSync(process.env.EXTRA_INIT, 'utf8') : '');
(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU'], env: Object.assign({}, process.env, {LANG: 'en_AU.UTF-8', LANGUAGE: 'en_AU'})});
  const ctx = await browser.newContext(Object.assign(process.env.DESK ? {viewport: {width: 1440, height: 900}} : {...devices['iPhone 13'], viewport: {width: 390, height: 844}, deviceScaleFactor: 2}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  const counts = {page: 0, live: 0, blocked: 0};
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) { counts.page++; return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: fs.readFileSync(PAGE)}); }
    const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');
    if (r.method() !== 'GET' && !okPost) { counts.blocked++; return route.abort(); }
    let res; try { counts.live++; if (DELAY && /\/api\//.test(u)) await new Promise(r => setTimeout(r, DELAY)); res = await curlFetch(u, r.headers(), r.method(), r.postData()); } catch (e) { try { return await route.abort('failed'); } catch (_) { return; } }
    try { return await route.fulfill(res); } catch (e) {} });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  const cdp = await ctx.newCDPSession(page);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: CPU});
  const frames = []; let nf = 0;
  cdp.on('Page.screencastFrame', async f => { const id = ++nf; const ts = f.metadata.timestamp; const fn = String(id).padStart(5, '0') + '.jpg';
    fs.writeFile(path.join(OUT, 'frames', fn), Buffer.from(f.data, 'base64'), () => {}); frames.push({id, ts, fn, sy: f.metadata.scrollOffsetY});
    try { await cdp.send('Page.screencastFrameAck', {sessionId: f.sessionId}); } catch (_) {} });
  await cdp.send('Page.startScreencast', {format: 'jpeg', quality: 70, maxWidth: process.env.DESK ? 720 : 390, maxHeight: process.env.DESK ? 450 : 844, everyNthFrame: 1});
  const wall0 = Date.now(); const marks = [];
  const mark = (name) => { marks.push({name, wall: Date.now()}); console.error('MARK', name, ((Date.now() - wall0) / 1000).toFixed(1)); };
  mark('goto');
  await page.goto(HOST + '/v/Coates-GC500-2026/', {waitUntil: 'commit', timeout: 180000});
  const timeOrigin = await page.evaluate(() => performance.timeOrigin).catch(() => null);
  page.waitForEvent('load', {timeout: 240000}).then(() => mark('load')).catch(() => {});
  // wait until IDLE ms after navigation start
  while (Date.now() - wall0 < IDLE) await new Promise(r => setTimeout(r, 1000));
  for (const [k, ms] of TOUR) {
    mark('tab:' + k);
    // click the real tab button the way Andrew does; fall back to go()
    const how = await page.evaluate(k => { window.__fl && window.__fl.ev.push([Math.round(performance.now()), 'TAB-CLICK', k]);
      const b = document.querySelector('#tabs [data-tab="' + k + '"], #tabs [data-k="' + k + '"], #tabs [data-go="' + k + '"]');
      if (b) { b.click(); return 'click'; } go(k); return 'go'; }, k).catch(e => 'err ' + e.message);
    mark('tab:' + k + ':' + how);
    await new Promise(r => setTimeout(r, ms));
  }
  mark('end');
  await cdp.send('Page.stopScreencast').catch(() => {});
  const fl = await page.evaluate(() => window.__fl).catch(e => ({err: e.message}));
  fs.writeFileSync(path.join(OUT, 'log.json'), JSON.stringify({page: PAGE, cpu: CPU, timeOrigin, wall0, marks, frames, fl, errors, counts}, null, 0));
  console.error('frames', frames.length, 'errors', errors.length, 'blocked', counts.blocked);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
