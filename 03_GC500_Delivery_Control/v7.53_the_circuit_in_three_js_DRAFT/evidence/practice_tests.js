// v7.53 practice tests - read only. Opens the showcase on the 3D backdrop with software WebGL, waits for the
// Three.js scene to build, then draws deterministic stills from each camera and each look.
//   CHROMIUM_PATH=... node practice_tests.js <build.html> <outdir>
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const R = {shots: {}};
 const s = await open({pageFile: build, W: 1600, H: 900, gl: true}); const p = s.page;
 p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') (R.console = R.console || []).push(m.text().slice(0, 200)); });
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && window.GC3D && GC3D.X, null, {timeout: 240000}); await p.waitForTimeout(1500);
 R.engine = await p.evaluate(() => ({ver: GC3D.X.ver, views: GC3D.VIEWS.map(v => v[0]), plant: Object.keys(GC3D.PLANT)}));
 await p.evaluate(() => { GC3D.noGuard = true; showOpen(); }); await p.waitForTimeout(1200);
 await p.evaluate(() => { showSetBack('circuit3d_day'); showPlateMotion(); }); 
 const built = await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.world && GC3D.S.world.built, null, {timeout: 180000}).then(() => true).catch(() => false);
 R.built = built; R.failed = await p.evaluate(() => GC3D.failed || null); R.mount = await p.evaluate(() => GC3D.S ? {look: GC3D.S.look.name, quality: GC3D.S.quality.name, corners: GC3D.X.track.corners.length, L: Math.round(GC3D.X.track.L), n: GC3D.X.track.n, hwMin: Math.min(...GC3D.X.track.hw).toFixed(1), hwMax: Math.max(...GC3D.X.track.hw).toFixed(1), vMin: Math.round(Math.min(...GC3D.X.track.v) * 3.6), vMax: Math.round(Math.max(...GC3D.X.track.v) * 3.6), gantries: GC3D.S.world.gantries.length, floods: GC3D.S.world.floods.length, lamps: GC3D.S.world.lamps.length, meshes: GC3D.S.world.group.children.length} : null);
 if (built) {
 await p.evaluate(() => { GC3D.S.paused = true; });
 const shot = async (name, T, look) => { if (look) await p.evaluate(l => { GC3D.X.applyLook(GC3D.S, GC3D.X.lookOf(l)); }, look);
 /* the still is read straight off the WebGL canvas in the same turn as the draw: a page screenshot can show the frame the
 compositor last presented, which on software GL lags the draw by a frame or two */
 const res = await p.evaluate(([T, v]) => { const rep = GC3D.renderAt(T, v); return {rep, png: GC3D.S.renderer.domElement.toDataURL('image/png')}; }, [T, name]);
 fs.writeFileSync(path.join(out, 'shot753_' + (look || 'day') + '_' + name + '.png'), Buffer.from(res.png.split(',')[1], 'base64')); R.shots[(look || 'day') + '_' + name] = res.rep; };
 /* one composed plate screenshot, for the race-control strip over the scene */
 const composed = async () => { await p.evaluate(() => { GC3D.X.applyLook(GC3D.S, GC3D.X.lookOf('day')); GC3D.simReset(); GC3D.setView('chase'); GC3D.S.paused = false; }); await p.waitForTimeout(6000); const plate = await p.$('#showPlate'); await plate.screenshot({path: path.join(out, 'shot753_plate_with_hud.png')}); R.hudLive = await p.evaluate(() => { GC3D.S.paused = true; const h = document.querySelector('.gc3dx-hud'); return h ? {hidden: h.hidden, text: h.innerText.replace(/\s+/g, ' ').slice(0, 200), report: GC3D.sceneReport()} : null; }); };
 await shot('chase', 14); await shot('wide', 22); await shot('heli', 30); await shot('top', 8); await shot('onboard', 18); await shot('detail', 12); await shot('frontdetail', 9);
 await shot('chase', 16, 'dusk'); await shot('wide', 24, 'dusk'); await shot('chase', 14, 'dark'); await shot('heli', 26, 'dark'); await shot('onboard', 20, 'dark'); await shot('chase', 40, 'dark'); await composed();
 R.hud = await p.evaluate(() => { const h = document.querySelector('.gc3dx-hud'); return h ? h.innerText.replace(/\s+/g, ' ').slice(0, 200) : null; });
 R.lap = await p.evaluate(() => { GC3D.simReset(); let t = 0; while (t < 140) { GC3D.X.step(GC3D.S, 1 / 30); t += 1 / 30; } return GC3D.sceneReport(); });
 R.report = await p.evaluate(() => GC3D.graphicsReport());
 }
 R.errors = s.errors; fs.writeFileSync(path.join(out, 'practice_results.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); await s.browser.close();
})();
