/* Build tab switch: from go('plant') to the Build table fully filled (PLANT_REST.flush gone) and quiet.
   Same settle rule for both pages. env: PAGE, MOB=1, CPU=4, OUT, PROF=1 */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LT = `(() => { const L = window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => L.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {} })();`;
(async () => {
 const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0);
 const s = await open({pageFile: process.env.PAGE, init: LT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
 const p = s.page, out = {}; const cdp = await p.context().newCDPSession(p);
 const settle = async (quietMs, maxMs, minAt) => { const t0 = Date.now(); while (Date.now() - t0 < maxMs) { const q = await p.evaluate(() => { const L = window.__lt.filter(x => x[1] > 250), n = performance.now(); return {quiet: n - (L.length ? L[L.length - 1][0] + L[L.length - 1][1] : 0), now: n, pump: typeof PLANT_REST !== 'undefined' && !!PLANT_REST.flush}; }); if (q.quiet >= quietMs && q.now >= minAt && !q.pump) return Date.now() - t0; await sleep(1000); } return -1; };
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000});
  out.settle0 = await settle(10000, 300000, MOB ? 150000 : 40000);
  if (process.env.PROF === '1') { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 500}); await cdp.send('Profiler.start'); }
  const r = await p.evaluate(async () => { const n0 = window.__lt.length, t0 = performance.now(); go('plant'); const goMs = performance.now() - t0;
   let filled = -1; for (let i = 0; i < 2400; i++) { await new Promise(r => setTimeout(r, 100)); if (typeof PLANT_REST === 'undefined' || !PLANT_REST.flush) { if (!document.querySelector('#pane-plant tr.plrest')) { filled = performance.now() - t0; break; } } }
   const L = window.__lt.slice(n0); return {goMs: Math.round(goMs), filledMs: Math.round(filled), lt: {n: L.length, total: L.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...L.map(x => x[1]))}}; });
  Object.assign(out, r);
  if (process.env.PROF === '1') { const pr = (await cdp.send('Profiler.stop')).profile; fs.writeFileSync(process.env.OUT + '.cpuprofile', JSON.stringify(pr)); }
  out.errors = s.errors;
 } catch (e) { out.err = String(e && e.stack || e).slice(0, 600); }
 if (process.env.OUT) fs.writeFileSync(process.env.OUT + '.json', JSON.stringify(out));
 console.log(JSON.stringify(out));
 await s.browser.close();
})();
