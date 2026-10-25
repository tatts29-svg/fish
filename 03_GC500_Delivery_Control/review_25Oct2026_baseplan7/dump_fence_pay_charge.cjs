// Author: Andrew Fisher. 25 Oct 2026 - the fencing behind the P&L's $405,150.96, both sides, from the page's own pricing:
// each red-book docket line at what Coates charges (fenceRateFor) and at what Advanced bill (fenceCostFor), the green
// book (labour notes, a cost only) and the purchase orders. Read only (the harness aborts every write).
//   PAGE=<live page file> OUT=<private json> node dump_fence_pay_charge.cjs
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
      const pick = (o, ks) => { const r = {}; ks.forEach(k => { r[k] = o == null ? null : o[k] === undefined ? null : o[k]; }); return r; };
      const columns = FCOL.map(c => Object.assign(pick(c, ['key', 'name_as_written', 'unit', 'rate', 'rate_source', 'card_line', 'card_state', 'cost_rate', 'cost_unit', 'cost_basis', 'settled_by', 'settled_on']),
        {charge: pick(fenceRateFor(c.key), ['value', 'source', 'by', 'at']), pay: pick(fenceCostFor(c.key), ['value', 'source', 'hourly', 'by', 'at'])}));
      const dockets = allDockets().map(d => ({no: d.docket_no, id: d.id, date: d.date, week: d.week, usable: d.usable !== false, origin: d.origin, book: d.book || 'red',
        location: d.location || null, cost_total: d.cost_total, paid_total: d.paid_total, margin: d.margin, unpriced: d.unpriced, paid_unpriced: d.paid_unpriced,
        lines: (d.lines || []).map(l => pick(l, ['column', 'qty', 'rate', 'rate_source', 'cost', 'paid_rate', 'paid_rate_source', 'paid', 'margin'])),
        /* where a purchase order carries Advanced's approved pricing for this docket, the page pays it at that, not the tracker */
        supplier: d.supplier_pricing_basis ? {basis: d.supplier_pricing_basis, po: d.supplier_po || null, branch: d.supplier_branch || null, lines: (d.supplier_lines || []).map(l => Object.assign({}, l))} : null}));
      let green = null, notes = [];
      try { green = greenBookTotals(); notes = serviceNoteRows().map(n => pick(n, ['note_no', 'date', 'labour_hours', 'cost', 'cost_rate', 'usable'])); } catch (e) { green = {error: String(e).slice(0, 120)}; }
      let derived = null, extras = [];
      try { const f = fenceDerived(); derived = {}; for (const k of Object.keys(f)) if (f[k] == null || ['number', 'string', 'boolean'].includes(typeof f[k])) derived[k] = f[k]; } catch (e) { derived = {error: String(e).slice(0, 120)}; }
      try { extras = supplierExtras1014().map(x => Object.assign({}, x)); } catch (e) { extras = [{error: String(e).slice(0, 120)}]; }
      try { notes = serviceNoteRows().map(n => Object.assign(pick(n, ['note_no', 'date', 'labour_hours', 'cost', 'cost_rate', 'cost_rate_source', 'usable', 'supplier_po']), {supplier_lines: (n.supplier_lines || []).map(l => Object.assign({}, l))})); } catch (e) {}
      let pos = [];
      try { pos = poAll().map(o => pick(o, ['number', 'period', 'programme_sheet', 'amount', 'invoice_no', 'confirmed', 'supplier_name', 'kind'])); } catch (e) { pos = [{error: String(e).slice(0, 120)}]; }
      return {version: SYNC.version || null, columns, dockets, green, notes, pos, derived, extras, contractor: (DATA.fence_contractor || {}).name || null};
    });
    fs.writeFileSync(process.env.OUT, JSON.stringify(out));
    const use = out.dockets.filter(d => d.usable);
    const sum = k => Math.round(use.reduce((n, d) => n + (d[k] || 0), 0) * 100) / 100;
    console.log(JSON.stringify({dockets: out.dockets.length, usable: use.length, charged: sum('cost_total'), paid: sum('paid_total'), green: out.green, derived: out.derived, extras: out.extras.length, pos: out.pos.length, errors: s.errors.length, blocked: s.counts.blocked}));
  } catch (e) { console.log('ERR', String(e).slice(0, 400)); }
  await s.browser.close();
})();
