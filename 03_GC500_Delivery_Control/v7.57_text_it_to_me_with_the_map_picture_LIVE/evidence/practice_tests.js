// v7.57 practice tests - read only against the live record (the harness aborts every write). The service's texting
// endpoints are stood in for here, so nothing is sent and no picture leaves this machine:
//   GET /api/sms, GET /api/mms answer "set up"; POST /api/mms and /api/sms are captured and answered SUCCESS.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB}; const posts = [];
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 const save = () => fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(R, null, 1));
 const step = async (name, fn) => { try { await fn(); } catch (e) { R[name + '_error'] = String(e && e.message || e).slice(0, 300); } save(); };
 /* the pretend service, registered after the harness so it is asked first */
 await p.route(/\/api\/(sms|mms)(\?.*)?$/, async route => {
 const r = route.request(); const isMms = /\/api\/mms/.test(r.url());
 if (r.method() === 'GET') return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(isMms
 ? {configured: true, from: 'Coates', from_needed: false, today: {day: '2026-10-01', sent: 3, cap: 500, left: 497}, at_once: 50, max_bytes: 250000, max_characters: 1500, subject_max: 20, keep_days: 14, public_base: 'https://gc500-production.up.railway.app', sent: []}
 : {configured: true, today: {day: '2026-10-01', sent: 3, cap: 500, left: 497}, at_once: 50, max_characters: 480, sent: []})});
 let body = null; try { body = JSON.parse(r.postData() || 'null'); } catch (e) {}
 posts.push({url: r.url().replace(/^https?:\/\/[^/]+/, ''), body: body && Object.assign({}, body, {picture: body.picture ? {dataUrlPrefix: String(body.picture).slice(0, 23), bytes: Math.floor((String(body.picture).length - String(body.picture).indexOf(',') - 1) * 3 / 4)} : undefined})});
 if (body && body.dry_run) return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({dry_run: true, sent: false, to: body.to, messages: 1, subject: body.subject, shape: {parts: 1}, picture: isMms ? {bytes: posts[posts.length - 1].body.picture.bytes} : undefined})});
 return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({sent: 1, of: 1, to: ['+61429352788'], messages: [{to: '+61429352788', status: 'SUCCESS', price: isMms ? 0.36 : 0.08}], clicksend: {http: 200, total_price: isMms ? 0.36 : 0.08}, today: {left: 496, cap: 500}})});
 });
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(1500);
 /* the harness opens the VIEW link, on which the box only copies the words; the sending path needs the editing link, so the page's read-only flag is stood down here (the harness still aborts every real write) */
 R.readonlyBefore = await p.evaluate(() => SYNC.readonly);
 await p.evaluate(() => { Object.defineProperty(SYNC, 'readonly', {get: () => false, set: () => {}, configurable: true}); Object.defineProperty(SYNC, 'level', {get: () => 'edit', set: () => {}, configurable: true}); document.body.classList.remove('viewonly'); });
 R.readonlyAfter = await p.evaluate(() => SYNC.readonly);
 /* 1. the button beside the QR code and Navigate on the Timeline's load lines */
 await p.evaluate(() => { location.hash = '#timeline'; }); await p.waitForTimeout(3000);
 R.loadLines = await p.evaluate(() => ({lines: document.querySelectorAll('#pane-timeline .ld').length, withGo: document.querySelectorAll('#pane-timeline .ld-go').length, withTextIt: document.querySelectorAll('#pane-timeline [data-ldtxt]').length, sample: [...document.querySelectorAll('#pane-timeline [data-ldtxt]')].slice(0, 3).map(b => b.dataset.ldtxt)}));
 const firstBtn = await p.$('#pane-timeline [data-ldtxt]');
 if (firstBtn) {
 await firstBtn.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
 const line = await p.evaluate(() => { const b = document.querySelector('#pane-timeline [data-ldtxt]'); const ld = b.closest('.ld'); const r = ld.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height, wasOpen: ld.classList.contains('on')}; });
 await p.screenshot({path: path.join(out, 'shot757_load_line' + (MOB ? '_phone' : '') + '.png'), clip: {x: Math.max(0, line.x - 4), y: Math.max(0, line.y - 4), width: Math.min(line.w + 8, MOB ? 390 : 1440), height: Math.min(line.h + 8, 400)}});
 await firstBtn.click(); await p.waitForTimeout(800);
 R.clickOpensBox = await p.evaluate(() => ({box: !!document.querySelector('.drawer.on #smPicWrap'), title: (document.querySelector('.drawer.on h2') || {}).textContent, lineStillAsItWas: true}));
 R.lineToggledByTheClick = await p.evaluate(was => { const b = document.querySelector('#pane-timeline [data-ldtxt]'); return b ? b.closest('.ld').classList.contains('on') !== was : null; }, line.wasOpen);
 } else {
 /* every line folded or none with a position: open the box for the first reference that has one */
 await p.evaluate(() => { const a = allAssets().find(x => { try { return navTargetFor(x) && navTargetFor(x).ll; } catch (e) { return false; } }); smsDropBox(a); }); await p.waitForTimeout(800);
 R.clickOpensBox = await p.evaluate(() => ({box: !!document.querySelector('.drawer.on #smPicWrap'), title: (document.querySelector('.drawer.on h2') || {}).textContent, viaFallback: true}));
 }
 /* 2. the picture is drawn on the page, a JPEG under ClickSend's wall */
 await p.waitForFunction(() => { const i = document.querySelector('.drawer.on #smPicImg'); return i && !i.hidden && /^data:image\/jpeg/.test(i.src); }, null, {timeout: 60000}).catch(() => {});
 R.picture = await p.evaluate(() => { const d = document.querySelector('.drawer.on'); const i = d && d.querySelector('#smPicImg'); const pic = d && d._pic; return {drawn: !!(i && !i.hidden), error: d && d._picError || null, bytes: pic && pic.bytes, w: pic && pic.w, h: pic && pic.h, quality: pic && pic.quality, plan: pic && pic.plan, info: (d.querySelector('#smPicInfo') || {}).textContent, tick: !!d.querySelector('#smPic'), ticked: !!(d.querySelector('#smPic') || {}).checked, sub: (d.querySelector('.sub') || {}).textContent}; });
 if (R.picture.drawn) { const dataUrl = await p.evaluate(() => document.querySelector('.drawer.on')._pic.dataUrl); fs.writeFileSync(path.join(out, 'picture757_' + (R.clickOpensBox.title || 'x').replace(/[^A-Za-z0-9]+/g, '_') + (MOB ? '_phone' : '') + '.jpg'), Buffer.from(dataUrl.split(',')[1], 'base64')); }
 await p.screenshot({path: path.join(out, 'shot757_text_box' + (MOB ? '_phone' : '') + '.png'), fullPage: false});
 save();
 R.sendPath = !!(await p.$('.drawer.on #smTo'));
 try {
 /* 3. check it, send nothing - then send: the picture goes to /api/mms with the words, the number and the subject */
 await p.fill('.drawer.on #smTo', '0429 352 788'); await p.click('.drawer.on #smDry'); await p.waitForTimeout(600);
 R.dry = {msg: await p.evaluate(() => document.querySelector('.drawer.on #smMsg').textContent), post: posts[posts.length - 1]};
 await p.click('.drawer.on #smGo'); await p.waitForTimeout(800);
 R.send = {msg: await p.evaluate(() => (document.querySelector('.drawer.on #smMsg') || {}).textContent || null), post: posts[posts.length - 1]};
 await p.waitForTimeout(3000); R.boxClosedAfterSend = await p.evaluate(() => !document.querySelector('.drawer.on #smPicWrap'));
 /* 4. unticked, the words go as a plain text through /api/sms as before */
 await p.evaluate(() => { const a = allAssets().find(x => { try { return navTargetFor(x) && navTargetFor(x).ll; } catch (e) { return false; } }); smsDropBox(a); }); await p.waitForTimeout(600);
 await p.waitForFunction(() => { const i = document.querySelector('.drawer.on #smPicImg'); return i && !i.hidden; }, null, {timeout: 60000}).catch(() => {});
 await p.evaluate(() => { const t = document.querySelector('.drawer.on #smPic'); if (t) t.checked = false; }); await p.fill('.drawer.on #smTo', '0429352788'); await p.click('.drawer.on #smGo'); await p.waitForTimeout(800);
 R.plainText = {msg: await p.evaluate(() => (document.querySelector('.drawer.on #smMsg') || {}).textContent || null), post: posts[posts.length - 1]};
 await p.evaluate(() => document.querySelectorAll('.drawer.on').forEach(d => d.remove()));
 /* 5. the drawer's own Text it opens the same box with the picture */
 const key = await p.evaluate(() => { const a = allAssets().find(x => { try { return navTargetFor(x) && navTargetFor(x).ll; } catch (e) { return false; } }); return a && a.key; });
 await p.evaluate(k => { location.hash = '#asset/' + encodeURIComponent(k); }, key); await p.waitForTimeout(1500);
 const td = await p.$('#textDrop'); if (td) { await td.click(); await p.waitForTimeout(600); await p.waitForFunction(() => { const i = document.querySelector('.drawer.on #smPicImg'); return i && !i.hidden; }, null, {timeout: 60000}).catch(() => {}); }
 R.drawerTextIt = await p.evaluate(() => ({button: !!document.querySelector('#textDrop'), box: !!document.querySelector('.drawer.on #smPicWrap'), drawn: !!(document.querySelector('.drawer.on #smPicImg') && !document.querySelector('.drawer.on #smPicImg').hidden)}));
 } catch (e) { R.stepError = String(e && e.message || e).slice(0, 300); }
 R.posts = posts.length; R.errors = s.errors; R.console = (s.console || []).slice(0, 10); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1));
})();
