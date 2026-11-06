// Author: Andrew Fisher. Read-only: every transport load the P&L counts (recorded and planned), with its date, branch, what it
// carries, the figure it counts (recorded, else forecast) and the delivery docket numbers on it. Used by the P&L pack (v1.9) for
// transport by branch (a load with no branch goes by what it carries) and to tie forecast loads to a hire contract by their docket.
//   PAGE=<page.html> OUT=<file.json> flock -x /tmp/gc500-browser.lock node transport_loads.cjs
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    const r = await p.evaluate(() => holdAssets(() => {
      const T = transport888Core(), brOf = l => l.branch || (l.t && l.t.branch) || null;
      const one = (l, planned) => ({key: l.key || null, d: l.date || null, b: brOf(l), src: l.src || null, item: l.item || null,
        discipline: l.discipline || null, movement: l.movement || null, location: l.location || null,
        actual: l.actual || null, f: (l.forecast && l.forecast.amount) || null, fkind: (l.forecast && l.forecast.kind) || null, planned: !!planned,
        dd: String([l.dd, l.dockets, l.t && l.t.dd].filter(Boolean).map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')).slice(0, 400)});
      return {weights: T.weights, loads: (T.rows || []).map(l => one(l, false)).concat((T.planned || []).map(l => one(l, true)))};
    }));
    require('fs').writeFileSync(process.env.OUT || '/tmp/gc500-scratch/progress12685/transport_loads.json', JSON.stringify(r));
    console.log('loads', r.loads.length);
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
