// Author: Andrew Fisher. v8.91 — the cost of the truck-flow code itself, measured in ONE browser session on the candidate page:
// the Timeline day view (busiest coming day) is rendered with the v8.91 wrappers on, then with them put back to the page's own
// functions, alternating six times, so the machine's own noise falls on both sides alike. Reports the medians of each side.
//   PAGE=<candidate> [OUT=dir] node v8.91_truck_flow_DRAFT/tests/timing_ab891.cjs
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#timeline', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof flow891Build === 'function', null, {timeout: 150000}); await p.waitForTimeout(8000);
  const T = await p.evaluate(() => { const t0 = todayIso(); const days = programmeDays().filter(d => d.iso >= t0).map(d => ({iso: d.iso, n: dpLoads(d).length})).sort((a, b) => b.n - a.n); const iso = days[0].iso;
    state.day = iso; state.tlView = 'day'; go('timeline'); render(); render();
    const on = {dpLoads, ldLine, dayPanels, dpPage, save}, off = {dpLoads: dpLoadsBefore891, ldLine: ldLineBefore891, dayPanels: dayPanelsBefore891, dpPage: dpPageBefore891, save: saveBefore891};
    const med = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
    const run = () => { const t = []; for (let k = 0; k < 7; k++) { const a = performance.now(); render(); t.push(performance.now() - a); } return Math.round(med(t)); };
    const A = [], B = [];
    for (let k = 0; k < 6; k++) { Object.assign(window, on); A.push(run()); Object.assign(window, off); B.push(run()); }
    Object.assign(window, on); render();
    return {iso, loads: days[0].n, withFlow: A, without: B, medianWith: med(A), medianWithout: med(B), lines: document.querySelectorAll('#pane-timeline .ld').length, cardPresent: !!document.querySelector('.flow891')}; });
  console.log('TIMING A/B ' + JSON.stringify(T)); if (process.env.OUT) { fs.mkdirSync(process.env.OUT, {recursive: true}); fs.writeFileSync(path.join(process.env.OUT, 'timing_ab891.json'), JSON.stringify(T)); }
  console.log('errors ' + s.errors.length + ' blocked ' + s.counts.blocked); await s.browser.close(); process.exit(s.errors.length || s.counts.blocked ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); });
