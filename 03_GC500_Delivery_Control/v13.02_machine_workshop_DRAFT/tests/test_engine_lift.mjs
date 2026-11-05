/* Author: Andrew Fisher.
 * Read-only geometry/lifecycle test. Uses the original car and powertrain builders
 * from the exact shared source commit; the crane transforms are a small fixture.
 * No browser, network request, record write or installed dependency is required.
 * node 03_GC500_Delivery_Control/v13.02_machine_workshop_DRAFT/tests/test_engine_lift.mjs
 * Optional ENGINE_LIFT_SOURCE points to an already-extracted original work folder.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const commit = '04b39247275b6b99475185560e43828f1c8fdcec';
const prefix = '03_GC500_Delivery_Control/v8.09_coates_way_machine_LIVE/work/';
let temporary = null;
let source = process.env.ENGINE_LIFT_SOURCE;
if (!source) {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'coates-engine-lift-'));
  source = temporary;
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', commit, '--', prefix], {cwd: repo, encoding: 'utf8'}).trim().split('\n');
  for (const filename of files) {
    if (!filename.endsWith('.js')) continue;
    const relative = filename.slice(prefix.length), target = path.join(source, relative);
    assert.ok(filename.startsWith(prefix) && !relative.split('/').includes('..'));
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, execFileSync('git', ['show', `${commit}:${filename}`], {cwd: repo, maxBuffer: 16 * 1024 * 1024}));
  }
  fs.writeFileSync(path.join(source, 'package.json'), '{"type":"module"}');
}

try {
  const original = filename => import(pathToFileURL(path.join(source, filename)).href);
  const T = await original('vendor/three.module.js');
  const {buildPowertrain} = await original('car-powertrain.js');
  const {buildCarBody} = await original('car-body.js');
  const {fitCarMechanics} = await original('car-fit.js');
  const code = fs.readFileSync(path.resolve(here, '../engine-lift-preview.js'));
  const {installEngineLiftPreview} = await import(`data:text/javascript;base64,${code.toString('base64')}`);
  const scene = new T.Scene(), engine = buildPowertrain(T), body = buildCarBody(T);
  fitCarMechanics(T, body, engine); scene.add(engine.root, body.root);
  const bonnet = body.removable.find(part => part.id === 'CAR-BODY-BONNET').group;
  bonnet.visible = false;
  for (const part of engine.removable) if (/^(airbox|valve-cover)/.test(part.id)) part.group.visible = false;

  const studioRoot = new T.Group(), machinery = new T.Group(); scene.add(studioRoot); studioRoot.add(machinery);
  const bridge = new T.Group(), trolley = new T.Group(), hook = new T.Group(), drum = new T.Group(), ropes = new T.Group();
  bridge.position.x = 13; machinery.add(bridge); bridge.add(trolley); trolley.position.z = -4;
  trolley.add(hook, drum, ropes); hook.position.y = 4.6;
  drum.name = 'crane hoist drum'; ropes.name = 'crane ropes'; ropes.position.y = 9.1;
  studioRoot.userData.machinery = {group: machinery, crane: {bridge, trolley, hook}, state: {crane: {x: 13, z: -4, hook: 4.6}}};
  const drive = {running: false, stationary: true, assembled: true, locked: false, stop() { this.running = false; }};
  const api = installEngineLiftPreview({T, scene, engine, body, studioRoot, drive});
  scene.updateMatrixWorld(true);
  const before = new Map();
  scene.traverse(object => {
    let ancestor = object;
    while (ancestor) { if (ancestor.name === 'Illustrative engine lift preview') return; ancestor = ancestor.parent; }
    before.set(object, {parent: object.parent, children: object.children.slice(), position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(), visible: object.visible});
  });
  let checks = 0;
  const check = (condition, description) => { assert.ok(condition, description); checks++; };
  check(api.enter().ok, 'A stationary assembled machine can enter');
  check(api.partIds.length === 101, 'Exactly 101 existing engine components selected');
  const lifted = new Set(api.partIds);
  for (const id of ['cockpit', 'gearbox', 'prop-shaft', 'rear-differential', 'front-suspension', 'rear-suspension', 'cooling-system', 'steering-rack']) check(!lifted.has(id), `${id} stays on the car`);
  const originalIds = new Map(engine.removable.map(part => [part.id, part.group]));
  const slingLengths = [];
  const positions = [];
  for (let step = 0; step <= 100; step++) {
    const progress = step / 100;
    // Model the host's per-frame reset to original part-local positions.
    for (const part of engine.removable) part.group.position.fromArray(part.home);
    api.setProgress(progress); api.update(0);
    check(api.active && drive.locked && !drive.running, `Progress ${progress}: drive remains stopped and locked`);
    check(api.diagnostics.loadWorld.every(Number.isFinite), 'Finite load pose');
    for (const part of engine.removable) {
      check(originalIds.get(part.id) === part.group, `${part.id} object identity retained`);
      if (!lifted.has(part.id)) check(part.group.parent === engine.root, `${part.id} parent remains fixed`);
      else check(part.group.visible, `${part.id} complete engine visibility`);
    }
    const lengths = [];
    scene.traverse(object => { if (object.name === 'Engine sling') lengths.push(object.scale.y); });
    if (!step) slingLengths.push(...lengths);
    else check(lengths.every((value, i) => Math.abs(value - slingLengths[i]) < 1e-9), 'Slings retain length throughout lift');
    const rig = scene.getObjectByName('Engine lifting beam and hook'), hoistLines = [];
    scene.traverse(object => { if (object.name === 'Tensioned hoist rope') hoistLines.push(object); });
    check(hoistLines.length === 2 && ropes.visible === false, 'Two tensioned lines replace the hidden straight-rope illustration');
    for (let i = 0; i < 2; i++) {
      const line = hoistLines[i], z = i ? .3 : -.3;
      const upper = new T.Vector3(0, -.5, 0).applyMatrix4(line.matrixWorld);
      const lower = new T.Vector3(0, .5, 0).applyMatrix4(line.matrixWorld);
      check(upper.distanceTo(new T.Vector3(0, 9.1, z).applyMatrix4(trolley.matrixWorld)) < 1e-9, 'Hoist line meets its trolley anchor');
      check(lower.distanceTo(new T.Vector3(0, .5, z).applyMatrix4(rig.matrixWorld)) < 1e-9, 'Hoist line meets the hook block');
    }
    positions.push(api.diagnostics.loadWorld);
  }
  check(api.stage === 'Engine supported on the service bench' && api.benchReady, 'Supported service-bench end stage');
  check(positions.slice(0, 13).every(p => p.every((v, i) => Math.abs(v - positions[0][i]) < 1e-9)), 'Prepared first stage holds still');
  check(positions.slice(0, 49).every(p => Math.abs(p[0] - positions[0][0]) < 1e-9 && Math.abs(p[2] - positions[0][2]) < 1e-9), 'Vertical clearance before traverse');
  const sump = engine.removable.find(part => part.id === 'oil-pan').group.children.find(child => child.name.startsWith('Cast sump'));
  const sumpBox = new T.Box3().setFromObject(sump);
  let pads = 0, feet = 0;
  scene.traverse(object => {
    if (object.name === 'Cradle contact pad') {
      const box = new T.Box3().setFromObject(object), centre = box.getCenter(new T.Vector3());
      check(Math.abs(box.max.y - sumpBox.min.y) < .001, 'Sump casting contacts padded saddle');
      check(centre.x > sumpBox.min.x && centre.x < sumpBox.max.x, 'Saddle lies under sump length');
      check(box.max.z > sumpBox.min.z && box.min.z < sumpBox.max.z, 'Saddle overlaps sump width'); pads++;
    }
    if (object.name === 'Cradle foot' || object.name === 'Bonnet stand foot') {
      check(Math.abs(new T.Box3().setFromObject(object).min.y + .004) < 1e-8, 'Feet meet existing epoxy floor'); feet++;
    }
  });
  check(pads === 2 && feet === 6, 'Two load saddles and six grounded feet');
  check(!!scene.getObjectByName('Workshop service tray') && !!scene.getObjectByName('Under-engine catch tray'), 'Supported inspection bench includes tool and catch trays');
  check(!!scene.getObjectByName('Hex-head fasteners') && !!scene.getObjectByName('Weld bead seams'), 'Instanced mechanical hardware and weld details exist');
  check(scene.getObjectByName('Lifting beam').geometry.type === 'ExtrudeGeometry', 'Coated steel edge bevels are actual geometry');
  check(scene.getObjectByName('Lifting beam').castShadow && scene.getObjectByName('Cradle upright').castShadow, 'Main lifting and supporting structures cast shadows');
  for (const name of ['Engine sling', 'Tensioned hoist rope', 'Cradle contact pad', 'Hex-head fasteners', 'Weld bead seams']) {
    const detail = scene.getObjectByName(name); check(!detail.castShadow && detail.receiveShadow, `${name} keeps shading without a small extra shadow draw`);
  }
  const supported = api.diagnostics.loadWorld.slice();
  for (let i = 0; i < 8; i++) api.update(.1);
  check(api.diagnostics.loadWorld.every((value, i) => value === supported[i]), 'Supported bench stays still while paused');

  // Reverse uses precisely the same geometric path, including travel response.
  api.setDirection(-1);
  for (let step = 100; step >= 0; step--) {
    api.setProgress(step / 100);
    check(api.diagnostics.loadWorld.every((value, i) => Math.abs(value - positions[step][i]) < 1e-10), 'Reverse retraces the same load path');
  }
  check(api.stage === 'Engine refitted in the bay' && !api.benchReady, 'Refit reaches the exact original engine position');
  api.setDirection(1); api.setProgress(.6);
  const withResponse = api.diagnostics.loadWorld.slice();
  api.setReducedMotion(true); const reducedPose = api.diagnostics.loadWorld.slice();
  check(api.reducedMotion && withResponse.some((value, i) => Math.abs(value - reducedPose[i]) > 1e-6), 'Reduced motion removes secondary sway');
  for (let i = 0; i < 8; i++) api.update(.1);
  check(api.diagnostics.loadWorld.every((value, i) => value === reducedPose[i]), 'Reduced-motion paused pose has no continuing motion');
  api.setReducedMotion(false); check(api.diagnostics.loadWorld.every((value, i) => Math.abs(value - withResponse[i]) < 1e-10), 'Travel response is reproducible from progress');
  api.setProgress(1);
  check(api.refit() && api.direction === -1, 'Refit begins reverse playback without jumping');
  check(api.progress === 1, 'Starting refit preserves terminal pose');
  api.update(.1); check(api.progress < 1 && !api.benchReady, 'Bench inspection gate closes as refit starts');
  for (let i = 0; i < 210; i++) api.update(.1);
  check(api.progress === 0 && !api.playing && api.stage === 'Engine refitted in the bay', 'Refit playback returns all the way to the bay and stops');
  check(!api.refit() && api.progress === 0, 'Refit at home does not teleport or start movement');
  check(api.reverse() && api.direction === 1 && api.progress === 0, 'Reverse at home starts outward motion without a jump');
  api.setPlaying(false); api.setProgress(1); api.setDirection(-1);
  check(!api.reverse() && api.progress === 1, 'Direction reversal at far boundary does not teleport');
  api.setDirection(1);
  api.setPlaying(true); check(api.progress === 0, 'Replay begins at start'); api.update(.1);
  check(Math.abs(api.progress - .005) < 1e-12, 'Play uses elapsed seconds');
  api.setPlaying(false); const paused = api.progress; api.update(.1); check(api.progress === paused, 'Pause holds exact pose');
  api.reset(); check(api.progress === 0 && !api.playing, 'Reset holds the prepared first pose');
  api.exit(); check(!api.active && !drive.locked, 'Exit restores original lock');
  for (const [object, saved] of before) {
    assert.equal(object.parent, saved.parent, `${object.name}: original parent`);
    assert.deepEqual(object.children, saved.children, `${object.name}: original sibling order`);
    check(object.position.equals(saved.position), `${object.name}: original position`);
    check(object.quaternion.equals(saved.quaternion), `${object.name}: original quaternion`);
    check(object.scale.equals(saved.scale), `${object.name}: original scale`);
    check(object.visible === saved.visible, `${object.name}: original visibility`);
  }
  for (let n = 0; n < 3; n++) { check(api.enter().ok, 'Repeated entry'); api.setProgress(.65); api.exit(); }
  drive.running = true; check(!api.enter().ok, 'Running entry refused'); drive.running = false;
  drive.locked = true; check(!api.enter().ok, 'Other service lock respected'); drive.locked = false;
  drive.assembled = false; check(!api.enter().ok, 'Disassembled entry refused'); drive.assembled = true;
  api.dispose();
  console.log(JSON.stringify({passed: true, checks, originalSource: commit, engineParts: 101, sampledProgressSteps: 101, crane: 'Transform fixture; live visual crane covered by browser checks'}));
} finally {
  if (temporary) fs.rmSync(temporary, {recursive: true, force: true});
}
