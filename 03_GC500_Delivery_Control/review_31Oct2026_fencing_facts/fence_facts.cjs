// Author: Andrew Fisher. Read-only: every fencing docket, labour note and extra as the record holds them, which receipted order covers each, and the supplier sheets.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267'), null, {timeout: 60000});
    const r = await p.evaluate(() => holdAssets(() => {
      const wkey = s => { s = String(s || '').toUpperCase(); if (!s) return ''; if (/DECON|DEMOB/.test(s)) return 'D' + s.replace(/\D/g, ''); if (/EVENT/.test(s)) return 'E'; return s.replace(/\D/g, ''); };
      const orders = poAll().filter(poFencing866).map(o => ({number: String(o.number), amount: o.amount, receipted: o.receipted, invoice_no: o.invoice_no, period: o.period, sheets: poWeeksOf(o).map(x => x.sheet), keys: poWeeksOf(o).map(x => wkey(x.sheet))}));
      const orderFor = x => { const k = wkey(x.programme_sheet) || wkey(x.week); const o = orders.find(o => o.keys.includes(k)); return o ? o.number : null; };
      const pick = (o, ks) => { const r = {}; ks.forEach(k => { if (o[k] !== undefined) r[k] = o[k]; }); return r; };
      const u = allDockets();
      const keys0 = u[0] ? Object.keys(u[0]) : [];
      const dockets = u.map(d => Object.assign(pick(d, ['key', 'no', 'docket_no', 'number', 'date', 'week', 'programme_sheet', 'location', 'area', 'usable', 'paid_total', 'cost_total', 'cost_state', 'supplier_pricing_basis', 'invoiced1219', 'paper_cost1219', 'signed', 'status', 'kind', 'po', 'supplier']),
        {order: orderFor(d), lines: (d.lines || []).map(l => pick(l, ['column', 'name', 'unit', 'qty', 'rate', 'cost', 'paid_rate', 'paid'])),
         paper: (d.paper_lines1219 || []).map(l => pick(l, ['column', 'name', 'qty', 'paid'])), supplier_lines: (d.supplier_lines || []).map(l => pick(l, ['column', 'name', 'qty', 'rate', 'paid', 'total']))}));
      const notes = (typeof supplierBaseNotes1014 === 'function' ? supplierBaseNotes1014() : []).map(n => Object.assign(pick(n, ['key', 'no', 'note_no', 'number', 'date', 'week', 'programme_sheet', 'hours', 'labour_hours', 'cost', 'usable', 'kind', 'words', 'reference']), {order: orderFor(n), lines: (n.supplier_lines || []).map(l => pick(l, ['column', 'name', 'qty', 'rate', 'paid']))}));
      const svc = (typeof serviceNoteRows === 'function' ? serviceNoteRows() : []).map(n => Object.assign(pick(n, ['key', 'no', 'note_no', 'number', 'date', 'week', 'programme_sheet', 'labour_hours', 'cost', 'usable', 'kind', 'location', 'words']),
        {order: orderFor(n), crew: !!(EventCrew1237.status(n) || {}).customerScopeConfirmed, lines: (n.supplier_lines || []).map(l => pick(l, ['column', 'name', 'qty', 'rate', 'paid']))}));
      const extras = (typeof supplierExtras1014 === 'function' ? supplierExtras1014() : []).map(x => pick(x, ['key', 'column', 'name', 'unit', 'qty', 'rate', 'paid_rate', 'paid', 'po', 'date', 'week', 'reference', 'note']));
      const SP = supplierPricing1014(); const sheets = (SP.orders || []).map(o => pick(o, ['number', 'valid', 'total', 'difference', 'amount', 'dockets', 'notes', 'lines', 'words', 'week', 'sheet']));
      const RC = (() => { try { return RaceCrew1227.model(todayIso()); } catch (e) { return {err: e.message}; } })();
      const rc = {rate: RC.rate, quote: RC.quote, recordedHours: RC.recordedHours, recordedCost: RC.recordedCost, charge: RC.charge,
        days: (RC.recordedDays || []).map(d => ({id: d.id, date: d.date, note_no: d.note_no, hours: d.hours, rate: d.rate, amount: d.amount, approved: d.approved, scope: !!d.customerScopeConfirmed}))};
      const F = fh866Model(); const stream = (F.costs || []).filter(c => c.kind === 'fencing').map(c => pick(c, ['stream', 'toDate', 'toCome', 'job', 'by', 'pos', 'words', 'parts', 'detail']));
      const M = moneySummary(); const rcCost = M.cost && M.cost.race_crew1227;
      const SPL = fencePaidSplit();
      return {keys0, orders, dockets, notes, svc, extras, sheets, sheetKeys: SP.orders && SP.orders[0] ? Object.keys(SP.orders[0]) : [], rc, stream, rcCost, split: SPL};
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/fence_facts.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
