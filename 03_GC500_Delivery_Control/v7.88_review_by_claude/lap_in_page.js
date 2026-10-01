// Independent full-lap check of v7.88 INSIDE THE REAL PAGE (not the offline preview). Read-only: GETs only, writes aborted.
// Drives the page's own Showcase on the 3D day backdrop with the original fixed-step physics (GC3D.step 1/120), never
// assigning distance. Every 50 m: detail on, distance continuity, pose jump, nearest added detail. Pictures every 250 m and
// across the start/finish join. PAGE=<built page> OUT=<dir> node lap_in_page.js
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs'), path = require('path'); const OUT = process.env.OUT;
(async () => { const s = await open({pageFile: process.env.PAGE, W: 1280, H: 720, gl: true}), p = s.page; p.setDefaultTimeout(600000);
  const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  await p.waitForFunction(() => typeof showOpen === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000});
  await p.evaluate(() => showOpen()); await new Promise(r => setTimeout(r, 4000));
  await p.evaluate(() => { const b = document.getElementById('showPause'); if (b && /Pause/.test(b.textContent)) b.click(); const l = document.getElementById('showLoop'); if (l && /on/i.test(l.textContent)) l.click(); });
  await p.evaluate(() => { const e = document.getElementById('showBackdrop'); e.value = 'circuit3d_day'; e.dispatchEvent(new Event('change', {bubbles: true})); });
  await p.waitForFunction(() => window.GC3D && GC3D.S && GC3D.S.sim && GC3D.S.CL, null, {timeout: 300000});
  await new Promise(r => setTimeout(r, 6000));
  const R = await p.evaluate(() => { const G = GC3D, S = G.S; S.paused = true; S.qualityChoice = 'manual'; const M = G.M_PER_PT || 6;
    window.__A = {s0: S.sim.s, lap0: S.sim.lap, prevPose: S.pose.pos.slice(), maxPose: 0, maxDs: 0, neg: 0, nonfinite: 0, steps: 0, poseJumps: []};
    return {report: G.fullLapReport788 ? G.fullLapReport788() : null, lapM: S.CL.L * M, view: S.view, detail: S.detail781Enabled, s0: S.sim.s * M, gridS: S.gridS != null ? S.gridS * M : null}; });
  console.log('start', JSON.stringify({lapM: R.lapM, view: R.view, detail: R.detail, enabled: R.report && R.report.enabled, limited: R.report && R.report.limitedByDevice, track: R.report && R.report.track && {bins: R.report.track.coverageBins, frac: R.report.track.coverageFraction, kerbs: R.report.track.kerbProfiles}}));
  const samples = [], lapM = R.lapM, shots = [];
  const sample = async (target, shoot) => { const r = await p.evaluate(tg => { const G = GC3D, S = G.S, A = __A, M = G.M_PER_PT || 6; let n = 0;
      while ((S.sim.s - A.s0) * M < tg && n < 120 * 900) { const ps = S.sim.s, pp = S.pose.pos.slice(); G.step(1 / 120); n++; A.steps++;
        const ds = (S.sim.s - ps) * M, dp = Math.hypot(...S.pose.pos.map((v, i) => v - pp[i])) * M; if (ds < -1e-9) A.neg++; A.maxDs = Math.max(A.maxDs, ds); if (dp > A.maxPose) A.maxPose = dp; if (dp > 3) A.poseJumps.push({at: (S.sim.s - A.s0) * M, dp});
        if (![S.sim.s, ...S.pose.pos, ...S.cam.eye].every(Number.isFinite)) A.nonfinite++; }
      let near = Infinity; const tr = S.trackDetail781; if (tr && tr.mesh && tr.mesh.v) { const v = tr.mesh.v, q = S.pose.pos; for (let i = 0; i < v.length; i += 12) near = Math.min(near, Math.hypot(q[0] - v[i], q[2] - v[i + 2]) * M); }
      return {at: (S.sim.s - A.s0) * M, lap: S.sim.lap, detail: S.detail781Enabled, near, track: !!S.trackDetail781, arch: !!S.architecture781, veg: !!S.vegetation781, gl: S.gl.getError(), speed: S.sim.v * M}; }, target);
    if (shoot) { await p.evaluate(() => { if (!GC3D.S) throw new Error('the Showcase scene was unmounted at ' + JSON.stringify(document.getElementById('showcase') && document.getElementById('showcase').innerText.slice(0, 80))); GC3D.render(); }); const f = 'lap_' + String(Math.round(target)).padStart(4, '0') + 'm.png'; await p.locator('#showcase canvas').first().screenshot({path: path.join(OUT, f), timeout: 300000}).catch(async () => { await p.screenshot({path: path.join(OUT, f)}); }); r.shot = f; shots.push(f); }
    samples.push(r); return r; };
  await sample(0, true);
  for (let m = 50; m <= lapM + 100; m += 50) { const shoot = m % 250 === 0 || (m > lapM - 60 && m < lapM + 60); const r = await sample(m, shoot); if (m % 500 === 0) console.log('at', Math.round(r.at), 'lap', r.lap, 'detail', r.detail, 'near', r.near.toFixed(1)); }
  const A = await p.evaluate(() => __A);
  const out = {lapM, samples: samples.length, everyDetailOn: samples.every(x => x.detail && x.track), maxNearDetailM: Math.max(...samples.map(x => x.near)), glErrors: samples.filter(x => x.gl).length,
    lapCompleted: samples[samples.length - 1].at >= lapM, lapCounter: samples.map(x => x.lap).filter((v, i, a) => a.indexOf(v) === i), maxStepM: A.maxDs, maxPoseStepM: A.maxPose, poseJumps: A.poseJumps.slice(0, 10), reverse: A.neg, nonfinite: A.nonfinite, steps: A.steps,
    gaps: samples.filter((x, i) => i && x.at - samples[i - 1].at > 52).length, pageErrors: s.errors, consoleErrors: [...new Set(cons)].slice(0, 10), blockedWrites: s.counts.blocked, shots};
  fs.writeFileSync(path.join(OUT, 'lap_in_page.json'), JSON.stringify({summary: out, samples}, null, 1)); console.log('SUMMARY', JSON.stringify(out));
  await s.browser.close(); })();
