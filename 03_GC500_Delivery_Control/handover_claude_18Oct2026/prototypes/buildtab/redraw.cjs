/* Build tab while idle: what a record refresh does to it. Read only - nothing is written to the record.
   1. open Build, settle; 2. swipe the day strip back 3 cards (someone looking at earlier days);
   3. make the page believe the shared records changed, the way a poll does (the Documents timestamp in page memory),
      and wait for the page's own 4 s poll to redraw; 4. report the redraw cost and whether the strip jumped.
   env: PAGE, MOB, CPU, OUT, TAG */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs'), path = require('path');
const INIT = `(() => { const P = window.__perf = {lt: []}; try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {} })();`;
(async () => {
  const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), OUT = process.env.OUT || '.', TAG = process.env.TAG || 'redraw';
  const s = await open({pageFile: process.env.PAGE, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page; const out = {tag: TAG};
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
    const t0 = Date.now();
    while (Date.now() - t0 < 150000) { const q = await p.evaluate(() => { const L = window.__perf.lt.filter(x => x[1] >= 250); const end = L.length ? Math.max(...L.map(x => x[0] + x[1])) : 0; return performance.now() - end > 6000; }); if (q) break; await p.waitForTimeout(1000); }
    await p.evaluate(() => go('timeline')); await p.waitForTimeout(MOB ? 15000 : 6000);
    await p.evaluate(() => { const C = window.__rc = {n: 0, ms: 0}; const o = renderTimeline; renderTimeline = function () { const t = performance.now(); try { return o.apply(this, arguments); } finally { C.n++; C.ms += performance.now() - t; } }; });
    out.swipe = await p.evaluate(async () => { const strip = document.querySelector('#pane-timeline .daystrip'); const w = strip.querySelector('.bc984-day').getBoundingClientRect().width + 20; const before = strip.scrollLeft; for (let k = 0; k < 3; k++) { strip.scrollLeft -= w; await new Promise(r => setTimeout(r, 400)); } return {before: Math.round(before), after: Math.round(strip.scrollLeft)}; });
    await p.waitForTimeout(MOB ? 8000 : 3000);
    const r = await p.evaluate(async MOB => { const P = window.__perf, lt0 = P.lt.length; const strip0 = document.querySelector('#pane-timeline .daystrip'); const sl0 = strip0.scrollLeft; const C = window.__rc; C.n = 0; C.ms = 0;
      DOCS.at = (DOCS.at || 0) + 1; /* in page memory only: the poll sees the shared-records health change */
      const t0 = performance.now(); while (C.n === 0 && performance.now() - t0 < 9000) await new Promise(r => setTimeout(r, 100));
      const tr = performance.now() - t0; await new Promise(r => setTimeout(r, MOB ? 6000 : 3000));
      const strip1 = document.querySelector('#pane-timeline .daystrip'); const lts = P.lt.slice(lt0);
      return {redraws: C.n, redrawMs: Math.round(C.ms), waitedMs: Math.round(tr), stripReplaced: strip0 !== strip1, scrollLeftBefore: Math.round(sl0), scrollLeftAfter: Math.round(strip1.scrollLeft), lt: lts.map(x => [Math.round(x[0] - t0), x[1]]), ltTotal: lts.reduce((a, b) => a + b[1], 0)}; }, MOB);
    out.refresh = r; out.errors = s.errors;
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 600); }
  fs.writeFileSync(path.join(OUT, TAG + '.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out));
  await s.browser.close();
})();
