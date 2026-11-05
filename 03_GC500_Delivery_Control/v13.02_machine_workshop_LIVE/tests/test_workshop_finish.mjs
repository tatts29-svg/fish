/* Author: Andrew Fisher. Exact-source material, detail-attachment and lifecycle checks.
 * No live service access. Optional ENGINE_LIFT_SOURCE uses an extracted original.
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
let temporary = null, source = process.env.ENGINE_LIFT_SOURCE;
if (!source) {
  source = temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'coates-workshop-finish-'));
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
  const code = fs.readFileSync(path.resolve(here, '../workshop-finish.js'));
  const {installWorkshopFinish} = await import(`data:text/javascript;base64,${code.toString('base64')}`);
  const scene = new T.Scene(), engine = buildPowertrain(T), body = buildCarBody(T);
  fitCarMechanics(T, body, engine); scene.add(engine.root, body.root);
  const studioRoot = new T.Group(), camera = new T.PerspectiveCamera(35, 1, .1, 100);
  scene.add(studioRoot, camera);
  // The real floor is a print CanvasTexture. Its live provenance closes a cycle
  // through print.texture; freezing it also catches temporary source mutation.
  const floorMap = new T.CanvasTexture({width: 2, height: 2}); floorMap.repeat.set(22.5, 17.5);
  const provenance = Object.freeze({texture: floorMap});
  floorMap.userData = Object.freeze({print: provenance});
  assert.throws(() => floorMap.clone(), /circular/i, 'Fixture reproduces the browser clone failure');
  const floorMaterial = new T.MeshPhysicalMaterial({map: floorMap, roughness: .3, roughnessMap: floorMap, clearcoat: 1});
  const epoxy = new T.Mesh(new T.PlaneGeometry(54, 42), floorMaterial);
  epoxy.rotation.x = -Math.PI / 2; studioRoot.add(epoxy); studioRoot.userData.epoxy = epoxy;
  const renderer = {shadowMap: {needsUpdate: false}};
  const before = new Map(), originalMaterials = new Set();
  scene.traverse(object => {
    if (!object.isMesh) return;
    before.set(object, {geometry: object.geometry, material: object.material, parent: object.parent});
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) originalMaterials.add(material);
  });
  let originalsDisposed = 0;
  for (const material of originalMaterials) material.addEventListener('dispose', () => originalsDisposed++);
  floorMap.addEventListener('dispose', () => originalsDisposed++);
  const api = installWorkshopFinish({T, scene, engine, body, studioRoot, renderer, camera});
  assert.equal(installWorkshopFinish({T, engine}), api, 'Repeated install does not duplicate detail');
  assert.ok(api.diagnostics.changedMeshes > 80, 'The actual engine surfaces receive the finish');
  assert.ok(api.diagnostics.families.cast > 0 && api.diagnostics.families.rubber > 0 && api.diagnostics.families.machined > 0);
  assert.ok(api.diagnostics.detailDraws <= 12, 'Instanced details fit the small draw-call allowance');
  assert.ok(api.diagnostics.detailInstances >= 80);
  const details = [];
  engine.root.traverse(object => { if (object.isGroup && object.userData.workshopDetail) details.push(object); });
  const detailGeometry = new Set();
  for (const group of details) {
    assert.equal(group.parent.userData.partId, group.userData.sourcePartId, 'A detail belongs to its original removable part');
    for (const mesh of group.children) {
      assert.ok(mesh.isInstancedMesh && !mesh.castShadow);
      detailGeometry.add(mesh.geometry);
    }
  }
  assert.equal(detailGeometry.size, 4, 'All new details share four geometries');
  for (const [object, original] of before) {
    assert.equal(object.geometry, original.geometry, 'No original geometry is replaced');
    assert.equal(object.parent, original.parent, 'No original object is reparented');
    let ancestor = object, protectedObject = false;
    while (ancestor) { if (ancestor === body.root || ancestor.userData.partId === 'cockpit') protectedObject = true; ancestor = ancestor.parent; }
    const materials = Array.isArray(original.material) ? original.material : [original.material];
    const orange = materials.some(m => m.color && m.color.r > .45 && m.color.r > m.color.g * 1.75 && m.color.g > m.color.b * 1.25);
    if (protectedObject || orange) assert.equal(object.material, original.material, 'Original car, cockpit and Coates orange stay intact');
  }
  const find = name => { let found; engine.root.traverse(object => { if (object.name === name) found = object; }); return found; };
  const cast = find('Sectioned aluminium casting and cylinder sleeves').material;
  const polished = find('Main journals, crank pins and flywheel').material;
  const rubber = find('Upper and lower coolant hoses').material;
  assert.ok(cast.roughness > polished.roughness && rubber.roughness > cast.roughness);
  assert.equal(rubber.metalness, 0, 'Rubber cannot inherit polished-metal reflectance');
  assert.notEqual(epoxy.material, floorMaterial);
  assert.notEqual(epoxy.material.map, floorMap);
  assert.ok(epoxy.material.map.isCanvasTexture, 'Floor copy retains its texture type');
  assert.equal(epoxy.material.map.source, floorMap.source, 'Floor copy follows the original live print canvas');
  assert.equal(floorMap.userData.print, provenance, 'Cyclic print provenance is never changed');
  assert.equal(floorMap.userData.print.texture, floorMap, 'Original print texture identity survives');
  assert.deepEqual(epoxy.material.map.userData, {}, 'Rendering copy omits live provenance');
  assert.deepEqual(floorMap.repeat.toArray(), [22.5, 17.5], 'Original floor mapping is untouched');
  assert.ok(epoxy.material.roughness > floorMaterial.roughness && epoxy.material.clearcoat < floorMaterial.clearcoat);
  assert.ok(epoxy.material.userData.overReflector.opacity >= .9, 'Higher quality keeps the mirror floor subdued');
  camera.position.set(0, 2, 3); scene.updateMatrixWorld(true); api.update({quality: 'laptop'});
  assert.equal(api.diagnostics.detailVisible, details.length, 'Close inspection shows detail on Laptop');
  camera.position.set(0, 2, 18); scene.updateMatrixWorld(true); api.update();
  assert.equal(api.diagnostics.detailVisible, 0, 'Wide workshop views cull fine detail');
  const pan = engine.removable.find(part => part.id === 'oil-pan').group;
  const panDetail = details.find(group => group.userData.sourcePartId === 'oil-pan');
  const lift = new T.Group(); scene.add(lift); scene.updateMatrixWorld(true);
  const oldWorld = panDetail.getWorldPosition(new T.Vector3());
  lift.attach(pan); lift.position.set(1, 2, -.6); scene.updateMatrixWorld(true);
  const newWorld = panDetail.getWorldPosition(new T.Vector3());
  assert.ok(newWorld.distanceTo(oldWorld.clone().add(lift.position)) < 1e-8, 'Fasteners follow the engine when its source part is lifted');
  camera.position.copy(newWorld).add(new T.Vector3(0, 1, 2)); scene.updateMatrixWorld(true); api.update();
  assert.ok(panDetail.visible, 'Distance culling follows the lifted engine');
  engine.root.attach(pan); lift.removeFromParent();
  const report = api.diagnostics;
  api.dispose(); api.dispose();
  assert.ok(api.diagnostics.disposed);
  assert.equal(originalsDisposed, 0, 'Disposal never destroys source materials or textures');
  for (const [object, original] of before) assert.equal(object.material, original.material, 'Disposal restores exact original material objects');
  for (const detail of details) assert.equal(detail.parent, null);
  assert.ok(renderer.shadowMap.needsUpdate);
  console.log(JSON.stringify({ok: true, source: commit, ...report}, null, 2));
} finally {
  if (temporary) fs.rmSync(temporary, {recursive: true, force: true});
}
