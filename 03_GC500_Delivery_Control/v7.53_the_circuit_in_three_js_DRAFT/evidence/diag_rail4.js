// v7.53 diagnostic 7 - read only. Which rail points project into the top band of the chase frame?
const {open} = require('../../toolchain/harness/open_page.js');
(async () => {
 const s = await open({pageFile: process.argv[2], W: 1600, H: 900, gl: true}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && window.GC3D && GC3D.X, null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { GC3D.noGuard = true; showOpen(); }); await p.waitForTimeout(1200);
 await p.evaluate(() => { showSetBack('circuit3d_day'); showPlateMotion(); });
 await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000});
 const out = await p.evaluate(() => { const S = GC3D.S, X = GC3D.X, T3 = X.THREE; S.paused = true; GC3D.renderAt(14, 'chase');
 const m = S.world.group.children.find(x => x.name === 'posts'); const P = m.geometry.attributes.position; const cam = S.camera; const c = S.drive.car; const hits = []; const v = new T3.Vector3();
 for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (Math.abs(y - 4.9) > .01) continue; v.set(P.getX(i), y, P.getZ(i)); const d = Math.hypot(v.x - c.px, v.z - c.pz); v.project(cam); if (v.z < 1 && v.z > -1 && Math.abs(v.x) < 1 && v.y > .6) hits.push({sx: Math.round((v.x + 1) * 800), sy: Math.round((1 - v.y) * 293), dist: Math.round(d), wx: Math.round(P.getX(i)), wz: Math.round(P.getZ(i)), i}); }
 hits.sort((a, b) => a.sx - b.sx); return {car: [Math.round(c.px), Math.round(c.pz), Math.round(c.s)], eye: cam.position.toArray().map(x => Math.round(x * 10) / 10), n: hits.length, some: hits.filter((h, k) => k % Math.max(1, Math.floor(hits.length / 12)) === 0)}; });
 console.log(JSON.stringify(out)); await s.browser.close();
})();
