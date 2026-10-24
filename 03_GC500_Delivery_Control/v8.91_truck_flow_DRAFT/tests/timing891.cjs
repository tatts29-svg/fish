// Author: Andrew Fisher. v8.91 — the Timeline day view's render time, before and after, measured the same way on both pages:
// the busiest coming day, the page left to settle, then 15 renders (median and best), plus the cost of the truck-flow model alone.
// Run on a quiet machine, one page at a time:  PAGE=<page> [LABEL=base|v8.91] [OUT=dir] node v8.91_truck_flow_DRAFT/tests/timing891.cjs
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#timeline', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof dpLoads === 'function', null, {timeout: 150000}); await p.waitForTimeout(8000);
  const T = await p.evaluate(() => { const t0 = todayIso(); const days = programmeDays().filter(d => d.iso >= t0).map(d => ({iso: d.iso, n: dpLoads(d).length})).sort((a, b) => b.n - a.n); const iso = days[0].iso;
    state.day = iso; state.tlView = 'day'; go('timeline'); render(); render(); const t = []; for (let k = 0; k < 15; k++) { const a = performance.now(); render(); t.push(Math.round(performance.now() - a)); }
    const sorted = t.slice().sort((a, b) => a - b), d = programmeDays().find(x => x.iso === iso); let flow = null; if (typeof flow891Build === 'function') { const f = []; for (let k = 0; k < 10; k++) { const a = performance.now(); flow891Build(d); f.push(performance.now() - a); } flow = Math.round(f.sort((a, b) => a - b)[5] * 10) / 10; }
    const a2 = performance.now(); for (let k = 0; k < 20; k++) dpLoads(d); const dpl = Math.round((performance.now() - a2) / 20 * 100) / 100;
    return {iso, loads: days[0].n, runs: t, median: sorted[7], best: sorted[0], flow891BuildMs: flow, dpLoadsMs: dpl, lines: document.querySelectorAll('#pane-timeline .ld').length}; });
  const label = process.env.LABEL || (T.flow891BuildMs == null ? 'base' : 'v8.91'); console.log('TIMING ' + label + ' ' + JSON.stringify(T));
  if (process.env.OUT) { fs.mkdirSync(process.env.OUT, {recursive: true}); fs.writeFileSync(path.join(process.env.OUT, 'timing891_' + label + '.json'), JSON.stringify(Object.assign({label}, T))); }
  console.log('errors ' + s.errors.length + ' blocked ' + s.counts.blocked); await s.browser.close(); process.exit(s.errors.length || s.counts.blocked ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); });
