// Parity: open the page on a frozen record, visit every tab, capture each pane's innerText (+ header/footer/drawer-free).
// usage: FREEZE=dir PAGE=file OUT=parity.json [MOB=1] node parity.cjs
const {open} = require('./popen.cjs'); const fs = require('fs');
const INIT = `(() => { const P = window.__perf = {lt: []}; try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([e.startTime, e.duration]))).observe({type: 'longtask', buffered: true}); } catch (e) {} })();`;
(async () => {
  const MOB = process.env.MOB === '1';
  const s = await open({pageFile: process.env.PAGE, init: INIT, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page, out = {panes: {}, errors: null};
  const idle = async (quiet = 1500, max = 90000) => p.evaluate(async ([quiet, max]) => { const t0 = performance.now(); for (;;) { await new Promise(r => setTimeout(r, 250)); const L = window.__perf.lt, last = L.length ? L[L.length - 1][0] + L[L.length - 1][1] : 0; const now = performance.now(); if (now - Math.max(last, t0) > quiet || now - t0 > max) return; } }, [quiet, max]);
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && document.documentElement.getAttribute('data-refresh904') !== 'loading', null, {timeout: 240000});
  await idle(3000);
  out.tabs = await p.evaluate(() => TABS.map(t => t[0]));
  out.first = await p.evaluate(() => ({tab: state.tab, text: (document.querySelector('#pane-' + state.tab) || {}).innerText, head: (document.querySelector('header.top') || {}).innerText, foot: (document.getElementById('foot') || {}).innerText}));
  for (const k of out.tabs) {
    try { await p.evaluate(k => go(k), k); await idle(1500); const r = await p.evaluate(k => { const el = document.getElementById('pane-' + k); if (!el) return [null, null]; const c = el.cloneNode(true); c.querySelectorAll('style,script').forEach(x => x.remove()); return [el.innerText, c.textContent.replace(/\s+/g, ' ')]; }, k); out.panes[k] = r[0]; (out.full = out.full || {})[k] = r[1]; }
    catch (e) { out.panes[k] = 'ERR ' + String(e.message).slice(0, 200); }
  }
  out.errors = s.errors; out.counts = s.counts;
  fs.writeFileSync(process.env.OUT, JSON.stringify(out)); console.log('ok', Object.keys(out.panes).length, 'errors', s.errors.length); await s.browser.close();
})();
