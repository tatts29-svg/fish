/* Read-only profile of one tab switch and the idle time after it. GET only (the harness aborts writes).
   env: PAGE (html file), LINES (line index json), MOB=1, CPU=4, TAB=timeline, OUT=dir, TAG=name, IDLE=ms, PROF=1 */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs'), path = require('path');
const INIT = `(() => { const P = window.__perf = {lt: [], ls: [], mut: 0, muts: {}, counting: false, marks: {}};
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {}
 try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) P.ls.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map(s => s.node ? (s.node.id || s.node.className || s.node.nodeName) : '').join(',').slice(0, 120)]); })).observe({type: 'layout-shift', buffered: true}); } catch (e) {}
 const key = n => { for (let x = n, d = 0; x && d < 8; x = x.parentElement, d++) { if (x.id) return '#' + x.id + (d ? '>' + d : ''); } return n.nodeName; };
 document.addEventListener('DOMContentLoaded', () => { P.marks.dcl = performance.now(); new MutationObserver(ms => { if (!P.counting) return; for (const m of ms) { P.mut++; const k = key(m.target); P.muts[k] = (P.muts[k] || 0) + (m.addedNodes.length + m.removedNodes.length || 1); } }).observe(document.body, {childList: true, subtree: true, attributes: true, characterData: true}); });
 addEventListener('load', () => { P.marks.load = performance.now(); });
})();`;
const LINES = JSON.parse(fs.readFileSync(process.env.LINES, 'utf8'));
const scriptOf = ln => { for (const [i, id, s, e] of LINES) if (ln >= s && ln <= e) return i + ':' + id; return '?'; };
function aggregate(prof, pageUrlPart) {
  const nodes = new Map(); prof.nodes.forEach(n => nodes.set(n.id, n));
  const dt = {}; const ts = prof.timeDeltas; const samples = prof.samples; const self = new Map();
  for (let i = 0; i < samples.length; i++) { const d = (ts[i + 1] !== undefined ? ts[i + 1] : 0) / 1000; self.set(samples[i], (self.get(samples[i]) || 0) + d); }
  const byFn = {}, byScript = {}; let total = 0;
  // inclusive by function: walk parents
  const parent = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  const incl = {};
  for (const [id, ms] of self) { const n = nodes.get(id); const cf = n.callFrame; total += ms;
    const isPage = cf.url && cf.url.includes(pageUrlPart);
    const k = (cf.functionName || '(anon)') + ' @' + (isPage ? scriptOf(cf.lineNumber) + ':L' + cf.lineNumber + ':' + cf.columnNumber : (cf.url ? cf.url.slice(-40) + ':' + cf.lineNumber : ''));
    byFn[k] = (byFn[k] || 0) + ms;
    const sk = isPage ? scriptOf(cf.lineNumber) : (cf.url ? 'other' : (cf.functionName || '(native)'));
    byScript[sk] = (byScript[sk] || 0) + ms;
    // inclusive: each distinct function on the stack once
    const seen = new Set(); let x = id;
    while (x !== undefined) { const nn = nodes.get(x); const c = nn.callFrame; const ip = c.url && c.url.includes(pageUrlPart);
      const kk = (c.functionName || '(anon)') + ' @' + (ip ? scriptOf(c.lineNumber) + ':L' + c.lineNumber + ':' + c.columnNumber : (c.url ? 'x' : ''));
      if (!seen.has(kk)) { seen.add(kk); incl[kk] = (incl[kk] || 0) + ms; } x = parent.get(x); }
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, +v.toFixed(1)]);
  return {totalMs: +total.toFixed(1), bySelf: top(byFn, 45), byScript: top(byScript, 30), byIncl: top(incl, 60)};
}
(async () => {
  const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), TAB = process.env.TAB || 'timeline', OUT = process.env.OUT || '.', TAG = process.env.TAG || 'run', IDLE = +(process.env.IDLE || 15000), PROF = process.env.PROF !== '0';
  const s = await open({pageFile: process.env.PAGE, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page; const out = {tag: TAG, mob: MOB, cpu: CPU, tab: TAB};
  const cdp = await p.context().newCDPSession(p);
  try {
    await cdp.send('Performance.enable');
    out.marks = await p.evaluate(() => window.__perf.marks);
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
    out.liveAt = await p.evaluate(() => Math.round(performance.now()));
    // wait until quiet: no long task ended in the last Q ms
    const Q = MOB ? 6000 : 4000; const t0 = Date.now();
    while (Date.now() - t0 < 150000) { const q = await p.evaluate(Q => { const L = window.__perf.lt.filter(x => x[1] >= 250); const end = L.length ? Math.max(...L.map(x => x[0] + x[1])) : 0; return performance.now() - end > Q; }, Q); if (q) break; await p.waitForTimeout(1000); }
    out.quietAt = await p.evaluate(() => Math.round(performance.now()));
    out.loadLT = await p.evaluate(() => { const L = window.__perf.lt; return {n: L.length, total: L.reduce((a, b) => a + b[1], 0)}; });
    out.verBefore = await p.evaluate(() => { try { return SYNC.db.readVersion821(); } catch (e) { return null; } });
    if (process.env.REVISIT === '1') { await p.evaluate(k => go(k), TAB); await p.waitForTimeout(MOB ? 15000 : 6000); await p.evaluate(() => go('today')); await p.waitForTimeout(MOB ? 15000 : 6000); }
    out.startTab = await p.evaluate(() => state.tab);
    // count renders
    await p.evaluate(() => { const C = window.__cnt = {}; const wrap = name => { const o = window[name]; if (typeof o !== 'function') return; window[name] = function () { const t = performance.now(); try { return o.apply(this, arguments); } finally { const c = C[name] = C[name] || {n: 0, ms: 0}; c.n++; c.ms += performance.now() - t; } }; };
      ['render', 'renderTimeline', 'renderPlant', 'renderToday', 'renderTabs', 'renderMap', 'renderDemob', 'renderCosts'].forEach(wrap); });
    const m0 = await cdp.send('Performance.getMetrics');
    if (PROF) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 250}); await cdp.send('Profiler.start'); }
    const sw = await p.evaluate(async k => { const P = window.__perf, lt0 = P.lt.length, ls0 = P.ls.length; P.counting = true; P.mut = 0; P.muts = {};
      const pane = document.getElementById('pane-' + k); const frames = []; let run = true; const tstart = performance.now();
      const sig = () => { const pn = document.getElementById('pane-' + k); if (!pn) return 'none'; return String(pn.getElementsByTagName('*').length); };
      const t0 = performance.now(); go(k); const t1 = performance.now();
      let last = sig(); frames.push([Math.round(t1 - t0), last]);
      const tick = () => { if (!run) return; const sg = sig(); if (sg !== last) { frames.push([Math.round(performance.now() - t0), sg]); last = sg; } requestAnimationFrame(tick); }; requestAnimationFrame(tick);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const t2 = performance.now();
      await new Promise(r => setTimeout(r, 4000)); run = false;
      const lts = P.lt.slice(lt0), lss = P.ls.slice(ls0); const top = Object.entries(P.muts).sort((a, b) => b[1] - a[1]).slice(0, 15);
      return {goMs: Math.round(t1 - t0), firstPaintMs: Math.round(t2 - t0), lt: {n: lts.length, total: lts.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...lts.map(x => x[1])), list: lts.map(x => [Math.round(x[0] - t0), x[1]])}, ls: {n: lss.length, cls: +lss.reduce((a, b) => a + b[1], 0).toFixed(3), top: lss.sort((a, b) => b[1] - a[1]).slice(0, 5)}, mut: P.mut, top, stages: frames.slice(0, 40)}; }, TAB);
    const m1 = await cdp.send('Performance.getMetrics');
    if (PROF) { const {profile} = await cdp.send('Profiler.stop'); fs.writeFileSync(path.join(OUT, TAG + '_switch.cpuprofile'), JSON.stringify(profile)); out.switchProf = aggregate(profile, 'Coates-GC500-2026'); }
    const md = (a, b) => { const o = {}; const A = Object.fromEntries(a.metrics.map(x => [x.name, x.value])); b.metrics.forEach(x => { if (/Duration|Count/.test(x.name)) o[x.name] = +((x.value - (A[x.name] || 0)) * (/Duration/.test(x.name) ? 1000 : 1)).toFixed(1); }); return o; };
    out.switch = sw; out.switchMetrics = md(m0, m1);
    out.switchCounts = await p.evaluate(() => { const r = JSON.parse(JSON.stringify(window.__cnt)); for (const k in window.__cnt) window.__cnt[k] = {n: 0, ms: 0}; return r; });
    // idle
    if (PROF) { await cdp.send('Profiler.start'); }
    const m2 = await cdp.send('Performance.getMetrics');
    out.idle = await p.evaluate(async (IDLE) => { const P = window.__perf, lt0 = P.lt.length, ls0 = P.ls.length; P.mut = 0; P.muts = {};
      await new Promise(r => setTimeout(r, IDLE));
      const lts = P.lt.slice(lt0), lss = P.ls.slice(ls0);
      return {mut: P.mut, top: Object.entries(P.muts).sort((a, b) => b[1] - a[1]).slice(0, 15), lt: {n: lts.length, total: lts.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...lts.map(x => x[1]))}, ls: {n: lss.length, cls: +lss.reduce((a, b) => a + b[1], 0).toFixed(3)}}; }, IDLE);
    const m3 = await cdp.send('Performance.getMetrics');
    out.idleMetrics = md(m2, m3);
    out.idleCounts = await p.evaluate(() => window.__cnt);
    if (PROF) { const {profile} = await cdp.send('Profiler.stop'); fs.writeFileSync(path.join(OUT, TAG + '_idle.cpuprofile'), JSON.stringify(profile)); out.idleProf = aggregate(profile, 'Coates-GC500-2026'); }
    out.verAfter = await p.evaluate(() => { try { return SYNC.db.readVersion821(); } catch (e) { return null; } });
    out.domNodes = await p.evaluate(() => document.getElementsByTagName('*').length);
    out.paneNodes = await p.evaluate(k => document.getElementById('pane-' + k).getElementsByTagName('*').length, TAB);
    out.errors = s.errors; out.blocked = s.counts.blocked;
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 800); }
  fs.writeFileSync(path.join(OUT, TAG + '.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({tag: TAG, goMs: out.switch && out.switch.goMs, lt: out.switch && out.switch.lt.total, idleLT: out.idle && out.idle.lt.total, err: out.err}));
  await s.browser.close();
})();
