/* Author: Andrew Fisher. Synthetic identities only; no private staffing source. */
const assert = require('node:assert/strict');
const {eventStaffing833} = require('./event_staffing833_src.js');
const clone = value => JSON.parse(JSON.stringify(value));
const dates = ['2026-10-23', '2026-10-24', '2026-10-25'];
const person = (id, name) => ({id, name, role: 'Operational role', shiftIds: dates.map(d => id + d), shiftDates: Object.fromEntries(dates.map(d => [id + d, d]))});
const roster = [person('p1', 'Fixture one'), person('p2', 'Fixture two')];
const input = {spec: {dates, start: '06:00', finish: '18:00', paidHoursPerDay: 12, roster,
  unconfirmed: [{name: 'Fixture held', role: 'Return unconfirmed', shiftIds: ['held']}],
  placeholders: [{people: 1, role: 'Night cover', hours: null}, {people: 6, role: 'External crew', hours: null}]},
  finance: roster.flatMap((p, i) => dates.map(date => ({id: p.id + date, person: p.name, date, paid: 12, calculatedCost: i ? null : 120, status: 'forecast', source: {start: '06:00', finish: '18:00', break_min: 0}}))),
  scope: {total: 1000, people: 800, lines: [{key: 'fence', amount: 400, hours: 20}]}};
input.finance.push({id: 'held', person: 'Fixture held', date: dates[0], paid: 10, calculatedCost: 100, status: 'forecast'});
const tests = [];
function test(name, check) { check(); tests.push(name); }
test('planned wages and customer scope remain separate', () => {
  const m = eventStaffing833(input); assert.equal(m.paidHours, 72); assert.equal(m.knownCost, 360); assert.equal(m.unpricedHours, 36);
  assert.equal(m.scopeTotal, 1000); assert.equal(m.unconfirmed.length, 1); assert.equal(m.complete, true); assert.equal(m.placeholders[0].hours, null);
});
test('missing source row stays visible as unresolved, never zero cost', () => {
  const v = clone(input); v.finance = v.finance.filter(r => r.id !== roster[1].shiftIds[0]); const m = eventStaffing833(v);
  assert.equal(m.unresolvedShifts, 1); assert.equal(m.complete, false); assert.equal(m.rows[1].knownCost, null);
});
test('native start and unpaid-break edits are respected and flagged', () => {
  const v = clone(input); Object.assign(v.finance[0], {paid: 8, calculatedCost: 80, source: {start: '08:00', finish: '16:30', break_min: 30}});
  const m = eventStaffing833(v); assert.equal(m.paidHours, 68); assert.equal(m.knownCost, 320); assert.equal(m.rows[0].changed, true);
});
test('same-ID reassignment does not count another person as the planned name', () => {
  const v = clone(input); v.finance[0].person = 'Reassigned fixture'; const m = eventStaffing833(v);
  assert.equal(m.paidHours, 60); assert.equal(m.knownCost, 240); assert.equal(m.unresolvedShifts, 1); assert.equal(m.complete, false);
});
test('same-ID move to another event date is unresolved', () => {
  const v = clone(input); v.finance[0].date = dates[1]; const m = eventStaffing833(v);
  assert.equal(m.rows[0].missing.length, 1); assert.equal(m.complete, false);
});
test('unconfirmed source reassignment remains outside the named held plan', () => {
  const v = clone(input); v.finance[v.finance.length - 1].person = 'Reassigned fixture'; const m = eventStaffing833(v);
  assert.equal(m.unconfirmed[0].paidHours, 0); assert.equal(m.additional.length, 1);
});
test('additional same-day source rows require reconciliation', () => {
  const v = clone(input); v.finance.push({...v.finance[0], id: 'additional'}); const m = eventStaffing833(v);
  assert.equal(m.rows[0].extraIds.length, 1); assert.equal(m.complete, false); assert.equal(m.paidHours, 72);
});
test('zero is a priced rate; missing prices remain null', () => {
  const v = clone(input); v.finance.forEach(r => { r.calculatedCost = r.person === roster[0].name ? 0 : null; });
  const m = eventStaffing833(v); assert.equal(m.knownCost, 0); assert.equal(m.rows[1].knownCost, null);
});
test('the helper does not mutate source or Finance records', () => {
  const before = clone(input); eventStaffing833(input); assert.deepEqual(input, before);
});
console.log(JSON.stringify({author: 'Andrew Fisher', pass: tests.length, tests}, null, 2));
