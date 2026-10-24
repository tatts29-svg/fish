'use strict';
// Read-only probe of the live page: the fencing card columns, the event week's programme lines against the dockets, the
// event-week dockets and notes as the page holds them, and the purchase orders. GET only; every write is aborted by the harness.
const fs = require('fs');
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => {
 const h = await open({hash: '#fencing', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000});
  await p.waitForTimeout(5000);
  const r = await p.evaluate(() => {
   const out = {errors: []};
   const t = (k, f) => { try { out[k] = f(); } catch (e) { out.errors.push(k + ': ' + String(e && e.message || e).slice(0, 200)); } };
   const wkey = s => { s = String(s || '').toUpperCase(); if (!s) return ''; if (/DECON|DEMOB/.test(s)) return 'D' + s.replace(/\D/g, ''); if (/EVENT/.test(s)) return 'E'; return s.replace(/\D/g, ''); };
   t('version', () => (typeof RECORD_VERSION !== 'undefined' ? RECORD_VERSION : (S && S.version)) || null);
   t('cols', () => FCOL.map(c => ({key: c.key, name: c.name_as_written, unit: c.unit, programme_type: c.programme_type, rate: c.rate, rate_source: c.rate_source, settled_said: c.settled_said, card_line: c.card_line, card_state: c.card_state, cost_rate: c.cost_rate, cost_unit: c.cost_unit, cost_basis: c.cost_basis, typed: (S.fenceCosts || {})[c.key] || null})));
   t('fenceTypes', () => Object.entries(typeof fenceTypes !== 'undefined' ? fenceTypes : {}));
   t('docketsE', () => allDockets().filter(d => (wkey(d.programme_sheet) || wkey(d.week)) === 'E' || (d.date >= '2026-10-19' && d.date <= '2026-10-26')).map(d => ({id: d.id, no: d.docket_no, date: d.date, week: d.week, ps: d.programme_sheet, loc: d.location, q: d.quantities, comp: d.components, usable: d.usable, charged: d.cost_total, paid: d.paid_total, basis: d.supplier_pricing_basis || null, po: d.supplier_po || null, rt: d.record_type || null, lines: (d.lines || d.cost_lines || null)})));
   t('notesE', () => serviceNoteRows().filter(n => n.date >= '2026-10-19').map(n => ({id: n.id, no: n.note_no, date: n.date, week: n.week, loc: n.location, h: n.labour_hours, m: n.metres, cost: n.cost, usable: n.usable})));
   t('collsE', () => (S.fenceCollections || []).filter(c => c.date >= '2026-10-19').map(c => ({id: c.id, no: c.collection_no, date: c.date, week: c.week, loc: c.location, collected: c.collected})));
   t('byWeek', () => fenceByWeek(allDockets()).map(w => ({week: w.week, prog: w.progSheet, start: w.start, end: w.end, rolled: w.rolled, dockets: w.dockets, cost: w.cost, lines: (w.lines || []).map(l => ({name: l.name, unit: l.unit, planned: l.planned != null ? l.planned : l.q, done: l.done != null ? l.done : l.docketed, remaining: l.remaining, rev: l.rev, cost: l.cost}))})));
   t('orders', () => (typeof fenceOrders1159 === 'function' ? fenceOrders1159() : null));
   t('pos', () => Object.values(S.purchaseOrders || S.pos || {}).filter(o => o && /46475|46570|46588|46605|46617/.test(String(o.number || o.po || ''))).map(o => ({number: o.number || o.po, amount: o.amount, period: o.period, sheet: o.programme_sheet, confirmed: o.confirmed, receipted: o.receipted, receipted_amount: o.receipted_amount, invoice_no: o.invoice_no, has_pricing: !!o.supplier_pricing})));
   t('derived', () => { const f = fenceDerived(); return {cost: f.cost, sheet_cost: f.sheet_cost, revenue: f.revenue, toCome: f.to_come || f.toCome, keys: Object.keys(f)}; });
   t('split', () => fencePaidSplit());
   t('weekKeys', () => [...new Set(allDockets().map(d => (d.programme_sheet || '') + '|' + (d.week || '')))]);
   return out;
  });
  fs.writeFileSync(process.env.OUT, JSON.stringify(r, null, 1));
  console.log('version', r.version, 'errors', JSON.stringify(r.errors), 'pageErrors', JSON.stringify(h.errors), 'counts', JSON.stringify(h.counts));
  console.log('cols', (r.cols || []).length, 'docketsE', (r.docketsE || []).length, 'notesE', (r.notesE || []).length, 'collsE', (r.collsE || []).length);
 } finally { await h.browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
