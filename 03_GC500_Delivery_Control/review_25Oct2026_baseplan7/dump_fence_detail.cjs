// Author: Andrew Fisher. 25 Oct 2026 - the fencing behind the P&L, docket by docket (date, week, quantities) and the 2026
// programme by week, to see where Baseplan's 9990776 quantities come from. Read only (the harness aborts every write).
//   PAGE=<live page file> OUT=<private json> node dump_fence_detail.cjs
'use strict';
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#fencing', W: 1440, H: 1000});
  const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const out = await p.evaluate(() => {
      const dockets = allDockets().map(d => ({no: d.docket_no, date: d.date, week: d.week, usable: d.usable, origin: d.origin, recorded_on: d.recorded_on, scope: d.scope, quantities: d.quantities, cost_total: d.cost_total}));
      let weeks = null; try { const X = cj764Model(); weeks = X.fencing && X.fencing.weeks; } catch (e) { weeks = String(e).slice(0, 100); }
      const keys = Object.keys(DATA).filter(k => /fenc|programme|prog/i.test(k));
      return {dockets, weeks, keys};
    });
    fs.writeFileSync(process.env.OUT, JSON.stringify(out));
    console.log(JSON.stringify({dockets: out.dockets.length, weeks: Array.isArray(out.weeks) ? out.weeks.length : out.weeks, keys: out.keys, errors: s.errors.length, blocked: s.counts.blocked}));
  } catch (e) { console.log('ERR', String(e).slice(0, 400)); }
  await s.browser.close();
})();
