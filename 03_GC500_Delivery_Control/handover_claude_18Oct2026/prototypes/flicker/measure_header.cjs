/* Header geometry: static HTML+CSS only (JS off = what the first paint shows before the 9.8 MB script runs) vs the
   finished page (JS on, after the record is drawn). env PAGE, JS=0|1, W (default 390). Read only, writes aborted. */
const {chromium, devices} = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const PAGE = process.env.PAGE, JS = process.env.JS !== '0', W = +(process.env.W || 390), H = +(process.env.H || 844);
(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU']});
  const phone = W < 700;
  const ctx = await browser.newContext(Object.assign(phone ? {...devices['iPhone 13'], viewport: {width: W, height: H}, deviceScaleFactor: 2} : {viewport: {width: W, height: H}}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane', javaScriptEnabled: JS}));
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8'}, body: fs.readFileSync(PAGE)});
    if (r.method() !== 'GET' && !(r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession'))) return route.abort();
    try { return await route.fulfill(await curlFetch(u, r.headers(), r.method(), r.postData())); } catch (e) { try { await route.abort('failed'); } catch (_) {} } });
  const page = await ctx.newPage();
  await page.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/', {waitUntil: 'load', timeout: 180000});
  if (!JS && process.env.CLS0) await page.evaluate(c => document.documentElement.classList.add(...c.split(',')), process.env.CLS0).catch(e => console.error('eval', e.message));
  if (JS) { await page.waitForFunction(() => document.documentElement.getAttribute('data-refresh904') === 'ready', null, {timeout: 180000}); await page.waitForTimeout(3000); }
  const out = await page.evaluate(() => { const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), cs.display === 'none' ? 'none' : '']; };
    const o = {}; ['#hzcdLab', '#hzcd .num', '#hzcdN', '#hzcdT', '#hzrail', '#tpodOpen', '.tpk', '#tpodNum', '#recstrip > *', 'header.top', '.brandrow', '.lockup', '.brandrow > .tools', '#tabs .tools', '#searchBtn', '#hzcluster', '#hzshift', '#tpod', '#tpodDate', '#hzcd', '#hzcdSub', '#hztd', '#recstrip', '#ts1053-banner', '#tabs', 'main', 'footer.foot', '#foot', '#refresh904', '#hzmap'].forEach(s => o[s] = R(s));
    o.font = getComputedStyle(document.querySelector('#tpodNum')).fontFamily; o.fontsReady = [...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.status).join(', ');
    o.footText = (document.querySelector('footer.foot') || {}).innerText; return o; });
  console.log(JSON.stringify(out, null, 0).replace(/\],/g, '],\n'));
  if (process.env.SHOT) await page.screenshot({path: process.env.SHOT, clip: {x: 0, y: 0, width: W, height: Math.min(H, 420)}});
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
