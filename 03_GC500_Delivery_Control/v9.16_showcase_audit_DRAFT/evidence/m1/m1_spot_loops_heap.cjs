// M1 spot check (read-only): loops, timers, contexts and costs around showOpen/showClose on the live v9.11 page.
// Laptop profile 1440x900 DPR1, SwiftShader GL. Wall fps here is NOT a device figure; JS ms and counts are the point.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
const OUT = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/showcase/m1_codemap/spot_out.json';
const INIT = `(() => {
  const W = window.__m1 = {raf: {}, intervals: new Map(), timeouts: 0, ctx: {}, ac: 0, mo: 0, longTasks: [], iv: 0};
  const site = () => { const s = (new Error().stack || '').split('\\n').slice(3, 5).map(x => x.trim().replace(/https?:[^ )]*\\//g, '')).join(' < '); return s.slice(0, 160); };
  const rAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (fn) { const name = (fn && fn.name) || 'anon';
    return rAF(function (t) { const a = performance.now(); try { return fn(t); } finally { const r = W.raf[name] || (W.raf[name] = {n: 0, ms: 0, max: 0}); const d = performance.now() - a; r.n++; r.ms += d; if (d > r.max) r.max = d; } }); };
  const sI = window.setInterval.bind(window), cI = window.clearInterval.bind(window);
  window.setInterval = function (fn, ms, ...a) { const id = sI(fn, ms, ...a); W.intervals.set(id, {ms, site: site()}); return id; };
  window.clearInterval = function (id) { W.intervals.delete(id); return cI(id); };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, o) { const r = gc.call(this, type, o); if (r) { if (!this.__m1ctx) { this.__m1ctx = 1; W.ctx[type] = (W.ctx[type] || 0) + 1; } } return r; };
  const AC = window.AudioContext; if (AC) window.AudioContext = class extends AC { constructor(...a) { super(...a); W.ac++; } };
  const MO = window.MutationObserver; window.MutationObserver = class extends MO { constructor(cb) { super((r, o) => { W.mo++; return cb(r, o); }); } };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) W.longTasks.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({type: 'longtask', buffered: true}); } catch (e) {}
})();`;
(async () => {
  const pageFile = process.env.PAGE;
  const res = {notes: []};
  const s = await open({pageFile, W: 1440, H: 900, dpr: 1, gl: true});
  const {page} = s;
  await page.addInitScript(INIT); // for any reload; first load instrumented below via evaluate fallback
  await page.reload({waitUntil: 'load', timeout: 180000});
  await page.waitForTimeout(12000);
  const snap = async label => page.evaluate(label => {
    const W = window.__m1, G = window.GC3D, S = G && G.S;
    const raf = {}; for (const [k, v] of Object.entries(W.raf)) raf[k] = {n: v.n, ms: Math.round(v.ms), max: Math.round(v.max)};
    for (const k of Object.keys(W.raf)) W.raf[k] = {n: 0, ms: 0, max: 0};
    return {label, t: Math.round(performance.now()), raf, intervals: [...W.intervals.values()], ctx: W.ctx, audioContexts: W.ac, moCallbacks: W.mo,
      longTasks: W.longTasks.splice(0), canvases: [...document.querySelectorAll('canvas')].map(c => [c.className, c.width, c.height, c.isConnected]),
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null, dom: document.getElementsByTagName('*').length,
      show: {open: SHOW.open, playing: SHOW.playing, back: document.querySelector('#showcase').getAttribute('data-back')},
      gc3d: S ? {quality: S.quality && S.quality.name, step: S.qualityStep || null, fps: S.fps || null, ss: S.o && S.o.ss, bloom: S.bloom, refl: S.reflOff, shadowOff: S.shadowOff,
        cv: [S.cv.width, S.cv.height], frames: S.frames, revived: S.revived || 0, detail781: !!S.detail781Enabled, beatWorst: Math.round(S.beatWorst || 0)} : null,
      failed: G ? G.failed : 'no GC3D', opening: G && G.openingQuality ? G.openingQuality() : null,
      w885running: !!document.querySelector('#where885.w885-running'), s896run: !!document.querySelector('.s896-run'), tw840running: !!document.querySelector('.tw840-running'),
      boardTimer: typeof BOARD_RUN !== 'undefined' ? !!BOARD_RUN.timer : null, tab: state.tab};
  }, label);
  res.before = await snap('before open (3 s window after reset)');
  await page.waitForTimeout(3000);
  res.before3s = await snap('before open, 3 s');
  // costs of things that run behind/inside the showcase
  res.costs = await page.evaluate(() => {
    const T = f => { const a = performance.now(); try { f(); } catch (e) { return 'err ' + e.message; } return Math.round((performance.now() - a) * 10) / 10; };
    const o = {};
    o.stringifyS = T(() => JSON.stringify(S)); o.stringifyBytes = JSON.stringify(S).length;
    o.render = T(() => render()); o.render2 = T(() => render());
    const asOf = todayIso(); o.scenes = {};
    for (const k of SHOW_ORDER) o.scenes[k] = T(() => showScene(k, asOf));
    o.completionAsOf = T(() => completionAsOf(asOf)); o.lightTally = T(() => lightTally(allAssets(), asOf));
    return o;
  });
  // open the showcase
  const t0 = Date.now();
  res.openMs = await page.evaluate(() => { const a = performance.now(); showOpen(); return Math.round(performance.now() - a); });
  res.timeline = [];
  for (let i = 0; i < 18; i++) { await page.waitForTimeout(5000); res.timeline.push(await snap('open +' + Math.round((Date.now() - t0) / 1000) + 's')); }
  res.inShow = await page.evaluate(() => {
    const T = f => { const a = performance.now(); try { f(); } catch (e) { return 'err ' + e.message; } return Math.round((performance.now() - a) * 10) / 10; };
    const o = {}; o.showRender = []; for (let i = 0; i < SHOW_ORDER.length; i++) { SHOW.i = i; o.showRender.push([SHOW_ORDER[i], T(() => showRender())]); }
    o.showFit = T(() => showFit()); o.syncLayout = window.GC3D && GC3D.S && GC3D.S.syncLayout ? T(() => GC3D.S.syncLayout()) : null;
    o.renderBehind = T(() => render());
    return o;
  });
  res.close1 = await page.evaluate(() => { const a = performance.now(); showClose(); return Math.round(performance.now() - a); });
  await page.waitForTimeout(4000);
  res.afterClose = await snap('after close +4s');
  res.cycles = [];
  for (let i = 0; i < 3; i++) {
    const o = await page.evaluate(() => { const a = performance.now(); showOpen(); return Math.round(performance.now() - a); });
    await page.waitForTimeout(8000);
    const mid = await snap('cycle ' + (i + 1) + ' open +8s');
    await page.evaluate(() => showClose());
    await page.waitForTimeout(3000);
    const after = await snap('cycle ' + (i + 1) + ' closed +3s');
    res.cycles.push({openMs: o, mid, after});
  }
  try { const cdp = await page.context().newCDPSession(page); await cdp.send('HeapProfiler.collectGarbage'); const m = await cdp.send('Performance.enable').then(() => cdp.send('Performance.getMetrics')); res.finalMetrics = Object.fromEntries(m.metrics.filter(x => /JSHeap|Nodes|Listeners|Documents|Frames/.test(x.name)).map(x => [x.name, x.value])); } catch (e) { res.notes.push('cdp ' + e.message); }
  res.errors = s.errors; res.counts = s.counts;
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log('counts', JSON.stringify(s.counts), 'errors', s.errors.length);
  await s.browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
