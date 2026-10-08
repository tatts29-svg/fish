// Author: Andrew Fisher. Synthetic pure-model checks only; no browser, network or record writes.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sourcePath = process.env.STAFF910_SOURCE || path.join(__dirname, '..', 'staff910.js');
const forbidden = [];
const refuse = name => () => { forbidden.push(name); throw Error('Unexpected write: ' + name); };
const nativePlan = {order: 7, people: [], start: '', finish: '', location: 'Practice area'};
const sandbox = {
  console, S: {loads: {}, costs: []}, SYNC: {readonly: false}, state: {day: '2026-10-12'},
  crew883Editor() { return ''; }, crew883PersonHtml() { return ''; }, crew883Plan() { return structuredClone(nativePlan); },
  crew883Key: (day, ref) => 'crew883/' + day + '/' + (ref || 'availability'),
  crew883Day: () => ({count: null, names: []}),
  crew883SaveDay: refuse('crew883SaveDay'), crew883SavePlan: refuse('crew883SavePlan'),
  crew883Write: refuse('crew883Write'), bump: refuse('bump'), save: refuse('save'),
  ourCosts: () => [], rosterIncludes858: () => true, runHours: r => r.hours, runWorked: r => r.hours,
  todayIso: () => '2026-10-12', capability: () => 'edit', mayWrite: () => true,
  assetOf: key => ({key}), esc: x => String(x == null ? '' : x), flash() {},
  setTimeout() { return 0; }, clearTimeout() {}, requestAnimationFrame() { return 0; },
  localStorage: {getItem() { return null; }, setItem: refuse('localStorage.setItem')},
  fetch: refuse('fetch')
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), sandbox, {filename: sourcePath, timeout: 5000});
const M = sandbox.StaffNames910 && sandbox.StaffNames910._test;
assert(M, 'StaffNames910._test must expose the actual production pure model');
for (const name of ['rosterFromRows', 'buildDay', 'validateDayValues', 'validatePlanValues', 'mappingForRecord', 'planSignature']) {
  assert.equal(typeof M[name], 'function', 'Missing production test export: ' + name);
}
const plain = v => JSON.parse(JSON.stringify(v));
const clone = v => structuredClone(v);
const checks = [];
function test(name, fn) {
  try { fn(); checks.push({name, pass: true}); }
  catch (error) { checks.push({name, pass: false, error: error.message}); }
}
const D = '2026-10-12';
const maths = {includes: r => !r.excluded, hours: r => r.hours, worked: r => r.worked === undefined ? r.hours : r.worked};
const labour = (person, extra = {}) => ({id: person, kind: 'labour', date: D, person, usable: true, hours: 8, ...extra});
const rows = [
  labour('Alex Example', {start: '05:00', finish: '13:30'}), labour('Bea Example', {hours: 7.5}),
  labour('Other Day', {date: '2026-10-13'}), labour('Contact Only', {kind: 'person'}),
  labour('Hotel Only', {kind: 'accommodation'}), labour('Meal Only', {kind: 'meal'}),
  labour('Zero Hours', {hours: 0}), labour('Unusable Person', {usable: false}),
  labour('Unconfirmed Person', {usable: undefined}), labour('Window Excluded', {excluded: true}),
  labour('Fencing crew 4'), labour('Installer 1')
];
const roster = M.rosterFromRows(D, rows, maths);
const saved = {count: 4, names: ['Bea Example', '', 'Alex Example', '']};
const plans = [{day: D, ref: 'P01', people: [{slot: 1, roles: ['installer']}]}];
const build = (record = saved, taskPlans = plans, suggestions = roster) => M.buildDay(D, record, taskPlans, suggestions);
const dayReason = (model, values, token = model.mappingToken) => M.validateDayValues(model, values, token);
const task = (extra = {}) => ({...clone(nativePlan), ...extra});
const planReason = (model, values, current = task(), mapping = model.mappingToken, signature = M.planSignature(current)) =>
  M.validatePlanValues(model, values, current, mapping, signature);

test('exact-day usable positive labour only; no contact, hotel, meal, generic or other-day rows', () => {
  assert.deepEqual(plain(roster.map(p => p.name)), ['Alex Example', 'Bea Example']);
});
test('hours-only named shift has unknown time and no invented window', () => {
  assert.equal(roster[1].timeUnknown, true); assert.deepEqual(plain(roster[1].windows), []);
});
test('authoritative timed shift keeps exact window', () => {
  assert.deepEqual(plain(roster[0].windows), [{start: '05:00', finish: '13:30', overnight: false}]);
});
test('impossible calendar day produces no roster candidates', () => {
  assert.deepEqual(plain(M.rosterFromRows('2026-02-30', rows, maths)), []);
});
test('invalid paid hours or duration cannot supply a named suggestion', () => {
  const bad = [labour('Bad Paid', {hours: NaN}), labour('Infinite Paid', {hours: Infinity}),
    labour('Negative Paid', {hours: -1}), labour('Bad Duration', {worked: NaN}),
    labour('Zero Duration', {worked: 0}), labour('Long Duration', {worked: 25})];
  assert.deepEqual(plain(M.rosterFromRows(D, bad, maths)), []);
});
test('current authoritative rows are the only roster source', () => {
  assert.deepEqual(plain(M.rosterFromRows(D, [], maths)), []);
  assert.deepEqual(plain(M.rosterFromRows(D, [labour('Next Day', {date: '2026-10-13'})], maths)), []);
});
test('same normalised name across shifts remains one suggestion with exact windows', () => {
  const got = M.rosterFromRows(D, [labour('Alex Example', {start: '05:00', finish: '09:00'}),
    labour(' alex   example ', {id: 'late', start: '10:15', finish: '14:20'})], maths);
  assert.equal(got.length, 1); assert.equal(got[0].windows.length, 2);
});
test('overnight roster window remains overnight rather than becoming attendance', () => {
  const got = M.rosterFromRows(D, [labour('Night Example', {start: '22:00', finish: '06:00'})], maths);
  assert.deepEqual(plain(got[0].windows), [{start: '22:00', finish: '06:00', overnight: true}]);
});
test('saved slot order and blanks win over reordered roster', () => {
  const model = build(saved, plans, roster.slice().reverse());
  assert.deepEqual(plain(model.names), saved.names); assert.equal(model.slots[0].name, 'Bea Example');
  assert.equal(model.canUseRoster, false);
});
test('count four with no names stays four when only Person 2 is named', () => {
  const model = build({count: 4, names: []}, []), values = {count: 4, names: ['', 'Alex Example']};
  assert.equal(dayReason(model, values), ''); assert.equal(model.count, 4);
  assert.deepEqual(plain(model.names), []); assert.deepEqual(values.names, ['', 'Alex Example']);
});
test('blank named slot remains supported without compaction', () => {
  const model = build(); assert.equal(dayReason(model, clone(saved)), '');
  assert.equal(model.slots[1].slot, 2); assert.equal(model.slots[1].name, '');
});
test('saved zero remains present zero with no roster adoption', () => {
  const model = build({count: 0, names: []}, []);
  assert.equal(model.present, true); assert.equal(model.count, 0); assert.equal(model.canUseRoster, false);
  assert.equal(model.slots.length, 0); assert.equal(dayReason(model, {count: 0, names: []}), '');
});
test('saved null remains present unknown with no roster adoption', () => {
  const model = build({count: null, names: []}, []);
  assert.equal(model.present, true); assert.equal(model.count, null); assert.equal(model.canUseRoster, false);
  assert.equal(dayReason(model, {count: null, names: []}), '');
});
test('unset day without roster stays unknown rather than zero', () => {
  const model = M.buildDay(D, undefined, [], []);
  assert.equal(model.present, false); assert.equal(model.count, null); assert.equal(model.canUseRoster, false);
});
test('roster adoption is offered only for clean unset day and performs no mutation', () => {
  const suggestions = plain(roster), before = JSON.stringify(suggestions);
  const model = M.buildDay(D, undefined, [], suggestions);
  assert.equal(model.canUseRoster, true); assert.equal(model.count, null); assert.deepEqual(plain(model.names), []);
  assert.equal(JSON.stringify(suggestions), before);
});
test('numbered legacy task positions reserve names without adopting roster identities', () => {
  const model = M.buildDay(D, undefined, [{day: D, ref: 'P04', people: [{slot: 4, roles: ['escort']}]}], roster);
  assert.equal(model.highestUsed, 4); assert.equal(model.slots[3].name, '');
  assert.equal(model.canUseRoster, false); assert.deepEqual(plain(model.slots[3].refs), ['P04']);
});
test('manual non-rostered name remains in its original slot', () => {
  const model = build(saved, plans, []);
  assert.equal(model.slots[0].name, 'Bea Example'); assert.equal(model.slots[0].rostered, false);
});
test('references using a numbered person are exposed once and only for the selected day', () => {
  const model = build(saved, [plans[0], plans[0], {day: D, ref: 'P02', people: [{slot: 1, roles: ['escort']}]},
    {day: '2026-10-13', ref: 'OTHER', people: [{slot: 4, roles: ['installer']}]}]);
  assert.deepEqual(plain(model.slots[0].refs).sort(), ['P01', 'P02']); assert.equal(model.highestUsed, 1);
});
test('selected out-of-count legacy slot remains visible and flagged', () => {
  const model = build({count: 0, names: []}, plans);
  assert.equal(model.slots[0].slot, 1); assert.equal(model.slots[0].outsideCount, true);
});
test('lowering availability cannot discard a referenced person number', () => {
  const model = build({count: 4, names: []}, [{day: D, ref: 'P04', people: [{slot: 4, roles: ['escort']}]}]);
  assert(dayReason(model, {count: 3, names: []}));
});
test('lowering availability cannot truncate a saved name', () => {
  const model = build(); assert(dayReason(model, {count: 2, names: saved.names.slice()}));
});
test('lower count remains blocked when incoming draft already omits the saved higher-slot name', () => {
  const model = build(); assert(dayReason(model, {count: 2, names: saved.names.slice(0, 2)}));
});
test('clearing availability cannot erase saved names or referenced person numbers', () => {
  assert(dayReason(build(), {count: null, names: []}));
  assert(dayReason(build({count: 4, names: []}, plans), {count: null, names: []}));
});
test('new duplicate names are refused after whitespace and case normalisation', () => {
  const model = build(); assert(dayReason(model, {count: 4, names: ['Bea Example', ' bea   example ', 'Alex Example', '']}));
});
test('unchanged historical duplicate names are grandfathered without remapping', () => {
  const record = {count: 2, names: ['Alex Example', 'alex example']}, model = build(record, []);
  assert.equal(dayReason(model, clone(record)), ''); assert.deepEqual(plain(model.names), record.names);
});
test('unrelated slot edit can preserve an unchanged historical duplicate pair', () => {
  const model = build({count: 3, names: ['Alex Example', 'alex example', '']}, []);
  assert.equal(dayReason(model, {count: 3, names: ['Alex Example', 'alex example', 'Bea Example']}), '');
});
test('historical duplicate allowance does not permit a new third occurrence', () => {
  const model = build({count: 3, names: ['Alex Example', 'alex example', '']}, []);
  assert(dayReason(model, {count: 3, names: ['Alex Example', 'alex example', 'Alex Example']}));
});
test('day save refuses stale mapping while leaving original data unchanged', () => {
  const opening = build(), current = build({count: 4, names: ['Alex Example', '', 'Bea Example', '']});
  assert(dayReason(current, clone(saved), opening.mappingToken));
  assert.deepEqual(plain(current.names), ['Alex Example', '', 'Bea Example', '']);
});
test('day values reject malformed counts, names and unknown-count names', () => {
  const model = build();
  for (const values of [{count: -1, names: []}, {count: 51, names: []}, {count: 1.5, names: []},
    {count: 2, names: ['Alex\nExample']}, {count: 2, names: ['x'.repeat(101)]},
    {count: 2, names: [42]}, {count: null, names: ['Alex Example']}]) assert(dayReason(model, values));
});
test('mapping identity distinguishes absence, zero, null and order', () => {
  const tokens = [undefined, {count: 0, names: []}, {count: null, names: []}, saved,
    {count: 4, names: ['Alex Example', '', 'Bea Example', '']}].map(x => M.mappingForRecord(x));
  assert.equal(new Set(tokens).size, tokens.length);
});
test('one numbered person with two roles remains one person', () => {
  const model = build(), values = task({people: [{slot: 1, roles: ['spotter', 'forklift']}]});
  assert.equal(planReason(model, values), ''); assert.equal(values.people.length, 1);
});
test('two unassigned requirements remain two distinct null rows', () => {
  const values = task({people: [{slot: null, roles: ['spotter']}, {slot: null, roles: ['installer']}]});
  assert.equal(planReason(build(), values), ''); assert.equal(values.people.length, 2);
});
test('unnamed numbered person is distinct from unassigned requirement', () => {
  const values = task({people: [{slot: 2, roles: ['spotter']}, {slot: null, roles: ['installer']}]});
  assert.equal(planReason(build(), values), ''); assert.equal(values.people[0].slot, 2);
});
test('same numbered person on duplicate task rows is refused', () => {
  assert(planReason(build(), task({people: [{slot: 1, roles: ['spotter']}, {slot: 1, roles: ['forklift']}]})));
});
test('legacy duplicate names cannot be newly selected as two people on one task', () => {
  const model = build({count: 2, names: ['Alex Example', 'alex example']}, []);
  const current = task({people: [{slot: 1, roles: ['installer']}]});
  const values = task({people: [{slot: 1, roles: ['installer']}, {slot: 2, roles: ['escort']}]});
  assert(planReason(model, values, current));
});
test('already-selected historical duplicate identities remain on their numbered task rows', () => {
  const model = build({count: 2, names: ['Alex Example', 'alex example']}, []);
  const current = task({people: [{slot: 1, roles: ['installer']}, {slot: 2, roles: ['escort']}]});
  const values = clone(current); values.people[0].roles.push('spotter');
  assert.equal(planReason(model, values, current), '');
  assert.deepEqual(values.people.map(p => p.slot), [1, 2]);
});
test('roles must be explicit and valid; roster membership confers none', () => {
  for (const roles of [[], ['driver'], ['installer', 'unknown']]) {
    assert(planReason(build(), task({people: [{slot: 1, roles}]})));
  }
});
test('unchanged out-of-count assignment can be retained but not newly introduced', () => {
  const model = build({count: 0, names: []}, plans), existing = task({people: [{slot: 1, roles: ['installer']}]});
  assert.equal(planReason(model, clone(existing), existing), '');
  assert(planReason(model, task({people: [{slot: 2, roles: ['installer']}]}), existing));
});
test('unknown availability does not invent numbered selectable people', () => {
  const model = build({count: null, names: []}, []);
  assert(planReason(model, task({people: [{slot: 1, roles: ['installer']}]})));
  assert.equal(planReason(model, task({people: [{slot: null, roles: ['installer']}]})), '');
});
test('task save refuses a changed day mapping', () => {
  const opening = build(), current = build({count: 4, names: ['Alex Example', '', 'Bea Example', '']});
  assert(planReason(current, task(), task(), opening.mappingToken));
});
test('task save refuses concurrent order/window changes', () => {
  const opening = task(), current = task({order: 8, start: '07:17', finish: '08:05'});
  assert(planReason(build(), opening, current, build().mappingToken, M.planSignature(opening)));
});
test('historical empty windows and manual order stay exact during a name assignment', () => {
  const current = task(), values = task({people: [{slot: 1, roles: ['installer']}]});
  const before = JSON.stringify(values); assert.equal(planReason(build(), values, current), '');
  assert.equal(JSON.stringify(values), before); assert.equal(values.start, ''); assert.equal(values.finish, ''); assert.equal(values.order, 7);
});
test('off-grid manual window survives without rounding during task validation', () => {
  const current = task({order: 8, start: '07:17', finish: '08:05'}), values = {...clone(current), people: [{slot: 3, roles: ['escort']}]};
  assert.equal(planReason(build(), values, current), ''); assert.equal(values.start, '07:17'); assert.equal(values.finish, '08:05');
});
test('task validation refuses invalid native order, windows, slot and row limits', () => {
  const model = build();
  for (const values of [task({order: 0}), task({order: 201}), task({start: '07:00', finish: ''}),
    task({start: '08:00', finish: '07:00'}), task({start: '25:00', finish: '26:00'}),
    task({people: [{slot: 51, roles: ['installer']}]}), task({people: [{slot: 1.5, roles: ['installer']}]}),
    task({people: Array.from({length: 21}, () => ({slot: null, roles: ['installer']}))})]) assert(planReason(model, values));
});
test('reads and validations never mutate source records, plans or roster', () => {
  const record = clone(saved), originalPlans = clone(plans), inputRows = clone(rows), before = JSON.stringify({record, originalPlans, inputRows});
  const suggestions = M.rosterFromRows(D, inputRows, maths), model = M.buildDay(D, record, originalPlans, suggestions);
  dayReason(model, clone(record)); planReason(model, task({people: [{slot: 1, roles: ['installer']}]}));
  assert.equal(JSON.stringify({record, originalPlans, inputRows}), before);
});
test('initialisation and all pure checks call no native save, attendance, finance or network path', () => {
  assert.deepEqual(forbidden, []); assert.deepEqual(sandbox.S, {loads: {}, costs: []});
});

for (const check of checks) console.log((check.pass ? 'PASS ' : 'FAIL ') + check.name + (check.error ? ' · ' + check.error : ''));
console.log(checks.filter(c => c.pass).length + '/' + checks.length);
if (checks.some(c => !c.pass)) process.exitCode = 1;
