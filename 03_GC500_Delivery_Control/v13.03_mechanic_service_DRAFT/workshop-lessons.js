/* Author: Andrew Fisher.
 * Four-stroke and component inspection lessons on the original workshop engine.
 * Host order: lift → learning → lessons → render. Reset lessons BEFORE resetting
 * learning or leaving the lift. No engine.animate call or operating-record writes.
 */
import {CAR_REFERENCES} from './car-references.js';
import {connectionFor} from './part-connections.js';

const TAU = Math.PI * 2, CYCLE = TAU * 2;
const wrap = (value, period) => ((value % period) + period) % period;
const PHASES = [
  {id: 'intake', label: 'Intake', colour: 0x49c9ef, direction: -1, instruction: 'The piston moves down from the cylinder head. The intake passage admits the charge while the cam opens its valve.'},
  {id: 'compression', label: 'Compression', colour: 0xb18dff, direction: 1, instruction: 'The piston moves towards the cylinder head to compress the charge. Watch the actual valve indicators as the intake valve finishes closing.'},
  {id: 'power', label: 'Power', colour: 0xff9a42, direction: -1, instruction: 'The power stroke drives the piston away from the head and turns the crank through its connecting rod. Chamber colour represents this teaching phase, not combustion data.'},
  {id: 'exhaust', label: 'Exhaust', colour: 0xadb8c4, direction: 1, instruction: 'The piston moves towards the head as the exhaust valve opens to release spent gas. The next intake follows after this stroke.'},
];
const NOTICE = 'Illustrative engine lesson and virtual inspection view; not factory specifications or a servicing procedure.';

// The original cam model defines firing TDC from the bank and crank-pin phase.
// Intake starts one crank revolution after firing TDC; 0..720° then reads
// intake → compression → power → exhaust. Valve states are read separately from
// the actual moving meshes because the original cam profiles include overlap.
export function cylinderCycle(angle, {side = 1, phase = 0, n = 1} = {}) {
  const firingTDC = side * Math.PI / 4 - phase + (n % 4 < 2 ? 0 : TAU);
  const origin = firingTDC + TAU, cycleAngle = wrap(angle - origin, CYCLE);
  const index = Math.min(3, Math.floor(cycleAngle / Math.PI));
  return {origin, angle: cycleAngle, degrees: cycleAngle * 180 / Math.PI, index, ...PHASES[index]};
}

export function installWorkshopLessons({T, scene, engine, lift, learning, reducedMotion}) {
  if (!T || !scene || !engine?.removable || !lift || !learning) throw Error('Workshop lessons need the original engine, lift and bench.');
  const originals = new Map(engine.removable.map(part => [part.id, part]));
  const pistonMotion = engine.pistonMotions.find(item => item.id === 'piston-1');
  const intake = engine.valveMotions.find(item => item.id === 'intake-valve-1');
  const exhaust = engine.valveMotions.find(item => item.id === 'exhaust-valve-1');
  if (!pistonMotion || !intake || !exhaust) throw Error('Four-stroke lesson needs the original cylinder 1 motions.');
  const cylinder = {...pistonMotion, n: intake.n};
  const pistonPart = originals.get('piston-1');
  const teachingHead = originals.get('cylinder-head-near')?.group;
  const cycleVisibility = new Map();
  const benchHighlight = scene.getObjectByName('Inspected original component');
  const root = new T.Group(); root.name = 'Workshop mechanism lessons'; root.visible = false; scene.add(root);
  const cycleRoot = new T.Group(); cycleRoot.name = 'Cylinder 1 four-stroke indication'; cycleRoot.matrixAutoUpdate = false;
  const isolateRoot = new T.Group(); isolateRoot.name = 'Virtual component inspection';
  const display = new T.Group(); display.name = 'Rotatable inspection display'; isolateRoot.add(display);
  root.add(cycleRoot, isolateRoot);
  const ownedGeometry = new Set(), ownedMaterial = new Set();
  const geometry = value => { ownedGeometry.add(value); return value; };
  const material = values => { const value = new T.MeshBasicMaterial(values); ownedMaterial.add(value); return value; };
  const chamberMaterial = material({color: PHASES[0].colour, transparent: true, opacity: .30, depthWrite: false, side: T.DoubleSide});
  const arrowMaterial = material({color: PHASES[0].colour, depthTest: false});
  const valveOpen = material({color: 0x63f0b6, depthTest: false});
  const valveClosed = material({color: 0x8d9ba4, depthTest: false});
  const chamber = new T.Mesh(geometry(new T.CylinderGeometry(.096, .096, 1, 24, 1, true)), chamberMaterial);
  chamber.name = 'Teaching phase inside cylinder 1'; chamber.renderOrder = 3; cycleRoot.add(chamber);
  const axis = new T.Vector3(0, Math.SQRT1_2, pistonMotion.side * Math.SQRT1_2), up = new T.Vector3(0, 1, 0);
  chamber.quaternion.setFromUnitVectors(up, axis);
  const arrow = new T.Group(); arrow.name = 'Cylinder 1 piston direction'; cycleRoot.add(arrow);
  const shaft = new T.Mesh(geometry(new T.CylinderGeometry(.006, .006, .13, 8)), arrowMaterial);
  shaft.position.y = .065;
  const head = new T.Mesh(geometry(new T.ConeGeometry(.022, .046, 12)), arrowMaterial); head.position.y = .145;
  arrow.add(shaft, head);
  const valveGeometry = geometry(new T.SphereGeometry(.020, 10, 8));
  const valveDots = [intake, exhaust].map((motion, index) => {
    const mesh = new T.Mesh(valveGeometry, valveClosed); mesh.name = `Cylinder 1 ${index ? 'exhaust' : 'intake'} valve indication`; mesh.renderOrder = 4; cycleRoot.add(mesh);
    return {motion, mesh};
  });
  const anchorBox = new T.Box3(), ghost = new T.Box3Helper(anchorBox, 0xffbe76);
  ghost.name = 'Original fitted location outline'; ghost.material.transparent = true; ghost.material.opacity = .8; ghost.material.depthTest = false;
  ownedGeometry.add(ghost.geometry); ownedMaterial.add(ghost.material); isolateRoot.add(ghost);
  const lineGeometry = geometry(new T.BufferGeometry());
  lineGeometry.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(6), 3));
  lineGeometry.setAttribute('lineDistance', new T.Float32BufferAttribute([0, 1], 1));
  const lineMaterial = new T.LineDashedMaterial({color: 0xffbe76, dashSize: .055, gapSize: .03, transparent: true, opacity: .95, depthTest: false});
  ownedMaterial.add(lineMaterial);
  const connectionLine = new T.Line(lineGeometry, lineMaterial); connectionLine.name = 'Inspection view to fitted connection'; connectionLine.frustumCulled = false; isolateRoot.add(connectionLine);
  const anchorMaterial = material({color: 0xffcf96, depthTest: false});
  const fittedMarker = new T.Mesh(valveGeometry, anchorMaterial), displayMarker = new T.Mesh(valveGeometry, anchorMaterial);
  fittedMarker.name = 'Fitted location marker'; displayMarker.name = 'Inspection location marker';
  fittedMarker.renderOrder = displayMarker.renderOrder = 5; isolateRoot.add(fittedMarker, displayMarker);
  root.traverse(object => { object.userData.workshopLesson = true; object.raycast = () => {}; });

  const centre = new T.Vector3(), displayCentre = new T.Vector3(), focus = new T.Vector3(), displayOffset = new T.Vector3(-.38, .32, 1.0);
  const bounds = new T.Box3(), scratchBox = new T.Box3(), vector = new T.Vector3(), matrix = new T.Matrix4();
  let kind = 'none', rotation = 0, playing = false, disposed = false, isolated = null, pairs = [], replica = null;
  let selectedVisible = true, highlightVisible = true, cycle = cylinderCycle(0, cylinder), valveStates = {intake: 'closed', exhaust: 'closed'};
  const motionReduced = () => typeof reducedMotion === 'function' ? !!reducedMotion() : reducedMotion === undefined ? !!lift.reducedMotion : !!reducedMotion;
  const available = () => {
    if (disposed || !lift.active || !(typeof lift.benchReady === 'boolean' ? lift.benchReady : lift.progress >= .999)) return false;
    const rigging = lift.diagnostics?.rigging;
    return !rigging || rigging.attached === 0 && rigging.clear > .999;
  };
  const healthy = () => !learning.state.challenge || learning.state.challenge.status === 'repaired';

  function restoreCycleCutaway() {
    for (const [object, visible] of cycleVisibility) object.visible = visible;
    cycleVisibility.clear();
  }

  function releaseIsolation() {
    if (isolated) isolated.group.visible = selectedVisible;
    if (isolated && benchHighlight) benchHighlight.visible = highlightVisible;
    for (const [, object] of pairs) if (object.isInstancedMesh) object.dispose();
    if (replica) replica.removeFromParent();
    isolated = null; pairs = []; replica = null;
  }
  // Reconstruct just the render tree. Object3D.clone/copy would JSON-serialise
  // userData; source material/texture provenance can contain circular objects.
  // Geometry/material references remain the originals and are never disposed.
  function copyTree(source) {
    let target;
    if (source.isInstancedMesh) {
      target = new T.InstancedMesh(source.geometry, source.material, source.instanceMatrix.count);
      if (source.instanceColor) target.instanceColor = new T.InstancedBufferAttribute(source.instanceColor.array.slice(), source.instanceColor.itemSize, source.instanceColor.normalized);
    } else if (source.isMesh) target = new T.Mesh(source.geometry, source.material);
    else if (source.isLineSegments) target = new T.LineSegments(source.geometry, source.material);
    else if (source.isLine) target = new T.Line(source.geometry, source.material);
    else target = new T.Group();
    target.name = source.name; target.userData.workshopLesson = true; target.raycast = () => {};
    target.castShadow = false; target.receiveShadow = source.receiveShadow; target.renderOrder = source.renderOrder;
    target.layers.mask = source.layers.mask; target.frustumCulled = source.frustumCulled;
    pairs.push([source, target]);
    for (const child of source.children) target.add(copyTree(child));
    return target;
  }
  function chooseIsolation(id) {
    const part = originals.get(id);
    if (!part || !learning.parts.some(item => item.id === id)) return false;
    releaseIsolation(); isolated = part; selectedVisible = part.group.visible;
    if (benchHighlight) highlightVisible = benchHighlight.visible;
    replica = copyTree(part.group); replica.matrixAutoUpdate = false; display.add(replica); rotation = 0;
    return true;
  }
  function metadata(part) {
    if (!part) return null;
    const details = learning.parts.find(item => item.id === part.id), connection = connectionFor(part);
    return {id: part.id, label: details?.label || part.name, reference: CAR_REFERENCES[part.id] || part.id,
      detail: details?.detail || connection.role, connection: details?.connection || connection.role,
      connectedParts: connection.drives.map(id => ({id, reference: CAR_REFERENCES[id] || id, label: originals.get(id)?.name || id}))};
  }
  function cyclePose() {
    cycle = cylinderCycle(learning.state.crankAngle, cylinder);
    // This existing full-bank slab covers cylinder 1's crown and valve seats.
    // Hide it only for this teaching cutaway, preserving every moving original.
    if (teachingHead) {
      if (!cycleVisibility.has(teachingHead)) cycleVisibility.set(teachingHead, teachingHead.visible);
      teachingHead.visible = false;
    }
    pistonPart.group.updateWorldMatrix(true, true); cycleRoot.matrix.copy(pistonPart.group.matrixWorld); cycleRoot.updateWorldMatrix(true, false);
    // .409 is the original valve sealing-face height; .0525 is the crown's
    // highest point in the original piston geometry. The tint occupies only
    // the modelled space between them; its colour is a phase key, not pressure.
    const crown = pistonMotion.piston.position.dot(axis) + .0525, height = Math.max(.002, .409 - crown);
    chamber.scale.y = height; chamber.position.copy(axis).multiplyScalar(crown + height / 2);
    chamberMaterial.color.setHex(cycle.colour); arrowMaterial.color.setHex(cycle.colour);
    arrow.position.copy(pistonMotion.piston.position); arrow.position.x += .16;
    arrow.quaternion.setFromUnitVectors(up, vector.copy(axis).multiplyScalar(cycle.direction));
    for (let index = 0; index < valveDots.length; index++) {
      const {motion, mesh} = valveDots[index];
      motion.movingValve.updateWorldMatrix(true, false);
      vector.set(0, .409, 0); motion.movingValve.localToWorld(vector); cycleRoot.worldToLocal(vector); mesh.position.copy(vector);
      const open = motion.movingValve.position.length() > 1e-5;
      mesh.material = open ? valveOpen : valveClosed; valveStates[index ? 'exhaust' : 'intake'] = open ? 'open' : 'closed';
    }
    cycleRoot.updateMatrixWorld(true);
    bounds.setFromObject(pistonPart.group).union(scratchBox.setFromObject(cycleRoot));
    for (const id of ['connecting-rod-1', 'intake-valve-1', 'exhaust-valve-1', 'intake-follower-1', 'exhaust-follower-1']) {
      const group = originals.get(id)?.group; if (group) bounds.union(scratchBox.setFromObject(group));
    }
    bounds.getCenter(focus);
  }
  function isolationPose() {
    const id = learning.state.selectedId;
    if (isolated?.id !== id && !chooseIsolation(id)) { reset(); return; }
    const original = isolated.group;
    original.updateWorldMatrix(true, true); anchorBox.setFromObject(original); anchorBox.getCenter(centre);
    // A virtual display move, not an animated disconnection or re-rigging step.
    displayCentre.copy(centre).add(displayOffset);
    display.position.copy(displayCentre); display.rotation.y = rotation;
    for (const [source, target] of pairs) {
      target.geometry = source.geometry; if (source.material) target.material = source.material;
      if (source === original) continue;
      target.position.copy(source.position); target.quaternion.copy(source.quaternion); target.scale.copy(source.scale);
      target.visible = source.visible; target.matrixAutoUpdate = source.matrixAutoUpdate; target.matrix.copy(source.matrix);
      if (source.isInstancedMesh) {
        target.count = source.count; target.instanceMatrix.array.set(source.instanceMatrix.array); target.instanceMatrix.needsUpdate = true;
        if (source.instanceColor && target.instanceColor) { target.instanceColor.array.set(source.instanceColor.array); target.instanceColor.needsUpdate = true; }
      }
    }
    matrix.makeTranslation(-centre.x, -centre.y, -centre.z); replica.matrix.multiplyMatrices(matrix, original.matrixWorld); replica.visible = true;
    original.visible = false;
    if (benchHighlight) benchHighlight.visible = false;
    const positions = lineGeometry.attributes.position;
    positions.setXYZ(0, centre.x, centre.y, centre.z); positions.setXYZ(1, displayCentre.x, displayCentre.y, displayCentre.z); positions.needsUpdate = true;
    fittedMarker.position.copy(centre); displayMarker.position.copy(displayCentre);
    lineGeometry.attributes.lineDistance.setX(1, centre.distanceTo(displayCentre)); lineGeometry.attributes.lineDistance.needsUpdate = true;
    root.updateMatrixWorld(true);
    bounds.setFromObject(display); bounds.getCenter(focus);
  }
  function update(dt = 0) {
    if (kind === 'none' || disposed) return;
    if (!available() || !learning.active || kind === 'cycle' && !healthy()) { reset(); return; }
    if (kind === 'cycle' && playing) learning.turnCrank(Math.max(0, Math.min(.1, Number(dt) || 0)) * Math.PI / (motionReduced() ? 8 : 4));
    root.visible = true; cycleRoot.visible = kind === 'cycle'; isolateRoot.visible = kind === 'isolate';
    if (kind === 'cycle') cyclePose(); else isolationPose();
  }
  function setMode(value) {
    if (!['none', 'cycle', 'isolate'].includes(value)) return {ok: false, reason: 'Choose a supported workshop lesson.'};
    if (value === 'none') { reset(); return {ok: true}; }
    if (!available()) return {ok: false, reason: 'Support and unhook the engine at the service bench first.'};
    if (value === 'cycle' && !healthy()) return {ok: false, reason: 'Reset the fault example before following the healthy four-stroke cycle.'};
    if (value === kind) { update(0); return {ok: true}; }
    releaseIsolation(); restoreCycleCutaway(); playing = false; rotation = 0;
    if (!learning.active) { const result = learning.setMode('inspect'); if (!result.ok) return result; }
    if (value === 'cycle') { learning.setMode('inspect'); learning.selectPart('piston-1'); learning.setCutaway(true); }
    kind = value; update(0); return {ok: true};
  }
  function setRotation(value) {
    if (kind !== 'isolate' || !available() || !Number.isFinite(value)) return {ok: false, reason: 'Open component inspection and use a finite rotation.'};
    if (isolated?.id !== learning.state.selectedId) update(0);
    rotation = wrap(value, TAU); update(0); return {ok: true, rotation};
  }
  function rotate(value) { return Number.isFinite(value) ? setRotation(rotation + value) : {ok: false, reason: 'Use a finite rotation.'}; }
  function setCycleAngle(value) {
    if (kind === 'none' || !available() || !Number.isFinite(value)) return {ok: false, reason: 'Open a bench lesson and use a finite cycle angle.'};
    const origin = cylinderCycle(0, cylinder).origin;
    const delta = wrap(origin + wrap(value, CYCLE) - learning.state.crankAngle + TAU, CYCLE) - TAU;
    const result = learning.turnCrank(delta); if (!result.ok) return result; update(0); return {ok: true};
  }
  function setPlaying(value) {
    if (!value) { playing = false; return {ok: true}; }
    if (kind !== 'cycle' || !available() || !healthy()) return {ok: false, reason: 'Open the healthy four-stroke lesson before playing it.'};
    playing = true; return {ok: true};
  }
  function reset() { releaseIsolation(); restoreCycleCutaway(); kind = 'none'; playing = false; rotation = 0; root.visible = false; bounds.makeEmpty(); }
  function dispose() {
    if (disposed) return; reset(); disposed = true; root.removeFromParent();
    for (const value of ownedGeometry) value.dispose(); for (const value of ownedMaterial) value.dispose();
  }
  return {setMode, setRotation, rotate, setCycleAngle, setPlaying, update, reset, dispose,
    get state() {
      const part = kind === 'cycle' ? pistonPart : originals.get(learning.state.selectedId);
      return {available: available(), active: kind !== 'none' && available(), kind, selectedPart: metadata(part),
        phase: kind === 'cycle' ? {id: cycle.id, label: cycle.label, index: cycle.index, instruction: cycle.instruction, direction: cycle.direction < 0 ? 'down' : 'up'} : null,
        angleDegrees: kind === 'cycle' ? cycle.degrees : null, crankAngle: learning.state.crankAngle,
        valves: kind === 'cycle' ? {...valveStates} : null, rotation, rotationDegrees: rotation * 180 / Math.PI, playing,
        reducedMotion: motionReduced(), notice: NOTICE,
        instruction: kind === 'cycle' ? `${cycle.instruction} The near cylinder head is hidden for this teaching cutaway. Valve dots show actual cam-driven motion: green open, grey closed. Overlap is shown at changeover.` : kind === 'isolate' ? 'Virtual inspection view. Rotate this component; the outline and orange line retain its fitted location. The original connections have not been operated.' : 'Choose a four-stroke explanation or component inspection at the supported engine.'};
    }, get focus() { return focus.clone(); }, get bounds() { return bounds.clone(); },
    get diagnostics() { return {sourceId: isolated?.id || null, displayNodes: pairs.length, originalVisible: isolated?.group.visible ?? null,
      chamberHeight: chamber.scale.y, cycleHiddenParts: cycleVisibility.size, sourceWorld: isolated?.group.matrixWorld.toArray() || null}; }};
}
