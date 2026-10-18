/* Author: Andrew Fisher. Exercise the actual selected-ripple source with a deterministic clock. */
'use strict';
const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
const [basePath, candidatePath] = process.argv.slice(2);
assert(basePath && candidatePath, 'Usage: node test_ripple1065.cjs BASE_PAGE CANDIDATE_PAGE');
function extract(file) {
  const source = fs.readFileSync(file, 'utf8');
  const selection = source.match(/const sk = selected \? selected\.code : '';[^\n]+/g);
  assert.equal(selection?.length, 1, 'exactly one selection transition');
  const start = source.indexOf('  function beat(t){');
  assert(start >= 0 && source.indexOf('  function beat(t){', start + 1) < 0);
  const end = source.indexOf('  /* the tick and the reference inside the shape', start);
  assert(end > start, 'exact current beat function boundary');
  return {selection: selection[0], beat: source.slice(start, end)};
}
const before = extract(basePath), after = extract(candidatePath);
assert.notEqual(after.selection, before.selection);
assert.notEqual(after.beat, before.beat);
let count = 0;
function check(name, test) { test(); count++; console.log('PASS ' + name); }
function fixture(source) {
  const calls = [], timers = [], done = {id: 'done'};
  const state = {visible: true, quiet: false, now: 0};
  const context = {
    BEAT: {sel: null, selKey: '', selStart: 0, done: [], doneKey: '', doneStart: 0, raf: 0, wait: 0, frames: 0},
    beatLayer: {width: 100, height: 100, style: {display: 'none'}},
    layer: {width: 100, height: 100}, bg: {setTransform() {}, clearRect() {}},
    seen: () => state.visible, still: () => state.quiet, interacting: false,
    performance: {now: () => state.now}, selected: null,
    setTimeout(fn, delay) { timers.push(delay); return timers.length; },
    requestAnimationFrame() { return 1; }, kick() {},
    ripple(object, phase, colour, width) { calls.push({id: object.id, phase, colour, width}); }
  };
  vm.createContext(context); vm.runInContext(source.beat, context);
  return {context, state, calls, timers, done,
    select(id, time) { state.now = time; context.selected = id ? {code: id} : null; context.BEAT.sel = id ? {id} : null; vm.runInContext('(() => { ' + source.selection + '\n })()', context); },
    step(time) { calls.length = 0; context.beat(time); return calls.slice(); }
  };
}
check('reproduces old first-visible ripple starting halfway through the glide', () => {
  const f = fixture(before); f.select('A', 100); f.context.interacting = true;
  assert.deepEqual(f.step(100), []); f.context.interacting = false;
  assert.equal(f.step(900)[0].phase, 0.5);
});
check('new pick starts at zero after camera movement, even after a full old cycle', () => {
  for (const delay of [16, 800, 7000]) {
    const f = fixture(after); f.select('A', 100); f.context.interacting = true;
    assert.deepEqual(f.step(100), []); assert.equal(f.context.BEAT.selStart, null);
    f.context.interacting = false;
    assert.equal(f.step(100 + delay)[0].phase, 0);
    assert.equal(f.context.BEAT.selStart, 100 + delay);
  }
});
check('immediate pick starts at zero and then advances normally', () => {
  const f = fixture(after); f.select('A', 100);
  assert.equal(f.step(116)[0].phase, 0);
  assert.equal(f.step(516)[0].phase, 0.25);
});
check('zero clock timestamp is a valid start, not a pending sentinel', () => {
  const f = fixture(after); f.select('A', 0);
  assert.equal(f.step(0)[0].phase, 0);
  assert.equal(f.step(400)[0].phase, 0.25);
});
check('new pick remains pending while the map is hidden', () => {
  const f = fixture(after); f.state.visible = false; f.select('A', 100);
  assert.deepEqual(f.step(500), []); assert.equal(f.context.BEAT.selStart, null);
  assert.equal(f.context.beatLayer.style.display, 'none'); f.state.visible = true;
  assert.equal(f.step(2000)[0].phase, 0);
});
check('new pick remains pending with reduced motion or project Motion Off', () => {
  const f = fixture(after); f.state.quiet = true; f.select('A', 100);
  assert.deepEqual(f.step(500), []); assert.equal(f.context.BEAT.selStart, null);
  assert.equal(f.context.beatLayer.style.display, 'none'); assert.equal(f.timers.at(-1), 1000);
  f.state.quiet = false; assert.equal(f.step(2200)[0].phase, 0);
});
check('paint of the same selection does not restart an active ripple', () => {
  const f = fixture(after); f.select('A', 100); f.step(116); f.select('A', 300);
  assert.equal(f.context.BEAT.selStart, 116); assert.equal(f.step(516)[0].phase, 0.25);
});
check('a different selection starts its own first-visible ripple', () => {
  const f = fixture(after); f.select('A', 100); f.step(116); f.select('B', 300);
  assert.equal(f.context.BEAT.selStart, null); const calls = f.step(800);
  assert.equal(calls[0].id, 'B'); assert.equal(calls[0].phase, 0);
});
check('clearing and reselecting the same item starts afresh', () => {
  const f = fixture(after); f.select('A', 100); f.step(116); f.select(null, 300);
  assert.equal(f.context.BEAT.selStart, 0); assert.deepEqual(f.step(350), []);
  f.select('A', 400); assert.equal(f.step(450)[0].phase, 0);
});
check('clearing a pending pick never renders its abandoned ripple', () => {
  const f = fixture(after); f.select('A', 100); f.context.interacting = true; f.step(100);
  f.select(null, 200); f.context.interacting = false; assert.deepEqual(f.step(900), []);
});
check('hiding an already-started ripple preserves its existing phase', () => {
  const f = fixture(after); f.select('A', 100); f.step(116);
  f.state.visible = false; assert.deepEqual(f.step(300), []);
  f.state.visible = true; assert.equal(f.step(916)[0].phase, 0.5);
});
check('movement after the first visible frame does not restart the cycle', () => {
  const f = fixture(after); f.select('A', 100); f.step(116); f.context.interacting = true;
  assert.deepEqual(f.step(300), []); assert.equal(f.timers.at(-1), 300);
  f.context.interacting = false; assert.equal(f.step(916)[0].phase, 0.5);
});
check('existing second-ring cadence and resting interval are unchanged', () => {
  const a = fixture(before), b = fixture(after); a.select('A', 100); b.select('A', 100); b.step(100);
  for (const t of [500, 900, 1700, 2500, 3299, 3300, 6499, 6500]) {
    assert.deepEqual(b.step(t), a.step(t)); assert.equal(b.context.beatLayer.style.display, a.context.beatLayer.style.display);
    assert.equal(b.timers.at(-1), a.timers.at(-1));
  }
});
check('Done-only pulse timing is unchanged', () => {
  const a = fixture(before), b = fixture(after);
  for (const f of [a, b]) { f.context.BEAT.done = [f.done]; f.context.BEAT.doneStart = 50; }
  for (const t of [50, 300, 700, 1349, 1350, 3249, 3250]) assert.deepEqual(b.step(t), a.step(t));
});
check('pending selection does not reset simultaneous Done timing', () => {
  const a = fixture(before), b = fixture(after);
  for (const f of [a, b]) { f.context.BEAT.done = [f.done]; f.context.BEAT.doneStart = 50; f.select('A', 100); }
  const doneCalls = calls => calls.filter(c => c.id === 'done');
  assert.deepEqual(doneCalls(b.step(1000)), doneCalls(a.step(1000)));
});
console.log(`PASS ${count} exact-source ripple checks; no browser, network, or record writes`);
