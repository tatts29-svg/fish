/* v5.85 — NOTHING BLOCKS THE VIEW, AND THE WHEELS LOOK FAST (Andrew Fisher, 26 Sep 2026: "when we move around nothing blocks
   the visual view … we need to see the wheels running at high speed when we throttle it").

   buildOcclusion: anything in the hall that comes between the camera and what it is looking at — a column, the gantry, a
   rack, the forklift — fades to a ghost while it is in the way and comes back when it is not. A few rays from the eye to the
   orbit target and round it, five times a second; a mesh that is hit gets its own copy of its material (so nothing that
   shares it fades with it) and is handed its original back once it is solid again. The car, the V8, the cog and the people
   are never faded — they are what is being looked at.

   buildWheelBlur: a spinning rear wheel past a few turns a second is a blur to the eye, not a set of spokes; a disc on each
   face of each rear wheel, a radial smear of the rim, fades in with the wheel's speed. */
export function buildOcclusion(T, {camera, getTarget, roots, exclude = () => false}) {
  const ray = new T.Raycaster(), faded = new Map(), pt = new T.Vector3(), dir = new T.Vector3();
  const offsets = [[0, 0, 0], [.95, .15, 0], [-.95, .15, 0], [0, .55, 0]];
  let acc = 0;
  const skip = m => !m.isMesh || m.isSkinnedMesh || !m.visible || (m.material && !Array.isArray(m.material) && m.material.visible === false) || exclude(m);
  function fade(m) {
    let f = faded.get(m);
    if (!f) { const orig = m.material, list = Array.isArray(orig) ? orig : [orig];
      const mats = list.map(x => { const c = x.clone(); c.transparent = true; c.depthWrite = false; return c; });
      f = {orig, mats, base: list.map(x => x.opacity ?? 1), o: 1, to: 1}; m.material = Array.isArray(orig) ? mats : mats[0]; faded.set(m, f); }
    f.to = .13;
  }
  return {
    get fadedCount() { return faded.size; },
    update(dt) {
      acc += dt;
      if (acc >= .2) { acc = 0; const eye = camera.position, tgt = getTarget(), hit = new Set();
        for (const o of offsets) { pt.set(tgt.x + o[0], tgt.y + o[1], tgt.z + o[2]); dir.subVectors(pt, eye); const L = dir.length(); if (L < .5) continue;
          dir.divideScalar(L); ray.set(eye, dir); ray.near = 0; ray.far = Math.max(0, L - .45);
          for (const h of ray.intersectObjects(roots, true)) if (!skip(h.object)) hit.add(h.object); }
        for (const m of hit) fade(m);
        for (const [m, f] of faded) if (!hit.has(m)) f.to = 1; }
      for (const [m, f] of faded) { f.o += (f.to - f.o) * (1 - Math.exp(-dt * 9)); f.mats.forEach((c, i) => { c.opacity = f.base[i] * f.o; });
        if (f.to >= 1 && f.o > .995) { m.material = f.orig; faded.delete(m); f.mats.forEach(c => c.dispose()); } }
    }
  };
}
function blurTexture(T) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), cx = 128;
  for (let r = 128; r > 0; r--) { const u = r / 128;
    let col = u > .9 ? [205, 210, 214, .96] : u > .84 ? [120, 126, 132, .93] : u > .26 ? [150 + 20 * Math.sin(u * 60), 156 + 20 * Math.sin(u * 60), 162 + 20 * Math.sin(u * 60), .88] : u > .16 ? [70, 74, 78, .95] : [36, 38, 41, .97];
    g.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${col[3]})`; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.fill(); }
  /* a faint streak ring where the spokes were */
  g.globalAlpha = .18; g.strokeStyle = '#ffffff'; for (let k = 0; k < 24; k++) { g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.arc(cx, cx, 40 + Math.random() * 64, 0, Math.PI * 2); g.stroke(); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
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
