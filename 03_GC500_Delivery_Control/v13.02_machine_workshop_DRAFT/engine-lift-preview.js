/* Author: Andrew Fisher.
 * A reversible, illustrative prepared-engine lift for the workshop draft.
 * This is a presentation model, not a maintenance procedure or lift calculation.
 * Call update AFTER the application's part poses, visibility and hall tick.
 * The host owns its UI, camera, exclusive service controls and render scheduling.
 */

const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const phase = (p, start, end) => ease((p - start) / (end - start));

export function installEngineLiftPreview({T, scene, engine, body, studioRoot, drive}) {
  const machinery = studioRoot && studioRoot.userData.machinery;
  if (!T || !scene || !engine || !body || !drive || !machinery?.crane) throw Error('Engine lift needs the complete workshop scene.');

  // Explicit membership: the engine is not the cockpit, chassis or rear driveline.
  const ids = new Set([
    'engine-block', 'crankshaft', 'intake-trumpets', 'airbox', 'throttle-linkage',
    'accessory-crank-pulley', 'water-pump', 'alternator', 'accessory-idler', 'accessory-belt',
    'oil-pan', 'oil-pump', 'oil-galleries', 'distributor', 'ring-gear', 'starter-motor',
    'timing-crank-sprocket', 'timing-belt', 'timing-tensioner'
  ]);
  for (const side of ['near', 'far']) for (const name of ['cylinder-head', 'camshaft', 'valve-cover', 'throttle-shaft', 'timing-cam']) ids.add(`${name}-${side}`);
  for (let n = 1; n <= 8; n++) {
    for (const name of ['piston', 'connecting-rod', 'spark-plug']) ids.add(`${name}-${n}`);
    for (const kind of ['intake', 'exhaust']) for (const name of ['valve', 'spring', 'follower']) ids.add(`${kind}-${name}-${n}`);
  }
  const engineParts = engine.removable.filter(part => ids.has(part.id));
  const required = ['engine-block', 'crankshaft', 'oil-pan', 'timing-belt'];
  for (const id of required) if (!engineParts.some(part => part.id === id)) throw Error(`Engine lift is missing ${id}.`);
  const bonnet = body.removable.find(part => part.id === 'CAR-BODY-BONNET');
  const crane = machinery.crane;
  const drum = machinery.group.getObjectByName('crane hoist drum');
  const ropes = machinery.group.getObjectByName('crane ropes');
  if (!drum || !ropes || !bonnet) throw Error('Engine lift needs the crane drum, ropes and bonnet.');

  const root = new T.Group(); root.name = 'Illustrative engine lift preview'; root.visible = false; scene.add(root);
  const lift = new T.Group(); lift.name = 'Actual engine assemblies on the lift';
  const bonnetCarrier = new T.Group(); bonnetCarrier.name = 'Prepared bonnet position';
  const rig = new T.Group(); rig.name = 'Engine lifting beam and hook'; root.add(rig);
  const cradle = new T.Group(); cradle.name = 'Engine inspection cradle'; root.add(cradle);
  const bonnetStand = new T.Group(); bonnetStand.name = 'Bonnet trestles'; root.add(bonnetStand);
  const ownGeometries = new Set(), ownMaterials = new Set();
  const material = values => { const m = new T.MeshStandardMaterial(values); ownMaterials.add(m); return m; };
  const orange = material({color: 0xff6a13, roughness: .4, metalness: .55});
  const steel = material({color: 0xb9c6cd, roughness: .29, metalness: .86});
  const dark = material({color: 0x20272b, roughness: .56, metalness: .58});
  const rubber = material({color: 0x111719, roughness: .85, metalness: .04});
  function mesh(parent, geometry, mat, name, x = 0, y = 0, z = 0) {
    ownGeometries.add(geometry);
    const object = new T.Mesh(geometry, mat); object.name = name; object.position.set(x, y, z);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  const box = (parent, w, h, d, mat, name, x = 0, y = 0, z = 0) => mesh(parent, new T.BoxGeometry(w, h, d), mat, name, x, y, z);
  const barGeometry = new T.CylinderGeometry(.014, .014, 1, 8);
  const slingGeometry = new T.CylinderGeometry(.011, .011, 1, 8);
  const ropeEnds = [], slingEnds = [], anchors = [];
  const up = new T.Vector3(0, 1, 0), A = new T.Vector3(), B = new T.Vector3(), delta = new T.Vector3();
  function segment(object, a, b) {
    delta.copy(b).sub(a); const length = delta.length();
    object.visible = length > .0001; object.position.copy(a).addScaledVector(delta, .5);
    object.scale.set(1, Math.max(.0001, length), 1);
    if (length > .0001) object.quaternion.setFromUnitVectors(up, delta.multiplyScalar(1 / length));
  }
  // A compact twin-sheave block, visible hook, beam and four independent slings.
  box(rig, .16, .32, .7, orange, 'Hook block side plates', 0, .26, 0);
  for (const z of [-.3, .3]) {
    const sheave = mesh(rig, new T.CylinderGeometry(.12, .12, .07, 20), steel, 'Hoist sheave', 0, .38, z);
    sheave.rotation.x = Math.PI / 2;
    ropeEnds.push(mesh(root, barGeometry, steel, 'Rope termination'));
  }
  mesh(rig, new T.CylinderGeometry(.04, .04, .18, 12), steel, 'Hook swivel', 0, -.01, 0);
  const hook = mesh(rig, new T.TorusGeometry(.105, .025, 8, 24, Math.PI * 1.65), steel, 'Lifting hook', 0, -.12, 0);
  hook.rotation.z = Math.PI * .15;
  box(rig, 1.08, .09, .16, orange, 'Lifting beam', 0, -.48, 0);
  for (const x of [-.49, .49]) {
    const end = mesh(rig, barGeometry, steel, 'Beam bridle');
    segment(end, new T.Vector3(0, -.2, 0), new T.Vector3(x, -.48, 0));
  }
  for (const x of [-1.45, -.65]) for (const z of [-.30, .30]) {
    const eye = mesh(lift, new T.TorusGeometry(.045, .011, 8, 16), steel, 'Illustrated lifting eye', x, 1.08, z);
    // Eye and bracket belong to the lifting engine, keeping sling ends attached.
    box(lift, .10, .30, .035, dark, 'Illustrated lifting bracket', x, .91, z);
    box(lift, .14, .045, .12, steel, 'Illustrated bracket foot on cylinder head', x, .755, z);
    anchors.push(eye);
    slingEnds.push(mesh(root, slingGeometry, steel, 'Engine sling'));
  }
  for (const x of [-.28, .28]) {
    box(cradle, .12, .58, .12, dark, 'Cradle upright', x, .38, 0);
    box(cradle, .22, .09, .64, orange, 'Cradle saddle', x, .71, 0);
    box(cradle, .24, .045, .62, rubber, 'Cradle contact pad', x, .765, 0);
    box(cradle, .14, .10, 1.12, orange, 'Cradle cross foot', x, .085, 0);
    for (const z of [-.46, .46]) box(cradle, .18, .0465, .22, rubber, 'Cradle foot', x, .01925, z);
  }
  box(cradle, 1.22, .12, .14, orange, 'Cradle longitudinal rail', 0, .25, 0);
  for (const x of [-.48, .48]) {
    box(bonnetStand, .08, .62, .08, dark, 'Bonnet stand leg', x, .32, 0);
    box(bonnetStand, .12, .07, 1.10, orange, 'Bonnet support', x, .65, 0);
    box(bonnetStand, .14, .025, 1.12, rubber, 'Bonnet support padding', x, .698, 0);
    box(bonnetStand, .14, .084, .9, dark, 'Bonnet stand foot', x, .038, 0);
  }

  const snapshots = [], parentOrders = new Map();
  let saved = null, active = false, playing = false, progress = 0, stage = 'Prepared for lift';
  let baseBox = new T.Box3(), baseCenter = new T.Vector3(), finalOffset = new T.Vector3(), bonnetOffset = new T.Vector3();
  const tempBox = new T.Box3(), world = new T.Vector3(), hookWorld = new T.Vector3(), local = new T.Vector3();
  const targetCenter = new T.Vector3();

  function remember(object) {
    if (object.parent && !parentOrders.has(object.parent)) parentOrders.set(object.parent, object.parent.children.slice());
    const snapshot = {object, parent: object.parent, index: object.parent ? object.parent.children.indexOf(object) : -1,
      position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(), visible: object.visible,
      matrixAutoUpdate: object.matrixAutoUpdate};
    snapshots.push(snapshot); return snapshot;
  }
  function restore(snapshot) {
    const {object, parent, index} = snapshot;
    if (parent && object.parent !== parent) parent.add(object);
    if (parent && index >= 0) {
      const now = parent.children.indexOf(object); parent.children.splice(now, 1); parent.children.splice(index, 0, object);
    }
    object.position.copy(snapshot.position); object.quaternion.copy(snapshot.quaternion); object.scale.copy(snapshot.scale);
    object.visible = snapshot.visible; object.matrixAutoUpdate = snapshot.matrixAutoUpdate; object.updateMatrix();
  }
  function worldOffset(group, offset) {
    const parent = group.parent;
    parent.updateWorldMatrix(true, false);
    world.set(0, 0, 0).applyMatrix4(parent.matrixWorld);
    local.copy(world).add(offset); parent.worldToLocal(local);
    group.position.copy(local);
  }
  function pose() {
    if (!active) return;
    // The preview is deliberately non-driving throughout; no animation can restart it.
    drive.stop(); drive.locked = true;
    root.visible = true; crane.hook.visible = false;
    const liftAmount = phase(progress, .12, .48), travel = phase(progress, .48, .75), lowering = phase(progress, .75, .94);
    const rise = 1.45 * liftAmount + (finalOffset.y - 1.45) * lowering;
    worldOffset(lift, new T.Vector3(finalOffset.x * travel, rise, finalOffset.z * travel));
    worldOffset(bonnetCarrier, bonnetOffset);
    // Show the complete actual engine for the extraction; the host's cutaway
    // flags are restored on exit. No substitute or duplicate engine is made.
    for (const part of engineParts) part.group.visible = true;
    bonnet.group.visible = true;
    lift.updateWorldMatrix(true, true); bonnetCarrier.updateWorldMatrix(true, true);
    targetCenter.copy(baseCenter).add(new T.Vector3(finalOffset.x * travel, rise, finalOffset.z * travel));
    // This prepared preview begins rigged. The first hold lets the user inspect
    // it; constant sling geometry avoids pretending straight slings can shorten.
    hookWorld.set(targetCenter.x, baseBox.max.y + rise + 1.02, targetCenter.z);
    rig.position.copy(hookWorld);
    // Existing runway, bridge, trolley, drum and rope geometry do the actual crane work.
    const bridgeLocal = crane.bridge.parent.worldToLocal(hookWorld.clone());
    crane.bridge.position.x = bridgeLocal.x;
    crane.bridge.updateWorldMatrix(true, true);
    const trolleyLocal = crane.trolley.parent.worldToLocal(hookWorld.clone());
    crane.trolley.position.z = trolleyLocal.z;
    crane.trolley.updateWorldMatrix(true, true);
    const hookLocal = crane.hook.parent.worldToLocal(hookWorld.clone());
    crane.hook.position.y = hookLocal.y;
    const ropeLength = Math.max(.1, ropes.position.y - (hookLocal.y + .5));
    ropes.scale.y = ropeLength; drum.rotation.x = (4.6 - hookLocal.y) / .28;
    machinery.state.crane = {x: crane.bridge.position.x, z: crane.trolley.position.z, hook: hookLocal.y};
    // The original rope geometry terminates at hook + .5; short tails meet the sheaves.
    rig.updateWorldMatrix(true, true);
    for (let i = 0; i < 2; i++) {
      const z = i ? .3 : -.3;
      A.set(0, .5, z).applyMatrix4(rig.matrixWorld); B.set(0, .38, z).applyMatrix4(rig.matrixWorld);
      segment(ropeEnds[i], A, B);
    }
    for (let i = 0; i < anchors.length; i++) {
      anchors[i].getWorldPosition(B);
      A.set(i < 2 ? -.49 : .49, -.48, 0).applyMatrix4(rig.matrixWorld);
      segment(slingEnds[i], A, B);
    }
    stage = progress < .12 ? 'Rigging aligned over the engine' : progress < .48 ? 'Lift clear of the bay' : progress < .75 ? 'Traverse to the cradle' : progress < .94 ? 'Lower onto the cradle' : 'Engine supported on the cradle';
    scene.updateMatrixWorld();
  }

  function enter() {
    if (active) return {ok: true};
    if (drive.running || !drive.stationary) return {ok: false, reason: 'Wait for the engine and wheels to stop.'};
    if (!drive.assembled || drive.locked) return {ok: false, reason: 'Finish the current service and reassemble the machine first.'};
    snapshots.length = 0; parentOrders.clear();
    saved = {locked: drive.locked, crane: {...machinery.state.crane}};
    engine.root.updateWorldMatrix(true, true); body.root.updateWorldMatrix(true, true);
    engine.root.add(lift); lift.position.set(0, 0, 0); lift.quaternion.identity(); lift.scale.set(1, 1, 1);
    for (const part of engineParts) { remember(part.group); lift.add(part.group); }
    // Adding a parent with the same coordinate system preserves every part's local home pose.
    lift.updateWorldMatrix(true, true); baseBox.setFromObject(lift); baseBox.getCenter(baseCenter);
    // Seat the sump's casting on both padded saddles; a projecting drain plug is
    // not a support point. The existing cast-sump mesh is the first pan mesh.
    const sump = engineParts.find(part => part.id === 'oil-pan');
    const sumpCasting = sump.group.children.find(child => child.name.startsWith('Cast sump')) || sump.group;
    tempBox.setFromObject(sumpCasting);
    finalOffset.set(-1.45, .788 - tempBox.min.y, 2.85);
    cradle.position.set(baseCenter.x + finalOffset.x, 0, baseCenter.z + finalOffset.z);
    remember(bonnet.group); bonnet.group.parent.add(bonnetCarrier); bonnetCarrier.add(bonnet.group);
    bonnetCarrier.position.set(0, 0, 0); bonnetCarrier.updateWorldMatrix(true, true);
    tempBox.setFromObject(bonnet.group); const bonnetCenter = tempBox.getCenter(new T.Vector3());
    bonnetOffset.set(-1.5, .712 - tempBox.min.y, -2.65);
    bonnetStand.position.set(bonnetCenter.x + bonnetOffset.x, 0, bonnetCenter.z + bonnetOffset.z);
    for (const object of [crane.bridge, crane.trolley, crane.hook, drum, ropes]) remember(object);
    active = true; playing = false; progress = 0; drive.stop(); drive.locked = true; pose();
    return {ok: true};
  }
  function exit() {
    if (!active) return;
    active = false; playing = false; root.visible = false;
    // Restore original objects before removing the two temporary carriers.
    for (const snapshot of snapshots) restore(snapshot);
    lift.removeFromParent(); bonnetCarrier.removeFromParent();
    for (const [parent, order] of parentOrders) {
      const owned = order.filter(child => child.parent === parent);
      const later = parent.children.filter(child => !order.includes(child));
      parent.children.splice(0, parent.children.length, ...owned, ...later);
    }
    machinery.state.crane = saved.crane; drive.locked = saved.locked;
    snapshots.length = 0; parentOrders.clear(); saved = null; scene.updateMatrixWorld();
  }
  function update(dt = 0) {
    if (!active) return;
    if (playing) {
      progress = clamp(progress + Math.max(0, Math.min(.1, Number(dt) || 0)) / 20);
      if (progress >= 1) playing = false;
    }
    pose();
  }
  function setProgress(value) { progress = clamp(value); playing = false; pose(); return progress; }
  function setPlaying(value) { if (!active) return false; if (value && progress >= 1) progress = 0; playing = !!value; return playing; }
  function reset() { playing = false; progress = 0; pose(); }
  function dispose() {
    exit(); root.removeFromParent();
    for (const geometry of ownGeometries) geometry.dispose();
    for (const mat of ownMaterials) mat.dispose();
  }
  return {
    enter, exit, update, setProgress, setPlaying, reset, dispose,
    get active() { return active; }, get playing() { return playing; }, get progress() { return progress; }, get stage() { return stage; },
    get partIds() { return engineParts.map(part => part.id); },
    get bounds() { const b = new T.Box3(); if (active) { b.setFromObject(lift); b.union(tempBox.setFromObject(rig)); b.union(tempBox.setFromObject(cradle)); } return b; },
    get diagnostics() { return {active, progress, stage, partCount: engineParts.length, lift: lift.position.toArray(), crane: {...machinery.state.crane}, loadWorld: targetCenter.toArray(), cradleWorld: cradle.position.toArray(), driveLocked: drive.locked}; }
  };
}
