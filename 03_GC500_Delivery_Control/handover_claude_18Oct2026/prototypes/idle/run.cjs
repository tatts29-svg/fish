/* Idle / sync probe. Read only: the harness aborts every write.
   env: PAGE, MOB=1, CPU=4, INST=1 (timer/observer inventory), PROF=1 (CPU profile per window), IDLE=60 (s), TABS=today,plant, REFRESH=1, OUT=file */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs'), path = require('path');
const LT = `(() => { const L = window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => L.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {} })();`;
const INST = fs.readFileSync(path.join(__dirname, 'inst.js'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), IDLE = +(process.env.IDLE || 60) * 1000, inst = process.env.INST === '1', prof = process.env.PROF === '1';
 const tabs = (process.env.TABS || 'today,plant').split(',');
 const init = LT + (inst ? '\n' + INST : '') + (process.env.EXTRA_INIT ? '\n' + fs.readFileSync(process.env.EXTRA_INIT, 'utf8') : '');
 const t00 = Date.now();
 const s = await open({pageFile: process.env.PAGE, init, cpu: CPU, gl: process.env.GL === '1', ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
 const p = s.page, out = {page: path.basename(process.env.PAGE), mob: MOB, cpu: CPU, inst, windows: []};
 const cdp = await p.context().newCDPSession(p); await cdp.send('Performance.enable', {timeDomain: 'timeTicks'});
 const metrics = async () => { const {metrics} = await cdp.send('Performance.getMetrics'); const m = {}; metrics.forEach(x => m[x.name] = x.value); return m; };
 /* settled = at least minMs (page clock) has passed, no long task over THR ms has ended in the last quietMs, and the Build
    table has finished filling. The same rule for both pages: a page that never stops ticking still gets measured. */
 const THR = +(process.env.THR || 250);
 const settle = async (quietMs, maxMs, minAt) => { const t0 = Date.now(); while (Date.now() - t0 < maxMs) { const q = await p.evaluate(thr => { const L = window.__lt.filter(x => x[1] > thr), n = performance.now(); const last = L.length ? L[L.length - 1][0] + L[L.length - 1][1] : 0; const pump = typeof PLANT_REST !== 'undefined' && !!PLANT_REST.flush; return {quiet: n - last, now: n, pump}; }, THR); if (q.quiet >= quietMs && q.now >= minAt && !q.pump) return Date.now() - t0; await sleep(1000); } return -1; };
 const START = +(process.env.START || (MOB ? 150000 : 40000)), MINTAB = +(process.env.MINTAB || (MOB ? 40000 : 15000));
 try {
  out.loadWallMs = Date.now() - t00;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000});
  out.liveAt = await p.evaluate(() => Math.round(performance.now()));
  out.settleMs = await settle(10000, 300000, START);
  out.settledAt = await p.evaluate(() => Math.round(performance.now()));
  if (inst) await p.evaluate(() => window.__idle.wrapFns(['syncFooter', 'docsRecovery1016', 'syncRedraw', 'render', 'renderToday', 'renderTimeline', 'renderPlant', 'docsRedraw', 'photoRedraw', 'tpodTick', 'tpodPaint', 'hzCountdown', 'applyRemote', 'recStrip', 'drawerSync798Refresh', 'reportsPoll', 'persist']));
  for (const tab of tabs) {
   if (tab !== 'today' || out.windows.length) { await p.evaluate(k => go(k), tab); const at = await p.evaluate(() => performance.now()); out['settle_' + out.windows.length + '_' + tab] = await settle(10000, 240000, at + MINTAB); }
   const w = {tab, pane: await p.evaluate(() => (document.querySelector('main .pane:not([hidden])') || {}).id)};
   const lt0 = await p.evaluate(() => window.__lt.length), m0 = await metrics();
   if (inst) await p.evaluate(() => window.__idle.start());
   if (prof) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 500}); await cdp.send('Profiler.start'); }
   const tw0 = Date.now(); await sleep(IDLE); const wall = Date.now() - tw0;
   let profile = null; if (prof) { profile = (await cdp.send('Profiler.stop')).profile; await cdp.send('Profiler.disable'); }
   const m1 = await metrics();
   if (inst) w.inv = await p.evaluate(() => window.__idle.stop());
   const lts = await p.evaluate(n => window.__lt.slice(n), lt0);
   const d = k => +((m1[k] - m0[k]) || 0).toFixed(3);
   w.wallMs = wall; w.task = d('TaskDuration'); w.script = d('ScriptDuration'); w.layout = d('LayoutDuration'); w.style = d('RecalcStyleDuration');
   w.layoutN = d('LayoutCount'); w.styleN = d('RecalcStyleCount'); w.busyPct = +(100 * w.task / (wall / 1000)).toFixed(1);
   w.lt = {n: lts.length, total: lts.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...lts.map(x => x[1]))};
   w.nodes = m1.Nodes; w.heapMB = +(m1.JSHeapUsedSize / 1e6).toFixed(1);
   if (profile) { const f = (process.env.OUT || 'out') + '.' + out.windows.length + tab + '.cpuprofile'; fs.writeFileSync(f, JSON.stringify(profile)); w.profile = f; }
   out.windows.push(w);
   if (process.env.REFRESH === '1') { /* a refresh that brings a record: the same path a changed version takes */
    const r0 = await metrics(), l0 = await p.evaluate(() => window.__lt.length); if (inst) await p.evaluate(() => window.__idle.start());
    if (prof) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 500}); await cdp.send('Profiler.start'); }
    const pulled = await p.evaluate(async () => { for (let k = 0; k < 40; k++) { const t0 = performance.now(); await SYNC.backend.pull(true); const d = performance.now() - t0; if (d >= 20) return Math.round(d); await new Promise(r => setTimeout(r, 250)); } return -1; });
    await sleep(+(process.env.REFWIN || 30) * 1000); const r1 = await metrics();
    let rprof = null; if (prof) { rprof = (await cdp.send('Profiler.stop')).profile; await cdp.send('Profiler.disable'); fs.writeFileSync((process.env.OUT || 'out') + '.' + tab + '.refresh.cpuprofile', JSON.stringify(rprof)); }
    const ls = await p.evaluate(n => window.__lt.slice(n), l0);
    const rr = {pullMs: pulled, task: +(r1.TaskDuration - r0.TaskDuration).toFixed(3), script: +(r1.ScriptDuration - r0.ScriptDuration).toFixed(3), layout: +(r1.LayoutDuration - r0.LayoutDuration).toFixed(3), style: +(r1.RecalcStyleDuration - r0.RecalcStyleDuration).toFixed(3), lt: ls};
    if (inst) rr.inv = await p.evaluate(() => window.__idle.stop());
    w.refresh = rr;
   }
  }
  out.errors = s.errors; out.blocked = s.counts.blocked; out.live = s.counts.live;
 } catch (e) { out.err = String(e && e.stack || e).slice(0, 800); }
 const txt = JSON.stringify(out, null, 1);
 if (process.env.OUT) fs.writeFileSync(process.env.OUT + '.json', txt);
 console.log(JSON.stringify(out.windows.map(w => ({tab: w.tab, pane: w.pane, busy: w.busyPct, task: w.task, script: w.script, layout: w.layout, style: w.style, layoutN: w.layoutN, styleN: w.styleN, lt: w.lt, refresh: w.refresh && {pullMs: w.refresh.pullMs, task: w.refresh.task, lt: w.refresh.lt}}))), out.err || '', 'settle', out.settleMs, out.settledAt);
 await s.browser.close();
})();
