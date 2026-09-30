// v7.53 diagnostic 6 - read only. Find any long triangle edge in the posts mesh (posts are 3 m, rail segments 2 m).
const {open} = require('../../toolchain/harness/open_page.js');
(async () => {
 const s = await open({pageFile: process.argv[2], W: 1600, H: 900, gl: true}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && window.GC3D && GC3D.X, null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { GC3D.noGuard = true; showOpen(); }); await p.waitForTimeout(1200);
 await p.evaluate(() => { showSetBack('circuit3d_day'); showPlateMotion(); });
 await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000});
 const out = await p.evaluate(() => { const S = GC3D.S; S.paused = true; const m = S.world.group.children.find(x => x.name === 'posts'); const P = m.geometry.attributes.position, I = m.geometry.index.array; const bad = []; const at = i => [P.getX(i), P.getY(i), P.getZ(i)]; const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
 for (let t = 0; t < I.length; t += 3) { const a = at(I[t]), b = at(I[t + 1]), c = at(I[t + 2]); const L = Math.max(d(a, b), d(b, c), d(a, c)); if (L > 12) bad.push({t, i: [I[t], I[t + 1], I[t + 2]], L: Math.round(L), a: a.map(v => Math.round(v * 10) / 10), b: b.map(v => Math.round(v * 10) / 10), c: c.map(v => Math.round(v * 10) / 10)}); if (bad.length > 8) break; }
 return {tri: I.length / 3, verts: P.count, bad}; });
 console.log(JSON.stringify(out)); await s.browser.close();
})();
