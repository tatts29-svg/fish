// v7.53 diagnostic 4 - read only. A thin line crosses the sky since the fence top rail went in: is it the rail?
const {open} = require('../../toolchain/harness/open_page.js');
(async () => {
 const s = await open({pageFile: process.argv[2], W: 1600, H: 900, gl: true}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && window.GC3D && GC3D.X, null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { GC3D.noGuard = true; showOpen(); }); await p.waitForTimeout(1200);
 await p.evaluate(() => { showSetBack('circuit3d_day'); showPlateMotion(); });
 await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000});
 const out = await p.evaluate(() => { const S = GC3D.S, X = GC3D.X, T3 = X.THREE; S.paused = true; const R = {};
 const sample = () => { const cv = S.renderer.domElement, c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const g = c2.getContext('2d'); g.drawImage(cv, 0, 0); const row = []; for (let x = 100; x < cv.width; x += 300) { const d = g.getImageData(x, Math.round(75 * cv.height / 587), 1, 1).data; row.push([d[0], d[1], d[2]]); } return row; };
 const names = S.world.group.children.map(m => m.name); R.names = names;
 GC3D.renderAt(14, 'chase'); R.withPosts = sample();
 const posts = S.world.group.children.find(m => m.name === 'posts'); posts.visible = false; X.render(S, 0); R.noPosts = sample(); posts.visible = true;
 const fence = S.world.group.children.filter(m => /fence/.test(m.name)); fence.forEach(m => m.visible = false); X.render(S, 0); R.noFence = sample(); fence.forEach(m => m.visible = true);
 posts.geometry.computeBoundingBox(); const bb = posts.geometry.boundingBox; R.postsBox = [bb.min.toArray().map(Math.round), bb.max.toArray().map(Math.round)];
 /* the rail alone */ const P = posts.geometry.attributes.position; let maxY = -1e9, minY = 1e9, nanN = 0; for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (Number.isNaN(P.getX(i)) || Number.isNaN(y)) nanN++; if (y > maxY) maxY = y; if (y < minY) minY = y; } R.posts = {count: P.count, minY, maxY, nanN, indexCount: posts.geometry.index.count};
 return R; });
 console.log(JSON.stringify(out)); console.log('errors', JSON.stringify(s.errors)); await s.browser.close();
})();
