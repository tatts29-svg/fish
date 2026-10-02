import {ENGINE_FIT} from './engine-kinematics.js';
import {CAR_AXLES} from './car-gc500.js';
/* THE BRAKES, FROM THE PEDAL TO THE DISC (v8.08). Andrew Fisher, 2 Oct 2026: "Add more mechanical features ... Improve every
   thing on here." The car had a brake slider that slowed the drive, and discs and calipers on the wheels, but nothing between
   them. Now the brake is a hydraulic circuit you can follow:

     the pedal pushes the balance bar → two master cylinders on the engine side of the firewall, front circuit and rear, their
     push rods going in with the pedal (60 % of the push to the front, as a race car is set up) → two hard lines along the
     chassis, glowing while they carry pressure, with a flexible hose at each front corner laid out every frame from the chassis
     to the steering upright → a pair of pistons and pads either side of each disc, standing 3 mm clear with the brake off and
     clamping it as it comes on.

   The rear discs are the ones turning on the rollers, so they are the ones that heat: brake against the running V8 and each
   rear disc's face glows dull red, then orange, as the work goes in — heat is the brake's push times the angle the disc has
   actually turned (read from the wheel's own hub, car-motion.js advanceWheel, so the dyno's spin counts), and it bleeds away
   over half a minute. The fronts sit in the chocks and never turn, so they never heat. The front pads ride the upright: they
   turn with the steering exactly as the wheel does (the same 18° at full lock, car-app.js STEER_ROAD).

   An illustration, like the rest of the rig: the heat is not a thermal model. Built in rig units (ENGINE_FIT) except the four
   corners, which are built in the wheels' own world metres inside a group scaled back by 1/ENGINE_FIT.scale, so the pads sit on
   the discs the body draws (car-gc500.js: disc at ±0.076 from the wheel centre, Ø 0.402; the caliper arc 132°–200°). */
export const STEER_ROAD = 18 * Math.PI / 180;   /* car-app.js: the front wheels' yaw at full lock */
export const BRAKE_BIAS = .6;                     /* share of the pedal's push on the front circuit */
export const PAD_GAP = .003;                      /* world metres between each pad and the disc, brake off */
const DISC_Z = .076, DISC_R = .201;
const toRig = (x, y, z) => [(x - ENGINE_FIT.x) / ENGINE_FIT.scale, y / ENGINE_FIT.scale, z / ENGINE_FIT.scale];

export function buildBrakes(T, mats, assembly, mesh, batch, h) {
  const {cyl, box, tube} = h, S = ENGINE_FIT.scale;
  const alongX = g => { g.rotateZ(Math.PI / 2); return g; };
  const alongZ = g => { g.rotateX(Math.PI / 2); return g; };
  /* every line and piston that carries pressure shares one material copy, so it can brighten with the pedal */
  const lineMat = mats.chrome.clone(); lineMat.emissive = new T.Color(0xff6a13); lineMat.emissiveIntensity = 0;

  // ---------------------------------------------------------------- the four corners: pistons and pads either side of the disc
  const corners = [];
  for (const [axle, ax] of [['front', CAR_AXLES.front], ['rear', CAR_AXLES.rear]]) for (const side of [1, -1]) {
    const name = side > 0 ? 'left' : 'right', id = `brake-pads-${axle}-${name}`;
    const home = toRig(ax, CAR_AXLES.y, side * CAR_AXLES.z);
    const g = assembly(id, `${name[0].toUpperCase() + name.slice(1)} ${axle} brake pads & caliper pistons`, home, [axle === 'front' ? -.25 : .25, .35, side * 1.45]);
    const metres = new T.Group(); metres.scale.setScalar(1 / S); g.add(metres);   /* world metres, the wheel's own frame */
    const yaw = new T.Group(); metres.add(yaw);                                   /* the upright's turn (fronts only) */
    const o = side;   /* outboard is +z on the near (left) side, −z on the far */
    const pad = (outer) => {   /* one pad: the steel backing plate and the friction block, an arc over the disc's outer band */
      const sh = new T.Shape(), a0 = 143 * Math.PI / 180, a1 = 190 * Math.PI / 180;
      sh.absarc(0, 0, .197, a0, a1, false); sh.absarc(0, 0, .152, a1, a0, true); sh.closePath();
      const fr = new T.ExtrudeGeometry(sh, {depth: .007, bevelEnabled: false, curveSegments: 10}), bp = new T.ExtrudeGeometry(sh, {depth: .003, bevelEnabled: false, curveSegments: 10});
      /* the friction face at local z = 0 facing the disc; outer pads face −z (toward the disc from outboard) */
      if (outer) { bp.translate(0, 0, .007); } else { fr.translate(0, 0, -.007); bp.translate(0, 0, -.010); }
      const grp = new T.Group(); yaw.add(grp);
      const f = mesh(grp, fr, 'dark', 'Friction pad'), b = mesh(grp, bp, 'steel', 'Pad backing plate');
      const pist = [];
      for (const a of [155, 178]) { const r = .175, A = a * Math.PI / 180, p = alongZ(new T.CylinderGeometry(.013, .013, .006, 16)); p.translate(Math.cos(A) * r, Math.sin(A) * r, outer ? .013 : -.013); pist.push(p); }
      const pm = new T.Mesh(mergeSimple(T, pist), lineMat); pm.name = 'Caliper pistons'; pm.castShadow = pm.receiveShadow = true; grp.add(pm);
      return grp;
    };
    /* "inner" and "outer" by the disc: for the near side outer is +z; the far side mirrors */
    const padOut = pad(o > 0), padIn = pad(o < 0);
    corners.push({id, axle, side, g, yaw, padOut, padIn, o, hub: null, glow: null, heat: 0, lastHub: null});
  }
  function placePads(c, clamp) {
    const gap = PAD_GAP * (1 - clamp) + .0006;   /* the disc is drawn as a plane; the pads stop just short of it */
    c.padOut.position.z = c.o * (DISC_Z + gap); c.padIn.position.z = c.o * (DISC_Z - gap);
  }

  // ---------------------------------------------------------------- the master cylinders and the balance bar, engine side of the firewall
  const mcZ = [-.36, -.50], mcY = .80, mcX = -.215;   /* driver's side (right, −z), level with the pedal box behind the firewall */
  const master = assembly('brake-master-cylinders', 'Twin brake master cylinders & balance bar', [mcX, mcY, (mcZ[0] + mcZ[1]) / 2], [-.25, .45, -.55]);
  const mcLocal = mcZ.map(z => z - (mcZ[0] + mcZ[1]) / 2);
  {
    const bodies = [], caps = [], dark = [];
    for (const z of mcLocal) {
      /* the bore is cut open along its top so the piston can be watched going in */
      bodies.push(alongX(new T.CylinderGeometry(.026, .026, .16, 18, 1, true, Math.PI * .15, Math.PI * 1.7)).translate(-.085, 0, z));
      bodies.push(alongX(new T.CylinderGeometry(.030, .030, .012, 18)).translate(-.006, 0, z), alongX(new T.CylinderGeometry(.026, .026, .006, 18)).translate(-.165, 0, z));
      caps.push(new T.CylinderGeometry(.022, .022, .05, 14).translate(-.085, .05, z), new T.CylinderGeometry(.024, .024, .01, 14).translate(-.085, .078, z));
      dark.push(new T.CylinderGeometry(.008, .008, .03, 8).translate(-.085, .027, z));
    }
    dark.push(box(.012, .09, .21, [.004, 0, 0]));   /* the mounting flange on the firewall */
    batch(master, 'steel', bodies, 'Master cylinder bores (sectioned)');
    batch(master, 'white', caps, 'Fluid reservoirs');
    batch(master, 'dark', dark, 'Reservoir feeds and firewall flange');
  }
  const mcPistons = mcLocal.map((z, k) => {
    const p = new T.Group(); p.position.z = z; master.add(p);
    batch(p, 'chrome', [alongX(new T.CylinderGeometry(.022, .022, .03, 16)).translate(-.03, 0, 0), alongX(new T.CylinderGeometry(.0065, .0065, .11, 10)).translate(.035, 0, 0), new T.BoxGeometry(.014, .02, .02).translate(.09, 0, 0)], k ? 'Rear-circuit piston and push rod' : 'Front-circuit piston and push rod');
    return p;
  });
  /* the balance bar the pedal pushes on, behind the flange: it pivots so the front cylinder takes 60 % of the stroke */
  const bar = new T.Group(); bar.position.set(.095, 0, 0); master.add(bar);
  batch(bar, 'orange', [new T.CylinderGeometry(.007, .007, .19, 10).rotateX(Math.PI / 2), alongX(new T.CylinderGeometry(.014, .014, .03, 12))], 'Balance bar and pedal trunnion');
  const STROKE = .028;   /* rig units: full pedal */

  // ---------------------------------------------------------------- the lines: front circuit and rear, along the chassis rail
  const lines = assembly('brake-lines', 'Brake lines, front and rear circuits', [0, 0, 0], [0, -.25, -.9]);
  const mcFront = [mcX - .17, mcY, mcZ[0]], mcRear = [mcX - .17, mcY, mcZ[1]];
  const frontCorner = side => toRig(CAR_AXLES.front, CAR_AXLES.y, side * CAR_AXLES.z), rearCorner = side => toRig(CAR_AXLES.rear, CAR_AXLES.y, side * CAR_AXLES.z);
  const rail = .42, railZ = .72;   /* the rear circuit's run along the far side, rig units */
  const hoseFrom = {};             /* where each front hose leaves the chassis */
  {
    const geos = [];
    /* front circuit: down from its cylinder, forward along the far rail under the headers, across ahead of the sump to a tee,
       out to a bracket inside each front wheel well (the hose takes it from there) */
    const tee = [-1.60, .25, 0];
    geos.push(tube([mcFront, [mcX - .19, mcY - .18, -.50], [-.45, .30, -.66], [-1.00, .27, -.66], [-1.55, .26, -.60], [-1.60, .25, -.30], tee], .0075, 48, 6));
    for (const side of [1, -1]) { const end = [-1.55, .30, side * .84]; hoseFrom[side] = end; geos.push(tube([tee, [-1.60, .25, side * .55], [-1.58, .27, side * .74], end], .0075, 16, 6)); }
    /* rear circuit: back along the far rail above the side exhaust, in over the prop shaft to a tee ahead of the axle, and out
       to each rear caliper through the wheel's open inner side */
    const rl = rearCorner(1), rtee = [rl[0] - .40, .52, 0];
    geos.push(tube([mcRear, [mcX - .10, mcY - .20, -.56], [mcX + .05, rail + .02, -railZ], [.80, rail, -railZ], [1.30, rail + .04, -.55], [rtee[0] - .10, .51, -.20], rtee], .0075, 56, 6));
    for (const [side, c] of [[1, rearCorner(1)], [-1, rearCorner(-1)]]) {
      /* into the caliper from inboard: along the axle line at the caliper's radius (the 165° point, ahead of the axle) */
      const A = 165 * Math.PI / 180, r = .175 / S, cx = c[0] + Math.cos(A) * r, cy = c[1] + Math.sin(A) * r, zw = c[2] * side;
      geos.push(tube([rtee, [rtee[0], .52, side * .35], [cx - .05, cy - .01, side * (zw - .30)], [cx, cy, side * (zw - .16)], [cx, cy, side * (zw + (DISC_Z - .02) / S)]], .0075, 30, 6));
    }
    const m = new T.Mesh(mergeSimple(T, geos), lineMat); m.name = 'Hard brake lines'; m.castShadow = m.receiveShadow = true; lines.add(m);
    const clips = [];for (const p of [[-1.00, .27, -.66], [.80, rail, -railZ], [-1.60, .25, -.30], [1.30, rail + .04, -.55]]) clips.push(box(.03, .025, .03, [p[0], p[1] - .015, p[2]]));
    batch(lines, 'dark', clips, 'Line clips');
  }
  /* the front hoses: from the chassis bracket to the caliper on the steering upright, re-laid every frame as the wheel turns */
  const hoses = [1, -1].map(side => {
    const m = new T.Mesh(new T.CylinderGeometry(.009, .009, 1, 8).translate(0, .5, 0), mats.rubber); m.name = (side > 0 ? 'Left' : 'Right') + ' front brake hose'; m.castShadow = true; lines.add(m);
    return {side, m, from: new T.Vector3(...hoseFrom[side])};
  });
  const unitY = new T.Vector3(0, 1, 0), tmp = new T.Vector3(), tip = new T.Vector3();
  function layHose(hz, yawAngle) {
    /* the caliper inlet: the 165° point at r .175, on the inboard face, turned with the upright about the wheel centre */
    const c = frontCorner(hz.side), A = 165 * Math.PI / 180, lx = Math.cos(A) * .175, lz = hz.side * .05;   /* the inboard face of the caliper, .055 outboard of the wheel centre */
    const cx = lx * Math.cos(yawAngle) + lz * Math.sin(yawAngle), cz = -lx * Math.sin(yawAngle) + lz * Math.cos(yawAngle);
    tip.set(c[0] + cx / S, c[1] + Math.sin(A) * .175 / S, c[2] + cz / S);
    tmp.subVectors(tip, hz.from); const L = tmp.length();
    hz.m.position.copy(hz.from); hz.m.quaternion.setFromUnitVectors(unitY, tmp.normalize()); hz.m.scale.set(1, L, 1);
  }

  // ---------------------------------------------------------------- the disc's heat, on the wheel's own hub
  function glowFor(c) {
    const inner = .105, outer = DISC_R - .002, segs = 64, rings = 4, pos = [], col = [], idx = [];
    for (const face of [1, -1]) {
      const base = pos.length / 3;
      for (let j = 0; j <= rings; j++) { const r = inner + (outer - inner) * j / rings, w = Math.pow(j / rings, 1.6);   /* hottest where the pads rub */
        for (let i = 0; i <= segs; i++) { const a = i / segs * Math.PI * 2; pos.push(Math.cos(a) * r, Math.sin(a) * r, c.o * DISC_Z + face * .0012); col.push(w, w * .55, w * .25); } }
      for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) { const a = base + j * (segs + 1) + i, b = a + segs + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    const mat = new T.MeshBasicMaterial({vertexColors: true, color: 0x000000, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2});
    const m = new T.Mesh(geo, mat); m.name = 'Brake disc heat'; m.visible = false; m.renderOrder = 2; return m;
  }
  const HOT = new T.Color(0xff8a2a), DULL = new T.Color(0x8a1200), glowCol = new T.Color();
  /* the wheels belong to the car's body; they are found once in the scene the powertrain has been added to, by their ids */
  let searched = 0;
  function attachHubs(root) {
    let top = root; while (top.parent) top = top.parent;
    if (top === root) return;
    for (const c of corners) {
      if (c.hub) continue;
      const id = `CAR-BODY-WHEEL-${c.axle.toUpperCase()}-${c.side > 0 ? 'R' : 'L'}`;   /* the body's R wheel is on +z, the car's left */
      let wheel = null; top.traverse(o => { if (!wheel && o.userData && o.userData.id === id) wheel = o; });
      const hub = wheel && wheel.getObjectByName('Wheel hub');
      if (!hub) continue;
      c.wheel = wheel; c.hub = hub; c.lastHub = hub.rotation.z;
      if (c.axle === 'rear') { c.glow = glowFor(c); hub.add(c.glow); }
    }
  }

  let brake = 0, brakeSet = false, steerT = 0, lastT = null, clampNow = 0;
  function setBrake(b) { brakeSet = true; brake = Math.max(0, Math.min(1, +b || 0)); }
  function setSteer(t) { steerT = Math.max(-1, Math.min(1, t || 0)); }
  /* until car-app.js passes the brake (engine.setBrake), the pedal's own slider is read: the same number the drive is slowed by */
  function pedal() { if (brakeSet || typeof document === 'undefined') return brake; const el = document.getElementById('brake'); return el ? Math.max(0, Math.min(1, +el.value / 100 || 0)) : 0; }
  const yawOf = () => -steerT * STEER_ROAD;

  function animate(root, connected = () => true) {
    const now = typeof performance !== 'undefined' ? performance.now() : 0, dt = lastT === null ? 0 : Math.max(0, Math.min(.1, (now - lastT) / 1000)); lastT = now;
    if (searched < 3 && corners.some(c => !c.hub)) { attachHubs(root); if (corners.every(c => c.hub)) searched = 3; else if (root.parent) searched++; }
    const b = pedal();
    /* the pads take up their 3 mm in the first few percent of the pedal, then clamp: the pressure is what the lines show */
    const clamp = Math.min(1, b / .06); clampNow = clamp;
    lineMat.emissiveIntensity = b * 1.6;
    /* the pedal moves the bar; the bar's pivot is set off-centre so the front cylinder takes 60 % of the force, both pistons going in together */
    if (connected('brake-master-cylinders')) { for (const p of mcPistons) p.position.x = -STROKE * b; bar.position.x = .095 - STROKE * b; }
    const yaw = yawOf();
    if (connected('brake-lines')) for (const hz of hoses) layHose(hz, yaw);
    for (const c of corners) {
      if (c.axle === 'front') c.yaw.rotation.y = yaw;
      if (connected(c.id)) placePads(c, clamp);
      /* heat: the push on this disc times the angle it has really turned since last frame, cooling with a half-minute fall */
      if (c.hub) {
        const a = c.hub.rotation.z, turned = c.lastHub === null ? 0 : Math.abs(a - c.lastHub); c.lastHub = a;
        const share = c.axle === 'front' ? BRAKE_BIAS : 1 - BRAKE_BIAS;
        c.heat = Math.min(1.25, c.heat * Math.exp(-dt / 11) + (connected(c.id) ? b * share * Math.min(turned, 2) * .09 : 0));
        if (c.glow) { const k = Math.min(1, c.heat); c.glow.visible = c.heat > .015; glowCol.copy(DULL).lerp(HOT, Math.min(1, k * 1.2)).multiplyScalar(Math.min(1.4, c.heat * 1.6)); c.glow.material.color.copy(glowCol); }
      }
    }
  }
  return {animate, setBrake, setSteer, corners, mcPistons, hoses, lineMat,
    get brake() { return pedal(); }, get clamp() { return clampNow; },
    padGap(c) { return +(c.o * c.padOut.position.z - DISC_Z).toFixed(5); },
    get heat() { return corners.map(c => +c.heat.toFixed(4)); }};
}
/* position + normal + uv merge for a few simple geometries (the shared helper in car-powertrain.js is not exported) */
function mergeSimple(T, geos) {
  const flat = geos.map(g => { if (!g.attributes.normal) g.computeVertexNormals(); return g.index ? g.toNonIndexed() : g; });
  const out = new T.BufferGeometry();
  for (const [k, n] of [['position', 3], ['normal', 3], ['uv', 2]]) {
    let total = 0; for (const g of flat) total += g.attributes[k] ? g.attributes[k].count * n : g.attributes.position.count * n;
    const data = new Float32Array(total); let at = 0;
    for (const g of flat) { const a = g.attributes[k]; if (a) data.set(a.array.subarray(0, a.count * n), at); at += g.attributes.position.count * n; }
    out.setAttribute(k, new T.BufferAttribute(data, n));
  }
  out.computeBoundingSphere(); return out;
}
