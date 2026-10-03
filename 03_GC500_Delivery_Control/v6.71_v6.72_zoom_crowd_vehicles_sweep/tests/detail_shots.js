// close-ups of the crowd and of every vehicle, from a fixed debug camera, to judge detail: node detail_shots.js <url> <tag> [only]
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  const tag = process.argv[3] || 'x', only = process.argv[4] || '';
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500);
  await page.evaluate(() => { const s = document.querySelector('#showBackdrop'); s.value = 'circuit3d_day'; s.dispatchEvent(new Event('change', {bubbles: true})); }); await page.waitForTimeout(9000); await page.evaluate(() => document.querySelector('#showPause').click()); await page.waitForTimeout(500);
  await page.evaluate(() => { const S = GC3D.S; S.paused = true; });
  const info = await page.evaluate(() => { const S = GC3D.S; return {people: S.crowdMesh && S.crowdMesh.people, verts: S.crowdMesh && S.crowdMesh.nv, q: S.quality && S.quality.name, pts: (S.crowdPts || []).length, stand: S.stands && S.stands[0] && S.stands[0].at}; });
  console.log('crowd', JSON.stringify(info));
  const shot = async n => { await page.waitForTimeout(1500); await page.screenshot({path: `detail/${tag}_${n}.png`, timeout: 120000, clip: {x: 0, y: 80, width: 1200, height: 390}}); };
  const cam = (eye, tgt, fov) => page.evaluate(([e, t, f]) => { const S = GC3D.S; S.camDebug = {eye: e, tgt: t, fov: f || 40}; GC3D.camStep(1 / 60); GC3D.camStep(1 / 60); S.needsRender = true; }, [eye, tgt, fov]);
  if (!only || only === 'crowd') {
    // a trackside crowd: pick crowd heads near the track, look at them from the track at eye height
    const c = await page.evaluate(() => { const S = GC3D.S, P = S.crowdPts; let best = null, bd = 1e9;
      for (const h of P) { const d = S.distToTrack ? S.distToTrack(h[0], h[2]) : 99; if (d > .6 && d < 2.5 && d < bd) { bd = d; best = h; } }
      if (!best) best = P[0]; let bs = 0, bb = 1e9; for (let s = 0; s < S.CL.L; s += .25) { const p = S.CL.at(s), d = Math.hypot(p[0] - best[0], p[1] - best[2]); if (d < bb) { bb = d; bs = s; } }
      const p = S.CL.at(bs); return {head: best, road: [p[0], S.tune.deckH, p[1]]}; });
    const h = c.head, r = c.road, dx = h[0] - r[0], dz = h[2] - r[2], L = Math.hypot(dx, dz) || 1;
    await cam([h[0] - dx / L * 1.1, h[1] + .05, h[2] - dz / L * 1.1], [h[0], h[1] - .08, h[2]], 45); await shot('crowd_close');
    await cam([h[0] - dx / L * 2.6 + dz / L * 1.2, h[1] + .35, h[2] - dz / L * 2.6 - dx / L * 1.2], [h[0], h[1] - .1, h[2]], 45); await shot('crowd_wide');
    // a grandstand, from the track
    const st = await page.evaluate(() => { const S = GC3D.S, s = S.stands[0]; if (!s) return null; let bs = 0, bb = 1e9; for (let q = 0; q < S.CL.L; q += .25) { const p = S.CL.at(q), d = Math.hypot(p[0] - s.at[0], p[1] - s.at[1]); if (d < bb) { bb = d; bs = q; } } const p = S.CL.at(bs); return {at: s.at, road: [p[0], S.tune.deckH, p[1]], H: S.tune.deckH}; });
    if (st) { const ax = st.at[0] - st.road[0], az = st.at[1] - st.road[2], l = Math.hypot(ax, az) || 1;
      await cam([st.road[0] - ax / l * .3, st.H + .35, st.road[2] - az / l * .3], [st.at[0], st.H + .6, st.at[1]], 50); await shot('stand'); }
  }
  if (!only || only === 'veh') {
    for (const v of ['car_vms', 'car_loo', 'forklift', 'boom', 'scissor', 'tractor']) {
      await page.evaluate(v => { const S0 = GC3D.S; if (S0) S0.camDebug = null; document.querySelector('#showVehicle').value = v; showVehicleSet(v); }, v);
      await page.waitForFunction(() => GC3D.S && GC3D.S.CL && GC3D.S.sim, null, {timeout: 60000}); await page.waitForTimeout(1500);
      await page.evaluate(v => { const S = GC3D.S; S.camDebug = null; S.paused = true;
        S.sim.s = (S.gridS + 30) % S.CL.L; S.sim.v = 0; for (let i = 0; i < 240; i++) { GC3D.step(1 / 60); if (GC3D.trailerStep) GC3D.trailerStep(S); } }, v);
      for (const [n, ang, dist, up] of [['side', 1.35, 1.1, .25], ['rear', 2.6, 1.3, .35]]) {
        const pose = await page.evaluate(() => { const S = GC3D.S; const p = S.pose.pos, h = S.pose.heading != null ? S.pose.heading : 0, T = S.trailer; return {p, h, tr: T && T.ax != null ? [T.ax, 0, T.az] : null, fwd: S.pose.fwd || null}; });
        const p = pose.p, f = pose.fwd || [Math.cos(pose.h), 0, Math.sin(pose.h)];
        const c = pose.tr && (v === 'car_vms' || v === 'car_loo') ? [(p[0] + pose.tr[0]) / 2, p[1], (p[2] + pose.tr[2]) / 2] : p;
        const ca = Math.cos(ang), sa = Math.sin(ang), dir = [f[0] * ca - f[2] * sa, 0, f[0] * sa + f[2] * ca];
        await cam([c[0] + dir[0] * dist, c[1] + up, c[2] + dir[2] * dist], [c[0], c[1] + .06, c[2]], 42); await shot(v + '_' + n);
      }
    }
  }
  console.log('errors', JSON.stringify(errs.slice(0, 5)));
  await browser.close(); })();
