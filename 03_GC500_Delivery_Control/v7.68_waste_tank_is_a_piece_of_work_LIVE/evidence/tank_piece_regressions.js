// Author: Andrew Fisher. Offline, synthetic fixtures only; no network or record writes.
// Usage: node tank_piece_regressions.js <built-page.html>
// Keep existing unit-key ticks, unnumbered remainder and note/unit identification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
function section(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Missing source: ${start}`);
  return html.slice(a, b);
}
function fixture({quantity = 1, mapped = ['7000001'], noted = [], recorded = [], ticks = {}} = {}) {
  const asset = {key: 'TEST01'};
  const item = 'Waste tank';
  const ctx = {
    LAB_REST: 'rest', S: {labour: ticks},
    labourLineQty: () => quantity,
    buildingNumbersOf: () => ['8000001', ...mapped],
    lineNumbersOf: () => ({'Toilet Block 6m': ['8000001'], [item]: mapped}),
    tank768NotedNumbers: () => noted,
    unitsOf: () => recorded.map(asset_no => ({label: item, asset_no})),
    labourKeep: (a, units, q) => units.slice(0, q),
    movedAway: () => false, unitKey: u => u || '', allAssets: () => [asset],
  };
  vm.createContext(ctx);
  vm.runInContext(section('function labourKey(', '/* the buildings a tick'), ctx);
  vm.runInContext(section('function labourUnits(', 'function labourPart('), ctx);
  return {units: Array.from(ctx.labourUnits(asset, item)),
    tick: unit => ctx.labourTicked(asset.key, 'Toilets & amenities', item, 'install', unit, asset)};
}
const key = unit => `TEST01${unit ? '/u' + unit : ''}|Toilets & amenities|Waste tank|install`;
const checks = {};
function check(name, test) { test(); checks[name] = true; }
check('single numbered tank keeps its existing unit tick', () => {
  const x = fixture({ticks: {[key('7000001')]: true}});
  assert.deepEqual(x.units, ['7000001']); assert.equal(x.tick(), true);
});
check('partly numbered order keeps a separate unnumbered remainder', () => {
  const x = fixture({quantity: 2, ticks: {[key('7000001')]: true}});
  assert.deepEqual(x.units, ['7000001', 'rest']);
  assert.equal(x.tick('7000001'), true); assert.equal(x.tick('rest'), false);
});
check('reference tick still applies to every tank', () => {
  const x = fixture({quantity: 2, ticks: {[key()]: true}});
  assert.equal(x.tick('7000001'), true); assert.equal(x.tick('rest'), true);
});
check('tank recorded as contents keeps its piece', () => {
  const x = fixture({mapped: [], recorded: ['7000001'], ticks: {[key('7000001')]: true}});
  assert.deepEqual(x.units, ['7000001']); assert.equal(x.tick(), true);
});
check('note and recorded units deduplicate with the line numbers', () => {
  const x = fixture({quantity: 2, noted: ['7000001', '7000002'], recorded: ['7000002']});
  assert.deepEqual(x.units, ['7000001', '7000002']);
});
check('an order without numbers keeps its reference tick', () => {
  const x = fixture({quantity: 2, mapped: [], ticks: {[key()]: true}});
  assert.deepEqual(x.units, []); assert.equal(x.tick(), true);
});
check('extra numbers never exceed the ordered pieces', () => {
  const x = fixture({quantity: 2, mapped: ['7000001', '7000002', '7000003']});
  assert.equal(x.units.length, 2);
});
console.log(JSON.stringify({pass: true, checks}, null, 2));
