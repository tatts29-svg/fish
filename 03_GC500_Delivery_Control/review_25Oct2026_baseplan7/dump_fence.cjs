// Author: Andrew Fisher. 25 Oct 2026 - the fencing the P&L charges, by category: the signed dockets' quantities and the
// 2026 card rate each one is charged at, as the live page computes them. Read only (the harness aborts every write).
//   PAGE=<live page file> OUT=<private json> node dump_fence.cjs
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
      const u = allDockets().filter(d => d.usable), q = {}, amt = {};
      u.forEach(d => { Object.entries(d.quantities || {}).forEach(([k, v]) => { const n = Number(v); if (Number.isFinite(n) && n) q[k] = Math.round(((q[k] || 0) + n) * 100) / 100; });
        (d.lines || d.cost_lines || []).forEach(l => { if (l && l.column && typeof l.amount === 'number') amt[l.column] = Math.round(((amt[l.column] || 0) + l.amount) * 100) / 100; }); });
      const rates = {}; Object.keys(q).forEach(k => { try { const r = fenceRateFor(k); rates[k] = r ? {value: r.value, unit: r.unit || r.per || null, label: r.label || r.name || null} : null; } catch (e) { rates[k] = null; } });
      const fd = fenceDerived();
      let rest = null; try { const X = cj764Model(); rest = X.fencing || null; } catch (e) {}
      return {dockets: u.length, charged: fd.charged, cost: fd.cost, quantities: q, amounts: amt, rates, rest, sample: u.slice(0, 1).map(d => Object.keys(d))};
    });
    fs.writeFileSync(process.env.OUT, JSON.stringify(out));
    console.log(JSON.stringify({dockets: out.dockets, charged: out.charged, keys: Object.keys(out.quantities).length, errors: s.errors.length, blocked: s.counts.blocked}));
  } catch (e) { console.log('ERR', String(e).slice(0, 400)); }
  await s.browser.close();
})();
