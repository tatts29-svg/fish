// Captures the Coates Way hero loop from the cog exhibit (mechanism.html?hero=1): the cog spins on its stand,
// comes apart into its exploded view while the camera circles it, and goes back together — one seamless loop.
// usage: node hero_capture.js <outdir> [frames] [width] [height]
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || 'hero_frames', N = +(process.argv[3] || 420), W = +(process.argv[4] || 1920), H = +(process.argv[5] || 1194), SKIP = +(process.argv[6] || 1);
const FPS = 30, T = N * SKIP / FPS; // SKIP>1 previews every SKIP-th frame of the same loop
fs.mkdirSync(out, {recursive: true});
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const pg = await b.newPage({viewport: {width: W, height: H}, deviceScaleFactor: 1});
  pg.on('pageerror', e => console.log('pageerror', e.message));
  await pg.goto('http://127.0.0.1:8821/mechanism.html?hero=1&quality=laptop', {waitUntil: 'load'});
  await pg.waitForFunction(() => window.__mech && window.__mech.camera, null, {timeout: 60000});
  const info = await pg.evaluate(() => {
    const m = window.__mech; const c = m.renderer.domElement;
    // fit twice to learn the framing for the assembled cog and the exploded set
    m.fitNow('3d', {spread: 0}); const a = {pos: m.camera.position.toArray(), tgt: m.controls.target.toArray()};
    m.fitNow('3d', {spread: 1}); const e = {pos: m.camera.position.toArray(), tgt: m.controls.target.toArray()};
    return {canvas: [c.width, c.height], a, e, spread: m.drive.spread, running: m.drive.running};
  });
  console.log(JSON.stringify(info));
  await pg.evaluate(({a, e}) => { window.__heroA = a; window.__heroE = e; window.__T = window.__mech.T; }, info);
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const t = i * SKIP / FPS;
    const data = await pg.evaluate(([t, T, dt, i, SKIP]) => {
      const m = window.__mech, d = m.drive;
      // script: motor from the first frame, release at 2.5 s, back together at 8.5 s, motor again once assembled
      if (i === 0) { d.reset(); d.speed = 1; d.start(); window.__mech.resize(); }
      for (let k = 0; k < SKIP; k++) {
        const tk = t + k * dt;
        if (Math.abs(tk - 2.5) < dt / 2) d.requestSpread(1);
        if (Math.abs(tk - 8.5) < dt / 2) d.requestSpread(0);
        if (tk > 8.5 && d.assembled && d.stationary && !d.running) d.start();
        d.advance(dt);
      }
      // camera: one full circle per loop, a gentle rise and fall, and a pull-back that follows the spread
      const s = d.spread, A = window.__heroA, E = window.__heroE;
      const cA = new window.__T.Vector3().fromArray(A.tgt), cE = new window.__T.Vector3().fromArray(E.tgt);
      const centre = cA.clone().lerp(cE, s);
      const rA = new window.__T.Vector3().fromArray(A.pos).sub(cA).length(), rE = new window.__T.Vector3().fromArray(E.pos).sub(cE).length();
      const r = rA * 0.74 + (rE * 0.83 - rA * 0.74) * s;
      const az = Math.PI * 2 * t / T + 0.55, el = 0.36 + 0.10 * Math.sin(Math.PI * 2 * t / T);
      m.camera.position.set(centre.x + r * Math.cos(el) * Math.sin(az), centre.y + r * Math.sin(el), centre.z + r * Math.cos(el) * Math.cos(az));
      m.controls.target.copy(centre); m.camera.lookAt(centre); m.camera.updateMatrixWorld();
      m.step(0);
      return m.frameNow();
    }, [t, T, 1 / FPS, i, SKIP]);
    fs.writeFileSync(path.join(out, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    if (i % 30 === 0) console.log('frame', i, 'of', N, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  await b.close();
  console.log('done', N, 'frames in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();
