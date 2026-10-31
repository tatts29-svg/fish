// Load metrics without tracing. usage: PAGE=file [MOB=1 CPU=4] [QUIET=8000] [MAXS=150] node measure.cjs  -> one JSON line
const {open} = require('./popen.cjs');
const INIT = `(() => { const P = window.__perf = {lt: [], ls: [], marks: {}, tabs: []};
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {}
 try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) P.ls.push([Math.round(e.startTime), +e.value.toFixed(4)]); })).observe({type: 'layout-shift', buffered: true}); } catch (e) {}
 document.addEventListener('DOMContentLoaded', () => { P.marks.dcl = Math.round(performance.now()); });
 addEventListener('load', () => { P.marks.load = Math.round(performance.now()); });
 let was = null;
 const chk = () => { const html = document.documentElement; if (!html) return; const v = html.getAttribute('data-refresh904'); if (v !== was) { was = v; if (v === 'loading') P.marks.loading = Math.round(performance.now()); else if (P.marks.loading != null && P.marks.reveal == null) { P.marks.reveal = Math.round(performance.now()); P.marks.revealState = v; } } };
 new MutationObserver(chk).observe(document, {attributes: true, subtree: true, attributeFilter: ['data-refresh904']}); chk();
 let lastTab = null; setInterval(() => { try { const t = (typeof state !== 'undefined' && state.tab) || null; if (t !== lastTab) { lastTab = t; P.tabs.push([Math.round(performance.now()), t, location.hash]); } } catch (e) {} }, 200);
})();`;
(async () => {
  const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), QUIET = +(process.env.QUIET || 8000), MAXS = +(process.env.MAXS || 150);
  const t0 = Date.now(); const s = await open({pageFile: process.env.PAGE, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page; let st;
  for (;;) { await p.waitForTimeout(1000);
    st = await p.evaluate(() => { const P = window.__perf, big = P.lt.filter(x => x[1] >= 300), last = big.length ? big[big.length - 1][0] + big[big.length - 1][1] : 0; return {now: performance.now(), last, reveal: P.marks.reveal}; });
    if (st.reveal != null && st.now - Math.max(st.last, st.reveal) > QUIET) break; if ((Date.now() - t0) / 1000 > MAXS) { st.timeout = true; break; } }
  const r = await p.evaluate(() => { const P = window.__perf, big = P.lt.filter(x => x[1] >= 300);
    return {marks: P.marks, ltN: P.lt.length, ltTotal: P.lt.reduce((a, b) => a + b[1], 0), bigN: big.length, bigTotal: big.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...P.lt.map(x => x[1])),
      settled: big.length ? big[big.length - 1][0] + big[big.length - 1][1] : 0, cls: +P.ls.reduce((a, b) => a + b[1], 0).toFixed(3), big: big.map(x => x.join('+')).join(' '), tabs: P.tabs, live: typeof SYNC !== 'undefined' && SYNC.status, docs: typeof DOCS !== 'undefined' && DOCS.state}; });
  r.timeout = !!st.timeout; r.errors = s.errors.length; r.page = process.env.PAGE; r.mob = MOB; r.cpu = CPU;
  console.log(JSON.stringify(r)); await s.browser.close();
})().catch(e => { console.log(JSON.stringify({err: String(e).slice(0, 300), page: process.env.PAGE})); process.exit(0); });
