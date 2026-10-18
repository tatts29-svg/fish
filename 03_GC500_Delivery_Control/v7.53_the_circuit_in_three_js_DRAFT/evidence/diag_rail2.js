// v7.53 diagnostic 5 - read only. Two stills of the same chase frame: with and without the posts mesh.
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs');
(async () => {
 const s = await open({pageFile: process.argv[2], W: 1600, H: 900, gl: true}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && window.GC3D && GC3D.X, null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { GC3D.noGuard = true; showOpen(); }); await p.waitForTimeout(1200);
 await p.evaluate(() => { showSetBack('circuit3d_day'); showPlateMotion(); });
 await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000});
 const out = await p.evaluate(() => { const S = GC3D.S, X = GC3D.X; S.paused = true; const R = {};
 GC3D.renderAt(14, 'chase'); R.a = S.renderer.domElement.toDataURL('image/png');
 const hide = name => S.world.group.children.filter(m => m.name === name).forEach(m => m.visible = false), show = name => S.world.group.children.filter(m => m.name === name).forEach(m => m.visible = true);
 hide('posts'); X.render(S, 0); R.b = S.renderer.domElement.toDataURL('image/png'); show('posts');
 hide('poles'); X.render(S, 0); R.c = S.renderer.domElement.toDataURL('image/png'); show('poles');
 S.fx.lines.visible = false; X.render(S, 0); R.d = S.renderer.domElement.toDataURL('image/png'); S.fx.lines.visible = true;
 return R; });
 for (const k of ['a', 'b', 'c', 'd']) fs.writeFileSync('diag_rail_' + k + '.png', Buffer.from(out[k].split(',')[1], 'base64'));
 await s.browser.close();
})();
