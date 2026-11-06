// Browser-wide trace (timeline + V8 CPU samples) from before navigation until the page goes idle.
// usage: PAGE=file OUT=trace.json [MOB=1 CPU=4] [IDLE=8000] [MAXS=150] node trace_load.cjs
const {open} = require('./popen.cjs'); const fs = require('fs');
const INIT = `(() => { const P = window.__perf = {lt: [], ls: [], marks: {}};
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {}
 try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) P.ls.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map(s => s.node ? (s.node.id || s.node.className || s.node.nodeName) : '').join(',').slice(0, 120)]); })).observe({type: 'layout-shift', buffered: true}); } catch (e) {}
 document.addEventListener('DOMContentLoaded', () => { P.marks.dcl = performance.now(); });
 addEventListener('load', () => { P.marks.load = performance.now(); });
})();` + (process.env.EXTRA_INIT ? fs.readFileSync(process.env.EXTRA_INIT, 'utf8') : '');
const CATS = ['toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'disabled-by-default-v8.cpu_profiler', 'v8.execute', 'blink.user_timing', 'loading', 'v8'];
(async () => {
  const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), OUT = process.env.OUT, IDLE = +(process.env.IDLE || 8000), MAXS = +(process.env.MAXS || 150);
  const trace = !!OUT; let bcdp;
  const t0 = Date.now();
  const s = await open({pageFile: process.env.PAGE, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900}),
    before: async ({browser}) => { if (!trace) return; bcdp = await browser.newBrowserCDPSession();
      await bcdp.send('Tracing.start', {transferMode: 'ReturnAsStream', traceConfig: {recordMode: 'recordAsMuchAsPossible', includedCategories: CATS, excludedCategories: ['*']}}); }});
  const p = s.page, out = {mob: MOB, cpu: CPU};
  try {
    out.marks = await p.evaluate(() => window.__perf.marks);
    // wait until live and idle (no long task for IDLE ms)
    for (;;) { await p.waitForTimeout(1000);
      const st = await p.evaluate(() => { const L = window.__perf.lt, last = L.length ? L[L.length - 1][0] + L[L.length - 1][1] : 0; return {now: performance.now(), last, live: typeof SYNC !== 'undefined' && SYNC.status}; });
      if (st.live === 'live' && st.now - st.last > IDLE) { out.idleAt = Math.round(st.now); break; }
      if ((Date.now() - t0) / 1000 > MAXS) { out.timeout = true; out.idleAt = Math.round(st.now); break; } }
    out.lt = await p.evaluate(() => window.__perf.lt);
    out.ls = await p.evaluate(() => window.__perf.ls);
    out.ltTotal = out.lt.reduce((a, b) => a + b[1], 0); out.lsTotal = +out.ls.reduce((a, b) => a + b[1], 0).toFixed(3);
    out.marks = await p.evaluate(() => window.__perf.marks);
    out.errors = s.errors; out.counts = s.counts;
  } catch (e) { out.err = String(e && e.message || e).slice(0, 500); }
  if (trace) {
    const done = new Promise(r => bcdp.once('Tracing.tracingComplete', r));
    await bcdp.send('Tracing.end'); const ev = await done; const fd = fs.openSync(OUT, 'w');
    for (;;) { const r = await bcdp.send('IO.read', {handle: ev.stream, size: 1 << 22}); fs.writeSync(fd, r.base64Encoded ? Buffer.from(r.data, 'base64') : r.data); if (r.eof) break; }
    fs.closeSync(fd); await bcdp.send('IO.close', {handle: ev.stream});
  }
  console.log(JSON.stringify(out)); await s.browser.close();
})();
