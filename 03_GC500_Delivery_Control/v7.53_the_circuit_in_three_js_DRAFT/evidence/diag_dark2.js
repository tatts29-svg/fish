// v7.53 diagnostic 2 - read only. Repeats the practice test's exact sequence for the night chase still and
// screenshots the plate after each step, so the blank frame can be caught in the act.
const {open} = require('../../toolchain/harness/open_page.js'); const path = require('path');
(async () => {
 const s = await open({pageFile: process.argv[2], W: 1600, H: 900, gl: true}); const p = s.page; const out = process.argv[3] || __dirname;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && window.GC3D && GC3D.X, null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { GC3D.noGuard = true; showOpen(); }); await p.waitForTimeout(1200);
 await p.evaluate(() => { showSetBack('circuit3d_day'); showPlateMotion(); });
 await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000});
 await p.evaluate(() => { GC3D.S.paused = true; });
 const stats = async tag => { const r = await p.evaluate(() => { const S = GC3D.S, cv = S.renderer.domElement; return {w: cv.width, h: cv.height, cssW: cv.clientWidth, cssH: cv.clientHeight, vis: getComputedStyle(cv).visibility, disp: getComputedStyle(cv).display, op: getComputedStyle(cv).opacity, connected: cv.isConnected, parent: cv.parentNode && cv.parentNode.className, needs: S.needsRender, frames: S.frames, lost: !!S.lost, ctxLost: S.renderer.getContext().isContextLost(), siblings: [...cv.parentNode.children].map(c => c.tagName + '.' + c.className).join(' | ')}; }); console.log(tag, JSON.stringify(r)); };
 const shot = async (name, T, look, file) => { await p.evaluate(l => { GC3D.X.applyLook(GC3D.S, GC3D.X.lookOf(l)); }, look); await p.evaluate(([T, v]) => GC3D.renderAt(T, v), [T, name]); await stats('after render ' + file); await p.waitForTimeout(300); await stats('after wait   ' + file); const plate = await p.$('#showPlate'); await plate.screenshot({path: path.join(out, file)}); };
 await shot('wide', 24, 'dusk', 'diag_dusk_wide.png'); await shot('chase', 14, 'dark', 'diag_dark_chase_a.png'); await shot('chase', 14, 'dark', 'diag_dark_chase_b.png'); await shot('heli', 26, 'dark', 'diag_dark_heli.png'); await shot('chase', 14, 'dark', 'diag_dark_chase_c.png');
 console.log('errors', JSON.stringify(s.errors)); await s.browser.close();
})();
