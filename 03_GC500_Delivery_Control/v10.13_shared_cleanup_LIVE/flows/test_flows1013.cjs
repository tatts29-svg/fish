/* Author: Andrew Fisher. Isolated flow regression; no browser, network or live records. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');

const panes = new Map();
const state = {tab: 'subhired', plantGroup: ''};
const INV = {drill: null};
const calls = {capture: 0, restore: 0, photo: 0, subhireCapture: 0};
const checks = [];
function check(name, condition) {
  assert.ok(condition, name);
  checks.push({name, passed: true});
}
function pane(tab, context) {
  const node = {
    id: 'pane-' + tab, hidden: false, context, details: [],
    querySelector(selector) {
      if (selector.includes('supplier932')) return {dataset: {supplier932Company: this.context}};
      if (selector.includes('finance857-nav')) return {dataset: {finance857: this.context}};
      if (selector === '#asOf') return {value: this.context};
      if (selector.includes('daystrip')) return {dataset: {day: this.context}};
      if (selector.includes('dday816')) return {dataset: {dday816: this.context}};
      return null;
    },
    querySelectorAll(selector) { return selector === 'details' ? this.details : []; }
  };
  panes.set(node.id, node);
  return node;
}
const root = {
  Persistence1010: {
    intent: 1,
    key: element => element.key,
    capture(scope, drafts) { calls.capture++; return {scope, drafts}; },
    restore(scope, held, drafts) {
      calls.restore++;
      assert.strictEqual(held.scope, scope, 'Registry restoration uses its captured pane');
      assert.strictEqual(held.drafts, true, 'Registry capture preserves unsaved fields');
      assert.strictEqual(drafts, true, 'Registry restoration preserves unsaved fields');
    }
  },
  Flow994: {captureSubhired() { calls.subhireCapture++; }}
};
const context = {
  window: root, state, INV,
  document: {getElementById: id => panes.get(id)},
  photoRedraw() { calls.photo++; },
  invBind() {}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'flows1013.js'), 'utf8'), context);
const flows = root.Flows1013;

let currentPane = pane('subhired', 'supplier-a');
currentPane.details = [{key: 'units', open: true}, {key: 'day', open: false}, {key: 'day', open: true}];
flows.depart();
check('Departure captures native Sub-hired fold state once', calls.subhireCapture === 1);
// Replace the nodes, as native navigation does when discarding a large hidden pane.
currentPane.details = [{key: 'units', open: false}, {key: 'day', open: true}, {key: 'day', open: false}];
flows.arrive('subhired');
check('Discarded pane restores open and closed duplicate-key folds independently',
  currentPane.details.map(item => item.open).join(',') === 'true,false,true');
currentPane.context = 'supplier-b';
currentPane.details.forEach(item => { item.open = false; });
flows.arrive('subhired');
check('One supplier never inherits another supplier\'s fold state', currentPane.details.every(item => !item.open));

state.tab = 'today';
currentPane = pane('today', '2030-01-01');
currentPane.details = [{key: 'same', open: true}];
flows.depart();
currentPane.context = '2030-01-02';
currentPane.details[0].open = false;
flows.arrive('today');
check('A different viewing date never inherits the previous date\'s fold state', !currentPane.details[0].open);
check('Tab navigation never invokes full persistence capture or restore', calls.capture === 0 && calls.restore === 0);

const token = flows.intentToken();
check('An unchanged visible view accepts its pending reveal', flows.current(token));
root.Persistence1010.intent++;
check('A later user action cancels an older pending reveal', !flows.current(token));
const newer = flows.intentToken();
currentPane.hidden = true;
check('A hidden pane refuses its pending reveal', !flows.current(newer));
currentPane.hidden = false;
state.tab = 'plant';
check('Leaving a tab cancels its pending reveal', !flows.current(newer));
state.tab = 'today';
INV.drill = {t: 'example-item', col: 'on'};
const inventory = flows.inventoryIntent();
INV.drill = {t: 'example-item', col: 'sub'};
check('Changing the Inventory drill cancels the earlier drill reveal', !flows.currentInventory(inventory));

context.photoRedraw();
check('Registry refresh captures, calls native redraw and restores exactly once',
  calls.photo === 1 && calls.capture === 1 && calls.restore === 1);

const sha256 = name => crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, name))).digest('hex');
console.log(JSON.stringify({
  author: 'Andrew Fisher',
  kind: 'Isolated VM flow regression',
  source_sha256: {'flows1013.js': sha256('flows1013.js'), 'patch_flows1013.py': sha256('patch_flows1013.py')},
  checks,
  result: {checks: checks.length, passed: checks.length},
  limitations: 'Uses synthetic DOM/state fixtures. Does not replace native browser, rendering, focus, scroll or service verification.'
}, null, 2));
