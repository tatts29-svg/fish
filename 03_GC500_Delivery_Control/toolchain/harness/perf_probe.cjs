/* Read-only performance probe (Claude, 18 Oct 2026): page load long tasks and layout shifts, a tab switch (set TAB, default the Build tab key), 15 s idle on it, and scroll. GET only, writes aborted.
   PAGE=build/.../GC500_Delivery_Control_hosted.html [MOB=1] [CPU=4] [TAB=timeline] node toolchain/harness/perf_probe.cjs > out.json */
const {open} = require('./open_page.js');
const INIT = `(() => { const P = window.__perf = {lt: [], ls: [], marks: {}, mut: 0, muts: {}, t0: performance.now()};
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {}
 try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) P.ls.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map(s => s.node ? (s.node.id || s.node.className || s.node.nodeName) : '').join(',').slice(0, 120)]); })).observe({type: 'layout-shift', buffered: true}); } catch (e) {}
 const key = n => { for (let x = n, d = 0; x && d < 6; x = x.parentElement, d++) { if (x.id) return '#' + x.id + (d ? '>' + d : ''); } return n.nodeName; };
 document.addEventListener('DOMContentLoaded', () => { P.marks.dcl = performance.now(); new MutationObserver(ms => { if (!P.counting) return; for (const m of ms) { P.mut++; const k = key(m.target); P.muts[k] = (P.muts[k] || 0) + (m.addedNodes.length + m.removedNodes.length || 1); } }).observe(document.body, {childList: true, subtree: true, attributes: true, characterData: true}); });
 addEventListener('load', () => { P.marks.load = performance.now(); });
})();`;
(async () => { const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0);
 const s = await open({pageFile: process.env.PAGE, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})}); const p = s.page; const out = {mob: MOB, cpu: CPU};
 try {
  out.loadMarks = await p.evaluate(() => window.__perf.marks);
  const t = Date.now(); await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); out.liveAfterLoadMs = Date.now() - t;
  out.liveAt = await p.evaluate(() => Math.round(performance.now()));
  await p.waitForTimeout(3000);
  out.tabs = await p.evaluate(() => TABS.map(t => t[0]));
  out.firstPane = await p.evaluate(() => (document.querySelector('main .pane:not([hidden])') || {}).id);
  out.ltLoad = await p.evaluate(() => { const L = window.__perf.lt; return {n: L.length, total: L.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...L.map(x => x[1])), top: L.slice().sort((a, b) => b[1] - a[1]).slice(0, 8)}; });
  out.lsLoad = await p.evaluate(() => { const L = window.__perf.ls; return {n: L.length, cls: +L.reduce((a, b) => a + b[1], 0).toFixed(3), top: L.slice().sort((a, b) => b[1] - a[1]).slice(0, 6)}; });
  const buildKey = process.env.TAB || 'timeline';    /* the Build tab is go('timeline') */
  out.buildKey = buildKey;
  // switch to Build
  const sw = await p.evaluate(async k => { const P = window.__perf, lt0 = P.lt.length, ls0 = P.ls.length; P.counting = true; P.mut = 0; P.muts = {}; const t0 = performance.now(); go(k);
   const t1 = performance.now(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const t2 = performance.now();
   await new Promise(r => setTimeout(r, 4000));
   const lts = P.lt.slice(lt0), lss = P.ls.slice(ls0); const top = Object.entries(P.muts).sort((a, b) => b[1] - a[1]).slice(0, 12);
   return {goMs: Math.round(t1 - t0), firstPaintMs: Math.round(t2 - t0), lt: {n: lts.length, total: lts.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...lts.map(x => x[1]))}, ls: {n: lss.length, cls: +lss.reduce((a, b) => a + b[1], 0).toFixed(3), top: lss.sort((a, b) => b[1] - a[1]).slice(0, 5)}, mut: P.mut, top}; }, buildKey);
  out.buildSwitch = sw;
  // idle on Build for 15 s: anything re-rendering is flicker
  out.buildIdle = await p.evaluate(async () => { const P = window.__perf, lt0 = P.lt.length, ls0 = P.ls.length; P.mut = 0; P.muts = {};
   const pane = document.querySelector('main .pane:not([hidden])'); let replaced = 0; const mo = new MutationObserver(ms => ms.forEach(m => { if (m.type === 'childList' && m.removedNodes.length > 2) replaced++; })); mo.observe(pane, {childList: true, subtree: true});
   await new Promise(r => setTimeout(r, 15000)); mo.disconnect();
   const lts = P.lt.slice(lt0), lss = P.ls.slice(ls0);
   return {mut: P.mut, bigReplacements: replaced, top: Object.entries(P.muts).sort((a, b) => b[1] - a[1]).slice(0, 15), lt: {n: lts.length, total: lts.reduce((a, b) => a + b[1], 0), max: Math.max(0, ...lts.map(x => x[1]))}, ls: {n: lss.length, cls: +lss.reduce((a, b) => a + b[1], 0).toFixed(3), top: lss.slice(0, 5)}}; });
  // scroll the Build tab top to bottom: jank while scrolling
  out.buildScroll = await p.evaluate(async () => { const frames = []; let last = performance.now(), run = true; const tick = t => { frames.push(t - last); last = t; if (run) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
   const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); run = false;
   const f = frames.slice(1); f.sort((a, b) => a - b); return {height: H, frames: f.length, p50: +(f[Math.floor(f.length / 2)] || 0).toFixed(1), p95: +(f[Math.floor(f.length * 0.95)] || 0).toFixed(1), max: +(f[f.length - 1] || 0).toFixed(1), over50: f.filter(x => x > 50).length}; });
  out.domNodes = await p.evaluate(() => document.getElementsByTagName('*').length);
  out.timers = await p.evaluate(() => ({observers: typeof MutationObserver}));
  out.errors = s.errors; out.blocked = s.counts.blocked;
 } catch (e) { out.err = String(e && e.message || e).slice(0, 500); }
 console.log(JSON.stringify(out, null, 1)); await s.browser.close(); })();
