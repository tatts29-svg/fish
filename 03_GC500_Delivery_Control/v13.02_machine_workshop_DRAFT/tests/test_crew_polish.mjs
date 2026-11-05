/* Author: Andrew Fisher.
 * Geometry/contact regression against the exact original Coates people and scripts.
 * Run with node tests/test_crew_polish.mjs. Optional CREW_POLISH_SOURCE points to an
 * extracted original work folder; otherwise this test extracts it from Git.
 * No browser, network access or operational record writes.
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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'coates-crew-polish-'));
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
try {
  const provided = process.env.CREW_POLISH_SOURCE;
  if (provided) fs.cpSync(provided, temp, {recursive: true});
  else {
    const names = execFileSync('git', ['ls-tree', '-r', '--name-only', commit, '--', prefix], {cwd: repo, encoding: 'utf8'}).trim().split('\n');
    for (const name of names) {
      if (!name.endsWith('.js')) continue;
      const relative = name.slice(prefix.length), target = path.join(temp, relative);
      assert.ok(name.startsWith(prefix) && !relative.split('/').includes('..'));
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, execFileSync('git', ['show', `${commit}:${name}`], {cwd: repo, maxBuffer: 16 * 1024 * 1024}));
    }
  }
  fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
  fs.copyFileSync(path.resolve(here, '../crew-polish.js'), path.join(temp, 'crew-polish.js'));
  const load = name => import(pathToFileURL(path.join(temp, name)).href);
  const T = await load('vendor/three.module.js');
  const {buildCrew, buildFigure, Crewman} = await load('crew.js');
  const {mountCrewPolish} = await load('crew-polish.js');
  const crew = buildCrew(), control = buildCrew();
  const driver = new Crewman(buildFigure(T, {title: 'race driver', label: 6}), {name: 'race driver', seed: 26});
  driver.place(-4.4, -4.9, .4); driver.update(0); crew.root.add(driver.fig.root);
  const people = [...Object.values(crew.men), driver];
  const originals = people.map(m => ({m, geometry: m.fig.mesh.geometry, skeleton: m.fig.skeleton,
    material: m.fig.mesh.material, triangles: m.fig.triangles, joints: m.fig.skeleton.bones.slice(),
    grip: [m.fig.markers.gripL.position.clone(), m.fig.markers.gripR.position.clone()]}));
  const propParents = Object.values(crew.props).filter(p => p?.isObject3D).map(p => [p, p.parent]);
  const api = mountCrewPolish({T, crew, driver});
  check(api.info().people === 8, 'All seven existing crew figures and the walk-out driver are covered');
  check(api.info().drawsAdded === 0, 'No additional person draw calls');
  check(api.info().addedTriangles > 0 && api.info().addedTriangles < 17000, 'Eight-person geometry budget is below 17000 added triangles');
  check(mountCrewPolish({T, crew, driver}) === api, 'Repeated mount returns the existing polish');
  check(new Set(people.map(m => m.fig.mesh.material)).size === 1, 'One shared figure material');
  for (const {m, joints, grip, geometry: originalGeometry} of originals) {
    check(m.fig.skeleton.bones.length === 41, 'Existing 21 body bones plus 20 finger joints');
    check(joints.every((b, i) => m.fig.skeleton.bones[i] === b), 'Body bone identity and order retained');
    check(m.fig.markers.gripL.position.equals(grip[0]) && m.fig.markers.gripR.position.equals(grip[1]), 'Palm contact markers retained exactly');
    const g = m.fig.mesh.geometry, sw = g.attributes.skinWeight, si = g.attributes.skinIndex;
    let valid = true;
    for (let i = 0; i < sw.count; i++) {
      const sum = sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i);
      if (!Number.isFinite(sum) || Math.abs(sum - 1) > 1e-5 || Math.max(si.getX(i), si.getY(i), si.getZ(i), si.getW(i)) >= 41) valid = false;
    }
    check(valid, 'All skin weights normalised and bone indices valid');
    const p = g.attributes.position; let floor = Infinity;
    for (let i = originalGeometry.attributes.position.count; i < p.count; i++) {
      if ([15, 18, 19, 20].includes(si.getX(i))) floor = Math.min(floor, p.getY(i));
    }
    check(floor >= -1e-6, 'Added boot detail stays above the original ground plane');
  }
  check(propParents.every(([p, parent]) => p.parent === parent), 'Equipment ownership/attachment retained');

  let maxMotionDifference = 0, maxGripDifference = 0, finite = true;
  for (let frame = 0; frame < 300; frame++) {
    const dt = 1 / 30, state = {running: frame > 150 && frame < 220, rpm: 2300};
    crew.update(dt, state); control.update(dt, state); driver.update(dt); api.update(dt);
    for (const id of Object.keys(crew.men)) {
      const a = crew.men[id], b = control.men[id];
      maxMotionDifference = Math.max(maxMotionDifference, a.pos.distanceTo(b.pos));
      for (const bone of Object.keys(a.fig.bones)) {
        const aa = a.fig.bones[bone].matrixWorld.elements, bb = b.fig.bones[bone].matrixWorld.elements;
        for (let i = 0; i < 16; i++) maxMotionDifference = Math.max(maxMotionDifference, Math.abs(aa[i] - bb[i]));
      }
      for (const side of ['L', 'R']) maxGripDifference = Math.max(maxGripDifference,
        a.fig.markers['grip' + side].getWorldPosition(new T.Vector3()).distanceTo(b.fig.markers['grip' + side].getWorldPosition(new T.Vector3())));
      a.fig.skeleton.update();
      finite &&= a.fig.skeleton.boneMatrices.every(Number.isFinite);
    }
  }
  check(maxMotionDifference < 1e-10, 'Body scripts, paths, gait and every body joint match the unmodified crew over ten seconds');
  check(maxGripDifference < 1e-10, 'Palm/equipment contact transforms match the unmodified crew over ten seconds');
  check(finite, 'Every animated skeleton matrix remains finite');
  check(api.info().peopleDetails.find(p => p.role === 'operator').hands.every(h => h === 'typing'), 'Telemetry hands retain typing rather than a closed grip');
  check(api.info().peopleDetails.find(p => p.role === 'lead').hands[0] === 'tablet', 'Tablet uses its supporting grip');
  const m = crew.men.mechanic, h = m.hands[1], first = m.fig.skeleton.bones.find(b => b.name.endsWith('R glove finger 1'));
  h.target = () => true; h.valid = true; h.w = 1; h.err = 0; crew.S.gunAt = 'hand';
  for (let i = 0; i < 60; i++) api.update(1 / 60);
  const closed = first.rotation.z;
  check(api.info().peopleDetails.find(p => p.role === 'mechanic').hands[1] === 'tool', 'Existing impact-tool contact selects the tool grip');
  h.err = .2;
  for (let i = 0; i < 60; i++) api.update(1 / 60);
  check(Math.abs(first.rotation.z - closed) > .4, 'An unreachable target releases the fingers');
  check(api.info().peopleDetails.find(p => p.role === 'mechanic').hands[1] === 'relaxed', 'No fictitious grip across an air gap');
  m.ch.point = 1; api.update(1 / 30);
  check(api.info().peopleDetails.find(p => p.role === 'mechanic').hands[1] === 'point', 'Pointing extends the index finger');
  api.setWorkshopMode(true); const held = first.rotation.z; m.ch.point = 0;
  api.update(.1); check(first.rotation.z === held, 'Workshop suspension retains the current hand pose');
  api.setWorkshopMode(false); api.update(.1); check(first.rotation.z !== held, 'Hand animation resumes after workshop suspension');
  api.dispose(); api.dispose();
  check(api.info().disposed, 'Disposal is idempotent');
  for (const {m, geometry, skeleton, material, triangles} of originals) {
    check(m.fig.mesh.geometry === geometry && m.fig.mesh.material === material && m.fig.skeleton === skeleton && m.fig.triangles === triangles, 'Original figure resources restored exactly');
    check(!m.fig.bones.handL.children.some(b => b.isBone) && !m.fig.bones.handR.children.some(b => b.isBone), 'All added finger bones removed');
  }
  const again = mountCrewPolish({T, crew, driver}); check(again !== api && again.info().people === 8, 'Clean remount succeeds'); again.dispose();
  console.log(JSON.stringify({checks, people: 8, addedTriangles: api.info().addedTriangles, bodyMotionDifference: maxMotionDifference,
    palmContactDifference: maxGripDifference, sourceCommit: commit, result: 'PASS'}, null, 2));
} finally { fs.rmSync(temp, {recursive: true, force: true}); }
