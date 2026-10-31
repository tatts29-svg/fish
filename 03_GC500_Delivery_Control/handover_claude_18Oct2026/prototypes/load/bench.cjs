// In-page micro-benchmarks on a settled page: Today render(), Idle1006.redraw(), MS1026.unseenNow(), Build render.
// usage: FREEZE=dir PAGE=file [MOB=1 CPU=4] [REPS=5] node bench.cjs
const {open} = require('./popen.cjs');
const INIT = `(() => { const P = window.__perf = {lt: []}; try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([e.startTime, e.duration]))).observe({type: 'longtask', buffered: true}); } catch (e) {} })();`;
(async () => {
  const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), REPS = +(process.env.REPS || 5);
  const s = await open({pageFile: process.env.PAGE, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page; let out0;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && document.documentElement.getAttribute('data-refresh904') !== 'loading', null, {timeout: 300000, polling: 500});
  const idle = (quiet) => p.evaluate(async q => { const t0 = performance.now(); for (;;) { await new Promise(r => setTimeout(r, 250)); const L = window.__perf.lt, last = L.length ? L[L.length - 1][0] + L[L.length - 1][1] : 0; if (performance.now() - Math.max(last, t0) > q || performance.now() - t0 > 120000) return; } }, quiet);
  await idle(5000);
  out0 = await p.evaluate(() => state.tab); if (out0 !== 'today') { await p.evaluate(() => go('today')); await idle(3000); }
  const out = await p.evaluate(async REPS => {
    const med = a => { const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.floor(s.length / 2)]); };
    const time = async (fn) => { const r = []; for (let i = 0; i < REPS; i++) { await new Promise(res => setTimeout(res, 300)); const t0 = performance.now(); fn(); r.push(performance.now() - t0); } return {med: med(r), all: r.map(Math.round)}; };
    const o = {tab: state.tab};
    o.renderToday = await time(() => render());
    o.redrawToday = await time(() => window.Idle1006.redraw());
    o.unseenNow = window.MS1026 ? await time(() => MS1026.unseenNow()) : null;
    o.facts = window.MS1025 ? await time(() => holdAssets(() => MS1025.allFacts())) : null;
    go('plant'); await new Promise(res => setTimeout(res, 1500));
    o.renderPlant = await time(() => render());
    go('today'); await new Promise(res => setTimeout(res, 1500));
    o.goPlant = await time(() => { go('plant'); go('today'); });
    return o; }, REPS);
  out.landed = out0; out.page = process.env.PAGE; out.mob = MOB; out.cpu = CPU; out.errors = s.errors;
  console.log(JSON.stringify(out)); await s.browser.close();
})().catch(e => { console.log(JSON.stringify({err: String(e).slice(0, 300), page: process.env.PAGE})); process.exit(0); });
