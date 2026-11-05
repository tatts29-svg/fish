/* Author: Andrew Fisher.
 * A reversible, illustrative prepared-engine lift and supported workshop bench.
 * This is a presentation model, not a maintenance procedure or lift calculation.
 * Call update AFTER the application's part poses, visibility and hall tick.
 * The host owns its UI, camera, exclusive service controls and render scheduling.
 */

const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const phase = (p, start, end) => ease((p - start) / (end - start));

export function installEngineLiftPreview({T, scene, engine, body, studioRoot, drive, reducedMotion = false}) {
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
  const material = (values, physical = false) => { const m = new (physical ? T.MeshPhysicalMaterial : T.MeshStandardMaterial)(values); ownMaterials.add(m); return m; };
  const orange = material({color: 0xff6a13, roughness: .35, metalness: .28, clearcoat: .36, clearcoatRoughness: .27}, true);
  const steel = material({color: 0xb9c6cd, roughness: .26, metalness: .91});
  const dark = material({color: 0x20272b, roughness: .49, metalness: .5});
  const weldMetal = material({color: 0x56636b, roughness: .48, metalness: .82});
  const brushed = material({color: 0x6e7d85, roughness: .42, metalness: .88});
  const rubber = material({color: 0x111719, roughness: .85, metalness: .04});
  function mesh(parent, geometry, mat, name, x = 0, y = 0, z = 0) {
    ownGeometries.add(geometry);
    const object = new T.Mesh(geometry, mat); object.name = name; object.position.set(x, y, z);
    geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new T.Vector3()), sides = [size.x, size.y, size.z].sort((a, b) => a - b);
    // The host prunes its original tiny casters before this workshop is installed.
    // Apply the same idea here: fine hardware remains lit and receives shadows,
    // while beam, hook and supporting steel create the load's meaningful shadow.
    const fine = sides[2] < .12 || sides[1] < .045 || /sling|rope|contact pad|padding|bracket foot|lifting bracket|base plate|Parts mat|ratchet|socket/i.test(name);
    object.castShadow = !fine; object.receiveShadow = true; parent.add(object); return object;
  }
  // Small real bevels catch the workshop lights without adding texture downloads.
  function bevelBox(w, h, d) {
    const bevel = Math.min(.005, w * .11, h * .11, d * .11), hw = w / 2 - bevel, hh = h / 2 - bevel;
    const shape = new T.Shape(); shape.moveTo(-hw, -hh); shape.lineTo(hw, -hh); shape.lineTo(hw, hh); shape.lineTo(-hw, hh); shape.closePath();
    const geometry = new T.ExtrudeGeometry(shape, {depth: d - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 1, steps: 1});
    geometry.translate(0, 0, -d / 2 + bevel); return geometry;
  }
  const box = (parent, w, h, d, mat, name, x = 0, y = 0, z = 0) => mesh(parent, bevelBox(w, h, d), mat, name, x, y, z);
  function instances(parent, geometry, mat, name, poses) {
    ownGeometries.add(geometry);
    const object = new T.InstancedMesh(geometry, mat, poses.length), matrix = new T.Matrix4();
    object.name = name; object.castShadow = false; object.receiveShadow = true;
    for (let i = 0; i < poses.length; i++) { const p = poses[i]; matrix.compose(p.position, p.quaternion || new T.Quaternion(), p.scale || new T.Vector3(1, 1, 1)); object.setMatrixAt(i, matrix); }
    object.instanceMatrix.needsUpdate = true; parent.add(object); return object;
  }
  // Bolts and washers are instanced per moving assembly, not separate draw calls.
  function fasteners(parent, placements) {
    const heads = [], washers = [], studs = [], axis = new T.Vector3(0, 1, 0);
    for (const [p, n] of placements) {
      const normal = new T.Vector3(...n).normalize(), base = new T.Vector3(...p), quaternion = new T.Quaternion().setFromUnitVectors(axis, normal);
      heads.push({position: base.clone().addScaledVector(normal, .009), quaternion});
      washers.push({position: base.clone().addScaledVector(normal, .002), quaternion});
      studs.push({position: base.clone().addScaledVector(normal, -.012), quaternion});
    }
    instances(parent, new T.CylinderGeometry(.013, .013, .014, 6), steel, 'Hex-head fasteners', heads);
    instances(parent, new T.CylinderGeometry(.018, .018, .004, 20), brushed, 'Fastener washers', washers);
    instances(parent, new T.CylinderGeometry(.007, .007, .035, 10), steel, 'Fastener shanks', studs);
  }
  function welds(parent, runs) {
    const beads = [], axis = new T.Vector3(1, 0, 0);
    for (const [start, end] of runs) {
      const a = new T.Vector3(...start), direction = new T.Vector3(...end).sub(a), length = direction.length(), steps = Math.max(2, Math.ceil(length / .009));
      const quaternion = new T.Quaternion().setFromUnitVectors(axis, direction.clone().normalize());
      for (let i = 0; i < steps; i++) beads.push({position: a.clone().addScaledVector(direction, (i + .5) / steps), quaternion, scale: new T.Vector3(length / steps / .008, 1, .8)});
    }
    instances(parent, new T.SphereGeometry(.0048, 6, 4), weldMetal, 'Weld bead seams', beads);
  }
  const barGeometry = new T.CylinderGeometry(.014, .014, 1, 8);
  const slingGeometry = new T.CylinderGeometry(.011, .011, 1, 8);
  const ropeEnds = [], hoistRopes = [], slingEnds = [], slingReturns = [], slingHooks = [], handlingLines = [], anchors = [];
  const rigging = {attached: 1, clear: 0, handles: false, handleIndex: 0};
  let riggingPoints = [];
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
    hoistRopes.push(mesh(root, new T.CylinderGeometry(.009, .009, 1, 10), brushed, 'Tensioned hoist rope'));
  }
  mesh(rig, new T.CylinderGeometry(.04, .04, .18, 12), steel, 'Hook swivel', 0, -.01, 0);
  const hook = mesh(rig, new T.TorusGeometry(.105, .025, 8, 24, Math.PI * 1.65), steel, 'Lifting hook', 0, -.12, 0);
  hook.rotation.z = Math.PI * .15;
  const latch = box(rig, .018, .13, .018, brushed, 'Hook safety latch', .078, -.1, 0); latch.rotation.z = -.35;
  box(rig, 1.08, .09, .16, orange, 'Lifting beam', 0, -.48, 0);
  for (const x of [-.52, .52]) box(rig, .025, .12, .19, dark, 'Beam end plate', x, -.48, 0);
  for(const x of[-.49,.49])for(const z of[-.09,.09])mesh(rig,new T.TorusGeometry(.035,.008,6,16),steel,'Sling return keeper',x,-.565,z);
  box(rig, .16, .14, .055, orange, 'Central lifting lug', 0, -.39, 0);
  for (const x of [-.49, .49]) {
    const end = mesh(rig, barGeometry, steel, 'Beam bridle');
    segment(end, new T.Vector3(0, -.2, 0), new T.Vector3(x, -.48, 0));
  }
  fasteners(rig, [-.3, .3].flatMap(z => [[[-.08, .26, z], [-1, 0, 0]], [[.08, .26, z], [1, 0, 0]]]).concat([[[0, -.38, .035], [0, 0, 1]]]));
  welds(rig, [[[-.46, -.432, -.08], [.46, -.432, -.08]], [[-.07, -.43, .03], [.07, -.43, .03]]]);
  const eyeBolts = [];
  for (const x of [-1.45, -.65]) for (const z of [-.30, .30]) {
    const eye = mesh(lift, new T.TorusGeometry(.045, .011, 8, 16), steel, 'Illustrated lifting eye', x, 1.08, z);
    // Eye and bracket belong to the lifting engine, keeping sling ends attached.
    box(lift, .10, .30, .035, dark, 'Illustrated lifting bracket', x, .91, z);
    box(lift, .14, .045, .12, steel, 'Illustrated bracket foot on cylinder head', x, .755, z);
    for (const dx of [-.043, .043]) eyeBolts.push([[x + dx, .779, z], [0, 1, 0]]);
    anchors.push(eye);
    slingEnds.push(mesh(root, slingGeometry, steel, 'Engine sling'));
    slingReturns.push(mesh(root, slingGeometry, steel, 'Slack sling return'));
    const connector = mesh(root, new T.TorusGeometry(.03, .008, 6, 16, Math.PI * 1.7), steel, 'Illustrated sling connector');
    connector.rotation.y = Math.PI / 2; slingHooks.push(connector);
    handlingLines.push(mesh(root, new T.CylinderGeometry(.0045, .0045, 1, 6), orange, 'Rigging guide line'));
  }
  fasteners(lift, eyeBolts);
  const cradleBolts = [], cradleWelds = [];
  for (const x of [-.28, .28]) {
    box(cradle, .12, .58, .12, dark, 'Cradle upright', x, .38, 0);
    box(cradle, .22, .09, .64, orange, 'Cradle saddle', x, .71, 0);
    box(cradle, .24, .045, .62, rubber, 'Cradle contact pad', x, .765, 0);
    box(cradle, .14, .10, 1.12, orange, 'Cradle cross foot', x, .085, 0);
    box(cradle, .20, .035, .20, orange, 'Bolted upright base plate', x, .155, 0);
    for (const dx of [-.065, .065]) for (const z of [-.065, .065]) cradleBolts.push([[x + dx, .173, z], [0, 1, 0]]);
    for (const z of [-.31, .31]) cradleBolts.push([[x, .712, z], [0, 0, Math.sign(z)]]);
    for (const z of [-.062, .062]) cradleWelds.push([[x - .057, .177, z], [x + .057, .177, z]]);
    for (const z of [-.46, .46]) box(cradle, .18, .0465, .22, rubber, 'Cradle foot', x, .01925, z);
  }
  box(cradle, 1.22, .12, .14, orange, 'Cradle longitudinal rail', 0, .25, 0);
  // A supported bench has somewhere for inspection tools and removed pieces.
  // These are generic workshop props; no dimensions or ratings are claimed.
  box(cradle, 1.35, .035, .40, brushed, 'Workshop service tray', 0, .58, -.67);
  for (const z of [-.865, -.475]) box(cradle, 1.35, .065, .018, dark, 'Service tray turned-up edge', 0, .61, z);
  for (const x of [-.666, .666]) box(cradle, .018, .065, .40, dark, 'Service tray end', x, .61, -.67);
  for (const x of [-.48, .48]) {
    box(cradle, .045, .30, .045, dark, 'Tray bracket upright', x, .42, -.67);
    box(cradle, .045, .045, .68, dark, 'Tray bracket arm', x, .29, -.34);
    cradleWelds.push([[x - .022, .314, -.68], [x + .022, .314, -.68]]);
  }
  box(cradle, .78, .018, .66, dark, 'Under-engine catch tray', 0, .43, 0);
  for (const z of [-.32, .32]) box(cradle, .78, .055, .015, brushed, 'Catch tray edge', 0, .455, z);
  const toolMat = material({color: 0x1d2930, roughness: .78, metalness: .06});
  box(cradle, .42, .012, .22, toolMat, 'Parts mat on service tray', -.32, .606, -.67);
  for (let i = 0; i < 3; i++) {
    const socket = mesh(cradle, new T.CylinderGeometry(.023 + i * .003, .023 + i * .003, .045, 12, 1, true), steel, 'Inspection socket', -.44 + i * .105, .635, -.67);
    socket.rotation.y = .3 * i;
  }
  box(cradle, .29, .018, .025, steel, 'Workshop ratchet handle', .22, .616, -.67);
  mesh(cradle, new T.CylinderGeometry(.038, .038, .025, 20), steel, 'Workshop ratchet head', .08, .622, -.67);
  fasteners(cradle, cradleBolts); welds(cradle, cradleWelds);
  for (const x of [-.48, .48]) {
    box(bonnetStand, .08, .62, .08, dark, 'Bonnet stand leg', x, .32, 0);
    box(bonnetStand, .12, .07, 1.10, orange, 'Bonnet support', x, .65, 0);
    box(bonnetStand, .14, .025, 1.12, rubber, 'Bonnet support padding', x, .698, 0);
    box(bonnetStand, .14, .084, .9, dark, 'Bonnet stand foot', x, .038, 0);
  }

  const snapshots = [], parentOrders = new Map();
  let saved = null, active = false, playing = false, progress = 0, direction = 1, stage = 'Prepared for lift';
  let motionPreference = reducedMotion;
  const motionReduced = () => typeof motionPreference === 'function' ? !!motionPreference() : !!motionPreference;
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
    root.visible = true; crane.hook.visible = false; ropes.visible = false;
    const liftAmount = phase(progress, .12, .48), travel = phase(progress, .48, .75), lowering = phase(progress, .75, .94);
    const rise = 1.45 * liftAmount + (finalOffset.y - 1.45) * lowering;
    // A small travel response belongs to progress, never wall-clock time: pause
    // holds exactly, reverse retraces it, and reduced motion removes it entirely.
    const u = clamp((progress - .48) / .27), v = clamp((progress - .75) / .19);
    const sway = motionReduced() ? 0 : .022 * Math.sin(Math.PI * u) ** 2 * Math.sin(Math.PI * 3 * u) + .008 * Math.sin(Math.PI * v) ** 2 * Math.sin(Math.PI * 3 * v);
    const offset = new T.Vector3(finalOffset.x * travel + sway, rise, finalOffset.z * travel - sway * .45);
    worldOffset(lift, offset);
    worldOffset(bonnetCarrier, bonnetOffset);
    // Show the complete actual engine for the extraction; the host's cutaway
    // flags are restored on exit. No substitute or duplicate engine is made.
    for (const part of engineParts) part.group.visible = true;
    bonnet.group.visible = true;
    lift.updateWorldMatrix(true, true); bonnetCarrier.updateWorldMatrix(true, true);
    targetCenter.copy(baseCenter).add(offset);
    // This prepared preview begins rigged. The first hold lets the user inspect
    // it; constant sling geometry avoids pretending straight slings can shorten.
    hookWorld.set(targetCenter.x, baseBox.max.y + rise + 1.02, targetCenter.z);
    const nominalHook = hookWorld.clone(), release = 1 - rigging.attached;
    // Once the engine is supported, pay out a little line to create slack, then
    // clip each free leg back to the beam. Only the unloaded rig moves clear.
    hookWorld.y += -.12 * release + 1.05 * rigging.clear;
    hookWorld.z += 1.65 * rigging.clear;
    rig.position.copy(hookWorld);
    // Existing runway, bridge, trolley, drum and rope geometry do the actual crane work.
    const commandedHook = hookWorld.clone(); commandedHook.x -= sway; commandedHook.z += sway * .45;
    const bridgeLocal = crane.bridge.parent.worldToLocal(commandedHook.clone());
    crane.bridge.position.x = bridgeLocal.x;
    crane.bridge.updateWorldMatrix(true, true);
    const trolleyLocal = crane.trolley.parent.worldToLocal(commandedHook.clone());
    crane.trolley.position.z = trolleyLocal.z;
    crane.trolley.updateWorldMatrix(true, true);
    const hookLocal = crane.hook.parent.worldToLocal(hookWorld.clone());
    crane.hook.position.y = hookLocal.y;
    const ropeLength = Math.max(.1, ropes.position.y - (hookLocal.y + .5));
    ropes.scale.y = ropeLength;
    machinery.state.crane = {x: crane.bridge.position.x, z: crane.trolley.position.z, hook: hookLocal.y};
    // The original rope geometry terminates at hook + .5; short tails meet the sheaves.
    rig.updateWorldMatrix(true, true);
    for (let i = 0; i < 2; i++) {
      const z = i ? .3 : -.3;
      A.set(0, .5, z).applyMatrix4(rig.matrixWorld); B.set(0, .38, z).applyMatrix4(rig.matrixWorld);
      segment(ropeEnds[i], A, B);
      B.copy(A); A.set(0, ropes.position.y, z).applyMatrix4(crane.trolley.matrixWorld);
      segment(hoistRopes[i], A, B);
    }
    // The hoist drum pays out the represented line, including the tiny lean.
    drum.rotation.x = (hoistRopes[0].scale.y - (ropes.position.y - 5.1)) / .28;
    riggingPoints = [];
    for (let i = 0; i < anchors.length; i++) {
      const side = i % 2 ? 1 : -1, x = i < 2 ? -.49 : .49;
      const eye = anchors[i].getWorldPosition(new T.Vector3());
      const nominalTop = nominalHook.clone().add(new T.Vector3(x, -.48, 0)), length = nominalTop.distanceTo(eye);
      const legRelease = ease(clamp(release * 4 - [2, 0, 3, 1][i]));
      const top = new T.Vector3(x, -.48, 0).applyMatrix4(rig.matrixWorld);
      const clip = new T.Vector3(x, -.60, side * .09).applyMatrix4(rig.matrixWorld);
      const end = eye.clone().lerp(clip, legRelease);
      if (legRelease < 1e-8 && release < 1e-8) {
        segment(slingEnds[i], top, end); slingReturns[i].visible = false;
      } else {
        const run = end.clone().sub(top), d = Math.min(length, run.length()), unit = run.clone().normalize();
        let outward = new T.Vector3(0,-1,0).addScaledVector(unit,unit.y);
        if(outward.lengthSq()<1e-8)outward.set(0,0,side);else outward.normalize();
        const bend = top.clone().add(end).multiplyScalar(.5).addScaledVector(outward, Math.sqrt(Math.max(0, length * length - d * d)) * .5);
        segment(slingEnds[i], top, bend); segment(slingReturns[i], bend, end);
      }
      slingHooks[i].position.copy(end); slingHooks[i].visible = true;
      const grip = end.clone(); grip.y = Math.min(1.65,Math.max(.82,end.y+.04)); grip.z = Math.max(targetCenter.z + .78, end.z + .50);
      segment(handlingLines[i], end, grip);
      handlingLines[i].visible = !!rigging.handles && rigging.handleIndex === i && rigging.clear < .001;
      riggingPoints.push({index: i, eye: eye.toArray(), hook: end.toArray(), grip: grip.toArray(), attached: legRelease < 1e-6, release: legRelease});
    }
    stage = progress >= .999 ? 'Engine supported on the service bench' : direction < 0 ?
      (progress <= .001 ? 'Engine refitted in the bay' : progress < .48 ? 'Lower the engine into the bay' : progress < .75 ? 'Return to the engine bay' : 'Lift clear of the service bench') :
      (progress < .12 ? 'Rigging aligned over the engine' : progress < .48 ? 'Lift clear of the bay' : progress < .75 ? 'Traverse to the service bench' : progress < .94 ? 'Lower onto the service bench' : 'Settle onto the bench supports');
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
    active = true; playing = false; progress = 0; direction = 1;
    Object.assign(rigging, {attached: 1, clear: 0, handles: false, handleIndex: 0});
    drive.stop(); drive.locked = true; pose();
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
      progress = clamp(progress + direction * Math.max(0, Math.min(.1, Number(dt) || 0)) / 20);
      if (direction > 0 ? progress >= 1 : progress <= 0) playing = false;
    }
    pose();
  }
  function setProgress(value) { progress = clamp(value); playing = false;if(progress>.001&&progress<.999)Object.assign(rigging,{attached:1,clear:0,handles:false});pose();return progress; }
  function setPlaying(value) {
    if (!active) return false;
    if (value && direction > 0 && progress >= 1) progress = 0;
    playing = !!value && !(direction < 0 && progress <= 0); return playing;
  }
  function setDirection(value) { direction = Number(value) < 0 ? -1 : 1; pose(); return direction; }
  function reverse() { if (!active) return false; direction *= -1; playing = direction > 0 ? progress < 1 : progress > 0; pose(); return playing; }
  function refit() { if (!active) return false; direction = -1; playing = progress > 0; pose(); return playing; }
  function setReducedMotion(value) { motionPreference = !!value; pose(); return motionReduced(); }
  function setRigging(value = {}) {
    const attached = value.attached === undefined ? rigging.attached : clamp(value.attached);
    const clear = value.clear === undefined ? rigging.clear : clamp(value.clear);
    // Neither a service cue nor a manual scrub may unhook a suspended engine.
    if (progress > .001 && progress < .999 && (attached < 1 || clear > 0)) return false;
    if (clear > .001 && attached > .001) return false;
    Object.assign(rigging, {attached, clear});
    if (value.handles !== undefined) rigging.handles = !!value.handles;
    if (value.handleIndex !== undefined) rigging.handleIndex = Math.max(0, Math.min(3, Math.round(value.handleIndex)));
    pose(); return true;
  }
  function setServicePose(value = {}) {
    const next=clamp(value.progress),r=value.rigging||{},attached=clamp(r.attached??1),clear=clamp(r.clear??0);
    if(next>.001&&next<.999&&(attached<1||clear>0)||clear>.001&&attached>.001)return false;
    progress=next;playing=false;direction=Number(value.direction)<0?-1:1;
    Object.assign(rigging,{attached,clear,handles:!!r.handles,handleIndex:Math.max(0,Math.min(3,Math.round(r.handleIndex||0)))});
    pose();return true;
  }
  function reset() { playing = false; progress = 0; direction = 1;Object.assign(rigging,{attached:1,clear:0,handles:false,handleIndex:0});pose(); }
  function dispose() {
    exit(); root.removeFromParent();
    for (const geometry of ownGeometries) geometry.dispose();
    for (const mat of ownMaterials) mat.dispose();
  }
  return {
    enter, exit, update, setProgress, setPlaying, setDirection, reverse, refit, setReducedMotion, setRigging, setServicePose, reset, dispose,
    get active() { return active; }, get playing() { return playing; }, get progress() { return progress; }, get stage() { return stage; },
    get direction() { return direction; }, get benchReady() { return active && progress >= .999; }, get reducedMotion() { return motionReduced(); },
    get partIds() { return engineParts.map(part => part.id); },
    get riggingTargets() { return riggingPoints.map(point => ({...point, eye: point.eye.slice(), hook: point.hook.slice(), grip: point.grip.slice()})); },
    get engineBounds() { return new T.Box3().setFromObject(lift); },
    get bounds() { const b = new T.Box3(); if (active) { b.setFromObject(lift); b.union(tempBox.setFromObject(rig)); b.union(tempBox.setFromObject(cradle)); } return b; },
    get diagnostics() { return {active, progress, direction, stage, benchReady: active && progress >= .999, reducedMotion: motionReduced(), partCount: engineParts.length, lift: lift.position.toArray(), crane: {...machinery.state.crane}, loadWorld: targetCenter.toArray(), cradleWorld: cradle.position.toArray(), hoistLengths: hoistRopes.map(rope => rope.scale.y), rigging: {...rigging}, driveLocked: drive.locked}; }
  };
}
