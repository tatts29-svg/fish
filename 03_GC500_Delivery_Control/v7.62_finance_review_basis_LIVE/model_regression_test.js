// Author: Andrew Fisher. Synthetic Finance model regressions; no network or shared record.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const patch = fs.readFileSync(path.join(__dirname, '../v7.61_accruals_for_finance_DRAFT/patch_v761.py'), 'utf8');
const helpers = patch.split('HELPERS = r"""')[1].split('"""')[0];
const replacement = fs.readFileSync(path.join(__dirname, 'acc762_model.js'), 'utf8');
let passed = 0;
function fixture(overrides = {}) {
 const data = {contracts: [], assets: [], costs: [], dockets: [], notes: [], pos: [], own: [], labour: [], race: null, quotes: []};
 Object.assign(data, overrides);
 const ctx = {
  todayIso: () => '2026-10-01', fin745MonthLabel: s => s,
  moneySummary: () => ({charge: {race: data.race}, cost: {}}), eventWindow: () => ({from: '2026-10-23', to: '2026-10-25'}),
  allAssets: () => data.assets, assetTotal: a => ({lines: a.lines || []}), branchOf: () => ({code: 'KINP'}),
  allCosts: () => data.costs, costBranchOf: () => ({code: 'STPS'}), ourCosts: () => data.own,
  allDockets: () => data.dockets, serviceNoteRows: () => data.notes, poAll: () => data.pos,
  PO_SRC: {supplier: {name: 'Advanced'}}, DATA: {rehire_quotes: {quotes: data.quotes}},
  ONHIRE_ROWS: data.contracts, ONHIRE: {supplied_on: '2026-09-24'},
  contractCharge: r => r.charge || {amount: 100, daily: true, days: 30},
  fin745Rows: () => data.labour, servicing748Total: () => 0,
  daysInclusive: (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000) + 1,
  LAB_REST: 'rest', labourRestN: () => 2,
 };
 vm.createContext(ctx); vm.runInContext(helpers, ctx); vm.runInContext(replacement, ctx);
 return {ctx, data, model: month => ctx.acc761Model(month || '2026-09')};
}
function test(name, run) { run(); passed++; console.log('PASS ' + name); }
const shift = (extra = {}) => Object.assign({id: 's1', date: '2026-09-30', month: '2026-09', person: 'Person', type: 'hire', worked: 8.5, paid: 8, calculatedCost: 100, actualCost: null, status: 'unconfirmed', allocation: 'unverified'}, extra);
const daily = (extra = {}) => Object.assign({branch_code: 'NVAC', start_date: '2026-09-01', term_date: '2026-09-30', billed_amount: 0, what: 'Forklift'}, extra);
test('fully billed contract remains an allocation, never an unbilled claim', () => {
 const f = fixture({contracts: [daily({billed_amount: 100})]}), x = f.model();
 assert.equal(x.revenueTotal, 100); assert.equal(x.baseplan.billed, 1); assert.equal(x.baseplan.billedAmount, 100);
 assert.equal(x.revenue[0].action, 'check'); assert.equal(x.costAccrue, null);
 assert(!x.revenue[0].words.includes('Accrue')); assert(x.baseplan.scope.includes('snapshot'));
});
test('future event is forecast and not earned', () => {
 const x = fixture({race: {amount: 1000, hours: 10}}).model('2026-10');
 assert.equal(x.forecastRevenueTotal, 1000); assert.equal(x.revenue[0].extra.status, 'forecast'); assert.equal(x.revenue[0].action, 'check');
});
test('daily hire exposes future share within current month', () => {
 const x = fixture({contracts: [daily({start_date: '2026-10-01', term_date: '2026-10-10'})]}).model('2026-10');
 assert.equal(x.revenueTotal, 100); assert.equal(x.forecastRevenueTotal, 90);
});
test('pickup belongs to return month and delivery to arrival month', () => {
 const pickup = daily({what: 'Pickup each way per container', charge_line: true, term_date: '2026-11-03', charge: {amount: 100}});
 const delivery = daily({what: 'Delivery each way per container', charge_line: true, term_date: '2026-11-03', charge: {amount: 100}});
 const f = fixture({contracts: [pickup, delivery]});
 assert.equal(f.model().revenueTotal, 100); assert.equal(f.model('2026-11').revenueTotal, 100);
});
test('pickup without return date stays unallocated, never falls back to start', () => {
 const x = fixture({contracts: [daily({what: 'Pickup', charge_line: true, term_date: null, charge: {amount: 100}})]}).model();
 assert.equal(x.revenueTotal, 0); assert.equal(x.unallocatedRevenue[0].amount, 100);
});
function tickAsset(tick, overrides = {}) {
 return Object.assign({key: 'P1', first_date: '2026-09-01', lines: [{item: 'Building', labour: {qty: 2, ticked: [Object.assign({key: 'demob', rate: 25, at: '2026-09-30T16:00:00Z'}, tick)]}}]}, overrides);
}
test('tick timestamp and arrival date are not work dates', () => {
 const x = fixture({assets: [tickAsset({})]}).model();
 assert.equal(x.revenueTotal, 0); assert.equal(x.unallocatedRevenue[0].amount, 50);
 assert.equal(x.unallocatedRevenue[0].extra.sources[0].recordedDate, '2026-10-01');
});
test('explicit demob completion date does not increase arrival month', () => {
 const f = fixture({assets: [tickAsset({completed_on: '2026-11-02'})]});
 assert.equal(f.model().revenueTotal, 0); assert.equal(f.model('2026-11').revenueTotal, 50);
 assert.equal(f.model('2026-11').revenue[0].extra.sources[0].kind, 'demob');
});
test('per-building ticks retain unit multipliers and cleaning classification', () => {
 const a = tickAsset({}, {lines: [{item: 'Building', labour: {perBuilding: true, units: [{unit: 'A', ticked: [{key: 'cleaning', rate: 10, work_date: '2026-09-30'}]}, {unit: 'rest', ticked: [{key: 'cleaning', rate: 10, work_date: '2026-09-30'}]}]}}]});
 const x = fixture({assets: [a]}).model(); assert.equal(x.revenueTotal, 30); assert(x.revenue[0].stream.startsWith('Cleaning'));
});
test('fractional-cent card components are summed before rounding', () => {
 const assets = [tickAsset({rate: 10.005}, {key: 'P1'}), tickAsset({rate: 10.005}, {key: 'P2'})];
 assets.forEach(a => { a.lines[0].labour.qty = 1; });
 const x = fixture({assets}).model(); assert.equal(x.unallocatedRevenue.length, 1); assert.equal(x.unallocatedRevenue[0].amount, 20.01);
 assert.equal(x.unallocatedRevenue[0].extra.sources.length, 2);
});
test('green-book costs follow service-note date and are not docket-proportioned', () => {
 const f = fixture({dockets: [{id: 'D', usable: true, date: '2026-09-10', paid_total: 100}], notes: [{id: 'N', date: '2026-10-02', cost: 50, labour_hours: 0.5}]});
 assert.equal(f.model().costCandidateTotal, 100); assert.equal(f.model('2026-10').costCandidateTotal, 50);
 assert.equal(f.model('2026-10').forecastCostTotal, 50);
});
test('undated service note stays visible and unallocated', () => {
 const x = fixture({notes: [{id: 'N', cost: 50, labour_hours: 0.5}]}).model();
 assert.equal(x.costCandidateTotal, 0); assert.equal(x.unallocatedCosts[0].amount, 50);
});
test('invoice is not payment or automatic deduction from unmatched dockets', () => {
 const x = fixture({dockets: [{id: 'D', usable: true, date: '2026-09-10', paid_total: 100}], pos: [{number: 'PO', invoice_no: 'I', confirmed: true, amount: 80, period: 'Week 1', at: '2026-09-10'}]}).model();
 assert.equal(x.costCandidateTotal, 100); assert.equal(x.costAccrue, null); assert.equal(x.invoiceSnapshotTotal, 80);
 assert.equal(x.invoiced, 0); assert.equal(x.invoiceRecords[0].paidAmount, null); assert.equal(x.invoiceRecords[0].workMonth, null);
 assert.equal(x.wip[0].paidAmount, null);
});
test('unconfirmed hours remain pending, never accrued', () => {
 const x = fixture({labour: [shift()]}).model();
 assert.equal(x.labourReview.pending.paid, 8); assert.equal(x.labourReview.confirmed.paid, 0); assert.equal(x.costAccrue, null);
 assert.equal(x.costs[0].extra.status, 'pending');
});
test('forecast hours are separated from confirmed actual hours', () => {
 const x = fixture({labour: [shift({status: 'forecast', date: '2026-09-30'})]}).model();
 assert.equal(x.labourReview.forecast.paid, 8); assert.equal(x.labourReview.confirmed.paid, 0); assert.equal(x.forecastCostTotal, 100);
});
test('confirmed actual cost overrides calculated rate estimate', () => {
 const x = fixture({labour: [shift({status: 'confirmed', actualCost: 50, allocation: 'needed'})]}).model();
 assert.equal(x.labourReview.confirmed.cost, 50); assert.equal(x.costCandidateTotal, 50); assert.equal(x.labourReview.confirmed.actualCost, 50);
 assert.equal(x.labourReview.confirmed.calculatedCost, 0);
});
test('changed source invalidates its former actual cost', () => {
 const x = fixture({labour: [shift({status: 'changed', actualCost: 50})]}).model();
 assert.equal(x.labourReview.pending.cost, 100); assert.equal(x.labourReview.pending.actualCost, 0);
});
test('salary and CNA allocation-needed hours remain available with no rate', () => {
 const x = fixture({labour: [shift({type: 'salary', status: 'confirmed', calculatedCost: null, allocation: 'needed'}), shift({id: 's2', type: 'cna', status: 'confirmed', calculatedCost: null, allocation: 'needed'})]}).model();
 assert.equal(x.labourReview.confirmed.allocationNeededHours, 16); assert.equal(x.labourReview.confirmed.unpricedHours, 16);
 assert.equal(x.costs.length, 2); assert.equal(x.costs[0].candidate, null); assert(x.costs.every(r => r.words.includes('Labour Install')));
});
test('already allocated hours are separated to prevent another allocation', () => {
 const x = fixture({labour: [shift({type: 'salary', status: 'confirmed', actualCost: 150, allocation: 'allocated'})]}).model();
 assert.equal(x.labourReview.confirmed.allocatedHours, 8); assert.equal(x.labourReview.confirmed.allocationNeededHours, 0); assert.equal(x.costCandidateTotal, 150);
});
test('unknown invoice status never becomes a known cost accrual', () => {
 const x = fixture({own: [{id: 'e1', usable: true, date: '2026-09-30', kind: 'expense', amount: 60}]}).model();
 assert.equal(x.costCandidateTotal, 60); assert.equal(x.costAccrue, null); assert.equal(x.costs[0].accrue, null); assert.equal(x.costs[0].invoiced, null);
});
test('matching transport reference/date does not count schedule and typed amount twice', () => {
 const x = fixture({assets: [{key: 'R1', events: [{date: '2026-09-30', transport_cost: {amount: 100}}]}], own: [{id: 't1', ref: 'R1', usable: true, date: '2026-09-30', kind: 'transport', amount: 120}]}).model();
 assert.equal(x.costCandidateTotal, 120); assert.equal(x.unallocatedCosts[0].extra.possibleDuplicate, true);
});
test('quote day-share stays provisional and future portion remains visible', () => {
 const x = fixture({quotes: [{quote: 'Q1', delivery: '2026-10-01', collect: '2026-10-10', sub_total: 100}]}).model('2026-10');
 assert.equal(x.costCandidateTotal, 100); assert.equal(x.forecastCostTotal, 90); assert.equal(x.costAccrue, null); assert.equal(x.costs[0].extra.sources[0].provisionalAllocation, true);
});
test('invalid dates are unallocated rather than silently rolled into another month', () => {
 const x = fixture({contracts: [daily({start_date: '2026-09-31'})]}).model();
 assert.equal(x.revenueTotal, 0); assert.equal(x.unallocatedRevenue.length, 1);
});
console.log(JSON.stringify({author: 'Andrew Fisher', passed, failed: 0, network: false, recordWrites: false}));
