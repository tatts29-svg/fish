// v7.56 practice tests - read only, GETs only. The Master plan sheet in the Map tab: five wheel notches, how long the
// zoom takes to settle, whether the sharp tiles arrive DURING the zoom, whether the point under the cursor stays put,
// the +/- buttons and Fit.      CHROMIUM_PATH=/opt/pw-browsers/chromium node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const R = {};
 const s = await open({pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(1500);
 /* the Map tab, then the Master plan sheet (the in-page viewer whose wheel, buttons and tiles v7.56 changes) */
 await p.evaluate(() => { location.hash = '#sheet/MASTER'; }); await p.waitForTimeout(3000);
 await p.waitForSelector('#stage #inner', {timeout: 30000});
 /* the stage sits below the sheet chooser: bring it on screen, as a reader would have, before the wheel turns over it */
 await p.evaluate(() => document.getElementById('stage').scrollIntoView({block: 'start'})); await p.waitForTimeout(600);
 R.stage = await p.evaluate(() => { const st = document.getElementById('stage'); return {w: st.clientWidth, h: st.clientHeight, hasTiles: !!st.querySelector('.mtiles')}; });
 const box = await p.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; });
 const zoomOf = () => p.evaluate(() => { const m = /scale\(([\d.]+)\)/.exec(document.getElementById('inner').style.transform || ''); return m ? +m[1] : null; });
 const tilesOn = () => p.evaluate(() => ({all: document.querySelectorAll('#stage .mtile').length, on: document.querySelectorAll('#stage .mtile.on').length}));
 const cx = box.x + box.w * 0.62, cy = box.y + Math.min(box.h * 0.4, 900 - box.y);
 R.underCursor = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName + '#' + e.id + '.' + e.className : null; }, [cx, cy]);
 /* the map point under the cursor, in the drawing's own pixels, from the inner transform */
 const mapPt = () => p.evaluate(([px, py]) => { const stage = document.getElementById('stage'), inner = document.getElementById('inner'); const r = stage.getBoundingClientRect(); const tr = inner.style.transform; const m = /translate(?:3d)?\(([-\d.]+)px,\s*([-\d.]+)px/.exec(tr); const z = +(/scale\(([\d.]+)\)/.exec(tr) || [0, 1])[1]; return {mx: (px - r.left - +m[1]) / z, my: (py - r.top - +m[2]) / z, z}; }, [cx, cy]);
 R.zoom0 = await zoomOf(); R.tiles0 = await tilesOn();
 /* five wheel notches at one spot; sample the zoom and the tiles every 50 ms until it stops moving */
 const t0 = Date.now(); for (let i = 0; i < 5; i++) { await p.mouse.move(cx, cy); await p.mouse.wheel(0, -100); await p.waitForTimeout(40); }
 const trace = []; let last = null, still = 0, tilesDuring = null;
 for (let i = 0; i < 60; i++) { await p.waitForTimeout(50); const z = await zoomOf(); const tl = await tilesOn(); trace.push({z: Math.round(z * 100) / 100, tiles: tl.all}); if (tilesDuring == null && tl.all && last != null && Math.abs(z - last) > 1e-3) tilesDuring = {atMs: Date.now() - t0, zoom: Math.round(z * 100) / 100, tiles: tl.all}; if (last != null && Math.abs(z - last) < 1e-4) { still++; if (still >= 3) break; } else still = 0; last = z; }
 R.wheel5 = {zoom: last, msToSettle: Date.now() - t0 - 150, factorPerNotch: last && R.zoom0 ? Math.round(Math.pow(last / R.zoom0, 1 / 5) * 1000) / 1000 : null, tilesArrivedDuringTheZoom: tilesDuring, trace};
 await p.waitForTimeout(600); R.tilesAfterWheel = await tilesOn();
 /* anchor accuracy: one more notch, the same map point should be under the cursor */
 const before = await mapPt(); await p.mouse.move(cx, cy); await p.mouse.wheel(0, -120); await p.waitForTimeout(800); const after = await mapPt();
 R.anchorDriftScreenPx = {dx: Math.round((after.mx - before.mx) * after.z * 10) / 10, dy: Math.round((after.my - before.my) * after.z * 10) / 10, zoomBefore: Math.round(before.z * 100) / 100, zoomAfter: Math.round(after.z * 100) / 100};
 /* zoom out again with the wheel */
 for (let i = 0; i < 3; i++) { await p.mouse.move(cx, cy); await p.mouse.wheel(0, 100); await p.waitForTimeout(40); } await p.waitForTimeout(800); R.wheelOut3 = await zoomOf();
 /* the buttons */
 const zb = await zoomOf(); await p.click('#stage [data-z="in"]'); await p.waitForTimeout(700); const za = await zoomOf(); R.buttonIn = {from: zb, to: za, factor: za && zb ? Math.round(za / zb * 100) / 100 : null};
 await p.click('#stage [data-z="out"]'); await p.waitForTimeout(700); R.buttonOut = await zoomOf();
 await p.screenshot({path: path.join(out, 'shot756_explorer_zoomed.png'), clip: {x: box.x, y: box.y, width: box.w, height: Math.min(box.h, 900)}});
 await p.click('#stage [data-z="reset"]'); await p.waitForTimeout(600); R.reset = {zoom: await zoomOf(), tiles: await tilesOn()};
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1));
})();
