/* Author: Andrew Fisher. Workshop draw scheduling and final-pose shadow regression.
 * Pure model/controller checks; no browser or network. Actual device performance
 * is intentionally outside this test's claims.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const modulePath = new URL('../workshop-render.js', import.meta.url);
const {createWorkshopRenderControl} = await import(`data:text/javascript;base64,${fs.readFileSync(modulePath).toString('base64')}`);
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
function events() {
  const callbacks = new Map();
  return {
    addEventListener(type, fn) { if (!callbacks.has(type)) callbacks.set(type, new Set()); callbacks.get(type).add(fn); },
    removeEventListener(type, fn) { callbacks.get(type)?.delete(fn); },
    emit(type) { for (const fn of callbacks.get(type) || []) fn({type}); },
    count() { return [...callbacks.values()].reduce((count, set) => count + set.size, 0); },
  };
}
function fixture(options = {}) {
  const eventTarget = events(), control = createWorkshopRenderControl({eventTarget, ...options});
  const workshop = {
    active: true, shadowDirty: false,
    service: {progress: 0, direction: 1, stage: 'Disconnect', playing: false},
    learning: {state: {active: false, mode: 'inspect', cutaway: true, selectedId: 'crankshaft', crankAngle: 0, challenge: null}, diagnostics: {oilTravel: 0}},
    lessons: {state: {active: false, kind: 'none', crankAngle: 0, rotation: 0, reducedMotion: false, playing: false}},
    showcase: {active: false, playing: false, progress: 0},
  };
  const camera = {position: {x: -5, y: 3, z: 7}, quaternion: {x: 0, y: 0, z: 0, w: 1}, zoom: 1, near: .018, far: 160, fov: 35, aspect: 1.5,
    projectionMatrix: {elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]}};
  const renderer = {domElement: {width: 1440, height: 900}, getPixelRatio: () => 1};
  const input = {now: 0, workshop, camera, renderer, quality: 'laptop', detailKey: 0, externalMotion: false, shadowDirty: false};
  const step = (now, patch = {}) => { Object.assign(input, patch, {now}); const decision = control.plan(input); if (decision.draw) control.commit(decision); return decision; };
  return {control, eventTarget, workshop, camera, renderer, input, step};
}

// A stale final shadow in v13.03: progress changes at t=33 (<66 ms throttle),
// stops there, then no later before/after change exists to request the map.
{
  const f = fixture({idleReuse: false}); f.workshop.service.playing = true;
  check(f.step(0).shadow, 'First moving pose establishes its shadow');
  f.workshop.service.progress = .2;
  check(!f.step(33).shadow && f.control.diagnostics.pendingShadow, 'Moving pose is retained as pending inside shadow throttle');
  f.workshop.service.playing = false;
  check(f.step(34).shadow && !f.control.diagnostics.pendingShadow, 'Pause flushes the final pending pose without another change');
  check(!f.step(35).shadow, 'An unchanged final pose does not keep redrawing its shadow');
  f.workshop.lessons.state.active = true; f.workshop.lessons.state.kind = 'cycle'; f.workshop.lessons.state.playing = true;
  f.workshop.lessons.state.crankAngle = .3; f.step(40);
  check(f.control.diagnostics.pendingShadow, 'Running cylinder rotation inside throttle stays pending');
  f.workshop.lessons.state.playing = false;
  check(f.step(41).shadow, 'Stopping the cycle flushes its final crank-angle shadow');
  f.workshop.lessons.state.kind = 'isolate'; f.workshop.lessons.state.rotation = Math.PI / 4;
  check(f.step(42).shadow, 'Manual part rotation draws its final shadow immediately');
  f.control.dispose();
}

// Reuse identical stationary pictures while retaining a bounded asynchronous-
// texture refresh. Moving and unsettled pictures still draw on every host tick.
let idleMetrics;
{
  const f = fixture(), snapshot = JSON.stringify({workshop: f.workshop, camera: f.camera, width: f.renderer.domElement.width, height: f.renderer.domElement.height});
  const decisions = [];
  for (let i = 0; i <= 300; i++) decisions.push(f.step(i * (1000 / 30)));
  const stationary = decisions.filter(x => x.idle);
  check(stationary.length > 260, 'Stable workshop enters idle after its one-second settle window');
  check(decisions.slice(0, 30).every(x => x.draw), 'Initial settling paints every host tick');
  check(f.control.diagnostics.reused > 220, 'More than 220 duplicate GPU draws are avoided in ten stationary seconds');
  let previous = null, maxGap = 0;
  for (const d of decisions) if (d.draw) { if (previous !== null) maxGap = Math.max(maxGap, d.now - previous); previous = d.now; }
  check(maxGap <= 250 + 1000 / 30 + 1e-6, 'Refresh gap is bounded by250ms plus one host tick');
  check(decisions.filter(x => x.resetTiming).length === 1, 'Entering idle explicitly resets performance sampling once');
  check(JSON.stringify({workshop: f.workshop, camera: f.camera, width: f.renderer.domElement.width, height: f.renderer.domElement.height}) === snapshot, 'Scheduling changes no model, camera, quality or canvas dimensions');
  idleMetrics = {...f.control.diagnostics, maxRefreshGapMs: maxGap};
  f.control.dispose();
}

// Every visual dependency represented by the current workshop wakes a settled
// picture in the same update, including a camera change made by the showcase.
const mutations = [
  ['service seek', f => f.workshop.service.progress = .3],
  ['refit direction', f => f.workshop.service.direction = -1],
  ['service stage', f => f.workshop.service.stage = 'Rig'],
  ['bench open', f => f.workshop.learning.state.active = true],
  ['oil route', f => f.workshop.learning.state.mode = 'oil'],
  ['cutaway', f => f.workshop.learning.state.cutaway = false],
  ['selected component', f => f.workshop.learning.state.selectedId = 'piston-1'],
  ['hand crank', f => f.workshop.learning.state.crankAngle = Math.PI / 4],
  ['full-cycle flow distance', f => f.workshop.learning.diagnostics.oilTravel = .2],
  ['fault selection', f => f.workshop.learning.state.challenge = {id: 'oil-pump', status: 'searching'}],
  ['cycle lesson', f => f.workshop.lessons.state.active = true],
  ['lesson mode', f => f.workshop.lessons.state.kind = 'isolate'],
  ['lesson crank', f => f.workshop.lessons.state.crankAngle = Math.PI],
  ['component rotation', f => f.workshop.lessons.state.rotation = Math.PI / 4],
  ['reduced motion', f => f.workshop.lessons.state.reducedMotion = true],
  ['showcase selection', f => f.workshop.showcase.active = true],
  ['showcase seek', f => f.workshop.showcase.progress = .3],
  ['camera position', f => f.camera.position.x += .01],
  ['camera quaternion', f => f.camera.quaternion.y += .001],
  ['camera lens', f => f.camera.fov = 38],
  ['camera zoom', f => f.camera.zoom = 1.1],
  ['camera aspect', f => f.camera.aspect = .75],
  ['camera view offset', f => f.camera.projectionMatrix.elements[8] = .1],
  ['canvas resize', f => f.renderer.domElement.width = 900],
  ['pixel ratio', f => f.renderer.getPixelRatio = () => 2],
  ['quality change', f => f.input.quality = 'balanced'],
  ['detail visibility', f => f.input.detailKey = 1],
  ['host resize invalidation', f => f.control.invalidate('resize')],
  ['quality shadow map', f => f.input.shadowDirty = true],
  ['workshop control invalidation', f => f.workshop.shadowDirty = true],
];
for (const [name, mutate] of mutations) {
  const f = fixture(); f.step(0); f.step(1000); f.step(1010); check(f.control.idle, `${name}: fixture is settled`);
  mutate(f); const decision = f.step(1020);
  check(decision.draw && !decision.idle && decision.resetTiming, `${name} wakes a stationary picture immediately`);
  f.control.dispose();
}
for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'wheel', 'click', 'input', 'change', 'keydown', 'keyup', 'visibilitychange']) {
  const f = fixture(); f.step(0); f.step(1000); f.step(1010); f.eventTarget.emit(type);
  check(f.step(1020).draw && !f.control.idle, `${type} invalidates an idle canvas`);
  f.control.dispose(); check(f.eventTarget.count() === 0, `${type} listener is removed on disposal`);
}
for (const start of [
  f => f.workshop.service.playing = true,
  f => f.workshop.lessons.state.playing = true,
  f => f.workshop.showcase.playing = true,
  f => f.input.externalMotion = true,
]) {
  const f = fixture(); start(f); const decisions = [];
  for (let i = 0; i < 100; i++) decisions.push(f.step(i * 40));
  check(decisions.every(d => d.draw && !d.idle) && f.control.diagnostics.reused === 0, 'Active animation never drops an intentional render');
  f.control.dispose();
}
{
  const f = fixture(); f.step(0); f.step(1000); f.step(1010);
  f.workshop.active = false;
  const exited = f.step(1020);
  check(exited.draw && exited.resetTiming && !f.control.idle, 'Exiting restores the normal drawing/performance path');
  f.workshop.active = true;
  check(f.step(1021).draw && f.control.diagnostics.pendingShadow === false, 'Re-entry redraws and shadow-renders from a clean baseline');
  const decision = f.control.plan({...f.input, now: 1030, shadowDirty: true});
  f.control.commit(decision);
  assert.throws(() => f.control.commit(decision), /current workshop draw/); checks++;
  check(f.step(0).draw, 'Clock reversal invalidates prior frame reuse');
  f.control.dispose(); f.control.dispose();
  check(f.eventTarget.count() === 0 && f.control.diagnostics.disposed, 'Repeated disposal is safe and releases every listener');
  assert.throws(() => f.step(0), /disposed/); checks++;
}
{
  const f = fixture(); f.workshop.learning = null; f.step(0);
  check(f.step(10000).draw && !f.control.idle, 'Incomplete future workshop context fails open to rendering');
  f.control.dispose();
}
for (const options of [{settleMs: -1}, {refreshMs: 0}, {shadowMs: NaN}]) { assert.throws(() => createWorkshopRenderControl(options)); checks++; }
console.log(JSON.stringify({author: 'Andrew Fisher', suite: 'workshop-render1304', passed: true, checks,
  idleMetrics, scope: 'Pure draw/shadow scheduling; no physical-device frame-rate claim.'}, null, 2));
