// Author: Andrew Fisher. 25 Oct 2026 - every fencing purchase order against the record: Advanced's approved sheet for it, the
// page's own invoice state, and the red-book dockets and labour notes that are on none of their sheets. Read only (the
// harness aborts every write).
//   PAGE=<live page file> OUT=<private json> node dump_fence_invoices.cjs
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
      const flat = o => { const r = {}; for (const k of Object.keys(o || {})) { const v = o[k]; if (v == null || ['number', 'string', 'boolean'].includes(typeof v)) r[k] = v; } return r; };
      const SP = supplierPricing1014();
      const pos = poAll().map(o => {
        const sp = SP.orders.find(x => String(x.number) === String(o.number)) || null;
        let st = null; try { st = invoiceState1158(o, poWeeksOf(o)); } catch (e) { st = {words: 'err ' + String(e).slice(0, 80)}; }
        let weeks = []; try { weeks = (poWeeksOf(o) || []).map(w => w.sheet); } catch (e) {}
        return {po: flat(o), weeks, state: st && {state: st.state, words: st.words, n: st.n, est: st.est},
          sheet: sp && {valid: sp.valid, total: sp.total, red: sp.red, green: sp.green, extras: sp.extrasTotal, difference: sp.difference, errors: sp.errors,
            records: (sp.records || []).map(r => ({book: r.book, number: r.number, date: r.date, amount: r.amount, lines: (r.lines || []).length})), extrasN: (sp.extras || []).length,
            source: sp.source ? flat(sp.source) : null}};
      });
      const issues = SP.issues;
      // our dockets and notes in each order's weeks with no supplier record
      const recs = SP.records;
      const red = allDockets().filter(d => d.usable).map(d => ({id: d.id, no: d.docket_no, date: d.date, week: d.week, paid: d.paid_total, charge: d.cost_total, onSheet: recs.has(SupplierPo1014.key('red', d.id)), po: d.supplier_po || null}));
      const green = serviceNoteRows().filter(n => n.usable !== false).map(n => ({id: n.id, no: n.note_no, date: n.date, cost: n.cost, onSheet: recs.has(SupplierPo1014.key('green', n.id)), po: n.supplier_po || null}));
      return {pos, issues, red, green};
    });
    fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
    console.log('ok errors', s.errors.length, 'blocked', s.counts.blocked);
  } catch (e) { console.log('ERR', String(e).slice(0, 400)); }
  await s.browser.close();
})();
