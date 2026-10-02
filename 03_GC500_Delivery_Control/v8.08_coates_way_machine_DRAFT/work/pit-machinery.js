/* THE HALL'S MACHINERY (v6.92). Andrew Fisher, 27 Sep 2026: "Pit needs to be bigger. More detail. More mechanical things operating."

   The hall is a working pit garage now, not a set: round the #26 on its dyno the rest of the building is at work, every frame —
     the overhead gantry crane travels the hall on its runway, its trolley crosses the bridge and its hook block raises and lowers the
       spare V8, the hoist drum turning as the rope pays out and in;
     a two-post lift raises a gearbox on its cradle, holds it, lowers it and waits;
     the air compressor runs up to its cut-out pressure and unloads — flywheel, piston rods and gauge needle all following it;
     the parts washer's lid lifts and closes; the pedestal drill runs, its quill feeding down and back, the feed handle turning with it;
     the tyre changer's turntable turns a wheel under its mount head; the wheel balancer drops its hood, spins a wheel up and brakes it;
     a vertical tyre carousel carries ten tyres round its loop, its sprockets turning;
     twelve extraction fans turn in the walls and the roof, faster while the V8 runs;
     amber beacons turn on the crane, the lift, the carousel, the compressor and the roller door;
     the hose reels pay out and wind in; and the HALL SYSTEMS board on the far wall reads it all back, live.
   Nothing here is a downloaded model or texture: every part is a primitive, merged by material within whatever moves together
   (the fixed parts of every machine are one batch), the repeated parts are instanced, and nothing casts a shadow. Everything is laid
   out behind the car or at the walls, clear of the lines from the car and V8 views' cameras to the car; anything that does come
   between an orbiting camera and the car fades out of the way (view-fx.js).

   Every word on a sign is one the page already uses: COATES, INDUSTRIAL SOLUTIONS, GC500 2026, SURFERS PARADISE, PIT 26, and the
   machines' own plain names. No figure is invented: the board shows the machines' own positions, pressures and speeds. */
import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const box = (w, h, d) => new T.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 18, open = false) => new T.CylinderGeometry(rt, rb, h, seg, 1, open);
const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
function group(parent, name, x = 0, y = 0, z = 0) { const g = new T.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); return g; }
/* a geometry placed: translated, turned (XYZ), for merging */
function placed(geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { return geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(1, 1, 1))); }
/* a thin box between two points (a chain, a cable, a hose run) */
function strut(a, b, w, d = w) { const A = new T.Vector3(...a), B = new T.Vector3(...b), dir = B.clone().sub(A), L = dir.length(); const g = box(w, L, d);
  return g.applyMatrix4(new T.Matrix4().compose(A.clone().addScaledVector(dir, .5), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize()), new T.Vector3(1, 1, 1))); }
/* merge per material, straight into a parent: one draw per material for everything that moves together */
/* v6.99 — and per unit (unit(name) before the pieces): the fixed parts of every machine used to be one hall-wide mesh per material, so the
   lift could not be taken out of the way without the carousel; now each machine's fixed parts are its own meshes (userData.unit) */
function Parts() { const units = new Map(); let u = null; return {
  unit(name) { u = name; return this; },
  add(mat, geo) { if (!units.has(u)) units.set(u, new Map()); const m = units.get(u); if (!m.has(mat)) m.set(mat, []); m.get(mat).push(geo.index ? geo.toNonIndexed() : geo); return this; },
  build(parent, name) { const out = []; for (const [unit, m] of units) for (const [mat, geos] of m) { const norm = geos.map(g => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return g; });
      const g = mergeGeometries(norm, false); if (!g) continue; const mesh = new T.Mesh(g, mat); mesh.name = unit ? `${name} · ${unit}` : name; if (unit) mesh.userData.unit = unit; mesh.castShadow = false; mesh.receiveShadow = true; parent.add(mesh); out.push(mesh); }
    units.clear(); return out; } }; }
const tag = (o, unit) => { o.userData.unit = unit; return o; };

/* the crane's runway height: under the roof's portal beams (their undersides are 0.85 m below the roof) with the bridge, its walkway and the
   high-bay lights all clear of each other */
export const craneRunY = G => G.height - 3.0;
export function buildMachinery({G, M, sign, blob}) {
  const root = new T.Group(); root.name = 'hall machinery';
  const movers = [], stat = Parts();
  const mover = (o, name) => { o.name = o.name || name; movers.push(o); return o; };
  const beaconAmber = new T.MeshBasicMaterial({color: 0xffb020});
  const beaconDome = new T.MeshBasicMaterial({color: 0xff8a1a, transparent: true, opacity: .45, depthWrite: false});
  const white = new T.MeshBasicMaterial({color: 0xf3f4f2});
  const S = {t: 0, crane: {x: 0, z: 0, hook: 0}, lift: 0, comp: {p: 7.2, run: true, theta: 0, relayAt: -9}, washer: 0, drill: {depth: 0, spin: 0}, changer: 0, balancer: {omega: 0, hood: 0, phase: 'idle'}, carousel: 0, fans: 0, fanOmega: 5, running: false};
  const signMesh = (text, opts, w, h, parent, x, y, z, ry = 0) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map: sign(text, opts)})); m.position.set(x, y, z); m.rotation.y = ry; m.name = 'sign ' + text; parent.add(m); return m; };
  const ORANGE_SIGN = {w: 1536, h: 240, bg: '#FF6A13', fg: '#ffffff', size: 120, letter: .06};

  /* ================================================================ THE OVERHEAD GANTRY CRANE
     the runway beams are the hall's (pit-garage.js); here the bridge, its end trucks, the trolley with its hoist drum, the ropes, the
     hook block, the lifting beam and the spare V8 in its cradle. The bridge travels 5 m to 21 m down the hall, behind the car; the
     trolley stays on the far side of the bridge, clear of the car. */
  const runY = craneRunY(G), floorD = G.near - G.far, HOOK_Y = 4.6;
  const bridge = tag(mover(group(root, 'crane bridge', 13, 0, 0)), 'crane');
  { const P = Parts();
    for (const z of [G.far + .95, G.near - .95]) { P.add(M.black, placed(box(1.6, .7, .5), 0, runY + .35, z)); for (const dx of [-.5, .5]) P.add(M.rubber, placed(cyl(.18, .18, .2, 12), dx, runY + .35, z, Math.PI / 2)); }
    P.add(M.orange, placed(box(.7, 1.1, floorD - 2.6), 0, runY + .95, 0)).add(M.steel, placed(box(.9, .08, floorD - 2.8), 0, runY + 1.54, 0));
    P.build(bridge, 'crane bridge');
    signMesh('COATES · OVERHEAD CRANE', ORANGE_SIGN, 3.2, .5, bridge, -.36, runY + 1.0, 4.5, -Math.PI / 2);
    signMesh('COATES · OVERHEAD CRANE', ORANGE_SIGN, 3.2, .5, bridge, .36, runY + 1.0, -4.5, Math.PI / 2); }
  const trolley = mover(group(bridge, 'crane trolley', 0, 0, -4));
  { const P = Parts(); P.add(M.black, placed(box(1.4, .9, 1.6), 0, runY + .55, 0)).add(M.orange, placed(box(1.6, .12, .3), 0, runY + 1.05, 0)); P.build(trolley, 'crane trolley'); }
  /* the hoist drum, on its own shaft so it turns as the rope pays out: a steel drum with an orange flange at each end */
  const drum = mover(group(trolley, 'crane hoist drum', 0, runY + .55, .95));
  { const P = Parts(); P.add(M.steel, placed(cyl(.28, .28, 1.0, 16), 0, 0, 0, 0, 0, Math.PI / 2)); for (const x of [-.5, .5]) P.add(M.orange, placed(cyl(.36, .36, .05, 16), x, 0, 0, 0, 0, Math.PI / 2));
    P.add(M.black, placed(box(1.0, .06, .07), 0, .27, 0)); P.build(drum, 'crane hoist drum'); }
  /* the ropes: unit length, stretched to the hook every frame */
  const ropes = mover(group(trolley, 'crane ropes', 0, runY + .1, 0));
  { const P = Parts(); for (const dz of [-.3, .3]) P.add(M.steel, placed(box(.03, 1, .03), 0, -.5, dz)); P.build(ropes, 'crane ropes'); }
  const hook = mover(group(trolley, 'crane hook block', 0, HOOK_Y, 0));
  { const P = Parts(), beamY = -.95, ey = beamY - 1.45;
    P.add(M.black, placed(box(.5, .7, .3), 0, .3, 0)).add(M.steel, placed(new T.TorusGeometry(.22, .05, 10, 24, Math.PI * 1.5), 0, -.12, 0, 0, Math.PI / 2, Math.PI * .25));
    for (const dx of [-1.2, 1.2]) P.add(M.steel, strut([0, -.3, 0], [dx, beamY, 0], .04));
    P.add(M.orange, placed(box(2.9, .14, .14), 0, beamY, 0));
    for (const dx of [-1.0, 1.0]) P.add(M.steel, strut([dx, beamY - .07, 0], [dx * .55, beamY - .9, 0], .035));
    P.add(M.black, placed(box(1.1, .55, .7), 0, ey, 0)).add(M.alu, placed(box(1.0, .18, .34), 0, ey + .36, -.3, .45)).add(M.alu, placed(box(1.0, .18, .34), 0, ey + .36, .3, -.45))
     .add(M.steel, placed(box(.9, .3, .5), 0, ey - .42, 0)).add(M.steel, placed(cyl(.32, .36, .4, 16), .7, ey - .05, 0, 0, 0, Math.PI / 2)).add(M.orange, placed(box(1.5, .06, .9), 0, ey - .6, 0));
    for (let i = 0; i < 8; i++) P.add(M.alu, placed(cyl(.04, .04, .16, 8), -.42 + i * .12, ey + .55, i % 2 ? -.3 : .3, i % 2 ? -.45 : .45));
    P.build(hook, 'crane hook block');
    const crate = new T.Mesh(new T.PlaneGeometry(1.5, .28), new T.MeshBasicMaterial({map: sign('COATES · SPARE V8 · HANDLE WITH CARE', {w: 1536, h: 280, bg: '#FF6A13', fg: '#ffffff', size: 110, letter: .04})}));
    crate.position.set(0, ey - .78, .46); hook.add(crate); }

  /* ================================================================ THE TWO-POST LIFT, in the second bay behind the car */
  const LX = 16, LZ = -9.5;
  const liftRoot = tag(group(root, 'two-post lift', LX, 0, LZ), 'lift');
  stat.unit('lift');
  for (const s of [-1, 1]) { stat.add(M.orange, placed(box(.36, 4.2, .36), LX, 2.1, LZ + s * 1.4)).add(M.black, placed(box(.8, .04, .8), LX, .02, LZ + s * 1.4)).add(M.steel, placed(box(.06, 4.0, .12), LX + .2, 2.1, LZ + s * 1.4)); }
  stat.add(M.orange, placed(box(.3, .3, 3.2), LX, 4.35, LZ)).add(M.black, placed(box(.4, .6, .35), LX - .35, 1.1, LZ + 1.4 + .3)).add(M.hose, placed(cyl(.02, .02, 3.2, 8), LX - .25, 2.6, LZ + 1.6));
  blob(LX, LZ, 3.2, 4.0);
  signMesh('COATES · 2-POST LIFT', ORANGE_SIGN, 2.4, .38, liftRoot, -.19, 3.6, 1.4, -Math.PI / 2);
  const carriage = mover(group(liftRoot, 'lift carriage', 0, .15, 0));
  { const P = Parts();
    for (const s of [-1, 1]) { P.add(M.black, placed(box(.3, .5, .2), 0, .25, s * 1.12));
      for (const a of [-.55, .55]) { const len = 1.25, ang = a, x0 = 0, z0 = s * 1.12; const x1 = x0 - Math.sin(ang) * len, z1 = z0 - s * Math.cos(ang) * len * .5;
        P.add(M.steel, strut([x0, .05, z0], [x1, .05, z1], .1, .08)); P.add(M.rubber, placed(cyl(.08, .08, .08, 12), x1, .12, z1)); } }
    /* the gearbox on its cradle: an orange frame, a black case and a bellhousing */
    P.add(M.orange, placed(box(1.3, .08, 1.1), -.05, .22, 0)).add(M.black, placed(box(.9, .42, .46), -.05, .47, 0)).add(M.alu, placed(cyl(.28, .34, .3, 18), -.62, .47, 0, 0, 0, Math.PI / 2)).add(M.steel, placed(cyl(.05, .05, .3, 10), .52, .47, 0, 0, 0, Math.PI / 2));
    P.build(carriage, 'lift carriage'); }

  /* ================================================================ THE AIR COMPRESSOR, on the far wall behind the bench */
  const CX = 15.5, CZ = G.far + 1.4;
  stat.unit('compressor');
  stat.add(M.black, placed(box(2.4, .12, 1.0), CX, .06, CZ)).add(M.orange, placed(cyl(.45, .45, 2.2, 24), CX, .72, CZ, 0, 0, Math.PI / 2));
  for (const dx of [-.7, .7]) stat.add(M.black, placed(box(.2, .3, .9), CX + dx, .25, CZ));
  stat.add(M.black, placed(box(.55, .35, .42), CX - .3, 1.36, CZ)).add(M.steel, placed(cyl(.2, .2, .5, 16), CX + .55, 1.36, CZ, 0, 0, Math.PI / 2)).add(M.black, placed(box(.14, .5, .5), CX + .85, 1.36, CZ));
  for (const dx of [-.45, -.15]) { stat.add(M.alu, placed(cyl(.1, .1, .22, 16), CX + dx, 1.66, CZ)); for (let k = 0; k < 4; k++) stat.add(M.alu, placed(cyl(.125, .125, .015, 16), CX + dx, 1.58 + k * .05, CZ)); stat.add(M.steel, placed(box(.03, .3, .03), CX + dx - .07, 1.93, CZ)); stat.add(M.steel, placed(box(.03, .3, .03), CX + dx + .07, 1.93, CZ)); }
  stat.add(M.black, placed(box(.52, .06, .08), CX + .12, 1.36, CZ + .28)).add(M.red, placed(box(.12, .16, .1), CX + .9, .95, CZ + .45)).add(M.steel, placed(cyl(.03, .03, 1.9, 8), CX - 1.0, 2.3, CZ - .2));
  blob(CX, CZ, 3.0, 1.6);
  const flywheel = tag(mover(group(root, 'compressor flywheel', CX - .3, 1.36, CZ + .3)), 'compressor');
  { const P = Parts(); P.add(M.black, placed(new T.TorusGeometry(.26, .045, 8, 28), 0, 0, 0)); for (let k = 0; k < 5; k++) P.add(M.orange, placed(box(.03, .5, .025), 0, 0, 0, 0, 0, k * TAU / 5)); P.add(M.steel, placed(cyl(.05, .05, .06, 12), 0, 0, 0, Math.PI / 2)); P.build(flywheel, 'compressor flywheel'); }
  const pistons = [-.45, -.15].map((dx, i) => { const g = tag(mover(group(root, 'compressor piston rod ' + (i + 1), CX + dx, 1.9, CZ)), 'compressor'); const P = Parts(); P.add(M.alu, placed(cyl(.025, .025, .34, 10), 0, 0, 0)).add(M.steel, placed(box(.12, .03, .06), 0, .17, 0)); P.build(g, 'compressor piston rod'); return g; });
  const gauge = new T.Mesh(new T.CircleGeometry(.07, 24), white); gauge.position.set(CX + .85, 1.45, CZ + .256); gauge.name = 'compressor gauge face'; tag(gauge, 'compressor'); root.add(gauge);
  stat.add(M.black, placed(new T.TorusGeometry(.075, .01, 6, 24), CX + .85, 1.45, CZ + .253));
  const needle = tag(mover(group(root, 'compressor gauge needle', CX + .85, 1.45, CZ + .262)), 'compressor');
  { const n = new T.Mesh(box(.009, .06, .004), M.red); n.position.set(0, .025, 0); n.name = 'compressor gauge needle'; needle.add(n); }
  tag(signMesh('Coates', {w: 768, h: 260, bg: '#FF6A13', fg: '#ffffff', weight: 900, size: 190, letter: -.02}, .9, .3, root, CX + .6, .72, CZ + .455), 'compressor');

  /* ================================================================ THE PARTS WASHER and THE PEDESTAL DRILL, far wall, front of the hall */
  const WX = -19, WZ = G.far + .75;
  stat.unit('parts washer');
  stat.add(M.red, placed(box(1.2, .5, .7), WX, .95, WZ)).add(M.black, placed(box(1.24, .04, .74), WX, 1.21, WZ));
  for (const dx of [-.55, .55]) for (const dz of [-.3, .3]) stat.add(M.steel, placed(box(.05, .7, .05), WX + dx, .35, WZ + dz));
  stat.add(M.black, placed(cyl(.25, .25, .5, 18), WX, .25, WZ)).add(M.hose, placed(cyl(.015, .015, .6, 8), WX + .45, 1.5, WZ - .2, .3)).add(M.steel, placed(box(1.1, .3, .03), WX, 1.3, WZ - .36));
  blob(WX, WZ, 1.8, 1.2);
  const lid = tag(mover(group(root, 'parts washer lid', WX, 1.23, WZ - .35)), 'parts washer');
  { const P = Parts(); P.add(M.red, placed(box(1.22, .04, .72), 0, .02, .36)).add(M.steel, placed(box(.3, .03, .04), 0, .05, .7)); P.build(lid, 'parts washer lid'); }
  tag(signMesh('COATES · PARTS WASHER', {w: 1536, h: 240, bg: '#0d1216', fg: '#FF6A13', size: 120, letter: .06}, 1.1, .17, root, WX, .95, WZ + .355), 'parts washer');
  const DX = -16.5, DZ = G.far + .45;
  stat.unit('drill');
  stat.add(M.black, placed(box(.5, .06, .45), DX, .03, DZ)).add(M.steel, placed(cyl(.045, .045, 1.7, 14), DX, .88, DZ - .1)).add(M.orange, placed(box(.36, .03, .36), DX, .8, DZ + .1)).add(M.steel, placed(box(.08, .06, .18), DX, .78, DZ - .02))
   .add(M.orange, placed(box(.3, .3, .46), DX, 1.6, DZ)).add(M.black, placed(cyl(.1, .1, .28, 14), DX, 1.72, DZ - .3)).add(M.orange, placed(box(.34, .08, .52), DX, 1.8, DZ - .05)).add(M.alu, placed(box(.12, .05, .08), DX, .845, DZ + .12));
  blob(DX, DZ, .9, .8);
  const quill = tag(mover(group(root, 'drill quill', DX, 1.43, DZ + .13)), 'drill');
  const chuck = mover(group(quill, 'drill chuck', 0, 0, 0));
  { const P = Parts(); P.add(M.steel, placed(cyl(.03, .03, .12, 14), 0, 0, 0)); P.build(quill, 'drill quill');
    const C = Parts(); C.add(M.black, placed(cyl(.026, .02, .07, 12), 0, -.09, 0)).add(M.steel, placed(box(.01, .05, .056), 0, -.09, 0)).add(M.alu, placed(cyl(.005, .002, .12, 8), 0, -.18, 0)); C.build(chuck, 'drill chuck'); }
  const feed = tag(mover(group(root, 'drill feed handle', DX + .17, 1.55, DZ + .05)), 'drill');
  { const P = Parts(); for (let k = 0; k < 3; k++) { const a = k * TAU / 3; P.add(M.steel, placed(cyl(.008, .008, .22, 8), 0, Math.cos(a) * .11, Math.sin(a) * .11, a)); P.add(M.black, placed(new T.SphereGeometry(.02, 10, 8), 0, Math.cos(a) * .22, Math.sin(a) * .22)); } P.build(feed, 'drill feed handle'); }

  /* ================================================================ THE TYRE CHANGER and THE WHEEL BALANCER, by the slick racks */
  const TCX = -20, TCZ = G.near - 6;
  stat.unit('tyre changer');
  stat.add(M.black, placed(box(.9, .7, .65), TCX, .35, TCZ)).add(M.orange, placed(box(.92, .04, .67), TCX, .71, TCZ)).add(M.steel, placed(box(.12, 1.4, .12), TCX, 1.0, TCZ + .45)).add(M.steel, placed(box(.1, .1, .6), TCX, 1.66, TCZ + .2))
   .add(M.orange, placed(box(.08, .6, .08), TCX + .5, .5, TCZ - .1, 0, 0, -.5)).add(M.black, placed(box(.1, .03, .25), TCX - .25, .03, TCZ - .45));
  blob(TCX, TCZ, 1.6, 1.4);
  const turntable = tag(mover(group(root, 'tyre changer turntable', TCX, .74, TCZ)), 'tyre changer');
  { const P = Parts(); P.add(M.steel, placed(cyl(.3, .3, .04, 24), 0, 0, 0)); for (let k = 0; k < 4; k++) { const a = k * TAU / 4; P.add(M.orange, placed(box(.08, .06, .05), Math.cos(a) * .24, .04, Math.sin(a) * .24, 0, -a)); }
    P.add(M.rubber, placed(new T.TorusGeometry(.3, .1, 10, 28), 0, .17, 0, Math.PI / 2)).add(M.alu, placed(cyl(.21, .21, .18, 20), 0, .17, 0)); for (let k = 0; k < 5; k++) P.add(M.black, placed(box(.34, .02, .04), 0, .265, 0, 0, k * TAU / 5));
    P.build(turntable, 'tyre changer turntable'); }
  const head = tag(mover(group(root, 'tyre changer mount head', TCX, 1.62, TCZ - .05)), 'tyre changer');
  { const P = Parts(); P.add(M.steel, placed(box(.06, .5, .06), 0, -.25, 0)).add(M.black, placed(box(.12, .08, .1), 0, -.52, 0)); P.build(head, 'tyre changer mount head'); }
  tag(signMesh('COATES · TYRES', {w: 1536, h: 240, bg: '#0d1216', fg: '#FF6A13', size: 130, letter: .08}, .8, .13, root, TCX, .45, TCZ - .331, Math.PI), 'tyre changer');
  const BX = -16.5, BZ = G.near - 6;
  stat.unit('balancer');
  stat.add(M.black, placed(box(.7, .82, .55), BX, .41, BZ)).add(M.steel, placed(cyl(.03, .03, .4, 10), BX + .5, .95, BZ, 0, 0, Math.PI / 2)).add(M.orange, placed(box(.72, .04, .57), BX, .84, BZ));
  const balScreen = new T.Mesh(new T.PlaneGeometry(.4, .24), new T.MeshBasicMaterial({map: sign('COATES', {w: 512, h: 300, bg: '#0b1014', fg: '#FF6A13', size: 110, sub: 'BALANCE'})})); balScreen.position.set(BX - .05, 1.12, BZ - .2); balScreen.rotation.y = Math.PI; balScreen.name = 'balancer screen'; tag(balScreen, 'balancer'); root.add(balScreen);
  stat.add(M.black, placed(box(.46, .3, .06), BX - .05, 1.12, BZ - .17));
  blob(BX, BZ, 1.6, 1.2);
  const balWheel = tag(mover(group(root, 'balancer wheel', BX + .66, .95, BZ)), 'balancer');
  { const P = Parts(); P.add(M.rubber, placed(new T.TorusGeometry(.28, .09, 10, 28), 0, 0, 0, 0, Math.PI / 2)).add(M.alu, placed(cyl(.2, .2, .2, 20), 0, 0, 0, 0, 0, Math.PI / 2));
    for (let k = 0; k < 5; k++) P.add(M.black, placed(box(.03, .36, .04), .105, 0, 0, k * TAU / 5)); P.build(balWheel, 'balancer wheel'); }
  const hood = tag(mover(group(root, 'balancer hood', BX + .66, 1.02, BZ + .32)), 'balancer');
  { const P = Parts(); const g = new T.CylinderGeometry(.44, .44, .36, 20, 1, true, 0, Math.PI); P.add(M.orange, placed(g, 0, .1, -.32, 0, Math.PI / 2, Math.PI / 2)); P.build(hood, 'balancer hood'); }

  /* ================================================================ THE TYRE CAROUSEL: ten tyres on a vertical loop in the near-front corner */
  const KX = -23.5, KZ = G.near - .75, R = .9, Y0 = 1.5, Y1 = 5.0, N = 10, LEN = 2 * (Y1 - Y0) + TAU * R;
  stat.unit('carousel');
  stat.add(M.orange, placed(box(3.4, .3, 1.2), KX, .15, KZ)).add(M.black, placed(box(3.2, .2, .4), KX, 6.45, KZ + .2));
  for (const s of [-1, 1]) stat.add(M.steel, placed(box(.14, 6.4, .14), KX + s * 1.5, 3.2, KZ + .35)).add(M.steel, placed(box(.12, 6.2, .5), KX + s * 1.5, 3.2, KZ + .1));
  { const pts = []; for (let i = 0; i <= 96; i++) { const s = i / 96 * LEN; pts.push(loopAt(s)); } const c = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(KX + p[0], p[1], KZ + .3)), true); stat.add(M.black, new T.TubeGeometry(c, 120, .03, 6, true)); }
  function loopAt(s) { s = ((s % LEN) + LEN) % LEN; const st = Y1 - Y0, arc = Math.PI * R;
    if (s < st) return [R, Y0 + s]; s -= st; if (s < arc) { const a = s / R; return [R * Math.cos(a), Y1 + R * Math.sin(a)]; } s -= arc;
    if (s < st) return [-R, Y1 - s]; s -= st; const a = Math.PI + s / R; return [R * Math.cos(a), Y0 + R * Math.sin(a)]; }
  const sprockets = [Y0, Y1].map((y, i) => { const g = tag(mover(group(root, 'carousel sprocket ' + (i ? 'top' : 'bottom'), KX, y, KZ + .3)), 'carousel'); const P = Parts(); P.add(M.steel, placed(cyl(.25, .25, .06, 16), 0, 0, 0, Math.PI / 2)); for (let k = 0; k < 4; k++) P.add(M.orange, placed(box(.46, .05, .07), 0, 0, 0, 0, 0, k * Math.PI / 4)); P.build(g, 'carousel sprocket'); return g; });
  const tyres = mover(new T.InstancedMesh(new T.TorusGeometry(.26, .1, 10, 24), M.rubber, N)), rims = mover(new T.InstancedMesh(cyl(.17, .17, .22, 16).rotateX(Math.PI / 2), M.alu, N)), arms = mover(new T.InstancedMesh(box(.06, .06, .5), M.steel, N));
  tyres.name = 'carousel tyres'; rims.name = 'carousel rims'; arms.name = 'carousel carriers'; for (const o of [tyres, rims, arms]) tag(o, 'carousel'); root.add(tyres, rims, arms);
  tag(signMesh('PIT 26 · TYRES', {w: 1536, h: 240, bg: '#FF6A13', fg: '#ffffff', size: 130, letter: .08}, 1.7, .26, root, KX, .16, KZ - .61, Math.PI), 'carousel');

  /* ================================================================ THE EXTRACTION FANS: eight in the walls, four in the roof */
  const fanAt = [];
  stat.unit('fans');
  for (const z of [-13, 13]) fanAt.push([G.front + .25, 9.2, z, 0, Math.PI / 2, 0]);
  for (const z of [-14, 15]) fanAt.push([G.back - .25, 9.6, z, 0, -Math.PI / 2, 0]);
  for (const x of [-12, 19]) fanAt.push([x, 7.0, G.near - .25, 0, Math.PI, 0]);
  for (const x of [-18, 6]) fanAt.push([x, 7.0, G.far + .25, 0, 0, 0]);
  for (const [x, z] of [[-10, -9], [-10, 7], [10, -9], [10, 7]]) fanAt.push([x, G.height - .25, z, Math.PI / 2, 0, 0]);
  for (const [x, y, z, rx, ry] of fanAt) { const q = new T.Quaternion().setFromEuler(new T.Euler(rx, ry, 0)), put = g => g.applyQuaternion(q).translate(x, y, z);
    stat.add(M.black, put(new T.TorusGeometry(1.1, .09, 8, 40))).add(M.steel, put(new T.RingGeometry(1.15, 1.45, 4, 1, Math.PI / 4).scale(1, 1, 1)));
    for (const r of [.4, .75]) stat.add(M.black, put(new T.TorusGeometry(r, .012, 4, 32).translate(0, 0, .12)));
    stat.add(M.black, put(box(2.1, .02, .02).translate(0, 0, .12))).add(M.black, put(box(.02, 2.1, .02).translate(0, 0, .12))); }
  const bladeGeo = (() => { const g = []; for (let k = 0; k < 5; k++) g.push(placed(box(.26, .95, .025), 0, 0, 0, 0, .45, 0).translate(0, .52, 0).applyMatrix4(new T.Matrix4().makeRotationZ(k * TAU / 5))); g.push(placed(cyl(.14, .14, .16, 14), 0, 0, 0, Math.PI / 2)); return mergeGeometries(g.map(x => x.index ? x.toNonIndexed() : x), false); })();
  const blades = mover(new T.InstancedMesh(bladeGeo, M.alu, fanAt.length)); blades.name = 'extraction fan blades'; tag(blades, 'fans'); root.add(blades);
  const fanQ = fanAt.map(([, , , rx, ry]) => new T.Quaternion().setFromEuler(new T.Euler(rx, ry, 0)));

  /* ================================================================ THE BEACONS: amber, turning; one rides the crane */
  const beaconAt = [[() => [bridge.position.x - .47, runY + 1.0, 2.0]], [() => [LX, 4.62, LZ + 1.4]], [() => [KX, 6.7, KZ + .2]], [() => [CX + .9, 1.15, CZ + .45]], [() => [G.front + .35, G.lintel + .45, G.doorNear + .7]], [() => [G.front + .35, G.lintel + .45, G.doorFar - .7]]];
  const domes = mover(new T.InstancedMesh(new T.SphereGeometry(.13, 14, 10, 0, TAU, 0, Math.PI / 2), beaconDome, beaconAt.length)), fins = mover(new T.InstancedMesh(box(.2, .1, .03), beaconAmber, beaconAt.length)), bases = new T.InstancedMesh(cyl(.13, .14, .08, 14), M.black, beaconAt.length);
  domes.name = 'beacon domes'; fins.name = 'beacon reflectors'; bases.name = 'beacon bases'; domes.renderOrder = 6; for (const o of [domes, fins, bases]) tag(o, 'beacons'); root.add(domes, fins, bases);

  /* ================================================================ THE HOSE REELS on the far wall: they pay out and wind in */
  const reelAt = [-7.5, 4.3, 12.8].map(x => [x, 1.9, G.far + .2]);
  const drums = mover(new T.InstancedMesh(cyl(.3, .3, .16, 20).rotateX(Math.PI / 2), M.orange, reelAt.length));
  const hubs = mover(new T.InstancedMesh((() => { const g = [cyl(.1, .1, .18, 12).rotateX(Math.PI / 2)]; for (let k = 0; k < 3; k++) g.push(box(.04, .5, .02).translate(0, 0, .085).applyMatrix4(new T.Matrix4().makeRotationZ(k * TAU / 3))); return mergeGeometries(g.map(x => x.index ? x.toNonIndexed() : x), false); })(), M.black, reelAt.length));
  drums.name = 'hose reel drums'; hubs.name = 'hose reel hubs'; tag(drums, 'reels'); tag(hubs, 'reels'); root.add(drums, hubs);

  /* ================================================================ THE HALL SYSTEMS BOARD, on the far wall over the compressor */
  const boardCanvas = document.createElement('canvas'); boardCanvas.width = 1024; boardCanvas.height = 576;
  const boardTex = new T.CanvasTexture(boardCanvas); boardTex.colorSpace = T.SRGBColorSpace; boardTex.anisotropy = 4;
  const board = new T.Mesh(new T.PlaneGeometry(4.8, 2.7), new T.MeshBasicMaterial({map: boardTex})); board.position.set(15.5, 6.3, G.far + .14); board.name = 'hall systems board'; tag(board, 'wall board'); root.add(board);
  stat.unit('wall board').add(M.black, placed(box(5.0, 2.9, .08), 15.5, 6.3, G.far + .08));

  /* ================================================================ MORE OF THE BUILDING: racking, the air line, trays, bollards, the side door */
  const crateAt = [];
  stat.unit('racking');
  for (const [z0, z1] of [[-19.5, -11], [9, 17.5]]) { const bays = 3, bw = (z1 - z0) / bays;
    for (let b = 0; b <= bays; b++) stat.add(M.orange, placed(box(.08, 4.6, .08), G.front + .25, 2.3, z0 + b * bw)).add(M.orange, placed(box(.08, 4.6, .08), G.front + 1.25, 2.3, z0 + b * bw));
    for (const y of [.12, 1.6, 3.1, 4.5]) for (const x of [.25, 1.25]) stat.add(M.orange, placed(box(.07, .12, z1 - z0), G.front + x, y, (z0 + z1) / 2));
    for (let b = 0; b < bays; b++) for (const y of [.18, 1.66, 3.16]) for (let k = 0; k < 2; k++) crateAt.push([G.front + .75, y + .36, z0 + b * bw + (k + .5) * bw / 2, (b + k + Math.round(y)) % 2]); }
  const crateGeo = box(.9, .7, 1.15);
  const cratesO = new T.InstancedMesh(crateGeo, M.orange, crateAt.filter(c => c[3] === 0).length), cratesB = new T.InstancedMesh(crateGeo, M.black, crateAt.filter(c => c[3] === 1).length);
  { const m = new T.Matrix4(); let i = 0, j = 0; for (const [x, y, z, k] of crateAt) { m.makeTranslation(x, y, z); if (k === 0) cratesO.setMatrixAt(i++, m); else cratesB.setMatrixAt(j++, m); } }
  cratesO.name = 'racking crates'; cratesB.name = 'racking crates'; tag(cratesO, 'racking'); tag(cratesB, 'racking'); root.add(cratesO, cratesB);
  tag(signMesh('COATES · INDUSTRIAL SOLUTIONS', {w: 1536, h: 240, bg: '#0d1216', fg: '#f3f4f2', size: 110, letter: .08}, 5.6, .5, root, G.front + .06, 5.3, -15.25, Math.PI / 2), 'racking');
  tag(signMesh('GC500 2026 · SURFERS PARADISE', {w: 1536, h: 240, bg: '#0d1216', fg: '#FF6A13', size: 110, letter: .08}, 5.6, .5, root, G.front + .06, 5.3, 13.25, Math.PI / 2), 'racking');
  /* the compressed-air line along the far wall at 3.2 m, a drop every six metres with its coupler, and its run down to the compressor */
  stat.unit('shell').add(M.steel, placed(cyl(.035, .035, G.back - G.front - 1, 10), 0, 4.55, G.far + .18, 0, 0, Math.PI / 2));
  for (const x of [-18, -12, 12, 18.5]) stat.add(M.steel, placed(cyl(.02, .02, 1.8, 8), x, 3.65, G.far + .18)).add(M.orange, placed(box(.08, .1, .08), x, 2.7, G.far + .18));
  stat.add(M.steel, placed(cyl(.03, .03, 3.1, 8), CX - 1.0, 3.0, G.far + .18));
  /* cable trays under the roof steel */
  for (const z of [-6, 6]) { stat.add(M.black, placed(box(G.back - G.front - 2, .06, .5), 0, G.height - 1.1, z)); for (const s of [-1, 1]) stat.add(M.black, placed(box(G.back - G.front - 2, .12, .03), 0, G.height - 1.05, z + s * .25)); }
  /* yellow bollards either side of the roller door, and the side door beside it */
  stat.unit('bollards');
  for (const z of [-7.2, -6.6, 6.6, 7.2]) stat.add(M.yellow, placed(cyl(.1, .1, 1.0, 12), G.front + 1.2, .5, z)).add(M.black, placed(cyl(.105, .105, .08, 12), G.front + 1.2, .75, z));
  stat.unit('shell').add(M.steel, placed(box(.08, 2.15, 1.05), G.front + .06, 1.075, -9.4)).add(M.orange, placed(box(.1, 2.3, .08), G.front + .07, 1.15, -9.96)).add(M.orange, placed(box(.1, 2.3, .08), G.front + .07, 1.15, -8.84)).add(M.orange, placed(box(.1, .08, 1.2), G.front + .07, 2.28, -9.4)).add(M.steel, placed(box(.06, .06, .8), G.front + .14, 1.05, -9.4));

  stat.build(root, 'hall machinery, fixed');

  /* ================================================================ THE CLOCK. Every machine is a function of its own clock, so a slow frame
     only means a bigger step; the compressor alone keeps state (its pressure), because a compressor does. */
  const m4 = new T.Matrix4(), q4 = new T.Quaternion(), qz = new T.Quaternion(), p4 = new T.Vector3(), s4 = new T.Vector3(1, 1, 1), Z = new T.Vector3(0, 0, 1);
  let boardAt = 1;
  function tick(dt, d = {}) {
    dt = Math.max(0, Math.min(.25, dt || 0)); const t = S.t += dt; S.running = !!d.running;
    /* the crane: the bridge down the hall and back in 84 s, the trolley across in 31 s, the hook up and down in 19 s; the drum turns with the rope */
    const bx = 13 + 8 * Math.sin(t * TAU / 84), tz = -4 + 1.5 * Math.sin(t * TAU / 31 + 1), hy = HOOK_Y + .6 * Math.sin(t * TAU / 19);
    bridge.position.x = bx; trolley.position.z = tz; hook.position.y = hy; drum.rotation.x = (HOOK_Y - hy) / .28; const L = runY + .1 - (hy + .5); ropes.scale.y = Math.max(.1, L);
    S.crane = {x: bx, z: tz, hook: hy};
    /* the lift: up in 9 s, holds 7, down in 9, waits 7 */
    const lc = t % 32, u = lc < 9 ? smooth(lc / 9) : lc < 16 ? 1 : lc < 25 ? 1 - smooth((lc - 16) / 9) : 0; carriage.position.y = .15 + 1.65 * u; S.lift = u; S.liftMoving = (lc < 9 || (lc >= 16 && lc < 25));
    /* the compressor: runs to 8.5 bar and unloads, bleeds down to 6.5 and cuts back in */
    const C = S.comp; if (C.run) { C.p += dt * .13; if (C.p >= 8.5) { C.run = false; C.relayAt = t; } } else { C.p -= dt * .07; if (C.p <= 6.5) { C.run = true; C.relayAt = t; } }
    C.omega = (C.omega || 0) + ((C.run ? 14 : 0) - (C.omega || 0)) * Math.min(1, dt * (C.run ? 2 : .8)); C.theta += C.omega * dt;
    flywheel.rotation.z = C.theta; pistons.forEach((g, i) => { g.position.y = 1.9 + .05 * Math.sin(C.theta + i * Math.PI); }); needle.rotation.z = 2.2 - (C.p / 10) * 4.4;
    /* the parts washer's lid: open for six seconds in twenty */
    const wc = t % 20; S.washer = wc < 2 ? smooth(wc / 2) : wc < 8 ? 1 : wc < 10 ? 1 - smooth((wc - 8) / 2) : 0; lid.rotation.x = -1.45 * S.washer;
    /* the drill runs; its quill feeds down 3 s, back 1.5 s, rests 3 s; the feed handle turns with the quill */
    S.drill.spin += dt * 30; const dc = t % 7.5, depth = dc < 3 ? smooth(dc / 3) : dc < 4.5 ? 1 - smooth((dc - 3) / 1.5) : 0; S.drill.depth = depth;
    quill.position.y = 1.43 - .09 * depth; chuck.rotation.y = S.drill.spin; feed.rotation.x = depth * 2.2;
    /* the tyre changer turns its wheel under the head, which comes down onto the bead every ten seconds */
    S.changer += dt * 1.3; turntable.rotation.y = S.changer; const hc = t % 10; head.position.y = 1.62 - .12 * (hc < 2 ? smooth(hc / 2) : hc < 6 ? 1 : hc < 7.5 ? 1 - smooth((hc - 6) / 1.5) : 0);
    /* the balancer: hood down, spin up, run, brake, hood up, rest — a fourteen-second cycle */
    const B = S.balancer, bc = t % 14; B.hood = bc < 1 ? smooth(bc) : bc < 8.5 ? 1 : bc < 9.5 ? 1 - smooth(bc - 8.5) : 0;
    const wantOmega = bc > 1 && bc < 6 ? 38 : 0; B.omega += (wantOmega - B.omega) * Math.min(1, dt * (wantOmega ? 1.4 : 2.2)); B.angle = (B.angle || 0) + B.omega * dt;
    balWheel.rotation.x = B.angle; hood.rotation.x = 1.35 * (1 - B.hood);
    /* the carousel: 0.25 m a second round its loop, the sprockets turning with the chain */
    S.carousel += dt * .25; for (let i = 0; i < N; i++) { const [x, y] = loopAt(S.carousel + i * LEN / N); p4.set(KX + x, y, KZ - .12); m4.makeTranslation(p4.x, p4.y, p4.z); tyres.setMatrixAt(i, m4); rims.setMatrixAt(i, m4); m4.makeTranslation(p4.x, p4.y, KZ + .12); arms.setMatrixAt(i, m4); }
    tyres.instanceMatrix.needsUpdate = rims.instanceMatrix.needsUpdate = arms.instanceMatrix.needsUpdate = true; sprockets.forEach(g => { g.rotation.z = -S.carousel / .25; });
    /* the fans: faster while the V8 runs — the extraction takes the heat and the fumes */
    S.fanOmega += ((S.running ? 11 : 5) - S.fanOmega) * Math.min(1, dt * .6); S.fans += S.fanOmega * dt;
    fanAt.forEach(([x, y, z], i) => { q4.copy(fanQ[i]).multiply(qz.setFromAxisAngle(Z, S.fans * (i % 2 ? 1 : -1) + i)); m4.compose(p4.set(x, y, z), q4, s4); blades.setMatrixAt(i, m4); }); blades.instanceMatrix.needsUpdate = true;
    /* the beacons turn one and a half times a second */
    beaconAt.forEach(([at], i) => { const [x, y, z] = at(); m4.compose(p4.set(x, y, z), q4.identity(), s4); domes.setMatrixAt(i, m4); m4.compose(p4.set(x, y - .04, z), q4.identity(), s4); bases.setMatrixAt(i, m4); m4.compose(p4.set(x, y + .05, z), q4.setFromAxisAngle(new T.Vector3(0, 1, 0), t * TAU * 1.5 + i), s4); fins.setMatrixAt(i, m4); });
    domes.instanceMatrix.needsUpdate = fins.instanceMatrix.needsUpdate = bases.instanceMatrix.needsUpdate = true;
    /* the reels: out and in over fourteen seconds, each on its own phase */
    reelAt.forEach(([x, y, z], i) => { m4.compose(p4.set(x, y, z), q4.setFromAxisAngle(Z, 2.6 * Math.sin(t * TAU / 14 + i * 2.1)), s4); drums.setMatrixAt(i, m4); m4.compose(p4.set(x, y, z + .02), q4, s4); hubs.setMatrixAt(i, m4); }); drums.instanceMatrix.needsUpdate = hubs.instanceMatrix.needsUpdate = true;
    /* the board, three times a second */
    boardAt += dt; if (boardAt > .33 && (!d.frustum || d.frustum.intersectsObject(board))) { boardAt = 0;   /* v6.99: only while the board is in view */ drawBoard(boardCanvas.getContext('2d'), boardCanvas.width, boardCanvas.height, S, d); boardTex.needsUpdate = true; }
  }
  /* a harness can ask which machines moved: a number per mover from its world transform or its instances */
  function snapshot() { root.updateMatrixWorld(true); return movers.map(o => { let h = 0; const a = o.isInstancedMesh ? o.instanceMatrix.array : o.matrixWorld.elements; for (let i = 0; i < a.length; i++) h += a[i] * ((i % 7) + 1); return +h.toFixed(6); }); }
  tick(0, {});
  return {group: root, tick, movers, snapshot, state: S, crane: {bridge, trolley, hook}, board};
}

/* the board: each machine's own state, drawn */
function drawBoard(g, W, H, S, d) {
  g.fillStyle = '#0b1014'; g.fillRect(0, 0, W, H); g.fillStyle = '#FF6A13'; g.fillRect(0, 0, W, 8);
  const text = (s, x, y, size, col, align = 'left', weight = 700) => { g.fillStyle = col; g.font = `${weight} ${size}px Arial, Helvetica, sans-serif`; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); };
  text('PIT 26 · HALL SYSTEMS', 36, 48, 40, '#f3f4f2', 'left', 800); text('COATES · INDUSTRIAL SOLUTIONS', W - 36, 48, 22, '#FF6A13', 'right', 700);
  const row = (i, name, val, frac, on) => { const y = 112 + i * 52; g.fillStyle = on ? '#2ec46a' : '#3a434a'; g.beginPath(); g.arc(46, y, 9, 0, Math.PI * 2); g.fill(); text(name, 68, y, 24, '#c9d1d6', 'left', 700); text(val, 560, y, 24, '#f3f4f2', 'right', 700);
    g.fillStyle = '#161d22'; g.fillRect(590, y - 9, 390, 18); g.fillStyle = on ? '#FF6A13' : '#5a646b'; g.fillRect(590, y - 9, 390 * Math.max(0, Math.min(1, frac)), 18); };
  const C = S.comp, B = S.balancer;
  row(0, 'OVERHEAD CRANE', `BRIDGE ${S.crane.x.toFixed(1)} m · HOOK ${S.crane.hook.toFixed(2)} m`, (S.crane.x - 5) / 16, true);
  row(1, '2-POST LIFT', `${(S.lift * 1.65).toFixed(2)} m · ${S.liftMoving ? 'MOVING' : S.lift > .5 ? 'UP · LOCKED' : 'DOWN'}`, S.lift, S.liftMoving);
  row(2, 'AIR COMPRESSOR', `${C.p.toFixed(1)} bar · ${C.run ? 'RUNNING' : 'UNLOADED'}`, (C.p - 6) / 3, C.run);
  row(3, 'EXTRACTION FANS', `12 · ${Math.round(S.fanOmega * 60 / (Math.PI * 2))} rpm${S.running ? ' · V8 RUNNING' : ''}`, S.fanOmega / 11, true);
  row(4, 'TYRE CAROUSEL', `${(S.carousel % 12.85).toFixed(1)} m of 12.9`, (S.carousel % 12.85) / 12.85, true);
  row(5, 'WHEEL BALANCER', `${Math.round(B.omega * 60 / (Math.PI * 2))} rpm · HOOD ${B.hood > .5 ? 'DOWN' : 'UP'}`, B.omega / 38, B.omega > 1);
  row(6, 'PARTS WASHER · DRILL', `LID ${S.washer > .5 ? 'OPEN' : 'SHUT'} · QUILL ${Math.round(S.drill.depth * 90)} mm`, S.drill.depth, S.washer > .05 || S.drill.depth > .02);
  text('GC500 2026 · SURFERS PARADISE', 36, H - 30, 20, '#9aa3a8', 'left', 700); text(d && d.running ? `V8 RUNNING · ${Math.round(d.rpm || 0)} RPM INSPECTION DRIVE` : 'V8 STOPPED · ROLLER DOOR SHUT', W - 36, H - 30, 20, '#FF6A13', 'right', 700);
}
