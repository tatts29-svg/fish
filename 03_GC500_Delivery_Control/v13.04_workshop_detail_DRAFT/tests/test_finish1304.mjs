/* Author: Andrew Fisher. Actual source model: surface definition, fastener seating,
 * service-clamp compatibility, visibility hysteresis and resource lifecycle.
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
  const originalWarn = console.warn, fixtureWarnings = [];
  try {
    console.warn = message => fixtureWarnings.push(String(message));
    assert.throws(() => floorMap.clone(), /circular/i, 'Fixture reproduces the browser clone failure');
  } finally { console.warn = originalWarn; }
  assert.ok(fixtureWarnings.every(message => message.includes('Unable to serialize Texture')), 'Only the intentional cyclic-fixture warning is captured');
  const floorMaterial = new T.MeshPhysicalMaterial({map: floorMap, roughness: .3, roughnessMap: floorMap, clearcoat: 1});
  const epoxy = new T.Mesh(new T.PlaneGeometry(54, 42), floorMaterial);
  epoxy.rotation.x = -Math.PI / 2; studioRoot.add(epoxy); studioRoot.userData.epoxy = epoxy;
  const renderer = {shadowMap: {needsUpdate: false}, capabilities: {getMaxAnisotropy: () => 16}};
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
  assert.equal(api.diagnostics.surfaceMaps, 4, 'Only four shared surface maps');
  assert.equal(api.diagnostics.surfaceBytes, 4 * 128 * 128 * 4, 'Surface data is bounded to 256 KiB before mipmaps');
  assert.ok(api.diagnostics.detailTriangles < 18000, 'Close detail stays below the 18,000-triangle budget');
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
  const textureSet = new Set(), newMaterials = new Set();
  engine.root.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (originalMaterials.has(material)) continue;
      newMaterials.add(material);
      if (!material.bumpMap) continue;
      textureSet.add(material.bumpMap);
      assert.equal(material.roughnessMap, material.bumpMap, 'Each family reuses one texture for finish response');
      assert.ok(material.bumpScale > 0 && material.bumpScale <= .00065, 'Micro finish does not distort the model silhouette');
      assert.equal(material.bumpMap.colorSpace, T.NoColorSpace, 'Surface data is linear, not colour');
      assert.equal(material.bumpMap.minFilter, T.LinearMipmapLinearFilter, 'Distant micro detail is mip filtered');
      assert.equal(material.bumpMap.magFilter, T.LinearFilter);
      assert.equal(material.bumpMap.anisotropy, 4, 'Oblique filtering is capped');
      assert.ok(material.bumpMap.generateMipmaps);
      assert.ok(material.bumpMap.image.data.every(Number.isFinite));
    }
  });
  assert.equal(textureSet.size, 4);
  assert.notEqual(cast.bumpMap, polished.bumpMap, 'Cast and machined surfaces have different microstructure');
  assert.notDeepEqual(cast.bumpMap.image.data, polished.bumpMap.image.data);
  const piston = find('Machined piston 1'), ring = find('Three piston rings');
  assert.equal(piston.material.userData.workshopFinish, 'machined');
  assert.equal(ring.material.userData.workshopFinish, 'darkSteel', 'Rings remain visually distinct from the crown/skirt');
  assert.ok(ring.material.color.getHex() !== piston.material.color.getHex());

  // Contact is checked against the original drawn planes, independently of the
  // helper's placement formula: sump flange top .066, head deck top .4615.
  const point = new T.Vector3(), matrix = new T.Matrix4(), normal = new T.Vector3();
  for (const group of details.filter(group => ['oil-pan', 'cylinder-head-near', 'cylinder-head-far'].includes(group.userData.sourcePartId))) {
    const side = group.userData.sourcePartId === 'oil-pan' ? 0 : group.userData.sourcePartId.endsWith('near') ? 1 : -1;
    normal.set(0, 1, 0).applyAxisAngle(new T.Vector3(1, 0, 0), side * Math.PI / 4);
    const plane = side ? .4615 : .066;
    const heads = group.getObjectByName('Flange hex fasteners'), washers = group.getObjectByName('Flange washers');
    function extents(mesh, index) {
      mesh.getMatrixAt(index, matrix);
      let min = Infinity, max = -Infinity;
      const vertices = mesh.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) { const v = point.fromBufferAttribute(vertices, i).applyMatrix4(matrix).dot(normal); min = Math.min(min, v); max = Math.max(max, v); }
      return [min, max];
    }
    for (let i = 0; i < heads.count; i++) {
      const h = extents(heads, i), w = extents(washers, i);
      assert.ok(Math.abs(w[0] - plane) < 1e-7, 'Flat washer contacts the original flange');
      assert.ok(Math.abs(w[1] - h[0]) < 1e-7, 'Bevelled head contacts washer without a gap or overlap');
      assert.ok(h[1] > h[0] && w[1] > w[0]);
    }
    const g = heads.geometry, p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) assert.ok(n.getX(i) * p.getX(i) + n.getY(i) * p.getY(i) + n.getZ(i) * p.getZ(i) > 0, 'Every head face normal points outward');
  }
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
  const centre = panDetail.getWorldPosition(new T.Vector3());
  for (const distance of [6.5, 6.3, 6.7, 6.0]) {
    camera.position.copy(centre).add(new T.Vector3(0, 0, distance)); scene.updateMatrixWorld(true); api.update();
    assert.equal(panDetail.visible, false, 'Hidden detail stays hidden inside the hysteresis band');
  }
  camera.position.copy(centre).add(new T.Vector3(0, 0, 5.8)); scene.updateMatrixWorld(true); api.update();
  assert.ok(panDetail.visible, 'Close approach restores detail');
  for (const distance of [6.0, 6.7, 7.0, 6.4]) {
    camera.position.copy(centre).add(new T.Vector3(0, 0, distance)); scene.updateMatrixWorld(true); api.update();
    assert.ok(panDetail.visible, 'Visible detail stays visible inside the hysteresis band');
  }
  const lift = new T.Group(); scene.add(lift); scene.updateMatrixWorld(true);
  const oldWorld = panDetail.getWorldPosition(new T.Vector3());
  lift.attach(pan); lift.position.set(1, 2, -.6); scene.updateMatrixWorld(true);
  const newWorld = panDetail.getWorldPosition(new T.Vector3());
  assert.ok(newWorld.distanceTo(oldWorld.clone().add(lift.position)) < 1e-8, 'Fasteners follow the engine when its source part is lifted');
  camera.position.copy(newWorld).add(new T.Vector3(0, 1, 2)); scene.updateMatrixWorld(true); api.update();
  assert.ok(panDetail.visible, 'Distance culling follows the lifted engine');
  engine.root.attach(pan); lift.removeFromParent();
  // v13.03 tracks each four-instance clamp child. The screw heads must use that
  // exact order and follow the same engine/radiator ends through full refit.
  const current = async name => import('data:text/javascript;base64,' + fs.readFileSync(path.resolve(here, '../../v13.03_mechanic_service_LIVE/' + name)).toString('base64'));
  const {installEngineLiftPreview} = await current('engine-lift-preview.js');
  const {installWorkshopService} = await current('workshop-service.js');
  const machinery = new T.Group(), bridge = new T.Group(), trolley = new T.Group(), hook = new T.Group(), drum = new T.Group(), ropes = new T.Group();
  studioRoot.add(machinery); machinery.add(bridge); bridge.position.x = 13; bridge.add(trolley); trolley.position.z = -4; trolley.add(hook, drum, ropes); hook.position.y = 4.6; drum.name = 'crane hoist drum'; ropes.name = 'crane ropes'; ropes.position.y = 9.1;
  studioRoot.userData.machinery = {group: machinery, crane: {bridge, trolley, hook}, state: {crane: {x: 13, z: -4, hook: 4.6}}};
  const drive = {running: false, stationary: true, assembled: true, locked: false, stop() {this.running = false;}};
  const engineLift = installEngineLiftPreview({T, scene, engine, body, studioRoot, drive});
  const mechanic = {enter() {}, exit() {}, pose() {}};
  const service = installWorkshopService({T, scene, engine, body, studioRoot, lift: engineLift, mechanic});
  const clampGroup = details.find(group => group.userData.sourcePartId === 'cooling-system');
  assert.equal(clampGroup.children.length, 3, 'Clamp bands, housings and screw heads');
  const clamps = new Map(clampGroup.children.map(mesh => [mesh, new Float32Array(mesh.instanceMatrix.array)]));
  for (const mesh of clamps.keys()) assert.equal(mesh.count, 4, 'Four tracked clamps in the original endpoint order');
  assert.ok(service.enter().ok);
  for (const progress of [.18, .30, .55, .78, .94, 1, .78, .55, .18]) {
    service.setProgress(progress); scene.updateMatrixWorld(true);
    for (const [mesh, original] of clamps) {
      for (const index of [0, 2]) assert.deepEqual(mesh.instanceMatrix.array.slice(index * 16, index * 16 + 16), original.slice(index * 16, index * 16 + 16), 'Radiator ends stay on their radiator');
      assert.notDeepEqual(mesh.instanceMatrix.array.slice(16, 32), original.slice(16, 32), 'Engine-side detail follows the released hose');
    }
  }
  service.setProgress(0);
  for (const [mesh, original] of clamps) assert.deepEqual(mesh.instanceMatrix.array, original, 'Refit restores exact detail matrices');
  service.exit(); service.dispose(); engineLift.dispose(); machinery.removeFromParent();
  let ownTextureDisposals = 0, ownMaterialDisposals = 0;
  for (const texture of textureSet) texture.addEventListener('dispose', () => ownTextureDisposals++);
  for (const material of newMaterials) material.addEventListener('dispose', () => ownMaterialDisposals++);
  const report = api.diagnostics;
  api.dispose(); api.dispose();
  assert.ok(api.diagnostics.disposed);
  assert.equal(originalsDisposed, 0, 'Disposal never destroys source materials or textures');
  assert.equal(ownTextureDisposals, 4, 'Every owned surface map is disposed exactly once');
  assert.equal(ownMaterialDisposals, newMaterials.size, 'Owned engine/detail material clones are disposed exactly once');
  for (const [object, original] of before) assert.equal(object.material, original.material, 'Disposal restores exact original material objects');
  for (const detail of details) assert.equal(detail.parent, null);
  assert.ok(renderer.shadowMap.needsUpdate);
  console.log(JSON.stringify({ok: true, source: commit, ...report}, null, 2));
} finally {
  if (temporary) fs.rmSync(temporary, {recursive: true, force: true});
}
