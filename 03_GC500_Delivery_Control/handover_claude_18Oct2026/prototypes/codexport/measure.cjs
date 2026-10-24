/* Read-only perf measurement: load (profiled from before navigation), go('plant'), idle on Build.
   env: PAGE, LINES, TAG, OUT, MOB=1, CPU=4, PROF=0 to disable profiler, SWITCH_MS, IDLE_MS */
const {open} = require('./open2.cjs'); const fs = require('fs'), path = require('path');
const INIT = `(() => { const P = window.__perf = {lt: [], ls: [], marks: {}};
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {}
 try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) P.ls.push([Math.round(e.startTime), +e.value.toFixed(4)]); })).observe({type: 'layout-shift', buffered: true}); } catch (e) {}
 document.addEventListener('DOMContentLoaded', () => { P.marks.dcl = Math.round(performance.now()); });
 addEventListener('load', () => { P.marks.load = Math.round(performance.now()); });
})();`;
const LINES = JSON.parse(fs.readFileSync(process.env.LINES, 'utf8'));
const scriptOf = ln => { for (const [i, id, s, e] of LINES) if (ln >= s && ln <= e) return i + (id ? ':' + id : ''); return '?'; };
const TARGETS = /^(reading|begin|renderTimeline|mount|buildAllAssets|build0|metadata925|unitEvidence|unitEvidenceKeys1057|native|nativeRead1057|syncFooter|window\.gc500CompleteKeys897|gc500CompleteKeys897|verified897|scan|drawer|costs|holdAssets|heldMemo|go|render|renderPlant|stringify|JSON\.stringify)$/;
function aggregate(prof) {
  const nodes = new Map(); prof.nodes.forEach(n => nodes.set(n.id, n)); const parent = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  const self = new Map(); const ts = prof.timeDeltas, smp = prof.samples;
  for (let i = 0; i < smp.length; i++) { const d = (ts[i + 1] !== undefined ? ts[i + 1] : 0) / 1000; self.set(smp[i], (self.get(smp[i]) || 0) + d); }
  const label = cf => { const isPage = cf.url && cf.url.includes('Coates-GC500-2026'); return (cf.functionName || '(anon)') + (isPage ? ' @' + scriptOf(cf.lineNumber) + ':L' + cf.lineNumber : (cf.url ? ' @' + cf.url.slice(-30) : '')); };
  const byFn = {}, incl = {}, tgt = {}; let total = 0, busy = 0;
  for (const [id, ms] of self) { const n = nodes.get(id), cf = n.callFrame; total += ms; if (!/^\((idle|program|garbage collector)\)$/.test(cf.functionName)) busy += ms;
    const k = label(cf); byFn[k] = (byFn[k] || 0) + ms;
    const seen = new Set(), seenT = new Set(); let x = id;
    while (x !== undefined) { const c = nodes.get(x).callFrame; const kk = label(c); if (!seen.has(kk)) { seen.add(kk); incl[kk] = (incl[kk] || 0) + ms; }
      if (TARGETS.test(c.functionName) && !seenT.has(c.functionName)) { seenT.add(c.functionName); tgt[c.functionName] = (tgt[c.functionName] || 0) + ms; } x = parent.get(x); } }
  const gc = Object.entries(byFn).filter(([k]) => k.startsWith('(garbage collector)')).reduce((a, [, v]) => a + v, 0);
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, +v.toFixed(1)]);
  return {totalMs: +total.toFixed(0), busyMs: +busy.toFixed(0), gcMs: +gc.toFixed(0), targets: Object.fromEntries(Object.entries(tgt).map(([k, v]) => [k, +v.toFixed(1)])), self: top(byFn, 40), incl: top(incl, 70)};
}
const ltSum = (L, from = 0, to = 1e12) => { const l = L.filter(x => x[0] >= from && x[0] < to); return {n: l.length, total: l.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...l.map(x => x[1])), over1s: l.filter(x => x[1] >= 1000).length}; };
(async () => {
  const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), TAG = process.env.TAG || 'run', OUT = process.env.OUT || 'runs', PROF = process.env.PROF !== '0';
  const SW = +(process.env.SWITCH_MS || (MOB ? 12000 : 5000)), IDLE = +(process.env.IDLE_MS || 10000), Q = MOB ? 8000 : 4000;
  const out = {tag: TAG, page: path.basename(process.env.PAGE), mob: MOB, cpu: CPU};
  const s = await open({pageFile: process.env.PAGE, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900}),
    before: async (page, cdp) => { if (PROF) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 1000}); await cdp.send('Profiler.start'); } }});
  const p = s.page, cdp = s.cdp;
  try {
    out.marks = await p.evaluate(() => window.__perf.marks);
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
    out.liveAt = await p.evaluate(() => Math.round(performance.now()));
    const t0 = Date.now();
    while (Date.now() - t0 < 240000) { const q = await p.evaluate(Q => { const L = window.__perf.lt; const end = L.length ? Math.max(...L.map(x => x[0] + x[1])) : 0; return performance.now() - end > Q; }, Q); if (q) break; await p.waitForTimeout(500); }
    out.quietAt = await p.evaluate(Q => { const L = window.__perf.lt; return L.length ? Math.max(...L.map(x => x[0] + x[1])) : 0; }, Q);
    const L0 = await p.evaluate(() => window.__perf.lt.slice()); out.loadLT = ltSum(L0); out.loadLTlist = L0.filter(x => x[1] >= 200);
    out.loadCLS = await p.evaluate(() => +window.__perf.ls.reduce((a, b) => a + b[1], 0).toFixed(3));
    if (PROF) { const {profile} = await cdp.send('Profiler.stop'); out.loadProf = aggregate(profile); if (process.env.SAVE) fs.writeFileSync(path.join(OUT, TAG + '_load.cpuprofile'), JSON.stringify(profile)); await cdp.send('Profiler.start'); }
    out.tab0 = await p.evaluate(() => state.tab); const TABS = (process.env.TABS || process.env.TAB || 'plant').split(','); out.sw = {};
    for (const TAB of TABS) {
      const sw = await p.evaluate(async ([SW, TAB]) => { const P = window.__perf, n0 = P.lt.length, t0 = performance.now(); go(TAB); const t1 = performance.now();
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); const t2 = performance.now(); await new Promise(r => setTimeout(r, SW));
        const l = P.lt.slice(n0); return {goMs: Math.round(t1 - t0), firstFrameMs: Math.round(t2 - t0), lt: {n: l.length, total: l.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...l.map(x => x[1]))}, list: l.map(x => [Math.round(x[0] - t0), x[1]])}; }, [SW, TAB]);
      if (PROF) { const {profile} = await cdp.send('Profiler.stop'); sw.prof = aggregate(profile); await cdp.send('Profiler.start'); }
      out.sw[TAB] = sw;
    }
    out.build = out.sw[TABS[0]]; out.buildProf = out.build.prof;
    out.idle = await p.evaluate(async IDLE => { const P = window.__perf, n0 = P.lt.length; await new Promise(r => setTimeout(r, IDLE)); const l = P.lt.slice(n0); return {n: l.length, total: l.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...l.map(x => x[1]))}; }, IDLE);
    if (PROF) { const {profile} = await cdp.send('Profiler.stop'); out.idleProf = aggregate(profile); }
    out.errors = s.errors; out.blocked = s.counts.blocked;
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 800); }
  fs.writeFileSync(path.join(OUT, TAG + '.json'), JSON.stringify(out, null, 1));
  const lp = out.loadProf || {}, bp = out.buildProf || {};
  console.log(JSON.stringify({tabs: Object.fromEntries(Object.entries(out.sw || {}).map(([k, v]) => [k, [v.goMs, v.lt.total, v.prof && v.prof.busyMs]])), tag: TAG, dcl: out.marks && out.marks.dcl, load: out.marks && out.marks.load, quiet: out.quietAt, loadLT: out.loadLT && out.loadLT.total, loadBusy: lp.busyMs, goMs: out.build && out.build.goMs, buildLT: out.build && out.build.lt.total, buildBusy: bp.busyMs, idleLT: out.idle && out.idle.total, err: out.err, errors: (out.errors || []).length, blocked: out.blocked}));
  await s.browser.close();
})();
