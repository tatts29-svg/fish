// v7.53 diagnostic 3 - read only. The helicopter still at T=30 once showed the ground through the circuit.
// Renders the helicopter frames around it, reads the pixel under the car's road back, and reports the road
// mesh's culling state, so a missing road can be told from a stale frame.
//   CHROMIUM_PATH=... node diag_heli.js <build.html>
const {open} = require('../../toolchain/harness/open_page.js');
(async () => {
 const s = await open({pageFile: process.argv[2], W: 1600, H: 900, gl: true}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && window.GC3D && GC3D.X, null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { GC3D.noGuard = true; showOpen(); }); await p.waitForTimeout(1200);
 await p.evaluate(() => { showSetBack('circuit3d_day'); showPlateMotion(); });
 await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000});
 await p.evaluate(() => { GC3D.S.paused = true; });
 const out = await p.evaluate(() => {
 const S = GC3D.S, X = GC3D.X, T3 = X.THREE, R = []; const road = S.world.road; road.geometry.computeBoundingSphere(); const bs = road.geometry.boundingSphere;
 const probe = (T, view, twice) => { try { GC3D.renderAt(T, view); if (twice) X.render(S, 0); const cv = S.renderer.domElement; const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const g = c2.getContext('2d'); g.drawImage(cv, 0, 0);
 /* project the road point 12 m ahead of the car onto the screen */ const c = S.drive.car; const pt = new T3.Vector3(c.px + c.tx * 12, .02, c.pz + c.tz * 12).project(S.camera); const sx = Math.round((pt.x + 1) / 2 * cv.width), sy = Math.round((1 - pt.y) / 2 * cv.height); const d = g.getImageData(Math.max(0, sx - 2), Math.max(0, sy - 2), 5, 5).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4;
 R.push({T, view, twice: !!twice, px: [Math.round(r / n), Math.round(gg / n), Math.round(b / n)], at: [sx, sy], eye: S.camera.position.toArray().map(v => Math.round(v)), roadVisible: road.visible, culled: road.frustumCulled, sphere: [Math.round(bs.center.x), Math.round(bs.center.z), Math.round(bs.radius)], inFrustum: (() => { const f = new T3.Frustum(); f.setFromProjectionMatrix(new T3.Matrix4().multiplyMatrices(S.camera.projectionMatrix, S.camera.matrixWorldInverse)); return f.intersectsObject(road); })()}); } catch (e) { R.push({T, view, error: String(e && e.stack || e).slice(0, 300)}); } };
 [28, 29, 30, 31, 32].forEach(T => probe(T, 'heli')); probe(30, 'heli', true); probe(30, 'chase'); probe(8, 'top');
 return R; });
 console.log(JSON.stringify(out)); console.log('errors', JSON.stringify(s.errors)); await s.browser.close();
})();
