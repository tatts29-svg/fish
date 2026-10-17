/* Author: Andrew Fisher. Extract the live Costs wrapper; reproduce its delayed scroll override. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const page = fs.readFileSync(process.argv[2], 'utf8');
const marker = 'renderCosts=function(){const main=document.querySelector(\'main\'),y=main?.scrollTop||0;';
assert.equal(page.split(marker).length, 2);
const from = page.indexOf(marker), to = page.indexOf('\n const prev=window.costsAuditDecorate;', from);
assert(to > from);
const source = page.slice(from, to);
function example({goChanged, nextTab, restoredY, intentChanged}) {
  const callbacks = [], main = {scrollTop: 1200, scrollTo({top}) { this.scrollTop = top; }};
  const context = {
    document: {querySelector(selector) { assert.equal(selector, 'main'); return main; }},
    native() {}, tidy() {}, requestAnimationFrame(fn) { callbacks.push(fn); },
    GO_CHANGED: goChanged, state: {tab: 'costs'}, window: {Persistence1010: {intent: 1}}
  };
  vm.createContext(context); vm.runInContext(source, context); context.renderCosts();
  context.GO_CHANGED = false;
  context.state.tab = nextTab;
  if (intentChanged) context.window.Persistence1010.intent++;
  main.scrollTop = restoredY;
  callbacks.forEach(fn => fn());
  return main.scrollTop;
}
for (const [name, input] of [
  ['first arrival ignores target tab scroll', {goChanged: true, nextTab: 'costs', restoredY: 0}],
  ['late callback changes the next tab scroll', {goChanged: false, nextTab: 'demob', restoredY: 75}],
  ['late callback overrides later user scroll', {goChanged: false, nextTab: 'costs', restoredY: 900, intentChanged: true}]
]) {
  const actual = example(input);
  assert.equal(actual, 1200, name + ' reproduces on current source');
  assert.notEqual(actual, input.restoredY);
  console.log('CONFIRMED ' + name + ': expected ' + input.restoredY + ', actual ' + actual);
}
