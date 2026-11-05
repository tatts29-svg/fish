/* Author: Andrew Fisher. Four-stroke timing and reversible inspection checks.
 * No browser, network request or operational write. Optional ENGINE_LESSONS_SOURCE
 * points to the exact v13.02 machine source; otherwise extract recorded sources.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const originalCommit = '04b39247275b6b99475185560e43828f1c8fdcec', releaseCommit = 'd45e5162573c8f227c93f07f1326382794ed358e';
const originalPrefix = '03_GC500_Delivery_Control/v8.09_coates_way_machine_LIVE/work/';
const releasePrefix = '03_GC500_Delivery_Control/v13.02_machine_workshop_LIVE/';
let source = process.env.ENGINE_LESSONS_SOURCE, temporary;
if (!source) {
  source = temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'coates-lessons-'));
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', originalCommit, '--', originalPrefix], {cwd: repo, encoding: 'utf8'}).trim().split('\n');
  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const relative = file.slice(originalPrefix.length), target = path.join(source, relative);
    assert.ok(file.startsWith(originalPrefix) && !relative.split('/').includes('..'));
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, execFileSync('git', ['show', `${originalCommit}:${file}`], {cwd: repo, maxBuffer: 16 * 1024 * 1024}));
  }
  for (const file of ['workshop-learning.js', 'engine-lift-preview.js']) fs.writeFileSync(path.join(source, file), execFileSync('git', ['show', `${releaseCommit}:${releasePrefix}${file}`], {cwd: repo}));
  fs.writeFileSync(path.join(source, 'package.json'), '{"type":"module"}');
}
try {
  const original = file => import(pathToFileURL(path.join(source, file)).href);
  const T = await original('vendor/three.module.js');
  const {buildPowertrain} = await original('car-powertrain.js');
  const {buildCarBody} = await original('car-body.js');
  const {fitCarMechanics} = await original('car-fit.js');
  const {valveLift} = await original('engine-kinematics.js');
  const {CAR_REFERENCES} = await original('car-references.js');
  const {installWorkshopLearning} = await original('workshop-learning.js');
  const {installEngineLiftPreview} = await original('engine-lift-preview.js');
  let code = fs.readFileSync(path.resolve(here, '../workshop-lessons.js'), 'utf8');
  for (const file of ['car-references.js', 'part-connections.js']) code = code.replace(`'./${file}'`, JSON.stringify(pathToFileURL(path.join(source, file)).href));
  const {installWorkshopLessons, cylinderCycle} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const scene = new T.Scene(), engine = buildPowertrain(T), body = buildCarBody(T);
  fitCarMechanics(T, body, engine); scene.add(engine.root, body.root);
  const studioRoot = new T.Group(), machinery = new T.Group(); scene.add(studioRoot); studioRoot.add(machinery);
  const bridge = new T.Group(), trolley = new T.Group(), hook = new T.Group(), drum = new T.Group(), ropes = new T.Group();
  machinery.add(bridge); bridge.add(trolley); trolley.add(hook, drum, ropes); hook.position.y = 4.6;
  drum.name = 'crane hoist drum'; ropes.name = 'crane ropes'; ropes.position.y = 9.1;
  studioRoot.userData.machinery = {group: machinery, crane: {bridge, trolley, hook}, state: {crane: {x: 0, z: 0, hook: 4.6}}};
  const drive = {running: false, stationary: true, assembled: true, locked: false, stop() { this.running = false; }};
  const lift = installEngineLiftPreview({T, scene, engine, body, studioRoot, drive});
  const learning = installWorkshopLearning({T, scene, engine, body, lift, drive});
  let reduced = false, rigging = null;
  const lessonLift = {get active() { return lift.active; }, get benchReady() { return lift.benchReady; }, get progress() { return lift.progress; },
    get diagnostics() { return {...lift.diagnostics, ...(rigging ? {rigging} : {})}; }};
  const api = installWorkshopLessons({T, scene, engine, body, lift: lessonLift, learning, reducedMotion: () => reduced});
  const byId = id => engine.removable.find(part => part.id === id).group;
  let checks = 0;
  const check = (condition, message) => { assert.ok(condition, message); checks++; };
  const near = (a, b, message, epsilon = 1e-9) => check(Math.abs(a - b) < epsilon, message);
  const snapshot = () => {
    const saved = new Map();
    for (const part of engine.removable) part.group.traverse(object => saved.set(object, {parent: object.parent, children: object.children.slice(), visible: object.visible,
      position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(), geometry: object.geometry, material: object.material,
      instances: object.isInstancedMesh ? object.instanceMatrix.array.slice() : null}));
    return saved;
  };
  const verify = saved => {
    for (const [object, previous] of saved) {
      check(object.parent === previous.parent && object.geometry === previous.geometry && object.material === previous.material, 'Original parent and render resources retained');
      check(object.visible === previous.visible && object.position.equals(previous.position) && object.quaternion.equals(previous.quaternion) && object.scale.equals(previous.scale), 'Original visibility and animation pose restored');
      assert.deepEqual(object.children, previous.children, 'Original child order retained');
      if (previous.instances) assert.deepEqual(object.instanceMatrix.array, previous.instances, 'Original instanced pose retained');
    }
  };
  const initial = snapshot();
  check(!api.setMode('cycle').ok && !api.setMode('isolate').ok, 'Lessons require supported bench');
  check(!api.setPlaying(true).ok && !api.setCycleAngle(0).ok && !api.setRotation(1).ok, 'Closed lesson actions refused');
  check(!api.setMode('invalid').ok, 'Unknown lesson refused');
  lift.enter(); lift.setProgress(.9); check(!api.setMode('cycle').ok, 'Lesson refused while engine travelling');
  lift.setProgress(1); learning.setMode('inspect');
  rigging = {attached: 1, clear: 0}; check(!api.setMode('cycle').ok, 'Supported engine still rigged cannot start lesson');
  rigging = {attached: 0, clear: .5}; check(!api.setMode('isolate').ok, 'Unhooked rig must clear before inspection');
  rigging = {attached: 0, clear: 1};
  const brackets = new Map();
  engine.root.traverse(object => {
    if (object.position.z > 0 && ['Illustrated lifting eye', 'Illustrated lifting bracket', 'Illustrated bracket foot on cylinder head'].includes(object.name)) brackets.set(object, object.visible);
  });
  check(api.setMode('cycle').ok && !api.state.playing, 'Cycle opens paused');
  check(api.diagnostics.cycleHiddenParts === 7 && brackets.size === 6, 'Teaching cutaway is bounded to one head and its six bracket pieces');
  check(api.state.selectedPart.id === 'piston-1' && api.state.selectedPart.reference === CAR_REFERENCES['piston-1'], 'Cycle names actual cylinder1 register reference');
  const samples = [[135, 'power', 'down', false, false], [315, 'exhaust', 'up', false, true], [495, 'intake', 'down', true, false], [675, 'compression', 'up', false, false]];
  const pistonMotion = engine.pistonMotions.find(item => item.id === 'piston-1');
  const sightline = new T.Vector3(.25, .20, 1).normalize(), ray = new T.Raycaster();
  const visible = object => { for (let current = object; current; current = current.parent) if (!current.visible) return false; return true; };
  const componentId = object => { for (let current = object; current; current = current.parent) if (current.userData.partId) return current.userData.partId; return object.name; };
  for (const [degrees, phase, direction, intakeOpen, exhaustOpen] of samples) {
    const radians = degrees * Math.PI / 180, expected = cylinderCycle(radians);
    api.setCycleAngle(expected.angle);
    check(!byId('cylinder-head-near').visible && byId('cylinder-head-far').visible, 'Teaching cutaway hides only the near head');
    check([...brackets.keys()].every(object => !object.visible), 'Head-mounted brackets do not obscure valve motion');
    scene.updateMatrixWorld(true);
    const crownTarget = pistonMotion.piston.localToWorld(new T.Vector3(0, .02, 0));
    ray.set(crownTarget.clone().addScaledVector(sightline, 4), sightline.clone().negate());
    const first = ray.intersectObject(engine.root, true).find(hit => visible(hit.object));
    check(first && componentId(first.object) === 'piston-1', `${phase} camera ray reaches actual piston first; got ${first ? componentId(first.object) : 'no hit'}`);
    check(api.state.phase.id === phase && api.state.phase.direction === direction, `${phase} agrees with original crank phase`);
    check(api.state.valves.intake === (intakeOpen ? 'open' : 'closed') && api.state.valves.exhaust === (exhaustOpen ? 'open' : 'closed'), `${phase} indicators follow actual valves`);
    for (const kind of ['intake', 'exhaust']) {
      const motion = engine.valveMotions.find(item => item.id === `${kind}-valve-1`);
      near(motion.movingValve.position.length(), valveLift(learning.state.crankAngle, 1, kind, 1, 0), 'Lesson follows original cam profile');
      const valveTarget = motion.movingValve.localToWorld(new T.Vector3(0, .427, 0));
      ray.set(valveTarget.clone().addScaledVector(sightline, 4), sightline.clone().negate());
      const firstValve = ray.intersectObject(engine.root, true).find(hit => visible(hit.object));
      check(firstValve && componentId(firstValve.object) === motion.id, `${phase} camera ray reaches actual ${kind} valve; got ${firstValve ? componentId(firstValve.object) : 'no hit'}`);
    }
    const beforeY = pistonMotion.piston.position.y; learning.turnCrank(.001); api.update(0);
    check(direction === 'down' ? pistonMotion.piston.position.y < beforeY : pistonMotion.piston.position.y > beforeY, 'Phase direction agrees with actual piston travel');
    check(api.diagnostics.chamberHeight > 0 && api.diagnostics.chamberHeight < .2, 'Chamber occupies finite original cylinder space');
    const lessonAnchor = scene.getObjectByName('Cylinder 1 four-stroke indication');
    check(lessonAnchor.matrixWorld.equals(byId('piston-1').matrixWorld), 'Chamber follows actual lifted cylinder world pose');
  }
  api.setCycleAngle(0);
  check(api.state.valves.intake === 'open' && api.state.valves.exhaust === 'open', 'Actual valve overlap shown at intake transition');
  for (const angle of [-50, 0, .2, Math.PI, Math.PI * 2, Math.PI * 3, 50]) {
    near(cylinderCycle(angle).degrees, cylinderCycle(angle + Math.PI * 4).degrees, 'Cycle repeats every720°');
  }
  for (const [degrees, after, before] of [[45, 'power', 'compression'], [225, 'exhaust', 'power'], [405, 'intake', 'exhaust'], [585, 'compression', 'intake']]) {
    check(cylinderCycle(degrees * Math.PI / 180 + 1e-7).id === after && cylinderCycle(degrees * Math.PI / 180 - 1e-7).id === before, 'Original TDC/BDC phase boundaries respected');
  }
  const pausedAngle = learning.state.crankAngle; api.update(.1); near(learning.state.crankAngle, pausedAngle, 'Paused lesson never advances');
  check(api.setPlaying(true).ok, 'Explicit Play starts cycle'); api.update(.1);
  near(learning.state.crankAngle - pausedAngle, Math.PI / 40, 'Playback advances only original hand-crank API');
  api.setPlaying(false); const stoppedAngle = learning.state.crankAngle; api.update(.1); near(learning.state.crankAngle, stoppedAngle, 'Pause holds exact angle');
  reduced = true; api.setPlaying(true); api.update(.1); near(learning.state.crankAngle - stoppedAngle, Math.PI / 80, 'Explicit reduced-motion playback uses slower motion'); api.setPlaying(false);
  check(!api.setCycleAngle(Infinity).ok && !api.rotate(NaN).ok, 'Non-finite inputs rejected');
  learning.startChallenge('timing-belt'); api.update(0);
  check(api.state.kind === 'none' && !api.setMode('cycle').ok, 'Broken timing cannot claim a healthy cycle'); learning.resetChallenge();

  let originalGeometryDisposals = 0, originalMaterialDisposals = 0;
  const geometries = new Set(), materials = new Set();
  engine.root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const value of Array.isArray(object.material) ? object.material : [object.material]) if (value) materials.add(value);
  });
  for (const geometry of geometries) geometry.addEventListener('dispose', () => originalGeometryDisposals++);
  for (const material of materials) material.addEventListener('dispose', () => originalMaterialDisposals++);
  // Regression: .clone/.copy would JSON-serialise these cycles and throw.
  const cyclicPart = byId('piston-1'); cyclicPart.userData.inspectionCycle = cyclicPart;
  cyclicPart.children[0].userData.inspectionCycle = cyclicPart;
  const cyclicMaterial = cyclicPart.children[0].children[0].material;
  cyclicMaterial.userData.inspectionCycle = cyclicMaterial;
  const isolatedBefore = snapshot();
  for (const part of learning.parts) {
    learning.selectPart(part.id); check(api.setMode('isolate').ok, 'Every existing inspection choice can be isolated');
    const original = byId(part.id), parent = original.parent, sourcePosition = original.position.clone();
    check(!original.visible && api.diagnostics.sourceId === part.id, 'Only selected original group hidden');
    check(!scene.getObjectByName('Inspected original component').visible, 'Isolation uses one fitted-location outline');
    check(api.state.selectedPart.reference === CAR_REFERENCES[part.id] && api.state.selectedPart.connectedParts.length > 0, 'Isolation carries real register connections');
    const display = scene.getObjectByName('Rotatable inspection display'), replica = display.children[0];
    const sourceMeshes = [], displayedMeshes = [];
    original.traverse(object => { if (object.isMesh) sourceMeshes.push(object); }); replica.traverse(object => { if (object.isMesh) displayedMeshes.push(object); });
    check(sourceMeshes.length === displayedMeshes.length, 'Display uses complete original render tree');
    for (let i = 0; i < sourceMeshes.length; i++) {
      check(sourceMeshes[i] !== displayedMeshes[i] && sourceMeshes[i].geometry === displayedMeshes[i].geometry && sourceMeshes[i].material === displayedMeshes[i].material, 'Inspection copy shares exact source resources without replacing original');
      if (sourceMeshes[i].isInstancedMesh) {
        check(sourceMeshes[i].instanceMatrix.array !== displayedMeshes[i].instanceMatrix.array, 'Display instance poses have independent storage');
        assert.deepEqual(sourceMeshes[i].instanceMatrix.array, displayedMeshes[i].instanceMatrix.array);
      }
    }
    check(api.setRotation(Math.PI / 3).ok && api.rotate(Math.PI / 6).ok, 'Inspection rotation controls operate');
    near(api.state.rotation, Math.PI / 2, 'Inspection rotation accumulated');
    check(original.position.equals(sourcePosition) && original.parent === parent, 'Inspection rotation never moves or reparents original');
    const sourceCentre = new T.Box3().setFromObject(original).getCenter(new T.Vector3());
    check(api.focus.distanceTo(sourceCentre) > .9 && !api.bounds.isEmpty(), 'Inspection display is brought forward with finite focus bounds');
    const line = scene.getObjectByName('Inspection view to fitted connection').geometry.attributes.position;
    check(new T.Vector3().fromBufferAttribute(line, 0).distanceTo(sourceCentre) < 1e-6, 'Visible reference line stays at fitted original location');
    api.reset(); check(original.visible === isolatedBefore.get(original).visible && api.diagnostics.displayNodes === 0, 'Reset removes display and restores source visibility');
    check(scene.getObjectByName('Inspected original component').visible, 'Reset restores bench selection outline');
  }
  verify(isolatedBefore);
  learning.selectPart('piston-1'); api.setMode('isolate'); learning.turnCrank(.2); learning.update(0); api.update(0);
  const displayPiston = scene.getObjectByName('Rotatable inspection display').getObjectByName('Piston crown and skirt');
  check(displayPiston.position.equals(pistonMotion.piston.position), 'Isolated display mirrors current actual piston animation');
  learning.selectPart('timing-belt'); api.setRotation(.4);
  check(byId('piston-1').visible && !byId('timing-belt').visible && api.diagnostics.sourceId === 'timing-belt', 'Changing selected component restores previous original and hides next');
  near(api.state.rotation, .4, 'Immediate rotation after part change is retained');
  check(api.setCycleAngle(Math.PI * 4).ok && api.state.kind === 'isolate', 'Tour can set deterministic crank pose while isolated');
  api.setMode('cycle'); check(byId('timing-belt').visible && api.diagnostics.displayNodes === 0, 'Switch to cycle restores isolated component');
  check(!byId('cylinder-head-near').visible, 'Re-entered cycle reapplies teaching cutaway');
  api.setMode('isolate'); check(byId('cylinder-head-near').visible, 'Switch to isolation restores original head visibility');
  check([...brackets].every(([object, shown]) => object.visible === shown), 'Switch restores exact bracket visibility');
  api.reset(); byId('cylinder-head-near').visible = false; api.setMode('cycle'); api.reset();
  check(!byId('cylinder-head-near').visible, 'Cycle reset preserves a pre-existing hidden head');
  byId('cylinder-head-near').visible = true;
  api.reset(); learning.reset(); lift.exit(); verify(initial);
  check(!originalGeometryDisposals && !originalMaterialDisposals, 'No source resource disposed by inspection switches');

  lift.enter(); lift.setProgress(1); learning.setMode('inspect'); learning.selectPart('piston-1'); api.setMode('isolate');
  lift.setProgress(.8); learning.update(0); api.update(0);
  check(api.state.kind === 'none' && byId('piston-1').visible, 'Leaving supported bench closes isolation');
  lift.setProgress(1); learning.setMode('inspect'); api.setMode('isolate'); api.dispose(); api.dispose();
  check(byId(learning.state.selectedId).visible && !scene.getObjectByName('Workshop mechanism lessons'), 'Active disposal restores source and removes lesson objects');
  check(!api.setMode('cycle').ok && !originalGeometryDisposals && !originalMaterialDisposals, 'Disposed lesson cannot reopen or dispose shared resources');
  learning.dispose(); lift.dispose();
  delete cyclicPart.userData.inspectionCycle; delete cyclicPart.children[0].userData.inspectionCycle; delete cyclicMaterial.userData.inspectionCycle;
  console.log(JSON.stringify({passed: true, checks, originalSource: originalCommit, workshopSource: releaseCommit, cycleSamples: 4, isolatedComponents: 16, cyclicProvenance: 'preserved without cloning'}));
} finally {
  if (temporary) fs.rmSync(temporary, {recursive: true, force: true});
}
