// Author: Andrew Fisher.
// Read-only reproduction of two v8.91 integration defects using fictional records.
// Usage: node repro_flow891.cjs /path/to/GC500_Delivery_Control_hosted.html
// A successful exit means the reviewed defects were reproduced, not release acceptance.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
if (!process.argv[2]) throw new Error('Pass the candidate HTML path as the only argument.');
const html = fs.readFileSync(process.argv[2], 'utf8');
// Extract the implementation from the candidate; never parse its embedded records.
const source = html;
function section(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, 'Missing source anchors: ' + start);
  return text.slice(a, b);
}
function oneLineFunction(name) {
  const a = html.indexOf('function ' + name + '(');
  assert(a >= 0, 'Missing candidate function ' + name);
  const line = html.slice(a, html.indexOf('\n', a));
  assert(line.endsWith('}'), 'Expected one-line function ' + name);
  return line;
}
const day = {iso: '2026-10-08'};
const asset = {key: 'TEST-REF', product: 'Fictional test item', discipline: 'Fixture'};
const data = {assets: [asset], weeks: []};
const loads = ['test-truck-a', 'test-truck-b'].map(truck_id => ({
  kind: 'deliveries', booking801: true, truck_id, time: '05:00', rows: [{a: asset}]
}));
const context = vm.createContext({
  DATA: data, S: {loads: {}}, SYNC: {backend: {readVersion821: () => 1}},
  save() {}, dpLoads: () => loads, programmeDays: () => [day],
  assetOf: key => key === asset.key ? asset : null,
  mayWrite: () => true, whoAmI: () => 'Fixture Reviewer', bump() {}, flash() {},
  whereText: () => ({main: 'Fictional location'}), run782: () => 70,
  UNLOAD_MIN782: 30, LOAD_BY782: 300, PEAKS782: [[420, 540], [960, 1080]],
  zone816: () => ({zone: 'mbp'}), meetPoint819: () => null,
  crew883Day: () => ({count: 2, names: []}),
  crew883Transport: () => 'Transport requirements to confirm',
  dpItemsWords: () => '', hasTank782: () => false,
  clock782: n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'),
  hhmm782: text => { const m = /^(\d{1,2}):(\d{2})$/.exec(text || ''); return m ? 60 * +m[1] + +m[2] : null; },
  localStorage: {getItem: () => null}, todayIso: () => '2026-10-08',
  crew883PrintDay: '', RENDER_MEMO: new Map()
});
vm.runInContext(oneLineFunction('crew883Key') + '\n' + oneLineFunction('ldId') + '\n' +
  section(source, 'const FLOW891 =', 'const dpLoadsBefore891'), context);
vm.runInContext(section(source, 'function flow891SetWindow(', '/* the list moves smoothly'), context);
const first = context.flow891Build(day);
const conflict = first.areas.find(area => area.key === 'mainBeach').conflicts[0];
assert(conflict, 'Fictional single-capacity area should have an initial conflict');
const windows = model => model.deliveries.map(load => ({id: load.id, start: load.win.start, finish: load.win.finish}));
const before = windows(first);
assert(context.flow891SetWindow(day.iso, conflict.move.id, conflict.to, conflict.len));
const second = context.flow891Build(day), after = windows(second);
assert.notEqual(before[0].start, after[0].start, 'Unselected truck is unexpectedly changed');
assert.equal(after[0].start, after[1].start, 'Both trucks receive the same per-reference window');
assert.equal(second.areas.find(area => area.key === 'mainBeach').conflicts.length, 1);
const windowResult = {
  case: 'Staggering one of two fictional trucks sharing a reference also moves the other',
  before, selectedLoad: conflict.move.id, after, conflictsRemaining: 1
};
vm.runInContext(['crew883Arrival', 'crew883Finish', 'crew883Plan', 'crew883Summary'].map(oneLineFunction).join('\n') + '\n' +
  section(html, 'function crew883Assess(', 'function crew883Summary(') + '\n' +
  section(source, 'function flow891SaveOrder(', 'function flow891Ids('), context);
context.S.loads = {};
const peopleBefore = context.crew883Summary(day.iso, asset.key);
assert(context.flow891SaveOrder(day.iso, loads.map(load => context.ldId(day, load)).reverse()));
const peopleAfter = context.crew883Summary(day.iso, asset.key);
assert(peopleBefore.startsWith('People required to confirm'));
assert(peopleAfter.startsWith('0 people needed'));
console.log(JSON.stringify({author: 'Andrew Fisher', fixtures: [windowResult, {
  case: 'Saving only load order turns an unknown people requirement into zero',
  before: peopleBefore, after: peopleAfter
}]}, null, 2));
