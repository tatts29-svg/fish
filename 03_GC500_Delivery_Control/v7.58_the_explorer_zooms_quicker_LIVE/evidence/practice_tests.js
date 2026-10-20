// v7.58 practice tests - the LIVE explorer (GETs only; the explorer itself only ever GETs), once as it is and once
// with this draft's explorer.js put in place of the live file by the harness. Measures a wheel notch's zoom factor,
// how long the glide takes to settle, and that the point under the cursor stays put.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium node practice_tests.js [outdir]
const {chromium} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/node_modules/playwright');
const fs = require('fs'), path = require('path'); const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const URL_ = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html?embed=1';
const NEW_JS = path.join(__dirname, '..', 'release', 'explorer', 'explorer.js');
async function run(label, swap) {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
 const ctx = await browser.newContext({viewport: {width: 1280, height: 860}}); const page = await ctx.newPage(); const errors = [];
 page.on('pageerror', e => errors.push(String(e.message).slice(0, 200))); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
 /* every request is a GET to the live service through curl (the harness's own way); writes are aborted */
 await ctx.route('**/*', async route => { const r = route.request(), u = r.url(); if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue(); if (r.method() !== 'GET') return route.abort(); if (swap && /\/explorer\/explorer\.js(\?.*)?$/.test(u)) return route.fulfill({status: 200, contentType: 'application/javascript', body: fs.readFileSync(NEW_JS)}); let res; try { res = await curlFetch(u, r.headers(), 'GET', null); } catch (e) { try { return await route.abort('failed'); } catch (_) { return; } } try { return await route.fulfill(res); } catch (e) {} });
 await page.goto(URL_, {waitUntil: 'load', timeout: 120000});
 await page.waitForFunction(() => typeof camera === 'object' && camera && camera.z > 0 && typeof ready !== 'undefined' && ready, null, {timeout: 120000}).catch(() => {});
 await page.waitForTimeout(4000);
 const R = {label, ready: await page.evaluate(() => typeof ready !== 'undefined' && !!ready), z0: await page.evaluate(() => camera.z)};
 const st = await page.evaluate(() => { const e = document.getElementById('stage') || document.querySelector('canvas'); const r = e.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; });
 const cx = st.x + st.w * 0.55, cy = st.y + st.h * 0.5;
 const srcAt = () => page.evaluate(([x, y]) => { const r = (document.getElementById('stage') || document.querySelector('canvas')).getBoundingClientRect(); const s = screenToSource(x - r.left, y - r.top); return {x: s.x, y: s.y}; }, [cx, cy]);
 const before = await srcAt();
 /* one notch: sample camera.z every 16 ms until it stops */
 await page.mouse.move(cx, cy); const t0 = Date.now(); await page.mouse.wheel(0, -100);
 const trace = []; let last = null, still = 0, settledAt = null;
 for (let i = 0; i < 120; i++) { await page.waitForTimeout(16); const z = await page.evaluate(() => camera.z); trace.push({t: Date.now() - t0, z: Math.round(z * 1000) / 1000}); if (last != null && Math.abs(z - last) < 1e-5) { still++; if (still === 1) settledAt = trace[trace.length - 2].t; if (still >= 4) break; } else { still = 0; settledAt = null; } last = z; }
 const after = await srcAt();
 R.oneNotch = {factor: Math.round(last / R.z0 * 1000) / 1000, msToSettle: settledAt, anchorDriftSourcePx: {dx: Math.round((after.x - before.x) * 100) / 100, dy: Math.round((after.y - before.y) * 100) / 100}, samples: trace.length};
 /* three quick notches */
 const z1 = await page.evaluate(() => camera.z); for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(40); } await page.waitForTimeout(900);
 R.threeNotches = {factor: Math.round(await page.evaluate(() => camera.z) / z1 * 1000) / 1000};
 /* and back out */
 for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(40); } await page.waitForTimeout(900);
 R.backOut = {z: Math.round(await page.evaluate(() => camera.z) * 1000) / 1000, z0: Math.round(R.z0 * 1000) / 1000};
 R.errors = errors; await browser.close(); return R;
}
(async () => {
 const out = process.argv[2] || __dirname; const live = await run('live v7.14', false); const draft = await run('v7.58 draft', true);
 const R = {live, draft}; fs.writeFileSync(path.join(out, 'practice_results.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1));
})();
