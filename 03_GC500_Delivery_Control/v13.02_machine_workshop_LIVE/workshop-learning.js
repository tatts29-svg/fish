/* Author: Andrew Fisher.
 * Bench lessons on the original engine objects. This is an illustrative operating
 * model, not factory servicing guidance, real telemetry or a lifting calculation.
 * Host order: normal engine poses → lift.update → learning.update → render.
 */
import {valveLift} from './engine-kinematics.js';

const NOTICE = 'Illustrative model and fault examples; not factory servicing guidance. No live measurements.';
const MODES = ['inspect', 'oil', 'coolant', 'fault'];
const DETAILS = [
  ['crankshaft', 'Crankshaft', 'The cross-plane crank turns the eight connecting rods. Its flywheel and front timing sprocket share the crank angle.', 'Pistons → connecting rods → crankshaft → flywheel'],
  ['piston-1', 'Piston 1', 'Watch the original crown, skirt and three ring meshes travel in the sectioned liner as the crank turns.', 'Piston pin → connecting rod 1 → crank pin'],
  ['connecting-rod-1', 'Connecting rod 1', 'The small end follows the piston; the big end follows the rotating crank pin. The rod changes angle through each turn.', 'Piston 1 ↔ crankshaft'],
  ['camshaft-near', 'Right camshaft', 'The camshaft turns once for two crank revolutions. Its phased lobes press the followers above the valves.', '40-tooth timing sprocket → cam lobes → followers'],
  ['intake-valve-1', 'Intake valve 1', 'The follower tracks the actual cam-lobe profile. The spring returns the valve as the lobe moves away.', 'Cam lobe → follower → valve and return spring'],
  ['timing-belt', 'Timing belt', 'The continuous toothed belt joins the 20-tooth crank sprocket to both 40-tooth cam sprockets.', 'Crank sprocket → timing belt → left and right cam sprockets'],
  ['timing-tensioner', 'Timing tensioner', 'The spring arm holds an idler against the back of the timing belt. Its smooth wheel turns opposite to the sprockets.', 'Spring arm → idler → back of timing belt'],
  ['oil-pan', 'Sectioned sump', 'The existing cutaway sump shows the floor, windage baffles, gasket and drain plug. The near wall is already sectioned.', 'Sump oil → pickup strainer → oil pump'],
  ['oil-pump', 'Oil pump and pickup', 'Two meshing gears sit at the bottom of the distributor drive tower. The camshaft drives that tower and the pump at half crank speed.', 'Camshaft → distributor shaft → oil-pump drive gear'],
  ['oil-galleries', 'Oil galleries', 'Follow the original outlet, main gallery, five main-bearing feeds and risers to both camshafts. Amber dots follow hand rotation, not a pressure reading.', 'Pump outlet → main gallery → bearings and camshaft feeds'],
  ['distributor', 'Distributor and drive tower', 'The sectioned cap reveals its rotor. The vertical shaft links the rear camshaft skew gear to the oil-pump drive below.', 'Camshaft skew gear → distributor rotor and oil-pump shaft'],
  ['accessory-belt', 'Accessory belt', 'This separate serpentine belt contacts the crank pulley, water pump, alternator and idler.', 'Crank pulley → accessory belt → water pump and alternator'],
  ['water-pump', 'Water pump and unions', 'Inspect the actual pump housing, pulley and two coolant unions. The radiator stays on the car while this engine is on its cradle.', 'Accessory belt → pump pulley; coolant unions → external circuit'],
  ['cooling-system', 'Radiator and coolant hoses', 'The radiator, twin fan cages and upper/lower hoses stay on the car. Cyan traces follow those existing hoses; internal water jackets and intervening pipe runs are not modelled.', 'Upper hose → radiator core → lower hose (open ends in this view)'],
  ['alternator', 'Alternator', 'The original pulley, cooling fan, case fins and bracket remain part of the lifted engine. Its pulley follows the accessory-belt ratio.', 'Accessory belt → alternator pulley and rotor'],
  ['starter-motor', 'Starter motor', 'The starter body and solenoid sit beside the flywheel ring gear. Its pinion remains withdrawn during hand rotation.', 'Solenoid → throw-in pinion → flywheel ring gear when starting'],
];
const CHALLENGES = [
  {id: 'timing-belt', label: 'Crank turns; cams stop', prompt: 'Turn the crank and follow the timing drive. Inspect the component that interrupts the drive to both camshafts.', found: 'The timing belt has a visible break. The crank and pistons move while both camshafts and their valves hold.', repaired: 'Timing belt restored. Turn the crank: both camshafts and the valves follow it again.'},
  {id: 'oil-pump', label: 'Oil-pump drive interrupted', prompt: 'Turn the crank and follow the distributor drive tower down towards the sump. Find the separated driven component.', found: 'The oil pump has been withdrawn from the distributor drive shaft. Its gears no longer follow the shaft.', repaired: 'Oil pump reseated. Turn the crank: the shaft drives the pump gears again; Oil shows the gallery path.'},
];

export function installWorkshopLearning({T, scene, engine, lift}) {
  if (!T || !scene || !engine?.removable || !lift) throw Error('Workshop learning needs the original engine and lift.');
  const originals = new Map(engine.removable.map(part => [part.id, part]));
  for (const id of ['crankshaft', 'timing-belt', 'oil-pump', 'oil-galleries', 'water-pump', 'cooling-system']) {
    if (!originals.has(id)) throw Error(`Workshop learning is missing ${id}.`);
  }
  const parts = DETAILS.filter(([id]) => originals.has(id)).map(([id, label, detail, connection]) => ({id, label, detail, connection}));
  const root = new T.Group(); root.name = 'Workshop learning overlays'; root.visible = false; scene.add(root);
  const ownGeometries = new Set(), ownMaterials = new Set(), bindings = [], flowDots = [];
  const geometry = value => { ownGeometries.add(value); return value; };
  const material = value => { const m = new T.MeshBasicMaterial(value); ownMaterials.add(m); return m; };
  const amber = material({color: 0xffb62e, transparent: true, opacity: .62, depthWrite: false});
  const cyan = material({color: 0x47d5ef, transparent: true, opacity: .62, depthWrite: false});
  const bright = material({color: 0xffe1a0});
  const red = material({color: 0xff544e});
  const dotGeometry = geometry(new T.SphereGeometry(.018, 8, 6));
  const oilGroup = new T.Group(), coolantGroup = new T.Group(), faultGroup = new T.Group();
  oilGroup.name = 'Oil gallery teaching trace'; coolantGroup.name = 'Existing coolant hose teaching trace'; faultGroup.name = 'Teaching fault markers';
  root.add(oilGroup, coolantGroup, faultGroup);
  function anchored(parent, id) {
    const group = new T.Group(); group.matrixAutoUpdate = false; group.name = `Trace on ${id}`;
    parent.add(group); bindings.push({group, anchor: originals.get(id).group}); return group;
  }
  function pathMesh(parent, points, radius, mat) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
    const mesh = new T.Mesh(geometry(new T.TubeGeometry(curve, Math.max(12, points.length * 7), radius, 6, false)), mat);
    mesh.name = 'Trace follows existing model route'; mesh.renderOrder = 3; parent.add(mesh); return curve;
  }
  const oilAnchor = anchored(oilGroup, 'oil-galleries');
  // These paths come directly from buildOilGalleries; no invented schematic loop.
  for (const points of engine.oil.paths) {
    const curve = pathMesh(oilAnchor, points, .010, amber);
    const dot = new T.Mesh(dotGeometry, bright); dot.name = 'Oil direction marker'; oilAnchor.add(dot);
    flowDots.push({dot, curve, length: curve.getLength()});
  }
  const radiatorAnchor = anchored(coolantGroup, 'cooling-system');
  // Same control points/radii as car-powertrain.js, including the open hose ends.
  const coolantRoutes = [
    [[.04,.23,-.47],[.24,.28,-.46],[.44,.25,-.48],[.57,.27,-.36]],
    [[.04,-.21,.47],[.18,-.27,.50],[.46,-.27,.48],[.65,-.05,.28]],
  ];
  for (const points of coolantRoutes) pathMesh(radiatorAnchor, points, .040, cyan);
  const pumpAnchor = anchored(coolantGroup, 'water-pump');
  // The actual two cylindrical unions in engine-accessories.js. There is no
  // modelled water jacket or joined return circuit, so none is fabricated here.
  for (const points of [[[.02,-.07,.06],[.18,-.07,.06]], [[.10,.06,-.10],[.10,.06,0]]]) pathMesh(pumpAnchor, points, .023, cyan);

  const belt = originals.get('timing-belt').group;
  const beltBacking = belt.getObjectByName('Unbroken timing belt backing');
  const beltTeeth = belt.getObjectByName('Travelling timing belt teeth');
  if (!beltBacking?.geometry?.index || !beltTeeth) throw Error('Workshop learning requires the original timing belt.');
  const intactBelt = beltBacking.geometry, brokenBelt = geometry(intactBelt.clone());
  const vertex = intactBelt.attributes.position, stripCount = (vertex.count / 2) - 1;
  let highest = 0;
  for (let i = 1; i < stripCount; i++) if (vertex.getY(i * 2) > vertex.getY(highest * 2)) highest = i;
  const gapStart = Math.max(0, highest - 14), gapEnd = Math.min(stripCount, highest + 14);
  const indices = Array.from(intactBelt.index.array);
  brokenBelt.setIndex(indices.filter((_, i) => Math.floor(i / 6) < gapStart || Math.floor(i / 6) >= gapEnd));
  const beltFaultAnchor = anchored(faultGroup, 'timing-belt');
  for (const sample of [gapStart, gapEnd]) {
    const dot = new T.Mesh(dotGeometry, red); dot.position.fromBufferAttribute(vertex, sample * 2); dot.name = 'Illustrative belt break end'; beltFaultAnchor.add(dot);
  }
  const oilFaultAnchor = anchored(faultGroup, 'oil-pump');
  const pumpFaultDot = new T.Mesh(dotGeometry, red); pumpFaultDot.position.set(0, .075, 0); pumpFaultDot.name = 'Disconnected oil-pump drive'; oilFaultAnchor.add(pumpFaultDot);
  const highlightBox = new T.Box3(), highlight = new T.Box3Helper(highlightBox, 0xffad5c);
  ownGeometries.add(highlight.geometry); ownMaterials.add(highlight.material);
  highlight.name = 'Inspected original component'; highlight.material.depthTest = false; highlight.material.transparent = true; highlight.material.opacity = .65; root.add(highlight);
  root.traverse(object => { object.userData.workshopOverlay = true; object.raycast = () => {}; });

  const originalOilDots = originals.get('oil-galleries').group.getObjectByName('Oil moving through the drillings');
  const covers = ['airbox', 'valve-cover-near', 'valve-cover-far'].map(id => originals.get(id)?.group).filter(Boolean);
  const crank = originals.get('crankshaft').group.getObjectByName('Rotating crankshaft');
  const localUp = new T.Vector3(0, 1, 0), rodDirection = new T.Vector3(), focus = new T.Vector3();
  const snapshots = new Map();
  let enabled = false, disposed = false, mode = 'inspect', cutaway = true, selectedId = 'crankshaft';
  let angle = 0, startAngle = 0, oilTravel = 0, challenge = null, lastMessage = '';
  const available = () => !disposed && lift.active && (typeof lift.benchReady === 'boolean' ? lift.benchReady : lift.progress >= .999);
  const faultActive = id => challenge?.id === id && challenge.status !== 'repaired';
  function remember() {
    snapshots.clear();
    for (const part of originals.values()) part.group.traverse(object => {
      snapshots.set(object, {position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(), visible: object.visible,
        geometry: object.geometry, instances: object.isInstancedMesh ? object.instanceMatrix.array.slice() : null});
    });
  }
  function restore() {
    for (const [object, saved] of snapshots) {
      object.position.copy(saved.position); object.quaternion.copy(saved.quaternion); object.scale.copy(saved.scale); object.visible = saved.visible;
      if (saved.geometry) object.geometry = saved.geometry;
      if (saved.instances) { object.instanceMatrix.array.set(saved.instances); object.instanceMatrix.needsUpdate = true; }
      object.updateMatrix();
    }
    snapshots.clear();
  }
  function begin() {
    if (!available()) return {ok: false, reason: 'Lower the engine fully onto the cradle to open the service bench.'};
    if (!enabled) {
      remember(); enabled = true; angle = startAngle = engine.root.userData.mech?.crank || 0; oilTravel = 0;
    }
    return {ok: true};
  }
  function poseMechanics() {
    // Use the existing part references and the original rig kinematics. Calling
    // engine.animate a second time would integrate the car's drivetrain and oil
    // twice; bench inspection deliberately never changes that operating state.
    const camAngle = faultActive('timing-belt') ? challenge.angle : angle;
    crank.rotation.x = angle;
    for (const item of engine.camRotors) item.rotor.rotation.x = camAngle * .5;
    for (const item of engine.pistonMotions) {
      const a = angle + item.phase, py = .069 * Math.cos(a), pz = .069 * Math.sin(a);
      const projection = (py + item.side * pz) * Math.SQRT1_2;
      const distance = projection + Math.sqrt(.285 * .285 - .069 * .069 + projection * projection);
      const y = distance * Math.SQRT1_2, z = item.side * distance * Math.SQRT1_2;
      item.piston.position.set(0, y, z); item.rod.position.set(0, py, pz);
      rodDirection.set(0, y - py, z - pz).normalize(); item.rod.quaternion.setFromUnitVectors(localUp, rodDirection);
    }
    for (const item of engine.valveMotions) {
      const rise = valveLift(camAngle, item.n, item.kind, item.side, item.phase);
      item.movingValve.position.set(0, -rise * Math.SQRT1_2, -item.side * rise * Math.SQRT1_2);
      item.spring.scale.y = (.068 - rise) / .068; item.follower.position.y = .537 - rise;
    }
    engine.timing.animate(camAngle);
    for (const rotor of engine.timing.rotors) if (rotor.id === 'timing-crank-sprocket') rotor.rotor.rotation.x = angle;
    engine.accessories.animate(angle);
    for (const rotor of engine.systems.rotors) {
      const a = rotor.id === 'ring-gear' ? angle : rotor.id === 'oil-pump' && faultActive('oil-pump') ? challenge.angle : camAngle;
      rotor.group.rotation[rotor.axis] = a * rotor.ratio;
    }
  }
  function update() {
    if (!enabled || disposed) return;
    if (!available()) { reset(); return; }
    root.visible = true; poseMechanics();
    for (const cover of covers) cover.visible = !cutaway;
    // Selecting a cover is deliberately not offered in the focused bench list.
    const pump = originals.get('oil-pump').group;
    const savedPump = snapshots.get(pump);
    pump.position.copy(savedPump.position);
    if (faultActive('oil-pump')) pump.position.x += .18;
    beltBacking.geometry = faultActive('timing-belt') ? brokenBelt : intactBelt;
    beltTeeth.visible = !faultActive('timing-belt') && snapshots.get(beltTeeth).visible;
    if (originalOilDots) originalOilDots.visible = mode === 'oil' ? false : snapshots.get(originalOilDots).visible;
    oilGroup.visible = mode === 'oil'; coolantGroup.visible = mode === 'coolant';
    faultGroup.visible = !!challenge && challenge.status !== 'repaired';
    beltFaultAnchor.visible = faultActive('timing-belt'); oilFaultAnchor.visible = faultActive('oil-pump');
    for (const {group, anchor} of bindings) { anchor.updateWorldMatrix(true, false); group.matrix.copy(anchor.matrixWorld); }
    for (const item of flowDots) item.dot.position.copy(item.curve.getPointAt(((oilTravel / item.length) % 1 + 1) % 1));
    const selected = originals.get(selectedId).group; selected.updateWorldMatrix(true, true);
    highlightBox.setFromObject(selected).expandByScalar(.018); highlightBox.getCenter(focus); highlight.visible = true;
    root.updateMatrixWorld(true);
  }
  function setMode(value) {
    if (!MODES.includes(value)) return {ok: false, reason: 'Unknown bench view.'};
    const result = begin(); if (!result.ok) return result;
    mode = value;
    if (mode === 'oil') selectedId = 'oil-galleries';
    if (mode === 'coolant') selectedId = 'water-pump';
    update(); return {ok: true};
  }
  function selectPart(id) {
    const part = parts.find(p => p.id === id);
    if (!part) return {ok: false, reason: 'Choose an available engine component.'};
    const result = begin(); if (!result.ok) return result;
    selectedId = id;
    if (challenge && challenge.status !== 'repaired') {
      challenge.attempts++;
      if (id === challenge.id) { challenge.status = 'found'; lastMessage = challenge.spec.found; }
      else lastMessage = `${part.label} inspected. Follow the interrupted connection and inspect the component at the gap.`;
    }
    update(); return {ok: true, part: {...part}};
  }
  function setCutaway(value) {
    const result = begin(); if (!result.ok) return result;
    cutaway = !!value; update(); return {ok: true};
  }
  function turnCrank(radians = Math.PI / 6) {
    if (!Number.isFinite(radians)) return {ok: false, reason: 'Use a finite hand-rotation step.'};
    const result = begin(); if (!result.ok) return result;
    const step = Math.max(-Math.PI * 2, Math.min(Math.PI * 2, radians)); angle += step;
    if (!faultActive('oil-pump') && !faultActive('timing-belt')) oilTravel += Math.abs(step) * .5 * .08;
    update(); return {ok: true, angle};
  }
  function startChallenge(id = 'timing-belt') {
    const spec = CHALLENGES.find(item => item.id === id);
    if (!spec) return {ok: false, reason: 'Choose an available fault example.'};
    const result = begin(); if (!result.ok) return result;
    challenge = {id, spec, status: 'searching', angle, attempts: 0}; mode = 'fault'; cutaway = true; selectedId = 'crankshaft'; lastMessage = spec.prompt;
    update(); return {ok: true};
  }
  function repairChallenge() {
    if (!enabled || !available()) return {ok: false, reason: 'Open the service bench first.'};
    if (!challenge || challenge.status !== 'found' || selectedId !== challenge.id) return {ok: false, reason: 'Inspect the faulty component before repairing this example.'};
    challenge.status = 'repaired'; lastMessage = challenge.spec.repaired; update(); return {ok: true};
  }
  function resetChallenge() { challenge = null; lastMessage = ''; if (enabled) update(); return {ok: true}; }
  function reset() {
    if (enabled) restore(); enabled = false; root.visible = false; challenge = null; mode = 'inspect'; cutaway = true; selectedId = 'crankshaft'; angle = startAngle = oilTravel = 0; lastMessage = '';
  }
  function dispose() {
    if (disposed) return; reset(); disposed = true; root.removeFromParent();
    for (const geo of ownGeometries) geo.dispose(); for (const mat of ownMaterials) mat.dispose();
  }
  function state() {
    const flow = mode === 'oil' ? {
      label: 'Oil · existing gallery routes',
      detail: faultActive('oil-pump') || faultActive('timing-belt') ? 'The teaching fault interrupts the pump drive. Amber markers hold until the connection is restored.' : 'Turn the crank to move the amber direction markers along the modelled drillings. Colour shows a route, not oil pressure or temperature.',
      steps: ['Pickup and gear pump', 'Outlet to main gallery', 'Five main-bearing feeds', 'Right-bank riser', 'Front cross-drilling and left-bank riser'],
    } : mode === 'coolant' ? {
      label: 'Coolant · existing hoses and pump unions',
      detail: 'Cyan follows the actual upper/lower radiator hoses and pump unions. The radiator stays on the car. The removed engine has no circulating coolant loop; water jackets and intervening pipe runs are not modelled.',
      steps: ['Upper radiator hose on the car', 'Radiator core and lower hose on the car', 'Two water-pump unions on the engine cradle'],
    } : null;
    return {available: available(), active: enabled && available(), mode, cutaway, selectedId,
      selected: {...parts.find(part => part.id === selectedId)}, crankAngle: angle, crankDegrees: Math.round(((angle - startAngle) * 180 / Math.PI % 720 + 720) % 720), notice: NOTICE,
      instruction: mode === 'fault' ? (lastMessage || 'Choose an example, turn the crank, then inspect the faulty component before repairing it.') : flow?.detail || 'Select a component and turn the crank by hand. The cutaway reveals the original pistons, rods, camshafts and valves.',
      flow, challenge: challenge ? {id: challenge.id, label: challenge.spec.label, prompt: challenge.spec.prompt, status: challenge.status, message: lastMessage,
        attempts: challenge.attempts, canRepair: challenge.status === 'found' && selectedId === challenge.id} : null};
  }
  return {update, setMode, setCutaway, turnCrank, selectPart, startChallenge, repairChallenge, resetChallenge, reset, dispose,
    get state() { return state(); }, get parts() { return parts.map(part => ({...part})); },
    get challenges() { return CHALLENGES.map(({id, label, prompt}) => ({id, label, prompt})); },
    get focus() { return focus.clone(); }, get active() { return enabled && available(); },
    get diagnostics() { return {oilPathCount: flowDots.length, coolantPathCount: 4, oilTravel, originalCrank: engine.root.userData.mech?.crank,
      originalBeltGeometry: beltBacking.geometry === intactBelt, snapshots: snapshots.size, ownedGeometryCount: ownGeometries.size}; }};
}
