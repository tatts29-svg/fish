/* Author: Andrew Fisher. Run the actual original and corrected Costs wrappers with a controlled frame queue. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');

assert(process.argv[2], 'Usage: node test_costs_scroll1065.cjs /private/path/to/current/page.html');
const source = fs.readFileSync(process.argv[2], 'utf8');
const transformer = path.join(__dirname, 'patch_costs_scroll1065.py');
const transformed = spawnSync('python3', [transformer, process.argv[2]], {encoding: 'utf8', maxBuffer: 32e6});
assert.equal(transformed.status, 0, transformed.stderr);
const corrected = transformed.stdout;
function getWrapper(text, fixed) {
  const start = fixed ? ' let costsScroll1065 = 0;' : ' const native=renderCosts;\n renderCosts=function(){const main=';
  assert.equal(text.split(start).length, 2, 'unique wrapper');
  const from = text.indexOf(start), to = text.indexOf('\n const prev=window.costsAuditDecorate;', from);
  assert(to > from); return text.slice(from, to);
}
function harness(text, fixed) {
  const frames = [], writes = [], calls = [];
  const main = {scrollTop: 1200, isConnected: true, scrollTo(arg) { writes.push(arg.top); this.scrollTop = arg.top; }};
  const c = {
    pane: {}, main, state: {tab: 'costs'}, location: {hash: '#costs'}, GO_CHANGED: false,
    window: {Persistence1010: {intent: 1}}, tidy() {},
    document: {querySelector: () => main, getElementById: () => c.pane},
    requestAnimationFrame: fn => frames.push(fn),
    renderCosts(...args) { calls.push({self: this, args}); main.scrollTop = 0; return 'native-result'; }
  };
  vm.createContext(c); vm.runInContext(getWrapper(text, fixed), c);
  return {c, main, writes, calls, frames, flush() { frames.splice(0).forEach(fn => fn()); }};
}
let total = 0;
function test(name, run) { run(); total++; console.log('PASS ' + name); }

test('original overwrites a newly selected Costs tab scroll', () => {
  const h = harness(source, false); h.c.GO_CHANGED = true; h.c.renderCosts(); h.c.GO_CHANGED = false;
  h.main.scrollTop = 75; h.flush(); assert.equal(h.main.scrollTop, 1200);
});
test('original overwrites the next tab and later user scroll', () => {
  const h = harness(source, false); h.c.renderCosts(); h.c.state.tab = 'demob'; h.c.location.hash = '#demob';
  h.c.window.Persistence1010.intent++; h.main.scrollTop = 90; h.flush(); assert.equal(h.main.scrollTop, 1200);
});
test('Costs arrival keeps the target tab position set by navigation', () => {
  const h = harness(corrected, true); h.c.GO_CHANGED = true; h.c.renderCosts(); h.c.GO_CHANGED = false;
  h.main.scrollTop = 75; h.flush(); assert.equal(h.main.scrollTop, 75); assert.equal(h.frames.length, 0); assert.equal(h.writes.length, 0);
});
test('same-tab save refresh restores the actual reading position', () => {
  const h = harness(corrected, true); h.c.renderCosts(); assert.equal(h.main.scrollTop, 0);
  h.flush(); assert.equal(h.main.scrollTop, 1200); assert.deepEqual(h.writes, [1200]);
});
test('an unchanged reading position does not issue a redundant scroll', () => {
  const h = harness(corrected, true); h.c.renderCosts(); h.main.scrollTop = 1200;
  h.flush(); assert.deepEqual(h.writes, []);
});
test('zero is preserved without scheduling an old positive offset', () => {
  const h = harness(corrected, true); h.main.scrollTop = 0; h.c.renderCosts(); h.flush();
  assert.equal(h.main.scrollTop, 0); assert.deepEqual(h.writes, []);
});
test('departing Costs retires its queued scroll', () => {
  const h = harness(corrected, true); h.c.renderCosts(); h.c.state.tab = 'demob'; h.main.scrollTop = 90;
  h.flush(); assert.equal(h.main.scrollTop, 90); assert.deepEqual(h.writes, []);
});
test('a changed address retires the queued scroll even on the same tab', () => {
  const h = harness(corrected, true); h.c.renderCosts(); h.c.location.hash = '#asset/EXAMPLE'; h.main.scrollTop = 90;
  h.flush(); assert.equal(h.main.scrollTop, 90); assert.deepEqual(h.writes, []);
});
test('a later user action wins over the old reading position', () => {
  const h = harness(corrected, true); h.c.renderCosts(); h.c.window.Persistence1010.intent++; h.main.scrollTop = 900;
  h.flush(); assert.equal(h.main.scrollTop, 900); assert.deepEqual(h.writes, []);
});
test('a same-click form jump after renderCosts keeps its destination', () => {
  const h = harness(corrected, true), form = {scrollIntoView() { h.main.scrollTop = 950; }, focus() {}};
  const marker = 'renderCosts(); const form = document.getElementById(\'fin745Form\');';
  assert.equal(source.split(marker).length, 2, 'the live form-jump caller exists once');
  const from = source.indexOf(marker), to = source.indexOf('\n', from), caller = source.slice(from, to);
  const getElementById = h.c.document.getElementById;
  h.c.document.getElementById = id => id === 'fin745Form' ? form : getElementById(id);
  vm.runInContext(caller, h.c); h.flush();
  assert.equal(h.main.scrollTop, 950); assert.deepEqual(h.writes, []);
});
test('continued scrolling without a second input event wins over restoration', () => {
  const h = harness(corrected, true); h.c.renderCosts(); h.main.scrollTop = 875;
  h.flush(); assert.equal(h.main.scrollTop, 875); assert.deepEqual(h.writes, []);
});
test('only the newest Costs render can restore its position', () => {
  const h = harness(corrected, true); h.c.renderCosts(); h.main.scrollTop = 500; h.c.renderCosts(); h.flush();
  assert.equal(h.main.scrollTop, 500); assert.deepEqual(h.writes, [500]);
});
test('a replaced pane or disconnected main cannot receive an old scroll', () => {
  for (const detach of [h => { h.c.pane = {}; }, h => { h.main.isConnected = false; }]) {
    const h = harness(corrected, true); h.c.renderCosts(); detach(h); h.main.scrollTop = 95; h.flush();
    assert.equal(h.main.scrollTop, 95); assert.deepEqual(h.writes, []);
  }
});
test('a hidden Costs refresh cannot restore another page position', () => {
  const h = harness(corrected, true); h.c.state.tab = 'plant'; h.c.renderCosts(); h.main.scrollTop = 95; h.flush();
  assert.equal(h.main.scrollTop, 95); assert.deepEqual(h.writes, []);
});
test('native return value, receiver and arguments are preserved', () => {
  const h = harness(corrected, true), self = {kind: 'caller'};
  assert.equal(h.c.renderCosts.call(self, 12, 'example'), 'native-result');
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].self, self); assert.deepEqual(h.calls[0].args, [12, 'example']);
});
test('the transformer changes only the Costs wrapper and guards its base', () => {
  const oldWrapper = getWrapper(source, false), newWrapper = getWrapper(corrected, true);
  const oldStart = source.indexOf(oldWrapper), newStart = corrected.indexOf(' // Author: Andrew Fisher. A queued Costs refresh');
  assert.equal(source.slice(0, oldStart), corrected.slice(0, newStart));
  assert.equal(source.slice(oldStart + oldWrapper.length), corrected.slice(corrected.indexOf(newWrapper) + newWrapper.length));
  const code = "import importlib.util,sys; s=importlib.util.spec_from_file_location('scrollpatch',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.apply(sys.stdin.read())";
  for (const [input, expected] of [[corrected, 'already present'], [source.replace(oldWrapper, ''), 'found 0'], [source + oldWrapper, 'found 2']]) {
    const r = spawnSync('python3', ['-c', code, transformer], {input, encoding: 'utf8', maxBuffer: 32e6});
    assert.notEqual(r.status, 0); assert(r.stderr.includes(expected), r.stderr);
  }
});
console.log('PASS ' + total + ' Costs scroll scenarios');
