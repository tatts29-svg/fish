/* Build tab: open it, let it settle, then swipe the day strip back through past days the way a thumb would
   (one card at a time) and record long tasks, frame gaps and the progress fills. Read only.
   env: PAGE, MOB, CPU, OUT, TAG, STEPS */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs'), path = require('path');
const INIT = `(() => { const P = window.__perf = {lt: []}; try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {} })();`;
(async () => {
  const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), OUT = process.env.OUT || '.', TAG = process.env.TAG || 'swipe', STEPS = +(process.env.STEPS || 4);
  const s = await open({pageFile: process.env.PAGE, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page; const out = {tag: TAG};
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
    const t0 = Date.now();
    while (Date.now() - t0 < 150000) { const q = await p.evaluate(() => { const L = window.__perf.lt.filter(x => x[1] >= 250); const end = L.length ? Math.max(...L.map(x => x[0] + x[1])) : 0; return performance.now() - end > 6000; }); if (q) break; await p.waitForTimeout(1000); }
    await p.evaluate(() => go('timeline'));
    await p.waitForTimeout(MOB ? 12000 : 5000);
    out.before = await p.evaluate(() => window.BuildProgress986 && BuildProgress986.report());
    out.steps = [];
    for (let i = 0; i < STEPS; i++) {
      const r = await p.evaluate(async () => {
        const strip = document.querySelector('#pane-timeline .daystrip'); const card = strip.querySelector('.bc984-day');
        const w = card.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap || getComputedStyle(strip).gap || '0'); const P = window.__perf, lt0 = P.lt.length; const frames = []; let last = performance.now(), run = true;
        const tick = t => { frames.push(t - last); last = t; if (run) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
        const t0 = performance.now();
        // a thumb swipe: 12 small scroll steps over ~200 ms
        const target = strip.scrollLeft - w; for (let k = 1; k <= 12; k++) { strip.scrollLeft = target + w * (1 - k / 12); await new Promise(r => setTimeout(r, 16)); } strip.scrollLeft = target;
        const t1 = performance.now();
        await new Promise(r => setTimeout(r, 2500)); run = false;
        const lts = P.lt.slice(lt0); const f = frames.slice(1).sort((a, b) => a - b);
        const shown = [...strip.querySelectorAll('.bc984-day')].filter(c => { const b = c.getBoundingClientRect(), sb = strip.getBoundingClientRect(); return b.right > sb.left + 4 && b.left < sb.right - 4; }).map(c => c.dataset.day + ':' + c.dataset.buildProgress);
        return {swipeMs: Math.round(t1 - t0), lt: lts.map(x => [Math.round(x[0] - t0), x[1]]), ltTotal: lts.reduce((a, b) => a + b[1], 0), frames: f.length, p95: +(f[Math.floor(f.length * 0.95)] || 0).toFixed(1), max: +(f[f.length - 1] || 0).toFixed(1), over100: f.filter(x => x > 100).length, shown};
      });
      out.steps.push(r);
    }
    out.after = await p.evaluate(() => window.BuildProgress986 && BuildProgress986.report());
    out.errors = s.errors;
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 600); }
  fs.writeFileSync(path.join(OUT, TAG + '.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({tag: TAG, steps: (out.steps || []).map(x => [x.swipeMs, x.ltTotal, x.max, x.shown.join(' ')]), before: out.before, after: out.after, err: out.err}));
  await s.browser.close();
})();
