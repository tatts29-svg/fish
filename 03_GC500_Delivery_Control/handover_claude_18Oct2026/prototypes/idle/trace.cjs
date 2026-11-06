/* main-thread breakdown while idle: trace N s per tab and sum renderer-main event time by name */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LT = `(() => { const L = window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => L.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {} })();`;
(async () => {
 const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), SECS = +(process.env.SECS || 20);
 const s = await open({pageFile: process.env.PAGE, init: LT + (process.env.EXTRA_INIT ? fs.readFileSync(process.env.EXTRA_INIT, 'utf8') : ''), cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
 const p = s.page; const cdp = await p.context().newCDPSession(p);
 const settle = async (q, max) => { const t0 = Date.now(); while (Date.now() - t0 < max) { const v = await p.evaluate(() => { const L = window.__lt; return performance.now() - (L.length ? L[L.length - 1][0] + L[L.length - 1][1] : 0); }); if (v >= q) return; await sleep(1000); } };
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000});
 await settle(6000, 150000);
 const res = {};
 for (const tab of (process.env.TABS || 'today,plant').split(',')) {
  if (tab !== 'today') { await p.evaluate(k => go(k), tab); await settle(6000, 120000); }
  if (process.env.PAUSE_ANIM === '1') await p.evaluate(() => { const st = document.createElement('style'); st.textContent = '*{animation-play-state:paused!important}'; document.head.appendChild(st); });
  const events = []; cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', {traceConfig: {includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'cc', 'v8.execute'], recordMode: 'recordAsMuchAsPossible'}, transferMode: 'ReportEvents'});
  await sleep(SECS * 1000); await cdp.send('Tracing.end'); await done; cdp.removeAllListeners('Tracing.dataCollected');
  // renderer main thread
  const tn = {}; events.filter(e => e.name === 'thread_name').forEach(e => tn[e.pid + ':' + e.tid] = e.args.name);
  const main = Object.keys(tn).filter(k => tn[k] === 'CrRendererMain');
  const mainSet = new Set(main);
  const ev = events.filter(e => mainSet.has(e.pid + ':' + e.tid) && e.ph === 'X' && e.dur);
  // top-level tasks
  const tasks = ev.filter(e => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask');
  const busy = tasks.reduce((a, e) => a + e.dur, 0) / 1000;
  const by = {}; for (const e of ev) { if (/RunTask/.test(e.name)) continue; const b = by[e.name] || (by[e.name] = {n: 0, ms: 0}); b.n++; b.ms += e.dur / 1000; }
  const paints = ev.filter(e => e.name === 'Paint'); const areas = paints.map(e => { const c = e.args && e.args.data && e.args.data.clip; if (!c) return 0; const xs = [c[0], c[2], c[4], c[6]], ys = [c[1], c[3], c[5], c[7]]; return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); });
  const paintLayers = {}; paints.forEach(e => { const k = (e.args && e.args.data && (e.args.data.nodeId + ':' + (e.args.data.layerId || ''))) || '?'; paintLayers[k] = (paintLayers[k] || 0) + 1; });
  res[tab] = {secs: SECS, busyMs: +busy.toFixed(0), busyPct: +(100 * busy / (SECS * 1000)).toFixed(1), nTasks: tasks.length,
   top: Object.entries(by).sort((a, b) => b[1].ms - a[1].ms).slice(0, 22).map(([k, v]) => [k, v.n, +v.ms.toFixed(0)]),
   paints: paints.length, paintAreaAvg: paints.length ? Math.round(areas.reduce((a, b) => a + b, 0) / paints.length) : 0, paintLayers: Object.entries(paintLayers).sort((a, b) => b[1] - a[1]).slice(0, 6)};
  if (process.env.SAVE) fs.writeFileSync(process.env.SAVE + '.' + tab + '.trace.json', JSON.stringify(events));
 }
 for (const [tab, r] of Object.entries(res)) { console.log('=== ' + tab + ' busy ' + r.busyMs + 'ms (' + r.busyPct + '%) tasks ' + r.nTasks + ' paints ' + r.paints + ' avgArea ' + r.paintAreaAvg + ' layers ' + JSON.stringify(r.paintLayers)); r.top.forEach(x => console.log('   ' + String(x[2]).padStart(6) + ' ' + String(x[1]).padStart(6) + '  ' + x[0])); }
 if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(res));
 await s.browser.close();
})();
