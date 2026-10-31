// Author: Andrew Fisher. Read-only: the dated pieces behind each P&L cost stream, to split the job's costs by month and branch.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267'), null, {timeout: 60000});
    const r = await p.evaluate(() => holdAssets(() => {
      const r2 = n => Math.round(n * 100) / 100, today = todayIso(), out = {};
      // labour hire: every priced shift by date (race crew out, as the P&L does)
      const RC = typeof RaceCrew1227 !== 'undefined' ? RaceCrew1227 : null;
      out.labour = fin745Rows(today).filter(x => !(RC && RC.isCrew(x)) && x.type !== 'cna' && x.type !== 'salary').map(x => ({d: x.date, c: x.status === 'confirmed' && x.actualCost != null ? x.actualCost : x.calculatedCost}));
      // accommodation, meals, misc: their own dated rows
      out.exp = ourCosts().filter(c => ['accommodation', 'meals', 'misc'].includes(c.kind)).map(c => { let v = null; try { v = typeof ourCostOf === 'function' ? ourCostOf(c) : null; } catch (e) {} return {k: c.kind, d: c.date, amount: c.amount != null ? c.amount : (c.cost != null ? c.cost : null), v: v && typeof v === 'object' ? (v.amount ?? v.cost ?? v.total ?? null) : v, person: !!c.person, nights: c.nights || null, keys: Object.keys(c).slice(0, 18)}; });
      // transport: every load the model counts, with its date, branch and the figure it counts
      const T = transport888Core();
      const tl = (T.rows || []).concat(T.planned || []).map(l => ({d: l.date, b: l.branch || (l.t && l.t.branch) || null, key: l.key, inPl: l.inPl, counted: l.counted, actual: l.actual, f: l.forecast && l.forecast.amount, planned: !!(l.forecast && l.forecast.planned953)}));
      out.transport = tl; out.transportWeights = T.weights;
      // fencing: the model's weeks, and what the fencing model exposes
      const X = cj764Model(); out.fencingWeeks = X.fencing && X.fencing.weeks; out.fencingKeys = X.fencing ? Object.keys(X.fencing) : null;
      return out;
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/dated_costs.json', JSON.stringify(r));
    console.log('labour', r.labour.length, 'exp', r.exp.length, 'transport', r.transport.length);
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
