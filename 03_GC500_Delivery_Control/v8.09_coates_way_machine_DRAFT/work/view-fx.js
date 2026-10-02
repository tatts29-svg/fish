/* v5.85 — NOTHING BLOCKS THE VIEW, AND THE WHEELS LOOK FAST (Andrew Fisher, 26 Sep 2026: "when we move around nothing blocks
   the visual view … we need to see the wheels running at high speed when we throttle it").

   (v5.85's buildOcclusion, the few rays to the orbit target and the 13 % ghost, is replaced by buildClearView below: v6.99.)

   buildWheelBlur: a spinning rear wheel past a few turns a second is a blur to the eye, not a set of spokes; a disc on each
   face of each rear wheel, a radial smear of the rim, fades in with the wheel's speed. */
/* v6.99 — THE CLEAR VIEW. Andrew Fisher, 27 Sep 2026: "full view always nothing blocking when u look in every angle".
   buildOcclusion (v5.85) cast four rays from the eye to the orbit target, five times a second, against every triangle of the hall and
   the crew (a skinned figure is re-posed on the processor for every triangle a ray is tested against), and left what it hit as a
   13 % ghost. It missed whatever stood in front of the car's nose, tail or roof — the rays only went to the middle — and it cost a
   long frame every fifth of a second.
   buildClearView tests the hall by its UNITS (pit-garage.js / pit-machinery.js: the transporter, the mezzanine, the console, each
   machine, each person ...) with nothing but boxes: each unit's box, grown by `margin`, against the segments from the camera to a
   lattice of points over the whole car's box. Any unit such a segment passes through is in the way: it fades out in 0.12 s and is
   then put on a layer the camera, the shadow camera and the picking ray do not see; it comes back (0.25 s) once it is clear.
   Units marked fixed — the building's shell, the floor, the door, what the car stands on — are never tested and never hidden.
   Every frame, a few thousand box tests: well under a millisecond. */
import {print} from './fx-quality.js';
export const HIDDEN_LAYER = 30;
export function collectUnits(T, roots, {fixed = new Set(), dynamic = () => false, floorY = .05} = {}) {
  const units = new Map(), box = new T.Box3();
  const add = (o, name) => { let u = units.get(name); if (!u) { u = {name, objects: [], meshes: [], all: [], fixed: fixed.has(name), dynamic: false, box: new T.Box3(), alpha: 1, target: 1, hidden: false, clones: null}; units.set(name, u); } u.objects.push(o); u.dynamic = u.dynamic || dynamic(o); };
  for (const {root, children} of roots) for (const c of (children || root.children)) { if (c.isLight || (c.isObject3D && !c.isMesh && !c.isGroup && !c.isPoints && !c.isInstancedMesh && !c.isSkinnedMesh && !c.children.length)) continue;
    add(c, c.userData.unit || c.name || c.uuid); }
  for (const u of units.values()) {
    for (const o of u.objects) o.traverse(m => { if (!(m.isMesh || m.isPoints)) return; u.all.push(m); const mat = Array.isArray(m.material) ? m.material[0] : m.material; if (m.isMesh && mat && mat.visible !== false) u.meshes.push(m); });
    measure(T, u, box);
    if (!u.meshes.length || u.box.isEmpty() || u.box.max.y < floorY) u.fixed = true;   /* nothing to see, or paint on the floor: never between an eye above the floor and the car */
  }
  return [...units.values()];
}
function measure(T, u, box) { u.box.makeEmpty(); for (const m of u.meshes) { if (!m.geometry) continue; box.setFromObject(m); u.box.union(box); } }
export function buildClearView(T, {camera, units, carBox, enabled = () => true, keep = () => false, margin = .32, grid = [13, 6, 7]}) {
  const pts = [], view = new T.Box3(), tmp = new T.Box3(), grown = new T.Box3(), carKey = new Float64Array(6).fill(NaN);
  const live = units.filter(u => !u.fixed);
  /* the lattice over the car's box, rebuilt only when the box has moved by a centimetre (no strings or arrays made per frame) */
  function lattice(b) { const k = [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]; let same = true; for (let i = 0; i < 6; i++) if (!(Math.abs(k[i] - carKey[i]) < .01)) { same = false; carKey[i] = k[i]; }
    if (same) return; pts.length = 0; const [nx, ny, nz] = grid;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k2 = 0; k2 < nz; k2++) { if (i > 0 && i < nx - 1 && j > 0 && j < ny - 1 && k2 > 0 && k2 < nz - 1) continue;
      pts.push(b.min.x + (b.max.x - b.min.x) * i / (nx - 1), b.min.y + (b.max.y - b.min.y) * j / (ny - 1), b.min.z + (b.max.z - b.min.z) * k2 / (nz - 1)); } }
  /* does the segment from e to (px,py,pz) pass through box b? (slabs; no allocation — it runs a few thousand times a frame) */
  function slab(o, d, mn, mx, t) { if (Math.abs(d) < 1e-9) return o < mn || o > mx ? null : t; let ta = (mn - o) / d, tb = (mx - o) / d; if (ta > tb) { const s = ta; ta = tb; tb = s; } if (ta > t[0]) t[0] = ta; if (tb < t[1]) t[1] = tb; return t[0] > t[1] ? null : t; }
  const tt = [0, 1];
  function segHits(e, px, py, pz, b) { tt[0] = 0; tt[1] = 1;
    return slab(e.x, px - e.x, b.min.x, b.max.x, tt) !== null && slab(e.y, py - e.y, b.min.y, b.max.y, tt) !== null && slab(e.z, pz - e.z, b.min.z, b.max.z, tt) !== null; }
  let version = 0;   /* changes whenever a unit is hidden or shown: the shadow map is redrawn then (a person taken out of the way takes his shadow with him) */
  function setHidden(u, h) { if (u.hidden === h) return; u.hidden = h; version++; for (const m of u.all) { if (h) { m.layers.disable(0); m.layers.enable(HIDDEN_LAYER); } else { m.layers.enable(0); m.layers.disable(HIDDEN_LAYER); } } }
  /* the see-through copies of a unit's materials are made once and kept (warm() below has their shaders compiled at load), so a fade never
     waits on a new shader: a transparent material is a different shader from its solid original, and building one mid-orbit is a hitch */
  function prepare(u) { u.fades = u.meshes.map(m => { const orig = m.material, list = Array.isArray(orig) ? orig : [orig]; const c = list.map(x => { const k = x.clone(); k.transparent = true; k.depthWrite = false; return k; }); return {m, orig, c, base: list.map(x => x.opacity ?? 1)}; }); }
  function fadeMats(u, on) {
    if (on && !u.clones) { if (!u.fades || u.fades.some(f => f.m.material !== f.orig)) prepare(u); u.clones = u.fades; for (const {m, orig, c} of u.clones) m.material = Array.isArray(orig) ? c : c[0]; }
    if (!on && u.clones) { for (const {m, orig} of u.clones) m.material = orig; u.clones = null; } }
  const api = {
    units, hidden: () => units.filter(u => u.hidden || u.alpha < 1).map(u => u.name),
    get blockedCount() { return units.filter(u => u.target < 1).length; },
    get version() { return version; },
    /* have the see-through shaders compiled now, at load, off the critical path (the browser compiles them in parallel where it can) */
    warm(renderer, scene) { let n = 0; for (const u of live) { if (!u.meshes.length) continue; fadeMats(u, true); for (const {c, base} of u.clones) c.forEach((k, i) => { k.opacity = base[i]; });
        try { for (const o of u.objects) renderer.compile(o, camera, scene); n++; } catch (e) {} fadeMats(u, false); } return n; },
    /* the units in the way now, for the harness */
    check() { const on = enabled(), eye = camera.position, car = carBox(); if (on && car && !car.isEmpty()) { lattice(car);
        view.copy(car).expandByPoint(eye).expandByScalar(margin);
        for (const u of live) { if (u.dynamic) measure(T, u, tmp); let blocked = false; const k = on ? keep(u) : false;
          if (on && k !== true && !u.box.isEmpty() && u.box.intersectsBox(view)) { grown.copy(u.box).expandByScalar(margin);
            for (let i = 0; i < pts.length && !blocked; i += 3) blocked = segHits(eye, pts[i], pts[i + 1], pts[i + 2], grown); }
          /* v7.00: keep(u) may give a number instead of true: in the way, the unit fades to that share and stays (a person at work at the car) */
          u.target = blocked ? (typeof k === 'number' ? k : 0) : 1; } }
      else for (const u of live) u.target = 1; },
    update(dt) { api.check();
      for (const u of live) { if (u.alpha === u.target) { if (u.alpha >= 1 && u.clones) fadeMats(u, false); continue; }
        if (u.target < u.alpha) { u.alpha = Math.max(u.target, u.alpha - dt / .12); if (u.alpha <= 0) { setHidden(u, true); continue; } }
        else { if (u.hidden) setHidden(u, false); u.alpha = Math.min(u.target, u.alpha + dt / .25); if (u.alpha >= 1) { fadeMats(u, false); continue; } }
        fadeMats(u, true); for (const {c, base} of u.clones) c.forEach((k, i) => { k.opacity = base[i] * u.alpha; }); } },
    /* everything back, at once (the cockpit: the driver sees what is there) */
    restore() { for (const u of live) { u.target = 1; u.alpha = 1; setHidden(u, false); fadeMats(u, false); } }
  };
  return api;
}
/* v8.09 — a print (fx-quality.js): drawn at 256 px on load and at up to 512 on the higher rungs; the streaks come from a fixed seed so
   every redraw is the same picture */
function blurTexture(T) {
  return print(256, 256, drawBlur, {mode: 'logical', name: 'wheel blur'}).texture;
}
function drawBlur(g) {
  const cx = 128; let seed = 2626; const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let r = 128; r > 0; r--) { const u = r / 128;
    let col = u > .9 ? [205, 210, 214, .96] : u > .84 ? [120, 126, 132, .93] : u > .26 ? [150 + 20 * Math.sin(u * 60), 156 + 20 * Math.sin(u * 60), 162 + 20 * Math.sin(u * 60), .88] : u > .16 ? [70, 74, 78, .95] : [36, 38, 41, .97];
    g.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${col[3]})`; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.fill(); }
  /* a faint streak ring where the spokes were */
  g.globalAlpha = .18; g.strokeStyle = '#ffffff'; for (let k = 0; k < 24; k++) { g.lineWidth = 1 + rnd() * 2; g.beginPath(); g.arc(cx, cx, 40 + rnd() * 64, 0, Math.PI * 2); g.stroke(); }
  g.globalAlpha = 1;
}
export function buildWheelBlur(T, wheels) {
  const tex = blurTexture(T), mats = [];
  for (const w of wheels || []) {
    if (!/REAR/.test(w.userData.id || '')) continue; const rotor = w.getObjectByName('Wheel rotor'); if (!rotor) continue;
    rotor.updateWorldMatrix(true, true); const inv = new T.Matrix4().copy(rotor.matrixWorld).invert(), box = new T.Box3(), b = new T.Box3();
    rotor.traverse(o => { if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).applyMatrix4(inv); box.union(b); } });
    if (box.isEmpty()) continue;
    const R = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.y), Math.abs(box.max.y));
    const mat = new T.MeshStandardMaterial({map: tex, transparent: true, opacity: 0, depthWrite: false, metalness: .55, roughness: .42}); mat.visible = false;
    for (const [z, flip] of [[box.max.z + .004, false], [box.min.z - .004, true]]) { const d = new T.Mesh(new T.CircleGeometry(R * .74, 40), mat); d.position.set(0, 0, z); if (flip) d.rotation.y = Math.PI; d.name = 'Wheel speed blur'; d.renderOrder = 4; rotor.add(d); }
    mats.push(mat);
  }
  return {count: mats.length, update(spin) { const k = Math.max(0, Math.min(1, (Math.abs(spin) - 7) / 18)); for (const m of mats) { m.opacity = k * .9; m.visible = k > .01; } }};
}
