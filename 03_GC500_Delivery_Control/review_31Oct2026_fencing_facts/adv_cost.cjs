// Author: Andrew Fisher. Read-only: what Advanced has invoiced us (orders, receipts), what their dockets come to at their rates by week, and the race crew forecast.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267'), null, {timeout: 60000});
    const r = await p.evaluate(() => holdAssets(() => {
      const fd = fenceDerived(), out = {};
      out.fd = {dockets: fd.dockets, cost: fd.cost, charged: fd.charged, sheet_cost: fd.sheet_cost, supplier_extras_total: fd.supplier_extras_total,
        receipted: fd.receipted_orders1159, outside: fd.outside_orders1218, invoicedExtras: fd.invoiced_extras1219};
      out.pos = poAll().filter(o => /advanced/i.test(o.supplier_name || '') || o.stream === 'fencing').map(o => ({number: o.number, amount: o.amount, period: o.period, invoice_no: o.invoice_no, receipted: o.receipted, receipted_amount: o.receipted_amount, confirmed: o.confirmed, note: o.note}));
      try { const RC = RaceCrew1227.model(todayIso()); out.raceCrew = JSON.parse(JSON.stringify(RC, (k, v) => Array.isArray(v) && v.length > 20 ? v.slice(0, 20) : v)); } catch (e) { out.raceCrewErr = e.message; }
      const F = fh866Model(); out.fenceStream = (F.costs || []).filter(c => c.kind === 'fencing').map(c => JSON.parse(JSON.stringify(c, (k, v) => Array.isArray(v) && v.length > 30 ? v.slice(0, 30) : v)));
      const u = allDockets().filter(d => d.usable); out.sumPaidTotal = u.reduce((a, d) => a + (d.paid_total || 0), 0); out.sumPaper = u.reduce((a, d) => a + (d.paper_cost1219 || 0), 0); out.nInvoiced = u.filter(d => d.invoiced1219).length;
      out.byWeekPaid = {}; u.forEach(d => { const w = d.week || '?'; out.byWeekPaid[w] = out.byWeekPaid[w] || {paid: 0, paper: 0, invoiced: 0, n: 0}; out.byWeekPaid[w].paid += d.paid_total || 0; out.byWeekPaid[w].paper += d.paper_cost1219 || 0; out.byWeekPaid[w].invoiced += d.invoiced1219 ? 1 : 0; out.byWeekPaid[w].n++; });
      return out;
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/adv_cost.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
