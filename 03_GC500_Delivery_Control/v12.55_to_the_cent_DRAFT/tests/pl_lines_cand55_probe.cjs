// read-only: every contract line the page carries, priced by the page's own rule (contractCharge), for reconciliation to Baseplan (10)
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const h = await open({pageFile: '/home/user/fish/03_GC500_Delivery_Control/build/GC500_v12.55/GC500_Delivery_Control_hosted.html', hash: '#costs', W: 1440, H: 1000});
  const p = h.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(3000);
  const R = await p.evaluate(() => {
    const R = {supplied_on: (typeof ONHIRE !== 'undefined' && ONHIRE && ONHIRE.supplied_on) || null, rows: []};
    (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []).forEach(r => {
      let c = null; try { c = contractCharge(r); } catch (e) { c = {err: String(e)}; }
      R.rows.push({contract: String(r.rental_contract), line: r.line, item: r.item, description: r.description, quantity: r.quantity, rate_1: r.rate_1, price: r.price, start: r.start_date || null, booked_delivery: r.booked_delivery_date || null, term: r.term_date || null, expected_term: r.expected_term_date || null, booked_pickup: r.booked_pickup_date || null, min_days: r.minimum_days, sales: r.sales_analysis_code, branch: r.branch_code, kind: r.kind, charge_line: !!r.charge_line, subhired: !!r.subhired, supplier: r.supplier_sub_rental || null, status: r.status || null, prebill: r.prebill_amount != null ? r.prebill_amount : (r.prebill != null ? r.prebill : null), match: r.match ? {to: r.match.to, key: r.match.key} : null, amount: c && c.amount, how: c && c.how, treatment: c && c.treatment || null, days: c && c.days, basis: c && String(c.basis || '').slice(0, 160), err: c && c.err || null});
    });
    try { const m = moneySummary(); R.charge = {contracts: m.charge.contracts, contracts_lines: m.charge.contracts_lines, contracts_all: m.charge.contracts_all, unknown: m.charge.contracts_unknown, delivery: m.charge.delivery, total: m.charge.total}; } catch (e) {}
    R.rowKeys = Object.keys((typeof ONHIRE_ROWS !== 'undefined' && ONHIRE_ROWS[0]) || {});
    return R;
  });
  R.pageErrors = h.errors.length;
  fs.writeFileSync('/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/pl_lines_cand55.json', JSON.stringify(R, null, 1));
  console.log('rows', R.rows.length, 'supplied', R.supplied_on, 'charge', JSON.stringify(R.charge), 'errors', R.pageErrors);
  await h.browser.close();
})();
