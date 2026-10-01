// Author: Andrew Fisher. Read-only, deterministic finance forecast regressions.
// Run: node forecastregressiontests.js [path/to/built/page.html]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'acc762_labour.js'), 'utf8');
function run({slots = [], ticks = {}, race = null, rows = [], eventDays = []} = {}) {
 const blank = () => ({amount: 0, ticks: 0, unknown: 0});
 const context = {
  labourPlan: () => ({slots}),
  pl760Ticks: () => Object.assign({install: blank(), cleaning: blank(), fire_ext: blank(), other: blank()}, ticks),
  moneySummary: () => ({charge: {race}}),
  fin745Rows: () => rows,
  todayIso: () => '2026-10-01', EVENT_DAYS: eventDays
 };
 vm.createContext(context); vm.runInContext(source, context);
 return context.acc761Labour();
}
let checks = 0;
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks++; };
const same = (actual, expected, message) => { assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, message); checks++; };

// Labour-only revenue must exclude support, cleaning and fire extinguishers.
{
 const result = run({slots: [{key: 'install', state: 'tocome', value: 100}, {key: 'cleaning', state: 'later', value: 20}, {key: 'fire_ext', state: 'expected', value: 10}],
  race: {amount: 350, people_amount: 250, at: 100, hours: 2, scope: true}});
 equal(result.labourOnlyTotal, 350, 'Labour-only combines install and event people');
 equal(result.packageTotal, 480, 'Whole package retains support and non-labour charges once');
 equal(result.scopePeople, 250, 'People component preserved');
 equal(result.scopeSupport, 100, 'Accommodation/travel component preserved');
 equal(result.scope, 350, 'Original scope total retained');
 equal(result.labourOnlyComplete, true, 'Full source split is known');
}
// Relocated recorded charges are in P&L ticks even when absent from forecast slots.
{
 const result = run({slots: [{key: 'install', state: 'charged', value: 100}, {key: 'demob', state: 'later', value: 50}],
  ticks: {install: {amount: 160, ticks: 3, unknown: 0}}});
 equal(result.groups.install.charged, 160, 'Recorded tick total replaces charged slots');
 equal(result.per.total, 210, 'Moved-unit charge is retained once in total');
 equal(result.movedCharged, 60, 'Moved difference is explicit');
 equal(result.per.n, 4, 'Line count includes recorded moved ticks and outstanding demob');
 equal(result.demob.complete, false, 'Demob detail does not pretend moved-kind attribution is known');
}
// Missing quantity/rate is a visible unknown, never a completed zero-price forecast.
{
 const result = run({slots: [{key: 'demob', state: 'later', value: null}, {key: 'cleaning', state: 'later', value: undefined}],
  ticks: {install: {amount: 50, ticks: 2, unknown: 1}}});
 equal(result.per.total, 50, 'Known subtotal retained');
 equal(result.per.unpriced, 3, 'Unpriced recorded and future work counted');
 equal(result.per.unpricedByState.charged, 1, 'Unpriced tick identified');
 equal(result.per.unpricedByState.later, 2, 'Unpriced future work identified');
 equal(result.groups.install.complete, false, 'Install group is partial');
 equal(result.packageComplete, false, 'Package is partial');
}
// Verified actual cost takes precedence, including an explicitly recorded zero.
{
 const result = run({rows: [
  {person: 'Internal CNA', type: 'cna', date: '2026-09-30', month: '2026-09', worked: 8.5, paid: 8, status: 'confirmed', actualCost: 400, calculatedCost: 300},
  {person: 'Internal salary', type: 'salary', date: '2026-09-30', month: '2026-09', worked: 8.5, paid: 8, status: 'unconfirmed', actualCost: null, calculatedCost: 320},
  {person: 'Hire', type: 'hire', date: '2026-10-23', month: '2026-10', worked: 10.5, paid: 10, status: 'forecast', actualCost: null, calculatedCost: 600},
  {person: 'Zero actual', type: 'cna', date: '2026-09-30', month: '2026-09', worked: 2, paid: 2, status: 'confirmed', actualCost: 0, calculatedCost: 80},
  {person: 'Rate missing', type: 'salary', date: '2026-10-02', month: '2026-10', worked: 8.5, paid: 8, status: 'forecast', actualCost: null, calculatedCost: null}
 ], eventDays: ['2026-10-23']});
 equal(result.all.cost, 1320, 'Actual-cost override and internal cost rates both counted');
 equal(result.all.internalCost, 720, 'Internal CNA and salary values retained');
 equal(result.all.hireCost, 600, 'Hire cost remains separate');
 equal(result.all.actualCost, 400, 'Actual amount excludes superseded calculated value');
 equal(result.all.actualCostCount, 2, 'Recorded zero is a real actual-cost entry');
 equal(result.all.calculatedCostCount, 2, 'Only other priced shifts use calculated cost');
 equal(result.all.confirmedCost, 400, 'Confirmed cost is actual when supplied');
 equal(result.all.pendingCost, 320, 'Pending recorded hours are separate from actuals');
 equal(result.all.forecastCost, 600, 'Future cost separated');
 equal(result.all.unpriced, 8, 'Unknown paid hours retained');
 equal(result.all.unpricedCount, 1, 'Unknown shift count retained');
 equal(result.all.confirmedHours, 10.5, 'Confirmed gross hours');
 equal(result.all.confirmedPaidHours, 10, 'Confirmed paid hours');
 equal(result.all.pendingHours, 8.5, 'Pending gross hours');
 equal(result.all.pendingPaidHours, 8, 'Pending paid hours');
 equal(result.all.forecastHours, 19, 'Future gross hours');
 equal(result.all.forecastPaidHours, 18, 'Future paid hours');
 equal(result.all.hours, 36, 'Legacy hours field remains paid/allocation hours');
 equal(result.all.grossHours, 38, 'Start-to-finish hours remain separate');
 equal(result.months['2026-09'].cost, 720, 'September value includes internal rates');
 equal(result.raceHours, 10, 'Race share uses paid basis consistently with all.hours');
 equal(result.raceGrossHours, 10.5, 'Race gross basis exposed separately');
 same(result.unpricedPeople, ['Rate missing'], 'Only genuinely unpriced people are named');
}
// Two shifts in one day are two entries, one person-day. Changed confirmation is pending.
{
 const result = run({rows: [
  {person: 'Person A', type: 'cna', date: '2026-09-30', month: '2026-09', worked: 4, paid: 4, status: 'confirmed', calculatedCost: 80},
  {person: 'Person A', type: 'cna', date: '2026-09-30', month: '2026-09', worked: 4, paid: 3.5, status: 'changed', calculatedCost: 70},
  {person: 'Person A', type: 'cna', date: '2026-09-29', month: '2026-09', worked: 8.5, paid: 8, status: 'unconfirmed', calculatedCost: 160},
  {person: 'Person A', type: 'cna', date: '2026-10-02', month: '2026-10', worked: 8, paid: 8, status: 'forecast', calculatedCost: 160}
 ]});
 equal(result.people.length, 2, 'Person entries separated by work month');
 same(result.people[0].dates, ['2026-09-29', '2026-09-30'], 'Exact dates sorted');
 equal(result.people[0].dayCount, 2, 'Distinct days counted');
 equal(result.people[0].shifts, 3, 'Shift entry count retained');
 equal(result.people[0].pending, 2, 'Changed confirmation is not treated as confirmed');
 equal(result.people[0].hours, 15.5, 'Person paid hours total');
 equal(result.people[0].grossHours, 16.5, 'Person gross hours total');
 equal(result.people[1].future, 1, 'Future person shift labelled forecast');
}
// A previously confirmed actual cost must stop contributing when its source changes.
// Future and unconfirmed rows likewise cannot inherit an old actual-cost amount.
{
 const result = run({rows: [
  {person: 'Changed shift', type: 'cna', date: '2026-09-30', month: '2026-09', worked: 4, paid: 4, status: 'changed', actualCost: 400, calculatedCost: 120},
  {person: 'Future shift', type: 'hire', date: '2026-10-02', month: '2026-10', worked: 5, paid: 5, status: 'forecast', actualCost: 999, calculatedCost: 300},
  {person: 'Unconfirmed shift', type: 'salary', date: '2026-09-30', month: '2026-09', worked: 8, paid: 8, status: 'unconfirmed', actualCost: 500, calculatedCost: null}
 ]});
 equal(result.all.cost, 420, 'Stale actuals are excluded; current calculated costs retained');
 equal(result.all.actualCost, 0, 'No actual cost survives without valid confirmation');
 equal(result.all.actualCostCount, 0, 'No stale actual-cost entry is counted');
 equal(result.all.pendingCost, 120, 'Edited shift reverts to current calculated pending cost');
 equal(result.all.forecastCost, 300, 'Future shift uses forecast calculation only');
 equal(result.all.unpriced, 8, 'Stale actual does not hide a missing current rate');
 same(result.unpricedPeople, ['Unconfirmed shift'], 'Stale actual is not enough to price a person');
}
// Unknown people/type/hours and missing scope split remain partial.
{
 const result = run({race: {amount: 300, scope: true}, rows: [{person: 'Unknown type', date: '2026-09-30', month: '2026-09', paid: 7, worked: null, status: 'unconfirmed', calculatedCost: null}]});
 equal(result.scopePeople, null, 'Full scope never guessed to be people-only');
 equal(result.labourOnlyComplete, false, 'Unknown support split prevents complete labour claim');
 equal(result.all.cna, 0, 'Missing worker type not silently assigned CNA');
 equal(result.all.unknownTypeHours, 7, 'Missing worker type explicit');
 equal(result.all.hoursUnknown, 1, 'Missing gross hours explicit');
 equal(result.all.complete, false, 'Unknown hours prevent complete cost claim');
}
if (process.argv[2]) {
 const build = fs.readFileSync(process.argv[2], 'utf8');
 equal(build.includes(source.trim()), true, 'Built page contains the reviewed helper byte for byte');
}
console.log(JSON.stringify({author: 'Andrew Fisher', checks, passed: checks, failed: 0}));
