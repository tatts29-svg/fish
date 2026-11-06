// read-only: does the standalone preview start, build and draw on its own?
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs');
(async () => {
 const s = await open({pageFile: process.argv[2], W: 1400, H: 900, gl: true}); const p = s.page;
 await p.waitForFunction(() => window.GC3D && GC3D.X, null, {timeout: 60000});
 await p.evaluate(() => { GC3D.noGuard = true; });
 const built = await p.waitForFunction(() => GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000}).then(() => true).catch(() => false);
 const R = await p.evaluate(() => ({built: !!(GC3D.S && GC3D.S.world && GC3D.S.world.built), failed: GC3D.failed || null, stat: document.getElementById('stat').textContent, fail: document.getElementById('fail').textContent, hud: (document.querySelector('.gc3dx-hud') || {}).innerText, credit: (GC3D.S && GC3D.S.capEl || {}).textContent, plate: document.getElementById('showPlate').getBoundingClientRect().width}));
 if (R.built) { await p.evaluate(() => { GC3D.S.paused = true; }); const png = await p.evaluate(() => { GC3D.X.applyLook(GC3D.S, GC3D.X.lookOf('dusk')); GC3D.renderAt(16, 'chase'); return GC3D.S.renderer.domElement.toDataURL('image/png'); }); fs.writeFileSync('preview_check.png', Buffer.from(png.split(',')[1], 'base64')); }
 R.errors = s.errors; console.log(JSON.stringify(R, null, 1)); await s.browser.close();
})();
