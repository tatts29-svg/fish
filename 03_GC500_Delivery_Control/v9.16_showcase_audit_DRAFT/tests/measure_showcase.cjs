// Author: Andrew Fisher. v9.16 showcase audit, M2: instrumented measurement of the Showcase, reusable for any build.
//   PAGE=<html> PROFILE=laptop|phone [DPR=1|2|3] SCRIPT=idle|demo|reopen10 OUT=<json> [SHOTS=<dir>] [IDLE_S=90] [TAG=<label>]
//   node tests/measure_showcase.cjs
// Opens the page with toolchain/harness/open_page.js (at the live address, reading the live record with GETs; every write the
// page tries is aborted and counted in counts.blocked, which must stay 0), with WebGL on (SwiftShader software GL in this
// container), and injects tests/showcase_instrument.js before any page script (see that file for what it counts).
// Profiles: laptop 1440x900 at DPR 1 (DPR=2 for the retina laptop), CPU throttle 1; phone 390x844, DPR 3, touch, CPU
// throttle 4 (CDP Emulation.setCPUThrottlingRate, applied once the page has loaded so the load itself is not stretched).
// Scripts:
//   idle     before (30 s on the page, Showcase never opened) -> open (IDLE_S, default 90 s) -> after (30 s after Back)
//   demo     before -> open, settle -> sound on -> every vehicle -> Driver (cockpit) and Chase cameras -> Broadcast 60 s ->
//            close -> the Coates Way machine (cockpit radio if it can be found) -> reopen 20 s -> close -> after
//   reopen10 before -> 10 x (open 8 s with sound on, Back, 3 s, forced GC, heap/contexts/timers read) -> after
// WAITS NEVER DEPEND ON A FRAME: with the 3D running, headless Chromium can deliver very few animation frames, and
// Playwright's waitForFunction / actionability checks wait on frames. All waits here are node-side loops over evaluate,
// and a press is a real mouse click at the control's centre after checking nothing covers it (as test_broadcast900 does).
// Wall fps in this container is RELATIVE ONLY (no GPU, shared CPU): read the device-independent figures first.
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const HARN = path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js');
const pw = require(require.resolve('playwright', {paths: [path.dirname(HARN)]}));
const INSTR = fs.readFileSync(path.join(__dirname, 'showcase_instrument.js'), 'utf8');
const PAGE = process.env.PAGE, PROFILE = process.env.PROFILE || 'laptop', SCRIPT = process.env.SCRIPT || 'idle';
const OUT = process.env.OUT, SHOTS = process.env.SHOTS || '', IDLE_S = +(process.env.IDLE_S || 90), TAG = process.env.TAG || '';
if (!PAGE || !OUT) { console.error('PAGE and OUT are required'); process.exit(2); }
const PHONE = PROFILE === 'phone';
const DPR = +(process.env.DPR || (PHONE ? 3 : 1)), THROTTLE = +(process.env.THROTTLE || (PHONE ? 4 : 1));
const BEFORE_S = +(process.env.BEFORE_S || 30), AFTER_S = +(process.env.AFTER_S || 30);
if (SHOTS) fs.mkdirSync(SHOTS, {recursive: true});

// inject the instrument into every context open_page makes, before its first navigation
const origLaunch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async opts => { const b = await origLaunch(opts); const nc = b.newContext.bind(b);
  b.newContext = async o => { const ctx = await nc(o); await ctx.addInitScript({content: INSTR}); return ctx; }; return b; };
const {open} = require(HARN);

const T0 = Date.now(), rel = () => +((Date.now() - T0) / 1000).toFixed(1);
const log = (...a) => console.log('[' + rel() + 's]', ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout ' + ms + ' ms: ' + what)), ms))]);
const pct = (arr, q) => { if (!arr.length) return null; const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]; };
const r2 = x => x == null ? null : Math.round(x * 100) / 100;

function summarise(d) {
  const F = d.frames, col = i => F.map(f => f[i]);
  const dts = []; for (let i = 1; i < F.length; i++) dts.push(F[i][0] - F[i - 1][0]);
  const st = (a) => ({med: r2(pct(a, 0.5)), p95: r2(pct(a, 0.95)), max: r2(a.length ? Math.max(...a) : null)});
  const js = col(1), draws = col(3), verts = col(4), buf = col(6), tex = col(7), glms = col(14), syncms = col(15), pure = F.map(f => Math.max(0, f[1] - (f[14] || 0)));
  // the frames captured draw by draw: vertices by program (program = its index in link order, with its attribute/uniform names)
  const byProg = {}; for (const c of (d.captures || [])) for (const [pi, mode, count, inst] of c.draws) { const k = String(pi); const b = byProg[k] || (byProg[k] = {draws: 0, verts: 0, instances: 0}); b.draws++; b.verts += count * Math.max(1, inst); b.instances += inst; }
  const nCap = (d.captures || []).length; const progs = {}; for (const pr of (d.programs || [])) progs[pr.i] = pr;
  const capTop = Object.entries(byProg).sort((a, b) => b[1].verts - a[1].verts).slice(0, 10).map(([k, v]) => ({program: +k, drawsPerFrame: r2(v.draws / nCap), vertsPerFrame: Math.round(v.verts / nCap), instancesPerFrame: Math.round(v.instances / nCap), vs: progs[k] ? progs[k].vs : null}));
  const sum = a => a.reduce((x, y) => x + y, 0);
  const lt = d.longtasks.map(x => x[1]);
  const top = (o, k) => Object.entries(o).sort((a, b) => b[1].ms - a[1].ms).slice(0, k).map(([l, v]) => ({label: l, calls: v.n, ms: r2(v.ms), maxMs: r2(v.max)}));
  return {phase: d.name, durS: r2(d.durMs / 1000), frames: F.length, fpsWallRelative: r2(F.length / (d.durMs / 1000)),
    frameIntervalMs: st(dts), framesOver250ms: dts.filter(x => x > 250).length, framesOver100ms: dts.filter(x => x > 100).length, framesOver50ms: dts.filter(x => x > 50).length,
    jsMsPerFrame: st(js), glCallMsPerFrame: st(glms), syncReadMsPerFrame: st(syncms), scriptMsExGlPerFrame: st(pure), capturedFrames: nCap, vertsByProgram: capTop, callbacksPerFrame: st(col(2)), drawsPerFrame: st(draws), vertsPerFrame: st(verts), instancesPerFrame: st(col(5)),
    bufBytesPerFrame: st(buf), texBytesPerFrame: st(tex), bufBytesTotal: sum(buf), texBytesTotal: sum(tex),
    shaderCompiles: d.cDelta.compiles, programLinks: d.cDelta.links, programSwitchesPerFrame: st(col(9)), syncReadsPerFrame: st(col(10)),
    texAllocBytes: d.cDelta.texAllocB, bufCalls: d.cDelta.bufCalls, texCalls: d.cDelta.texCalls,
    timerMsTotal: r2(d.cDelta.timerMs), timerCalls: d.cDelta.timerCalls, rafMsTotal: r2(d.cDelta.rafMs), rafCalls: d.cDelta.rafCalls,
    longTasks: {n: lt.length, totalMs: sum(lt), maxMs: lt.length ? Math.max(...lt) : 0, over250: lt.filter(x => x > 250).length},
    loafTop: d.loaf.slice().sort((a, b) => b.ms - a.ms).slice(0, 5),
    rafTop: top(d.rafBy, 8), timerTop: top(d.timerBy, 8), audioNodesMade: d.audioBy,
    audio: {nodes: d.cDelta.audioNodes, connect: d.cDelta.audioConnect, disconnect: d.cDelta.audioDisconnect, ctxMade: d.cDelta.audioCtxMade, ctxClosed: d.cDelta.audioCtxClosed, decodeCalls: d.cDelta.decodeCalls, decodeBytes: d.cDelta.decodeB},
    media: {play: d.cDelta.mediaPlay, waiting: d.cDelta.mediaWaiting, stalled: d.cDelta.mediaStalled, error: d.cDelta.mediaError, ended: d.cDelta.mediaEnded},
    gl: {ctxMade: d.cDelta.ctxMade, ctxLost: d.cDelta.ctxLost, loseContextCalls: d.cDelta.loseContextCalls, texCreated: d.cDelta.texCreated, texDeleted: d.cDelta.texDeleted, bufCreated: d.cDelta.bufCreated, bufDeleted: d.cDelta.bufDeleted, progCreated: d.cDelta.progCreated, progDeleted: d.cDelta.progDeleted}};
}

(async () => {
  log('open', PROFILE, 'dpr', DPR, 'throttle', THROTTLE, 'script', SCRIPT, path.basename(PAGE));
  const s = await open(PHONE ? {pageFile: PAGE, W: 390, H: 844, dpr: DPR, mobile: true, gl: true} : {pageFile: PAGE, W: 1440, H: 900, dpr: DPR, gl: true});
  const p = s.page, consoleLog = [], R = {author: 'Andrew Fisher', tool: 'v9.16 measure_showcase.cjs', tag: TAG, profile: PROFILE, dpr: DPR, cpuThrottle: THROTTLE, script: SCRIPT,
    page: {file: path.basename(PAGE), sha256: crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex')}, startedAt: new Date().toISOString(), phases: [], snapshots: [], actions: [], notes: []};
  const MAX_S = +(process.env.MAX_S || 1080); // the whole run stays under 20 minutes: at MAX_S it writes what it has and stops
  setTimeout(() => { R.error = 'deadline ' + MAX_S + ' s reached; partial result'; R.counts = s.counts; R.pageErrors = s.errors.slice(0, 50); R.totalS = rel();
    try { fs.mkdirSync(path.dirname(OUT), {recursive: true}); fs.writeFileSync(OUT, JSON.stringify(R)); } catch (e) {} log('DEADLINE, wrote partial', OUT); s.browser.close().catch(() => {}).finally(() => process.exit(3)); setTimeout(() => process.exit(3), 20000); }, MAX_S * 1000).unref();
  p.on('console', m => { const t = m.type(); if (t === 'error' || t === 'warning') consoleLog.push({at: rel(), type: t, text: m.text().slice(0, 240)}); });
  const ev = (fn, arg, ms = 90000, what = 'evaluate') => withTimeout(p.evaluate(fn, arg), ms, what);
  let cdp;
  try {
    cdp = await p.context().newCDPSession(p);
    await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
    const metrics = async () => { const m = await withTimeout(cdp.send('Performance.getMetrics'), 60000, 'metrics'); const o = {}; for (const x of m.metrics) o[x.name] = x.value; return o; };
    const gc = async () => { try { await withTimeout(cdp.send('HeapProfiler.collectGarbage'), 60000, 'gc'); } catch (e) { R.notes.push('gc: ' + e.message); } };
    // ready: the page's showcase functions, the engine and the live record
    { const t0 = Date.now(); let ok = false;
      while (Date.now() - t0 < 240000) { ok = await ev(() => typeof showOpen === 'function' && !!window.GC3D && typeof SYNC !== 'undefined' && SYNC.status === 'live').catch(() => false); if (ok) break; await sleep(1000); }
      R.loadS = rel(); R.ready = ok; log('ready', ok); }
    R.env = await ev(() => { const c = document.createElement('canvas'), g = c.getContext('webgl2'); const dbg = g && g.getExtension('WEBGL_debug_renderer_info');
      const out = {webgl2: !!g, renderer: g ? String(dbg ? g.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)).slice(0, 80) : null, ua: navigator.userAgent.slice(0, 120),
        footer: ((document.getElementById('footL') || {}).textContent || '').replace(/\s+/g, ' ').slice(-40), hw: navigator.hardwareConcurrency, dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight,
        machineHosted: typeof machineHosted === 'function' ? machineHosted() : null, broadcastTurns: typeof bcTurns === 'function' ? bcTurns().length : null};
      const ex = g && g.getExtension('WEBGL_lose_context'); if (ex) ex.loseContext(); return out; });
    log('env', JSON.stringify(R.env));
    if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: THROTTLE});

    // ---- helpers
    const visible = sel => ev(sel => { const b = document.querySelector(sel); if (!b || b.hidden) return false; const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; }, sel, 60000, 'visible ' + sel).catch(() => false);
    const press = async (sel, fallback) => {
      let at = null;
      try { at = await ev(sel => { const b = document.querySelector(sel); if (!b) return null; b.scrollIntoView({block: 'nearest'}); const r = b.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2, top = document.elementFromPoint(x, y); return {x, y, hit: !!top && (top === b || b.contains(top)), w: r.width}; }, sel, 60000, 'locate ' + sel); } catch (e) {}
      if (at && at.hit && at.w > 0) { await withTimeout(p.mouse.click(at.x, at.y), 60000, 'click ' + sel); R.actions.push({at: rel(), press: sel, via: 'click'}); return 'click'; }
      if (fallback) { await ev(fallback, null, 90000, 'fallback ' + sel); R.actions.push({at: rel(), press: sel, via: 'script', why: at ? (at.hit ? 'zero size' : 'covered') : 'missing'}); return 'script'; }
      R.actions.push({at: rel(), press: sel, via: 'none', why: at ? 'covered' : 'missing'}); return 'none';
    };
    const pressShowControl = async (sel, fallback) => { // a phone folds some controls behind Options
      if (!(await visible(sel)) && await visible('#showOptions794')) await press('#showOptions794');
      return press(sel, fallback);
    };
    const snapshot = async (label, doGc) => {
      if (doGc) await gc();
      const m = await metrics(); const st = await ev(() => __M.state(), null, 90000, 'state').catch(e => ({error: e.message}));
      const rec = {label, at: rel(), heapUsedMB: r2(m.JSHeapUsedSize / 1048576), heapTotalMB: r2(m.JSHeapTotalSize / 1048576), nodes: m.Nodes, listeners: m.JSEventListeners, documents: m.Documents, frames: m.Frames,
        layoutCount: m.LayoutCount, recalcStyleCount: m.RecalcStyleCount, state: st};
      R.snapshots.push(rec); return rec;
    };
    const CPUPROF = !!process.env.CPUPROF;
    if (CPUPROF) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 1000}); }
    // a CPU profile per phase (CPUPROF=1): self time by function, so a long frame has a name
    const profTop = prof => { const self = new Map(), byId = new Map(); for (const n of prof.nodes) byId.set(n.id, n);
      for (let i = 0; i < prof.samples.length; i++) { const n = byId.get(prof.samples[i]); if (!n) continue; const cf = n.callFrame;
        const k = (cf.functionName || '(anonymous)') + ' L' + (cf.lineNumber + 1) + ':' + (cf.columnNumber + 1) + (cf.url && !/Coates-GC500-2026/.test(cf.url) ? ' ' + cf.url.slice(-30) : '');
        self.set(k, (self.get(k) || 0) + (prof.timeDeltas[i] || 0) / 1000); }
      const tot = [...self.values()].reduce((a, b) => a + b, 0);
      return {sampledMs: Math.round(tot), top: [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => ({fn: k, selfMs: Math.round(v), pct: r2(100 * v / tot)}))}; };
    const phase = async (name, seconds, during) => {
      await ev(n => __M.phaseStart(n), name, 90000, 'phaseStart');
      if (CPUPROF) await cdp.send('Profiler.start');
      const m0 = await metrics(), t0 = Date.now();
      if (during) await during();
      const left = seconds * 1000 - (Date.now() - t0); if (left > 0) await sleep(left);
      const m1 = await metrics(), wall = (Date.now() - t0) / 1000;
      let cpu = null; if (CPUPROF) { try { cpu = profTop((await withTimeout(cdp.send('Profiler.stop'), 120000, 'profiler')).profile); } catch (e) { R.notes.push('profiler ' + name + ': ' + e.message); } }
      const d = await ev(() => __M.drain(), null, 120000, 'drain');
      const sum = summarise(d);
      const md = k => r2((m1[k] || 0) - (m0[k] || 0));
      sum.cdp = {wallS: r2(wall), taskS: md('TaskDuration'), scriptS: md('ScriptDuration'), layoutS: md('LayoutDuration'), styleS: md('RecalcStyleDuration'),
        mainThreadBusyPct: r2(100 * md('TaskDuration') / wall), heapEndMB: r2(m1.JSHeapUsedSize / 1048576), nodesEnd: m1.Nodes, listenersEnd: m1.JSEventListeners};
      if (cpu) sum.cpuProfile = cpu;
      R.programs = d.programs; R.phases.push({summary: sum, raw: {frameCols: d.frameCols, frames: d.frames, events: d.events, captures: d.captures, longtasks: d.longtasks, loaf: d.loaf, rafBy: d.rafBy, timerBy: d.timerBy}});
      log('phase', name, 'frames', sum.frames, 'js med/p95', sum.jsMsPerFrame.med, sum.jsMsPerFrame.p95, 'draws med', sum.drawsPerFrame.med, 'verts med', sum.vertsPerFrame.med, 'busy%', sum.cdp.mainThreadBusyPct, 'lt', sum.longTasks.n);
      return sum;
    };
    const shot = async name => { if (!SHOTS) return; const f = path.join(SHOTS, `${TAG || PROFILE}_${SCRIPT}_${name}.png`);
      // the scene text (figures from the record) is hidden for the picture and put straight back: the shot is of the backdrop
      await ev(() => { for (const id of ['showBody', 'flash']) { const e = document.getElementById(id); if (e) { e.dataset.mvis = e.style.visibility; e.style.visibility = 'hidden'; } } }).catch(() => {});
      try { await p.screenshot({path: f, timeout: 90000}); R.actions.push({at: rel(), shot: path.basename(f)}); }
      catch (e) { R.notes.push('screenshot ' + name + ': ' + e.message.slice(0, 120)); }
      await ev(() => { for (const id of ['showBody', 'flash']) { const e = document.getElementById(id); if (e) e.style.visibility = e.dataset.mvis || ''; } }).catch(() => {}); };
    const openShow = async () => {
      let via = 'none';
      if (await visible('#moreBtn')) { await press('#moreBtn'); await sleep(400); if (await visible('#showcaseBtn')) via = await press('#showcaseBtn'); }
      if (!(await ev(() => SHOW.open).catch(() => false))) { await ev(() => { if (typeof moreClose === 'function') moreClose(); showOpen(); }); via = 'script'; }
      R.actions.push({at: rel(), openShowcase: via}); return via;
    };
    const closeShow = async () => { await press('#showBack', () => showClose()); await sleep(300); if (await ev(() => SHOW.open).catch(() => true)) { await ev(() => showClose()); R.actions.push({at: rel(), close: 'script'}); } };
    const soundOn = async () => { if (await ev(() => !!(window.GC3D && GC3D.sound && GC3D.sound.isOn())).catch(() => false)) return 'already';
      return pressShowControl('#showSound', () => showSoundToggle()); };
    const vehicle = async v => {
      if (await visible('#seTrig')) { await press('#seTrig'); await sleep(300);
        if (await visible(`#sePanel .se-item[data-v="${v}"]`)) { await press(`#sePanel .se-item[data-v="${v}"]`); await sleep(200); if (await visible('#sePanel .se-x')) await press('#sePanel .se-x'); R.actions.push({at: rel(), vehicle: v, via: 'panel'}); return; } }
      await ev(v => { const sv = document.getElementById('showVehicle'); if (sv) sv.value = v; showVehicleSet(v); }, v); R.actions.push({at: rel(), vehicle: v, via: 'script'});
    };
    const view = async v => { await ev(v => { const s = document.getElementById('showView'); if (!s) return false; if (![...s.options].some(o => o.value === v)) return false; s.value = v; s.dispatchEvent(new Event('change', {bubbles: true})); return true; }, v); R.actions.push({at: rel(), view: v}); };

    // ---- the scripts
    await snapshot('loaded', true);
    await phase('before', BEFORE_S);
    await snapshot('before-end', true);
    if (SCRIPT === 'idle') {
      await phase('open', IDLE_S, async () => { await openShow(); await sleep(Math.min(20000, IDLE_S * 300)); await ev(() => __M.captureFrames(2)); await sleep(Math.min(20000, IDLE_S * 300)); await shot('open'); });
      await snapshot('open-end', false);
      await phase('close', 5, closeShow);
      await phase('after', AFTER_S);
      await snapshot('after-end', true);
    } else if (SCRIPT === 'demo') {
      await phase('demo.settle', 25, async () => { await openShow(); await sleep(10000); await ev(() => __M.captureFrames(2)); await sleep(5000); await shot('settle'); });
      await phase('demo.sound', 15, async () => { R.actions.push({at: rel(), sound: await soundOn()}); });
      for (const v of ['car', 'forklift', 'boom', 'scissor', 'tractor', 'car_vms', 'car_loo'])
        await phase('demo.vehicle.' + v, 15, async () => { await vehicle(v); await sleep(4000); await ev(() => __M.captureFrames(1)); if (v === 'car_loo') { await sleep(10000); await shot('dunny'); } });
      await phase('demo.view.onboard', 15, async () => { await view('onboard'); await sleep(8000); await shot('onboard'); });
      await phase('demo.view.chase', 10, async () => { await view('chase'); });
      await view('hero');
      await phase('demo.broadcast', 60, async () => { R.actions.push({at: rel(), broadcast: await pressShowControl('#showBroadcast', () => bcStart())}); });
      if (await ev(() => BC.on).catch(() => false)) await pressShowControl('#showBroadcast', () => bcStop());
      await snapshot('demo-before-close', false);
      await phase('demo.close', 10, closeShow);
      // the Coates Way machine, in its frame over the page; its cockpit radio if the frame shows one
      const mh = await ev(() => typeof machineHosted === 'function' && machineHosted()).catch(() => false);
      if (mh) {
        await phase('demo.machine', 40, async () => {
          await ev(() => machineOpen('machine')); R.actions.push({at: rel(), machine: 'open'});
          await sleep(20000);
          const fr = p.frames().find(f => f !== p.mainFrame() && /\/machine|machine\//i.test(f.url()) && !/explorer|poc3d/.test(f.url())) || p.frames().find(f => f !== p.mainFrame());
          if (fr) {
            const radio = await withTimeout(fr.evaluate(() => { const els = [...document.querySelectorAll('button,[role=button],a,div,span')].filter(e => /^\s*radio\s*$/i.test(e.textContent || '') || /radio/i.test(e.getAttribute('aria-label') || '') || /radio/i.test(e.id || ''));
              const b = els[0]; if (!b) return {found: false, n: document.querySelectorAll('*').length, url: location.pathname.slice(-40)};
              b.click(); return {found: true, tag: b.tagName, id: b.id, label: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 30)}; }), 60000, 'machine radio').catch(e => ({error: e.message}));
            R.actions.push({at: rel(), machineRadio: radio});
            try { R.machineState = await withTimeout(fr.evaluate(() => window.__M ? __M.state() : null), 60000, 'machine state'); } catch (e) { R.notes.push('machine state: ' + e.message); }
          } else R.actions.push({at: rel(), machineRadio: 'no frame'});
          await shot('machine');
        });
        await ev(() => machineClose()); R.actions.push({at: rel(), machine: 'closed'});
      } else R.notes.push('machine not hosted on this page');
      await phase('demo.reopen', 20, async () => { await openShow(); });
      await phase('close', 5, closeShow);
      await phase('after', AFTER_S);
      await snapshot('after-end', true);
    } else if (SCRIPT === 'reopen10') {
      for (let i = 1; i <= 10; i++) {
        await phase('reopen.' + i, 8, async () => { await openShow(); await sleep(2500); if (i === 1 || !(await ev(() => !!(window.GC3D && GC3D.sound && GC3D.sound.isOn())).catch(() => false))) R.actions.push({at: rel(), cycle: i, sound: await soundOn()}); });
        await phase('reopen.' + i + '.close', 3, closeShow);
        const sn = await snapshot('reopen.' + i + '.closed+gc', true);
        log('cycle', i, 'heapMB', sn.heapUsedMB, 'nodes', sn.nodes, 'listeners', sn.listeners, 'gl alive', sn.state.webgl && sn.state.webgl.alive, 'audio', sn.state.audio && sn.state.audio.list.map(a => a.state).join(','), 'intervals', sn.state.intervals && sn.state.intervals.live);
      }
      await phase('after', AFTER_S);
      await snapshot('after-end', true);
    }
    R.watch = await ev(() => __M.watch()).catch(e => ({error: e.message}));
    R.finalState = await ev(() => __M.state()).catch(e => ({error: e.message}));
  } catch (e) { R.error = String(e && e.stack || e).slice(0, 800); log('ERROR', R.error); }
  finally {
    R.console = consoleLog.slice(0, 400); R.consoleCount = consoleLog.length; R.pageErrors = s.errors.slice(0, 50); R.counts = s.counts; R.endedAt = new Date().toISOString(); R.totalS = rel();
    fs.mkdirSync(path.dirname(OUT), {recursive: true}); fs.writeFileSync(OUT, JSON.stringify(R));
    log('wrote', OUT, 'blocked', s.counts.blocked, 'pageErrors', s.errors.length);
    try { await withTimeout(s.browser.close(), 60000, 'close'); } catch (e) {}
  }
  process.exit(R.error ? 1 : 0);
})().catch(e => { console.error('MEASURE FAIL', String(e && e.stack || e).slice(0, 600)); process.exit(2); });
