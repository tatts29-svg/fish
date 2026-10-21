/* Author: Andrew Fisher. Protect native completion summaries from late presentation rewrites. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(process.env.EQUIPMENT_CANDIDATE || path.join(__dirname, '../build/GC500_v11.03/GC500_Delivery_Control_hosted.html'), 'utf8');
const start = "    const refs = pane.querySelector('.eqrefs');";
assert.equal(source.split(start).length - 1, 1, 'one late Equipment presentation hook');
const offset = source.indexOf(start);
const end = source.indexOf("    const regsum = pane.querySelector(':scope > .regsum');", offset);
assert.ok(end > offset, 'bounded native presentation span found');
const span = source.slice(offset, end);
let checks = 2;
// Counts are synthetic. Each summary is owned by the native completion projection,
// including unknown, filtered, physical-board, and independently qualified plan scope.
for (const text of [
  '3 references · 12 of 16 units confirmed complete · 75%',
  '24 boards · 23 of 24 boards confirmed complete · 95.83%',
  '1 board · 1 of 1 boards confirmed complete · 100%',
  '0 boards · No completion scope in this view',
  '2 references · 6 of 6 towers confirmed complete · 100% · Approved plan6 · 7 recorded · 1 additional',
  '1 reference · 0 confirmed complete · quantity to confirm'
]) {
  const summary = {textContent: text}, added = [];
  const refs = {querySelector: q => { assert.equal(q, 'summary > span'); return summary; }, classList: {add: name => added.push(name)}};
  const context = {pane: {querySelector: q => { assert.equal(q, '.eqrefs'); return refs; }}, state: {list: ['synthetic-delivery']}};
  vm.runInNewContext(span, context);
  assert.equal(summary.textContent, text, 'late wrapper preserves authoritative native summary'); checks++;
  assert.deepEqual(added, ['refresh-reference'], 'presentation class retained'); checks++;
}
vm.runInNewContext(span, {pane: {querySelector: () => null}, state: {list: []}}); checks++;
console.log(JSON.stringify({status: 'passed', checks, syntheticOnly: true, recordWrites: 0}));
