/* Author: Andrew Fisher. Manual camera behaviour against real Three.js vectors.
 * WORKSHOP_SOURCE=/private/verified-machine node tests/test_camera1305.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
assert.ok(process.env.WORKSHOP_SOURCE, 'Set WORKSHOP_SOURCE to the verified complete machine');
const T = await import(pathToFileURL(path.join(process.env.WORKSHOP_SOURCE, 'vendor/three.module.js')).href);
const threeUrl = pathToFileURL(path.join(process.env.WORKSHOP_SOURCE, 'vendor/three.module.js')).href;
const orbitSource = fs.readFileSync(path.join(process.env.WORKSHOP_SOURCE, 'vendor/OrbitControls.js'), 'utf8')
  .replace(/from ['"]three['"]/, 'from ' + JSON.stringify(threeUrl));
const {OrbitControls} = await import('data:text/javascript;base64,' + Buffer.from(orbitSource).toString('base64'));
const {installWorkshopCamera} = await import(pathToFileURL(path.join(here, '../workshop-camera.js')).href);
let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks++; };
const near = (a, b, message, epsilon = 1e-9) => check(a.distanceTo(b) <= epsilon, message);
class InputSurface {
  constructor() { this.events = new Map(); }
  addEventListener(name, handler) { if (!this.events.has(name)) this.events.set(name, new Set()); this.events.get(name).add(handler); }
  removeEventListener(name, handler) { this.events.get(name)?.delete(handler); }
  dispatch(name) { for (const fn of this.events.get(name) || []) fn({type: name}); }
  get listeners() { return [...this.events.values()].reduce((n, set) => n + set.size, 0); }
}
function make({position = [0, 3, 8], target = [0, 0, 0], reduced = false, autoRotate = false} = {}) {
  const camera = new T.PerspectiveCamera(35, 1, .018, 160); camera.position.fromArray(position);
  const controls = new T.EventDispatcher(); Object.assign(controls, {target: new T.Vector3(...target), minDistance: .05,
    maxDistance: 30, enableDamping: true, enabled: true, autoRotate, residue: 0, updates: 0});
  controls.update = () => {
    controls.updates++;
    const delta = controls.residue * (controls.enableDamping ? .1 : 1);
    controls.target.x += delta; camera.position.x += delta;
    controls.residue = controls.enableDamping ? controls.residue * .9 : 0;
    camera.lookAt(controls.target);
  };
  camera.lookAt(controls.target); camera.updateMatrixWorld(true);
  const surface = new InputSurface(), changes = [], preference = {value: reduced};
  const helper = installWorkshopCamera({T, camera, controls, element: surface,
    reducedMotion: () => preference.value, onChange: reason => changes.push(reason)});
  return {camera, controls, surface, helper, changes, preference};
}
const bounds = new T.Box3(new T.Vector3(-1, -.7, -.4), new T.Vector3(1, .7, .4));
const fit = {center: new T.Vector3(), position: new T.Vector3(0, 1.4, -4), bounds, minDistance: .1, maxDistance: 12};
const originalBounds = bounds.clone(), originalFitPosition = fit.position.clone();

// Opposite-side manual inspections follow an arc outside the original part,
// instead of the straight line through its centre.
{
  const r = make({autoRotate: true}); const before = r.camera.position.clone(), target = r.controls.target.clone();
  r.controls.residue = .7;
  check(r.helper.moveTo(fit).animated && r.helper.active, 'Manual move starts a transition');
  near(r.camera.position, before, 'Starting the transition has no visible camera jump');
  near(r.controls.target, target, 'Starting the transition preserves visible focus');
  check(r.controls.residue === 0 && r.controls.enableDamping, 'Old orbit damping clears without changing damping preference');
  check(r.controls.autoRotate === false, 'Automatic rotation pauses during manual focus');
  const startRadius = before.length(), endRadius = fit.position.length(); let lastRadius = startRadius;
  for (let i = 0; i < 130; i++) {
    r.helper.update(.005);
    const radius = r.camera.position.length();
    check(!bounds.containsPoint(r.camera.position), 'Arc never enters the inspected part');
    check(radius <= lastRadius + 1e-9 && radius >= endRadius - 1e-9, 'Arc zoom has no inward overshoot');
    check([...r.camera.position, ...r.camera.quaternion, ...r.controls.target].every(Number.isFinite), 'Every intermediate pose is finite');
    lastRadius = radius;
  }
  near(r.camera.position, fit.position, 'Transition reaches the exact fitted position');
  near(r.controls.target, fit.center, 'Transition reaches the exact fitted target');
  check(!r.helper.active && r.controls.autoRotate, 'Completion releases camera ownership and restores auto-rotate');
  check(r.controls.minDistance === fit.minDistance && r.controls.maxDistance === fit.maxDistance && r.controls.enabled, 'Completion applies the requested UI zoom limits without changing control enablement');
  const changes = r.changes.length; check(!r.helper.update(1), 'Completed transition performs no further camera work');
  check(r.changes.length === changes, 'Stationary camera emits no idle invalidations');
  r.helper.dispose(); check(r.surface.listeners === 0, 'Dispose removes all canvas input listeners');
}

// Tiny-part and overview zoom ranges must coexist for the transition. Native
// interruption should not suddenly clamp the current view into the new range.
for (const [startRadius, initialMin, initialMax, endRadius, nextMin, nextMax] of [
  [.2, .05, 2, 18, 3, 30], [18, 3, 30, .2, .05, 2],
]) {
  const r = make({position: [0, 0, startRadius]});
  r.controls.minDistance = initialMin; r.controls.maxDistance = initialMax;
  const next = {center: new T.Vector3(), position: new T.Vector3(0, 0, endRadius), minDistance: nextMin, maxDistance: nextMax};
  r.helper.moveTo(next);
  check(r.controls.minDistance <= Math.min(startRadius, endRadius) && r.controls.maxDistance >= Math.max(startRadius, endRadius), 'Temporary range contains both small and large views');
  near(r.camera.position, new T.Vector3(0, 0, startRadius), 'Changing target limits never snaps the displayed start');
  r.helper.update(.2); const distance = r.camera.position.distanceTo(r.controls.target);
  r.surface.dispatch('pointerdown');
  check(r.controls.minDistance <= distance && r.controls.maxDistance >= distance, 'Input cancellation preserves a legal current view');
  check(r.controls.minDistance === Math.min(nextMin, distance) && r.controls.maxDistance === Math.max(nextMax, distance), 'Cancelled range expands destination limits only as far as current view requires');
  r.helper.moveTo(next); r.helper.update(1);
  check(r.controls.minDistance === nextMin && r.controls.maxDistance === nextMax, 'Completed focus restores exact destination zoom limits');
  r.helper.dispose();
}

// Retargeting starts from the currently visible interpolated pose, not an old
// request. Real input leaves that visible pose in place for immediate orbit.
for (const event of ['pointerdown', 'wheel', 'keydown', 'controls-start']) {
  const r = make(); r.helper.moveTo(fit); r.helper.update(.19);
  const position = r.camera.position.clone(), target = r.controls.target.clone();
  if (event === 'controls-start') r.controls.dispatchEvent({type: 'start'}); else r.surface.dispatch(event);
  check(!r.helper.active && r.helper.state.reason === 'input', event + ' immediately cancels the flight');
  check(!r.helper.update(.8), event + ' cannot resume a cancelled move');
  near(r.camera.position, position, event + ' preserves current position'); near(r.controls.target, target, event + ' preserves current target');
  r.helper.dispose();
}
{
  const r = make(); r.helper.moveTo(fit); r.helper.update(.21);
  const mid = r.camera.position.clone(), target = r.controls.target.clone();
  const next = {center: new T.Vector3(1, .3, .2), position: new T.Vector3(2, 2, 5), bounds};
  r.helper.moveTo(next); near(r.camera.position, mid, 'Retarget begins at actual displayed position'); near(r.controls.target, target, 'Retarget keeps current focus');
  r.helper.update(.65); near(r.camera.position, next.position, 'Latest request alone owns the final view');
  r.helper.dispose();
}

// Equal elapsed time yields equal framing at different refresh rates. A delayed
// frame completes exactly rather than replaying an excessively long motion.
{
  const a = make(), b = make(), c = make(); for (const r of [a, b, c]) r.helper.moveTo(fit);
  for (let i = 0; i < 30; i++) a.helper.update(.01);
  for (let i = 0; i < 10; i++) b.helper.update(.03);
  c.helper.update(.3); near(a.camera.position, b.camera.position, 'Camera path is independent of refresh rate'); near(a.camera.position, c.camera.position, 'Camera path follows elapsed time');
  a.helper.update(10); near(a.camera.position, fit.position, 'Delayed frame lands at exact destination');
  for (const r of [a, b, c]) r.helper.dispose();
}

// The real engine lift may move while the user requests an inspection. Its
// measured follow delta must shift both the displayed view and active path.
{
  const a = make(), b = make(); a.helper.moveTo(fit); b.helper.moveTo(fit);
  a.helper.update(.2); b.helper.update(.2);
  const delta = new T.Vector3(.2, .35, -.1);
  b.camera.position.add(delta); b.controls.target.add(delta);
  check(b.helper.translate(delta), 'Active path accepts actual engine-follow translation');
  a.helper.update(.2); b.helper.update(.2);
  near(b.camera.position, a.camera.position.clone().add(delta), 'Following lift never snaps flight back to old engine position');
  near(b.controls.target, a.controls.target.clone().add(delta), 'Following lift shifts inspection target by the same measured delta');
  b.helper.update(1); near(b.camera.position, fit.position.clone().add(delta), 'Translated transition ends at the moved engine');
  check(!b.helper.translate(delta), 'Completed flight leaves ordinary follow code in control');
  a.helper.dispose(); b.helper.dispose();
}

// Resize and reduced-motion changes must never leave an old camera flight to
// overwrite the newly fitted phone orientation.
{
  const r = make({reduced: true}); check(!r.helper.moveTo(fit).animated && !r.helper.active, 'Reduced motion uses instant framing'); near(r.camera.position, fit.position, 'Reduced motion still fits the part exactly');
  r.preference.value = false; const next = {center: new T.Vector3(.3, .2, .1), position: new T.Vector3(4, 3, 6)};
  r.helper.moveTo(next); r.helper.update(.1); r.preference.value = true; r.helper.update(0);
  check(!r.helper.active, 'Changing reduced-motion preference immediately ends flight'); near(r.camera.position, next.position, 'Preference change resolves to current intended view');
  r.preference.value = false; r.helper.moveTo(fit); r.helper.update(.1);
  r.helper.moveTo(next, {instant: true}); check(!r.helper.active, 'Resize replacement cancels stale movement');
  r.helper.update(1); near(r.camera.position, next.position, 'Resize view cannot be overwritten by an old transition'); r.helper.dispose();
}

// No mutation of source bounds, graceful invalid fits, and finite moves even
// when the starting camera is inside the larger destination overview bounds.
{
  const r = make({position: [0, 0, 0]}); check(r.helper.moveTo(fit).ok, 'Overview accepts a starting close-up inside its bounds');
  let previous = 0;
  for (let i = 0; i < 65; i++) { r.helper.update(.01); const radius = r.camera.position.length(); check(radius >= previous - 1e-9, 'Move out of overview bounds never dips inward'); previous = radius; }
  near(r.camera.position, fit.position, 'Interior start reaches exact overview');
  const saved = r.camera.position.clone();
  check(!r.helper.moveTo({center: new T.Vector3(), position: new T.Vector3(NaN, 0, 0)}).ok, 'Non-finite fits are rejected'); near(r.camera.position, saved, 'Invalid fit leaves camera alone');
  check(!r.helper.moveTo({center: new T.Vector3(), position: new T.Vector3()}).ok, 'Coincident camera/focus destination is rejected');
  r.helper.moveTo({...fit, position: new T.Vector3(4, 3, 6)}); const pending = r.camera.position.clone();
  check(!r.helper.update(NaN) && !r.helper.update(-1) && !r.helper.update(0), 'Invalid or zero elapsed time does not move camera'); near(r.camera.position, pending, 'Invalid time preserves pose');
  r.helper.dispose(); check(!r.helper.moveTo(fit).ok && !r.helper.update(1), 'Disposed helper cannot move camera');
}
check(bounds.equals(originalBounds), 'Source model bounds were never mutated'); near(fit.position, originalFitPosition, 'Caller fit position was never mutated');

// Actual shipped OrbitControls has a nonzero polar floor in the host. The old
// quaternion arc crossed that floor at the zenith and a mid-flight cancel then
// jumped 0.254866 m. Sample both directions using the actual host restrictions.
let maximumControlDrift = 0, maximumMillisecondStep = 0;
for (const [start, destination] of [[[0, 3, 8], [0, 1.4, -4]], [[0, 1.4, -4], [0, 3, 8]]]) {
  const camera = new T.PerspectiveCamera(35, 1, .018, 160), controls = new OrbitControls(camera, null);
  controls.minPolarAngle = .04; controls.maxPolarAngle = Math.PI * .485; controls.enableDamping = true;
  const target = new T.Vector3(), next = {center: target, position: new T.Vector3(...destination), minDistance: .05, maxDistance: 30};
  for (let n = 1; n < 650; n++) {
    camera.position.fromArray(start); controls.target.copy(target); controls.update();
    const helper = installWorkshopCamera({T, camera, controls}); helper.moveTo(next); helper.update(n / 1000);
    const before = camera.position.clone(), radius = before.distanceTo(controls.target);
    helper.cancel('input'); controls.update();
    maximumControlDrift = Math.max(maximumControlDrift, camera.position.distanceTo(before));
    near(camera.position, before, 'Actual host polar limits cause no cancellation jump', 1e-10);
    check(Math.abs(camera.position.distanceTo(controls.target) - radius) < 1e-10, 'Polar handling preserves the displayed orbit radius');
    helper.dispose();
  }
  camera.position.fromArray(start); controls.target.copy(target); controls.update();
  const helper = installWorkshopCamera({T, camera, controls}); helper.moveTo(next);
  let previous = camera.position.clone();
  for (let n = 1; n <= 650; n++) {
    controls.update(); helper.update(.001);
    const step = camera.position.distanceTo(previous); maximumMillisecondStep = Math.max(maximumMillisecondStep, step);
    check(step < .09, 'Continuous arc has no polar-cap azimuth flip'); previous.copy(camera.position);
  }
  near(camera.position, next.position, 'Legal host endpoint remains exact'); helper.dispose();
}
{
  const camera = new T.PerspectiveCamera(35, 1, .018, 160), controls = new OrbitControls(camera, null);
  camera.position.set(0, 2, 5); controls.target.set(0, 0, 0); controls.minPolarAngle = .04; controls.maxPolarAngle = Math.PI * .485;
  const helper = installWorkshopCamera({T, camera, controls});
  helper.moveTo({center: new T.Vector3(), position: new T.Vector3(0, 6, 0), minDistance: .05, maxDistance: 30}, {instant: true});
  const before = camera.position.clone(); controls.update();
  near(camera.position, before, 'Invalid polar endpoint is made legal before display');
  check(Math.abs(camera.position.length() - 6) < 1e-10, 'Constrained endpoint keeps requested orbit distance'); helper.dispose();
}
console.log(JSON.stringify({author: 'Andrew Fisher', suite: 'workshop-camera1305', checks, passed: true,
  actualOrbitControls: {maximumControlDrift, maximumMillisecondStep, minPolarAngle: .04, maxPolarAngle: Math.PI * .485}}, null, 2));
