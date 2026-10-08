// Author: Andrew Fisher. v9.16 showcase audit, M3 (history and regression): ONE simple probe run against several builds.
//   PAGES="v6.40=/path/a.html,v7.84=/path/b.html,..." PROFILE=laptop|phone [DPR=1|2|3] OUT_DIR=<dir> ROUND=<n>
//   [OPEN_S=60] [BEFORE_S=15] [SHOTS=<dir>] node tests/m3_history_probe.cjs
// For each build in the order given (the caller rotates the order between rounds, so the builds are interleaved), a
// fresh headless Chromium opens the build at the live address through toolchain/harness/open_page.js (reading the live
// record with GETs only; every write the page tries is aborted and counted in counts.blocked, which must stay 0), with
// WebGL on (SwiftShader software GL in this container) and tests/m3_probe_instrument.js injected before any page script.
//   ready  -> 8 s settle -> CPU throttle (phone 4x) -> BEFORE_S on the page, Showcase shut ("before")
//   -> showOpen() -> OPEN_S with the Showcase open and nobody touching it ("open"; split 0-10 s "open.start" and
//      10 s-end "open.steady"), the 3D state polled every 2 s, two frames captured draw by draw at about 20 s.
// Device-independent figures first (draws, vertices, GL calls, upload bytes, compiles, intervals, heap, nodes); the
// JS ms per frame is reported split into time inside WebGL calls (on SwiftShader that is the software GPU making the
// page wait) and the page's own script. Wall fps here is RELATIVE ONLY: no GPU, shared CPU. Never a device figure.
// All waits are node-side loops: with the 3D up, headless Chromium can deliver one frame in many seconds.
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const HARN = path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js');
const pw = require(require.resolve('playwright', {paths: [path.dirname(HARN)]}));
const INSTR = fs.readFileSync(path.join(__dirname, 'm3_probe_instrument.js'), 'utf8');
const PAGES = (process.env.PAGES || '').split(',').filter(Boolean).map(x => { const i = x.indexOf('='); return {tag: x.slice(0, i), file: x.slice(i + 1)}; });
const PROFILE = process.env.PROFILE || 'laptop', PHONE = PROFILE === 'phone';
const DPR = +(process.env.DPR || (PHONE ? 3 : 1)), THROTTLE = +(process.env.THROTTLE || (PHONE ? 4 : 1));
const OPEN_S = +(process.env.OPEN_S || 60), BEFORE_S = +(process.env.BEFORE_S || 15), ROUND = process.env.ROUND || '1';
const OUT_DIR = process.env.OUT_DIR, SHOTS = process.env.SHOTS || '';
if (!PAGES.length || !OUT_DIR) { console.error('PAGES and OUT_DIR are required'); process.exit(2); }
fs.mkdirSync(OUT_DIR, {recursive: true}); if (SHOTS) fs.mkdirSync(SHOTS, {recursive: true});
const origLaunch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async opts => { const b = await origLaunch(opts); const nc = b.newContext.bind(b);
  b.newContext = async o => { const ctx = await nc(o); await ctx.addInitScript({content: INSTR}); return ctx; }; return b; };
const {open} = require(HARN);
const T0 = Date.now(), rel = () => +((Date.now() - T0) / 1000).toFixed(1);
const log = (...a) => console.log('[' + rel() + 's]', ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout ' + ms + ' ms: ' + what)), ms))]);
const pct = (a, q) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]; };
const r2 = x => x == null ? null : Math.round(x * 100) / 100;
const st = a => ({n: a.length, med: r2(pct(a, 0.5)), p95: r2(pct(a, 0.95)), max: r2(a.length ? Math.max(...a) : null), mean: r2(a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)});
const MAX_S = +(process.env.MAX_S || 1150);

function summarise(name, frames, durMs, m0, m1, lt, extra) {
  const col = i => frames.map(f => f[i]); const up = frames.filter(f => f[12] & 1);
  const dts = []; for (let i = 1; i < frames.length; i++) dts.push(frames[i][0] - frames[i - 1][0]);
  const dm = k => (m1 && m0 && m1[k] != null && m0[k] != null) ? m1[k] - m0[k] : null;
  const ltIn = lt.map(x => x[1]);
  return Object.assign({phase: name, durS: r2(durMs / 1000), frames: frames.length, framesWith3dUp: up.length, fpsWallRelative: r2(frames.length / (durMs / 1000)),
    frameIntervalMs: st(dts), jsMsPerFrame: st(col(1)), glMsPerFrame: st(col(6)), scriptMsExGlPerFrame: st(frames.map(f => Math.max(0, f[1] - f[6]))),
    callbacksPerFrame: st(col(2)), drawsPerFrame: st(col(3)), vertsPerFrame: st(col(4)), glCallsPerFrame: st(col(5)),
    bufBytesTotal: col(7).reduce((x, y) => x + y, 0), texBytesTotal: col(8).reduce((x, y) => x + y, 0), bufBytesPerFrame: st(col(7)), texBytesPerFrame: st(col(8)),
    compiles: col(9).reduce((x, y) => x + y, 0), progSwitchesPerFrame: st(col(10)), syncReadsPerFrame: st(col(11)),
    up3d: {drawsPerFrame: st(up.map(f => f[3])), vertsPerFrame: st(up.map(f => f[4])), glCallsPerFrame: st(up.map(f => f[5])), jsMsPerFrame: st(up.map(f => f[1])), scriptMsExGlPerFrame: st(up.map(f => Math.max(0, f[1] - f[6])))},
    longTasks: {n: ltIn.length, totalMs: ltIn.reduce((x, y) => x + y, 0), maxMs: ltIn.length ? Math.max(...ltIn) : 0},
    cdp: {taskS: r2(dm('TaskDuration')), scriptS: r2(dm('ScriptDuration')), layoutS: r2(dm('LayoutDuration')), styleS: r2(dm('RecalcStyleDuration')),
      mainThreadBusyPct: dm('TaskDuration') != null ? r2(100 * dm('TaskDuration') / (durMs / 1000)) : null,
      heapUsedMB0: m0 ? r2(m0.JSHeapUsedSize / 1048576) : null, heapUsedMB1: m1 ? r2(m1.JSHeapUsedSize / 1048576) : null,
      nodes0: m0 ? m0.Nodes : null, nodes1: m1 ? m1.Nodes : null, listeners1: m1 ? m1.JSEventListeners : null, docs1: m1 ? m1.Documents : null, frames1: m1 ? m1.Frames : null}}, extra || {});
}

async function measureOne({tag, file}) {
  const R = {author: 'Andrew Fisher', tool: 'v9.16 m3_history_probe.cjs', tag, round: ROUND, profile: PROFILE, dpr: DPR, cpuThrottle: THROTTLE,
    page: {file: path.basename(file), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), bytes: fs.statSync(file).size},
    startedAt: new Date().toISOString(), phases: [], poll: [], notes: []};
  const tStart = Date.now();
  log('==', tag, PROFILE, 'dpr', DPR, 'x' + THROTTLE, path.basename(file));
  const s = await open(PHONE ? {pageFile: file, W: 390, H: 844, dpr: DPR, mobile: true, gl: true} : {pageFile: file, W: 1440, H: 900, dpr: DPR, gl: true});
  const p = s.page, consoleErr = [];
  p.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 200)); });
  const ev = (fn, arg, ms = 120000, what = 'evaluate') => withTimeout(p.evaluate(fn, arg), ms, what);
  try {
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Performance.enable');
    const metrics = async () => { try { const m = await withTimeout(cdp.send('Performance.getMetrics'), 90000, 'metrics'); const o = {}; for (const x of m.metrics) o[x.name] = x.value; return o; } catch (e) { R.notes.push('metrics: ' + e.message); return null; } };
    { const t0 = Date.now(); let st0 = null;
      while (Date.now() - t0 < 150000) { st0 = await ev(() => ({fn: typeof showOpen === 'function', g: !!window.GC3D, sync: typeof SYNC !== 'undefined' ? SYNC.status : 'none'}), null, 30000).catch(e => ({err: e.message}));
        if (st0 && st0.fn && st0.g && (st0.sync === 'live' || st0.sync === 'none')) break; await sleep(1000); }
      R.loadS = r2((Date.now() - tStart) / 1000); R.ready = st0; log('ready', JSON.stringify(st0), R.loadS + 's'); }
    await sleep(8000);
    R.env = await ev(() => ({footer: ((document.getElementById('footL') || {}).textContent || '').replace(/\s+/g, ' ').slice(-60), dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight,
      hw: navigator.hardwareConcurrency, back: (() => { try { return showBackPref(); } catch (e) { return 'n/a ' + e.message; } })(),
      opening: (() => { try { return GC3D.openingQuality ? GC3D.openingQuality() : null; } catch (e) { return null; } })(), reduced: (() => { try { return showReduced(); } catch (e) { return null; } })(),
      gc3dVer: window.GC3D && GC3D.ver || null, hasGeo: !!(window.GC3D && GC3D.geo)})).catch(e => ({err: e.message}));
    log('env', JSON.stringify(R.env));
    if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: THROTTLE});
    const collect = () => ev(() => { const P = window.__P; P.closeFrame(); const out = {frames: P.frames, rafBy: P.rafBy, timerBy: P.timerBy, lt: P.lt.filter(x => x[0] >= P.tReset).map(x => [Math.round(x[0] - P.tReset), x[1]]), C: Object.assign({}, P.C), c0: P.c0,
      intervals: [...P.intervals.values()].map(x => [x.l.slice(0, 70), x.ms, x.at])}; return out; }, null, 180000, 'collect');
    const state = () => ev(() => { const G = window.GC3D, S = G && G.S; const n = document.getElementById('show3dNote');
      return {open: typeof SHOW !== 'undefined' ? !!SHOW.open : null, failed: G ? (G.failed || null) : 'no GC3D', up: !!S, q: S && S.quality ? S.quality.name : null, step: S ? (S.qualityStep || null) : null,
        fps: S && S.fps ? Math.round(S.fps * 10) / 10 : null, cv: S && S.cv ? [S.cv.width, S.cv.height] : null, vehicle: G ? (G.vehicle || null) : null, geoUp: !!(G && G.geo && G.geo.S),
        note: n && !n.hidden ? n.textContent.replace(/\s+/g, ' ').slice(0, 110) : '', heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
        nodes: document.getElementsByTagName('*').length, intervals: window.__P.intervals.size}; }, null, 120000, 'state').catch(e => ({err: e.message}));
    // ---- before: the page with the Showcase shut
    await ev(() => window.__P.reset()); let m0 = await metrics(); let t0 = Date.now();
    await sleep(BEFORE_S * 1000);
    let m1 = await metrics(); let d = await collect(); let dur = Date.now() - t0;
    R.phases.push(summarise('before', d.frames, dur, m0, m1, d.lt, {rafTop: top(d.rafBy), timerTop: top(d.timerBy), intervals: d.intervals}));
    log('before', brief(R.phases[R.phases.length - 1]));
    // ---- open: showOpen() and leave it
    R.showOpenMs = await ev(() => { if (typeof moreClose === 'function') try { moreClose(); } catch (e) {} window.__P.reset(); window.__P.cap.left = 0; const a = performance.now(); showOpen(); return Math.round(performance.now() - a); }, null, 180000, 'showOpen').catch(e => { R.notes.push('showOpen: ' + e.message); return null; });
    R.openGl = await ev(() => { const C = window.__P.C, c0 = window.__P.c0; return {compiles: C.compiles - c0.compiles, links: C.links - c0.links, bufB: C.bufB - c0.bufB, texB: C.texB - c0.texB, draws: C.draws - c0.draws}; }).catch(() => null);
    m0 = await metrics(); t0 = Date.now(); const tOpen = Date.now(); let captured = false, cut = null, mCut = null;
    while (Date.now() - tOpen < OPEN_S * 1000) {
      const sNow = await state(); sNow.at = r2((Date.now() - tOpen) / 1000); R.poll.push(sNow);
      if (!cut && Date.now() - tOpen >= 10000) { cut = await ev(() => window.__P.frames.length).catch(() => null); mCut = await metrics(); R.cutAt = r2((Date.now() - tOpen) / 1000); }
      if (!captured && Date.now() - tOpen >= 20000) { captured = true; await ev(() => { window.__P.cap.left = 2; }).catch(() => {}); }
      await sleep(2000);
    }
    m1 = await metrics(); d = await collect(); dur = Date.now() - t0;
    R.phases.push(summarise('open', d.frames, dur, m0, m1, d.lt, {longTaskList: d.lt.slice(0, 40), rafTop: top(d.rafBy), timerTop: top(d.timerBy), intervals: d.intervals, glTotals: diffC(d.C, d.c0)}));
    if (cut != null) {
      const tc = R.cutAt != null ? R.cutAt * 1000 : null;
      R.phases.push(summarise('open.start', d.frames.slice(0, cut), (R.cutAt || 10) * 1000, m0, mCut, d.lt.filter(x => tc == null || x[0] < tc)));
      R.phases.push(summarise('open.steady', d.frames.slice(cut), dur - (R.cutAt || 10) * 1000, mCut, m1, d.lt.filter(x => tc != null && x[0] >= tc)));
    }
    log('open', brief(R.phases[1])); if (R.phases[3]) log('open.steady', brief(R.phases[3]));
    // the captured frames, draw by draw, by program (program = link order, with the start of its vertex shader)
    const cap = await ev(() => ({frames: window.__P.cap.frames, progs: window.__P.progs.map(p => p.vs)}), null, 120000, 'cap').catch(e => ({err: e.message}));
    if (cap && cap.frames) { const by = {}; for (const f of cap.frames) for (const [pi, v] of f.draws) { const b = by[pi] || (by[pi] = {draws: 0, verts: 0}); b.draws++; b.verts += v; }
      const nf = Math.max(1, cap.frames.length);
      R.captured = {frames: cap.frames.length, byProgram: Object.entries(by).sort((a, b) => b[1].verts - a[1].verts).slice(0, 14).map(([k, v]) => ({program: +k, drawsPerFrame: r2(v.draws / nf), vertsPerFrame: Math.round(v.verts / nf), vs: k >= 0 && cap.progs[k] ? sig(cap.progs[k]) : null}))}; }
    R.final = await state();
    if (SHOTS) { const f = path.join(SHOTS, `${PROFILE}${DPR}_${tag}_r${ROUND}.png`); try { await withTimeout(p.screenshot({path: f, timeout: 90000}), 100000, 'shot'); R.shot = f; } catch (e) { R.notes.push('shot: ' + e.message.slice(0, 80)); } }
  } catch (e) { R.error = String(e && e.stack || e).slice(0, 400); log('ERROR', R.error); }
  R.counts = s.counts; R.pageErrors = s.errors.slice(0, 20); R.consoleErrors = consoleErr.slice(0, 20); R.totalS = r2((Date.now() - tStart) / 1000);
  const out = path.join(OUT_DIR, `${PROFILE}${DPR}_${tag}_r${ROUND}.json`); fs.writeFileSync(out, JSON.stringify(R));
  log('wrote', path.basename(out), 'blocked', s.counts.blocked, 'pageErrors', s.errors.length, R.totalS + 's');
  await withTimeout(s.browser.close(), 60000, 'close').catch(() => {});
  return R;
}
function top(o, k = 10) { return Object.entries(o || {}).sort((a, b) => b[1].ms - a[1].ms).slice(0, k).map(([l, v]) => ({label: l.slice(0, 70), calls: v.n, ms: r2(v.ms), maxMs: r2(v.max)})); }
function diffC(a, b) { const o = {}; for (const k of Object.keys(a || {})) o[k] = r2(a[k] - ((b || {})[k] || 0)); return o; }
function sig(vs) { const m = vs.match(/void main\s*\(\s*\)\s*\{(.{0,140})/); return (vs.length + 'ch ') + (m ? m[1] : vs.slice(0, 140)); }
function brief(ph) { return `frames ${ph.frames} (3d up ${ph.framesWith3dUp}) fps~${ph.fpsWallRelative} js med ${ph.jsMsPerFrame.med} exGL med ${ph.scriptMsExGlPerFrame.med} draws med ${ph.drawsPerFrame.med} verts med ${ph.vertsPerFrame.med} glCalls med ${ph.glCallsPerFrame.med} compiles ${ph.compiles} busy% ${ph.cdp.mainThreadBusyPct} lt ${ph.longTasks.n}/${ph.longTasks.totalMs}ms heap ${ph.cdp.heapUsedMB0}->${ph.cdp.heapUsedMB1}`; }

(async () => {
  setTimeout(() => { log('DEADLINE', MAX_S); process.exit(3); }, MAX_S * 1000).unref();
  for (const pg of PAGES) { await measureOne(pg); }
  log('DONE');
  process.exit(0);
})();
