// Author: Andrew Fisher. Exact model with synthetic figures; no network or writes.
// Usage: node classification_regressions.js [patch_v770.py or built-page.html]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const input = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'patch_v770.py'), 'utf8');
const start = input.indexOf('function pl770Model(){'), end = input.indexOf('function pl770Card(){', start);
assert.ok(start >= 0 && end > start, 'Model source must exist');
const source = input.slice(start, end);
function model(change = () => {}) {
  const M = {categories: [{key: 'equipment', known: true, amount: 7}],
    charge: {contracts: 100, delivery: 0, fencing: 30, servicing: 0, labour: 60,
      labour_ticks: 3, race: {amount: 150, people_amount: 100, at: 50, scope: true, hours: 1}},
    cost: {rehire_approved: true, rehire: 20, transport: {amount: 20},
      accommodation: {amount: 0}, meals: {amount: 0}, misc: {amount: 7}}};
  const R = {groups: [{what: 'Toilets', rev: 50, cost: 20}, {what: 'Fencing', rev: 30, cost: 50, installation: 5}], totals: {costMissing: 0}};
  const SP = {clean: true, gear: 50, installation: 5, docket_labour: 5, green: 0};
  change({M, R, SP});
  M.charge.total = M.charge.contracts + M.charge.fencing + M.charge.labour + M.charge.race.amount + M.charge.servicing;
  M.cost.known = M.cost.rehire + SP.gear + SP.installation + M.cost.transport.amount + M.cost.misc.amount;
  const X = {asAt: '2026-10-01', fencing: {cost: 0, revenue: 0}, rows: [],
    wages: {job: 0, unpricedHours: 10}, job: M.cost.known, revenue: {job: M.charge.total}};
  const ctx = {RENDER_MEMO: new Map(), moneySummary: () => M, cj764Model: () => X,
    rh766Model: () => R, servicing748: () => null,
    pl760Ticks: () => ({install: {amount: 10, ticks: 1}, cleaning: {amount: 20, ticks: 1}, fire_ext: {amount: 30, ticks: 1}}),
    fencePaidSplit: () => SP,
    DATA: {rehire_quotes: {quotes: [{quote: 'SYNTHETIC', groups: [{lines: [{description: 'Toilet hire', total_price: 20}]}]}]}},
    money0: x => '$' + x, fmtNum: String, todayIso: () => '2026-10-01'};
  vm.createContext(ctx); vm.runInContext(source, ctx);
  const result = ctx.pl770Model();
  return {result, revenue: key => result.rev.find(x => x.key === key), recovery: result.rec.find(x => x.name === 'Rehire Recovery')};
}
const checks = {};
function check(name, fn) { fn(); checks[name] = true; }
check('cleaning and fire retain their own classifications', () => {
  const x = model(); assert.equal(x.revenue('cleaning').now, 20); assert.equal(x.revenue('hire').now, 80);
});
check('only people enter Installation; support remains unallocated Revenue', () => {
  const x = model(); assert.equal(x.revenue('install').now, 110);
  assert.equal(x.revenue('event_support').now, 50); assert.equal(x.revenue('event_support').code, '—');
});
check('unknown scope split retains the whole amount without guessing Installation', () => {
  const x = model(({M}) => { delete M.charge.race.people_amount; });
  assert.equal(x.revenue('install').now, 10); assert.equal(x.revenue('event_support').now, 150);
});
check('zero people is a valid split', () => {
  const x = model(({M}) => { M.charge.race.people_amount = 0; M.charge.race.at = 150; });
  assert.equal(x.revenue('install').now, 10); assert.equal(x.revenue('event_support').now, 150);
});
check('explicit hourly-only labour remains Installation', () => {
  const x = model(({M}) => { delete M.charge.race.people_amount; M.charge.race.scope = false; });
  assert.equal(x.revenue('install').now, 160); assert.equal(x.revenue('event_support'), undefined);
});
check('classification preserves every existing financial total', () => {
  const x = model(); assert.equal(x.result.revNow, 340); assert.equal(x.result.costNow, 102);
  assert.ok(Object.values(x.result.checks).every(Boolean));
});
check('R&M remains a direct cost', () => {
  const x = model(); assert.equal(x.result.cost.find(c => c.key === 'rm').now, 7); assert.equal(x.result.over, 0);
});
check('bundled fencing does not produce a formal Rehire Recovery', () => {
  const x = model(); assert.equal(x.recovery.now, null); assert.equal(x.recovery.job, null);
  assert.match(x.recovery.words, /matching scope/);
});
check('missing supplier cost prevents a formal Rehire Recovery', () => {
  const x = model(({M, R, SP}) => {
    M.charge.fencing = 0; R.groups = [{what: 'Toilets', rev: 50, cost: null}];
    R.totals.costMissing = 1; SP.gear = 0; SP.installation = 0;
  });
  assert.equal(x.recovery.now, null); assert.equal(x.recovery.job, null); assert.match(x.recovery.words, /supplier costs are missing/);
});
check('matching complete hire scope still calculates its recovery', () => {
  const x = model(({M, R, SP}) => {
    M.charge.fencing = 0; R.groups = [{what: 'Toilets', rev: 50, cost: 20}]; SP.gear = 0; SP.installation = 0;
  });
  assert.equal(x.recovery.now, 2.5); assert.equal(x.recovery.job, 2.5);
});
console.log(JSON.stringify({pass: true, checks}, null, 2));
