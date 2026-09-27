/* machine v6.92 checks — the enclosed, bigger hall at work; the cockpit as the driver's eyes; the cockpit's clicks, clangs and systems.
   Serves this set itself with serve.js (same MIME table, extension allowlist and page CSP as the live /w/ route) and drives it in
   headless Chromium (SwiftShader). Usage:  node _qa/test_v6_92.js [root] [port]  > _qa/test_v6_92_output.txt
   Andrew Fisher, 27 Sep 2026 — Coates Industrial Solutions · GC500 2026. */
const {chromium} = require('/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/node_modules/playwright');
const {spawn} = require('child_process'), path = require('path');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..')), PORT = +(process.argv[3] || 8793), URL = `http://127.0.0.1:${PORT}/index.html`;
const ARGS = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const results = []; const check = (name, ok, detail) => { results.push({name, ok: !!ok}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); };
const frames = (page, n = 2) => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, 'serve.js'), ROOT, String(PORT)], {stdio: 'ignore'});
  await new Promise(r => setTimeout(r, 700));
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ARGS});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 800}}), page = await ctx.newPage();
    const errors = [], fetched = [];
    page.on('pageerror', e => errors.push('pageerror ' + String(e).slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errors.push('console.error ' + m.text().slice(0, 200)); });
    page.on('request', r => fetched.push({url: r.url(), at: Date.now()}));
    await page.goto(URL, {waitUntil: 'load', timeout: 180000});
    await page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 600000, polling: 1000});
    await page.waitForFunction(() => !window.__cw.tween, null, {timeout: 120000, polling: 500});
    await page.waitForTimeout(2000);

    /* ------------------------------------------------------------ the car view: cost of a frame */
    const info = await page.evaluate(() => { const r = __cw.renderer; r.info.autoReset = false; r.info.reset(); r.render(__cw.scene, __cw.camera); const i = {calls: r.info.render.calls, triangles: r.info.render.triangles}; r.info.autoReset = true; return i; });
    console.log('INFO car view renderer.info ' + JSON.stringify(info));

    /* ------------------------------------------------------------ A. THE HALL: bigger, shut, and nothing of outside anywhere */
    const hall = await page.evaluate(async () => {
      const T = await import('./vendor/three.module.js'), {GARAGE: G} = await import('./pit-garage.js'), sc = __cw.scene;
      const garage = sc.getObjectByName('pit-garage'); garage.updateMatrixWorld(true); const out = []; const b = new T.Box3(); let meshes = 0;
      garage.traverse(o => { if (!(o.isMesh || o.isPoints) || !o.geometry || (o.material && o.material.visible === false)) return;   /* pick boxes are invisible */ meshes++; b.setFromObject(o); const m = .5;
        if (b.min.x < G.front - m || b.max.x > G.back + m || b.min.z < G.far - m || b.max.z > G.near + m || b.max.y > G.height + .5 || b.min.y < -.6) out.push({name: o.name, min: b.min.toArray().map(v => +v.toFixed(2)), max: b.max.toArray().map(v => +v.toFixed(2))}); });
      return {G: {length: G.back - G.front, width: G.near - G.far, height: G.height}, meshes, outside: out, background: '#' + sc.background.getHexString(), door: !!sc.getObjectByName('roller door, shut')};
    });
    check('A1 the hall is ~1.5x the old 36 × 28 × 9 m', hall.G.length >= 50 && hall.G.width >= 40 && hall.G.height >= 12, hall.G);
    check('A2 the roller door is shut and nothing of the garage stands outside its walls (every mesh bounds inside the hall)', hall.door && hall.outside.length === 0, {meshes: hall.meshes, outside: hall.outside.slice(0, 5)});
    check('A3 the background is a dark interior colour', /^#1[0-9a-f]1[0-9a-f]1[0-9a-f]$/.test(hall.background), hall.background);
    /* the ring: every reachable place at the zoom limit, four heights, twelve bearings, looking at the car and away from it, and up and
       down; each frame through the app's own controls and confinement, rendered with a magenta background — a magenta pixel is outside */
    const ring = await page.evaluate(async () => {
      const T = await import('./vendor/three.module.js'), r = __cw.renderer, sc = __cw.scene, cam = __cw.camera, ctl = __cw.controls;
      const W = 200, H = 125, rt = new T.WebGLRenderTarget(W, H), buf = new Uint8Array(W * H * 4), bg = sc.background, keep = {p: cam.position.clone(), t: ctl.target.clone()};
      const views = [], d = ctl.maxDistance;
      for (const y of [.4, 3, 7, 11.6]) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; views.push([[Math.cos(a) * d, y, Math.sin(a) * d], [0, .7, 0]], [[Math.cos(a) * d, y, Math.sin(a) * d], [Math.cos(a) * (d + 30), y, Math.sin(a) * (d + 30)]]); }
      for (const [x, z] of [[0, 0], [-20, 15], [20, -15]]) views.push([[x, 11.6, z], [x + .01, 30, z]], [[x, 1, z], [x + .01, -30, z]]);
      r.setAnimationLoop(null); sc.background = new T.Color(1, 0, 1); const c2 = cam.clone(); c2.aspect = W / H; c2.updateProjectionMatrix();
      let magenta = 0, worst = 0, maxOut = -Infinity; const G = (await import('./pit-garage.js')).GARAGE;
      for (const [p, t] of views) { cam.position.set(...p); ctl.target.set(...t); ctl.update(); __cw.confine(); cam.lookAt(ctl.target); c2.position.copy(cam.position); c2.quaternion.copy(cam.quaternion); c2.updateMatrixWorld();
        const P = cam.position; maxOut = Math.max(maxOut, G.front - P.x, P.x - G.back, G.far - P.z, P.z - G.near, P.y - G.height, -P.y);
        r.setRenderTarget(rt); r.render(sc, c2); r.readRenderTargetPixels(rt, 0, 0, W, H, buf); r.setRenderTarget(null);
        let m = 0; for (let j = 0; j < buf.length; j += 4) if (buf[j] > 235 && buf[j + 1] < 30 && buf[j + 2] > 235) m++; magenta += m; worst = Math.max(worst, m); }
      sc.background = bg; rt.dispose(); cam.position.copy(keep.p); ctl.target.copy(keep.t); ctl.update(); return {views: views.length, pixels: views.length * W * H, magenta, worst, cameraFurthestPastAWall: +maxOut.toFixed(3)};
    });
    check('A4 the 360 ring: no pixel of outside from any reachable camera place (background seen nowhere)', ring.magenta === 0 && ring.cameraFurthestPastAWall < 0, ring);
    await page.evaluate(() => __cw.renderer.setAnimationLoop(null));
    await page.reload({waitUntil: 'load'}); await page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 600000, polling: 1000}); await page.waitForFunction(() => !window.__cw.tween, null, {timeout: 120000, polling: 500});
    /* the machinery: which movers' transforms change between frames, over three seconds of real (slow, software-rendered) frames */
    const snapA = await page.evaluate(() => __cw.machinery.snapshot()); await page.waitForTimeout(3000); await frames(page, 2);
    const snapB = await page.evaluate(() => __cw.machinery.snapshot());
    const names = await page.evaluate(() => __cw.machinery.movers.map(o => o.name));
    const moved = snapA.map((v, i) => v !== snapB[i]).filter(Boolean).length;
    check('A5 operating machinery: objects whose transforms change between frames', moved >= 20, {moved, movers: snapA.length, still: names.filter((n, i) => snapA[i] === snapB[i])});
    for (const v of ['car', 'engine']) {
      await page.evaluate(v => __cw.setView(v), v); await page.waitForTimeout(600); await page.waitForFunction(() => !window.__cw.tween, null, {timeout: 180000, polling: 500});
      const hits = await page.evaluate(async () => { const T = await import('./vendor/three.module.js'), cam = __cw.camera, mx = __cw.machinery.group; mx.updateMatrixWorld(true); const ray = new T.Raycaster(), P = new T.Vector3(), d = new T.Vector3(); let n = 0, hit = 0; const who = {};
        for (let i = 0; i <= 12; i++) for (let j = 0; j <= 6; j++) for (const z of [-1, 0, 1]) { P.set(-2.4 + 4.8 * i / 12, .05 + 1.1 * j / 6, z); d.subVectors(P, cam.position); const L = d.length(); ray.set(cam.position, d.normalize()); ray.far = L; n++; const h = ray.intersectObject(mx, true)[0]; if (h) { hit++; who[h.object.name] = (who[h.object.name] || 0) + 1; } }
        return {rays: n, blocked: hit, who, camera: cam.position.toArray().map(v => +v.toFixed(2))}; });
      check(`A6 no machinery between the ${v} view's camera and the car`, hits.blocked === 0, hits);
    }

    /* ------------------------------------------------------------ B. THE COCKPIT IS THE DRIVER'S EYES */
    await page.evaluate(() => __cw.setView('cog'));
    await page.waitForTimeout(500); await page.waitForFunction(() => !window.__cw.tween, null, {timeout: 300000, polling: 500}); await frames(page, 2);
    const eyeD = () => page.evaluate(() => { const e = __cw.eye(), c = __cw.camera.position; return +Math.hypot(e[0] - c.x, e[1] - c.y, e[2] - c.z).toFixed(5); });
    const seatState = await page.evaluate(() => { const d = __cw.cockpit.driver; const helmet = d.getObjectByName('Helmet'); return {eye: __cw.eye().map(v => +v.toFixed(3)), controlsEnabled: __cw.controls.enabled, helmetVisible: helmet.visible, armsVisible: d.getObjectByName('Driver, forearm').visible}; });
    const d1 = await eyeD();
    check('B1 cockpit camera at the driver\'s eye point (wheel together): distance < 0.02 m', d1 < .02, {distance: d1, ...seatState});
    check('B2 first person: helmet off the camera\'s head, own arms in view, orbit controls off', !seatState.helmetVisible && seatState.armsVisible && !seatState.controlsEnabled, seatState);
    /* try to orbit (a drag off the wheel) and to zoom (the scroll wheel, the + / − buttons, the keyboard): the camera must not move */
    const before = await page.evaluate(() => ({p: __cw.camera.position.toArray(), yaw: __cw.seat.yaw}));
    const box = await page.locator('#canvas').boundingBox();
    await page.mouse.move(box.x + box.width * .12, box.y + box.height * .18); await page.mouse.down(); await page.mouse.move(box.x + box.width * .45, box.y + box.height * .30, {steps: 6}); await page.mouse.up();
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .3); await page.mouse.wheel(0, 900); await page.mouse.wheel(0, -900);
    await page.click('#zoom-out'); await page.click('#zoom-out'); await page.locator('#canvas').focus(); await page.keyboard.press('-');
    await page.waitForTimeout(800); await frames(page, 3);
    const after = await page.evaluate(() => ({p: __cw.camera.position.toArray(), yaw: __cw.seat.yaw, d: (() => { const e = __cw.eye(), c = __cw.camera.position; return Math.hypot(e[0] - c.x, e[1] - c.y, e[2] - c.z); })()}));
    const moveM = Math.hypot(after.p[0] - before.p[0], after.p[1] - before.p[1], after.p[2] - before.p[2]);
    check('B3 no orbit, no zoom in the cockpit: a drag, the scroll wheel, the zoom buttons and − leave the camera where it was (< 5 mm) and at the eye', moveM < .005 && after.d < .02, {moved_m: +moveM.toFixed(5), eyeDistance: +after.d.toFixed(5)});
    check('B4 the drag turned the driver\'s head instead (looking round works)', Math.abs(after.yaw - before.yaw) > .05, {yawBefore: +before.yaw.toFixed(3), yawAfter: +after.yaw.toFixed(3)});
    const lim = await page.evaluate(() => { __cw.seatLookAt(9, 9, true); const a = {yaw: __cw.seat.yaw, pitch: __cw.seat.pitch}; __cw.seatLookAt(-9, -9, true); const b = {yaw: __cw.seat.yaw, pitch: __cw.seat.pitch}; __cw.seatHome(); return {max: a, min: b}; });
    check('B5 head-turn limits: ±100° yaw, −50° … +30° pitch', Math.abs(lim.max.yaw * 180 / Math.PI - 100) < .01 && Math.abs(lim.min.yaw * 180 / Math.PI + 100) < .01 && Math.abs(lim.max.pitch * 180 / Math.PI - 30) < .01 && Math.abs(lim.min.pitch * 180 / Math.PI + 50) < .01, lim);
    /* the wheel apart: the camera stays at the eyes */
    await page.click('#explode'); await page.evaluate(() => __cw.advance(6)); await frames(page, 3); await page.waitForTimeout(1200);
    const d2 = await eyeD(), spread = await page.evaluate(() => __cw.drive.spread);
    check('B6 cockpit camera at the driver\'s eye point with the wheel apart: distance < 0.02 m (no exhibit eye)', d2 < .02 && spread > .9, {distance: d2, spread});
    await page.evaluate(() => __cw.advance(.1)); await page.click('#explode'); await page.evaluate(() => __cw.advance(6)); await frames(page, 2);
    /* the head rides the car: steering leans it (the eye moves with it) */
    const lean = await page.evaluate(async () => { const e0 = __cw.eye(); __cw.setSteer(1.5); return e0; });
    await frames(page, 3); const lean2 = await page.evaluate(() => { const e = __cw.eye(); __cw.setSteer(0); return e; });
    check('B7 the head leans with the steering (the eye point moves with it) and the camera follows', Math.hypot(lean2[0] - lean[0], lean2[1] - lean[1], lean2[2] - lean[2]) > .002 && (await eyeD()) < .02, {eyeMoved_m: +Math.hypot(lean2[0] - lean[0], lean2[1] - lean[1], lean2[2] - lean[2]).toFixed(4)});
    await frames(page, 2);

    /* ------------------------------------------------------------ C. EVERY CONTROL CLICKS AND WORKS; THE WHEEL OPERATES EVERYTHING */
    const fmBefore = fetched.filter(f => /coates-fm\.mp3/.test(f.url)).length;
    await page.click('#sound'); await page.waitForFunction(() => __cw.audio.enabled, null, {timeout: 20000});
    const tSound = Date.now();
    /* instrument the audio layer: every clip and every synthesised sound asked for, and whether it played */
    await page.evaluate(() => { const a = __cw.audio; window.__req = []; for (const k of ['fx', 'play']) { const f = a[k].bind(a); a[k] = (id, ...r) => { const ok = f(id, ...r); window.__req.push({k, id, ok}); return ok; }; } });
    const specs = await page.evaluate(() => __cw.controlSpecs().map((c, i) => ({i, kind: c.kind, id: c.id || null, dir: c.dir || null, part: c.part || null, src: c.src || null})));
    const perControl = [];
    for (const s of specs) {
      const ids = await page.evaluate(async i => { window.__req = []; __cw.operate(__cw.controlSpecs()[i]); await new Promise(r => setTimeout(r, 450)); return window.__req.map(x => x.id + (x.ok ? '' : '(-)')); }, s.i);
      perControl.push({control: `${s.src}:${s.kind}:${s.id || s.dir}:${s.part}`, sounds: ids});
    }
    const silent = perControl.filter(c => !c.sounds.length);
    check('C1 every cockpit control requests a sound when operated', silent.length === 0, {controls: perControl.length, silent});
    const synth = perControl.filter(c => c.sounds.some(id => !/\(-\)$/.test(id) && !/^(ui-|v8-|starter|dog-engage)/.test(id)));
    check('C2 each control\'s sound is a synthesised mechanical one that actually played (sound on)', synth.length === perControl.length, {withSynth: synth.length, of: perControl.length});
    console.log('INFO sounds per control ' + JSON.stringify(perControl));
    const kinds = new Set(perControl.flatMap(c => c.sounds.map(s => s.replace(/\(-\)$/, ''))));
    check('C3 the distinct mechanical sounds are all in use', ['toggle-on', 'toggle-off', 'guard-open', 'guard-close', 'button', 'rotary', 'key', 'relay', 'clang', 'dog', 'paddle', 'fuel-prime', 'selftest', 'fan-spool', 'lamp', 'pit-on', 'radio-on', 'ratchet', 'hb-release', 'arm', 'lever'].every(k => kinds.has(k)), [...kinds].sort());
    const systems = ['IGN', 'FUEL', 'FAN', 'LIGHTS', 'START', 'PIT', 'RADIO', 'PAGE', 'NEUTRAL', 'HBRAKE', 'FIRE'];
    const onWheel = new Set(specs.filter(s => s.src === 'wheel').map(s => s.id || (s.dir > 0 ? 'UP' : 'DOWN')));
    check('C4 the wheel operates everything: every system has a control on the wheel (and both shifts on its paddles)', systems.every(s => onWheel.has(s)) && onWheel.has('UP') && onWheel.has('DOWN'), [...onWheel]);
    /* the starter: the solenoid before the pinion */
    const start = await page.evaluate(async () => { __cw.drive.stop(); for (let i = 0; i < 40 && !__cw.drive.stationary; i++) __cw.advance(.5); const c = __cw.cabin; const sp = __cw.controlSpecs(); if (!c.ign) __cw.operate(sp.find(x => x.id === 'IGN' && x.src === 'wheel')); if (!c.fuel) __cw.operate(sp.find(x => x.id === 'FUEL' && x.src === 'wheel')); if (c.hbrake) __cw.operate(sp.find(x => x.id === 'HBRAKE' && x.src === 'wheel'));
      await new Promise(r => setTimeout(r, 400)); window.__req = []; __cw.operate(sp.find(x => x.id === 'START' && x.src === 'wheel')); await new Promise(r => setTimeout(r, 500)); return {ids: window.__req.map(x => x.id), running: __cw.drive.running}; });
    check('C5 START from the wheel: button click, starter solenoid, then the starter and the V8', start.running && start.ids.indexOf('solenoid') >= 0 && start.ids.indexOf('solenoid') < start.ids.indexOf('starter-pinion'), start);
    /* the ignition's self-test and the lit buttons */
    const lit = await page.evaluate(() => { const sp = __cw.controlSpecs(), c = __cw.cabin; if (c.ign) __cw.operate(sp.find(x => x.id === 'IGN' && x.src === 'wheel')); __cw.operate(sp.find(x => x.id === 'IGN' && x.src === 'wheel')); const testing = __cw.cockpit.selfTesting;
      __cw.advance(.1); const cap = __cw.cockpit.litCaps.find(l => l.id === 'IGN'); return {testing, ign: c.ign, capGlow: +cap.cap.material.emissiveIntensity.toFixed(2)}; });
    await frames(page, 2); const capNow = await page.evaluate(() => +__cw.cockpit.litCaps.find(l => l.id === 'IGN').cap.material.emissiveIntensity.toFixed(2));
    check('C6 ignition on runs the dash self-test and lights the IGN button on the wheel', lit.testing && lit.ign && capNow > 1, {...lit, capNow});
    /* the radio: Coates FM, fetched only after Sound on; the V8 ducked about 10 dB while it plays; RADIO again stops it */
    await page.evaluate(() => { if (__cw.cabin.radio) __cw.operate(__cw.controlSpecs().find(x => x.id === 'RADIO' && x.src === 'wheel')); });
    await page.waitForTimeout(600);
    await page.evaluate(() => { window.__req = []; __cw.operate(__cw.controlSpecs().find(x => x.id === 'RADIO' && x.src === 'wheel')); });
    await page.waitForFunction(() => __cw.audio.radioPlaying, null, {timeout: 60000}).catch(() => {});
    await page.waitForTimeout(1500);
    const radio = await page.evaluate(() => ({ids: window.__req.map(x => x.id), playing: !!__cw.audio.radioPlaying, missing: !!__cw.audio.radioMissing, duck: +__cw.audio.duck.gain.value.toFixed(3), duckDb: +(20 * Math.log10(__cw.audio.duck.gain.value)).toFixed(1), cabin: __cw.cabin.radio}));
    const fm = fetched.filter(f => /coates-fm\.mp3/.test(f.url));
    check('C7 RADIO plays assets/audio/coates-fm.mp3, fetched only after Sound on', fmBefore === 0 && fm.length >= 1 && fm.every(f => f.at >= tSound) && radio.playing && radio.ids.includes('radio-on'), {fetchesBeforeSoundOn: fmBefore, fetchesAfter: fm.length, ...radio});
    check('C8 the V8 is ducked about 10 dB under the radio', radio.duckDb < -9 && radio.duckDb > -11, {duckDb: radio.duckDb});
    await page.evaluate(() => { window.__req = []; __cw.operate(__cw.controlSpecs().find(x => x.id === 'RADIO' && x.src === 'panel')); });
    await page.waitForTimeout(1500);
    const off = await page.evaluate(() => ({ids: window.__req.map(x => x.id), playing: !!__cw.audio.radioPlaying, duck: +__cw.audio.duck.gain.value.toFixed(3)}));
    check('C9 RADIO again: click-off, the music stops and the V8 comes back up', !off.playing && off.ids.includes('radio-off') && off.duck > .95, off);

    await page.waitForTimeout(500);
    check('D1 no page errors, no console errors', errors.length === 0, errors.slice(0, 10));
  } finally { await browser.close(); server.kill(); }
  const n = results.filter(r => r.ok).length; console.log(`\n${n} / ${results.length} checks passed`);
  process.exit(n === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
