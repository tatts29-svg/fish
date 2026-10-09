// Author: Andrew Fisher. Read-only integration checks using the page's real motion and audio together.
// Run serially: flock /tmp/gc500-browser.lock env PAGE=... EXPECTED_SHA=... OUTDIR=... node showcase980.cjs
// PUBLIC=1 checks the live page without HTML substitution; MOB=1 uses the 390px phone viewport.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
const harness = path.resolve(__dirname, '../../toolchain/harness');
const fetcher = require(harness + '/curlfetch'), nativeFetch = fetcher.curlFetch;
const sha = process.env.EXPECTED_SHA, publicMode = process.env.PUBLIC === '1';
const file = publicMode ? undefined : process.env.PAGE, phone = process.env.MOB === '1', out = process.env.OUTDIR;
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert(/^[a-f0-9]{64}$/.test(sha || ''), 'EXPECTED_SHA must bind evidence to tested bytes');
assert(out, 'OUTDIR is required');
if (!publicMode) assert.equal(digest(fs.readFileSync(file)), sha);
let served;
fetcher.curlFetch = async (url, ...args) => {
  const r = await nativeFetch(url, ...args);
  if (/^\/v\/Coates-GC500-2026\/?$/.test(new URL(url).pathname)) served = digest(r.body);
  return r;
};
const {open} = require(harness + '/open_page.js');
fs.mkdirSync(out, {recursive: true});

(async () => {
  const h = await open({pageFile: file, gl: true, W: phone ? 390 : 1440, H: phone ? 844 : 900, mobile: phone, dpr: 1});
  const p = h.page, checks = [], observations = {};
  const check = (name, value) => { checks.push({name, pass: !!value}); assert(value, name); };
  const audioState = state => p.waitForFunction(s => GC3D.sound.ctx && GC3D.sound.ctx.state === s, state, {timeout: 15000});
  try {
    await p.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 150000});
    const nativeBefore = await p.evaluate(() => JSON.stringify(S));
    const prefsBefore = await p.evaluate(() => ({view: showViewGet(), quality: showQualityGet(), back: showBackPref(), engine: localStorage.getItem('gc500.showengine')}));
    if (publicMode) check('Exact public bytes; no HTML substitution', served === sha && h.counts.page === 0);
    await p.evaluate(() => { showOpen(); if (SHOW.playing) showPause(); });
    await p.waitForFunction(() => GC3D.startupReport971()?.shown && GC3D.S?.dressStats?.photoLandmarks970?.landmarks?.length === 5, null, {timeout: 150000});
    check('No audio context before Sound gesture', await p.evaluate(() => !GC3D.sound.ctx && !GC3D.sound.active));
    check('Opening retains quality, view, backdrop and engine preferences', await p.evaluate(v => showViewGet() === v.view && showQualityGet() === v.quality && showBackPref() === v.back && localStorage.getItem('gc500.showengine') === v.engine, prefsBefore));
    check('Photo landmarks and prepared track retained', await p.evaluate(() => GC3D.S.dressStats.photoLandmarks970.landmarks.length === 5 && GC3D.startupReport971().prepared && !GC3D.failed));

    // Use the actual control gesture. Paused presentation creates then suspends sound.
    await p.locator('#showSound').click();
    await audioState('suspended');
    check('Sound on while paused is silent', await p.evaluate(() => GC3D.sound.active && GC3D.sound.ctx.state === 'suspended'));
    await p.evaluate(() => { window.__audioContext980 = GC3D.sound.ctx; });
    await p.locator('#showPause').click();
    await audioState('running');
    await p.waitForFunction(() => !!GC3D.sound.nodes.engine, null, {timeout: 30000});
    check('Playing uses the same context and pulse engine', await p.evaluate(() => SHOW.playing && GC3D.sound.ctx === window.__audioContext980 && !!GC3D.sound.nodes.engine));
    await p.locator('#showPause').click();
    await audioState('suspended');
    const stoppedClock = await p.evaluate(() => GC3D.S.clock);
    await p.waitForTimeout(250);
    check('Pause freezes motion and suspends audio', await p.evaluate(t => !SHOW.playing && GC3D.S.clock === t && GC3D.sound.ctx.state === 'suspended', stoppedClock));

    // Feed actual fixed-step states into actual sound.tick. No independent speed fixtures.
    await p.evaluate(() => GC3D.sound.resume());
    await audioState('running');
    observations.track = await p.evaluate(() => {
      const G = GC3D, S = G.S, A = G.sound, rows = [];
      for (const pace of [.25, 1, 2]) {
        G.setPace(pace); G.simReset(); S.paused = true; S.fps = 60; A.log.length = 0;
        const start = S.sim.s, points = [], early = [], gears = new Set();
        let finite = true, bounded = true, stationary = true, rolling = true;
        let steps = 0, oldS = start, oldV = 0, minLaunchRpm = Infinity, maxRpm = 0, peakSlip = 0, peakSmoke = 0, peakOpening = 0;
        let audioSamples = 0, highRpm = 0, lapMinRpm = Infinity, lampEvents = null;
        while (S.sim.s - S.gridS < S.CL.L && steps++ < 180000) {
          G.step(1 / 120);
          const m = S.sim, realAge = (S.clock - G.GRID) * S.tune.tc;
          finite = finite && [m.s, m.v, m.slip, m.lat, m.pitch, m.roll, S.pose.hd, ...S.pose.pos].every(Number.isFinite);
          bounded = bounded && Math.abs(m.lat) <= S.tune.lineOffset + .001 && m.smoke.length <= 218 && m.marks.length <= S.tune.maxMarks;
          if (!m.go) {
            stationary = stationary && Math.abs(m.s - start) < 1e-9 && m.v === 0 && m.wheel === 0 && m.wheelR === 0 && Math.abs(m.lat) < 1e-9;
            peakOpening = Math.max(peakOpening, m.smoke.length);
          } else if (realAge < 1.2) {
            rolling = rolling && m.s >= oldS && m.v >= oldV - 1e-8;
            if (realAge > .12) rolling = rolling && m.v > 0 && m.s > start;
          }
          oldS = m.s; oldV = m.v;
          peakSlip = Math.max(peakSlip, Math.abs(m.slip)); peakSmoke = Math.max(peakSmoke, m.smoke.length);
          // 20Hz source-bound sound control is enough to observe the full physical lap.
          if (steps % 6 === 0) {
            A.tick(S);
            const d = A.lastDrive980;
            finite = finite && !!d && [d.rpm, d.thr, A.rpm].every(Number.isFinite);
            if (d) {
              maxRpm = Math.max(maxRpm, A.rpm); gears.add(A.gear); audioSamples++;
              if (A.rpm >= 6500) highRpm++;
              if (m.go) lapMinRpm = Math.min(lapMinRpm, A.rpm);
              if (m.go && realAge <= .8) minLaunchRpm = Math.min(minLaunchRpm, A.rpm);
              const point = {clock: S.clock, realAge, s: m.s - start, speedKmh: m.v * G.M_PER_PT / S.tune.tc * 3.6, rpm: A.rpm, targetRpm: d.rpm, gear: A.gear, throttle: d.thr, spin: d.spin, brake: m.brake};
              if (S.clock < G.GRID + 2 / S.tune.tc) early.push(point);
              if (steps % 60 === 0) points.push(point);
            }
          }
          if (m.go && lampEvents == null) lampEvents = A.log.filter(x => /^beep [1-5]$/.test(x.what)).map(x => ({what: x.what, clock: x.clock}));
        }
        rows.push({pace, steps, complete: S.sim.s - S.gridS >= S.CL.L, finite, bounded, stationary, rolling,
          minLaunchRpm, maxRpm, lapMinRpm, highRpmShare: highRpm / audioSamples, peakSlip, peakSmoke, peakOpening,
          gears: Array.from(gears), lampEvents, early, points});
      }
      return rows;
    });
    for (const row of observations.track) {
      check('Complete finite motion/audio lap at ' + row.pace + 'x', row.complete && row.finite);
      check('Stationary grid and smoke-free countdown at ' + row.pace + 'x', row.stationary && row.peakOpening === 0);
      check('Continuous pullaway without a second stop at ' + row.pace + 'x', row.rolling);
      check('Five sequential countdown tones at ' + row.pace + 'x', row.lampEvents?.map(x => x.what).join('|') === 'beep 1|beep 2|beep 3|beep 4|beep 5');
      check('Engine does not fall to idle at launch at ' + row.pace + 'x', row.minLaunchRpm >= 1900);
      check('Engine changes gear without staying at maximum RPM at ' + row.pace + 'x', row.maxRpm < 6800 && row.highRpmShare < .05 && Math.max(...row.gears) >= 4);
      check('Bounded grip and smoke at ' + row.pace + 'x', row.bounded && row.peakSlip < .196);
    }
    fs.writeFileSync(out + '/track-' + (phone ? 'phone' : 'desktop') + '.json', JSON.stringify(observations.track, null, 2));

    // Mode selection must not interrupt the main exhaust pulse or replace the context.
    await p.evaluate(() => { GC3D.setPace(1); GC3D.simReset(); GC3D.S.paused = true; GC3D.step(.02); GC3D.sound.tick(GC3D.S); window.__pulse980 = GC3D.sound.nodes.engine; });
    await p.locator('#showEngine').selectOption('engine');
    await p.evaluate(() => { GC3D.step(.02); GC3D.sound.tick(GC3D.S); });
    check('Designed V8 selection keeps the pulse and context', await p.evaluate(() => GC3D.sound.ctx === window.__audioContext980 && GC3D.sound.nodes.engine === window.__pulse980 && GC3D.sound.modePref() === 'engine'));
    await p.locator('#showEngine').selectOption('loops');
    await p.evaluate(() => { GC3D.sound.resume(); });
    await audioState('running');
    await p.evaluate(() => { GC3D.step(.02); GC3D.sound.tick(GC3D.S); });
    check('Loop selection keeps the pulse and preference', await p.evaluate(() => GC3D.sound.ctx === window.__audioContext980 && GC3D.sound.nodes.engine === window.__pulse980 && GC3D.sound.modePref() === 'loops'));

    // A restart must reset simulation and gearbox together. It must not create another context.
    await p.evaluate(() => GC3D.playback794.restart());
    check('Restart resets launch and gearbox together', await p.evaluate(() => GC3D.S.clock < .1 && !GC3D.S.sim.go && GC3D.sound.gear === 0 && GC3D.sound.ctx === window.__audioContext980));
    await audioState('running');
    // Dispatch the page's real visibility handler with an explicit hidden-document fixture.
    // This tests browser-event behaviour, not an operating-system app suspension claim.
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable: true, get: () => true}); document.dispatchEvent(new Event('visibilitychange')); });
    await audioState('suspended');
    check('Hidden page pauses motion and sound', await p.evaluate(() => !SHOW.playing && SHOW.pausedByTab && GC3D.sound.ctx.state === 'suspended'));
    await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await audioState('running');
    check('Visible page resumes the same context', await p.evaluate(() => SHOW.playing && GC3D.sound.ctx === window.__audioContext980));
    await p.locator('#showPause').click();
    await audioState('suspended');
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable: true, get: () => true}); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    check('Visibility never overrides a manual Pause', await p.evaluate(() => !SHOW.playing && GC3D.sound.ctx.state === 'suspended'));
    await p.locator('#showSound').click();
    check('Sound off disconnects engine sources', await p.evaluate(() => !GC3D.sound.active && !GC3D.sound.nodes.engine && !GC3D.sound.nodes.loops));

    // Render source-bound launch frames for root visual inspection.
    await p.evaluate(() => {
      const G = GC3D, S = G.S; G.setPace(1); G.simReset(); S.paused = true;
      G.setView('chase'); G.setLook('day');
      for (let i = 0; i < 390; i++) G.step(1 / 120);
      for (let i = 0; i < 60; i++) G.camStep(1 / 60);
      G.render();
    });
    check('Grid frame renders without GL error', await p.evaluate(() => GC3D.S.gl.getError() === 0));
    await p.screenshot({path: out + '/' + (phone ? 'phone' : 'desktop') + '-grid.png', timeout: 120000});
    await p.evaluate(() => { for (let i = 0; i < 240; i++) { GC3D.step(1 / 120); GC3D.camStep(1 / 120); } GC3D.render(); });
    check('Pullaway frame renders without GL error', await p.evaluate(() => GC3D.S.gl.getError() === 0));
    await p.screenshot({path: out + '/' + (phone ? 'phone' : 'desktop') + '-pullaway.png', timeout: 120000});
    await p.locator('#showBack').click();
    check('Back disposes scene and audio context', await p.evaluate(() => !SHOW.open && !GC3D.S && !GC3D._raceCarModels && !GC3D.sound.ctx && !GC3D.sound.active && !GC3D.playbackRuntime971.report().active));
    check('Selected engine preference survives closing', await p.evaluate(() => localStorage.getItem('gc500.showengine') === 'loops'));
    check('Complete native operational record unchanged', await p.evaluate(before => JSON.stringify(S) === before, nativeBefore));
    check('No page errors or operational write attempts', h.errors.length === 0 && h.counts.blocked === 0);
    if (!publicMode) check('Candidate bytes unchanged throughout test', digest(fs.readFileSync(file)) === sha);
    const result = {author: 'Andrew Fisher', sha256: sha, mobile: phone, actualPublic: publicMode, pass: true, checks,
      recordUnchanged: true, errors: h.errors, operationalWrites: h.counts.blocked,
      track: observations.track.map(({early, points, ...x}) => x),
      scope: 'Actual page fixed-step motion plus actual sound tick, controls, GL render and explicit visibility fixture in software Chromium. Not subjective listening or physical-device FPS evidence.'};
    fs.writeFileSync(out + '/' + (phone ? 'phone' : 'desktop') + '.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify({pass: true, checks: checks.length, sha256: sha, mobile: phone, errors: h.errors.length, writes: h.counts.blocked}));
  } finally { await h.browser.close(); }
})().catch(e => { console.error(e.stack); process.exit(1); });
