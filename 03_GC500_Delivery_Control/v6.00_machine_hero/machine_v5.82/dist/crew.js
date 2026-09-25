/* THE CREW (v5.81). Andrew Fisher, 24 Sep 2026: animated crews, full steam ahead, on top of his workshop brief
   of the same day — six well-made crew roles rather than a crowd of low-detail clones; Coates orange and charcoal race
   suits, gloves, boots and branded helmets; a helmeted computer operator as a deliberate, light-hearted touch; the tyre
   mechanic waiting until the scene has stopped, the computer operator told when the service is complete, the lead
   confirming the crew clear before a new dyno run; walking at the speed the feet move, no feet sliding, and no helmets
   all turning at once — and a Coates forklift that goes to a marked pick-up, stops, aligns, picks up a suitable load,
   travels the equipment aisle, stops at the drop, lowers and releases, then returns or parks, forks low, wheels turning
   with the ground, and holds its crossing during a wheel-service close-up. Approved in full, pushed as far as it would go.

   WHAT IS HERE. One figure builder (buildFigure: the driver's lofts, capsules and livery canvases from car-driver.js, on a
   19-bone skeleton, one skinned mesh and one draw a person), a rig that poses it (two-bone IK for the legs and arms, a look
   that each person turns in their own time, a small keyframe clip player for the gestures), a walk that cannot slide (the
   stance foot is pinned to the floor where it landed and the landing is placed where the body will be when it lands, so the
   ground the body covers is exactly the ground the feet sweep: speed = stride × cadence), six crew with a job each and a
   forklift with its own driver, and the director that ties their work to the wheel service (car-motion.js WheelService,
   through the `carrier` it asks before each step it cannot take alone). Nothing is downloaded: every surface is generated
   and every word drawn from the page's own vocabulary. No figure here is a measurement of anything; nobody's name is used.

   WHO DOES WHAT (roles below): the telemetry operator, seated and helmeted, types and glances between two screens that show
   the machine's own state and the service checklist, and acknowledges SERVICE COMPLETE; the wheel mechanic starts only when
   the car is on stands — gun from the stand at the head of the cell, to the chosen rear wheel, kneels, the gun runs while the
   nut comes off, pulls the wheel, carries it to the wheel stand, brings it back, refits, torques, returns the gun; the pit
   technician sets the jack stands (the service's stands come in only while he is at the sill), brings the wheel stand and
   receives the wheel on it, and takes both away after; the engine technician stands at the nose while the V8 runs and walks
   to the operator when it stops; the crew lead carries a tablet, holds the crew at isolation, points out the hub at
   inspection, and gives the all-clear signal — the drive unlocks only when he does, and only once the others are clear; the
   forklift operator shuttles a tyre cage between two marked bays along the far aisle, forks low, and holds still while a
   wheel comes off. */
import * as T3 from './vendor/three.module.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';
import {loftGeometry, ring, capsuleGeometry, suitTexture, limbTexture, helmetTexture, ORANGE, FONT} from './car-driver.js';
import {GARAGE, DYNO, GUN_STAND, EXHIBITS as GARAGE_EXHIBITS, LIFE_SAVING_RULES} from './pit-garage.js';
import {WHEEL_SERVICE} from './car-motion.js';

/* ------------------------------------------------------------------------------------------------ small tools */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2, wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
/* heading: yaw about +y, 0 facing +z; forward (sin, 0, cos), the figure's left (cos, 0, −sin) */
const yawTo = (dx, dz) => Math.atan2(dx, dz);
const fwdOf = (y, o) => o.set(Math.sin(y), 0, Math.cos(y)), leftOf = (y, o) => o.set(Math.cos(y), 0, -Math.sin(y));
/* each person's own dice, so no two do anything on the same beat */
export function prng(seed) { let s = (Math.imul(seed | 0, 2654435761) >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const V = (x = 0, y = 0, z = 0) => new T3.Vector3(x, y, z), Q = () => new T3.Quaternion();
const UP = new T3.Vector3(0, 1, 0), XA = new T3.Vector3(1, 0, 0), YA = new T3.Vector3(0, 1, 0), ZA = new T3.Vector3(0, 0, 1);

/* ------------------------------------------------------------------------------------------------ THE ATLAS
   One canvas for every person and every thing the crew handles, so a person is one draw and the whole crew shares one
   material: the suit (the driver's canvas in charcoal, with seams), two helmets (the crew's orange crown, the lead's white),
   the sleeve with its cuff band, the leg with its side stripes, eight labels (the six jobs across the backs, the Coates
   wordmark for the forklift and the cage's plate) and sixteen flat swatches. Its companion map carries roughness (green)
   and metalness (blue) in the same layout, so a visor shines, a glove does not, and a fork is steel. */
export const ATLAS = Object.freeze({
  W: 2048, H: 1536, gutter: 6,
  suit: [0, 0, 1024, 1024], helmet: [1024, 0, 1024, 512], helmetLead: [1024, 512, 1024, 512],
  sleeve: [0, 1024, 1024, 256], leg: [0, 1280, 1024, 256], labels: [1024, 1024, 1024, 384], swatches: [1024, 1408, 1024, 128],
});
export const SWATCH = Object.freeze({orange: 0, charcoal: 1, black: 2, glove: 3, visor: 4, steel: 5, rubber: 6, yellow: 7, white: 8, grey: 9, darkGrey: 10, alu: 11, red: 12, screen: 13, orangeDark: 14, timber: 15});
const SWATCH_RGB = ['#ff6a13', '#2a2f35', '#111317', '#141518', '#0a0d11', '#8d989f', '#141517', '#f2b400', '#eceeec', '#5b646b', '#23282d', '#b8c1c6', '#b5161a', '#05080b', '#c84f10', '#8a6a44'];
/* roughness (0–1) and metalness (0–1) of each swatch, in the same order */
const SWATCH_RM = [[.48, 0], [.9, 0], [.72, 0], [.74, 0], [.07, .25], [.34, .9], [.93, 0], [.6, 0], [.55, 0], [.7, 0], [.6, .1], [.36, .85], [.5, 0], [.12, 0], [.52, 0], [.82, 0]];
/* the six jobs, across the back of each suit; then the forklift's wordmark and the cage's plate */
export const LABELS = Object.freeze(['WHEELS', 'PIT TECH', 'ENGINE', 'TELEMETRY', 'CREW LEAD', 'FORKLIFT', 'Coates', 'COATES · TYRES']);
const CHARCOAL = '#2a2f35';

function makeCanvas(w, h) { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
/* a picture into an atlas rectangle, inset by the gutter, and its edges stretched out into the gutter so the mip chain of a
   neighbour never bleeds into it */
function blit(g, src, [x, y, w, h], gut) {
  if (!src) return; const sw = src.width, sh = src.height, iw = w - 2 * gut, ih = h - 2 * gut;
  g.drawImage(src, 0, 0, sw, sh, x + gut, y + gut, iw, ih);
  g.drawImage(src, 0, 0, sw, 1, x + gut, y, iw, gut); g.drawImage(src, 0, sh - 1, sw, 1, x + gut, y + h - gut, iw, gut);
  g.drawImage(src, 0, 0, 1, sh, x, y + gut, gut, ih); g.drawImage(src, sw - 1, 0, 1, sh, x + w - gut, y + gut, gut, ih);
}
let sharedAtlas = null;
export function crewAtlas() {
  if (sharedAtlas) return sharedAtlas;
  const A = ATLAS, c = makeCanvas(A.W, A.H), m = makeCanvas(A.W / 4, A.H / 4);
  let map = null, orm = null;
  if (c) {
    const g = c.getContext('2d'), gm = m.getContext('2d');
    g.fillStyle = CHARCOAL; g.fillRect(0, 0, A.W, A.H);
    /* the suit: the driver's livery in the crew's charcoal, seams and zip drawn in */
    blit(g, suitTexture(T3, {base: CHARCOAL, seams: true, chest: .5, backDir: 1, back: .6})?.image, A.suit, A.gutter);
    blit(g, helmetTexture(T3, {seam: true})?.image, A.helmet, A.gutter);
    blit(g, helmetTexture(T3, {crown: '#eceeec', word: ORANGE, seam: true})?.image, A.helmetLead, A.gutter);
    blit(g, limbTexture(T3, 'Coates', 0, {size: 24, x: 330, cuff: [.72, .80], base: CHARCOAL})?.image, A.sleeve, A.gutter);
    /* the leg (and the upper arm): charcoal, an orange stripe down each side (canvas y 64 and 192 are the limb's two sides) */
    { const lc = makeCanvas(1024, 256), lg = lc.getContext('2d'); lg.fillStyle = CHARCOAL; lg.fillRect(0, 0, 1024, 256);
      lg.fillStyle = ORANGE; for (const y of [64, 192]) lg.fillRect(0, y - 15, 1024, 30); lg.fillStyle = '#f4f5f3'; for (const y of [64, 192]) { lg.fillRect(0, y - 17, 1024, 2); lg.fillRect(0, y + 15, 1024, 2); }
      lg.fillStyle = '#f4f5f3'; lg.font = `800 22px ${FONT}`; lg.textAlign = 'center'; lg.textBaseline = 'middle'; for (const y of [64, 192]) lg.fillText('Coates', 170, y);
      blit(g, lc, A.leg, A.gutter); }
    /* the labels: white on the suit's charcoal with an orange rule (the jobs), white on orange (the wordmark), dark on steel (the plate) */
    LABELS.forEach((text, i) => {
      const [x0, y0] = A.labels, x = x0 + (i % 2) * 512, y = y0 + Math.floor(i / 2) * 96;
      const brand = text === 'Coates', plate = i === 7;
      g.fillStyle = brand ? ORANGE : plate ? '#9aa4aa' : CHARCOAL; g.fillRect(x, y, 512, 96);
      g.fillStyle = brand ? '#ffffff' : plate ? '#101417' : '#f4f5f3'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = brand ? `900 76px Arial, Helvetica, sans-serif` : `800 50px Arial, Helvetica, sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = brand ? '-2px' : '4px';
      g.fillText(text, x + 256, y + (brand ? 50 : 44));
      if (!brand && !plate) { g.fillStyle = ORANGE; g.fillRect(x + 96, y + 78, 320, 6); }
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    });
    SWATCH_RGB.forEach((col, i) => { g.fillStyle = col; g.fillRect(A.swatches[0] + i * 64, A.swatches[1], 64, 128); });
    /* a little weave in the charcoal swatch and a grain in the timber, so a flat face is not plastic */
    { const [sx, sy] = A.swatches; g.fillStyle = 'rgba(255,255,255,.04)'; for (let yy = 0; yy < 128; yy += 4) g.fillRect(sx + 64, sy + yy, 64, 1);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = 3; yy < 128; yy += 9) g.fillRect(sx + 15 * 64, sy + yy, 64, 2); }
    /* roughness (green) and metalness (blue), a quarter the size */
    const R = (r, mt) => `rgb(255,${Math.round(r * 255)},${Math.round(mt * 255)})`, q = ([x, y, w, h]) => [x / 4, y / 4, w / 4, h / 4];
    gm.fillStyle = R(.9, 0); gm.fillRect(0, 0, m.width, m.height);
    for (const k of ['helmet', 'helmetLead']) { gm.fillStyle = R(.26, 0); gm.fillRect(...q(A[k])); }
    gm.fillStyle = R(.8, 0); gm.fillRect(...q(A.labels));
    SWATCH_RM.forEach(([r, mt], i) => { gm.fillStyle = R(r, mt); gm.fillRect((A.swatches[0] + i * 64) / 4, A.swatches[1] / 4, 16, 32); });
    map = new T3.CanvasTexture(c); map.colorSpace = T3.SRGBColorSpace; map.anisotropy = 8;
    orm = new T3.CanvasTexture(m); orm.colorSpace = T3.NoColorSpace;
  }
  const material = new T3.MeshStandardMaterial({color: map ? 0xffffff : 0x2a2f35, map, roughnessMap: orm, metalnessMap: orm, roughness: orm ? 1 : .85, metalness: orm ? 1 : 0, envMapIntensity: .85});
  material.name = 'Crew atlas';
  /* where a region's u,v (0..1, v up, as its own canvas was drawn) lands in the atlas */
  const rect = ([x, y, w, h], gut = A.gutter) => (u, v) => [(x + gut + u * (w - 2 * gut)) / A.W, 1 - (y + gut + (1 - v) * (h - 2 * gut)) / A.H];
  const swatch = name => { const i = SWATCH[name], [sx, sy] = A.swatches; return [(sx + i * 64 + 32) / A.W, 1 - (sy + 64) / A.H]; };
  const label = i => { const [x0, y0] = A.labels; return rect([x0 + (i % 2) * 512, y0 + Math.floor(i / 2) * 96, 512, 96], 3); };
  sharedAtlas = {map, orm, material, rect, swatch, label};
  return sharedAtlas;
}

/* ------------------------------------------------------------------------------------------------ geometry into one skin */
/* a geometry into the figure's (or a prop's) part list: its uv mapped into the atlas, bound to one bone or several */
function prepare(geo, uv) {
  const g = geo.index ? geo : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  const uvA = g.attributes.uv, n = g.attributes.position.count;
  if (typeof uv === 'function') { for (let i = 0; i < n; i++) { const [a, b] = uv(uvA.getX(i), uvA.getY(i)); uvA.setXY(i, a, b); } }
  else if (Array.isArray(uv)) { for (let i = 0; i < n; i++) uvA.setXY(i, uv[0], uv[1]); }
  g.clearGroups(); return g;
}
function skin(g, weights) {
  const n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const w = typeof weights === 'number' ? [[weights, 1]] : weights(g.attributes.position.getY(i), i); w.forEach(([b, x], k) => { si[i * 4 + k] = b; sw[i * 4 + k] = x; }); }
  g.setAttribute('skinIndex', new T3.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T3.Float32BufferAttribute(sw, 4)); return g;
}
const moved = (geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => geo.applyMatrix4(new T3.Matrix4().compose(new T3.Vector3(x, y, z), new T3.Quaternion().setFromEuler(new T3.Euler(rx, ry, rz)), new T3.Vector3(sx, sy, sz)));

/* ------------------------------------------------------------------------------------------------ THE FIGURE
   buildFigure(T, opts) → a standing person in the Coates suit on a 19-bone skeleton: hips, spine, chest, neck, head, both
   clavicles, shoulders (upper arms), elbows (forearms), wrists (hands), hips (thighs), knees (shins), ankles (feet). Built
   in the rest pose — upright, arms hanging, facing +z (the figure's left is +x), feet on y 0 — out of the driver's own lofts
   and capsules (car-driver.js) and his livery canvases in charcoal. Every limb is rigid on its bone with a sphere at the
   joint, as the driver's are; the torso is lofted and its skin is shared between hips, spine and chest so it bends. One
   SkinnedMesh, one material (the crew atlas), one draw.
   opts: height (m, without the helmet; 1.78 is the driver), build (shoulder and hip width, 1 = the driver), label (index
   into LABELS, across the back), helmet ('crew' | 'lead'), headset (a boom microphone on the helmet), title (the name). */
export const BONES = Object.freeze(['hips', 'spine', 'chest', 'neck', 'head', 'clavL', 'armL', 'foreL', 'handL', 'clavR', 'armR', 'foreR', 'handR', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR']);
export function buildFigure(T, {height = 1.78, build = 1, label = null, helmet = 'crew', headset = false, title = 'crew'} = {}) {
  const s = height / 1.78, w = build, at = crewAtlas(), B = Object.fromEntries(BONES.map((n, i) => [n, i]));
  /* the joints at rest, in the figure's own metres */
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
  const parts = [], put = (geo, uv, weights) => parts.push(skin(prepare(geo, uv), weights));
  const SW = name => at.swatch(name);

  /* the torso: lofted from the seat of the suit to the shoulders, reclined not at all; u runs up the spine and v round the body
     exactly as the driver's does, so the suit canvas (Coates across the chest, the 26, Coates across the back, the orange side
     panels and yoke) lands the same way. Its skin is the hips' at the bottom, the chest's at the top and the spine's between. */
  const TORSO = [[.84, .160, .112, .10, 0], [.90, .173, .119, .15, -.006], [.97, .166, .111, .2, -.004], [1.04, .153, .103, .25, 0], [1.12, .161, .108, .25, .006],
                 [1.20, .179, .118, .25, .012], [1.28, .197, .125, .25, .015], [1.35, .206, .122, .3, .012], [1.41, .201, .110, .35, .005], [1.46, .162, .088, .35, 0], [1.495, .086, .07, .2, 0]];
  const st = TORSO.map(([y, a, b, sq, z]) => ring([0, y * s, z * s], [1, 0, 0], [0, 0, 1], a * w, b * s, 28, sq));
  const torsoW = y => { const h = 1 - ease((y / s - .92) / .16), c = ease((y / s - 1.08) / .18); const m = Math.max(0, 1 - h - c); return [[B.hips, h], [B.spine, m], [B.chest, c]].filter(v => v[1] > 1e-4).map(([b, x]) => [b, x / (h + m + c)]); };
  put(loftGeometry(T, st), at.rect(ATLAS.suit), torsoW);
  /* the job across the back: a patch of the torso's own surface, 2.5 mm proud of it, under the back's Coates and the 26 */
  if (label !== null && label !== undefined) {
    const ringAt = y => { const yy = y / s; let k = 0; while (k < TORSO.length - 2 && TORSO[k + 1][0] < yy) k++; const [y0, a0, b0, q0, z0] = TORSO[k], [y1, a1, b1, q1, z1] = TORSO[k + 1], t = clamp((yy - y0) / (y1 - y0), 0, 1); return [lerp(a0, a1, t) * w, lerp(b0, b1, t) * s, lerp(q0, q1, t), lerp(z0, z1, t) * s]; };
    const rows = [], th0 = 1.5 * Math.PI - .62, th1 = 1.5 * Math.PI + .62;
    for (const y of [1.085 * s, 1.125 * s, 1.165 * s]) { const [a, b, sq, z] = ringAt(y), row = [];
      for (let i = 0; i <= 10; i++) { const t = lerp(th0, th1, i / 10), cs = Math.cos(t), sn = Math.sin(t), be = b * (1 - sq * Math.max(0, -sn)), nx = cs / a, nz = sn / be, nl = Math.hypot(nx, nz);
        row.push([a * cs + .0025 * nx / nl, y, z + be * sn + .0025 * nz / nl]); } rows.push(row); }
    /* rows run up the back and across it; seen from behind the text reads from the figure's right to its left */
    const g = loftGeometry(T, rows, {caps: false}), uvA = g.attributes.uv, map = at.label(label);
    for (let i = 0; i < uvA.count; i++) { const along = uvA.getY(i), up = uvA.getX(i); const [u, v] = map(1 - along, up); uvA.setXY(i, u, v); }
    put(g, null, B.chest);
  }
  /* the collar, the neck and the helmet with its visor, rim, chin bar and spoiler; the operator's headset */
  put(moved(new T.TorusGeometry(.074 * s, .017 * s, 8, 24), 0, 1.475 * s, 0, Math.PI / 2), SW('orange'), B.chest);
  put(capsuleGeometry(T, [0, 1.44 * s, -.005], [0, 1.62 * s, .01], .052 * s, .05 * s, {stations: 4, sides: 12}), SW('charcoal'), B.neck);
  const hc = [0, d.headY + .078 * s, .012 * s], hr = .133 * s;
  /* the helmet's canvas faces its "front" (u .75) toward −z as three.js lays a sphere out; turned half round it faces +z */
  put(moved(new T.SphereGeometry(hr, 30, 22), hc[0], hc[1], hc[2], 0, Math.PI, 0, 1, 1.06, 1.1), at.rect(helmet === 'lead' ? ATLAS.helmetLead : ATLAS.helmet), B.head);
  put(moved(new T.SphereGeometry(hr * 1.035, 24, 8, .2 * Math.PI, .6 * Math.PI, .345 * Math.PI, .22 * Math.PI), hc[0], hc[1], hc[2], 0, 0, 0, 1, 1.06, 1.1), SW('visor'), B.head);
  put(moved(new T.TorusGeometry(hr * 1.04, .005 * s, 6, 30, .62 * Math.PI), hc[0], hc[1] + .026 * s, hc[2], 0, -.19 * Math.PI, 0, 1, 1.06, 1.1), SW('black'), B.head);
  put(moved(new T.CapsuleGeometry(.03 * s, .085 * s, 4, 10), hc[0], hc[1] - .082 * s, hc[2] + .106 * s, 0, 0, Math.PI / 2, 1, .8, 1), SW('black'), B.head);
  put(moved(new T.BoxGeometry(.11 * s, .012 * s, .05 * s), hc[0], hc[1] + .105 * s, hc[2] - .11 * s, -.35), SW('black'), B.head);
  if (headset) {
    /* the boom microphone of a helmeted computer operator: a cup over the ear, the boom round to the chin, the foam */
    put(moved(new T.CylinderGeometry(.04 * s, .04 * s, .03 * s, 16), hc[0] - hr * 1.02, hc[1] - .01 * s, hc[2], 0, 0, Math.PI / 2), SW('orange'), B.head);
    put(capsuleGeometry(T, [hc[0] - hr * 1.02, hc[1] - .03 * s, hc[2] + .01], [hc[0] - .07 * s, hc[1] - .085 * s, hc[2] + .12 * s], .0055 * s, .0055 * s, {stations: 3, sides: 6}), SW('black'), B.head);
    put(moved(new T.SphereGeometry(.016 * s, 10, 8), hc[0] - .045 * s, hc[1] - .09 * s, hc[2] + .15 * s), SW('black'), B.head);
  }
  /* the arms: the orange shoulder, the upper arm in the leg's striped charcoal, the elbow, the forearm with its cuff band and
     wordmark, the glove (palm, fingers, thumb, an orange cuff); each on its own bone */
  for (const [side, k] of [['L', 1], ['R', -1]]) {
    const x = k * d.shX, y0 = d.shY, y1 = y0 - d.U1, y2 = y1 - d.U2;
    put(new T.SphereGeometry(.058 * s * w, 16, 12).translate(x, y0, 0), SW('orange'), B['arm' + side]);
    put(capsuleGeometry(T, [x, y0 + .01 * s, 0], [x, y1, 0], .056 * s * w, .047 * s * w, {stations: 6, sides: 14}), at.rect(ATLAS.leg), B['arm' + side]);
    put(new T.SphereGeometry(.046 * s * w, 14, 10).translate(x, y1, 0), SW('charcoal'), B['fore' + side]);
    put(capsuleGeometry(T, [x, y1, 0], [x, y2 + .015 * s, 0], .046 * s * w, .036 * s * w, {stations: 6, sides: 14}), at.rect(ATLAS.sleeve), B['fore' + side]);
    put(moved(new T.CylinderGeometry(.039 * s, .041 * s, .035 * s, 16), x, y2 + .005 * s, 0), SW('orange'), B['hand' + side]);
    put(moved(new T.SphereGeometry(.05 * s, 14, 10), x, y2 - .058 * s, .004, 0, 0, 0, .46, 1.05, .95), SW('glove'), B['hand' + side]);
    put(moved(new T.CapsuleGeometry(.024 * s, .05 * s, 4, 10), x - k * .003, y2 - .125 * s, .004, 0, 0, 0, .7, 1, 1.7), SW('glove'), B['hand' + side]);
    put(moved(new T.CapsuleGeometry(.0115 * s, .038 * s, 4, 8), x - k * .012 * s, y2 - .075 * s, .042 * s, .5, 0, k * .25), SW('glove'), B['hand' + side]);
  }
  /* the legs: the striped charcoal thigh, the knee, the shin, and the boot — a lofted toe box and heel, its sole, the orange
     band round the ankle; the boot is on the foot bone at the ankle */
  for (const [side, k] of [['L', 1], ['R', -1]]) {
    const x = k * d.hipX, kn = d.hipY - d.L1;
    put(capsuleGeometry(T, [x, d.hipY + .03 * s, 0], [x, kn, 0], .094 * s * w, .066 * s * w, {stations: 8, sides: 16}), at.rect(ATLAS.leg), B['thigh' + side]);
    put(new T.SphereGeometry(d.knee * w, 14, 10).translate(x, kn, .004), SW('charcoal'), B['shin' + side]);
    put(capsuleGeometry(T, [x, kn, 0], [x, d.ankleH + .06 * s, -.005], .062 * s * w, .048 * s * w, {stations: 7, sides: 14}), at.rect(ATLAS.leg), B['shin' + side]);
    /* toe first: a loft laid from the toe back to the heel faces outward with this ring (the heel-first order faced inward) */
    const BOOT = [[.205, .031, .034, .028], [.165, .038, .050, .037], [.115, .046, .055, .046], [.055, .062, .054, .062], [0, .088, .052, .088], [-.05, .08, .049, .08], [-.078, .062, .038, .058]];
    const bst = BOOT.map(([z, y, hw, hh]) => ring([x, y * s, z * s], [1, 0, 0], [0, 1, 0], hw * s * w, hh * s, 16, .55));
    put(loftGeometry(T, bst), SW('black'), B['foot' + side]);
    const sst = BOOT.map(([z, , hw]) => ring([x, .007 * s, z * s], [1, 0, 0], [0, 1, 0], (hw + .004) * s * w, .0075 * s, 12, 0));
    put(loftGeometry(T, sst), SW('rubber'), B['foot' + side]);
    put(moved(new T.TorusGeometry(.05 * s * w, .009 * s, 6, 18), x, .15 * s, -.006, Math.PI / 2), SW('orange'), B['foot' + side]);
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

/* ------------------------------------------------------------------------------------------------ CLIPS
   A small keyframe system: a clip is named channels of [time, value] keys, eased between them, looped or not. The walk is
   sampled by the gait's phase (0..1 a stride), the idle by each person's own clock plus their own offset, the kneel and the
   crouch by how far down they are, and the gestures by their own time with a fade in and out. Channel names: arm{L,R}.
   {pitch,roll,twist,elbow,wrist} (radians: pitch raises the arm forward, roll out to the side, twist turns it inward, elbow
   bends the forearm forward), spine.pitch (lean forward), chest.yaw, pelvis.{yaw,roll,sway,bob} (sway and bob in metres),
   head.{pitch,yaw}. */
export class Clip {
  constructor(name, keys, {loop = false} = {}) { this.name = name; this.keys = keys; this.loop = loop; this.duration = Math.max(...Object.values(keys).map(k => k[k.length - 1][0])); }
  value(ch, t) {
    const k = this.keys[ch]; if (!k) return undefined;
    if (this.loop) t = ((t % this.duration) + this.duration) % this.duration;
    if (t <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return lerp(v0, v1, ease((t - t0) / (t1 - t0))); }
    return k[k.length - 1][1];
  }
}
const swing = a => [[0, -a], [.5, a], [1, -a]], swing2 = a => [[0, a], [.5, -a], [1, a]];
export const CLIPS = {
  /* one stride: the left foot lands at 0, the right at .5; the arms swing against the legs, the pelvis turns with the
     leading hip and the chest against it, the swing side's hip drops, the body sways over the stance foot */
  walk: new Clip('walk', {'armL.pitch': swing(.30), 'armR.pitch': swing2(.30), 'armL.elbow': [[0, .16], [.5, .44], [1, .16]], 'armR.elbow': [[0, .44], [.5, .16], [1, .44]],
    'pelvis.yaw': swing(.07), 'chest.yaw': swing2(.055), 'pelvis.roll': [[0, 0], [.25, .035], [.5, 0], [.75, -.035], [1, 0]],
    'pelvis.sway': [[0, -.003], [.31, .021], [.56, 0], [.81, -.021], [1, -.003]], 'pelvis.bob': [[0, -.012], [.31, .006], [.5, -.012], [.81, .006], [1, -.012]], 'spine.pitch': [[0, .05], [1, .05]]}, {loop: true}),
  /* standing: two breaths and a slow weight shift in 8.4 s; everybody starts it at a different point */
  idle: new Clip('idle', {'spine.pitch': [[0, .01], [2.1, .026], [4.2, .01], [6.3, .026], [8.4, .01]], 'pelvis.sway': [[0, -.008], [4.2, .012], [8.4, -.008]],
    'armL.roll': [[0, .13], [4.2, .16], [8.4, .13]], 'armR.roll': [[0, .15], [4.2, .12], [8.4, .15]], 'armL.pitch': [[0, .04], [8.4, .04]], 'armR.pitch': [[0, .05], [8.4, .05]],
    'armL.elbow': [[0, .2], [4.2, .26], [8.4, .2]], 'armR.elbow': [[0, .24], [4.2, .19], [8.4, .24]]}, {loop: true}),
  /* the kneel and the crouch, by depth: how the torso leans as the pelvis goes down */
  kneel: new Clip('kneel', {'spine.pitch': [[0, 0], [.5, .12], [1, .34]], 'head.pitch': [[0, 0], [1, .18]]}),
  crouch: new Clip('crouch', {'spine.pitch': [[0, 0], [.4, .18], [1, .62]], 'head.pitch': [[0, 0], [1, .3]]}),
  /* carrying a wheel: leaning back a little under it */
  carry: new Clip('carry', {'spine.pitch': [[0, -.07], [1, -.07]]}),
  /* typing: each hand taps in its own rhythm (metres down), the right one a little quicker */
  typing: new Clip('typing', {'tapL': [[0, 0], [.07, -.007], [.14, 0], [.33, 0], [.40, -.006], [.47, 0], [.62, 0], [.69, -.008], [.76, 0], [.9, 0]],
    'tapR': [[0, 0], [.1, 0], [.16, -.008], [.23, 0], [.3, 0], [.36, -.006], [.42, 0], [.55, 0], [.61, -.007], [.68, 0], [.9, 0]]}, {loop: true}),
  /* the lead's all-clear: the arm straight up, held, then swept down to point at the car — the run may start */
  signal: new Clip('signal', {'armR.pitch': [[0, .06], [.4, 2.95], [1.05, 2.95], [1.45, 1.45], [1.95, 1.45], [2.4, .06]], 'armR.roll': [[0, .12], [.4, .08], [1.45, .05], [2.4, .12]],
    'armR.elbow': [[0, .2], [.4, .04], [1.95, .02], [2.4, .2]], 'head.pitch': [[0, 0], [.4, -.14], [1.05, -.14], [1.45, 0], [2.4, 0]]}),
  /* the lead's hold at isolation: the palm up and out toward the crew */
  hold: new Clip('hold', {'armR.pitch': [[0, .06], [.35, 1.42], [1.05, 1.42], [1.4, .06]], 'armR.elbow': [[0, .2], [.35, .4], [1.05, .4], [1.4, .2]], 'armR.wrist': [[0, 0], [.35, -1.15], [1.05, -1.15], [1.4, 0]]}),
  /* the operator's acknowledgement: a thumb up */
  thumbs: new Clip('thumbs', {'armR.pitch': [[0, .3], [.4, 1.0], [1.5, 1.0], [2.0, .3]], 'armR.elbow': [[0, .9], [.4, 1.3], [1.5, 1.3], [2.0, .9]], 'armR.roll': [[0, .1], [.4, .32], [1.5, .32], [2.0, .1]],
    'armR.twist': [[0, 0], [.4, .95], [1.5, .95], [2.0, 0]]}),
  /* a quick "go" when the V8 is started: the arm forward and back */
  go: new Clip('go', {'armR.pitch': [[0, .06], [.3, 1.5], [.8, 1.5], [1.2, .06]], 'armR.elbow': [[0, .2], [.3, .05], [.8, .05], [1.2, .2]]}),
  /* the lead points at the hub at inspection (the direction is his look; the clip is the envelope) */
  point: new Clip('point', {'point': [[0, 0], [.45, 1], [1.9, 1], [2.3, 0]]}),
};

/* ------------------------------------------------------------------------------------------------ PATHS
   A walk is a polyline on the floor with its corners rounded (so the heading never jumps), followed by arc length. */
export class Path {
  constructor(points, fillet = .42) {
    const P = points.map(p => [p[0], p[1]]).filter((p, i, a) => !i || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 1e-4), out = [P[0]];
    for (let i = 1; i < P.length - 1; i++) {
      if (fillet <= 0) { out.push(P[i]); continue; }
      const [ax, az] = P[i - 1], [bx, bz] = P[i], [cx, cz] = P[i + 1], d1 = Math.hypot(bx - ax, bz - az), d2 = Math.hypot(cx - bx, cz - bz);
      const u1 = [(bx - ax) / d1, (bz - az) / d1], u2 = [(cx - bx) / d2, (cz - bz) / d2], turn = Math.acos(clamp(u1[0] * u2[0] + u1[1] * u2[1], -1, 1));
      if (turn < 1e-3) { out.push(P[i]); continue; }
      const t = Math.min(fillet * Math.tan(turn / 2), d1 * .48, d2 * .48), a = [bx - u1[0] * t, bz - u1[1] * t], c = [bx + u2[0] * t, bz + u2[1] * t];
      for (let k = 0; k <= 8; k++) { const q = k / 8, m1 = [lerp(a[0], bx, q), lerp(a[1], bz, q)], m2 = [lerp(bx, c[0], q), lerp(bz, c[1], q)]; out.push([lerp(m1[0], m2[0], q), lerp(m1[1], m2[1], q)]); }
    }
    if (P.length > 1) out.push(P[P.length - 1]);
    this.pts = out; this.cum = [0];
    for (let i = 1; i < out.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    this.length = this.cum[this.cum.length - 1];
    /* the heading at each point (the mean of the two chords either side), so the heading turns smoothly along an arc drawn as
       chords instead of in steps: a truck's rear axle, a wheelbase behind, would otherwise jump sideways at every chord */
    const sy = [0]; for (let i = 1; i < out.length; i++) sy.push(yawTo(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    this.vy = out.map((p, j) => j === 0 ? sy[1] ?? 0 : j === out.length - 1 ? sy[j] : sy[j] + wrap(sy[j + 1] - sy[j]) / 2);
  }
  seg(s) { let i = 1; while (i < this.cum.length - 1 && this.cum[i] < s) i++; return i; }
  at(s, o) { if (this.pts.length < 2) return o.set(this.pts[0][0], 0, this.pts[0][1]); s = clamp(s, 0, this.length); const i = this.seg(s), a = this.pts[i - 1], b = this.pts[i], L = this.cum[i] - this.cum[i - 1], t = L > 0 ? (s - this.cum[i - 1]) / L : 0; return o.set(lerp(a[0], b[0], t), 0, lerp(a[1], b[1], t)); }
  yawAt(s) { if (this.pts.length < 2) return 0; s = clamp(s, 0, this.length); const i = this.seg(s), L = this.cum[i] - this.cum[i - 1], t = L > 0 ? (s - this.cum[i - 1]) / L : 0; return this.vy[i - 1] + wrap(this.vy[i] - this.vy[i - 1]) * t; }
}

/* ------------------------------------------------------------------------------------------------ THE ROUTER
   The floor round the car is kept clear by walking round what stands on it: the car on its dyno and the pit, the straps and
   their anchors, the fan, the consoles and the stands — boxes on the floor, grown by a body's half-width. A walk that can
   go straight goes straight; otherwise it goes by the loop of aisle points round the cell (A* over them). */
export function segmentClear(ax, az, bx, bz, boxes, r) {
  for (const b of boxes) {
    const x0 = b[0] - r, z0 = b[1] - r, x1 = b[2] + r, z1 = b[3] + r; let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
    const clip = (p, q) => { if (Math.abs(p) < 1e-12) return q >= 0; const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } return true; };
    if (clip(-dx, ax - x0) && clip(dx, x1 - ax) && clip(-dz, az - z0) && clip(dz, z1 - az) && t0 < t1 - 1e-9) return false;
  }
  return true;
}
/* how far a floor point stands from the nearest box (0 inside one) */
export function clearanceOf(p, boxes) { let d = Infinity; for (const b of boxes) { const dx = Math.max(b[0] - p[0], 0, p[0] - b[2]), dz = Math.max(b[1] - p[1], 0, p[1] - b[3]); d = Math.min(d, Math.hypot(dx, dz)); } return d; }
export function route(from, to, boxes, nodes, r = .3) {
  /* v5.82 — the margin at either end is what that end allows: a man standing 17 cm from the gun stand, or kneeling 3 cm from the
     wheel's footprint, used to fail every segment out of (or into) that spot at the fixed .6 r margin, and the route fell back to
     a straight line — through the car (the crew test caught the mechanic crossing the cell that way). Now the first and last
     legs are asked to clear the boxes by the smaller of .6 r and the end point's own clearance; the legs between nodes keep r. */
  const rFrom = Math.min(r * .6, Math.max(0, clearanceOf(from, boxes) - .005)), rTo = Math.min(r * .6, Math.max(0, clearanceOf(to, boxes) - .005));
  if (segmentClear(from[0], from[1], to[0], to[1], boxes, Math.min(rFrom, rTo))) return [from, to];
  const N = [from, to, ...nodes], n = N.length, g = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), open = new Set([0]); g[0] = 0;
  const h = i => Math.hypot(N[i][0] - to[0], N[i][1] - to[1]);
  while (open.size) {
    let cur = -1, best = Infinity; for (const i of open) if (g[i] + h(i) < best) { best = g[i] + h(i); cur = i; }
    open.delete(cur); if (cur === 1) break;
    for (let j = 0; j < n; j++) { if (j === cur) continue; const c = g[cur] + Math.hypot(N[j][0] - N[cur][0], N[j][1] - N[cur][1]);
      if (c < g[j] && segmentClear(N[cur][0], N[cur][1], N[j][0], N[j][1], boxes, cur === 0 && j === 1 ? Math.min(rFrom, rTo) : cur === 0 ? rFrom : j === 1 ? rTo : r)) { g[j] = c; prev[j] = cur; open.add(j); } }
  }
  if (prev[1] < 0) return [from, to];     /* nothing clear: straight, as the last resort (never happens with the cell's loop) */
  const out = []; for (let i = 1; i >= 0; i = prev[i]) { out.unshift(N[i]); if (i === 0) break; } return out;
}

/* ------------------------------------------------------------------------------------------------ THE RIG AND THE WALK
   A Crewman is one figure and everything that moves it. Each frame: the root travels its path (or turns on the spot); the
   gait's phase runs at the cadence the speed asks for; a foot in stance stays exactly where it landed — its toe pivot is
   pinned to the floor and it only rolls up onto that pivot before it lifts — and a swinging foot is carried to where the
   body will be when it lands: half the stride's stance ahead of the body at that moment. The pelvis sits as high as both
   planted legs allow, the knees and the elbows are solved from their two lengths, the head looks where it was told after a
   delay of its own, and the clips lay the arms, the spine and the gestures over it. Nothing is keyed to the root's motion
   except through the feet, so the body cannot glide over a still foot. */
const _m4 = new T3.Matrix4(), _bx = V(), _by = V(), _bz = V();
function basisQ(down, fwd, out) {
  _by.copy(down).multiplyScalar(-1).normalize();
  _bz.copy(fwd).addScaledVector(_by, -fwd.dot(_by)); if (_bz.lengthSq() < 1e-10) { _bz.set(0, 0, 1).addScaledVector(_by, -_by.z); if (_bz.lengthSq() < 1e-10) _bz.set(1, 0, 0); }
  _bz.normalize(); _bx.crossVectors(_by, _bz); _m4.makeBasis(_bx, _by, _bz); return out.setFromRotationMatrix(_m4);
}
/* the joint between two segments of lengths L1, L2 from `a` toward `b`, bent toward `pole`; returns the reachable end in `end` */
function solveTwo(a, b, L1, L2, pole, mid, end) {
  const dir = _t1.copy(b).sub(a), dist = dir.length(); dir.divideScalar(dist || 1);
  const d = clamp(dist, Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-5), x = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  const n = _t2.copy(pole).sub(a); n.addScaledVector(dir, -n.dot(dir)); if (n.lengthSq() < 1e-10) n.set(0, 0, 1).addScaledVector(dir, -dir.z); n.normalize();
  mid.copy(a).addScaledVector(dir, x).addScaledVector(n, h); end.copy(a).addScaledVector(dir, d); return n;
}
const _t1 = V(), _t2 = V(), _t3 = V(), _t4 = V(), _q1 = Q(), _q2 = Q(), _q3 = Q(), _q4 = Q();
const qy = (a, o = Q()) => o.setFromAxisAngle(YA, a), qx = (a, o = Q()) => o.setFromAxisAngle(XA, a), qz = (a, o = Q()) => o.setFromAxisAngle(ZA, a);
const worldQ = (o, out) => { o.matrixWorld.decompose(_t3, out, _t4); return out; }, worldP = (o, out) => out.setFromMatrixPosition(o.matrixWorld);

export const GAIT = Object.freeze({beta: .62, fMin: .85, fMax: 1.35, accel: 1.7, turnWalk: 4.2, turnStand: 2.3, toeOff: .48, lift: .085, toeOut: .06});
export class Crewman {
  constructor(fig, {seed = 1, name = 'crew', walk = 1.2} = {}) {
    this.fig = fig; this.d = fig.dims; this.b = fig.bones; this.rand = prng(seed); this.name = name;
    this.pos = V(); this.yaw = 0; this.walkSpeed = walk; this.speed = walk; this.path = null; this.s = 0; this.v = 0; this.faceYaw = null; this.phase = 0; this.f = 0; this.yawRate = 0; this.motionYaw = 0;
    this.feet = [1, -1].map(side => ({side, planted: true, toe: V(), yaw: 0, pitch: 0, ankle: V(), lift: null, liftYaw: 0, liftPitch: 0, swing: 0, step: null}));
    /* posture: 'stand' | 'kneel' | 'crouch' | 'sit'; k how far into it (0 standing … 1 in it), stage for the kneel's steps */
    this.post = {kind: 'stand', k: 0, want: 0, stage: null, rate: 1.1, seat: null, kneel: null};
    this.hands = [0, 1].map(() => ({target: null, w: 0, rate: 5, pos: V(), quat: Q(), valid: false}));
    this.look = {target: null, next: null, hasNext: false, wait: 0, yaw: 0, pitch: 0, torso: 0, delay: .08 + this.rand() * .38, glance: null, glanceT: 1 + this.rand() * 3};
    this.gest = null; this.made = []; this.idleT = this.rand() * 8.4; this.t = 0; this.pelvisY = this.d.pelvisY; this.carrying = 0; this.bendWant = 0; this.bend = 0; this.sideWant = 0; this.side = 0;   /* bend: an extra lean for work low down; side: a lean to his right (+) or left (−) to reach the floor beside him */
    this.footprints = [[], []]; this.onLand = null;
    /* the floor under a foot: flat, unless told otherwise (the crew stand on the dyno pit's grating, 30 mm down) */
    this.floor = () => 0;
    this.ch = {};   /* the channels, filled each frame */
  }
  /* put the person somewhere, standing, feet side by side */
  place(x, z, yaw) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.path = null; this.v = 0; this.faceYaw = null; this.phase = 0; this.post = {kind: 'stand', k: 0, want: 0, stage: null, rate: 1.1, seat: null, kneel: null};
    for (const f of this.feet) this.plantNeutral(f);
    return this;
  }
  neutral(f, out, pos = this.pos, yaw = this.yaw) { leftOf(yaw, out).multiplyScalar(f.side * this.d.track / 2).add(pos); return out.setY(this.floor(out.x, out.z) + this.d.ankleH); }
  plantNeutral(f) { this.neutral(f, f.ankle); f.yaw = this.yaw + f.side * GAIT.toeOut; f.pitch = 0; f.planted = true; f.step = null; this.toeFromAnkle(f); }
  toeFromAnkle(f) { f.toe.set(0, -this.d.ankleH, this.d.toeL).applyQuaternion(qy(f.yaw, _q1)).add(f.ankle); f.toe.y = this.floor(f.toe.x, f.toe.z); }
  ankleFromToe(f) { f.ankle.set(0, this.d.ankleH, -this.d.toeL).applyQuaternion(_q1.copy(qy(f.yaw, _q2)).multiply(qx(f.pitch, _q3))).add(f.toe); }
  /* walk a list of floor points [x, z] (already routed), then face `face` (a yaw, or a point [x, z]) */
  walkTo(points, {speed = this.walkSpeed, face = null, clearOf = null} = {}) {
    /* v5.82 — the rounded corners never cut into a footprint: a route is clear of the boxes by its margin, but the fillet at a
       corner leaves the polyline; with the floor's boxes given, the fillet is eased off (.42 → .2 → square) until every piece
       of the walked line stays outside every box (Andrew Fisher: nobody walks through a car) */
    const pts = [[this.pos.x, this.pos.z], ...points]; let path = null;
    for (const fillet of clearOf ? [.42, .2, 0] : [.42]) { path = new Path(pts, fillet); if (!clearOf) break;
      let ok = true; for (let i = 1; i < path.pts.length && ok; i++) ok = segmentClear(path.pts[i - 1][0], path.pts[i - 1][1], path.pts[i][0], path.pts[i][1], clearOf, .02); if (ok) break; }
    this.path = path; this.s = 0; this.speed = speed;
    const last = points[points.length - 1];
    this.faceYaw = face === null ? null : Array.isArray(face) ? yawTo(face[0] - last[0], face[1] - last[1]) : face;
    if (this.path.length < 1e-3) this.path = null;
  }
  face(yawOrPoint) { this.faceYaw = Array.isArray(yawOrPoint) ? yawTo(yawOrPoint[0] - this.pos.x, yawOrPoint[1] - this.pos.z) : yawOrPoint; }
  get moving() { return !!this.path || this.faceYaw !== null || this.feet.some(f => !f.planted || f.step); }
  settled() {
    for (const f of this.feet) { if (!f.planted || f.step) return false; this.neutral(f, _t1); if (_t1.setY(this.d.ankleH).distanceTo(_t2.copy(f.ankle).setY(this.d.ankleH)) > .035 || Math.abs(wrap(f.yaw - this.yaw - f.side * GAIT.toeOut)) > .14 || f.pitch > .02) return false; }
    return true;
  }
  /* arrived: not travelling, facing where it was told, both feet down beside it, and upright or fully into its posture */
  get arrived() { return !this.path && this.faceYaw === null && this.post.stage === null && Math.abs(this.post.k - this.post.want) < 1e-6 && (this.post.kind !== 'stand' || this.settled()); }
  lookAt(target) { const L = this.look; if (L.hasNext ? target === L.next : target === L.target) return; L.next = target; L.hasNext = true; L.wait = L.delay; }
  /* the gestures he has made, with the person's clock, the last eight — for the tests to read what happened rather than race it */
  gesture(name) { this.gest = {clip: CLIPS[name], t: 0, name}; this.made.push({name, t: +this.t.toFixed(3)}); if (this.made.length > 8) this.made.shift(); }
  get gesturing() { return !!this.gest; }
  reach(i, fn, rate = 5) { const h = this.hands[i]; h.target = fn; h.rate = rate; }

  /* ---- the frame ---- */
  update(dt) {
    this.t += dt; this.idleT += dt;
    const pos0 = _p0.copy(this.pos), yaw0 = this.yaw, d = this.d;
    this.travel(dt);
    this.yawRate = wrap(this.yaw - yaw0) / Math.max(dt, 1e-6);
    this.gait(dt, pos0, yaw0);
    this.posture(dt);
    if (this.gest) { this.gest.t += dt; if (this.gest.t >= this.gest.clip.duration) this.gest = null; }
    this.channels();
    this.pose(dt);
  }
  travel(dt) {
    this.sPrev = this.s; this.pathPrev = this.path;
    if (this.path) {
      const L = this.path.length, remain = L - this.s, A = GAIT.accel;
      let vT = remain > 1e-4 ? this.speed : 0; vT = Math.min(vT, Math.sqrt(2 * A * Math.max(0, remain - .002)));
      const tan = this.path.yawAt(Math.min(L, this.s + .06)), lag = Math.abs(wrap(tan - this.yaw));
      vT *= clamp(1 - (lag - .3) / .8, .2, 1);
      this.v = Math.max(0, this.v + clamp(vT - this.v, -A * dt * 1.5, A * dt));
      this.s = Math.min(L, this.s + this.v * dt); this.path.at(this.s, this.pos); this.motionYaw = this.path.yawAt(this.s);
      this.yaw += clamp(wrap(tan - this.yaw), -GAIT.turnWalk * dt, GAIT.turnWalk * dt);
      if (L - this.s < 2e-3 && this.v < .06) { this.path.at(L, this.pos); this.path = null; this.v = 0; }
    } else this.v = 0;
    if (!this.path && this.faceYaw !== null) {
      const dy = wrap(this.faceYaw - this.yaw), r = GAIT.turnStand * dt;
      if (Math.abs(dy) <= r) { this.yaw = this.faceYaw; this.faceYaw = null; } else this.yaw += Math.sign(dy) * r;
    }
  }
  /* the stride, the cadence and the feet. f is the cadence in strides a second; the stride is v / f, so the body covers
     exactly what the feet sweep: speed = stride × cadence */
  gait(dt, pos0, yaw0) {
    const d = this.d, B = GAIT.beta, walking = this.post.kind === 'stand' && this.post.k === 0 && this.post.stage === null;
    const need = walking && (this.v > .02 || Math.abs(this.yawRate) > .2 || this.faceYaw !== null || !this.settled());
    const f = need ? clamp(this.v / d.stride, GAIT.fMin, GAIT.fMax) : 0; this.f = f;
    const stride = f > 0 ? this.v / f : 0;
    for (const foot of this.feet) if (foot.step) this.manualStep(foot, dt);
    if (f === 0) return;
    const ph0 = this.phase, adv = f * dt;
    this.feet.forEach((foot, i) => {
      if (foot.step) return;
      const q0 = ((ph0 + (i ? .5 : 0)) % 1 + 1) % 1, q1 = q0 + adv;
      if (foot.planted) {
        if (q0 < B && q1 >= B) this.liftOff(foot);
        else { const sig = clamp(q1 / B, 0, 1); foot.pitch = GAIT.toeOff * clamp(this.v / 1.2, 0, 1) * ease((sig - .68) / .32);   /* no roll onto the toes when stepping on the spot */ this.ankleFromToe(foot); }
      }
      if (!foot.planted) {
        /* the stride shortens to nothing over the last stride of a walk, so the last foot lands beside the other one */
        const ahead = rem => stride * clamp(rem / (stride * B / 2 + 1e-6), 0, 1);
        if (q1 >= 1) {
          /* the landing, at the instant inside this frame when the swing ends: the body's place and heading then */
          const a = clamp((1 - q0) / Math.max(adv, 1e-9), 0, 1), rp = _t4.copy(pos0).lerp(this.pos, a), ry = yaw0 + wrap(this.yaw - yaw0) * a;
          const P = this.pathPrev, rem = P ? Math.max(0, P.length - lerp(this.sPrev, this.path ? this.s : P.length, a)) : 0;
          this.landAt(foot, rp, ry, ahead(rem));
        } else {
          const u = clamp((q1 - B) / (1 - B), 0, 1); foot.swing = u;
          const tRem = (1 - u) * (1 - B) / f, rp = _t4.copy(this.pos); let rem = 0;
          if (this.path) { const go = Math.min(this.v * tRem, this.path.length - this.s); this.path.at(this.s + go, rp); rem = this.path.length - this.s - go; }
          let ry = this.yaw; if (this.faceYaw !== null && !this.path) ry += clamp(wrap(this.faceYaw - this.yaw), -GAIT.turnStand * tRem, GAIT.turnStand * tRem);
          this.swingTo(foot, rp, ry, ahead(rem), u);
        }
      }
    });
    this.phase = (ph0 + adv) % 1;
  }
  landTarget(foot, rp, ry, stride, out) { out.copy(rp).addScaledVector(fwdOf(ry, _t2), stride * GAIT.beta / 2).addScaledVector(leftOf(ry, _t3), foot.side * this.d.track / 2); return out.setY(this.floor(out.x, out.z) + this.d.ankleH); }
  liftOff(foot) { foot.planted = false; foot.lift = foot.ankle.clone(); foot.liftYaw = foot.yaw; foot.liftPitch = foot.pitch; foot.swing = 0; }
  swingTo(foot, rp, ry, stride, u) {
    const tgt = this.landTarget(foot, rp, ry, stride, _t1), e = ease(u);
    foot.ankle.copy(foot.lift).lerp(tgt, e); foot.ankle.y += d_lift(this) * Math.sin(Math.PI * u);
    foot.yaw = foot.liftYaw + wrap(ry + foot.side * GAIT.toeOut - foot.liftYaw) * e;
    foot.pitch = foot.liftPitch * (1 - ease(u / .5)) - .13 * Math.sin(Math.PI * clamp((u - .35) / .65, 0, 1));
  }
  landAt(foot, rp, ry, stride) {
    this.landTarget(foot, rp, ry, stride, foot.ankle); foot.yaw = ry + foot.side * GAIT.toeOut; foot.pitch = 0; foot.planted = true; foot.swing = 0; foot.lift = null;
    this.toeFromAnkle(foot); this.footprints[foot.side > 0 ? 0 : 1].push({toe: foot.toe.clone(), ankle: foot.ankle.clone(), t: this.t, rootAt: rp.clone()});
    if (this.footprints[0].length > 64) this.footprints.forEach(a => a.splice(0, a.length - 32));
    if (this.onLand) this.onLand(foot);
  }
  /* a step taken on purpose (into a kneel, out of one): lift, carry to `ankle` with `yaw`, put down flat, over `dur` */
  stepFoot(i, ankle, yaw, dur = .42) { const f = this.feet[i]; f.step = {from: f.ankle.clone(), fromYaw: f.yaw, fromPitch: f.pitch, to: ankle.clone().setY(this.floor(ankle.x, ankle.z) + this.d.ankleH), yaw, t: 0, dur}; f.planted = false; }
  manualStep(f, dt) {
    const s = f.step; s.t += dt; const u = clamp(s.t / s.dur, 0, 1), e = ease(u);
    f.ankle.copy(s.from).lerp(s.to, e); f.ankle.y += .07 * this.d.s * Math.sin(Math.PI * u); f.yaw = s.fromYaw + wrap(s.yaw - s.fromYaw) * e; f.pitch = s.fromPitch * (1 - e);
    if (u >= 1) { f.ankle.copy(s.to); f.yaw = s.yaw; f.pitch = 0; f.step = null; f.planted = true; this.toeFromAnkle(f); this.footprints[f.side > 0 ? 0 : 1].push({toe: f.toe.clone(), ankle: f.ankle.clone(), t: this.t, manual: true}); }
  }
  /* ---- postures ---- */
  kneel(on = true) { if (on) { if (this.post.kind === 'kneel' && this.post.want === 1) return; this.post.kind = 'kneel'; this.post.want = 1; this.post.stage = 'prep'; this.post.kneel = this.kneelPlan(); this.post.rate = 1.15; }
    else if (this.post.kind === 'kneel') { this.post.want = 0; this.post.stage = 'rise'; this.post.rate = 1.25; } }
  crouch(k = 1) { if (this.post.kind !== 'crouch' && this.post.kind !== 'stand') return; this.post.kind = k > 0 || this.post.k > 0 ? 'crouch' : 'stand'; this.post.want = k; this.post.rate = 1.4; }
  sit(seat) { this.post = {kind: 'sit', k: 1, want: 1, stage: null, rate: 1, seat, kneel: null}; }
  /* the kneel, planned from where the person stands: the right knee goes down under the right hip, the left foot steps
     forward, the right foot back onto its toes; that toe stays where it is put as the foot rolls up and the knee goes down */
  kneelPlan() {
    const d = this.d, F = fwdOf(this.yaw, V()), Lf = leftOf(this.yaw, V()), P = this.pos.clone(), al = .14, lean = .21;
    const K = P.clone().addScaledVector(F, -L_lean(d, lean)).addScaledVector(Lf, -d.hipX); K.setY(this.floor(K.x, K.z) + d.knee);
    const hipR = K.clone().addScaledVector(UP, d.L1 * Math.cos(lean)).addScaledVector(F, d.L1 * Math.sin(lean));
    const pelvis = hipR.clone().addScaledVector(Lf, d.hipX).addScaledVector(UP, d.pelvisY - d.hipY);
    const ankR = K.clone().addScaledVector(F, -d.L2 * Math.cos(al)).addScaledVector(UP, d.L2 * Math.sin(al));
    /* the pitch that puts the right toe pivot on the floor, heel up (the toes tucked under) */
    const h = d.ankleH, L = d.toeL, r = Math.hypot(h, L), th = Math.atan2(L, h) + Math.acos(clamp(ankR.y / r, -1, 1));
    const toeR = V().set(0, -h, L).applyQuaternion(_q1.copy(qy(this.yaw, _q2)).multiply(qx(th, _q3))).add(ankR); toeR.y = this.floor(toeR.x, toeR.z);
    const ankL = V().set(pelvis.x, 0, pelvis.z).addScaledVector(Lf, d.hipX).addScaledVector(F, .26 * d.s); ankL.y = this.floor(ankL.x, ankL.z) + d.ankleH;
    const flatR = V().set(0, h, -L).applyQuaternion(qy(this.yaw, _q2)).add(toeR);   /* the right ankle standing flat on that toe */
    return {K, pelvis, ankR, ankL, toeR, flatR, pitch: th, yaw: this.yaw};
  }
  posture(dt) {
    const p = this.post;
    if (p.kind === 'kneel') {
      const kp = p.kneel, L = this.feet[0], R = this.feet[1];
      if (p.stage === 'prep') {
        if (!L.step && !R.step) {
          if (L.ankle.distanceTo(kp.ankL) > .02) this.stepFoot(0, kp.ankL, kp.yaw + GAIT.toeOut, .45);
          else if (R.ankle.distanceTo(kp.flatR) > .02) this.stepFoot(1, kp.flatR, kp.yaw - GAIT.toeOut * 0, .5);
          else p.stage = 'down';
        }
      } else if (p.stage === 'down') { p.k = Math.min(1, p.k + dt * p.rate); if (p.k >= 1) p.stage = null; }
      else if (p.stage === 'rise') {
        p.k = Math.max(0, p.k - dt * p.rate);
        if (p.k <= 0) { p.stage = 'unstep'; }
      } else if (p.stage === 'unstep') {
        if (!L.step && !R.step) {
          const nR = this.neutral(R, V()), nL = this.neutral(L, V());
          if (R.ankle.distanceTo(nR) > .02) this.stepFoot(1, nR, this.yaw - GAIT.toeOut, .5);
          else if (L.ankle.distanceTo(nL) > .02) this.stepFoot(0, nL, this.yaw + GAIT.toeOut, .45);
          else { p.stage = null; p.kind = 'stand'; p.kneel = null; }
        }
      }
      /* the right foot rolls up onto its toe as the knee goes down */
      if (kp && (p.stage === 'down' || p.stage === 'rise' || (p.stage === null && p.k > 0))) { R.toe.copy(kp.toeR); R.yaw = kp.yaw; R.pitch = kp.pitch * ease(p.k); this.ankleFromToe(R); }
    } else if (p.kind === 'crouch') {
      p.k += clamp(p.want - p.k, -dt * p.rate, dt * p.rate);
      if (p.k <= 0 && p.want <= 0) { p.k = 0; p.kind = 'stand'; }
    }
  }
  /* ---- the channels: idle, walk, posture clips and the gesture, laid over one another ---- */
  channels() {
    const ch = this.ch, C = CLIPS, idle = C.idle, t = this.idleT;
    for (const k of Object.keys(ch)) ch[k] = 0;
    for (const k of Object.keys(idle.keys)) ch[k] = idle.value(k, t);
    const wk = this.f > 0 ? clamp(this.v / 1.2, 0, 1) : 0;
    if (wk > 0) for (const k of Object.keys(C.walk.keys)) ch[k] = lerp(ch[k] || 0, C.walk.value(k, this.phase), wk);
    const p = this.post;
    if (p.kind === 'kneel' && p.k > 0) for (const k of Object.keys(C.kneel.keys)) ch[k] = (ch[k] || 0) + C.kneel.value(k, ease(p.k));
    if (p.kind === 'crouch' && p.k > 0) for (const k of Object.keys(C.crouch.keys)) ch[k] = (ch[k] || 0) + C.crouch.value(k, ease(p.k));
    if (this.carrying > 0) ch['spine.pitch'] = (ch['spine.pitch'] || 0) + C.carry.value('spine.pitch', 0) * this.carrying;
    if (this.gest) { const g = this.gest, w = Math.min(1, g.t / .22, (g.clip.duration - g.t) / .28);
      for (const k of Object.keys(g.clip.keys)) { const v = g.clip.value(k, g.t); ch[k] = k.startsWith('head.') || k === 'point' ? (k === 'point' ? v : (ch[k] || 0) + v * w) : lerp(ch[k] || 0, v, clamp(w, 0, 1)); } this.gestW = clamp(w, 0, 1); }
    else this.gestW = 0;
  }
}
const _p0 = V();
const d_lift = m => GAIT.lift * m.d.s * clamp(m.v / 1.2 + .45, .55, 1);
const L_lean = (d, lean) => d.L1 * Math.sin(lean);   /* how far behind the pelvis the kneeling knee goes */

/* ---- the pose: pelvis, spine, legs, arms, head ---- */
const _P = [V(), V(), V(), V(), V(), V(), V(), V(), V(), V()], _Q = [Q(), Q(), Q(), Q(), Q(), Q(), Q(), Q()], _zU = V(), _foW = Q(), _cf = V(), _tp = V();
const resolvePoint = (t, out) => { if (!t) return null; if (t.isVector3) return out.copy(t); if (t.isObject3D) { t.updateWorldMatrix(true, false); return out.setFromMatrixPosition(t.matrixWorld); } if (typeof t === 'function') return t(out); if (Array.isArray(t)) return out.set(t[0], t[1], t[2]); return null; };
Crewman.prototype.pose = function (dt) {
  const d = this.d, b = this.b, ch = this.ch, fig = this.fig, p = this.post, [F, Lf, pw, H, K, A, n, S, E, W] = _P;
  fig.root.position.set(this.pos.x, 0, this.pos.z); fig.root.quaternion.copy(qy(this.yaw, _Q[0]));
  fwdOf(this.yaw, F); leftOf(this.yaw, Lf);
  /* the pelvis: over the root, swayed and bobbed by the walk; into a kneel, a crouch or a seat */
  let pyaw = ch['pelvis.yaw'] || 0, proll = ch['pelvis.roll'] || 0, ppitch = 0, py = d.pelvisY - .012 * d.s + (ch['pelvis.bob'] || 0), reach = true;
  pw.copy(this.pos).addScaledVector(Lf, ch['pelvis.sway'] || 0);
  if (p.kind === 'sit' && p.seat) { pw.copy(p.seat.pelvis); py = p.seat.pelvis.y; pyaw = 0; proll = 0; ppitch = p.seat.pitch ?? -.06; reach = false; }
  else if (p.kind === 'kneel' && p.kneel) { const kp = p.kneel, e = ease(p.k), mx = (this.feet[0].ankle.x + this.feet[1].ankle.x) / 2, mz = (this.feet[0].ankle.z + this.feet[1].ankle.z) / 2;
    pw.set(lerp(mx, kp.pelvis.x, e), 0, lerp(mz, kp.pelvis.z, e)); py = lerp(py, kp.pelvis.y, e); pyaw *= 1 - e; proll *= 1 - e; }
  else if (p.kind === 'crouch') { const e = ease(p.k); pw.addScaledVector(F, -.15 * d.s * e); py = lerp(py, .52 * d.s, e); }
  const qp = _Q[1].copy(qy(this.yaw + pyaw, _Q[2])).multiply(qx(ppitch, _Q[3])).multiply(qz(proll, _Q[4]));
  if (reach) {
    /* no higher than both legs can reach their feet as they are placed this frame — so a planted foot is never pulled */
    const lmax = (d.L1 + d.L2) * .998, off = d.pelvisY - d.hipY;
    /* (the hip joint's height below the pelvis centre includes the pelvis's roll and pitch: a 2° roll moves it 3 mm) */
    for (const f of this.feet) { H.set(f.side * d.hipX, -off, 0).applyQuaternion(qp); const dy = H.y; H.add(pw); const dxz = Math.hypot(H.x - f.ankle.x, H.z - f.ankle.z);
      py = Math.min(py, dxz < lmax ? f.ankle.y + Math.sqrt(lmax * lmax - dxz * dxz) - dy : f.ankle.y - dy); }
  }
  this.pelvisY = py;
  /* into the root's frame */
  H.copy(pw).sub(this.pos).applyAxisAngle(YA, -this.yaw); b.hips.position.set(H.x, py, H.z);
  b.hips.quaternion.copy(qy(pyaw, _Q[2])).multiply(qx(ppitch, _Q[3])).multiply(qz(proll, _Q[4]));
  /* the spine: the lean (clips) split over spine and chest, the chest turned against the pelvis; seated, upright */
  this.bend += clamp(this.bendWant - this.bend, -dt * 1.6, dt * 1.6); this.side += clamp(this.sideWant - this.side, -dt * 1.4, dt * 1.4);
  const lean = (ch['spine.pitch'] || 0) + this.bend + (p.kind === 'sit' ? -ppitch + (p.seat?.lean || 0) : 0), cyaw = (ch['chest.yaw'] || 0) + this.look.torso * .5;
  b.spine.quaternion.copy(qx(lean * .45, _Q[2])).multiply(qy(cyaw * .4, _Q[3])).multiply(qz(this.side * .45, _Q[4])); b.chest.quaternion.copy(qx(lean * .55, _Q[2])).multiply(qy(cyaw * .6, _Q[3])).multiply(qz(this.side * .55, _Q[4]));
  fig.root.updateMatrixWorld(true);
  /* the legs: hip to ankle, the knee toward the front (for a knee on the floor, forward and down) */
  const hipsW = worldQ(b.hips, _Q[5]), pf = _P[9].set(0, 0, 1).applyQuaternion(hipsW).setY(0).normalize();
  this.feet.forEach((f, i) => {
    const th = i ? b.thighR : b.thighL, sh = i ? b.shinR : b.shinL, ft = i ? b.footR : b.footL;
    worldP(th, H); const pole = _t4.copy(H).addScaledVector(pf, 1).addScaledVector(Lf, f.side * .1); if (p.kind === 'kneel' && i === 1) pole.addScaledVector(UP, -.35);
    const nn = solveTwo(H, f.ankle, d.L1, d.L2, pole, K, A);
    const thW = basisQ(_t1.copy(K).sub(H), nn, _Q[6]), shW = basisQ(_t2.copy(A).sub(K), nn, _Q[7]), ftW = _Q[3].copy(qy(f.yaw, _Q[2])).multiply(qx(f.pitch, _Q[4]));
    th.quaternion.copy(hipsW).invert().multiply(thW); sh.quaternion.copy(thW).invert().multiply(shW); ft.quaternion.copy(shW).invert().multiply(ftW);
  });
  /* the head: where it was told to look, after its own delay; with nothing to look at, a glance about now and then */
  const L = this.look; if (L.hasNext) { L.wait -= dt; if (L.wait <= 0) { L.target = L.next; L.hasNext = false; L.next = null; } }
  const chestW = worldQ(b.chest, _Q[5]); worldP(b.head, S);
  let tgt = resolvePoint(L.target, E);
  if (!tgt) { L.glanceT -= dt; if (L.glanceT <= 0 || !L.glance) { L.glanceT = 2.2 + this.rand() * 4.5; const a = this.yaw + (this.rand() - .5) * 1.6; L.glance = new T3.Vector3(this.pos.x + Math.sin(a) * 4, .6 + this.rand() * 1.2, this.pos.z + Math.cos(a) * 4); } tgt = E.copy(L.glance); }
  const dl = _t1.copy(tgt).sub(S).applyQuaternion(_Q[6].copy(chestW).invert());
  const wy = clamp(Math.atan2(dl.x, dl.z), -1.35, 1.35), wp = clamp(-Math.atan2(dl.y, Math.hypot(dl.x, dl.z)), -.6, .8), kk = 1 - Math.exp(-dt * 6.5);
  L.yaw += (wy - L.yaw) * kk; L.pitch += (wp - L.pitch) * kk; L.torso = clamp(L.yaw - 1.0, -.35, .35) * 0 + (Math.abs(L.yaw) > 1.0 ? Math.sign(L.yaw) * (Math.abs(L.yaw) - 1.0) : 0);
  const hy = L.yaw + (ch['head.yaw'] || 0), hp = L.pitch + (ch['head.pitch'] || 0);
  b.neck.quaternion.copy(qy(hy * .4, _Q[2])).multiply(qx(hp * .35, _Q[3])); b.head.quaternion.copy(qy(hy * .6, _Q[2])).multiply(qx(hp * .65, _Q[3]));
  /* the arms: the clips' angles (FK), and where a hand has somewhere to be, the two-bone solve (IK), blended by its weight */
  const cf = _cf.set(0, 0, 1).applyQuaternion(chestW), cl = _t3.set(1, 0, 0).applyQuaternion(chestW).clone(), cb = cf.clone().negate();
  const point = ch.point || 0;
  [0, 1].forEach(i => {
    const k = i ? -1 : 1, s = i ? 'R' : 'L', arm = b['arm' + s], fore = b['fore' + s], hand = b['hand' + s], clav = b['clav' + s], h = this.hands[i];
    const fkA = _Q[2].copy(qz(k * (ch['arm' + s + '.roll'] || 0), _Q[3])).multiply(qx(-(ch['arm' + s + '.pitch'] || 0), _Q[4])).multiply(qy(k * (ch['arm' + s + '.twist'] || 0), _Q[3]));
    const fkF = qx(-(ch['arm' + s + '.elbow'] || 0), Q()), fkH = qx(ch['arm' + s + '.wrist'] || 0, Q());
    arm.quaternion.copy(fkA); fore.quaternion.copy(fkF); hand.quaternion.copy(fkH);
    let want = null;
    if (h.target) { h.valid = !!h.target(h.pos, h.quat, this); if (h.valid) want = h; }
    if (!want && i === 1 && point > 0 && L.target) { /* pointing: the arm straight at what he looks at */
      arm.updateWorldMatrix(true, false); worldP(arm, S); const tp = resolvePoint(L.target, _tp); if (tp) { const dir = tp.sub(S).normalize(); h.pos.copy(S).addScaledVector(dir, (d.U1 + d.U2) * .96); basisQ(dir, cf, h.quat); want = h; h.valid = true; h.w = point; } }
    h.w += clamp((want && h.target ? 1 : 0) - h.w, -dt * h.rate, dt * h.rate); if (!h.target && !(i === 1 && point > 0)) h.valid = false;
    const w = i === 1 && point > 0 && !h.target ? point : h.w;
    if (w <= 1e-4 || !h.valid) return;
    clav.updateWorldMatrix(true, false); const clavW = worldQ(clav, _Q[6]); arm.updateWorldMatrix(false, false); worldP(arm, S);
    const pole = _t4.copy(S).addScaledVector(cb, .35).addScaledVector(UP, -.45).addScaledVector(cl, k * .3);
    solveTwo(S, h.pos, d.U1, d.U2, pole, E, W); h.err = W.distanceTo(h.pos);   /* how far short the arm fell of where the hand was asked to be */
    const front = _t1.copy(W).sub(E), ax = _t2.copy(E).sub(S).normalize(); front.addScaledVector(ax, -front.dot(ax)); if (front.lengthSq() < 1e-8) front.copy(cf);
    const upW = basisQ(_t2.copy(E).sub(S), front, _Q[7]), zU = _zU.set(0, 0, 1).applyQuaternion(upW), foW = basisQ(_t2.copy(W).sub(E), zU, _foW);
    const hW = h.quat;
    arm.quaternion.slerp(_Q[3].copy(clavW).invert().multiply(upW), w); fore.quaternion.slerp(_Q[4].copy(upW).invert().multiply(foW), w); hand.quaternion.slerp(_Q[3].copy(foW).invert().multiply(hW), w);
  });
  fig.root.updateMatrixWorld(true);
};

/* ------------------------------------------------------------------------------------------------ PROPS
   Everything the crew handles is one merged mesh on the crew atlas (flat swatches, and the labels where a word is printed),
   so each costs one draw. Lengths are metres. */
function propMesh(parts, name, {cast = true} = {}) {
  const at = crewAtlas(), geos = parts.map(([g, uv]) => { const p = prepare(g, typeof uv === 'string' ? at.swatch(uv) : uv); p.deleteAttribute('skinIndex'); return p; });
  const m = new T3.Mesh(mergeGeometries(geos, false), at.material); geos.forEach(g => g.dispose()); m.name = name; m.castShadow = cast; m.receiveShadow = true; return m;
}
const along = (g, axis = 'z') => axis === 'z' ? g.rotateX(Math.PI / 2) : g.rotateZ(Math.PI / 2);   /* a cylinder's axis turned onto z or x */
const bx = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => moved(new T3.BoxGeometry(w, h, d), x, y, z, rx, ry, rz);
const cz = (r0, r1, len, seg, x, y, z) => along(new T3.CylinderGeometry(r0, r1, len, seg)).translate(x, y, z);
const cx = (r0, r1, len, seg, x, y, z) => along(new T3.CylinderGeometry(r0, r1, len, seg), 'x').translate(x, y, z);

/* THE IMPACT GUN: the socket's face at the origin, the tool behind it along −z, the pistol grip under its rear. GUN.grip is
   where the palm closes on the grip, GUN.hold the hand's frame relative to the gun (tuned by eye on the rig). */
export const GUN = Object.freeze({grip: [0, -.078, -.215], socket: .05});
export function buildGun() {
  const P = [];
  P.push([cz(.025, .025, .05, 6, 0, 0, -.025), 'steel'], [cz(.016, .016, .03, 12, 0, 0, -.062), 'steel'], [cz(.031, .036, .05, 16, 0, 0, -.1), 'black'],
    [cz(.038, .038, .15, 18, 0, 0, -.2), 'orange'], [cz(.034, .029, .026, 16, 0, 0, -.288), 'black'], [bx(.03, .012, .05, 0, .04, -.2), 'black'],
    [bx(.034, .115, .048, 0, -.078, -.215, -.2), 'black'], [bx(.012, .03, .014, 0, -.035, -.165), 'orange'], [along(new T3.CylinderGeometry(.009, .009, .03, 10)).rotateX(Math.PI / 2).translate(0, -.145, -.23), 'alu']);
  const hose = new T3.CatmullRomCurve3([new T3.Vector3(0, -.16, -.232), new T3.Vector3(0, -.26, -.25), new T3.Vector3(.02, -.34, -.32), new T3.Vector3(.05, -.38, -.42)]);
  P.push([new T3.TubeGeometry(hose, 12, .011, 8, false), 'rubber']);
  return propMesh(P, 'Impact gun');
}
/* THE WHEEL RACK the pit technician brings: a low steel cradle on four castors, two rollers the tyre sits between. A wheel
   rests in it upright, its axle along the rollers, its centre RACK.hold above the floor. Carried by its two side rails. */
export const RACK = Object.freeze({hold: .40, rollerX: .15, rollerY: .07, rollerR: .03, grips: [[.235, .40, 0], [-.235, .40, 0]]});
export function buildRack() {
  const P = [];
  for (const k of [-1, 1]) {
    P.push([cz(RACK.rollerR, RACK.rollerR, .44, 16, k * RACK.rollerX, RACK.rollerY, 0), 'steel'], [bx(.04, .035, .56, k * .235, .045, 0), 'orange'],
      [bx(.47, .04, .04, 0, .05, k * .25), 'orange'], [bx(.04, .06, .04, k * RACK.rollerX, .06, k * .235), 'orange']);
    for (const s of [-1, 1]) P.push([cx(.028, .028, .025, 12, k * .235, .028, s * .26), 'rubber'], [bx(.03, .02, .03, k * .235, .06, s * .26), 'steel']);
    /* a carrying handle on each side rail: two posts and a grip bar at hand height when it is carried */
    for (const s of [-1, 1]) P.push([bx(.025, .36, .025, k * .235, .24, s * .11), 'orange']);
    P.push([cz(.016, .016, .26, 10, k * .235, .40, 0), 'black']);
  }
  return propMesh(P, 'Wheel rack');
}
/* THE TABLET the crew lead carries; its face is the station's second screen canvas */
export function buildTablet(screenMat) {
  const g = new T3.BoxGeometry(.25, .012, .175); const m = new T3.Mesh(g, screenMat); m.name = 'Crew lead tablet';
  /* the face (+y) carries the canvas's tablet region; the edges and the back a dark corner of it */
  const uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) { if (n.getY(i) > .5) uv.setXY(i, .02 + uv.getX(i) * .46, .02 + uv.getY(i) * .30); else uv.setXY(i, .99, .99); }
  m.castShadow = true; return m;
}

/* THE TELEMETRY STATION: a desk beside the dyno console, two screens facing the car, keyboard and mouse, an operator's chair.
   Built in its own frame: the operator sits at +z facing −z; the screens at −z face +z. */
export const STATION = Object.freeze({deskY: .74, seatY: .50, w: 1.5, d: .72});
export function buildStation(screenMat) {
  const P = [], S = STATION;
  P.push([bx(S.w, .04, S.d, 0, S.deskY - .02, 0), 'darkGrey'], [bx(S.w - .04, .012, .06, 0, S.deskY - .045, S.d / 2 - .04), 'orange']);
  for (const x of [-1, 1]) for (const z of [-1, 1]) P.push([bx(.045, S.deskY - .04, .045, x * (S.w / 2 - .06), (S.deskY - .04) / 2, z * (S.d / 2 - .06)), 'steel']);
  P.push([bx(S.w - .1, .3, .02, 0, S.deskY - .25, -S.d / 2 + .05), 'darkGrey']);
  for (const k of [-1, 1]) { const x = k * .31, z = -.2;
    P.push([bx(.58, .36, .035, x, 1.1, z - .01, 0, -k * .14, 0), 'black'], [bx(.045, .25, .03, x, .87, z - .04), 'steel'], [bx(.24, .014, .17, x, S.deskY + .007, z - .02), 'black']); }
  P.push([bx(.46, .022, .16, -.02, S.deskY + .011, .17), 'black'], [bx(.42, .006, .12, -.02, S.deskY + .024, .17), 'darkGrey'], [moved(new T3.SphereGeometry(.03, 10, 8), .32, S.deskY + .015, .17, 0, 0, 0, 1, .5, 1.5), 'black']);
  /* the chair: seat, back, column, five-star base on castors */
  const cz0 = .62;
  P.push([bx(.48, .07, .46, 0, S.seatY - .035, cz0), 'black'], [bx(.46, .52, .06, 0, S.seatY + .33, cz0 + .25, -.12), 'black'], [bx(.2, .1, .04, 0, S.seatY + .52, cz0 + .27, -.12), 'orange'],
    [new T3.CylinderGeometry(.028, .028, S.seatY - .12, 12).translate(0, (S.seatY - .12) / 2 + .06, cz0), 'steel']);
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5; P.push([bx(.035, .03, .3, Math.sin(a) * .15, .07, cz0 + Math.cos(a) * .15, 0, a, 0), 'darkGrey'], [moved(new T3.SphereGeometry(.028, 8, 6), Math.sin(a) * .3, .028, cz0 + Math.cos(a) * .3), 'rubber']); }
  /* the job on the desk's front edge, facing the car */
  { const g = new T3.PlaneGeometry(.52, .1).translate(0, S.deskY - .12, -S.d / 2 + .038); g.rotateY(Math.PI); const map = crewAtlas().label(3), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const [a, b] = map(uv.getX(i), uv.getY(i)); uv.setXY(i, a, b); } P.push([g, null]); }
  const desk = propMesh(P, 'Telemetry station');
  /* the two screens: one plane each on the canvas's two screen regions, drawn by the director */
  const scr = [];
  for (const k of [-1, 1]) { const g = new T3.PlaneGeometry(.54, .31), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (k < 0 ? 0 : .5) + uv.getX(i) * .5, .375 + uv.getY(i) * .625);
    g.rotateY(-k * .14).translate(k * .31 - Math.sin(-k * .14) * .02, 1.1, -.2 + .01); scr.push(g); }
  const screens = new T3.Mesh(mergeGeometries(scr, false), screenMat); screens.name = 'Telemetry screens';
  return {desk, screens};
}

/* ------------------------------------------------------------------------------------------------ THE FORKLIFT
   A Coates counterbalance forklift, drawn here: orange body, black counterweight with the wordmark, black mast and overhead
   guard, a seat and a wheel for its driver, two drive wheels at the front and two steered at the back. Its frame: the front
   axle's centre on the floor, +z forward. The mast tilts about its foot; the carriage and forks slide up it. */
export const FORK = Object.freeze({wheelbase: 1.35, frontR: .30, rearR: .22, frontX: .46, rearX: .42, forkLen: 1.0, forkZ: .34, carriageZ: .31, mastZ: .24, pivotY: .34, lowH: .035, carryH: .15, tilt: .055, rearZ: -1.95});
export function buildForklift() {
  const F = FORK, root = new T3.Group(); root.name = 'Coates forklift';
  const P = [];
  /* body: the chassis box, the cowl, mudguards, the step, the floor plate, the counterweight (black, the wordmark on its back) */
  P.push([bx(1.02, .5, 1.5, 0, .45, -.78), 'orange'], [bx(1.04, .08, 1.52, 0, .72, -.78), 'black'], [bx(.9, .32, .24, 0, .95, -.06), 'orange'], [bx(.92, .05, .26, 0, 1.12, -.07), 'black'],
    [bx(.7, .03, .55, 0, .56, -.42), 'black']);
  for (const k of [-1, 1]) { const g = new T3.CylinderGeometry(.35, .35, .26, 20, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); P.push([g.translate(k * F.frontX, .31, 0), 'orange'], [bx(.18, .04, .3, k * .6, .28, -.42), 'black']); }
  P.push([bx(1.08, .78, .52, 0, .56, -1.7), 'black'], [bx(1.1, .06, .54, 0, .98, -1.7), 'orange']);
  { const g = new T3.PlaneGeometry(.7, .2).translate(0, .6, -1.965); g.rotateY(0); g.rotateY(Math.PI); const map = crewAtlas().label(6), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const [a, b] = map(uv.getX(i), uv.getY(i)); uv.setXY(i, a, b); } P.push([g, null]); }
  for (const k of [-1, 1]) { const g = new T3.PlaneGeometry(.5, .14); g.rotateY(k * Math.PI / 2); g.translate(k * .516, .52, -.95); const map = crewAtlas().label(6), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const [a, b] = map(uv.getX(i), uv.getY(i)); uv.setXY(i, a, b); } P.push([g, null]); }
  /* the seat, the steering column and wheel, the levers */
  P.push([bx(.46, .1, .44, 0, .97, -.78), 'black'], [bx(.46, .5, .1, 0, 1.26, -1.0, -.18), 'black'], [bx(.12, .2, .06, 0, 1.41, -1.02, -.18), 'orange'],
    [moved(new T3.CylinderGeometry(.035, .045, .55, 10), 0, 1.02, -.22, -.6), 'black'], [moved(new T3.TorusGeometry(.15, .016, 8, 28), 0, 1.262, -.39, Math.PI / 2 - .6), 'black'], [moved(new T3.CylinderGeometry(.04, .04, .05, 12), 0, 1.25, -.38, -.6), 'orange']);
  for (let i = 0; i < 3; i++) P.push([moved(new T3.CylinderGeometry(.008, .008, .2, 6), .22 + i * .045, 1.2, -.12, -.3), 'black'], [moved(new T3.SphereGeometry(.018, 8, 6), .22 + i * .045, 1.3, -.09), 'red']);
  /* the overhead guard: four posts, the roof frame and its slats, work lights and a beacon */
  for (const k of [-1, 1]) { P.push([bx(.06, 1.62, .06, k * .5, 1.53, .02, -.05), 'black'], [bx(.06, 1.46, .06, k * .5, 1.42, -1.3), 'black'], [bx(.06, .06, 1.4, k * .5, 2.13, -.62), 'black'],
    [bx(.1, .08, .06, k * .5, 1.9, .07), 'darkGrey'], [bx(.08, .06, .01, k * .5, 1.9, .105), 'white']); }
  for (let i = 0; i < 5; i++) P.push([bx(1.0, .04, .05, 0, 2.14, .0 - i * .31), 'black']);
  P.push([new T3.CylinderGeometry(.07, .08, .1, 14).translate(0, 2.21, -1.2), 'orange']);
  const body = propMesh(P, 'Forklift body'); root.add(body);
  /* the mast: two channels, cross-ties, the lift cylinder; it tilts about its foot */
  const mast = new T3.Group(); mast.name = 'Forklift mast'; mast.position.set(0, F.pivotY, F.mastZ); root.add(mast);
  const M = [];
  for (const k of [-1, 1]) M.push([bx(.07, 2.1, .1, k * .36, 2.1 / 2 - .22, 0), 'black'], [bx(.05, 2.0, .06, k * .30, 1.0 - .2, .04), 'darkGrey']);
  M.push([bx(.8, .07, .08, 0, 1.82, 0), 'black'], [bx(.8, .06, .08, 0, -.18, 0), 'black'], [new T3.CylinderGeometry(.04, .04, 1.6, 12).translate(0, .6, -.04), 'steel']);
  mast.add(propMesh(M, 'Forklift mast channels'));
  /* the carriage and forks: the plate, the load backrest, two tines; they slide up the mast */
  const car = new T3.Group(); car.name = 'Forklift carriage'; mast.add(car);
  const C = [];
  C.push([bx(.9, .42, .05, 0, .21, F.carriageZ - F.mastZ), 'orange'], [bx(.9, .04, .04, 0, .9, F.carriageZ - F.mastZ), 'black']);
  for (let i = 0; i < 6; i++) C.push([bx(.035, .5, .03, -.4 + i * .16, .65, F.carriageZ - F.mastZ), 'black']);
  for (const k of [-1, 1]) C.push([bx(.1, .45, .045, k * .25, .22, F.forkZ - F.mastZ), 'darkGrey'], [bx(.1, .045, F.forkLen, k * .25, .0225, F.forkZ - F.mastZ + F.forkLen / 2), 'darkGrey'], [bx(.1, .02, .12, k * .25, .005, F.forkZ - F.mastZ + F.forkLen - .06, -.12), 'darkGrey']);
  car.add(propMesh(C, 'Forklift carriage and forks'));
  /* four wheels, one draw: a tyre with its hub, scaled down for the steered pair */
  const tyre = new T3.TorusGeometry(.21, .09, 12, 28), hub = new T3.CylinderGeometry(.16, .16, .2, 20).rotateX(Math.PI / 2), cap = new T3.CylinderGeometry(.06, .06, .22, 10).rotateX(Math.PI / 2);
  const at = crewAtlas(), wg = mergeGeometries([prepare(tyre, at.swatch('rubber')), prepare(hub, at.swatch('orange')), prepare(cap, at.swatch('steel'))], false); wg.rotateY(Math.PI / 2);
  const wheels = new T3.InstancedMesh(wg, at.material, 4); wheels.name = 'Forklift wheels'; wheels.castShadow = true; root.add(wheels);
  /* the load: a tyre cage on a pallet — timber pallet with its fork pockets, a steel mesh cage, six slicks in two stacks, the plate */
  const L = [];
  for (const x of [-.46, 0, .46]) L.push([bx(.1, .1, 1.1, x, .05, 0), 'timber']);
  for (let i = 0; i < 7; i++) L.push([bx(1.1, .022, .12, 0, .111, -.5 + i * (1 / 6)), 'timber']);
  const post = (x, z) => L.push([bx(.035, .9, .035, x, .57, z), 'steel']);
  for (const x of [-.53, .53]) for (const z of [-.53, .53]) post(x, z);
  for (const y of [.14, .57, 1.0]) for (const [w, d, x, z] of [[1.08, .025, 0, -.53], [1.08, .025, 0, .53], [.025, 1.08, -.53, 0], [.025, 1.08, .53, 0]]) L.push([bx(w, .025, d, x, y, z), 'steel']);
  for (let i = 1; i < 7; i++) { const t = -.53 + i * 1.06 / 7; for (const [x, z] of [[t, -.53], [t, .53], [-.53, t], [.53, t]]) L.push([bx(.012, .86, .012, x, .57, z), 'steel']); }
  for (const x of [-.26, .26]) for (let k = 0; k < 3; k++) L.push([moved(new T3.TorusGeometry(.2, .085, 10, 24), x, .21 + k * .17, 0, Math.PI / 2), 'rubber'], [moved(new T3.CylinderGeometry(.13, .13, .15, 16), x, .21 + k * .17, 0), 'alu']);
  { const g = new T3.PlaneGeometry(.5, .1).translate(0, .75, .545); const map = crewAtlas().label(7), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const [a, b] = map(uv.getX(i), uv.getY(i)); uv.setXY(i, a, b); } L.push([g, null]); }
  const load = propMesh(L, 'Tyre cage');
  return {root, body, mast, carriage: car, wheels, load};
}

/* ---- the forklift's run ----
   Its program is a list of legs: a leg is a drive (forward or in reverse) along lines and arcs of the floor, or a job for
   the mast (the forks down to pocket height, up to the carrying height with the mast tilted back, down again and level),
   or a wait. On a drive the front axle's centre follows the path at a trapezoid of speed; the heading is the path's
   tangent (or its reverse); the steered rear wheels take the angle a rear-steer truck needs for that curvature (tan δ =
   −wheelbase × turn rate / speed); each wheel turns by its own ground travel over its own radius. The two bays and the
   aisle are painted on the floor (floorMarks). */
export const AISLE = Object.freeze({z: -8.6, inner: -7.5, outer: -10.05, west: -14.8, east: 8.9, R: 1.4, bays: [[-12.5, -11.4], [7.5, -11.4]], parks: [[-14.8, -8.6, Math.PI / 2], [8.9, -8.6, -Math.PI / 2]]});
function arcPts(p, yaw, turn, R, out) {   /* from p [x,z] with motion heading yaw, turning `turn` radians (+ left) on radius R */
  const L = [Math.cos(yaw), -Math.sin(yaw)], sgn = Math.sign(turn), c = [p[0] + L[0] * R * sgn, p[1] + L[1] * R * sgn], n = Math.max(6, Math.ceil(Math.abs(turn) * R / .05));
  const vx = p[0] - c[0], vz = p[1] - c[1];
  for (let i = 1; i <= n; i++) { const t = turn * i / n, cs = Math.cos(t), sn = Math.sin(t); out.push([c[0] + vx * cs + vz * sn, c[1] - vx * sn + vz * cs]); }
  return {end: out[out.length - 1], yaw: yaw + turn};
}
function linePts(p, q, out) { const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / .25)); for (let i = 1; i <= n; i++) out.push([lerp(p[0], q[0], i / n), lerp(p[1], q[1], i / n)]); return q; }
/* the two runs: west bay to east bay (from the west park) and back again; the cage stays where it is put between them */
function forkProgram(fromWest) {
  const A = AISLE, R = A.R, zA = A.z, legs = [], W = A.bays[0], E = A.bays[1], stopZ = W[1] + FORK.forkZ + FORK.forkLen / 2 + .01, turnZ = zA - R;
  const drive = (dir, build) => { const pts = []; const start = build(pts); legs.push({kind: 'drive', dir, pts: [start, ...pts]}); };
  const bay = fromWest ? W : E, other = fromWest ? E : W, sign = fromWest ? 1 : -1;
  /* out of the park to the bay's approach, turning in to face the far wall, and straight in: the align */
  drive(1, pts => { const s = fromWest ? A.parks[0] : A.parks[1], p0 = [s[0], s[1]]; const x0 = bay[0] - sign * R; linePts(p0, [x0, zA], pts); arcPts([x0, zA], sign * Math.PI / 2, sign * Math.PI / 2, R, pts); linePts([bay[0], turnZ], [bay[0], stopZ], pts); return p0; });
  legs.push({kind: 'mast', h: FORK.carryH, tilt: FORK.tilt, dur: 1.6, pick: true});
  /* back out, turning to face along the aisle toward the other bay */
  drive(-1, pts => { const p0 = [bay[0], stopZ]; linePts(p0, [bay[0], turnZ], pts); arcPts([bay[0], turnZ], 0, -sign * Math.PI / 2, R, pts); return p0; });
  /* along the aisle, forks low, and in to the other bay */
  drive(1, pts => { const p0 = [bay[0] - sign * R, zA], x1 = other[0] - sign * R; linePts(p0, [x1, zA], pts); arcPts([x1, zA], sign * Math.PI / 2, sign * Math.PI / 2, R, pts); linePts([other[0], turnZ], [other[0], stopZ], pts); return p0; });
  legs.push({kind: 'mast', h: FORK.lowH, tilt: 0, dur: 1.6, drop: true});
  /* back out of the bay, round onto the aisle facing home, and into the park at that end */
  drive(-1, pts => { const p0 = [other[0], stopZ]; linePts(p0, [other[0], turnZ], pts); arcPts([other[0], turnZ], 0, sign * Math.PI / 2, R, pts); const pk = fromWest ? A.parks[1] : A.parks[0]; if (Math.abs(pts[pts.length - 1][0] - pk[0]) > .02) linePts(pts[pts.length - 1], [pk[0], pk[1]], pts); return p0; });
  legs.push({kind: 'wait', dur: 9});
  for (const l of legs) if (l.kind === 'drive') l.path = new Path(l.pts, 0);
  return legs;
}
export class Forklift {
  constructor(parts, driver) {
    this.p = parts; this.driver = driver; this.x = AISLE.parks[0][0]; this.z = AISLE.parks[0][1]; this.yaw = AISLE.parks[0][2]; this.h = FORK.lowH; this.tilt = 0; this.steer = 0; this.steers = [0, 0]; this.v = 0;
    this.spin = [0, 0, 0, 0]; this.fromWest = true; this.legs = forkProgram(true); this.leg = 0; this.s = 0; this.t = 0; this.paused = false; this.held = false;
    this.load = {x: AISLE.bays[0][0], z: AISLE.bays[0][1], yaw: 0, y: 0}; this.travelled = [0, 0, 0, 0]; this.wheelPos = [V(), V(), V(), V()]; this.first = true; this.wait = 4;
    this.pose(0);
  }
  reset() { this.x = AISLE.parks[0][0]; this.z = AISLE.parks[0][1]; this.yaw = AISLE.parks[0][2]; this.h = FORK.lowH; this.tilt = 0; this.steer = 0; this.steers = [0, 0]; this.v = 0; this.fromWest = true; this.legs = forkProgram(true); this.leg = 0; this.s = 0; this.t = 0; this.held = false; this.load = {x: AISLE.bays[0][0], z: AISLE.bays[0][1], yaw: 0, y: 0}; this.wait = 4; this.first = true; this.pose(0); }
  get state() { const l = this.legs[this.leg]; return this.wait > 0 ? 'parked' : l.kind === 'drive' ? (l.dir > 0 ? 'driving' : 'reversing') : l.kind; }
  update(dt, paused = false) {
    this.paused = paused;
    if (this.wait > 0) { this.wait -= dt; this.v = 0; this.pose(dt); return; }
    const l = this.legs[this.leg];
    if (l.kind === 'drive') {
      const L = l.path.length, rem = L - this.s, vmax = l.dir > 0 ? 1.6 : .75, acc = .8, dec = paused ? 1.6 : .8;
      let vT = paused ? 0 : Math.min(vmax, Math.sqrt(2 * acc * Math.max(0, rem - .005)));
      this.v += clamp(vT - this.v, -dec * dt, acc * dt); if (this.v < 0) this.v = 0;
      this.s = Math.min(L, this.s + this.v * dt);
      const p = l.path.at(this.s, _t1), my = l.path.yawAt(this.s);
      this.x = p.x; this.z = p.z; this.yaw = l.dir > 0 ? my : my + Math.PI;
      /* the steered wheels: from the path's own curvature where the truck is (κ = dψ/ds over the next 10 cm), tan δ = −L κ for
         the direction of travel; turned quickly (8 rad/s) where a straight meets an arc */
      const k = wrap(l.path.yawAt(Math.min(L, this.s + .05)) - l.path.yawAt(Math.max(0, this.s - .05))) / Math.max(1e-6, Math.min(L, this.s + .05) - Math.max(0, this.s - .05));
      /* each steered wheel its own angle (Ackermann): a wheel `o` to the left of the axle's centre needs tan δ = −L κ d / (1 − o κ d),
         d the direction of travel — one angle for both would scrub the inner and outer tyres sideways round every turn */
      [FORK.rearX, -FORK.rearX].forEach((o, i) => { const want = -Math.atan2(FORK.wheelbase * k * l.dir, 1 - o * k * l.dir); this.steers[i] += clamp(clamp(want, -1.2, 1.2) - this.steers[i], -8 * dt, 8 * dt); });
      this.steer = (this.steers[0] + this.steers[1]) / 2;
      if (rem < .004 && !paused) { this.s = 0; this.v = 0; this.next(); }
    } else if (l.kind === 'mast') {
      this.t += dt; const u = ease(this.t / l.dur);
      if (this.t <= dt) { l.h0 = this.h; l.t0 = this.tilt; }
      /* the forks go up before the mast tilts back; the mast comes level before the forks go down */
      this.h = lerp(l.h0, l.h, l.pick ? ease(this.t / (l.dur * .7)) : ease((this.t - l.dur * .35) / (l.dur * .65)));
      this.tilt = lerp(l.t0, l.tilt, l.pick ? ease((this.t - l.dur * .5) / (l.dur * .5)) : ease(this.t / (l.dur * .4)));
      if (l.pick && this.h > .05) this.held = true;
      if (u >= 1) { if (l.drop) this.held = false; this.t = 0; this.next(); }
    } else if (l.kind === 'wait') { this.t += dt; if (this.t >= l.dur) { this.t = 0; this.next(); } }
    this.pose(dt);
  }
  next() { this.leg++; if (this.leg >= this.legs.length) { this.fromWest = !this.fromWest; this.legs = forkProgram(this.fromWest); this.leg = 0; } }
  /* the truck, its mast and carriage, the wheels (each turned by its own ground travel), the load and its driver */
  pose(dt) {
    const P = this.p, F = FORK, r = P.root; r.position.set(this.x, 0, this.z); r.rotation.set(0, this.yaw, 0); r.updateMatrixWorld(true);
    P.mast.rotation.x = -this.tilt; P.carriage.position.y = this.h;
    const WP = [[F.frontX, F.frontR, 0, F.frontR, 0], [-F.frontX, F.frontR, 0, F.frontR, 0], [F.rearX, F.rearR, -F.wheelbase, F.rearR, 1], [-F.rearX, F.rearR, -F.wheelbase, F.rearR, 1]];
    const m = _m4, q = _Q[0], sc = _t3;
    WP.forEach(([x, y, z, rad, steered], i) => {
      const st = steered ? this.steers[i - 2] : 0, at = _t1.set(x, 0, z).applyMatrix4(r.matrixWorld), yawW = this.yaw + st, dir = fwdOf(yawW, _t2);
      if (!this.first) { const dd = at.clone().sub(this.wheelPos[i]), roll = dd.dot(dir); this.spin[i] += roll / rad; this.travelled[i] += Math.abs(roll); }
      this.wheelPos[i].copy(at);
      q.copy(qy(st, _Q[1])).multiply(qx(this.spin[i], _Q[2])); sc.setScalar(rad / F.frontR); m.compose(_t4.set(x, y, z), q, sc); P.wheels.setMatrixAt(i, m);
    });
    this.first = false; P.wheels.instanceMatrix.needsUpdate = true;
    /* the load rides the forks while it is held (from the moment the tines lift it), and sits on the floor where it was put */
    if (this.held) { P.carriage.updateWorldMatrix(true, false); const c = _t1.set(0, 0, F.forkZ - F.mastZ + F.forkLen / 2).applyMatrix4(P.carriage.matrixWorld);
      this.load.x = c.x; this.load.z = c.z; this.load.y = Math.max(0, c.y - .05); this.load.yaw = this.yaw; this.load.tilt = this.tilt; }
    else this.load.tilt = 0;
    P.load.position.set(this.load.x, this.load.y, this.load.z); P.load.rotation.set(-(this.load.tilt || 0), this.load.yaw, 0, 'YXZ');
  }
  /* the truck's footprint on the floor (with its load and forks), for the test that it never comes near the car */
  footprint() {
    const out = [], r = this.p.root; r.updateMatrixWorld(true);
    for (const [x, z] of [[-.55, .1], [.55, .1], [-.55, FORK.rearZ], [.55, FORK.rearZ], [-.35, FORK.forkZ + FORK.forkLen], [.35, FORK.forkZ + FORK.forkLen]]) out.push(_t1.set(x, 0, z).applyMatrix4(r.matrixWorld).clone());
    for (const [x, z] of [[-.55, -.55], [.55, -.55], [-.55, .55], [.55, .55]]) out.push(_t1.set(x, 0, z).applyAxisAngle(YA, this.load.yaw).add(_t2.set(this.load.x, 0, this.load.z)).clone());
    return out;
  }
}

/* ------------------------------------------------------------------------------------------------ THE CREW'S PLACES
   World metres, from the hall's own numbers (pit-garage.js): the dyno's rear axle, the gun stand at the head of the cell,
   the dyno console. A place for the service's wheel is worked out for its side (o = +1 the near side, −1 the far). */
const XW = DYNO.axleX;
export const SPOTS = Object.freeze({
  mechanicPost: [-6.5, -3.1], techPost: [4.95, 2.45], leadPost: [-3.75, -3.05], nose: [-3.3, -1.95],   /* v5.82: clear of the footprint beside the nose (OBSTACLES: z −1.65 … −.45), where he stood inside it by 20 cm */ engineDesk: [-1.35, -3.62],
  desk: [-2.4, -4.3], rackStore: [5.6, 3.1],
});
export function sideSpots(o) {
  /* the mechanic kneels at the wheel's corner, beside the line it slides out on (ahead of the near wheel, behind the far one: his
     right hand is then toward the nut and his raised knee is clear of the tyre) */
  return {o, kneel: [XW - o * .46, o * 1.45], kneelYaw: o > 0 ? Math.PI : 0, rack: [XW + 1.75, o * 2.35], rackYaw: Math.PI / 2, approach: [XW + 1.75 - .47, o * 2.35], receive: [XW + 1.75 + .56, o * 2.35],
    sill: [-.1, o * 1.40], supervise: [XW + 2.75, o * 3.35], rackPlace: [XW + 1.75 - .36, o * 2.35]};
}
/* the loop of aisle points round the cell, and what stands on the floor (boxes x0, z0, x1, z1) */
export const NODES = Object.freeze([[-4.8, 2.6], [-4.8, 0], [-4.8, -2.6], [-1.0, 2.85], [1.8, 2.95], [4.4, 2.6], [4.4, 0], [4.4, -2.6], [1.8, -2.95], [-1.0, -2.85], [-6.6, -2.6], [-6.6, 2.4]]);
export const OBSTACLES = Object.freeze([[-2.62, -1.12, 2.62, 1.12], [.35, -1.42, 2.1, 1.42], [-4.25, .45, -2.4, 1.65], [-4.25, -1.65, -2.4, -.45], [2.3, .5, 3.75, 1.65], [2.3, -1.65, 3.75, -.5],
  [-6.45, -1.0, -5.35, 1.0], [-.98, -4.05, .98, -3.35], [-3.18, -4.7, -1.62, -3.9], [-2.7, -3.95, -2.1, -3.3], [-7.7, -4.25, -7.1, -3.75]]);

/* the floor under a foot: the dyno pit's grating (pit-garage.js: 30 mm down, round the rollers and along the middle) and the
   hall's floor everywhere else; the rollers' openings are never stood in */
export function floorAt(x, z) {
  const p = DYNO.pit; if (x < p.x0 + .05 || x > p.x1 - .05 || z < p.z0 || z > p.z1) return 0;
  const az = Math.abs(z); return az < .275 || (az > p.z1 - .32 && az < p.z1 - .04) ? -.03 : 0;
}

/* ------------------------------------------------------------------------------------------------ WHO THEY ARE
   Six people, each their own height and build, their job across the back, the lead's white helmet, the operator's boom
   microphone (on a helmet: the light-hearted part). Each has a card, as every exhibit in the hall does: what the job is,
   and the line of Coates's own wording it stands for (a teaching association; tests/crew.test.mjs holds the words to the
   hall's vocabulary). */
export const ROLES = Object.freeze([
  {id: 'operator', title: 'telemetry operator', label: 3, height: 1.76, build: .98, helmet: 'crew', headset: true, seed: 11, walk: 1.1},
  {id: 'mechanic', title: 'wheel mechanic', label: 0, height: 1.80, build: 1.04, helmet: 'crew', seed: 23, walk: 1.25},
  {id: 'tech', title: 'pit technician', label: 1, height: 1.74, build: 1.0, helmet: 'crew', seed: 37, walk: 1.2},
  {id: 'engine', title: 'engine technician', label: 2, height: 1.83, build: 1.02, helmet: 'crew', seed: 41, walk: 1.1},
  {id: 'lead', title: 'crew lead', label: 4, height: 1.86, build: 1.03, helmet: 'lead', seed: 53, walk: 1.15},
  {id: 'driver', title: 'forklift operator', label: 5, height: 1.78, build: 1.06, helmet: 'crew', seed: 67, walk: 1.1},
]);
/* The Coates words on the crew's cards are the garage's own (pit-garage.js: its exhibits, and the Life Saving Rules as Andrew sent
   them) — taken from there, never typed again here; only the sentence saying what each person does is this file's. */
const garageWords = id => { const e = GARAGE_EXHIBITS.find(x => x.id === id); return {word: e.word, link: e.link}; };
const lifeSavingRule = name => { const r = LIFE_SAVING_RULES.find(x => x[0] === name)[2]; return {word: name, link: 'Life Saving Rule: ' + (/^I /.test(r) ? r : r[0].toLowerCase() + r.slice(1))}; };
export const CREW_EXHIBITS = Object.freeze({
  operator: {id: 'crewoperator', name: 'The telemetry operator', what: 'Seated at the two screens beside the dyno — helmet on, on purpose — reading the machine\'s own state and the wheel service\'s checklist, and acknowledging SERVICE COMPLETE when the crew have finished.', word: garageWords('desk').word, link: garageWords('desk').link + ' The screens show only what the machine itself reports.'},
  mechanic: {id: 'crewwheels', name: 'The wheel mechanic', what: 'Starts only once the car is on its stands: takes the gun from the stand at the head of the cell, kneels at the wheel, runs the nut off and the wheel out along its axle, carries it to the rack, brings it back, runs the nut on and torques it, and puts the gun back.', ...lifeSavingRule('Tools and Equipment')},
  tech: {id: 'crewpit', name: 'The pit technician', what: 'Sets the two jack stands under the sill before a wheel comes off, brings the wheel rack and takes the wheel on it, and takes the stands and the rack away when the car is ready.', ...lifeSavingRule('Critical Risk Non-Negotiables')},
  engine: {id: 'crewengine', name: 'The engine technician', what: 'At the nose while the V8 runs, watching the engine; with the operator at the screens when it stops.', ...garageWords('generator')},
  lead: {id: 'crewlead', name: 'The crew lead', what: 'Holds the crew when the drive is isolated, points out the hub, the disc and the caliper at inspection, and gives the all-clear: the drive unlocks only when the lead does, and only once the crew are clear of the car.', ...garageWords('extinguishers')},
  driver: {id: 'crewforklift', name: 'The Coates forklift', what: 'A tyre cage shuttled between the two marked bays along the far aisle, forks low, stopping to align at each bay, and held still while a wheel comes off at the car.', ...lifeSavingRule('High-Risk Work')},
});

/* ------------------------------------------------------------------------------------------------ THE SCREENS
   One canvas for the operator's two screens and the lead's tablet. Screen one is the wheel service as a checklist, ticked
   from the service's own phase and holds; screen two is the cell from above with every person and the forklift where they
   are, and the V8's own state; the tablet is the lead's short version. No figure appears that the machine did not make. */
const CHECK = ['Run ended · wheels stopped', 'Drive isolated', 'Car on its stands', 'Nut off · wheel to the rack', 'Hub, disc and caliper inspected', 'Wheel refitted · nut torqued', "Crew clear · lead's all-clear"];
function drawScreens(c, st) {
  const g = c.getContext('2d'), F = 'Arial, Helvetica, sans-serif';
  g.fillStyle = '#05080b'; g.fillRect(0, 0, c.width, c.height);
  const panel = (x, y, w, h) => { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#0b1116'); gr.addColorStop(1, '#101a21'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.fillStyle = ORANGE; g.fillRect(x, y, w, 6); };
  /* screen one: the checklist */
  panel(8, 8, 496, 304); g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#f4f6f7'; g.font = `800 22px ${F}`; g.fillText('COATES · TELEMETRY', 22, 32);
  g.textAlign = 'right'; g.fillStyle = '#9fb0ba'; g.font = `600 15px ${F}`; g.fillText(st.wheelName ? 'WHEEL SERVICE · ' + st.wheelName : 'WHEEL SERVICE', 490, 32); g.textAlign = 'left';
  CHECK.forEach((t, i) => { const y = 64 + i * 28, done = i < st.done, on = i === st.done && st.active;
    g.fillStyle = on ? 'rgba(255,106,19,.18)' : 'rgba(255,255,255,.03)'; g.fillRect(18, y - 12, 476, 24);
    g.fillStyle = done ? '#8aca40' : on ? ORANGE : '#3c4952'; g.fillRect(24, y - 7, 14, 14);
    if (done) { g.strokeStyle = '#0b1116'; g.lineWidth = 3; g.beginPath(); g.moveTo(26, y); g.lineTo(30, y + 4); g.lineTo(36, y - 5); g.stroke(); }
    g.fillStyle = done ? '#dfe7ea' : on ? '#ffffff' : '#7f8c94'; g.font = `${on ? 700 : 600} 16px ${F}`; g.fillText(t, 48, y + 1); });
  if (st.complete) { g.fillStyle = '#1f5d22'; g.fillRect(18, 264, 476, 40); g.fillStyle = '#e9ffe0'; g.font = `800 24px ${F}`; g.textAlign = 'center'; g.fillText('SERVICE COMPLETE', 256, 285); g.textAlign = 'left'; }
  else { g.fillStyle = '#9fb0ba'; g.font = `600 15px ${F}`; g.fillText(st.waiting || st.v8, 22, 286); }
  /* screen two: the cell from above, x −16…10, z −12…4 */
  panel(520, 8, 496, 304); g.fillStyle = '#f4f6f7'; g.font = `800 20px ${F}`; g.fillText('THE CELL · LIVE', 534, 32);
  const X = x => 530 + (x + 16) * 18.3, Z = z => 58 + (z + 12) * 14.2;
  g.strokeStyle = '#2b3942'; g.lineWidth = 1; g.strokeRect(X(-6.2), Z(-3.4), 11.4 * 18.3, 6.8 * 14.2);
  g.strokeStyle = '#6b5a14'; g.setLineDash && g.setLineDash([6, 5]); g.beginPath(); g.moveTo(X(-15), Z(AISLE.outer)); g.lineTo(X(9.8), Z(AISLE.outer)); g.moveTo(X(-15), Z(AISLE.inner)); g.lineTo(X(9.8), Z(AISLE.inner)); g.stroke(); g.setLineDash && g.setLineDash([]);
  for (const [bx0, bz0] of AISLE.bays) { g.strokeStyle = '#a88a14'; g.strokeRect(X(bx0 - .7), Z(bz0 - .7), 1.4 * 18.3, 1.4 * 14.2); }
  g.fillStyle = '#3a4a55'; g.fillRect(X(-2.5), Z(-1), 5 * 18.3, 2 * 14.2); g.fillStyle = '#1c262d'; g.fillRect(X(-.6), Z(-.8), 1.4 * 18.3, 1.6 * 14.2);
  if (st.wheelZ) { g.fillStyle = ORANGE; g.fillRect(X(1.0), Z(st.wheelZ) - 4, 18, 8); }
  for (const p of st.people) { g.fillStyle = p.id === 'lead' ? '#f4f6f7' : ORANGE; g.beginPath(); g.arc(X(p.x), Z(p.z), 6, 0, TAU); g.fill(); g.fillStyle = '#0b1116'; g.font = `800 9px ${F}`; g.textAlign = 'center'; g.fillText(p.tag, X(p.x), Z(p.z) + 1); g.textAlign = 'left'; }
  if (st.fork) { g.save(); g.translate(X(st.fork.x), Z(st.fork.z)); g.rotate(-st.fork.yaw); g.fillStyle = '#ffb020'; g.fillRect(-10, -36, 20, 40); g.fillStyle = '#7d868c'; g.fillRect(-7, 4, 4, 18); g.fillRect(3, 4, 4, 18); g.restore(); }
  g.fillStyle = st.running ? '#8aca40' : '#9fb0ba'; g.font = `700 15px ${F}`; g.fillText(st.v8, 534, 294);
  /* the tablet: the lead's page */
  panel(20, 348, 472, 154); g.fillStyle = '#f4f6f7'; g.font = `800 24px ${F}`; g.fillText('CREW LEAD', 36, 376);
  g.fillStyle = '#9fb0ba'; g.font = `600 17px ${F}`; g.fillText(st.phaseLine, 36, 410);
  g.fillStyle = st.clear ? '#8aca40' : ORANGE; g.font = `800 20px ${F}`; g.fillText(st.clear ? 'CREW CLEAR ✓' : 'CREW AT THE CAR', 36, 446);
  g.fillStyle = '#9fb0ba'; g.font = `600 15px ${F}`; g.fillText(st.v8, 36, 480);
  g.fillStyle = '#000000'; g.fillRect(1000, 0, 24, 24);
}

/* ------------------------------------------------------------------------------------------------ THE DIRECTOR */
const sec = s => { let t = 0; return dt => (t += dt) >= s; };
class Script {
  constructor(fn) { this.fn = fn; this.restart(); }
  restart() { this.it = this.fn(); this.wait = null; this.fresh = false; this.done = false; }
  step(dt) {
    for (let guard = 0; guard < 12; guard++) {
      if (this.wait) { if (!this.wait(this.fresh ? 0 : dt)) { this.fresh = false; return; } this.wait = null; }
      const r = this.it.next(); if (r.done) { this.restart(); return; }
      this.wait = r.value || null; this.fresh = true;
    }
  }
}
/* where a hand holds the gun: the hand's frame in the gun's (the palm on the grip, the forefinger at the trigger) */
const GUN_HOLD = (() => { const q = new T3.Quaternion(), m = new T3.Matrix4(), y = new T3.Vector3(.05, .35, -1).normalize(), x = new T3.Vector3(-1, .1, .15);
  x.addScaledVector(y, -x.dot(y)).normalize(); const z = new T3.Vector3().crossVectors(x, y); m.makeBasis(x, y, z); q.setFromRotationMatrix(m);
  const grip = new T3.Vector3(...GUN.grip), palm = new T3.Vector3(.012, -.085, .012).applyQuaternion(q); return {q, wrist: grip.sub(palm)}; })();

export function buildCrew({service = null, wheels = [], kit = null} = {}) {
  const root = new T3.Group(); root.name = 'The crew';
  const at = crewAtlas(), draws = [];
  /* the screens' canvas and its material */
  const sc = makeCanvas(1024, 512), screenTex = sc ? new T3.CanvasTexture(sc) : null; if (screenTex) { screenTex.colorSpace = T3.SRGBColorSpace; screenTex.anisotropy = 4; }
  const screenMat = new T3.MeshBasicMaterial({color: 0xffffff, map: screenTex}); screenMat.name = 'Crew screens';
  /* the people */
  const men = {};
  for (const r of ROLES) { const fig = buildFigure(T3, {title: r.title, label: r.label, height: r.height, build: r.build, helmet: r.helmet, headset: !!r.headset});
    const m = new Crewman(fig, {seed: r.seed, name: r.id, walk: r.walk}); m.role = r; men[r.id] = m;
    /* a pick box for the card, on the person */
    const box = new T3.Mesh(new T3.BoxGeometry(.62, 1.9, .5), new T3.MeshBasicMaterial({visible: false})); box.position.y = .95; box.name = 'exhibit-' + CREW_EXHIBITS[r.id].id; box.userData.exhibit = CREW_EXHIBITS[r.id]; fig.root.add(box); m.box = box; }
  for (const id of ['operator', 'mechanic', 'tech', 'engine', 'lead']) { root.add(men[id].fig.root); men[id].floor = floorAt; }
  /* the props */
  const gun = buildGun(), rack = buildRack(), tablet = buildTablet(screenMat), station = buildStation(screenMat), fork = buildForklift();
  const stationRoot = new T3.Group(); stationRoot.name = 'Telemetry station'; stationRoot.position.set(SPOTS.desk[0], 0, SPOTS.desk[1]); stationRoot.add(station.desk, station.screens); root.add(stationRoot);
  root.add(gun, rack, fork.root, fork.load);
  const forklift = new Forklift(fork, men.driver); fork.root.add(men.driver.fig.root);
  { const box = new T3.Mesh(new T3.BoxGeometry(1.2, 2.3, 3.4), new T3.MeshBasicMaterial({visible: false})); box.position.set(0, 1.15, -.6); box.name = 'exhibit-' + CREW_EXHIBITS.driver.id; box.userData.exhibit = CREW_EXHIBITS.driver; fork.root.add(box); men.driver.box = box; }
  /* the paint of the forklift's aisle and its two bays, and the words on the floor: one draw, unlit like the hall's own lines */
  { const P = [], y = .0022, line = (x0, z0, x1, z1, w = .1) => { const L = Math.hypot(x1 - x0, z1 - z0); P.push([bx(L, .002, w, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, -Math.atan2(z1 - z0, x1 - x0), 0), 'yellow']); };
    for (let x = -15.2; x < 9.6; x += 1.2) line(x, AISLE.outer, x + .75, AISLE.outer, .1);
    for (const [bx0, bz0] of AISLE.bays) { const h = .72; line(bx0 - h, bz0 - h, bx0 + h, bz0 - h, .08); line(bx0 - h, bz0 + h, bx0 + h, bz0 + h, .08); line(bx0 - h, bz0 - h, bx0 - h, bz0 + h, .08); line(bx0 + h, bz0 - h, bx0 + h, bz0 + h, .08);
      const g = new T3.PlaneGeometry(1.3, .26); g.rotateX(-Math.PI / 2); g.translate(bx0, y, bz0 + h + .22); const map = at.label(7), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const [a, b] = map(uv.getX(i), uv.getY(i)); uv.setXY(i, a, b); } P.push([g, null]); }
    for (const x of [-9, -1, 5]) { const g = new T3.PlaneGeometry(1.6, .3); g.rotateX(-Math.PI / 2); g.translate(x, y, AISLE.z + .95); const map = at.label(5), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const [a, b] = map(uv.getX(i), uv.getY(i)); uv.setXY(i, a, b); } P.push([g, null]); }
    const paint = propMesh(P, 'Forklift aisle paint', {cast: false}); paint.material = new T3.MeshBasicMaterial({map: at.map, color: 0xd8d8d0}); paint.receiveShadow = false; paint.renderOrder = 2; root.add(paint); }
  /* drawn shadows under everyone and everything that moves: one instanced draw */
  const shadowTex = (() => { const c = makeCanvas(64, 64); if (!c) return null; const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, '#fff'); rg.addColorStop(.5, '#9a9a9a'); rg.addColorStop(1, '#000'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); const t = new T3.CanvasTexture(c); t.colorSpace = T3.NoColorSpace; return t; })();
  const shadows = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({color: 0x000000, transparent: true, alphaMap: shadowTex, opacity: .5, depthWrite: false}), 10);
  shadows.name = 'Crew drawn shadows'; shadows.renderOrder = 2; shadows.frustumCulled = false; root.add(shadows);

  /* ---- state ---- */
  const flags = {stands: false, gun: false, grip: false, carryOff: false, carryOn: false, gunOn: false, clear: false};
  const S = {t: 0, side: 1, spots: sideSpots(1), rackAt: 'store', rackPlaced: false, receiving: false, gunAt: 'stand', carry: null, rackCarry: null, screenAt: 0, screenKey: '', complete: 0, lastPhase: 'ready', running: false, runningPrev: false, stopAt: 0, startAt: -1, events: [], served: false};
  const wheelOf = () => service && service.wheel, sideOf = w => w && w.userData.side === 'near' ? 1 : -1;
  const GS = GUN_STAND, gunStandPose = () => ({p: V().set(GS.x, .985, GS.z), q: Q().setFromEuler(new T3.Euler(-Math.PI / 2, 0, 0))});
  const place = (o, p, q) => { o.position.copy(p); o.quaternion.copy(q); };
  const rackStorePose = () => ({p: V().set(SPOTS.rackStore[0], 0, SPOTS.rackStore[1]), yaw: Math.PI / 2});
  function resetProps() {
    root.attach(gun); const gs = gunStandPose(); place(gun, gs.p, gs.q); S.gunAt = 'stand';
    rack.position.set(SPOTS.rackStore[0], 0, SPOTS.rackStore[1]); rack.rotation.set(0, Math.PI / 2, 0); S.rackAt = 'store'; S.rackPlaced = false; S.receiving = false; S.rackCarry = null; S.carry = null;
    const lh = men.lead.fig.bones.handL; lh.add(tablet); tablet.position.set(-.035, -.11, .06); tablet.rotation.set(.2, 0, Math.PI / 2 - .1);
  }
  /* ---- the wheel: its pose in the world (centre, and the axle out of its outer face), and putting it anywhere ---- */
  const rotorPose = (w, out = {c: V(), a: V()}) => { const r = w.getObjectByName('Wheel rotor'); r.updateWorldMatrix(true, false); out.c.setFromMatrixPosition(r.matrixWorld); out.a.set(0, 0, sideOf(w)).transformDirection(r.matrixWorld); return out; };
  const _inv = new T3.Matrix4(), _ql = Q();
  function putWheel(w, c, a) {
    w.updateWorldMatrix(true, false); _inv.copy(w.matrixWorld).invert(); const o = sideOf(w);
    const cl = _t1.copy(c).applyMatrix4(_inv), al = _t2.copy(a).transformDirection(_inv);
    const ay = Math.asin(clamp(o * al.x, -1, 1)), ax = Math.atan2(-o * al.y, o * al.z);
    service.placeWheel(w, cl.x, cl.y, cl.z, ax, ay); w.getObjectByName('Wheel rotor').updateWorldMatrix(true, true); w.getObjectByName('Wheel nut').updateWorldMatrix(true, true);
  }
  const axleOutPose = w => { const p = service.poseAt(WHEEL_SERVICE.release + WHEEL_SERVICE.slide, w); w.updateWorldMatrix(true, false); return {c: V().set(p.x, p.y, p.z).applyMatrix4(w.matrixWorld), a: V().set(0, 0, sideOf(w)).transformDirection(w.matrixWorld)}; };
  const carryPose = m => ({c: V().copy(m.pos).addScaledVector(fwdOf(m.yaw, _t3), .42).setY(lerp(.97, .62, m.post.kind === 'crouch' ? ease(m.post.k) : 0)), a: fwdOf(m.yaw, V()).negate()});
  const rackPose = () => ({c: V().set(0, RACK.hold, 0).applyMatrix4(rack.matrixWorld), a: V().set(0, 0, -1).transformDirection(rack.matrixWorld)});
  /* a carry of the wheel: from wherever it is to a pose that may move (the mechanic's arms), over a time */
  function carryTo(target, dur) { const w = wheelOf(); const from = rotorPose(w); S.carry = {from: {c: from.c.clone(), a: from.a.clone()}, target, dur, t: 0}; }
  function carryStep(dt) {
    const w = wheelOf(), C = S.carry; if (!C || !w) return; C.t += dt; const u = ease(C.t / C.dur), to = C.target();
    const c = _t4.copy(C.from.c).lerp(to.c, u), a = _P[0].copy(C.from.a).lerp(to.a, u).normalize(); if (a.lengthSq() < 1e-8) a.copy(to.a);
    putWheel(w, c, a);
  }
  const carried = () => !S.carry || S.carry.t >= S.carry.dur;
  /* hands on the wheel: at ten and two to the one who holds it (grip +1 right, −1 left), or at the sides (quarter three and nine) */
  function wheelGrip(m, i, sides = false) {
    return (pos, quat) => { const w = wheelOf(); if (!w) return false; const {c, a} = rotorPose(w, {c: _P[1], a: _P[2]});
      const up = _P[3].set(0, 1, 0); up.addScaledVector(a, -up.dot(a)); if (up.lengthSq() < 1e-6) up.copy(fwdOf(m.yaw, _P[3])); up.normalize();
      const side = _P[4].crossVectors(up, a).normalize(), toward = _P[5].copy(m.pos).sub(c).setY(0).dot(a) > 0 ? 1 : -1;   /* +1: the outer face is toward him */
      const k = (i ? -1 : 1) * toward * -1, R = .334 * 1.08;
      /* on the outer half of the tread, the side toward whoever holds it; ten and two to someone square to it, both hands
         moved round toward him when the wheel is off to one side (kneeling at its corner) */
      const lat = _t4.copy(m.pos).sub(c).dot(side), shift = sides ? 0 : clamp(lat / .5, -1, 1) * .45, th = k * .7 + shift;
      const g = (sides ? pos.copy(c).addScaledVector(side, k * R) : pos.copy(c).addScaledVector(side, Math.sin(th) * R).addScaledVector(up, Math.cos(th) * R)).addScaledVector(a, toward * .085);
      /* the palm toward the tyre, the fingers over the tread away from him */
      const palm = _P[6].copy(c).sub(g); palm.addScaledVector(a, -palm.dot(a)).normalize(); const fingers = _P[7].copy(a).multiplyScalar(-toward);
      const yv = _t1.copy(fingers).negate(), xv = _t2.copy(palm).multiplyScalar(i ? 1 : -1); xv.addScaledVector(yv, -xv.dot(yv)).normalize(); const zv = _t3.crossVectors(xv, yv);
      _m4.makeBasis(xv, yv, zv); quat.setFromRotationMatrix(_m4);
      /* the wrist is back from the grip by the palm's offset */
      pos.sub(_t4.set(i ? .012 : -.012, -.085, .012).multiplyScalar(m.d.s).applyQuaternion(quat)); return true; };
  }
  /* the gun: on its stand, in the right hand, on the nut, on the floor */
  const gunOnNutPose = () => { const w = wheelOf(), nut = w.getObjectByName('Wheel nut'); nut.updateWorldMatrix(true, false); const p = V().setFromMatrixPosition(nut.matrixWorld), a = V().set(0, 0, sideOf(w)).transformDirection(nut.matrixWorld);
    p.addScaledVector(a, .028); const z = a.clone().negate(), y = V(0, 1, 0), x = V().crossVectors(y, z).normalize(); y.crossVectors(z, x); _m4.makeBasis(x, y, z); return {p, q: Q().setFromRotationMatrix(_m4)}; };
  const gunFloorPose = m => { const F = fwdOf(m.yaw, V()), L = leftOf(m.yaw, V()), p = V().copy(m.pos).addScaledVector(L, -.30).addScaledVector(F, .2); p.y = floorAt(p.x, p.z) + .038; const q = Q().setFromEuler(new T3.Euler(0, m.yaw, Math.PI / 2, 'YXZ')); return {p, q}; };
  const handOnGun = (m, gp) => (pos, quat) => { const g = gp(); if (!g) return false; quat.copy(g.q).multiply(GUN_HOLD.q); pos.copy(GUN_HOLD.wrist).multiplyScalar(1).applyQuaternion(g.q).add(g.p); return true; };
  function gunToHand(m) { const h = m.fig.bones.handR; h.add(gun); const inv = GUN_HOLD.q.clone().invert(); gun.quaternion.copy(inv); gun.position.copy(GUN_HOLD.wrist).negate().applyQuaternion(inv); S.gunAt = 'hand'; }
  function gunToWorld(pose, at) { root.attach(gun); if (pose) place(gun, pose.p, pose.q); S.gunAt = at; }
  let gunBlend = null;   /* a gun moving between two world poses (onto the nut, down to the floor) with the hand on it */
  function moveGun(to, dur, at) { gunToWorld(null, at); gunBlend = {fromP: gun.position.clone(), fromQ: gun.quaternion.clone(), to, dur, t: 0}; }
  function gunStep(dt) { if (!gunBlend) return; const b = gunBlend; b.t += dt; const u = ease(b.t / b.dur), tp = b.to(); gun.position.copy(b.fromP).lerp(tp.p, u); gun.quaternion.copy(b.fromQ).slerp(tp.q, u); if (u >= 1 && b.hold !== true) { if (b.t > b.dur + 1e-9) {} } }
  const gunPose = () => ({p: gun.position.clone(), q: gun.quaternion.clone()});
  /* the rack: carried by the pit technician, down and up with his crouch; placed on the floor */
  const rackCarryPose = m => { const k = m.post.kind === 'crouch' ? ease(m.post.k) : 0; return {p: V().copy(m.pos).addScaledVector(fwdOf(m.yaw, _t3), lerp(.24, .36, k)).setY(lerp(.30, 0, k)), yaw: m.yaw}; };
  const rackGrip = (m, i) => (pos, quat) => { rack.updateWorldMatrix(true, false); const g = RACK.grips[i]; pos.set(i ? -.235 : .235, .40, 0).applyMatrix4(rack.matrixWorld);
    const yv = _t1.set(0, 1, 0), xv = _t2.set(i ? -1 : 1, 0, 0).transformDirection(rack.matrixWorld).multiplyScalar(i ? -1 : 1).negate(); xv.addScaledVector(yv, -xv.dot(yv)).normalize(); const zv = _t3.crossVectors(xv, yv); _m4.makeBasis(xv, yv, zv); quat.setFromRotationMatrix(_m4);
    pos.sub(_t4.set(i ? .012 : -.012, -.085, .012).multiplyScalar(m.d.s).applyQuaternion(quat)); return true; };
  /* crew clear: the mechanic and the pit technician are away from the car and have put down what they carried */
  const inZone = m => m.pos.x > -3.3 && m.pos.x < 4.2 && Math.abs(m.pos.z) < 2.75;
  const crewClear = () => !inZone(men.mechanic) && !inZone(men.tech) && S.gunAt === 'stand' && S.rackAt === 'store' && !men.mechanic.path && !men.tech.path;
  /* the route from where a person stands to a place */
  const obstacles = () => { const o = OBSTACLES.slice(); if (S.rackAt === 'placed') { const r = rack.position; o.push([r.x - .32, r.z - .3, r.x + .32, r.z + .3]); } return o; };
  function* go(m, to, face = null, speed = null) {
    const pts = route([m.pos.x, m.pos.z], to, obstacles(), NODES).slice(1);
    m.walkTo(pts.length ? pts : [to], {face, speed: speed ?? m.walkSpeed, clearOf: obstacles()}); yield () => m.arrived;
  }
  const phase = () => service ? service.phase : 'ready', hold = () => service ? service.hold : null;
  const hubPoint = () => { const w = wheelOf(); if (!w) return V(); const p = V(0, 0, .09 * sideOf(w)); w.updateWorldMatrix(true, false); return p.applyMatrix4(w.matrixWorld); };
  const engineLook = V(-1.55, .72, -.05);
  const face = (m, p) => yawTo(p[0] - m.pos.x, p[1] - m.pos.z);

  /* ---- the telemetry operator: always seated; types, glances between the screens, acknowledges SERVICE COMPLETE ---- */
  const deskW = (x, y, z) => V(SPOTS.desk[0] + x, y, SPOTS.desk[1] + z);
  const screensAt = [deskW(-.31, 1.1, -.2), deskW(.31, 1.1, -.2)];
  function seatOperator() {
    const m = men.operator, s = m.d.s; m.place(SPOTS.desk[0], SPOTS.desk[1] + .56, Math.PI);
    m.sit({pelvis: deskW(0, STATION.seatY + .105 * s, .62), pitch: -.04, lean: .1});
    m.feet.forEach(f => { f.ankle.copy(deskW(f.side > 0 ? -.12 : .12, m.d.ankleH, .16)); f.yaw = Math.PI + (f.side > 0 ? .1 : -.1); f.pitch = 0; f.planted = true; m.toeFromAnkle(f); });
  }
  const typing = (m, i) => (pos, quat) => { const k = i ? 1 : -1, tap = CLIPS.typing.value(i ? 'tapR' : 'tapL', m.t * (i ? 1.07 : 1) + i * .31);
    pos.copy(deskW(i ? .1 : -.14, STATION.deskY + .055 + tap, .08 + (i ? .01 : 0))); quat.setFromEuler(new T3.Euler(-1.25, Math.PI + k * -.25, k * -.15, 'YXZ')); pos.add(_t1.set(0, 0, 0)); return true; };
  function* operator() {
    const m = men.operator; seatOperator();
    m.reach(0, typing(m, 0), 3); m.reach(1, typing(m, 1), 3);
    for (;;) {
      /* a glance at one screen or the other, now and then over the shoulder at the car */
      const r = m.rand(); m.lookAt(r < .45 ? screensAt[0] : r < .9 ? screensAt[1] : V(0, .9, 0)); const hold = 1.4 + m.rand() * 3.6;
      yield (t => dt => { t += dt; return t >= hold || S.complete > 0 && !S.ackd; })(0);
      if (S.complete > 0 && !S.ackd) {
        S.ackd = true; yield sec(.5 + m.rand() * .3);
        /* the acknowledgement: hands off the keys, a look round to the car and the lead, the thumb up */
        m.reach(1, null, 4); m.lookAt(men.lead.fig.bones.head); yield sec(.35); m.gesture('thumbs'); yield () => !m.gesturing; yield sec(.3);
        m.reach(1, typing(m, 1), 3);
      }
    }
  }
  /* ---- the engine technician: at the nose while the V8 runs, at the operator's side when it stops ---- */
  function* engine() {
    const m = men.engine;
    for (;;) {
      if (S.running) { yield* go(m, SPOTS.nose, yawTo(engineLook.x - SPOTS.nose[0], engineLook.z - SPOTS.nose[1])); m.lookAt(engineLook);
        yield () => !S.running && S.t - S.stopAt > 1.5; }
      else { yield* go(m, SPOTS.engineDesk, yawTo(screensAt[1].x - SPOTS.engineDesk[0], screensAt[1].z - SPOTS.engineDesk[1]));
        for (;;) { const r = m.rand(); m.lookAt(r < .55 ? screensAt[1] : r < .85 ? screensAt[0] : men.operator.fig.bones.head); const h = 2 + m.rand() * 3.5;
          yield (t => dt => { t += dt; return t >= h || S.running; })(0); if (S.running) break; } }
    }
  }
  /* ---- the crew lead: the tablet, the hold at isolation, the hub pointed out, the all-clear ---- */
  const tabletLook = () => { tablet.updateWorldMatrix(true, false); return V().setFromMatrixPosition(tablet.matrixWorld); };
  const leadTabletHand = m => (pos, quat) => { const F = fwdOf(m.yaw, _t1), L = leftOf(m.yaw, _t2); pos.copy(m.pos).addScaledVector(F, .30).addScaledVector(L, .07).setY(1.02 * m.d.s); quat.setFromEuler(new T3.Euler(-.2, m.yaw + .15, 0, 'YXZ')); return true; };
  function* lead() {
    const m = men.lead; let seen = S.startAt;
    m.reach(0, leadTabletHand(m), 3);
    for (;;) {
      /* idle at his post, watching the car and his tablet by turns; a "go" when the V8 is started */
      if (phase() === 'ready' && !(service && service.clearing)) {
        yield* go(m, SPOTS.leadPost, yawTo(-SPOTS.leadPost[0], -SPOTS.leadPost[1]));
        for (;;) { const r = m.rand(); m.lookAt(r < .35 ? tabletLook() : r < .8 ? V(0, .8, 0) : men.mechanic.fig.bones.head); const h = 1.8 + m.rand() * 3;
          yield (t => dt => { t += dt; return t >= h || phase() !== 'ready' || S.startAt > seen; })(0);
          /* the go for the run; a start made while he was still walking back to his post gets it too, if it is under two seconds old */
          if (S.startAt > seen) { const fresh = S.t - S.startAt < 2; seen = S.startAt; if (fresh && S.running) { m.lookAt(V(-1.2, .8, 0)); yield sec(.2 + m.rand() * .2); m.gesture('go'); yield () => !m.gesturing; } }
          if (phase() !== 'ready') break; }
      }
      if (phase() === 'isolated' || phase() === 'supported') {
        /* the hold: the crew stops, the drive is locked out */
        m.lookAt(V(1.2, .6, 0)); m.gesture('hold'); yield () => !m.gesturing;
        const sp = S.spots; yield* go(m, sp.supervise, face({pos: {x: sp.supervise[0], z: sp.supervise[1]}}, [XW, S.side * .9]));
        m.lookAt(hubPoint);
      }
      yield () => ['inspect', 'ready'].includes(phase()) || phase() === 'refit';
      if (phase() === 'inspect') { m.lookAt(hubPoint); yield sec(.6); m.gesture('point'); yield () => !m.gesturing; m.lookAt(tabletLook()); yield () => phase() !== 'inspect'; }
      yield () => phase() === 'ready';
      if (service && service.clearing) {
        /* the all-clear: he looks round his crew until they are clear of the car, then gives it */
        const who = [men.mechanic, men.tech]; let k = 0;
        while (!crewClear()) { m.lookAt(who[k++ % 2].fig.bones.head); yield (t => dt => { t += dt; return t >= 1.2 || crewClear(); })(0); }
        m.lookAt(V(0, .9, 0)); yield sec(.3); m.gesture('signal'); yield () => m.gesturing ? m.gest.t >= 1.5 : true; flags.clear = true; yield () => !service.clearing; flags.clear = false; yield () => !m.gesturing;
      }
    }
  }
  /* ---- the pit technician: stands in, the rack out to the corner, the wheel received; stands out, rack away ---- */
  function* tech() {
    const m = men.tech;
    for (;;) {
      yield () => ['supported', 'wheelOff'].includes(phase()) && service.standsIn < 1;
      const sp = S.spots;
      yield* go(m, sp.sill, sp.kneelYaw); m.kneel(true); m.bendWant = .95; yield () => m.arrived;
      m.lookAt(V(-.1, .1, sp.o * .85)); m.reach(0, (p, q) => { p.set(-.45, .16, sp.o * (.85 + (1 - service.standsIn) * .65)); q.copy(m.fig.bones.foreL.getWorldQuaternion(q)); return true; }, 3);
      m.reach(1, (p, q) => { p.set(.25, .16, sp.o * (.85 + (1 - service.standsIn) * .65)); q.copy(m.fig.bones.foreR.getWorldQuaternion(q)); return true; }, 3);
      yield sec(.4); flags.stands = true; yield () => service.standsIn >= 1 || phase() === 'ready'; flags.stands = false; m.reach(0, null); m.reach(1, null); yield sec(.2);
      m.kneel(false); m.bendWant = 0; yield () => m.arrived;
      /* the rack from its place by the back of the cell */
      yield* go(m, [SPOTS.rackStore[0] - .36, SPOTS.rackStore[1]], Math.PI / 2); m.crouch(1); m.bendWant = .6; m.reach(0, rackGrip(m, 0), 4); m.reach(1, rackGrip(m, 1), 4); yield () => m.arrived; yield sec(.25);
      S.rackAt = 'carried'; m.crouch(0); m.bendWant = 0; yield () => m.arrived;
      yield* go(m, sp.rackPlace, Math.PI / 2, .95); m.crouch(1); m.bendWant = .6; yield () => m.arrived; S.rackAt = 'placed'; S.rackPlaced = true; yield sec(.15); m.reach(0, null); m.reach(1, null); m.crouch(0); m.bendWant = 0; yield () => m.arrived;
      /* round to the far end of the rack, to take the wheel */
      yield* go(m, sp.receive, -Math.PI / 2); S.receiving = true; m.lookAt(() => rotorPose(wheelOf()).c.clone());
      yield () => S.laying || phase() === 'ready';
      if (S.laying) { m.crouch(.85); m.bendWant = .6; m.reach(0, wheelGrip(m, 0, true), 3); m.reach(1, wheelGrip(m, 1, true), 3); yield () => !S.laying; yield sec(.2); m.reach(0, null); m.reach(1, null); m.crouch(0); m.bendWant = 0; }
      yield () => phase() === 'ready' || phase() === 'refit';
      if (phase() === 'refit') { m.lookAt(() => rotorPose(wheelOf()).c.clone()); yield () => phase() === 'ready'; }
      /* Ready: the stands out, then the rack back where it lives */
      yield* go(m, sp.sill, sp.kneelYaw); m.kneel(true); m.bendWant = .95; yield () => m.arrived; m.lookAt(V(-.1, .1, sp.o * .85));
      flags.stands = true; yield () => service.standsIn <= 0 || !['ready'].includes(phase()); flags.stands = false; m.kneel(false); m.bendWant = 0; yield () => m.arrived;
      yield* go(m, sp.rackPlace, Math.PI / 2); m.crouch(1); m.bendWant = .6; m.reach(0, rackGrip(m, 0), 4); m.reach(1, rackGrip(m, 1), 4); yield () => m.arrived; yield sec(.2);
      S.rackAt = 'carried'; S.rackPlaced = false; S.receiving = false; m.crouch(0); m.bendWant = 0; yield () => m.arrived;
      yield* go(m, [SPOTS.rackStore[0] - .36, SPOTS.rackStore[1]], Math.PI / 2, .95); m.crouch(1); m.bendWant = .6; yield () => m.arrived; S.rackAt = 'store'; yield sec(.15); m.reach(0, null); m.reach(1, null); m.crouch(0); m.bendWant = 0; yield () => m.arrived;
      yield* go(m, SPOTS.techPost, face(m, [0, 0])); m.lookAt(null);
    }
  }
  /* ---- the wheel mechanic ---- */
  const gunApproach = [GS.x - .18, GS.z + .42];
  function* mechanic() {
    const m = men.mechanic;
    for (;;) {
      /* he starts only once the car is being supported — and a Wheel off pressed early waits for him (the service's 'gun' hold) */
      yield () => service && service.wheel && (phase() === 'supported' || phase() === 'wheelOff' && service.motion === 'off' && service.hold === 'gun');
      const sp = S.spots, w = wheelOf();
      /* the gun from its holster */
      yield* go(m, gunApproach, Math.PI); m.lookAt(gun); m.bendWant = .75; m.reach(1, handOnGun(m, () => gunPose()), 3.5); yield sec(.7); gunToHand(m); m.reach(1, null, 2.5); m.bendWant = 0; yield sec(.25);
      /* to the wheel, and down on one knee */
      m.lookAt(hubPoint); yield* go(m, sp.kneel, sp.kneelYaw); m.kneel(true); yield () => m.arrived;
      /* the gun onto the nut, the other hand on the tyre */
      m.bendWant = 1.0; moveGun(gunOnNutPose, .6, 'nut'); m.reach(1, handOnGun(m, () => gunPose()), 6); m.reach(0, wheelGrip(m, 0), 3); yield sec(.65);
      gunBlend.to = gunOnNutPose; flags.gun = true;
      yield () => service.time >= WHEEL_SERVICE.release || !service.motion || phase() === 'ready'; flags.gun = false;
      if (phase() === 'ready') continue;
      /* the gun down beside him, both hands to the tyre, and the pull */
      m.sideWant = .45; moveGun(() => gunFloorPose(m), .6, 'floor'); yield sec(.6); gunBlend = null; m.sideWant = 0; m.bendWant = .6; m.reach(1, wheelGrip(m, 1), 4); yield sec(.45); flags.grip = true;
      yield () => service.hold === 'carryOff' || !service.motion; flags.grip = false;
      /* up with it, to the rack, and down into it — the pit technician takes it there */
      carryTo(() => carryPose(m), 1.0); S.carrying = true; m.carrying = 1; m.bendWant = 0; m.kneel(false); yield () => m.arrived && carried();
      yield () => S.rackPlaced && S.receiving;
      yield* go(m, sp.approach, Math.PI / 2, .85); m.crouch(1); m.bendWant = .35; S.laying = true; carryTo(rackPose, .9); yield () => m.arrived && carried(); yield sec(.2);
      flags.carryOff = true; yield () => !service.motion; flags.carryOff = false; S.laying = false; S.carry = null; m.carrying = 0;
      m.reach(0, null); m.reach(1, null); m.crouch(0); m.bendWant = 0; yield () => m.arrived;
      /* inspection: back at the hub, down on the knee, looking */
      yield () => phase() !== 'wheelOff'; if (phase() === 'ready') continue;
      yield* go(m, sp.kneel, sp.kneelYaw); m.kneel(true); m.bendWant = .45; m.lookAt(hubPoint); yield () => phase() === 'refit' || phase() === 'ready'; if (phase() === 'ready') continue;
      /* refit: to the rack, the wheel up out of it, back to the hub and on to the end of its slide */
      m.kneel(false); m.bendWant = 0; yield () => m.arrived;
      yield* go(m, sp.approach, Math.PI / 2); m.crouch(1); m.bendWant = .35; m.reach(0, wheelGrip(m, 0), 4); m.reach(1, wheelGrip(m, 1), 4); yield () => m.arrived; yield sec(.3);
      carryTo(() => carryPose(m), .9); m.carrying = 1; m.crouch(0); m.bendWant = 0; yield () => m.arrived && carried();
      yield* go(m, sp.kneel, sp.kneelYaw, .85); carryTo(() => axleOutPose(w), 1.1); m.kneel(true); m.bendWant = .6; yield () => m.arrived && carried();
      flags.carryOn = true; yield () => service.hold === 'gunOn' || !service.motion; flags.carryOn = false; S.carry = null; m.carrying = 0;
      /* the gun back up from the floor and onto the nut: run on and torqued */
      m.bendWant = 1.0; m.sideWant = .45; m.reach(0, wheelGrip(m, 0), 3); m.reach(1, handOnGun(m, () => gunPose()), 4); yield sec(.55); m.sideWant = 0; moveGun(gunOnNutPose, .5, 'nut'); yield sec(.55); gunBlend.to = gunOnNutPose;
      flags.gunOn = true; yield () => !service.motion; flags.gunOn = false; yield sec(.3);
      /* up, the gun back in its holster, and back to his place */
      gunBlend = null; gunToHand(m); m.reach(1, null); m.reach(0, null); m.kneel(false); m.bendWant = 0; m.lookAt(null); yield () => m.arrived;
      yield* go(m, gunApproach, Math.PI); m.bendWant = .75; m.reach(1, handOnGun(m, () => gunStandPose()), 3); yield sec(.7); gunToWorld(gunStandPose(), 'stand'); m.reach(1, null); m.bendWant = 0; yield sec(.25);
      yield* go(m, SPOTS.mechanicPost, face(m, [0, 0]));
    }
  }
  /* ---- the forklift operator: seated; the wheel in his hands, his eyes where the truck is going ---- */
  function seatDriver() {
    const m = men.driver; m.place(0, -.78, 0); m.sit({pelvis: V(0, 1.02 + .105 * m.d.s, -.8), pitch: -.05, lean: .06});
  }
  const driverFeet = () => { const m = men.driver, r = fork.root; r.updateMatrixWorld(true); m.feet.forEach(f => { f.ankle.set(f.side * .12, .56 + m.d.ankleH, -.36).applyMatrix4(r.matrixWorld); f.yaw = forklift.yaw + f.side * .08; f.pitch = -.15; f.planted = true; m.toeFromAnkle(f); }); };
    /* the hands on the rim at ten and two, turned with the steered wheels (the rim is round, so it is the hands that show the turn);
     the rim's centre (0, 1.262, −.39) in the truck's frame, its plane tilted .6 rad back toward the driver */
  const driverHand = (m, i) => (pos, quat) => { const k = i ? -1 : 1, a = clamp(-forklift.steer * 1.6, -.9, .9) + k * 1.0, r = .15; pos.set(Math.sin(a) * r, Math.cos(a) * r, 0).applyAxisAngle(XA, -(Math.PI / 2 - .6)).add(_t1.set(0, 1.262, -.39));
    pos.addScaledVector(_t1.set(0, Math.cos(.6), Math.sin(.6)), .03).applyMatrix4(fork.root.matrixWorld); quat.setFromEuler(new T3.Euler(-.5, forklift.yaw + k * .5, k * .3, 'YXZ')); return true; };
  function* driver() {
    const m = men.driver; seatDriver(); m.reach(0, driverHand(m, 0), 3); m.reach(1, driverHand(m, 1), 3);
    for (;;) {
      const st = forklift.state;
      if (st === 'reversing') m.lookAt(() => { const p = V(forklift.x, 1.0, forklift.z); return p.addScaledVector(fwdOf(forklift.yaw, _t1), -4).addScaledVector(leftOf(forklift.yaw, _t2), .6); });
      else if (st === 'driving') m.lookAt(() => V(forklift.x, .4, forklift.z).addScaledVector(fwdOf(forklift.yaw, _t1), 5));
      else if (st === 'mast') m.lookAt(() => V(forklift.x, .5, forklift.z).addScaledVector(fwdOf(forklift.yaw, _t1), 1.6));
      else m.lookAt(null);
      yield sec(.25);
    }
  }

  const scripts = {operator: new Script(operator), engine: new Script(engine), lead: new Script(lead), tech: new Script(tech), mechanic: new Script(mechanic), driver: new Script(driver)};
  function placeAll() {
    men.mechanic.place(...SPOTS.mechanicPost, yawTo(-SPOTS.mechanicPost[0], -SPOTS.mechanicPost[1]));
    men.tech.place(...SPOTS.techPost, yawTo(-SPOTS.techPost[0], -SPOTS.techPost[1]));
    men.lead.place(...SPOTS.leadPost, yawTo(-SPOTS.leadPost[0], -SPOTS.leadPost[1]));
    men.engine.place(...SPOTS.engineDesk, yawTo(screensAt[1].x - SPOTS.engineDesk[0], screensAt[1].z - SPOTS.engineDesk[1]));
    seatOperator(); seatDriver();
  }
  resetProps(); placeAll();

  /* ---- the frame ---- */
  let screenCtx = sc;
  function screenState() {
    const ph = phase(), w = wheelOf(), running = S.running, v8 = running ? `V8 RUNNING · ${Math.round(S.rpm || 0).toLocaleString('en-AU')} RPM` : service && service.drive && service.drive.locked ? 'V8 STOPPED · DRIVE LOCKED OUT' : 'V8 STOPPED · DRIVE READY';
    const idx = {isolated: 2, supported: service && service.standsIn >= 1 ? 3 : 2, wheelOff: service && !service.motion ? 4 : 3, inspect: 4, refit: service && !service.motion ? 6 : 5}[ph];
    const done = ph === 'ready' ? (S.served ? (service.clearing ? 6 : 7) : 0) : idx;
    const waiting = service && service.hold ? {gun: 'Waiting for the wheel mechanic and his gun', grip: 'The mechanic takes the wheel', carryOff: 'The wheel is carried to the rack', carryOn: 'The wheel is carried back to its hub', gunOn: 'The gun goes back on the nut', stands: 'The pit technician is at the stands'}[service.hold] : service && service.clearing ? "Waiting for the crew lead's all-clear" : service && service.standsWaiting ? 'The pit technician is at the stands' : '';
    return {done, active: ph !== 'ready' || (service && service.clearing), complete: ph === 'ready' && S.served, waiting, v8, running, wheelName: w ? (sideOf(w) > 0 ? 'NEAR REAR' : 'FAR REAR') : '', wheelZ: w ? w.position.z : 0,
      people: [['lead', 'L'], ['mechanic', 'W'], ['tech', 'P'], ['engine', 'E'], ['operator', 'T']].map(([id, tag]) => ({id, tag, x: men[id].pos.x, z: men[id].pos.z})), fork: {x: forklift.x, z: forklift.z, yaw: forklift.yaw},
      clear: crewClear(), phaseLine: service ? ({ready: service.clearing ? 'Ready · all-clear to give' : 'Ready', isolated: 'Isolated · drive locked out', supported: 'On stands', wheelOff: 'Wheel off', inspect: 'Inspecting hub, disc, caliper', refit: 'Refit'}[ph]) : 'Ready'};
  }
  function update(dt, st = {}) {
    S.t += dt; S.events.length = 0; S.rpm = st.rpm || 0;
    const running = !!st.running; if (running && !S.running) { S.events.push('start'); S.startAt = S.t; } if (!running && S.running) S.stopAt = S.t; S.running = running;
    /* the service's side decides the places at the car */
    const w = wheelOf(); if (w && (phase() === 'isolated' || phase() === 'ready' && !service.clearing)) { S.side = sideOf(w); S.spots = sideSpots(S.side); }
    const ph = phase(); if (ph !== S.lastPhase) { if (ph !== 'ready') S.served = true; if (ph === 'ready' && S.lastPhase === 'refit') { S.complete = S.t; S.ackd = false; } S.lastPhase = ph; }
    for (const k of ['operator', 'engine', 'lead', 'tech', 'mechanic', 'driver']) scripts[k].step(dt);
    /* the forklift holds still while a wheel is off the car (the service's close-up), and goes on after */
    forklift.update(dt, ['wheelOff', 'inspect', 'refit'].includes(ph) || !!st.closeUp); driverFeet();
    for (const k of ['operator', 'engine', 'lead', 'tech', 'mechanic', 'driver']) men[k].update(dt);
    /* the things carried follow the hands that carry them */
    if (S.rackAt === 'carried') { const p = rackCarryPose(men.tech); rack.position.copy(p.p); rack.rotation.set(0, p.yaw, 0); }
    rack.updateMatrixWorld(true);
    gunStep(dt); carryStep(dt);
    /* the shadows on the floor */
    const m4 = _m4, sq = _Q[0], sp = _t1, ss = _t2; let n = 0;
    for (const k of ['operator', 'engine', 'lead', 'tech', 'mechanic']) { const m = men[k], hp = m.fig.bones.hips; const c = _t3.setFromMatrixPosition(hp.matrixWorld); const big = m.post.kind === 'stand' ? 0 : ease(m.post.k) * .35;
      m4.compose(sp.set(c.x, .0025, c.z), sq.setFromAxisAngle(YA, m.yaw), ss.set(.75 + big, 1, .6 + big)); shadows.setMatrixAt(n++, m4); }
    { const c = _t3.set(0, 0, -.8).applyMatrix4(fork.root.matrixWorld); m4.compose(sp.set(c.x, .0025, c.z), sq.setFromAxisAngle(YA, forklift.yaw), ss.set(1.6, 1, 3.0)); shadows.setMatrixAt(n++, m4); }
    m4.compose(sp.set(forklift.load.x, .0025, forklift.load.z), sq.setFromAxisAngle(YA, forklift.load.yaw), ss.set(1.5, 1, 1.5)); shadows.setMatrixAt(n++, m4);
    m4.compose(sp.set(rack.position.x, .0025, rack.position.z), sq.setFromAxisAngle(YA, rack.rotation.y), ss.set(.8, 1, .9)); shadows.setMatrixAt(n++, m4);
    { const c = gun.getWorldPosition(_t3); m4.compose(sp.set(c.x, .0025, c.z), sq.identity(), ss.set(c.y < .4 ? .35 : .001, 1, c.y < .4 ? .35 : .001)); shadows.setMatrixAt(n++, m4); }
    shadows.count = n; shadows.instanceMatrix.needsUpdate = true;
    /* the screens, four times a second */
    S.screenAt += dt; if (screenCtx && S.screenAt > .25) { S.screenAt = 0; drawScreens(screenCtx, screenState()); screenTex.needsUpdate = true; }
  }
  function reset() {
    for (const k of Object.keys(flags)) flags[k] = false;
    resetProps(); gunBlend = null; S.laying = false; S.served = false; S.complete = 0; S.ackd = true; S.lastPhase = 'ready';
    for (const m of Object.values(men)) { m.reach(0, null); m.reach(1, null); m.hands.forEach(h => { h.w = 0; h.valid = false; }); m.gest = null; m.carrying = 0; m.bendWant = 0; m.bend = 0; m.sideWant = 0; m.side = 0; m.lookAt(null); m.look.target = null; m.look.hasNext = false; }
    placeAll(); forklift.reset(); for (const s of Object.values(scripts)) s.restart(); S.screenAt = 1;
  }
  /* the service asks before each step it cannot take alone */
  const carrier = {ready: hold => !!flags[hold]};
  /* screen(): what the operator's screens say now (read-only; the tests read it rather than the canvas) */
  const crew = {root, men, props: {gun, rack, tablet, station, forklift: fork}, forklift, carrier, update, reset, flags, S, crewClear, scripts, screen: () => screenState(),
    exhibits: Object.values(men).map(m => m.box),
    info: () => ({phase: phase(), hold: hold(), flags: {...flags}, gun: S.gunAt, rack: S.rackAt, clear: crewClear(), forklift: forklift.state, people: Object.fromEntries(Object.entries(men).map(([k, m]) => [k, {x: +m.pos.x.toFixed(3), z: +m.pos.z.toFixed(3), post: m.post.kind, k: +m.post.k.toFixed(2), moving: !!m.path}]))})};
  update(0, {});
  return crew;
}
