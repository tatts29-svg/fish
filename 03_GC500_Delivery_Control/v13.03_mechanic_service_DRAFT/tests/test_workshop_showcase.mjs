/* Author: Andrew Fisher. Deterministic director/ownership and real Three camera checks.
 * Uses the original Three module; no browser, service write or network is needed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'coates-showcase-'));
try {
  const original = '03_GC500_Delivery_Control/v8.09_coates_way_machine_LIVE/work/vendor/three.module.js';
  fs.writeFileSync(path.join(temporary, 'three.mjs'), execFileSync('git', ['show', `04b39247275b6b99475185560e43828f1c8fdcec:${original}`], {cwd: repo, maxBuffer: 16 * 1024 * 1024}));
  const T = await import(pathToFileURL(path.join(temporary, 'three.mjs')).href);
  const code = fs.readFileSync(path.resolve(here, '../workshop-showcase.js'));
  const {installWorkshopShowcase} = await import(`data:text/javascript;base64,${code.toString('base64')}`);
  let checks = 0;
  const check = (condition, label) => { assert.ok(condition, label); checks++; };
  function fixture(reducedMotion = false) {
    const camera = new T.PerspectiveCamera(35, 1.5, .01, 200); camera.position.set(-5, 3, 7);
    const controls = new T.EventDispatcher(); controls.target = new T.Vector3(); controls.maxDistance = 30;
    const source = new T.Mesh(new T.BoxGeometry(.2, .3, .2), new T.MeshBasicMaterial());
    const originalGeometry = source.geometry, originalParent = new T.Group(); originalParent.add(source);
    const events = [], service = {
      active: true, playing: true, progress: 0, direction: 1,
      enter() { this.active = true; return {ok: true}; },
      setProgress(value) {
        check(!this.playing, 'Only the director advances the service during a showcase');
        if (value < .999) check(source.visible, 'Isolation is restored before the engine leaves the bench');
        this.progress = value; source.position.set(-1 + value * 2, .7 + Math.sin(value * Math.PI), value * 3);
        source.updateMatrixWorld(true); events.push('service');
      },
      setPlaying(value) { this.playing = value; },
      setDirection(value) { this.direction = value; },
      update(dt) { check(dt === 0, 'Director never runs a second service clock'); events.push('service-update'); },
      get focus() { return source.position.toArray(); },
      get bounds() { return new T.Box3().setFromCenterAndSize(source.position, new T.Vector3(2.3, 2.0, 2.8)); },
    };
    const lift = {playing: true, setPlaying(value) { this.playing = value; }, get diagnostics() { return {loadWorld: source.position.toArray()}; }, get bounds() { return service.bounds; }};
    const learning = {
      active: false, angle: 0, selected: '',
      setMode() { if (service.progress < .999) return {ok: false}; this.active = true; return {ok: true}; },
      selectPart(id) { this.selected = id; }, setCutaway() {},
      update(dt) { check(dt === 0, 'Learning refresh has no extra time step'); events.push('learning'); },
      reset() { this.active = false; this.angle = 0; },
      get focus() { return source.position.clone(); },
    };
    const lessons = {
      mode: 'none', angle: 0, rotation: 0, playing: true,
      setMode(value) { check(learning.active, 'Open the bench before lessons'); this.mode = value; source.visible = value !== 'isolate'; return {ok: true}; },
      setCycleAngle(value) { this.angle = learning.angle = value; }, setRotation(value) { this.rotation = value; },
      setPlaying(value) { this.playing = value; },
      reset() { this.mode = 'none'; this.angle = this.rotation = 0; source.visible = true; },
      update(dt) { check(dt === 0, 'Lessons refresh has no extra time step'); check(events.at(-1) === 'learning', 'Lessons follow learning in the same frame'); events.push('lessons'); },
      get bounds() { return new T.Box3().setFromCenterAndSize(source.position, new T.Vector3(.2, .3, .2)); },
      get focus() { return source.position.clone(); },
    };
    const api = installWorkshopShowcase({T, camera, controls, service, lift, learning, lessons, reducedMotion});
    return {api, camera, controls, source, originalGeometry, originalParent, service, lift, learning, lessons, events};
  }
  const f = fixture(), {api, camera, controls, source, service, lift, lessons} = f;
  check(api.start().ok && api.active && api.playing, 'Explicit start opens and plays the director');
  check(!service.playing && !lift.playing && !lessons.playing, 'Every autonomous child clock is paused');
  const initial = camera.position.clone(); api.update(.1);
  check(camera.position.distanceTo(initial) < 1, 'Opening shot blends from the user camera');
  const snapshot = () => ({service: service.progress, direction: service.direction, mode: lessons.mode, angle: lessons.angle, rotation: lessons.rotation, sourceVisible: source.visible, sourcePosition: source.position.toArray(), camera: camera.position.toArray(), target: controls.target.toArray(), step: api.step});
  const seen = new Map();
  for (const progress of [0, .07, .19, .32, .46, .55, .63, .70, .80, .91, 1]) {
    check(api.seek(progress).ok, 'Every direct seek is available');
    check(!api.playing && api.progress === progress, 'Scrubbing pauses at its exact position');
    check(camera.position.toArray().every(Number.isFinite), 'All shots have finite camera coordinates');
    seen.set(progress, snapshot());
  }
  for (const progress of [...seen.keys()].reverse()) {
    api.seek(progress); assert.deepEqual(snapshot(), seen.get(progress), 'Reverse seek reaches the exact same model and camera pose'); checks++;
  }
  api.seek(70 / 126);
  check(api.step === 'cycle' && lessons.mode === 'cycle' && service.progress === 1, 'Four-stroke explanation stays on the supported bench');
  check(Math.abs(lessons.angle - (8 / 20) * 4 * Math.PI) < 1e-10, 'Cycle angle follows timeline, not frame count');
  api.seek(88 / 126);
  check(lessons.mode === 'isolate' && !source.visible && lessons.angle === 4 * Math.PI, 'Direct component seek has the same completed-cycle pose');
  const benchPosition = service.progress;
  api.stop();
  check(!api.active && source.visible && lessons.mode === 'none', 'Stopping restores the original component');
  check(service.active && service.progress === benchPosition, 'Stopping leaves workshop controls at the current service pose');
  check(source.geometry === f.originalGeometry && source.parent === f.originalParent, 'Director never replaces geometry or reparents the source');
  check(controls.maxDistance === 30, 'Camera constraint ownership is returned');
  api.start(); api.seek(110 / 126);
  check(service.direction === -1, 'Refit uses reverse mechanic cues');
  const partialRefit = service.progress; api.stop();
  check(service.direction === -1 && service.progress === partialRefit, 'Manual Continue retains refit direction after leaving the tour');
  api.start(); check(service.direction === 1, 'A new showcase clears a previous refit direction'); api.stop();
  api.start(); api.seek(.34); api.resume(); api.update(.1);
  controls.dispatchEvent({type: 'start'});
  const pausedAt = api.progress;
  camera.position.set(7, 3, -4); controls.target.set(1, 1, 1);
  const userCamera = camera.position.clone(), userTarget = controls.target.clone();
  api.update(.2);
  check(!api.playing && api.state.pauseReason === 'orbit' && api.progress === pausedAt, 'Orbit pauses the story');
  check(camera.position.equals(userCamera) && controls.target.equals(userTarget), 'Paused director leaves orbit fully usable');
  api.resume(); api.update(0);
  check(camera.position.distanceTo(userCamera) < 1e-10 && controls.target.distanceTo(userTarget) < 1e-10, 'Resume begins at the exact user camera');
  api.update(.1); check(camera.position.distanceTo(userCamera) < 1, 'Resume moves smoothly rather than jumping to its shot');
  const progressBeforeBadStep = api.progress; api.update(NaN); check(api.progress === progressBeforeBadStep, 'Invalid frame delta does not corrupt the sequence');
  check(!api.seek(NaN).ok && Number.isFinite(api.progress), 'Invalid seeks are rejected');
  api.seek(1); check(api.state.pauseReason === 'complete' && !api.playing && service.progress === 0, 'Completion returns the engine and stops');
  api.resume(); check(api.playing && api.progress === 0, 'Explicit replay begins a new sequence');
  api.stop(); api.stop(); api.dispose();
  check(!api.start().ok, 'Disposed director cannot restart');

  // Real Three projection, portrait framing and control-dock offset. Every
  // actual source-bound corner must fit the rendered viewport, not just a radius.
  const phone = fixture(); phone.camera.aspect = .56; phone.camera.setViewOffset(448, 800, 0, 120, 448, 800); phone.camera.updateProjectionMatrix();
  phone.api.start();
  for (const progress of [33 / 126, 71 / 126, 88 / 126, 113 / 126]) {
    phone.api.seek(progress);
    const bounds = /cycle|component/.test(phone.api.step) ? phone.lessons.bounds : phone.service.bounds;
    phone.camera.updateMatrixWorld(true);
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const projected = new T.Vector3(x, y, z).project(phone.camera);
      check(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && projected.z > -1 && projected.z < 1, 'Actual action bounds fit the portrait viewport');
    }
  }
  phone.api.dispose();
  const reduced = fixture(true); reduced.api.start(); reduced.api.seek(84 / 126); reduced.api.resume();
  const reducedCamera = reduced.camera.position.clone(); reduced.api.update(.2);
  check(reduced.lessons.rotation === 0, 'Reduced motion never auto-spins the component');
  check(reduced.camera.position.equals(reducedCamera), 'Reduced motion holds each intentional shot');
  check(reduced.api.progress > 84 / 126, 'Explicit play still operates the reduced-motion sequence');
  reduced.api.seek(.4); reduced.api.resume(); const beforeReducedService = reduced.service.progress; reduced.api.update(.2);
  check(reduced.service.progress > beforeReducedService, 'Reduced motion keeps the real service master operating');
  reduced.api.dispose();
  console.log(JSON.stringify({ok: true, checks, shots: 7, durationSeconds: 126, source: '04b39247275b6b99475185560e43828f1c8fdcec'}, null, 2));
} finally { fs.rmSync(temporary, {recursive: true, force: true}); }
