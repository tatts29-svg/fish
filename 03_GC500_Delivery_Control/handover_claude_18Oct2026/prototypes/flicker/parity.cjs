/* Parity: innerText of every tab pane, the header and the footer, plus the banner's markup, after the record is drawn.
   env PAGE, OUT (json), MOB=1 for the phone. Read only (writes aborted). */
const {chromium, devices} = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const PAGE = process.env.PAGE, OUT = process.env.OUT, MOB = process.env.MOB === '1';
(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU']});
  const ctx = await browser.newContext(Object.assign(MOB ? {...devices['iPhone 13'], viewport: {width: 390, height: 844}, deviceScaleFactor: 2} : {viewport: {width: 1440, height: 900}}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  let blocked = 0;
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8'}, body: fs.readFileSync(PAGE)});
    if (r.method() !== 'GET' && !(r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession'))) { blocked++; return route.abort(); }
    try { return await route.fulfill(await curlFetch(u, r.headers(), r.method(), r.postData())); } catch (e) { try { await route.abort('failed'); } catch (_) {} } });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  await page.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/', {waitUntil: 'load', timeout: 180000});
  await page.waitForFunction(() => document.documentElement.getAttribute('data-refresh904') === 'ready', null, {timeout: 180000});
  await page.waitForTimeout(4000);
  const norm = s => String(s || '').replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, 'HH:MM').replace(/\s+/g, ' ').trim();
  const out = {errors, tabs: {}};
  out.header = norm(await page.evaluate(() => document.querySelector('header.top').innerText));
  out.banner = await page.evaluate(() => { const b = document.getElementById('ts1053-banner'); return b ? b.outerHTML + ' @' + [...b.parentNode.children].indexOf(b) + ' next=' + (b.nextElementSibling || {}).id : null; });
  out.tabbar = await page.evaluate(() => document.getElementById('tabs').outerHTML.replace(/\s+/g, ' '));
  const keys = await page.evaluate(() => TABS.map(t => t[0]));
  for (const k of keys) {
    try {
      await page.evaluate(k => go(k), k);
      await page.waitForTimeout(1500);
      out.tabs[k] = norm(await page.evaluate(k => { const p = document.getElementById('pane-' + k) || document.querySelector('main .pane.on'); return p ? p.innerText : ''; }, k));
    } catch (e) { out.tabs[k] = 'ERR ' + e.message.slice(0, 100); }
  }
  out.foot = norm(await page.evaluate(() => (document.querySelector('footer.foot') || {}).innerText));
  out.htmlClass = await page.evaluate(() => document.documentElement.className);
  out.blocked = blocked;
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log('tabs', Object.keys(out.tabs).length, 'errors', errors.length, 'blocked', blocked);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
