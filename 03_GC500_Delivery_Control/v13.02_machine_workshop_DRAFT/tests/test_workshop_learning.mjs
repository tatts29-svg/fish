/* Author: Andrew Fisher. Original-model bench checks; no browser or network writes.
 * node tests/test_workshop_learning.mjs
 * Optional ENGINE_LIFT_SOURCE points to the original extracted work folder.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const commit = '04b39247275b6b99475185560e43828f1c8fdcec';
const prefix = '03_GC500_Delivery_Control/v8.09_coates_way_machine_LIVE/work/';
let source = process.env.ENGINE_LIFT_SOURCE, temporary;
if (!source) {
  source = temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'coates-bench-'));
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
  const loadDraft = async name => {
    let code = fs.readFileSync(path.resolve(here, '..', name), 'utf8');
    code = code.replace("'./engine-kinematics.js'", JSON.stringify(pathToFileURL(path.join(source, 'engine-kinematics.js')).href));
    return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  };
  const {installWorkshopLearning} = await loadDraft('workshop-learning.js');
  const {installEngineLiftPreview} = await loadDraft('engine-lift-preview.js');
  const scene = new T.Scene(), engine = buildPowertrain(T), reference = buildPowertrain(T), body = buildCarBody(T);
  fitCarMechanics(T, body, engine); scene.add(engine.root, body.root);
  const studioRoot = new T.Group(), machinery = new T.Group(); scene.add(studioRoot); studioRoot.add(machinery);
  const bridge = new T.Group(), trolley = new T.Group(), hook = new T.Group(), drum = new T.Group(), ropes = new T.Group();
  machinery.add(bridge); bridge.add(trolley); trolley.add(hook, drum, ropes); hook.position.y = 4.6;
  drum.name = 'crane hoist drum'; ropes.name = 'crane ropes'; ropes.position.y = 9.1;
  studioRoot.userData.machinery = {group: machinery, crane: {bridge, trolley, hook}, state: {crane: {x: 0, z: 0, hook: 4.6}}};
  const drive = {angle: -.67, running: false, stationary: true, assembled: true, locked: false, stop() { this.running = false; }};
  engine.animate(.67);
  const lift = installEngineLiftPreview({T, scene, engine, body, studioRoot, drive});
  const api = installWorkshopLearning({T, scene, engine, body, lift, drive});
  const byId = id => engine.removable.find(part => part.id === id).group;
  let checks = 0;
  const check = (value, description) => { assert.ok(value, description); checks++; };
  const eq = (a, b, description) => check(Math.abs(a - b) < 1e-10, description);
  const stateOf = object => ({position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(), visible: object.visible,
    parent: object.parent, children: object.children.slice(), geometry: object.geometry, material: object.material,
    instances: object.isInstancedMesh ? object.instanceMatrix.array.slice() : null});
  const before = new Map();
  for (const part of engine.removable) part.group.traverse(object => before.set(object, stateOf(object)));
  check(!api.state.available && !api.setMode('oil').ok, 'Bench unavailable outside lift');
  check(!api.turnCrank().ok && !api.startChallenge('timing-belt').ok, 'Closed bench cannot change poses');
  check(lift.enter().ok, 'Enter real lift'); lift.setProgress(.8); api.update(.016);
  check(!api.setMode('inspect').ok, 'Bench unavailable while engine travels');
  lift.setProgress(1);
  check(api.state.available && !api.state.active, 'Lowering enables unopened bench');
  const benchBefore = new Map();
  for (const part of engine.removable) part.group.traverse(object => benchBefore.set(object, stateOf(object)));
  const mechBefore = JSON.stringify({crank: engine.root.userData.mech.crank, input: engine.inputAngle, main: engine.mainAngle, oil: engine.oil.travel, clutch: engine.driveline.clutch});
  check(api.setMode('inspect').ok && api.state.active, 'Inspection activates original bench');
  check(api.parts.length === 16 && api.parts.every(part => part.detail && part.connection && byId(part.id)), 'Detailed inspect choices are real model components');
  check(!byId('airbox').visible && !byId('valve-cover-near').visible, 'Cutaway exposes real internals');
  check(api.setCutaway(false).ok && byId('airbox').visible, 'Complete original covers available'); api.setCutaway(true);
  check(!api.setMode('unknown').ok && !api.selectPart('fake-part').ok && !api.turnCrank(NaN).ok, 'Invalid actions rejected without mutation');

  for (let step = 0; step < 24; step++) {
    api.turnCrank(Math.PI / 6); reference.animate(api.state.crankAngle);
    // Compare all original pistons/rods and valves to the real engine animator.
    for (let i = 0; i < engine.pistonMotions.length; i++) {
      const actual = engine.pistonMotions[i], expected = reference.pistonMotions[i];
      check(actual.piston.position.distanceTo(expected.piston.position) < 1e-10, 'Hand piston matches original kinematics');
      check(actual.rod.position.distanceTo(expected.rod.position) < 1e-10 && 1 - Math.abs(actual.rod.quaternion.dot(expected.rod.quaternion)) < 1e-10, 'Hand connecting rod matches original kinematics');
    }
    for (let i = 0; i < engine.valveMotions.length; i++) {
      const actual = engine.valveMotions[i], expected = reference.valveMotions[i];
      check(actual.movingValve.position.distanceTo(expected.movingValve.position) < 1e-10, 'Valve follows original cam profile');
      eq(actual.spring.scale.y, expected.spring.scale.y, 'Original spring follows valve');
    }
    eq(engine.camRotors[0].rotor.rotation.x, api.state.crankAngle * .5, 'Cam runs at half crank speed');
  }
  check(JSON.stringify({crank: engine.root.userData.mech.crank, input: engine.inputAngle, main: engine.mainAngle, oil: engine.oil.travel, clutch: engine.driveline.clutch}) === mechBefore, 'Bench never integrates vehicle drivetrain or original oil state');
  check(drive.angle === -.67 && !drive.running && drive.locked, 'Drive remains locked and untouched');
  const angle = api.state.crankAngle;
  engine.animate(.67); lift.update(0); api.update(.016);
  eq(byId('crankshaft').getObjectByName('Rotating crankshaft').rotation.x, angle, 'Host pose cannot overwrite the hand angle');
  check(!byId('airbox').visible, 'Bench reapplies cutaway after lift visibility');

  api.setMode('oil');
  check(api.diagnostics.oilPathCount === engine.oil.paths.length && api.diagnostics.oilPathCount === 7, 'All seven original oil paths traced');
  const oilAnchor = scene.getObjectByName('Trace on oil-galleries');
  oilAnchor.updateWorldMatrix(true, true); byId('oil-galleries').updateWorldMatrix(true, true);
  check(oilAnchor.matrixWorld.equals(byId('oil-galleries').matrixWorld), 'Oil paths follow moved actual engine world transform');
  const oilMeshes = oilAnchor.children.filter(object => object.isMesh && object.geometry.type === 'TubeGeometry');
  for (let i = 0; i < oilMeshes.length; i++) {
    const actual = oilMeshes[i].geometry.parameters.path.points;
    check(actual.every((point, index) => point.distanceTo(new T.Vector3(...engine.oil.paths[i][index])) < 1e-12), 'Oil trace control points exactly match original model');
  }
  const oilTravel = api.diagnostics.oilTravel; api.update(10); eq(api.diagnostics.oilTravel, oilTravel, 'Time alone cannot animate illustrative oil');
  api.turnCrank(Math.PI / 6); check(api.diagnostics.oilTravel > oilTravel, 'Hand rotation advances oil marker');
  check(!api.state.flow.detail.includes('bar') && api.state.notice.includes('No live measurements'), 'Trace is labelled illustration, without readings');
  api.setMode('coolant');
  check(api.diagnostics.coolantPathCount === 4, 'Only two real hoses and two real pump unions traced');
  check(api.state.flow.detail.includes('no circulating coolant loop') && api.state.flow.detail.includes('not modelled'), 'Open coolant path limits explicit');
  api.selectPart('cooling-system');
  const radiatorCentre = new T.Box3().setFromObject(byId('cooling-system')).getCenter(new T.Vector3());
  check(api.focus.distanceTo(radiatorCentre) < 1e-10, 'Inspection camera target follows selected actual radiator on car');
  const radiatorAnchor = scene.getObjectByName('Trace on cooling-system');
  check(radiatorAnchor.matrixWorld.equals(byId('cooling-system').matrixWorld), 'Coolant hoses stay anchored on car');

  const originalBelt = benchBefore.get(byId('timing-belt').getObjectByName('Unbroken timing belt backing')).geometry;
  check(!api.startChallenge('invented').ok, 'Unknown challenge rejected');
  for (const challenge of api.challenges) {
    api.startChallenge(challenge.id);
    check(api.state.challenge.status === 'searching' && !api.state.challenge.canRepair, 'Challenge begins unsolved');
    check(!api.repairChallenge().ok, 'Repair requires discovery');
    api.selectPart('alternator'); check(!api.repairChallenge().ok && !api.state.challenge.canRepair, 'Wrong component cannot repair');
    const camBefore = engine.camRotors[0].rotor.rotation.x;
    const pumpBefore = engine.systems.rotors.find(item => item.id === 'oil-pump').group.rotation.y;
    const travelBefore = api.diagnostics.oilTravel;
    api.turnCrank(.7); api.update(.1);
    eq(api.diagnostics.oilTravel, travelBefore, 'Interrupted oil drive holds trace');
    if (challenge.id === 'timing-belt') {
      const backing = byId('timing-belt').getObjectByName('Unbroken timing belt backing');
      check(backing.geometry !== originalBelt && backing.geometry.index.count < originalBelt.index.count, 'Visible gap cut in original belt mesh for teaching example');
      eq(engine.camRotors[0].rotor.rotation.x, camBefore, 'Broken timing belt leaves cams still');
    } else {
      eq(engine.systems.rotors.find(item => item.id === 'oil-pump').group.rotation.y, pumpBefore, 'Separated pump gears stop');
      eq(byId('oil-pump').position.x, benchBefore.get(byId('oil-pump')).position.x + .18, 'Actual oil pump visibly separated from shaft');
      check(engine.camRotors[0].rotor.rotation.x !== camBefore, 'Oil-pump fault does not stop camshaft');
    }
    api.selectPart(challenge.id); check(api.state.challenge.status === 'found' && api.state.challenge.canRepair, 'Correct inspection discovers example');
    api.selectPart('crankshaft'); check(!api.repairChallenge().ok, 'Repair still requires faulty component selected');
    api.selectPart(challenge.id); check(api.repairChallenge().ok && api.state.challenge.status === 'repaired', 'Discovered example repair completes');
    check(api.diagnostics.originalBeltGeometry, 'Repair restores original belt geometry');
    eq(byId('oil-pump').position.x, benchBefore.get(byId('oil-pump')).position.x, 'Repair reseats original oil pump');
    const travelRepaired = api.diagnostics.oilTravel; api.turnCrank(.2);
    check(api.diagnostics.oilTravel > travelRepaired, 'Restored drive advances oil again');
    api.resetChallenge(); check(api.state.challenge === null, 'Challenge reset clears progression');
  }
  api.reset(); check(!api.active && api.diagnostics.snapshots === 0, 'Reset closes and clears bench snapshots');
  for (const [object, saved] of benchBefore) {
    check(object.parent === saved.parent && object.geometry === saved.geometry && object.material === saved.material, 'Bench preserves original parent, geometry and material identity');
    check(object.position.equals(saved.position) && object.quaternion.equals(saved.quaternion) && object.scale.equals(saved.scale) && object.visible === saved.visible, 'Bench restores original transforms and visibility');
    assert.deepEqual(object.children, saved.children, 'Original child order preserved');
    if (saved.instances) assert.deepEqual(object.instanceMatrix.array, saved.instances, 'Original instanced teeth and oil poses restored');
  }
  api.setMode('inspect'); api.startChallenge('oil-pump'); lift.setProgress(.9); api.update(.016);
  check(!api.active && api.state.challenge === null && api.diagnostics.originalBeltGeometry, 'Returning engine closes/restores active lesson');
  lift.exit();
  for (const [object, saved] of before) {
    check(object.parent === saved.parent && object.geometry === saved.geometry, 'Exit retains original object and geometry identity');
    check(object.position.equals(saved.position) && object.quaternion.equals(saved.quaternion) && object.scale.equals(saved.scale) && object.visible === saved.visible, 'Full lift + bench exit restores original model');
  }
  api.dispose(); api.dispose(); lift.dispose();
  check(!scene.getObjectByName('Workshop learning overlays') && !api.setMode('inspect').ok, 'Dispose removes overlays and prevents reopening');
  console.log(JSON.stringify({passed: true, checks, originalSource: commit, inspectionParts: api.parts.length, handRotationPoses: 24, originalOilPaths: 7, coolantRoutes: 4, challenges: 2}));
} finally {
  if (temporary) fs.rmSync(temporary, {recursive: true, force: true});
}
