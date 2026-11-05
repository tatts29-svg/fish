/* Author: Andrew Fisher.
 * The existing Coates mechanic works the workshop sequence. Every pose comes from
 * master progress, including footsteps, fingers and the held tool. The original
 * Crewman two-bone solve and palm markers remain authoritative. No idle update,
 * extra person, running timer, invented torque or altered arm lengths is used.
 * The owner freezes crew.update() before enter() and supplies service world targets.
 */
import {Path, route, OBSTACLES, NODES} from './crew.js';

const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const wrap = n => Math.atan2(Math.sin(n), Math.cos(n));
const copyValue = value => {
  if (value?.isVector3 || value?.isQuaternion || value?.isEuler || value?.isMatrix4) return value.clone();
  if (Array.isArray(value)) return value.map(copyValue);
  if (value && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copyValue(v)]));
  return value;
};

export function installWorkshopMechanic({T, scene, crew, crewPolish, engine, body, studioRoot} = {}) {
  const man = crew?.men?.mechanic;
  if (!T || !scene || !man?.pose || !man.fig?.markers?.gripR) throw new Error('Workshop mechanic requires the existing Coates crew rig');
  const root = new T.Group(); root.name = 'Workshop mechanic tools'; root.visible = false; scene.add(root);
  const materials = [new T.MeshStandardMaterial({color: 0x434d56, roughness: .34, metalness: .83}),
    new T.MeshStandardMaterial({color: 0x171e24, roughness: .8, metalness: .08}),
    new T.MeshStandardMaterial({color: 0xff6a13, roughness: .48, metalness: .18})];
  const geometries = new Set();
  const mesh = (geo, material, name, parent = root) => { geometries.add(geo); const m = new T.Mesh(geo, material); m.name = name; m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const rack = new T.Group(); rack.name = 'Mechanic tool rack'; root.add(rack);
  const tray = mesh(new T.BoxGeometry(.46, .035, .30), materials[1], 'Ratchet rack tray', rack); tray.position.y = .73;
  for (const x of [-.19, .19]) for (const z of [-.11, .11]) {
    const leg = mesh(new T.BoxGeometry(.025, .72, .025), materials[0], 'Tool rack leg', rack); leg.position.set(x, .36, z);
  }
  const edge = mesh(new T.BoxGeometry(.46, .025, .018), materials[2], 'Tool rack orange edge', rack); edge.position.set(0, .756, .15);
  const tool = new T.Group(); tool.name = 'Mechanic socket ratchet and articulated extension'; root.add(tool);
  const handle = mesh(new T.CylinderGeometry(.015, .017, 1, 10), materials[1], 'Ratchet hand grip', tool);
  const handleEnd = mesh(new T.CylinderGeometry(.018, .018, .012, 10), materials[2], 'Ratchet grip end', tool);
  const extension = mesh(new T.CylinderGeometry(.008, .008, 1, 10), materials[0], 'Socket extension', tool);
  const socket = mesh(new T.CylinderGeometry(.022, .022, 1, 12), materials[0], 'Socket on source fastener', tool);
  const universal = mesh(new T.SphereGeometry(.019, 10, 6), materials[0], 'Socket universal joint', tool);
  const head = mesh(new T.CylinderGeometry(.029, .029, .024, 12), materials[0], 'Ratchet head', tool);
  const toolGrip = new T.Object3D(); toolGrip.name = 'Ratchet palm contact'; tool.add(toolGrip);
  const socketContact = new T.Object3D(); socketContact.name = 'Ratchet socket contact'; tool.add(socketContact);
  const up = new T.Vector3(0, 1, 0), scratch = new T.Vector3(), matrix = new T.Matrix4();
  const own = {active: false, disposed: false, phase: 'disconnect', progress: 0, direction: 1, task: 'approach',
    walking: false, readyForLift: false, handErrors: [0, 0], palmErrors: [0, 0], socketError: null,
    tool: 'rack', contact: 0, pathLength: 0, floorClearance: 0, obstacleClearance: 0, loadClearance: null};
  let saved = null, lastTargets = {}, pathCache = new Map();
  const fig = man.fig;
  const originalBoneNames = Object.keys(fig.bones);
  const fingerBones = fig.skeleton.bones.filter(b => /glove (finger|fingertip|thumb)/.test(b.name));
  const controlled = ['pos','yaw','path','faceYaw','v','f','phase','post','feet','hands','look','ch','bend','bendWant','side','sideWant','pelvisY','gest','gestW','carrying','t','idleT','yawRate','motionYaw'];
  const poseSnapshot = object => ({object, position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(), visible: object.visible});
  const restorePose = s => { s.object.position.copy(s.position); s.object.quaternion.copy(s.quaternion); s.object.scale.copy(s.scale); s.object.visible = s.visible; };
  const vector = (value, fallback) => value?.isVector3 ? value.clone() : Array.isArray(value) ? new T.Vector3(...value) : new T.Vector3(...fallback);
  const asXZ = v => [v.x, v.z];
  const bay = new T.Vector3(-1, 0, 1.45), clear = new T.Vector3(1.7, 0, 2.5);
  const rackGrip = new T.Vector3(-1, .84, 2.13);
  rack.position.set(rackGrip.x, 0, rackGrip.z);

  function segment(object, a, b) {
    const delta = b.clone().sub(a), len = delta.length(); object.position.copy(a).addScaledVector(delta, .5);
    object.scale.set(1, Math.max(.0001, len), 1);
    if (len > .0001) object.quaternion.setFromUnitVectors(up, delta.multiplyScalar(1 / len));
  }
  function palmQuaternion(side, toward, roll = 0, height = 0) {
    const y = up.clone(), x = toward.clone().setY(0).normalize().multiplyScalar(side === 'L' ? -1 : 1);
    if (x.lengthSq() < .1) x.set(side === 'L' ? 1 : -1, 0, 0);
    const z = new T.Vector3().crossVectors(x, y).normalize(); matrix.makeBasis(x, y, z);
    const q = new T.Quaternion().setFromRotationMatrix(matrix);
    // Above shoulder height the fingers point up; the wrist stays below the
    // handling tail instead of reaching another palm-length above it.
    if (height > 1.45) q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0), Math.PI * smooth((height - 1.45) / .25)));
    if (roll) q.multiply(new T.Quaternion().setFromAxisAngle(up, roll));
    return q;
  }
  function pathFor(from, to, bench) {
    const key = [...from.toArray(), ...to.toArray(), ...bench.toArray()].map(n => n.toFixed(3)).join(',');
    if (pathCache.has(key)) return pathCache.get(key);
    const boxes = OBSTACLES.map(b => b.slice());
    boxes.push([bench.x - .83, bench.z - .93, bench.x + .83, bench.z + .62]);
    boxes.push([rack.position.x - .24, rack.position.z - .16, rack.position.x + .24, rack.position.z + .16]);
    const points = route(asXZ(from), asXZ(to), boxes, [...NODES, [-3.8,4.25],[-1,4.25],[1.7,4.25]], .28);
    const path = new Path(points, 0); pathCache.set(key, path); return path;
  }
  const pointOn = (path, distance) => path.at(clamp(distance, 0, path.length), new T.Vector3());
  function footAt(path, distance, side) {
    const yaw = path.yawAt(clamp(distance, 0, path.length));
    const p = pointOn(path, distance).add(new T.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(side * man.d.track / 2));
    p.y = man.floor(p.x, p.z) + man.d.ankleH;
    return {p, yaw};
  }
  /* Alternating fixed landings on the original routed aisle. During each half
   * stride the planted foot stays at its landing point, including on reverse. */
  function walk(from, to, alpha, bench, finalYaw = Math.PI) {
    const path = pathFor(from, to, bench), a = clamp(alpha), move = Math.min(1, a / .88);
    const distance = path.length * smooth(move), steps = Math.max(1, Math.ceil(path.length / .29)), step = path.length / steps;
    const n = Math.min(steps - 1, Math.floor(distance / Math.max(step, 1e-9))), u = clamp((distance - n * step) / Math.max(step, 1e-9));
    man.pos.copy(pointOn(path, distance));
    const pathYaw = path.length > .01 ? path.yawAt(distance) : finalYaw;
    const turn = smooth((a - .86) / .14); man.yaw = pathYaw + wrap(finalYaw - pathYaw) * turn;
    own.walking = a > 0 && a < 1 && path.length > .02; own.pathLength = path.length;
    man.ch['armL.pitch'] = Math.sin(distance / .58 * Math.PI * 2) * .23 * (1 - turn);
    man.ch['armR.pitch'] = -man.ch['armL.pitch'];
    for (let i = 0; i < 2; i++) {
      const f = man.feet[i], active = n % 2 === i;
      const start = footAt(path, active ? Math.max(0, (n - 1) * step) : n * step, f.side);
      const end = footAt(path, active ? (n + 1) * step : n * step, f.side);
      f.ankle.copy(start.p).lerp(end.p, active ? smooth(u) : 0);
      if (active) f.ankle.y += .075 * man.d.s * Math.sin(Math.PI * u);
      f.yaw = start.yaw + wrap(end.yaw - start.yaw) * (active ? smooth(u) : 0);
      if (a > .88) {
        const settle = smooth((a - .88) / .12), final = to.clone().add(new T.Vector3(Math.cos(finalYaw),0,-Math.sin(finalYaw)).multiplyScalar(f.side * man.d.track / 2));
        final.y = man.floor(final.x, final.z) + man.d.ankleH;
        f.ankle.lerp(final, settle); f.ankle.y += .04 * Math.sin(Math.PI * settle);
        f.yaw += wrap(finalYaw - f.yaw) * settle;
      }
      f.pitch = 0; f.planted = !active || u >= .999 || a >= 1; f.step = null; man.toeFromAnkle(f);
    }
  }
  function stand(position, yaw = Math.PI) {
    man.pos.copy(position); man.yaw = yaw; own.walking = false;
    for (const f of man.feet) { man.neutral(f, f.ankle); f.yaw = yaw; f.pitch = 0; f.planted = true; f.step = null; man.toeFromAnkle(f); }
  }
  const beltPoint = () => fig.bones.hips.localToWorld(new T.Vector3(-.18, -.025, -.025));
  function neutral() {
    man.path = null; man.faceYaw = null; man.v = 0; man.f = 0; man.gest = null; man.gestW = 0; man.carrying = 0;
    man.ch = {'armL.roll': .11, 'armR.roll': .11, 'armL.elbow': .24, 'armR.elbow': .24};
    man.post = {kind: 'stand', k: 0, want: 0, stage: null, seat: null, kneel: null};
    man.bend = man.bendWant = man.side = man.sideWant = 0;
    man.look.target = new T.Vector3(-1, 1, 0); man.look.next = null; man.look.hasNext = false; man.look.yaw = man.look.pitch = man.look.torso = 0;
    for (const h of man.hands) { h.target = null; h.w = 0; h.valid = false; h.err = 0; }
  }
  function reach(i, point, q, blend = 1) {
    const marker = fig.markers[i ? 'gripR' : 'gripL'];
    const wrist = point.clone().sub(marker.position.clone().applyQuaternion(q));
    const h = man.hands[i]; h.w = clamp(blend); h.valid = true;
    h.target = (p, out) => { p.copy(wrist); out.copy(q); return true; };
    return {i, point: point.clone()};
  }
  /* Choose a crouch/lean within the original torso rig, using its actual lengths.
   * This inexpensive shoulder calculation avoids a fixed crouch that leaves a
   * short worker's tool floating, and never lengthens a limb or moves a contact. */
  function workingPosture(requests, blend) {
    if (!requests.length || blend <= 0) return;
    const d = man.d, cy = Math.cos(man.yaw), sy = Math.sin(man.yaw);
    const wrists = requests.map(({i, point, q}) => ({i, p: point.clone().sub(fig.markers[i ? 'gripR' : 'gripL'].position.clone().applyQuaternion(q))}));
    let best = {score: Infinity, crouch: 0, lean: 0};
    for (let ci = 0; ci <= 20; ci++) for (let bi = 0; bi <= 26; bi++) {
      const crouch = ci / 20, lean = bi / 20, e = smooth(crouch);
      const py = (d.pelvisY - .012 * d.s) * (1 - e) + .52 * d.s * e;
      const localZ = -.15 * d.s * e + .20 * d.s * Math.sin(lean * .45) + .18 * d.s * Math.sin(lean);
      const y = py + .10 * d.s + .20 * d.s * Math.cos(lean * .45) + .18 * d.s * Math.cos(lean);
      let excess = 0;
      for (const wrist of wrists) {
        const x = (wrist.i ? -1 : 1) * d.shX;
        const sx = man.pos.x + x * cy + localZ * sy, sz = man.pos.z - x * sy + localZ * cy;
        excess = Math.max(excess, Math.hypot(sx - wrist.p.x, y - wrist.p.y, sz - wrist.p.z) - (d.U1 + d.U2 - .018));
      }
      const score = Math.max(0, excess) * 100 + crouch * .025 + lean * .012;
      if (score < best.score) best = {score, crouch, lean};
    }
    const depth = best.crouch * blend;
    man.post = {kind: depth > 0 ? 'crouch' : 'stand', k: depth, want: depth, stage: null, seat: null, kneel: null};
    man.bend = man.bendWant = best.lean * blend;
  }
  function fingers(side, amount) {
    const k = side === 'L' ? 1 : -1;
    for (const bone of fingerBones) {
      if (!bone.name.includes(side + ' glove ')) continue;
      const tip = bone.name.includes('fingertip'), thumb = bone.name.includes('thumb'), index = Number(bone.name.match(/(\d)$/)?.[1] || 0);
      bone.rotation.set(0, 0, -k * (thumb ? .25 + amount * .47 : tip ? .44 + amount * .67 : .23 + index * .035 + amount * .58));
      if (thumb && !bone.name.endsWith('tip')) bone.rotation.x = -.58 + amount * .38;
    }
  }
  function placeTool(grip, toward, toolPoint, normal, held, turn) {
    tool.visible = true; toolGrip.position.copy(grip);
    const axis = up.clone().applyAxisAngle(toward.clone().normalize(), turn);
    const handleTop = grip.clone().addScaledVector(axis, .095), handleBottom = grip.clone().addScaledVector(axis, -.085);
    segment(handle, handleBottom, handleTop); handleEnd.position.copy(handleBottom); head.position.copy(handleTop);
    head.quaternion.setFromUnitVectors(up, toward.clone().normalize());
    const tip = toolPoint || handleTop.clone().addScaledVector(toward.clone().normalize(), .38);
    segment(extension, handleTop, tip); universal.position.copy(tip);
    const n = normal?.lengthSq() > 0 ? normal.clone().normalize() : toward.clone().normalize();
    segment(socket, tip.clone().addScaledVector(n, -.035), tip); socketContact.position.copy(tip);
    own.tool = held; return tip;
  }
  function enter() {
    if (own.disposed) return {ok: false, reason: 'Mechanic has been disposed'};
    if (own.active) return {ok: true};
    saved = {fields: new Map(controlled.map(key => [key, man[key]])), poses: [poseSnapshot(fig.root), ...fig.skeleton.bones.map(poseSnapshot)],
      polish: crewPolish?.info?.().workshop || false, from: man.pos.clone(), rootYaw: man.yaw};
    for (const key of controlled) man[key] = copyValue(man[key]);
    crewPolish?.setWorkshopMode?.(true); fig.root.visible = true; root.visible = true; own.active = true; pathCache = new Map();
    return {ok: true};
  }
  function pose({phase = 'disconnect', phaseProgress = 0, progress = 0, direction = 1, targets = {}} = {}) {
    if (!own.active && !enter().ok) return;
    lastTargets = targets; const t = clamp(phaseProgress), stroke = clamp(targets.stroke ?? t);
    Object.assign(own, {phase, progress: clamp(progress), direction: direction < 0 ? -1 : 1, task: targets.task || phase, readyForLift: false,
      contact: 0, handErrors: [0,0], palmErrors: [0,0], socketError: null});
    const bench = vector(targets.bench, [-2.44, .788, 2.85]), clearAt = vector(targets.clear, clear.toArray());
    const work = vector(targets.grip || targets.work, [-1, .82, .75]);
    const workAt = vector(targets.stand, [work.x, 0, phase === 'unhook' ? bench.z + 1.1 : 1.45]); workAt.y = 0;
    const previous = vector(targets.previousStand, phase === 'unhook' ? clearAt.toArray() : bay.toArray()); previous.y = 0;
    const normal = vector(targets.normal, [0,0,1]), toolPoint = targets.toolPoint ? vector(targets.toolPoint) : work.clone();
    const task = own.task, approach = /^(approach|walk-in)$/.test(task), pickup = /pickup/.test(task), stow = /stow/.test(task), toBench = /approach-bench/.test(task), hold = task === 'rig-approach' || task === 'hold-bay';
    const clearTask = task === 'stand-clear' || phase === 'lift' || phase === 'bench';
    neutral(); let contact = 0, carrying = phase === 'disconnect' && !approach;
    let toolHeld = carrying ? 'hand' : 'belt';
    if (approach) { walk(saved.from, bay, stroke, bench, 0); toolHeld = 'rack'; }
    else if (toBench) walk(clearAt, workAt, stroke, bench);
    else if (stow) walk(previous, workAt, clamp(stroke / .55), bench);
    else if (hold) { stand(workAt); toolHeld = 'belt'; }
    else if (clearTask) {
      if (phase === 'lift' || phase === 'bench') stand(clearAt, Math.atan2(-1 - clearAt.x, -clearAt.z));
      else walk(previous, clearAt, stroke, bench, Math.atan2(-1 - clearAt.x, -clearAt.z));
      own.readyForLift = phase === 'lift' || phase === 'bench' || stroke >= .999;
    } else {
      if (previous.distanceTo(workAt) > .025 && !pickup) walk(previous, workAt, clamp(stroke / .19), bench);
      else stand(pickup ? bay : workAt, pickup ? Math.PI * smooth((stroke - .78) / .22) : Math.PI);
      contact = smooth(stroke / .20) * (1 - smooth((stroke - .80) / .20));
      if (pickup) contact = smooth(stroke / .30) * (1 - smooth((stroke - .60) / .40));
      const q = palmQuaternion(targets.tool === 'ratchet' || pickup ? 'R' : 'L', toolPoint.clone().sub(work), 0, work.y);
      const requests = [{i: targets.tool === 'ratchet' || pickup ? 1 : 0, point: pickup ? rackGrip : work, q}];
      if ((phase === 'rig' || phase === 'unhook') && !pickup) requests.push({i: 1, point: work, q: palmQuaternion('R', toolPoint.clone().sub(work), 0, work.y)});
      workingPosture(requests, contact);
      man.ch['head.pitch'] = clamp((1.45 - work.y) * .4, -.25, .3) * contact;
    }
    man.look.target.copy(work); man.pose(0);
    const neutralPalms = ['L','R'].map(side => fig.markers['grip'+side].getWorldPosition(new T.Vector3()));
    const turn = targets.tool === 'ratchet' && contact > .99 ? Math.sin(stroke * Math.PI * 12) * .20 : 0;
    const contacts = [], qR = palmQuaternion('R', toolPoint.clone().sub(work), 0, work.y), qL = palmQuaternion('L', toolPoint.clone().sub(work), 0, work.y);
    if (turn) qR.premultiply(new T.Quaternion().setFromAxisAngle(toolPoint.clone().sub(work).normalize(), turn));
    if (pickup) {
      const pick = rackGrip.clone();
      if (stroke > .55) pick.lerp(neutralPalms[1], smooth((stroke - .55) / .45));
      const target = neutralPalms[1].clone().lerp(pick, smooth(stroke / .4));
      contacts.push(reach(1, target, palmQuaternion('R', new T.Vector3(0,0,-1))));
      toolHeld = stroke < .42 ? 'rack' : 'hand'; carrying = stroke >= .42;
    } else if (stow) {
      const belt = beltPoint();
      const a = smooth((stroke - .55) / .23) * (1 - smooth((stroke - .85) / .15));
      contacts.push(reach(1, neutralPalms[1].clone().lerp(belt, a), palmQuaternion('R', new T.Vector3(0,0,-1))));
      toolHeld = stroke < .82 ? 'hand' : 'belt';
    } else if (contact > 0 && !clearTask && !toBench && !approach && !hold) {
      const hand = targets.tool === 'ratchet' ? 1 : 0, q = hand ? qR : qL;
      const target = neutralPalms[hand].clone().lerp(work, contact);
      contacts.push(reach(hand, target, q));
      if (targets.tool !== 'ratchet' && (phase === 'rig' || phase === 'unhook')) {
        const along = toolPoint.clone().sub(work); if (along.length() > .06) along.setLength(.05);
        contacts.push(reach(1, neutralPalms[1].clone().lerp(work.clone().add(along), contact), qR));
      }
    }
    man.pose(0); own.contact = contact;
    fingers('L', contacts.some(c => c.i === 0) ? contact : 0);
    fingers('R', toolHeld === 'hand' ? .96 : contacts.some(c => c.i === 1) ? contact : 0);
    fig.root.updateMatrixWorld(true);
    for (const {i, point} of contacts) {
      own.handErrors[i] = man.hands[i].err || 0;
      own.palmErrors[i] = fig.markers[i ? 'gripR' : 'gripL'].getWorldPosition(new T.Vector3()).distanceTo(point);
    }
    const grip = toolHeld === 'rack' ? rackGrip.clone() : toolHeld === 'belt' ? beltPoint() : fig.markers.gripR.getWorldPosition(new T.Vector3());
    const toward = new T.Vector3(0,0,-1);
    const sourceContact = targets.tool === 'ratchet' && !pickup && !clearTask && contact > .999 && own.handErrors[1] < .025;
    if (sourceContact) toward.copy(toolPoint).sub(grip).normalize();
    const tip = placeTool(grip, toward, sourceContact ? toolPoint : null, normal, toolHeld, turn);
    if (sourceContact) own.socketError = tip.distanceTo(toolPoint);
    own.floorClearance = Math.min(...man.feet.map(f => f.ankle.y - man.d.ankleH - man.floor(f.ankle.x, f.ankle.z)));
    own.obstacleClearance = Math.min(...OBSTACLES.map(([x0,z0,x1,z1]) => Math.hypot(Math.max(x0-man.pos.x,0,man.pos.x-x1),Math.max(z0-man.pos.z,0,man.pos.z-z1)))) - .25;
    own.loadClearance = null;
    if (targets.engineBox?.min && targets.engineBox?.max) {
      const box = new T.Box3(vector(targets.engineBox.min), vector(targets.engineBox.max));
      own.loadClearance = Math.min(...['hips','chest','head'].map(key => box.distanceToPoint(fig.bones[key].getWorldPosition(new T.Vector3())) - (key === 'head' ? .15 : .23)));
    }
    if (phase === 'disconnect' && progress <= 1e-10) {
      man.pos.copy(saved.from); man.yaw = saved.rootYaw;
      saved.poses.forEach(restorePose); fig.root.visible = true; fig.root.updateMatrixWorld(true);
    }
    root.updateMatrixWorld(true); return diagnostics();
  }
  function exit() {
    if (!own.active) return;
    for (const [key, value] of saved.fields) man[key] = value;
    saved.poses.forEach(restorePose); fig.root.updateMatrixWorld(true);
    crewPolish?.setWorkshopMode?.(saved.polish); saved = null; root.visible = false; own.active = false; pathCache.clear();
  }
  function diagnostics() { return {...own, root: man.pos.toArray(), palms: ['L','R'].map(side => fig.markers['grip'+side].getWorldPosition(new T.Vector3()).toArray()),
    toolGrip: toolGrip.getWorldPosition(new T.Vector3()).toArray(), socket: socketContact.getWorldPosition(new T.Vector3()).toArray(),
    originalRig: true, bodyBoneCount: originalBoneNames.length, fingerBoneCount: fingerBones.length, targets: {task: lastTargets.task, tool: lastTargets.tool}}; }
  return {enter, pose, exit, diagnostics, get state() { return {...own}; }, get root() { return root; },
    dispose() { if (own.disposed) return; exit(); root.removeFromParent(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); own.disposed = true; }};
}
