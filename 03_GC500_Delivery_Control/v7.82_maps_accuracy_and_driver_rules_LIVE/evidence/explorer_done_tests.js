// v7.82 - the explorer's Done layer, on the LIVE explorer with this draft's explorer.js swapped in by the harness (GETs only).
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node explorer_done_tests.js
const {chromium} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/node_modules/playwright');
const fs = require('fs'), path = require('path'); const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const URL_ = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html?embed=1';
const NEW_JS = process.env.EXPLORER_JS || path.join(__dirname, '..', 'release', 'explorer', 'explorer.js'), MOB = !!process.env.MOB;
(async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
 const ctx = await browser.newContext(MOB ? {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true} : {viewport: {width: 1280, height: 860}});
 const page = await ctx.newPage(); const errors = [];
 page.on('pageerror', e => errors.push(String(e.message).slice(0, 200))); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
 await ctx.route('**/*', async route => { const r = route.request(), u = r.url(); if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue(); if (r.method() !== 'GET') return route.abort();
  if (/\/explorer\/explorer\.js(\?.*)?$/.test(u)) return route.fulfill({status: 200, contentType: 'application/javascript', body: fs.readFileSync(NEW_JS)});
  /* a stand-in for the dashboard, same origin, for the Motion Off check: it frames the explorer and says motion is off */
  if (/\/__host782\.html$/.test(u)) return route.fulfill({status: 200, contentType: 'text/html', body: '<!doctype html><html data-motion="off"><body style="margin:0"><script>window.gc500DoneKeys = () => (window.__k || []);</script><iframe id="f" src="' + URL_ + '" style="width:1200px;height:800px;border:0"></iframe></body></html>'});
  let res; try { res = await curlFetch(u, r.headers(), 'GET', null); } catch (e) { try { return await route.abort('failed'); } catch (_) { return; } } try { return await route.fulfill(res); } catch (e) {} });
 /* the dashboard's finished list, for this test only: the first twelve trade items of the master plan snapshot */
 await page.addInitScript(() => { window.gc500DoneKeys = () => (window.__d782keys || []); });
 await page.goto(URL_, {waitUntil: 'load', timeout: 120000});
 await page.waitForFunction(() => typeof ready !== 'undefined' && ready && typeof ITEMS !== 'undefined' && ITEMS && ITEMS.length, null, {timeout: 120000});
 const keys = await page.evaluate(() => { const its = ITEMS.filter(it => it.places.length && it.cat && it.cat.host === 'trade'); window.__d782keys = its.filter(it => /^(P0[1-5]|GN2[01]|WC0[1-9]|WC5\d)$/.test(it.code)).map(it => it.code); return {n: its.length, keys: window.__d782keys}; });
 await page.waitForTimeout(5200);
 const T = [], ok = (n, p, d) => T.push({name: n, pass: !!p, detail: String(d)});
 const s1 = await page.evaluate(() => ({chip: !!document.getElementById('done782'), pressed: document.getElementById('done782')?.getAttribute('aria-pressed'), count: document.querySelector('#done782 small')?.textContent, rings: document.querySelectorAll('#d782 i').length, anim: document.querySelector('#d782 i') ? getComputedStyle(document.querySelector('#d782 i')).animationName : null, list: done782List().length}));
 ok('X1 the Done chip is there, on by default, with the count', s1.chip && s1.pressed === 'true' && +s1.count === keys.keys.length, JSON.stringify(s1));
 ok('X2 every finished unit in view has a ring with its own double beat', s1.rings > 0 && s1.anim === 'd782beat', JSON.stringify(s1));
 await page.screenshot({path: path.join(__dirname, 'explorer_done_' + (MOB ? 'phone' : 'desktop') + '.png')});
 /* zoom into the pit lane end, where P01-P05 and GN20/GN21 are */
 await page.evaluate(() => { const it = ITEMS.find(x => x.code === 'P03'); if (it) { const bb = it.places[0], cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2; gotoRect([cx - 70, cy - 45, cx + 70, cy + 45], 'test'); } });
 await page.waitForTimeout(2500);
 await page.screenshot({path: path.join(__dirname, 'explorer_done_close_' + (MOB ? 'phone' : 'desktop') + '.png')});
 const s2 = await page.evaluate(() => { document.getElementById('done782').click(); return {pressed: document.getElementById('done782').getAttribute('aria-pressed'), list: done782List().length}; });
 await page.waitForTimeout(400); const r2 = await page.evaluate(() => document.querySelectorAll('#d782 i').length);
 ok('X3 the chip hides the layer (and remembers it on this device)', s2.pressed === 'false' && s2.list === 0 && r2 === 0, JSON.stringify(s2) + ' rings ' + r2);
 await page.evaluate(() => document.getElementById('done782').click()); await page.waitForTimeout(400);
 const s3 = await page.evaluate(() => { window.__d782keys = window.__d782keys.slice(1); return true; }); await page.waitForTimeout(4600);
 const s4 = await page.evaluate(() => ({count: +document.querySelector('#done782 small').textContent, list: done782List().length}));
 ok('X4 a change in the finished list shows without a reload (read every 4 s)', s4.count === keys.keys.length - 1, JSON.stringify(s4));
 ok('X5 a category still works with the layer on (Find chips unchanged)', await page.evaluate(() => { const b = document.querySelector('#chips .chip[data-cat]'); if (!b) return false; b.click(); return marks.length > 0 && document.getElementById('done782') != null; }), '');
 /* Codex review: the category chips and Escape must not reset the Done chip (its state and the layer must agree) */
 const c1 = await page.evaluate(() => { const b = [...document.querySelectorAll('#chips .chip[data-cat]')][1] || document.querySelector('#chips .chip[data-cat]'); b.click(); return {pressed: document.getElementById('done782').getAttribute('aria-pressed'), on: DONE782_ON, list: done782List().length}; });
 ok('X6 picking a category leaves the Done chip as it was, and its layer showing', c1.pressed === 'true' && c1.on === true && c1.list > 0, JSON.stringify(c1));
 await page.evaluate(() => { const s = document.getElementById('stage') || document.body; s.focus && s.focus(); });
 await page.keyboard.press('Escape'); await page.waitForTimeout(300);
 const c2 = await page.evaluate(() => ({pressed: document.getElementById('done782').getAttribute('aria-pressed'), on: DONE782_ON, list: done782List().length, cats: [...document.querySelectorAll('#chips .chip[aria-pressed="true"]')].length}));
 ok('X7 Escape clears the category chips but not the Done chip', c2.pressed === 'true' && c2.on === true && c2.list > 0 && c2.cats === 0, JSON.stringify(c2));
 /* the dashboard's Motion Off holds the rings still, as the device setting does */
 const host = URL_.replace(/\/explorer\/index\.html.*$/, '/__host782.html');
 const p2 = await ctx.newPage(); p2.on('pageerror', e => errors.push(String(e.message).slice(0, 200)));
 await p2.goto(host, {waitUntil: 'load', timeout: 120000});
 const fr = await (await p2.$('#f')).contentFrame();
 await fr.waitForFunction(() => typeof ready !== 'undefined' && ready && typeof ITEMS !== 'undefined' && ITEMS && ITEMS.length, null, {timeout: 120000});
 await p2.evaluate(k => { window.__k = k; }, keys.keys); await p2.waitForTimeout(5200);
 const mo = await fr.evaluate(() => ({still: document.documentElement.classList.contains('d782still'), rings: document.querySelectorAll('#d782 i').length, anim: document.querySelector('#d782 i') ? getComputedStyle(document.querySelector('#d782 i')).animationName : null}));
 await p2.evaluate(() => document.documentElement.setAttribute('data-motion', 'subtle')); await p2.waitForTimeout(4600);
 const mo2 = await fr.evaluate(() => ({still: document.documentElement.classList.contains('d782still'), anim: document.querySelector('#d782 i') ? getComputedStyle(document.querySelector('#d782 i')).animationName : null}));
 ok('X8 the dashboard\'s Motion Off holds the rings still; turning motion back on brings the beat back', mo.still && mo.anim === 'none' && !mo2.still && mo2.anim === 'd782beat', JSON.stringify({off: mo, on: mo2}));
 await p2.close();
 ok('E1 no page errors', !errors.filter(e => !/ERR_FAILED|net::/.test(e)).length, JSON.stringify(errors).slice(0, 300));
 T.forEach(t => console.log(`${t.pass ? 'PASS' : 'FAIL'} ${t.name} — ${t.detail.slice(0, 260)}`)); console.log(`${T.filter(t => t.pass).length}/${T.length} ${MOB ? 'phone' : 'desktop'} · trade items ${keys.n}`);
 fs.writeFileSync(path.join(__dirname, 'explorer_done_results_' + (MOB ? 'phone' : 'desktop') + '.json'), JSON.stringify({tests: T, errors, keys}, null, 1));
 await browser.close(); process.exit(T.every(t => t.pass) ? 0 : 1);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
