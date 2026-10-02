/* THE PERSON (v8.08). Author: Andrew Fisher. Andrew Fisher, 2 Oct 2026: "The guy who is the driver looks like he crawls out of
   vehicle. Make this all 4k crystal clear. Improve every thing on here. 10/10".

   buildFigure(T, opts) → a standing person in the Coates crew suit on the crew's 19-bone skeleton (crew.js BONES): the same joints
   at the same places as the v5.81 figure, so every walk, kneel, reach and gesture the crew already make works unchanged, and one
   SkinnedMesh on the crew atlas (people-atlas.js), one draw a person. What v8.08 changes is the body built round those joints:

   - the torso is lofted from the seat of the suit to the collar through sixteen sections — seat, waist, ribs, chest, the slope of
     the shoulders — and its texture is laid by height, so the belt is at the waist and the Coates wordmark on the chest;
   - each leg is one continuous loft, hip to ankle (thigh, knee, calf, ankle), skinned across the knee and into the pelvis, so the
     knee bends as cloth over a joint instead of two tubes and a ball; the arm is the same, upper arm into forearm across the elbow,
     with the deltoid rounded over the shoulder;
   - gloves with a palm, four fingers in two joints each (relaxed, a little curled), a thumb, the knuckle guard and the cuff;
   - work boots with a toe box, an instep, a heel, a collar round the ankle, a rubber sole and heel block whose underside is the
     floor (y 0 at rest) — the feet stand on the floor, not in it;
   - a full-face helmet: the shell, the smoked visor in its gasket, the visor pivots, the chin bar and its vent, the crown vents, the
     rear spoiler and the neck roll; the operator's boom microphone;
   - the Coates suit detail in the atlas: the belt, the twill, the reflective hoops on the shins and forearms; the safety officer's
     hi-vis vest is part of his own skin now (lime, silver tape, SAFETY across the back), not a cylinder hung on his chest.

   The rest pose: upright, arms hanging, facing +z (the figure's left is +x), the soles on y 0. opts as before: height (m, without
   the helmet; 1.78 is the driver), build (shoulder and hip width, 1 = the driver), label (index into LABELS, across the back),
   helmet ('crew' | 'lead'), headset (a boom microphone on the helmet), title; and vest (the hi-vis vest). */
import {loftGeometry, ring, capsuleGeometry} from './car-driver.js';
import {ATLAS, crewAtlas} from './people-atlas.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';

export const BONES = Object.freeze(['hips', 'spine', 'chest', 'neck', 'head', 'clavL', 'armL', 'foreL', 'handL', 'clavR', 'armR', 'foreR', 'handR', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR']);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* a geometry into the figure's part list: its uv mapped into the atlas (a function of the part's own u,v, or one swatch point) */
function prepare(geo, uv) {
  const g = geo.index ? geo : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) { const n = g.attributes.position.count; g.setAttribute('uv', new g.attributes.position.constructor(new Float32Array(n * 2), 2)); }
  const uvA = g.attributes.uv, n = g.attributes.position.count;
  if (typeof uv === 'function') { for (let i = 0; i < n; i++) { const [a, b] = uv(uvA.getX(i), uvA.getY(i), i); uvA.setXY(i, a, b); } }
  else if (Array.isArray(uv)) { for (let i = 0; i < n; i++) uvA.setXY(i, uv[0], uv[1]); }
  g.clearGroups(); return g.index ? g : g;
}
/* skin weights: one bone, or a function of the rest position (x, y, z) → [[bone, weight], ...] (up to four) */
function skin(T, g, weights) {
  const P = g.attributes.position, n = P.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const w = typeof weights === 'number' ? [[weights, 1]] : weights(P.getX(i), P.getY(i), P.getZ(i));
    let s = 0; for (const [, x] of w) s += x; w.slice(0, 4).forEach(([b, x], k) => { si[i * 4 + k] = b; sw[i * 4 + k] = x / (s || 1); });
  }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4)); return g;
}
const blend2 = (a, b, t) => t <= 1e-4 ? [[a, 1]] : t >= 1 - 1e-4 ? [[b, 1]] : [[a, 1 - t], [b, t]];
/* a ring in the x–y plane (a section of a boot, toe to heel along z): a rounded rectangle, p the squareness (1 an ellipse, ½ near-square) */
function rrect(cx, cy, cz, hw, hh, k = 20, p = .55) {
  const out = []; const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i <= k; i++) { const t = i / k * Math.PI * 2; out.push([cx + hw * sp(Math.cos(t), p), cy + hh * sp(Math.sin(t), p), cz]); }
  return out;
}

export function buildFigure(T, {height = 1.78, build = 1, label = null, helmet = 'crew', headset = false, title = 'crew', vest = false} = {}) {
  const s = height / 1.78, w = build, at = crewAtlas(), B = Object.fromEntries(BONES.map((n, i) => [n, i]));
  /* the joints at rest, in the figure's own metres (the v5.81 figure's: crew.js's rig reads these) */
  const d = {s, w, height, pelvisY: .95 * s, hipY: .93 * s, L1: .43 * s, L2: .42 * s, ankleH: .08 * s, hipX: .09 * w, shX: .19 * w, shY: 1.43 * s,
    U1: .30 * s, U2: .265 * s, toeL: .15 * s, toeTip: .21 * s, heel: .075 * s, track: .20 * w, stride: 1.25 * s, headY: 1.58 * s, chestY: 1.25 * s, knee: .064 * s};
  const J = {hips: [0, d.pelvisY, 0], spine: [0, 1.05 * s, 0], chest: [0, d.chestY, 0], neck: [0, 1.47 * s, 0], head: [0, d.headY, 0]};
  for (const [side, k] of [['L', 1], ['R', -1]]) {
    J['clav' + side] = [k * .035 * w, d.shY, 0]; J['arm' + side] = [k * d.shX, d.shY, 0]; J['fore' + side] = [k * d.shX, d.shY - d.U1, 0]; J['hand' + side] = [k * d.shX, d.shY - d.U1 - d.U2, 0];
    J['thigh' + side] = [k * d.hipX, d.hipY, 0]; J['shin' + side] = [k * d.hipX, d.hipY - d.L1, 0]; J['foot' + side] = [k * d.hipX, d.ankleH, 0];
  }
  const PARENT = {spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck', clavL: 'chest', armL: 'clavL', foreL: 'armL', handL: 'foreL', clavR: 'chest', armR: 'clavR', foreR: 'armR', handR: 'foreR', thighL: 'hips', shinL: 'thighL', footL: 'shinL', thighR: 'hips', shinR: 'thighR', footR: 'shinR'};
  const root = new T.Group(); root.name = 'Crew, ' + title;
  const bones = {}, list = BONES.map(n => { const b = new T.Bone(); b.name = 'Crew, ' + title + ', ' + n; bones[n] = b; return b; });
  for (const n of BONES) { const p = PARENT[n], j = J[n], pj = p ? J[p] : [0, 0, 0]; bones[n].position.set(j[0] - pj[0], j[1] - pj[1], j[2] - pj[2]); if (p) bones[p].add(bones[n]); }
  const parts = [], put = (geo, uv, weights) => parts.push(skin(T, prepare(geo, uv), weights));
  const SW = name => at.swatch(name);
  const M = (geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(sx, sy, sz)));
  /* a capsule from a to b (three's CapsuleGeometry turned onto the segment), for fingers and small round parts */
  const capAB = (a, b, r, caps = 2, radial = 7) => { const A = new T.Vector3(...a), Bv = new T.Vector3(...b), dir = Bv.clone().sub(A), L = dir.length();
    const g = new T.CapsuleGeometry(r, Math.max(1e-4, L), caps, radial); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize())); g.translate((A.x + Bv.x) / 2, (A.y + Bv.y) / 2, (A.z + Bv.z) / 2); return g; };

  /* ---- THE TORSO: sixteen sections from the seat of the suit to the collar. [y, half-width, half-depth, back flattening, z offset]
     (metres at 1.78 m, build 1). The seat is fuller behind (the z offset), the waist narrower, the chest deeper, the shoulders slope
     into the collar. Its uv is laid by height (u 0 at the crotch, 1 at the collar) and round the body (v .25 the front), as the suit
     canvas is drawn; its skin is the hips' at the bottom, the chest's at the top and the spine's between. */
  const TORSO = [[.80, .105, .085, 0, -.006], [.83, .150, .108, .05, -.012], [.87, .168, .118, .08, -.016], [.92, .172, .117, .12, -.014], [.97, .166, .110, .18, -.008],
    [1.02, .156, .104, .24, -.002], [1.07, .152, .102, .25, 0], [1.12, .158, .106, .25, .004], [1.18, .171, .114, .25, .009], [1.24, .186, .121, .25, .013],
    [1.30, .198, .126, .27, .015], [1.35, .205, .124, .30, .013], [1.395, .204, .116, .34, .009], [1.43, .190, .104, .36, .005], [1.46, .150, .086, .34, .002], [1.49, .085, .068, .2, 0]];
  const y0 = TORSO[0][0] * s, y1 = TORSO[TORSO.length - 1][0] * s;
  const torsoW = (x, y) => { const h = 1 - smooth((y / s - .92) / .16), c = smooth((y / s - 1.08) / .18), m = Math.max(0, 1 - h - c);
    const out = [[B.hips, h], [B.spine, m], [B.chest, c]].filter(v => v[1] > 1e-4);
    /* the top of the shoulders follows the collarbones a little, so a raised arm lifts the yoke with it */
    if (y / s > 1.38 && Math.abs(x) > .08 * w) { const k = smooth((y / s - 1.38) / .06) * smooth((Math.abs(x) / w - .08) / .1) * .5; out.forEach(v => v[1] *= 1 - k); out.push([x > 0 ? B.clavL : B.clavR, k]); }
    return out; };
  const torsoRings = (off = 0, from = 0, to = TORSO.length) => TORSO.slice(from, to).map(([y, a, b, sq, z]) => ring([0, y * s, z * s], [1, 0, 0], [0, 0, 1], a * w + off, b * s + off, 32, sq));
  { const g = loftGeometry(T, torsoRings()), P = g.attributes.position, uvA = g.attributes.uv;
    for (let i = 0; i < P.count; i++) uvA.setX(i, clamp((P.getY(i) - y0) / (y1 - y0), 0, 1));
    put(g, at.rect(ATLAS.suit), torsoW); }
  /* the hi-vis vest: the torso's own sections from the waist to the shoulders, 14 mm proud, on the vest canvas */
  if (vest) { const from = 5, to = 14, g = loftGeometry(T, torsoRings(.014, from, to), {caps: false}), P = g.attributes.position, uvA = g.attributes.uv, va = TORSO[from][0] * s, vb = TORSO[to - 1][0] * s;
    for (let i = 0; i < P.count; i++) uvA.setX(i, clamp((P.getY(i) - va) / (vb - va), 0, 1));
    put(g, at.rect(ATLAS.vest), torsoW); }
  /* the job across the back: a patch of the torso's own surface, 2.5 mm proud of it, under the back's Coates and the 26 */
  if (label !== null && label !== undefined && !vest) {
    const ringAt = y => { const yy = y / s; let k = 0; while (k < TORSO.length - 2 && TORSO[k + 1][0] < yy) k++; const [ya, a0, b0, q0, z0] = TORSO[k], [yb, a1, b1, q1, z1] = TORSO[k + 1], t = clamp((yy - ya) / (yb - ya), 0, 1); return [lerp(a0, a1, t) * w, lerp(b0, b1, t) * s, lerp(q0, q1, t), lerp(z0, z1, t) * s]; };
    const rows = [], th0 = 1.5 * Math.PI - .62, th1 = 1.5 * Math.PI + .62;
    for (const y of [1.085 * s, 1.125 * s, 1.165 * s]) { const [a, b, sq, z] = ringAt(y), row = [];
      for (let i = 0; i <= 10; i++) { const t = lerp(th0, th1, i / 10), cs = Math.cos(t), sn = Math.sin(t), be = b * (1 - sq * Math.max(0, -sn)), nx = cs / a, nz = sn / be, nl = Math.hypot(nx, nz);
        row.push([a * cs + .0025 * nx / nl, y, z + be * sn + .0025 * nz / nl]); } rows.push(row); }
    const g = loftGeometry(T, rows, {caps: false}), uvA = g.attributes.uv, map = at.label(label);
    for (let i = 0; i < uvA.count; i++) { const along = uvA.getY(i), up = uvA.getX(i); const [u, v] = map(1 - along, up); uvA.setXY(i, u, v); }
    put(g, null, B.chest);
  }
  /* the collar (a stand-up band) and the balaclava'd neck */
  put(capsuleGeometry(T, [0, 1.455 * s, -.004], [0, 1.50 * s, -.002], .074 * s * w, .07 * s * w, {stations: 3, sides: 24}), SW('orange'), B.chest);
  put(capsuleGeometry(T, [0, 1.44 * s, -.006], [0, 1.64 * s, .008], .056 * s, .052 * s, {stations: 5, sides: 16}), SW('balaclava'), (x, y) => y / s < 1.5 ? [[B.neck, 1]] : [[B.neck, .5], [B.head, .5]]);

  /* ---- THE HELMET: a full-face shell over the head bone, its front +z ---- */
  { const hc = [0, d.headY + .078 * s, .012 * s], hr = .133 * s, HS = [1, 1.06, 1.1];
    /* the helmet's canvas faces its "front" (u .75) toward −z as three.js lays a sphere out; turned half round it faces +z */
    put(M(new T.SphereGeometry(hr, 34, 22, 0, Math.PI * 2, 0, Math.PI * .86), hc[0], hc[1], hc[2], 0, Math.PI, 0, ...HS), at.rect(helmet === 'lead' ? ATLAS.helmetLead : ATLAS.helmet), B.head);
    /* the underside of the shell, closed round the neck: the neck roll */
    put(M(new T.TorusGeometry(hr * .45, .017 * s, 8, 28), hc[0], hc[1] - hr * HS[1] * .89, hc[2], Math.PI / 2, 0, 0, 1, HS[2], 1), SW('black'), B.head);
    /* the visor: a smoked band over the eye port, a hair proud of the shell, in its rubber gasket, with its pivot plates either side */
    put(M(new T.SphereGeometry(hr * 1.028, 24, 8, .2 * Math.PI, .6 * Math.PI, .35 * Math.PI, .21 * Math.PI), hc[0], hc[1], hc[2], 0, 0, 0, ...HS), SW('smoke'), B.head);
    { const on = (ph, th) => new T.Vector3(hc[0] - hr * 1.034 * HS[0] * Math.cos(ph * Math.PI) * Math.sin(th * Math.PI), hc[1] + hr * 1.034 * HS[1] * Math.cos(th * Math.PI), hc[2] + hr * 1.034 * HS[2] * Math.sin(ph * Math.PI) * Math.sin(th * Math.PI));
      const edge = [], N = 16; for (let i = 0; i <= N; i++) edge.push(on(.2 + .6 * i / N, .35)); for (let i = 1; i <= 6; i++) edge.push(on(.8, .35 + .21 * i / 6)); for (let i = 1; i <= N; i++) edge.push(on(.8 - .6 * i / N, .56)); for (let i = 1; i < 6; i++) edge.push(on(.2, .56 - .21 * i / 6));
      put(new T.TubeGeometry(new T.CatmullRomCurve3(edge, true, 'catmullrom', .05), 64, .0048 * s, 4, true), SW('black'), B.head); }
    for (const k of [-1, 1]) put(M(new T.CylinderGeometry(.024 * s, .024 * s, .008 * s, 14), hc[0] + k * hr * 1.0, hc[1] + .005 * s, hc[2] + .03 * s, 0, 0, Math.PI / 2), SW('gunmetal'), B.head);
    /* the chin bar: fuller at the front */
    put(M(new T.SphereGeometry(hr * .62, 14, 7, .15 * Math.PI, .7 * Math.PI, .45 * Math.PI, .4 * Math.PI), hc[0], hc[1] - .05 * s, hc[2] + .03 * s, 0, 0, 0, 1.25, 1, 1.38), SW('black'), B.head);
    /* the crown vents and the rear spoiler */
    for (const k of [-1, 1]) put(M(new T.BoxGeometry(.018 * s, .012 * s, .05 * s), hc[0] + k * .03 * s, hc[1] + hr * HS[1] * .985 + .004 * s, hc[2] + .03 * s, -.25), SW('black'), B.head);
    put(M(new T.BoxGeometry(.12 * s, .012 * s, .05 * s), hc[0], hc[1] + .1 * s, hc[2] - .125 * s, -.5), SW('black'), B.head);
    if (headset) {
      /* the boom microphone of a helmeted computer operator: a cup over the ear, the boom round to the chin, the foam */
      put(M(new T.CylinderGeometry(.042 * s, .042 * s, .028 * s, 18), hc[0] - hr * 1.03, hc[1] - .01 * s, hc[2], 0, 0, Math.PI / 2), SW('orange'), B.head);
      put(capsuleGeometry(T, [hc[0] - hr * 1.04, hc[1] - .03 * s, hc[2] + .01], [hc[0] - .075 * s, hc[1] - .09 * s, hc[2] + .13 * s], .005 * s, .005 * s, {stations: 4, sides: 6}), SW('black'), B.head);
      put(M(new T.SphereGeometry(.017 * s, 10, 8), hc[0] - .05 * s, hc[1] - .095 * s, hc[2] + .155 * s), SW('black'), B.head);
    } }

  /* ---- THE ARMS: the deltoid over the shoulder, then the upper arm (the leg's striped canvas) and the forearm (the sleeve's, with its
     cuff band and reflective hoop) — two lofts that overlap at the elbow, each skinned across it, so the elbow bends as a sleeve does ---- */
  for (const [side, k] of [['L', 1], ['R', -1]]) {
    const x = k * d.shX, ys = d.shY, ye = ys - d.U1, yw = ye - d.U2, arm = B['arm' + side], fore = B['fore' + side], hand = B['hand' + side];
    const elbowW = (px, py) => blend2(arm, fore, smooth((ye + .035 * s - py) / (.07 * s)));
    /* the deltoid: a rounded cap over the joint, on the arm bone */
    put(M(new T.SphereGeometry(.054 * s * w, 16, 10), x + k * .002, ys - .004 * s, 0, 0, 0, 0, .95, 1.0, 1.06), SW('orange'), arm);
    const ua = [[ys + .02 * s, .055], [ys - .03 * s, .056], [ys - .09 * s, .053], [ys - .16 * s, .049], [ys - .23 * s, .045], [ye + .02 * s, .041], [ye - .03 * s, .039]];
    { const legUV = at.rect(ATLAS.leg); put(loftGeometry(T, ua.map(([y, r]) => ring([x, y, 0], [0, 0, 1], [1, 0, 0], r * s * w * 1.04, r * s * w, 18))), (u, v) => legUV(u * .6, v), elbowW); }   /* the stripes without the shin's hoops */
    const fa = [[ye + .03 * s, .040], [ye - .01 * s, .043], [ye - .07 * s, .044], [ye - .13 * s, .040], [ye - .19 * s, .035], [yw + .03 * s, .031], [yw + .005 * s, .03]];
    put(loftGeometry(T, fa.map(([y, r]) => ring([x, y, 0], [0, 0, 1], [1, 0, 0], r * s * w, r * s * w * 1.1, 18))), at.rect(ATLAS.sleeve), elbowW);
    /* ---- the glove: gauntlet cuff, the back of the hand and the palm, the knuckle guard, four fingers in two joints, the thumb.
       At rest the hand hangs: fingers down, the palm toward the thigh (−k x), the thumb forward (+z) ---- */
    put(M(new T.CylinderGeometry(.034 * s, .039 * s, .042 * s, 18), x, yw + .004 * s, 0, 0, 0, 0, 1, 1, 1.08), SW('glove'), hand);
    put(M(new T.CylinderGeometry(.0395 * s, .0395 * s, .01 * s, 18), x, yw + .02 * s, 0, 0, 0, 0, 1, 1, 1.08), SW('gloveOrange'), hand);
    put(M(new T.SphereGeometry(.05 * s, 12, 9), x - k * .002 * s, yw - .06 * s, .002 * s, 0, 0, 0, .44, 1.04, .9), at.rect(ATLAS.glove), hand);
    const curl = [.28, .62], fingers = [[.026, .95], [.009, 1.0], [-.009, .96], [-.025, .8]];
    for (const [fz, len] of fingers) {
      const base = [x - k * .002 * s, yw - .104 * s, fz * s], L1 = .042 * s * len, L2 = .040 * s * len, r = .0098 * s;
      const a1 = curl[0], a2 = curl[0] + curl[1];
      const mid = [base[0] - k * Math.sin(a1) * L1, base[1] - Math.cos(a1) * L1, base[2]], tip = [mid[0] - k * Math.sin(a2) * L2, mid[1] - Math.cos(a2) * L2, mid[2]];
      put(capAB(base, mid, r), at.rect(ATLAS.glove), hand); put(capAB(mid, tip, r * .92), at.rect(ATLAS.glove), hand);
    }
    { const t0 = [x - k * .012 * s, yw - .035 * s, .03 * s], t1 = [x - k * .022 * s, yw - .07 * s, .05 * s], t2 = [x - k * .03 * s, yw - .1 * s, .056 * s];
      put(capAB(t0, t1, .0115 * s), at.rect(ATLAS.glove), hand); put(capAB(t1, t2, .0105 * s), at.rect(ATLAS.glove), hand); }
  }

  /* ---- THE LEGS: one loft each, hip to ankle — thigh, the knee, the calf, the ankle — skinned into the pelvis at the top and across
     the knee, on the leg's striped canvas (the stripes down the sides, the reflective hoops round the shin) ---- */
  for (const [side, k] of [['L', 1], ['R', -1]]) {
    const x = k * d.hipX, kn = d.hipY - d.L1, thigh = B['thigh' + side], shin = B['shin' + side];
    /* [y (metres at 1.78), half-width, half-depth, z offset]: the thigh fuller in front, the knee narrower, the calf behind */
    const LEG = [[.99, .072, .085, -.005], [.95, .088, .096, .002], [.90, .092, .095, .006], [.80, .083, .086, .006], [.70, .074, .077, .006], [.60, .064, .068, .008],
      [.53, .059, .062, .012], [.49, .058, .060, .01], [.44, .057, .061, -.004], [.37, .060, .066, -.012], [.30, .055, .060, -.01], [.23, .047, .050, -.006], [.17, .041, .044, -.004], [.12, .040, .042, -.002], [.095, .041, .043, 0]];
    const st = LEG.map(([y, a, b, z]) => ring([x - k * .004 * (y > .8 ? (y - .8) * 5 : 0), y * s, z * s], [0, 0, 1], [1, 0, 0], b * s * w, a * s * w, 20));
    const legW = (px, py) => { const knee = smooth((kn + .045 * s - py) / (.09 * s)); if (knee > 0) return blend2(thigh, shin, knee);
      const top = smooth((py - (d.hipY + .0 * s)) / (.07 * s)) * .55; return blend2(thigh, B.hips, top); };
    put(loftGeometry(T, st), at.rect(ATLAS.leg), legW);
    /* the knee pad of the suit: a slightly proud oval over the front of the knee, on the shin so it rides the joint */
    put(M(new T.SphereGeometry(.05 * s * w, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), x, kn + .005 * s, .03 * s, Math.PI / 2, 0, 0, 1, .5, 1.2), SW('charcoal'), (px, py) => blend2(thigh, shin, .6));
  }
  /* ---- THE BOOTS on the foot bones: toe box, instep, heel, the collar round the ankle, the rubber sole and heel block (their
     underside is y 0), the orange pull tab and the reflective strip at the heel ---- */
  for (const [side, k] of [['L', 1], ['R', -1]]) {
    const x = k * d.hipX, foot = B['foot' + side];
    /* toe first: [z, half-width, bottom, top] (metres at 1.78) */
    const BOOT = [[.214, .022, .016, .040], [.205, .034, .013, .054], [.185, .044, .012, .066], [.15, .051, .012, .078], [.10, .053, .012, .090], [.05, .051, .012, .110],
      [0, .047, .013, .135], [-.04, .045, .015, .14], [-.065, .041, .02, .132], [-.08, .032, .03, .115], [-.086, .018, .045, .09]];
    const ring2 = ([z, hw, yb, yt], grow = 0) => rrect(x, ((yb + yt) / 2) * s, z * s, hw * s * w + grow, ((yt - yb) / 2) * s + grow, 18, .62);
    put(loftGeometry(T, BOOT.map(r => ring2(r))), at.rect(ATLAS.boot), foot);
    /* the collar round the ankle, up under the trouser cuff */
    put(loftGeometry(T, [[.19, .047, .052], [.165, .05, .056], [.13, .05, .058]].map(([y, a, b]) => ring([x, y * s, -.012 * s], [0, 0, 1], [1, 0, 0], b * s * w, a * s * w, 18))), at.rect(ATLAS.boot), (px, py) => py > .17 * s ? [[foot, .7], [B['shin' + side], .3]] : [[foot, 1]]);
    /* the sole: a rubber slab from toe to heel, 13 mm, its underside the floor; the heel block under the back */
    const SOLE = [[.218, .024], [.205, .037], [.18, .048], [.14, .056], [.09, .058], [.04, .054], [-.01, .051], [-.05, .05], [-.075, .045], [-.09, .03]];
    put(loftGeometry(T, SOLE.map(([z, hw]) => rrect(x, .0065 * s, z * s, (hw + .003) * s * w, .0065 * s, 14, .45))), SW('sole'), foot);
    put(M(new T.BoxGeometry(.088 * s * w, .025 * s, .06 * s), x, .0125 * s, -.058 * s), SW('sole'), foot);
    put(M(new T.BoxGeometry(.03 * s, .03 * s, .006 * s), x, .17 * s, -.088 * s), SW('gloveOrange'), foot);
    put(M(new T.BoxGeometry(.05 * s, .014 * s, .005 * s), x, .085 * s, -.084 * s, -.2), SW('reflect'), foot);
    /* the laces down the instep: three bars */
    for (let i = 0; i < 3; i++) put(M(new T.BoxGeometry(.04 * s, .005 * s, .006 * s), x, (.083 + i * .014) * s, (.075 - i * .03) * s, -.5), SW('tan'), foot);
  }

  const geo = mergeGeometries(parts, false); parts.forEach(p => p.dispose());
  const mesh = new T.SkinnedMesh(geo, at.material); mesh.name = 'Crew figure, ' + title; mesh.castShadow = true; mesh.receiveShadow = true;
  /* the whole person always fits this sphere, walking, kneeling or reaching — set once, so the renderer never re-skins the
     vertices on the processor to find it */
  mesh.boundingSphere = new T.Sphere(new T.Vector3(0, .9 * s, 0), 1.45 * s);
  root.add(mesh, bones.hips); root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(list); mesh.bind(skeleton);
  /* named points on the bones for the tests and the props: the toe pivot of each foot (where it rolls off the floor), each
     palm's grip point */
  const marker = (bone, x, y, z, name) => { const o = new T.Object3D(); o.name = name; o.position.set(x, y, z); bones[bone].add(o); return o; };
  const markers = {toeL: marker('footL', 0, -d.ankleH, d.toeL, 'toe pivot L'), toeR: marker('footR', 0, -d.ankleH, d.toeL, 'toe pivot R'),
    gripL: marker('handL', -.012 * s, -.085 * s, .012 * s, 'grip L'), gripR: marker('handR', .012 * s, -.085 * s, .012 * s, 'grip R')};
  return {root, mesh, bones, skeleton, dims: d, markers, title, triangles: geo.index.count / 3};
}
