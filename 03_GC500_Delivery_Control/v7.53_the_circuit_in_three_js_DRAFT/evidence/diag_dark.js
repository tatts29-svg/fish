// v7.53 diagnostic - read only. Why did the night chase at T=14 draw nothing? Renders a run of stills and reads
// the canvas back in the same turn, with the camera and car positions and any exception the renderer throws.
//   CHROMIUM_PATH=... node diag_dark.js <build.html>
const {open} = require('../../toolchain/harness/open_page.js');
(async () => {
 const s = await open({pageFile: process.argv[2], W: 1600, H: 900, gl: true}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && window.GC3D && GC3D.X, null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { GC3D.noGuard = true; showOpen(); }); await p.waitForTimeout(1200);
 await p.evaluate(() => { showSetBack('circuit3d'); showPlateMotion(); });
 await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000});
 await p.evaluate(() => { GC3D.S.paused = true; });
 const out = await p.evaluate(() => {
 const S = GC3D.S, X = GC3D.X, R = [];
 const probe = (T, view, look) => { try { X.applyLook(S, X.lookOf(look)); const rep = GC3D.renderAt(T, view); const cv = S.renderer.domElement; const c2 = document.createElement('canvas'); c2.width = 64; c2.height = 32; const g = c2.getContext('2d'); g.drawImage(cv, 0, 0, 64, 32); const d = g.getImageData(0, 0, 64, 32).data; let sum = 0, alpha = 0; for (let i = 0; i < d.length; i += 4) { sum += d[i] + d[i + 1] + d[i + 2]; alpha += d[i + 3]; } const car = S.drive.car; R.push({T, view, look, kmh: rep && rep.kmh, mean: Math.round(sum / (d.length / 4) / 3), alpha: Math.round(alpha / (d.length / 4)), eye: S.camera.position.toArray().map(v => Math.round(v * 10) / 10), car: [Math.round(car.px), Math.round(car.pz)], s: Math.round(car.s), lights: S.floods.filter(f => f.visible).length, spots: S.car.spots.map(sp => [sp.visible, sp.intensity]) }); } catch (e) { R.push({T, view, look, error: String(e && e.stack || e).slice(0, 400)}); } };
 [12, 13, 14, 15, 16, 20].forEach(T => probe(T, 'chase', 'dark'));
 probe(14, 'chase', 'day'); probe(14, 'chase', 'dusk'); probe(14, 'onboard', 'dark'); probe(14, 'wide', 'dark');
 return R; });
 console.log(JSON.stringify(out, null, 1)); console.log('errors', JSON.stringify(s.errors)); await s.browser.close();
})();
