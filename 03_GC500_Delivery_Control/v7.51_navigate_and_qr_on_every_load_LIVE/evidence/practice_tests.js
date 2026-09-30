// v7.51 practice tests - read only (every write the page tries is aborted by the harness).
//   CHROMIUM_PATH=... node practice_tests.js <build.html> <outdir>
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
const ready = p => p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && typeof ldGo751 === 'function', null, {timeout: 240000}).then(() => p.waitForTimeout(2500));
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const R = {};
 // the big screen
 let s = await open({pageFile: build, W: 1920, H: 1080}); let p = s.page; await ready(p);
 await p.evaluate(() => go('timeline')); await p.waitForTimeout(1500);
 R.day = await p.evaluate(() => location.hash);
 R.lines = await p.evaluate(() => [...document.querySelectorAll('.ld')].map(el => { const go = el.querySelector('.ld-go'), nav = el.querySelector('.ld-nav'), qr = el.querySelector('.ld-qr');
  return {go: !!go, cls: el.className, nav: nav ? nav.getAttribute('href') : null, qr: qr ? qr.getAttribute('href') : null, qrSvg: !!(qr && qr.querySelector('svg')), word: nav ? nav.querySelector('em').textContent : null, refs: [...el.querySelectorAll('.ld-ref b')].map(b => b.textContent)}; }));
 // the pill points where Navigate on the drawer points (the first reference with a position)
 R.hrefMatch = await p.evaluate(() => [...document.querySelectorAll('.ld.go')].map(el => { const keys = [...el.querySelectorAll('.ld-ref b')].map(b => b.textContent); const nav = el.querySelector('.ld-nav').getAttribute('href');
  let want = null; for (const k of keys) { const t = navTargetFor(assetOf(k)); if (t && t.ll) { want = navUrl(t.ll); break; } } return {keys, ok: want === nav, want, nav, qrSame: el.querySelector('.ld-qr').getAttribute('href') === nav}; }));
 // pressing the pill never opens or closes the load
 R.toggle = await p.evaluate(() => { const el = document.querySelector('.ld.go'); if (!el) return 'no load with a position'; const was = el.classList.contains('on');
  const a = el.querySelector('.ld-nav'); a.addEventListener('click', e => e.preventDefault(), {once: true}); a.click(); return {was, now: document.querySelector('.ld.go').classList.contains('on')}; });
 await p.evaluate(() => { const el = document.querySelector('.ld.go'); if (el) el.scrollIntoView({block: 'start'}); window.scrollBy(0, -140); }); await p.waitForTimeout(600);
 await p.screenshot({path: path.join(out, 'shot751_timeline_bigscreen.png'), clip: {x: 0, y: 0, width: 1920, height: 900}});
 // open one load: the panel stays on the line, the cards open under both
 await p.evaluate(() => { const b = document.querySelector('.ld.go .ldl'); if (b) b.click(); }); await p.waitForTimeout(900);
 R.opened = await p.evaluate(() => { const el = document.querySelector('.ld.go'); return el ? {on: el.classList.contains('on'), body: !!el.querySelector('.ldb'), goStill: !!el.querySelector('.ld-go')} : null; });
 await p.screenshot({path: path.join(out, 'shot751_timeline_open.png'), clip: {x: 0, y: 0, width: 1920, height: 900}});
 R.errors = s.errors; await s.browser.close();
 // the phone
 s = await open({pageFile: build, mobile: true, W: 390, H: 844, dpr: 2}); p = s.page; await ready(p);
 await p.evaluate(() => go('timeline')); await p.waitForTimeout(1500);
 await p.evaluate(() => { const el = document.querySelector('.ld.go'); if (el) el.scrollIntoView({block: 'start'}); window.scrollBy(0, -120); }); await p.waitForTimeout(600);
 R.phone = await p.evaluate(() => ({goLines: document.querySelectorAll('.ld.go').length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, qrShown: (() => { const q = document.querySelector('.ld-qr svg'); return q ? q.getBoundingClientRect().width : 0; })()}));
 await p.screenshot({path: path.join(out, 'shot751_timeline_phone.png')}); R.phoneErrors = s.errors; await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results.json'), JSON.stringify(R, null, 1));
 console.log(JSON.stringify({day: R.day, lines: R.lines.length, withGo: R.lines.filter(l => l.go).length, words: R.lines.map(l => l.word), hrefOk: R.hrefMatch.every(x => x.ok && x.qrSame), hrefBad: R.hrefMatch.filter(x => !(x.ok && x.qrSame)), toggle: R.toggle, opened: R.opened, phone: R.phone, errors: R.errors, phoneErrors: R.phoneErrors}, null, 1));
})();
