// v7.47 practice tests - read only. Every write the page tries is aborted by the harness; /api/sms is answered here.
//   CHROMIUM_PATH=... node practice_tests.js <build.html> <outdir>
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [pageFile, out] = [process.argv[2], process.argv[3] || __dirname]; const R = {};
 const s = await open({pageFile, mobile: true, W: 390, H: 844, dpr: 2}); const p = s.page;
 // the service's texting answer, stubbed: configured, so the Send button shows. POST is never let through.
 await p.route('**/api/sms*', r => r.request().method() === 'GET' ? r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({configured: true, today: {left: 500, cap: 500}})}) : r.abort());
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && typeof text747What === 'function', null, {timeout: 240000}); await p.waitForTimeout(2000);
 R.all = await p.evaluate(() => { const rows = allAssets().map(a => { const t = dropSmsText(a), sh = smsShape(t), nt = navTargetFor(a);
   const gps = (t.match(/GPS: (-?\d+\.\d+), (-?\d+\.\d+)/) || []).slice(1).map(Number);
   return {key: a.key, len: t.length, units: sh.units, parts: sh.parts, plain: !sh.not_plain.length, gps: gps.length === 2,
     gpsMatches: !nt ? !gps.length : (gps.length === 2 && Math.abs(gps[0] - nt.ll.lat) < 1e-6 && Math.abs(gps[1] - nt.ll.lon) < 1e-6),
     master: !!(nt && nt.fix && nt.fix.master), saysMaster: /\(master plan\)/.test(t), wayIn: /^Way in:/m.test(t), first: t.split('\n')[0]}; });
   const bad = rows.filter(r => r.units > 459 || !r.plain || !r.gpsMatches || r.master !== r.saysMaster);
   return {n: rows.length, maxUnits: Math.max(...rows.map(r => r.units)), parts: rows.reduce((m, r) => (m[r.parts] = (m[r.parts] || 0) + 1, m), {}),
     withGps: rows.filter(r => r.gps).length, master: rows.filter(r => r.master).length, wayIn: rows.filter(r => r.wayIn).length, bad, noGps: rows.filter(r => !r.gps).map(r => r.key)}; });
 R.samples = await p.evaluate(() => Object.fromEntries(['P41', 'WC43', 'GN01', 'WC17', 'T0023', 'LT05'].map(k => [k, assetOf(k) ? dropSmsText(assetOf(k)) : null])));
 R.firstLines = await p.evaluate(() => allAssets().slice(0, 400).map(a => dropSmsText(a).split('\n')[0]));
 // the Text box, as an editor sees it
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; });
 await p.evaluate(() => openAsset('WC43')); await p.waitForTimeout(900);
 await p.evaluate(() => { SYNC.readonly = false; document.querySelector('#textDrop').click(); }); await p.waitForTimeout(1500);
 const box = async () => p.evaluate(() => ({text: document.querySelector('#smTx').value, count: document.querySelector('#smCount').textContent,
   send: !!document.querySelector('#smGo'), sendDisabled: (document.querySelector('#smGo') || {}).disabled, href: decodeURIComponent(document.querySelector('#smOpen').getAttribute('href')).slice(0, 60)}));
 R.boxShort = await box();
 await p.screenshot({path: path.join(out, 'shot747_text_wc43_phone.png')});
 await p.click('#smLong'); await p.waitForTimeout(300); R.boxLong = await box();
 await p.click('#smLong'); await p.waitForTimeout(300); R.boxBack = await box();
 await p.fill('#smTx', 'Coates GC500: WC43 edited by hand'); await p.waitForTimeout(200); R.boxEdited = await box();
 R.errors = s.errors; R.blockedWrites = s.counts.blocked;
 fs.writeFileSync(path.join(out, 'practice_results.json'), JSON.stringify(R, null, 1));
 console.log(JSON.stringify({all: {...R.all, noGps: R.all.noGps.length + ' refs', bad: R.all.bad.slice(0, 8)}, boxShort: R.boxShort.count, send: R.boxShort.send, long: R.boxLong.count, longSendDisabled: R.boxLong.sendDisabled, backSendDisabled: R.boxBack.sendDisabled, edited: R.boxEdited.href, errors: R.errors}, null, 1));
 console.log('--- WC43\n' + R.samples.WC43 + '\n--- P41\n' + R.samples.P41 + '\n--- LT05\n' + R.samples.LT05 + '\n--- T0023\n' + R.samples.T0023);
 await s.browser.close(); })();
