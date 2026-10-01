/* Author: Andrew Fisher. v7.62: evidence-qualified Finance review, not ledger instructions.
 * No shared record is written. A source amount, invoice and payment are different facts.
 */
function acc762Round(n){ return Math.round((Number(n) || 0) * 100) / 100; }
function acc762Money(n){ return typeof n === 'number' && Number.isFinite(n) ? n : null; }
function acc762Date(v){
 const s = String(v || '');
 if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
 const d = new Date(s + 'T00:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : null;
}
function acc762StampDate(v){
 if (acc762Date(v)) return v;
 if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(String(v || ''))) return null;
 const n = Date.parse(v); return Number.isFinite(n) ? new Date(n + 36000000).toISOString().slice(0, 10) : null;
}
function acc762WorkDate(row){
 return acc762Date(row.work_date) || acc762Date(row.completed_on) || acc762Date(row.completed_date) || acc762Date(row.completion_date);
}
function acc762Status(date, month, asAt){ return (date && date > asAt) || month > asAt.slice(0, 7) ? 'forecast' : 'review'; }
function acc762Share(amount, from, to, month, asAt){
 if (!acc762Date(from) || !acc762Date(to) || to < from) return null;
 const span = daysInclusive(from, to), n = acc761DaysIn(from, to, month);
 if (!span || !n) return null;
 const futureFrom = from > asAt ? from : new Date(Date.parse(asAt + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
 const fn = futureFrom > to ? 0 : acc761DaysIn(futureFrom, to, month);
 return {amount: acc762Round(amount * n / span), days: n, span, forecastAmount: acc762Round(amount * fn / span)};
}
function acc762LabourReview(rows){
 const make = () => ({hours: 0, paid: 0, cost: 0, actualCost: 0, calculatedCost: 0, unpricedHours: 0, allocationNeededHours: 0, allocationUnknownHours: 0, allocatedHours: 0, rows: 0});
 const out = {confirmed: make(), pending: make(), forecast: make(), people: []}, people = {};
 rows.forEach(r => {
  const status = r.status === 'confirmed' ? 'confirmed' : r.status === 'forecast' ? 'forecast' : 'pending';
  const paid = acc762Money(r.paid), hours = acc762Money(r.worked);
  // A recorded actual cost only applies while the original source is still confirmed.
  const actual = status === 'confirmed' ? acc762Money(r.actualCost) : null;
  const calculated = acc762Money(r.calculatedCost), cost = actual != null ? actual : calculated;
  const personKey = String(r.person || 'Unnamed') + '|' + String(r.type || 'unknown');
  const p = people[personKey] = people[personKey] || {person: r.person || 'Unnamed', type: r.type || 'unknown', confirmed: make(), pending: make(), forecast: make(), shifts: []};
  [out[status], p[status]].forEach(g => {
   g.rows++; g.hours += hours || 0; g.paid += paid || 0;
   if (cost == null) g.unpricedHours += paid || 0; else g.cost += cost;
   if (actual != null) g.actualCost += actual; else if (calculated != null) g.calculatedCost += calculated;
   if (status === 'confirmed' && r.allocation === 'needed') g.allocationNeededHours += paid || 0;
   else if (status === 'confirmed' && r.allocation === 'allocated') g.allocatedHours += paid || 0;
   else if (status !== 'forecast') g.allocationUnknownHours += paid || 0;
  });
  p.shifts.push({id: r.id, date: r.date, status, hours, paid, cost, costBasis: actual != null ? 'verified actual' : calculated != null ? 'calculated estimate' : 'unpriced', allocation: r.allocation || 'unverified', evidence: r.evidence || ''});
 });
 out.people = Object.values(people).sort((a, b) => a.person.localeCompare(b.person));
 const finish = g => Object.keys(g).forEach(k => { g[k] = acc762Round(g[k]); });
 ['confirmed', 'pending', 'forecast'].forEach(k => { finish(out[k]); out.people.forEach(p => finish(p[k])); });
 return out;
}
function acc761Model(month){
 const asAt = todayIso(), inM = d => !!acc762Date(d) && d.slice(0, 7) === month;
 const M = moneySummary(), c = M.charge || {}, ev = eventWindow(), evMonth = ev && ev.from ? ev.from.slice(0, 7) : null;
 const live = allAssets().filter(a => !a._cancelled && !a.rest_of);
 const out = {month, label: fin745MonthLabel(month), asAt, revenue: [], costs: [], wip: [], notes: [], decisions: 0,
  unallocatedRevenue: [], unallocatedCosts: [], invoiceRecords: [], revenueTotal: 0, costAccrue: null, costDecide: 0,
  costCandidateTotal: 0, forecastCostTotal: 0, forecastRevenueTotal: 0, invoiced: 0, invoiceSnapshotTotal: 0,
  basis: 'Source amounts and forecasts for Finance review. Earned, unbilled, unpaid and journal amounts are not established by this schedule.'};
 const revGroups = new Map(), costGroups = new Map(), unallocatedRevGroups = new Map();
 const add = (groups, target, stream, branch, amount, basis, extra) => {
  const value = acc762Money(amount), e = Object.assign({status: 'review', invoiceStatus: 'unknown', paymentStatus: 'unknown'}, extra || {});
  const key = stream + '|' + branch + '|' + e.status;
  let row = groups.get(key);
  if (!row) {
   row = {stream, branch, amount: 0, incurred: null, invoiced: null, accrue: null, action: 'check', basis: '', evidence: '', words: 'Finance to verify work period, rate and invoice/payment evidence before any journal.', extra: {status: e.status, sourceCount: 0, unpricedCount: 0, rawAmount: 0, forecastAmount: 0, sources: [], invoiceStatus: 'unknown', paymentStatus: 'unknown'}};
   groups.set(key, row); target.push(row);
  }
  if (value == null) row.extra.unpricedCount++; else { row.extra.rawAmount += value; row.amount = acc762Round(row.extra.rawAmount); }
  row.extra.sourceCount++; row.extra.forecastAmount = acc762Round(row.extra.forecastAmount + (e.forecastAmount || 0));
  row.extra.sources.push(Object.assign({amount: value, basis}, e));
  row.basis = row.evidence = row.extra.sources.map(s => s.basis).filter((s, i, a) => a.indexOf(s) === i).join('; ');
  return row;
 };
 const addRev = (s, b, a, why, e) => add(revGroups, out.revenue, s, b, a, why, e);
 const addCost = (s, b, a, why, e) => { const r = add(costGroups, out.costs, s, b, a, why, e); r.candidate = r.extra.unpricedCount && !r.amount ? null : r.amount; return r; };
 const unallocated = (target, stream, branch, amount, reason, extra) => {
  if (target !== out.unallocatedRevenue) return target.push({stream, branch, amount: acc762Money(amount), basis: reason, evidence: reason, action: 'check', words: 'Confirm the work month before allocating this amount.', extra: Object.assign({status: 'unallocated'}, extra || {})});
  // Keep source rate precision until the group total, as the page's P&L does.
  // Per-tick rounding would overstate the existing card-based total.
  const key = stream + '|' + branch + '|' + reason; let row = unallocatedRevGroups.get(key);
  if (!row) {
   row = {stream, branch, amount: null, basis: reason, evidence: reason, action: 'check', words: 'Confirm the work month before allocating this amount.', extra: {status: 'unallocated', rawAmount: 0, sourceCount: 0, unpricedCount: 0, sources: []}};
   unallocatedRevGroups.set(key, row); target.push(row);
  }
  const value = acc762Money(amount); row.extra.sourceCount++; row.extra.sources.push(Object.assign({amount: value}, extra || {}));
  if (value == null) row.extra.unpricedCount++; else { row.extra.rawAmount += value; row.amount = acc762Round(row.extra.rawAmount); }
 };

 // Contract export billing is a dated snapshot, never proof of today's unpaid balance.
 const contractRows = typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : [];
 out.baseplan = {n: contractRows.length, billed: contractRows.filter(r => Number(r.billed_amount) > 0).length,
  billedAmount: acc762Round(contractRows.reduce((s, r) => s + (Number(r.billed_amount) || 0), 0)),
  supplied_on: typeof ONHIRE !== 'undefined' && ONHIRE ? ONHIRE.supplied_on || null : null,
  scope: 'Contract export snapshot only; not a current unbilled balance or confirmation that all streams remain unbilled.'};
 contractRows.forEach(r => {
  const ch = contractCharge(r), amount = acc762Money(ch.amount); if (amount == null || !amount || ch.treatment) return;
  const br = r.branch_code || 'no branch', what = String(r.what || r.description || 'Contract line').replace(/\s+/g, ' ').trim();
  const extra = {source: 'contract export', description: what, rateBasis: ch.filled || 'contract', billedAmountSnapshot: acc762Money(r.billed_amount), lastBillDateSnapshot: r.last_bill_date || null};
  if (r.charge_line) {
   const pickup = /pick[ -]?up|collect|return|demob/i.test(what);
   const d = pickup ? (acc762Date(r.actual_return_date) || acc762Date(r.return_date) || acc762Date(r.term_date) || acc762Date(r.expected_term_date) || acc762Date(r.booked_pickup_date)) : (acc762Date(r.start_date) || acc762Date(r.booked_delivery_date));
   if (!d) return unallocated(out.unallocatedRevenue, 'Transport Revenue', br, amount, what + ': ' + (pickup ? 'pickup/return date missing' : 'delivery date missing'), extra);
   if (inM(d)) addRev('Transport Revenue — contract allocation', br, amount, what + ' · ' + (pickup ? 'pickup/return' : 'delivery') + ' date ' + d + ' · confirm work performed', Object.assign(extra, {date: d, status: acc762Status(d, month, asAt), forecastAmount: d > asAt ? amount : 0}));
   return;
  }
  if (ch.daily && ch.days) {
   const from = acc762Date(r.start_date) || acc762Date(r.booked_delivery_date), to = acc762Date(r.term_date) || acc762Date(r.expected_term_date) || acc762Date(r.booked_pickup_date);
   if (!from || !to || to < from) return unallocated(out.unallocatedRevenue, 'Daily hire — contract allocation', br, amount, what + ': valid hire dates missing', extra);
   const share = acc762Share(amount, from, to, month, asAt); if (!share) return;
   addRev((r.subhired ? 'Rehire' : 'Hire') + ' Revenue — daily contract allocation', br, share.amount, what + ' · ' + share.days + ' of ' + share.span + ' scheduled hire days · confirm actual delivery/return and rate', Object.assign(extra, {from, to, status: acc762Status(from, month, asAt), forecastAmount: share.forecastAmount}));
   return;
  }
  if (!evMonth) return unallocated(out.unallocatedRevenue, 'Event hire — contract allocation', br, amount, what + ': event dates missing', extra);
  if (evMonth === month) addRev(r.family === 'toilet' ? 'Toilet Rehire Revenue — event allocation' : r.subhired ? 'Rehire Revenue — event allocation' : 'Hire Revenue — event allocation', br, amount, what + ' · allocated to the event ' + ev.from + ' to ' + ev.to + '; confirm delivery and final charge', Object.assign(extra, {status: acc762Status(ev.from, month, asAt), forecastAmount: ev.to > asAt ? amount : 0}));
 });
 allCosts().filter(x => x.usable && x.from === 'record' && /fenc/i.test(String(x.category || ''))).forEach(x => {
  const branch = (costBranchOf(x) || {}).code || 'no branch', amount = acc762Money(x.amount), d = acc762Date(x.date);
  if (!d) return unallocated(out.unallocatedRevenue, 'Fencing Revenue — docket estimate', branch, amount, 'Docket work date missing', {id: x.id});
  if (inM(d)) addRev('Fencing Revenue — dated docket estimate', branch, amount, 'Dockets at customer rates; invoice status must be checked', {id: x.id, date: d, status: acc762Status(d, month, asAt), forecastAmount: d > asAt ? amount : 0});
 });

 // A tick's saved timestamp is its recording time, not a confirmed work date.
 // Keep undated amounts visible; never use the asset arrival date as a substitute.
 const kinds = {install: 'Labour Install', steps: 'Labour Install', levelling: 'Labour Install', demob: 'Labour Install', cleaning: 'Cleaning', fire_ext: 'Fire extinguishers'};
 live.forEach(a => (assetTotal(a).lines || []).forEach(line => {
  const lab = line.labour || {}, units = lab.perBuilding ? (lab.units || []) : [{ticked: lab.ticked || [], quantity: lab.qty}];
  units.forEach(unit => {
   const multiplier = lab.perBuilding ? ((typeof LAB_REST !== 'undefined' && unit.unit === LAB_REST && typeof labourRestN === 'function') ? labourRestN(a, line.item, (lab.units || []).map(u => u.unit)) : 1) : acc762Money(lab.qty);
   (unit.ticked || []).forEach(t => {
    const d = acc762WorkDate(t), recordedDate = acc762StampDate(t.at), rate = acc762Money(t.rate), amount = rate != null && multiplier != null ? rate * multiplier : null;
    const br = (branchOf(a.key) || {}).code || 'no branch', stream = (kinds[t.key] || t.name || 'Equipment service') + ' — recorded per-piece work';
    const extra = {ref: a.key, item: line.item, kind: t.key, unit: unit.unit || null, recordedDate, quantity: multiplier, rate, date: d};
    if (!d) return unallocated(out.unallocatedRevenue, stream, br, amount, 'Work is ticked, but no confirmed work date; recording timestamp is not a work date', extra);
    if (inM(d)) addRev(stream, br, amount, 'Per-piece card rate; explicit work date ' + d + '; customer billing not verified', Object.assign(extra, {status: acc762Status(d, month, asAt), forecastAmount: d > asAt ? amount : 0}));
   });
  });
 }));
 if (evMonth === month) {
  const status = acc762Status(ev.from, month, asAt), future = ev.to > asAt;
  const svc = acc762Money(servicing748Total());
  if (svc) addRev('Toilet servicing — event forecast', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', svc, 'Quoted quantities at card pump-out rates; actual services and invoices require confirmation', {status, forecastAmount: future ? svc : 0, source: 'Q6844'});
  if (c.race && acc762Money(c.race.amount) != null) addRev('Event scope — people, accommodation and travel', 'the job', c.race.amount, 'Provisional event scope; includes accommodation and travel; not confirmed worked hours or invoiced Revenue', {status, forecastAmount: future ? c.race.amount : 0, hours: c.race.hours, source: c.race.document || 'event scope'});
 }

 const supplier = typeof PO_SRC !== 'undefined' && PO_SRC.supplier ? PO_SRC.supplier : {};
 const sup = supplier.name || 'Advanced', supBr = typeof pl760FencingBranch === 'function' ? pl760FencingBranch() : 'STPS';
 allDockets().filter(d => d.usable).forEach(d => {
  const date = acc762Date(d.date), amount = acc762Money(d.paid_total);
  if (!date) return unallocated(out.unallocatedCosts, 'Fencing — supplier docket estimate', supBr, amount, 'Docket work date missing', {id: d.id});
  if (inM(date)) addCost('Fencing — supplier docket estimate', supBr, amount, 'Supplier rates on dockets; paid_total is a cost calculation, not proof of payment; match invoices before any accrual', {id: d.id, date, status: acc762Status(date, month, asAt), forecastAmount: date > asAt ? amount || 0 : 0});
 });
 const green = typeof serviceNoteRows === 'function' ? serviceNoteRows().filter(n => n.usable !== false) : [];
 green.forEach(n => {
  const date = acc762Date(n.date), amount = acc762Money(n.cost);
  if (!date) return unallocated(out.unallocatedCosts, 'Installation — external contractors, green book', supBr, amount, 'Service note work date missing; not apportioned across dockets', {id: n.id, note: n.note_no, hours: n.labour_hours});
  if (inM(date)) addCost('Installation — external contractors, green book', supBr, amount, 'Service-note dates at supplier labour rates; included within customer fencing rates; invoice/payment matching outstanding', {id: n.id, note: n.note_no, date, hours: n.labour_hours, status: acc762Status(date, month, asAt), forecastAmount: date > asAt ? amount || 0 : 0});
 });
 if (!green.length && M.cost && M.cost.fencing_labour && M.cost.fencing_labour.amount) unallocated(out.unallocatedCosts, 'Installation — external contractors, green book', supBr, M.cost.fencing_labour.amount, 'Only an aggregate labour cost is available; dated service notes are needed');
 poAll().filter(o => o.confirmed && o.invoice_no && o.amount != null).forEach(o => {
  const d = acc762Date(o.invoice_date), record = {number: o.number, invoice: o.invoice_no, amount: Number(o.amount), invoiceDate: d, period: o.period || o.programme_sheet || '', paidAmount: null, paymentStatus: 'unknown', workMonth: null};
  out.invoiceRecords.push(record); out.invoiceSnapshotTotal = acc762Round(out.invoiceSnapshotTotal + record.amount);
  if (inM(d)) out.invoiced = acc762Round(out.invoiced + record.amount);
 });
 ((DATA.rehire_quotes || {}).quotes || []).forEach(q => {
  const from = acc762Date(q.delivery) || acc762Date(q.use_on), to = acc762Date(q.collect) || acc762Date(q.use_on);
  const ex = acc762Round((Number(q.sub_total) || 0) + (Number(q.delivery_charge) || 0) + (Number(q.pickup) || 0));
  if (!from || !to || to < from) return unallocated(out.unallocatedCosts, 'Toilets — supplier quote', 'KINP', ex, 'Quote hire dates need confirmation', {quote: q.quote});
  const share = acc762Share(ex, from, to, month, asAt); if (!share) return;
  addCost('Toilets — supplier quote, provisional day-share', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', share.amount, q.quote + ' · ' + share.days + ' of ' + share.span + ' quoted days, including a provisional share of transport; Finance must confirm cost timing and invoice/payment coverage', {quote: q.quote, from, to, status: acc762Status(from, month, asAt), forecastAmount: share.forecastAmount, provisionalAllocation: true});
 });

 const ownCosts = ourCosts(), typedTransport = ownCosts.filter(x => x.kind === 'transport' && x.usable && acc762Money(x.amount) != null);
 const load = (tc, date, ref, source) => {
  if (!tc || tc.internal || acc762Money(tc.amount) == null) return;
  if (!acc762Date(date)) return unallocated(out.unallocatedCosts, 'Transport — schedule estimate', 'the job', tc.amount, 'Load date missing', {ref, source});
  if (!inM(date)) return;
  const overlap = ref && typedTransport.some(x => x.ref === ref && x.date === date);
  if (overlap) return unallocated(out.unallocatedCosts, 'Transport — possible duplicate source', 'the job', tc.amount, 'Schedule load also has a typed transport cost for the same reference/date; excluded from monthly candidates until matched', {ref, date, source, possibleDuplicate: true});
  addCost('Transport — schedule estimate', 'the job', tc.amount, 'Scheduled loads; delivery and carrier invoice/payment status require confirmation' + (tc.plus ? '; amount marked “and more” is a lower bound' : ''), {ref, date, source, status: acc762Status(date, month, asAt), forecastAmount: date > asAt ? tc.amount : 0, lowerBound: !!tc.plus});
 };
 live.forEach(a => (a.events || []).forEach(e => load(e.transport_cost, e.date, a.key, 'asset schedule')));
 [((DATA.plant_lines || {}).fencing_rows_not_plant || []), DATA.unreferenced || []].forEach(rs => rs.forEach(r => load(r.transport_cost, r.date, r.ref || r.key, 'schedule')));
 const names = {transport: 'Transport — typed cost', accommodation: 'Accommodation', meals: 'Meals away from home', misc: 'Other expenses', expense: 'Expenses', expenses: 'Expenses'};
 ownCosts.filter(x => x.usable && Object.prototype.hasOwnProperty.call(names, x.kind)).forEach(x => {
  const amount = acc762Money(x.amount), date = acc762Date(x.date);
  if (!date) return unallocated(out.unallocatedCosts, names[x.kind], 'the job', amount, 'Work date missing', {id: x.id});
  if (inM(date)) addCost(names[x.kind] + ' — tracker source', 'the job', amount, 'Tracker source only; confirm service, receipts, payment and existing ledger allocation before any journal', {id: x.id, date, status: acc762Status(date, month, asAt), forecastAmount: date > asAt ? amount || 0 : 0});
 });

 const labourRows = fin745Rows(asAt).filter(r => r.month === month);
 out.labourReview = acc762LabourReview(labourRows);
 ['hire', 'cna', 'salary'].forEach(type => {
  const rows = labourRows.filter(r => (r.type === 'hire' ? 'hire' : r.type === 'salary' ? 'salary' : 'cna') === type);
  const review = acc762LabourReview(rows);
  ['confirmed', 'pending', 'forecast'].forEach(status => {
   const g = review[status]; if (!g.rows) return;
   const stream = (type === 'hire' ? 'Labour hire' : type === 'salary' ? 'Coates salary allocation' : 'Coates CNA allocation') + ' — ' + (status === 'confirmed' ? 'confirmed hours' : status === 'forecast' ? 'forecast hours' : 'hours awaiting confirmation');
   const amount = g.cost || (g.unpricedHours ? null : 0);
   const row = addCost(stream, 'the job', amount, g.paid + ' paid/allocation hours across ' + g.rows + ' shifts; ' + g.actualCost + ' verified actual cost, ' + g.calculatedCost + ' calculated estimate; ' + g.unpricedHours + ' hours unpriced', {status, forecastAmount: status === 'forecast' ? g.cost : 0, labourType: type, labour: g});
   row.words = type === 'hire' ? 'Check supplier invoice and any amount already allocated; do not accrue the same cost twice.' : 'Finance to check payroll cost and allocation to Labour Install. A missing rate is unknown cost, not zero; do not repeat an existing allocation.';
   row.extra.labour = g; row.extra.labourType = type;
  });
 });
 out.wip.push({what: 'Fencing paid; V8s not yet billed — Andrew’s confirmation on 1 Oct 2026', words: 'The paid amount, payment dates and matching invoices have not been established here. Finance must check where the paid cost is allocated and the appropriate work/revenue period. Customer billing delay alone does not establish WIP or justify another cost accrual. Do not accrue a paid or already-booked cost again.', paidAmount: null, paymentStatus: 'user confirmed paid, amount unmatched', confirmedOn: '2026-10-01'});
 out.revenueTotal = acc762Round(out.revenue.reduce((s, r) => s + r.amount, 0));
 out.forecastRevenueTotal = acc762Round(out.revenue.reduce((s, r) => s + r.extra.forecastAmount, 0));
 out.costCandidateTotal = acc762Round(out.costs.reduce((s, r) => s + (r.candidate || 0), 0));
 out.forecastCostTotal = acc762Round(out.costs.reduce((s, r) => s + r.extra.forecastAmount, 0));
 out.costDecide = out.costCandidateTotal;
 out.decisions = out.costs.length + out.unallocatedCosts.length + out.unallocatedRevenue.length + out.wip.length;
 out.notes.push('Revenue totals are period allocations and estimates, not a measured earned or unbilled balance. Future amounts remain forecasts.');
 out.notes.push('Cost candidates are source amounts, not amounts to accrue. No automatic subtraction of unmatched invoices and no inference of payment from an invoice.');
 return out;
}
