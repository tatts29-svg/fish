/* THE CREW, checked without a browser (v5.81). Andrew Fisher's workshop brief, 24 Sep 2026: six
   well-made crew roles rather than a crowd of low-detail copies; walking speed matching the movement, with no characters
   sliding on still feet; not every helmet turning at the same moment; the tyre mechanic starting only once the scene has
   stopped; the computer operator getting a service-complete signal; the lead confirming the crew are clear before a new
   dyno run; and the forklift approaching a marked pickup, stopping, aligning, picking up a suitable load, travelling the
   equipment aisle, stopping at the drop, lowering and releasing, then returning or parking — forks low, wheels turning with
   the ground, and its crossing paused during a wheel-service close-up.

   What is held here: six people and a forklift, each person one skinned draw, the lot inside ~40 draws; the walk measured
   through the bones — a stance foot's toe pivot does not move by a micrometre, footprints of one foot are exactly one stride
   apart, the body covers exactly a stride a cycle, and speed = stride × cadence; the looks spread in time; the wheel service
   run end to end with the crew as its carrier on both rear wheels (the mechanic's hand within 0.3 m of the wheel before the
   nut turns, every hold released only by the crew, the rotor home to 1e-9 and one rotor per wheel after three cycles, the
   drive locked until the lead's all-clear and only once the crew are clear, SERVICE COMPLETE on the operator's screen); the
   forklift's wheels turning by their own ground travel without sliding sideways, never near the car's pad, forks low while
   carrying, a real two-bay cycle, standing still while paused; Reset in the middle of a carry putting everything home; the
   cards on the crew in the hall's own vocabulary; the driver in the car exactly as he was. */
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';

/* the smallest document a canvas needs (pit-garage.test.mjs's): a context that draws nothing and records the words */
const drawn = [];
globalThis.document = {
  createElement(tag) { if (tag !== 'canvas') throw new Error('only canvases are made here'); const canvas = {width: 0, height: 0, tagName: 'CANVAS'};
    const ctx = new Proxy({measureText: t => ({width: 22 * String(t).length}), fillText: t => { drawn.push(String(t)); }, createLinearGradient: () => ({addColorStop() {}}), createRadialGradient: () => ({addColorStop() {}}),
      getImageData: (x, y, w, h) => ({data: new Uint8ClampedArray(Math.max(0, w * h) * 4), width: w, height: h}), putImageData() {}, drawImage() {}}, {get: (o, k) => k in o ? o[k] : (typeof k === 'string' ? () => {} : undefined), set: () => true});
    canvas.getContext = () => ctx; return canvas; },
  createElementNS: () => ({addEventListener() {}, removeEventListener() {}, set src(v) {}}),
};
const C = await import('../dist/crew.js');
const {buildCarBody} = await import('../dist/car-body.js');
const {makeMaterials} = await import('../dist/car-scene.js');
const {PARTS} = await import('../dist/parts.js');
const {Drive} = await import('../dist/drive.js');
const {WheelService, WHEEL_SERVICE} = await import('../dist/car-motion.js');
const G = await import('../dist/pit-garage.js');
const {buildDriver} = await import('../dist/car-driver.js');
const out = {};
/* the driver's geometry and placement, summed, as v5.81 built him (computed from the v5.81 car-driver.js before the crew shared it) */
const DRIVER_SUM = 1209.100937869;
const wp = o => { o.updateWorldMatrix(true, false); return new T.Vector3().setFromMatrixPosition(o.matrixWorld); };

/* ---- the driver in the car is untouched by the shared builder (v5.81's geometry, summed) ---- */
{ const root = new T.Group(); buildDriver(T, o => root.add(o), {x: -.10, y: .787, z: -.307}, {carbonMatte: new T.MeshStandardMaterial()}); root.updateMatrixWorld(true);
  let meshes = 0, sum = 0; root.traverse(o => { if (!o.isMesh) return; meshes++; const p = o.geometry.attributes.position.array; for (let i = 0; i < p.length; i += 7) sum += p[i] * ((i % 13) + 1); for (const e of o.matrixWorld.elements) sum += e; });
  assert.equal(meshes, 42, 'the driver is 42 meshes'); assert.ok(Math.abs(sum - DRIVER_SUM) < 1e-6, 'the driver changed: ' + sum.toFixed(9)); out.driver = {meshes, checksum: +sum.toFixed(6)}; }

/* ---- six people, the forklift, and what they cost ---- */
const body = buildCarBody(T, makeMaterials()), garage = G.buildPitGarage(), scene = new T.Scene(); scene.add(body.root, garage);
const specs = [...PARTS, ...body.removable.map((p, n) => ({index: PARTS.length + n, rotates: false, ratio: 0}))];
const drive = new Drive(specs.length, specs.map(p => p.rotates), specs);
const svc = new WheelService(body.wheels, {kit: garage.userData.serviceKit});
const crew = C.buildCrew({service: svc, wheels: body.wheels}); scene.add(crew.root); svc.carrier = crew.carrier; scene.updateMatrixWorld(true);
assert.deepEqual(C.ROLES.map(r => r.id), ['operator', 'mechanic', 'tech', 'engine', 'lead', 'driver'], 'six roles');
assert.deepEqual(Object.keys(crew.men).sort(), C.ROLES.map(r => r.id).sort());
{ let draws = 0, tris = 0, skinned = 0; const names = new Set();
  crew.root.traverse(o => { if (!o.isMesh || (o.material && o.material.visible === false)) return; draws += Array.isArray(o.material) ? o.geometry.groups.length : 1; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); if (o.isSkinnedMesh) skinned++; assert.ok(o.name && o.name.length > 3, 'every mesh is named'); names.add(o.name); });
  assert.equal(skinned, 6, 'six people, one skinned mesh each (the forklift operator is the sixth)');
  /* the budget: ~40 draws for all six and the forklift (the brief); they are 18 */
  assert.ok(draws <= 40, 'the crew and the forklift are ' + draws + ' draws'); assert.ok(tris < 90000, 'the crew are ' + tris + ' triangles');
  for (const n of ['Coates forklift', 'Forklift body', 'Forklift mast channels', 'Forklift carriage and forks', 'Forklift wheels', 'Tyre cage', 'Impact gun', 'Wheel rack', 'Telemetry station', 'Telemetry screens', 'Crew lead tablet', 'Forklift aisle paint', 'Crew drawn shadows']) assert.ok(crew.root.getObjectByName(n), n + ' is missing');
  for (const r of C.ROLES) { const m = crew.men[r.id]; assert.ok(m.fig.skeleton.bones.length === 19 && m.fig.mesh.isSkinnedMesh, r.id + ' is not a rigged figure');
    for (const b of C.BONES) assert.ok(m.fig.bones[b], r.id + ' has no ' + b); }
  /* not clones: each is their own height and build, their job across the back */
  const hs = C.ROLES.map(r => r.height + ':' + r.build); assert.equal(new Set(hs).size, 6, 'six different people');
  assert.deepEqual(C.ROLES.map(r => C.LABELS[r.label]), ['TELEMETRY', 'WHEELS', 'PIT TECH', 'ENGINE', 'CREW LEAD', 'FORKLIFT']);
  for (const w of ['TELEMETRY', 'WHEELS', 'PIT TECH', 'ENGINE', 'CREW LEAD', 'FORKLIFT', 'COATES · TYRES']) assert.ok(drawn.includes(w), w + ' was not printed');
  out.cost = {draws, triangles: Math.round(tris), skinned}; }

/* ---- the cards on the crew: Coates's own words, as every exhibit in the hall ---- */
{ const VOCAB = new Set(['Care Deeply', 'One Team', 'Be our Best', 'Customer focused', 'Competitive Spirit', 'Safety First', 'Customer Centric', 'Pace', 'Open to Feedback', 'Reduce Friction', 'Cadence',
    'Customer Solutions', 'Targeted Growth', 'Performance-led Results', 'Operational Excellence', 'Resilient Processes', 'Customer-led Innovation', 'Ease of Doing Business', 'Best Service and Value', 'People', 'Operations', 'Assets', 'Financials', ...G.LIFE_SAVING_RULES.map(r => r[0])]);
  assert.equal(crew.exhibits.length, 6); for (const b of crew.exhibits) { const e = b.userData.exhibit; assert.ok(VOCAB.has(e.word), e.id + ' points at "' + e.word + '"'); assert.ok(e.what.length > 30 && e.link.length > 40); assert.equal(b.material.visible, false);
    assert.ok(!/\d+(\.\d+)?\s*(s|sec|km\/h|kph|lap|laps|kW|kVA)\b/i.test(e.what + ' ' + e.link), 'no invented figure in ' + e.id); } }

/* ---- the walk, measured through the bones ---- */
{ const fig = C.buildFigure(T, {title: 'walker', label: 0}), m = new C.Crewman(fig, {seed: 3}); m.place(0, 0, Math.PI / 2); m.update(1 / 60);
  const toe = k => wp(k ? fig.markers.toeR : fig.markers.toeL);
  m.walkTo([[14, 0]], {speed: 1.2});
  let drift = 0, start = [null, null], cadence = [], rootAtLand = [];
  for (let i = 0; i < 60 * 14; i++) { m.update(1 / 60);
    for (const k of [0, 1]) { const f = m.feet[k]; if (f.planted && !f.step) { const t = toe(k); if (!start[k]) start[k] = t; else drift = Math.max(drift, t.distanceTo(start[k])); } else start[k] = null; }
    if (m.v > 1.19 && m.f > 0) cadence.push(Math.abs(m.v - m.f * (m.v / m.f)) + Math.abs(m.v / m.f - fig.dims.stride)); }
  assert.ok(drift < 1e-6, 'a planted foot slid ' + drift + ' m');
  const prints = m.footprints[0].filter(p => !p.manual), strides = prints.slice(1).map((p, i) => p.toe.distanceTo(prints[i].toe)), roots = prints.slice(1).map((p, i) => p.rootAt.distanceTo(prints[i].rootAt));
  const steady = strides.filter((s, i) => i > 0 && i < strides.length - 2);
  assert.ok(steady.length >= 6, 'not enough steady strides: ' + steady.length);
  for (let i = 0; i < steady.length; i++) { assert.ok(Math.abs(steady[i] - fig.dims.stride) < 1e-6, 'a stride is ' + steady[i]); assert.ok(Math.abs(roots[i + 1] - steady[i]) < 1e-6, 'the body did not cover the stride the foot did: ' + roots[i + 1] + ' vs ' + steady[i]); }
  assert.ok(cadence.every(e => e < 1e-9), 'speed is not stride × cadence');
  assert.ok(m.arrived && Math.abs(m.pos.x - 14) < 1e-6, 'the walk did not end where it was sent');
  const lastL = m.footprints[0][m.footprints[0].length - 1].ankle, lastR = m.footprints[1][m.footprints[1].length - 1].ankle; assert.ok(Math.abs(lastL.x - lastR.x) < .04, 'the feet did not come together at the end');
  out.walk = {stride: +fig.dims.stride.toFixed(3), speed: 1.2, cadenceHz: +(1.2 / fig.dims.stride).toFixed(3), strides: steady.length, stanceDrift: drift, bodyVsFoot: Math.max(...steady.map((s, i) => Math.abs(roots[i + 1] - s)))}; }
/* and turning on the spot is stepped, not swivelled on planted feet */
{ const fig = C.buildFigure(T, {title: 'turner'}), m = new C.Crewman(fig, {seed: 9}); m.place(0, 0, 0); m.update(1 / 60); m.face(Math.PI * .9);
  let worst = 0; const toe = k => wp(k ? fig.markers.toeR : fig.markers.toeL); let start = [null, null];
  for (let i = 0; i < 60 * 4; i++) { m.update(1 / 60); for (const k of [0, 1]) { const f = m.feet[k]; if (f.planted && !f.step) { const t = toe(k); if (!start[k]) start[k] = t; else worst = Math.max(worst, t.distanceTo(start[k])); } else start[k] = null; } }
  assert.ok(m.arrived && Math.abs(m.yaw - Math.PI * .9) < 1e-9, 'did not finish the turn'); assert.ok(worst < 1e-6, 'a foot slid while turning: ' + worst); assert.ok(m.footprints[0].length + m.footprints[1].length >= 3, 'turned without stepping'); }
/* the helmets do not all turn at once: told to look at one thing together, each turns after a delay of its own */
{ const men = Object.values(crew.men), target = new T.Vector3(0, 1, 0); for (const m of men) m.lookAt(target);
  const when = new Map(); for (let i = 0; i < 60 && when.size < men.length; i++) for (const m of men) { m.update(1 / 60); if (!when.has(m) && m.look.target === target) when.set(m, i); }
  const ts = [...when.values()]; assert.equal(ts.length, men.length); assert.ok(new Set(ts).size >= 4 && Math.max(...ts) - Math.min(...ts) >= 6, 'the helmets turned together: ' + ts.join(','));
  for (const m of men) m.lookAt(null); out.looks = {frames: ts}; }

/* ---- the wheel service with the crew doing the work, on both rear wheels, three cycles ---- */
let t = 0; const dt = 1 / 30;
/* v5.82 — NOBODY WALKS THROUGH A CAR (Andrew Fisher, 25 Sep 2026): every step of every cycle, each person's centre is outside every footprint
   on the floor (the car, the dyno, the stands, the desk, the racks — crew.js OBSTACLES); the count of steps checked is reported */
let pathChecks = 0; const inside = (p, b) => p.x > b[0] && p.x < b[2] && p.z > b[1] && p.z < b[3];
const pathsClear = () => { for (const [who, m] of Object.entries(crew.men)) { if (m.post && m.post.kind === 'sit') continue; /* the operator sits at his desk, which is a footprint */ for (const b of C.OBSTACLES) { pathChecks++; assert.ok(!inside(m.pos, b), who + ' is inside the footprint ' + JSON.stringify(b) + ' at ' + t.toFixed(2) + ' s (' + m.pos.x.toFixed(2) + ', ' + m.pos.z.toFixed(2) + ') post ' + (m.post && m.post.kind) + ' path ' + (m.path ? JSON.stringify(m.path.pts.map(q => q.map(v => +v.toFixed(2)))) : 'none')); } } };
const step = () => { drive.advance(dt); svc.update(dt); crew.update(dt, {running: drive.running && drive.omega > 1e-3, rpm: 0}); t += dt; pathsClear(); };
const until = (f, max, what) => { for (let s = 0; s < max; s += dt) { if (f()) return; step(); } assert.fail('timed out waiting for ' + what + ' (phase ' + svc.phase + ', hold ' + svc.hold + ', ' + JSON.stringify(crew.info().flags) + ')'); };
const worldOf = o => { o.updateWorldMatrix(true, false); return o.matrixWorld.clone(); }, maxDiff = (a, b) => Math.max(...a.elements.map((v, i) => Math.abs(v - b.elements[i])));
for (let i = 0; i < 60; i++) step();
const cycles = [];
for (const id of ['CAR-BODY-WHEEL-REAR-L', 'CAR-BODY-WHEEL-REAR-R', 'CAR-BODY-WHEEL-REAR-L']) {
  const cyc = {id}, w = body.wheels.find(g => g.userData.id === id), rotor = w.getObjectByName('Wheel rotor'), hub = w.getObjectByName('Wheel hub'), nut = w.getObjectByName('Wheel nut');
  const fixed = [w.getObjectByName('Wheel orange'), w.children.find(o => /^Brake caliper/.test(o.name)), ...hub.children], home = fixed.map(worldOf), rotorHome = worldOf(rotor), mech = crew.men.mechanic;
  /* the V8 runs: nothing moves toward the car */
  assert.equal(drive.start(), true); for (let i = 0; i < 90; i++) step();
  assert.equal(svc.step(drive).reason, 'Wait for the wheels to stop'); const p0 = mech.pos.clone();
  drive.stop(); until(() => drive.stationary, 30, 'the drive to stop');
  assert.ok(mech.pos.distanceTo(p0) < 1e-9 && crew.info().gun === 'stand', 'the mechanic moved while the car was running');
  assert.ok(svc.choose(id)); assert.equal(svc.step(drive).phase, 'isolated'); for (let i = 0; i < 45; i++) step();
  assert.ok(mech.pos.distanceTo(p0) < 1e-9, 'the mechanic started before the car was supported');
  assert.equal(svc.step(drive).phase, 'supported'); assert.equal(svc.step(drive).phase, 'wheelOff', 'Wheel off pressed at once');
  /* the service holds for the crew: the stands come in only with the pit technician at the sill, the nut turns only with the mechanic's gun on it */
  until(() => svc.hold === 'gun', 5, 'the gun hold'); assert.equal(svc.time, 0);
  until(() => svc.standsIn > 0, 40, 'the stands'); assert.equal(crew.men.tech.post.kind, 'kneel', 'the stands came in without the pit technician');
  until(() => svc.time > 0, 60, 'the nut to turn');
  { /* "the mechanic reaches within .3 m of the wheel before it comes off": his hands' distance from the wheel itself (a disc .334 m
       in radius, .24 m wide, about its axle), and the gun's socket on the nut */
    const toWheel = p => { const l = w.worldToLocal(p.clone()), ax = Math.abs(l.z), r = Math.hypot(l.x, l.y); return Math.hypot(Math.max(0, ax - .12), Math.max(0, r - .334)); };
    const hands = [wp(mech.fig.bones.handL), wp(mech.fig.bones.handR)].map(toWheel), gunTip = wp(crew.props.gun), n = wp(nut);
    cyc.handsToWheel = hands.map(v => +v.toFixed(3)); cyc.gunSocketToNut = +gunTip.distanceTo(n).toFixed(3);
    /* one hand on the tyre, the other on the gun whose socket is on the nut (the gun is 0.3 m long) */
    assert.ok(Math.min(...hands) <= .1 && Math.max(...hands) <= .45, 'the mechanic is not at the wheel when it comes off: ' + cyc.handsToWheel); assert.equal(crew.info().gun, 'nut');
    assert.ok(cyc.gunSocketToNut < .05, 'the gun is not on the nut: ' + cyc.gunSocketToNut); assert.ok(svc.standsIn >= 1); }
  until(() => svc.hold === 'carryOff', 30, 'the slide'); assert.ok(rotor.position.length() > .3);
  until(() => !svc.moving, 90, 'the wheel to reach the rack');
  { const r = wp(rotor), rack = crew.props.rack.position; cyc.rackGap = +Math.hypot(r.x - rack.x, r.z - rack.z).toFixed(4); assert.ok(cyc.rackGap < 1e-6 && Math.abs(r.y - C.RACK.hold) < 1e-6, 'the wheel is not in the rack');
    cyc.away = +r.distanceTo(new T.Vector3().setFromMatrixPosition(rotorHome)).toFixed(3); assert.ok(cyc.away >= .3); }
  fixed.forEach((o, k) => assert.ok(maxDiff(worldOf(o), home[k]) < 1e-9, o.name + ' moved with the wheel'));
  assert.equal(svc.startRefusal(), 'Refit wheel before starting'); assert.equal(drive.start(), false);
  assert.equal(svc.step(drive).phase, 'inspect'); for (let i = 0; i < 90; i++) step();
  assert.equal(svc.step(drive).phase, 'refit'); until(() => svc.hold === 'carryOn', 5, 'the carry-on hold');
  until(() => !svc.moving, 120, 'the refit'); assert.equal(svc.torqued, true);
  { const e = Math.max(rotor.position.length(), Math.abs(rotor.rotation.x), Math.abs(rotor.rotation.y), maxDiff(worldOf(rotor), rotorHome)); cyc.home = e; assert.ok(e < 1e-9, 'the rotor is not home: ' + e); assert.equal(rotor.parent, w); }
  /* Ready: SERVICE COMPLETE on the operator's screen; the drive stays locked until the lead's all-clear, and he gives it only once the crew are clear */
  drawn.length = 0; assert.equal(svc.step(drive).phase, 'ready'); for (let i = 0; i < 12; i++) step();
  assert.ok(drawn.includes('SERVICE COMPLETE'), 'the operator\'s screen does not say SERVICE COMPLETE');
  assert.equal(drive.locked, true); assert.equal(svc.startRefusal(), "Wait for the crew lead's all-clear"); assert.equal(drive.start(), false);
  let unlockedAt = null, clearAt = null, signalling = false;
  until(() => { if (crew.crewClear() && clearAt === null) clearAt = t; if (crew.men.lead.gest && crew.men.lead.gest.name === 'signal') signalling = true; if (!drive.locked && unlockedAt === null) unlockedAt = t; return !drive.locked; }, 120, 'the all-clear');
  assert.ok(clearAt !== null && unlockedAt >= clearAt, 'the drive unlocked before the crew were clear'); assert.ok(signalling, 'the lead did not signal');
  assert.equal(crew.info().gun, 'stand', 'the gun is not back on its stand'); assert.equal(crew.info().rack, 'store', 'the rack is not put away'); assert.equal(svc.standsIn, 0);
  cyc.clearToUnlock = +(unlockedAt - clearAt).toFixed(2); cycles.push(cyc);
  assert.equal(drive.start(), true); for (let i = 0; i < 30; i++) step(); drive.stop(); until(() => drive.stationary, 30, 'the stop');
}
for (const w of body.wheels) { let rotors = 0; w.traverse(o => { if (o.name === 'Wheel rotor') rotors++; }); assert.equal(rotors, 1, 'one rotor per wheel: ' + w.userData.id); }
out.service = {cycles, seconds: +t.toFixed(1)};

/* ---- Reset in the middle of a carry: everything home, nothing left in anyone's hands ---- */
{ svc.choose('CAR-BODY-WHEEL-REAR-R'); svc.step(drive); svc.step(drive); svc.step(drive); until(() => svc.hold === 'carryOff' && crew.men.mechanic.path, 90, 'the carry');
  const w = svc.wheel, rotor = w.getObjectByName('Wheel rotor'); assert.ok(rotor.position.length() > .1);
  svc.reset(drive); crew.reset(); for (let i = 0; i < 3; i++) step();
  assert.equal(svc.phase, 'ready'); assert.equal(drive.locked, false); assert.equal(rotor.position.length(), 0); assert.equal(rotor.rotation.x, 0); assert.equal(rotor.rotation.y, 0);
  const I = crew.info(); assert.equal(I.gun, 'stand'); assert.equal(I.rack, 'store'); assert.ok(Object.values(I.flags).every(v => !v));
  assert.ok(Math.hypot(I.people.mechanic.x - C.SPOTS.mechanicPost[0], I.people.mechanic.z - C.SPOTS.mechanicPost[1]) < 1e-9, 'the mechanic is not back at his post');
  assert.ok(Math.hypot(I.people.tech.x - C.SPOTS.techPost[0], I.people.tech.z - C.SPOTS.techPost[1]) < 1e-9, 'the pit technician is not back at his post'); }

/* ---- the forklift: two bays and an aisle, forks low, wheels by their ground travel, never near the car, still while paused ---- */
{ const parts = C.buildForklift(), f = new C.Forklift(parts, null), cell = {x0: G.GARAGE.bayFront, x1: G.GARAGE.bayBack, z0: G.GARAGE.bayFar, z1: G.GARAGE.bayNear};
  let nearest = Infinity, roll = [0, 0, 0, 0], slip = [0, 0, 0, 0], spin = [0, 0, 0, 0], prev = null, highCarry = 0, states = [], picks = 0, drops = 0, heldPrev = false;
  const R = [C.FORK.frontR, C.FORK.frontR, C.FORK.rearR, C.FORK.rearR];
  const contact = () => { const r = parts.root; r.updateMatrixWorld(true); return [[C.FORK.frontX, 0], [-C.FORK.frontX, 0], [C.FORK.rearX, -C.FORK.wheelbase], [-C.FORK.rearX, -C.FORK.wheelbase]].map(([x, z]) => new T.Vector3(x, 0, z).applyMatrix4(r.matrixWorld)); };
  for (let i = 0; i < 30 * 200; i++) {
    const s0 = f.spin.slice(); f.update(1 / 30, false); const now = contact();
    if (prev) now.forEach((p, k) => { const d = p.clone().sub(prev[k]), yawW = f.yaw + (k > 1 ? f.steers[k - 2] : 0), fw = new T.Vector3(Math.sin(yawW), 0, Math.cos(yawW)), along = d.dot(fw), lat = d.clone().addScaledVector(fw, -along).length();
      roll[k] += Math.abs(along); slip[k] += lat; spin[k] += Math.abs(f.spin[k] - s0[k]) * R[k]; });
    prev = now;
    for (const p of f.footprint()) { const dx = Math.max(cell.x0 - p.x, 0, p.x - cell.x1), dz = Math.max(cell.z0 - p.z, 0, p.z - cell.z1); nearest = Math.min(nearest, Math.hypot(dx, dz)); }
    if (f.held && (f.state === 'driving' || f.state === 'reversing')) highCarry = Math.max(highCarry, f.h);
    if (f.held && !heldPrev) picks++; if (!f.held && heldPrev) drops++; heldPrev = f.held;
    if (!states.length || states[states.length - 1] !== f.state) states.push(f.state);
  }
  for (let k = 0; k < 4; k++) { assert.ok(Math.abs(spin[k] - roll[k]) < 1e-6 * roll[k] + 1e-9, 'wheel ' + k + ' did not turn by its travel'); assert.ok(slip[k] < .03 * roll[k], 'wheel ' + k + ' slid sideways ' + (slip[k] / roll[k] * 100).toFixed(2) + ' %'); assert.ok(roll[k] > 40); }
  assert.ok(nearest > 3, 'the forklift came within ' + nearest.toFixed(2) + ' m of the car\'s pad');
  assert.ok(highCarry > .1 && highCarry <= .2, 'the forks carried at ' + highCarry + ' m');
  assert.ok(picks >= 2 && drops >= 2, 'picked up ' + picks + ', put down ' + drops);
  for (const s of ['parked', 'driving', 'mast', 'reversing']) assert.ok(states.includes(s), 'never ' + s);
  /* the load sits in a marked bay each time it is put down */
  assert.ok(C.AISLE.bays.some(([x, z]) => Math.hypot(f.load.x - x, f.load.z - z) < .05), 'the cage is not in a bay');
  /* paused on the aisle: it stops smoothly and then holds still, wheels too */
  const g = new C.Forklift(C.buildForklift(), null); for (let i = 0; i < 30 * 16; i++) g.update(1 / 30, false);
  assert.equal(g.state, 'driving'); const v0 = g.v; for (let i = 0; i < 30 * 2; i++) g.update(1 / 30, true);
  const x1 = g.x, z1 = g.z, s1 = g.spin.slice(); for (let i = 0; i < 30 * 3; i++) g.update(1 / 30, true);
  assert.ok(v0 > 1 && g.v === 0 && Math.hypot(g.x - x1, g.z - z1) < 1e-12 && g.spin.every((s, k) => s === s1[k]), 'the forklift did not hold still while paused');
  for (let i = 0; i < 30 * 3; i++) g.update(1 / 30, false); assert.ok(g.v > .5, 'it did not go on after the pause');
  out.forklift = {nearestToPad: +nearest.toFixed(2), carryHeight: +highCarry.toFixed(3), picks, drops, slipPct: slip.map((s, k) => +(s / roll[k] * 100).toFixed(3)), travelled: roll.map(v => +v.toFixed(1))}; }

out.pathsClear = {checks: pathChecks, footprints: C.OBSTACLES.length};
console.log(JSON.stringify({result: 'PASS', ...out}));
