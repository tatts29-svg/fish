/* Author: Andrew Fisher.
 * Crew finish for the existing Coates Way people. The original wrists, palm markers,
 * IK, feet, routes, clothing artwork and task controllers remain the source of motion.
 * Finger joints and small garment details are merged into each original skinned mesh:
 * one draw per person, with one shared material. No extra render loop or timers.
 * mountCrewPolish({T, crew, driver: DX.man}) after buildDriverWalker(); update(dt)
 * after crew.update() and driverStep(). dispose() restores every original resource.
 */
import {ATLAS, crewAtlas} from './people-atlas.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const mark = 'coatesCrewPolish1302';

/* The colour atlas is never repainted: Coates artwork, role labels and hi-vis colours
 * are retained. A small shared normal map gives cloth, leather and tape different
 * surfaces without adding geometry or a shader variant per person. */
function finishMaterial(T, original) {
  const material = original.clone();
  material.name = 'Coates crew cloth, leather and reflective tape';
  let normal = null;
  if (typeof document !== 'undefined' && original.map) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const im = ctx.createImageData(512, 512), data = im.data;
      const zones = ['suit', 'sleeve', 'leg', 'vest', 'glove', 'boot'].map(name => ({name, r: ATLAS[name].map(n => n / 4)}));
      for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4;
        const zone = zones.find(({r: [a, b, w, h]}) => x > a + 2 && x < a + w - 2 && y > b + 2 && y < b + h - 2);
        let a = 0, b = 0;
        if (zone) {
          const leather = zone.name === 'boot' || zone.name === 'glove';
          a = leather ? 9 * Math.sin(x * 2.1 + y * 1.3) : 15 * Math.sin((x + y) * Math.PI / 2);
          b = leather ? 7 * Math.cos(x * 1.7 - y * 2.3) : 10 * Math.cos((x - y) * Math.PI / 2);
        }
        data[i] = 128 + a; data[i + 1] = 128 + b; data[i + 2] = 255; data[i + 3] = 255;
      }
      ctx.putImageData(im, 0, 0);
      normal = new T.CanvasTexture(canvas); normal.colorSpace = T.NoColorSpace; normal.anisotropy = 4;
      material.normalMap = normal; material.normalScale.set(.24, .24);
    }
  }
  return {material, normal};
}

function polishFigure(T, man, material, at) {
  const fig = man.fig || man;
  if (!fig?.mesh?.isSkinnedMesh || !fig.bones?.handL || !fig.dims || fig.root.userData[mark]) return null;
  const mesh = fig.mesh, d = fig.dims, s = d.s, w = d.w;
  const original = {geometry: mesh.geometry, skeleton: mesh.skeleton, material: mesh.material, triangles: fig.triangles};
  const baseBones = original.skeleton.bones;
  const indices = Object.fromEntries(Object.entries(fig.bones).map(([n, bone]) => [n, baseBones.indexOf(bone)]));
  const bones = baseBones.slice(), inverses = original.skeleton.boneInverses.map(m => m.clone());
  const extras = [], extraRoots = [], hands = [];
  const matrix = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3();
  const move = (g, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
    matrix.compose(v.set(x, y, z), q.setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(sx, sy, sz));
    return g.applyMatrix4(matrix);
  };
  const add = (g, uv, weights) => {
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    const p = g.attributes.position, u = g.attributes.uv, si = new Uint16Array(p.count * 4), sw = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      const a = typeof uv === 'function' ? uv(u.getX(i), u.getY(i)) : at.swatch(uv);
      u.setXY(i, a[0], a[1]);
      const weightsAt = typeof weights === 'function' ? weights(p.getX(i), p.getY(i), p.getZ(i)) : [[weights, 1]];
      weightsAt.forEach(([b, weight], k) => { si[i * 4 + k] = b; sw[i * 4 + k] = weight; });
    }
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    g.clearGroups(); extras.push(g); return g;
  };
  const cap = (a, b, r, uv, bone) => {
    const from = new T.Vector3(...a), to = new T.Vector3(...b), direction = to.clone().sub(from);
    /* Millimetre seams need only a four-sided cord; rounded finger capsules keep
     * their silhouette. Do not tessellate a boot stitch like a whole fingertip. */
    const g = r < .0045 * s ? new T.CylinderGeometry(r, r, direction.length(), 4, 1, true) :
      new T.CapsuleGeometry(r, Math.max(.001, direction.length() - r * 1.4), 2, 7);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); add(g, uv, bone);
  };
  const dot = (x, y, z, a, b, c, uv, bone) => {
    /* The palm affects the silhouette; the small knuckle pads need fewer rings. */
    const palm = typeof uv === 'function';
    return add(move(new T.SphereGeometry(1, palm ? 16 : 8, palm ? 10 : 4), x, y, z, a, b, c), uv, bone);
  };
  const joint = (name, parent, position, parentRest) => {
    const bone = new T.Bone(); bone.name = fig.root.name + ', ' + name; bone.position.fromArray(position);
    parent.add(bone);
    const rest = new T.Matrix4().makeTranslation(...position).premultiply(parentRest);
    const index = bones.length; bones.push(bone); inverses.push(rest.clone().invert());
    return {bone, index, rest};
  };

  /* Remove only the original textured palms/fingers. Swatch-coloured gauntlets,
   * cuff rings, wrist joints and all other triangles stay byte-for-byte intact. */
  const retained = original.geometry.clone(), uv = retained.attributes.uv;
  const skin = retained.attributes.skinIndex, weight = retained.attributes.skinWeight, oldIndex = retained.index;
  const [gx, gy, gw, gh] = ATLAS.glove;
  const isOldGlove = i => {
    const u = uv.getX(i) * ATLAS.W, y = (1 - uv.getY(i)) * ATLAS.H;
    return (skin.getX(i) === indices.handL || skin.getX(i) === indices.handR) && weight.getX(i) > .999 &&
      u > gx && u < gx + gw && y > gy && y < gy + gh;
  };
  const kept = [];
  for (let i = 0; i < oldIndex.count; i += 3) {
    const a = oldIndex.getX(i), b = oldIndex.getX(i + 1), c = oldIndex.getX(i + 2);
    if (!(isOldGlove(a) && isOldGlove(b) && isOldGlove(c))) kept.push(a, b, c);
  }
  retained.setIndex(kept);
  const gloveUV = at.rect(ATLAS.glove);
  for (const [side, k, handIndex] of [['L', 1, 0], ['R', -1, 1]]) {
    const x = k * d.shX, yw = d.shY - d.U1 - d.U2, hi = indices['hand' + side];
    const hand = fig.bones['hand' + side], restHand = inverses[hi].clone().invert();
    const toRest = local => [x + local[0], yw + local[1], local[2]];
    /* A flatter palm leaves the original grip marker on its inner face. */
    dot(x - k * .002 * s, yw - .058 * s, .001 * s, .021 * s, .051 * s, .043 * s, gloveUV, hi);
    dot(x + k * .018 * s, yw - .065 * s, -.002 * s, .007 * s, .032 * s, .035 * s, 'charcoal', hi);
    const fingers = [];
    for (let f = 0; f < 4; f++) {
      const z = [.027, .009, -.009, -.026][f] * s, factor = [.94, 1, .94, .79][f];
      const origin = [-k * .002 * s, -.094 * s, z], l1 = .037 * s * factor, l2 = .034 * s * factor;
      const first = joint(side + ' glove finger ' + f, hand, origin, restHand); extraRoots.push(first.bone);
      const second = joint(side + ' glove fingertip ' + f, first.bone, [0, -l1, 0], first.rest);
      const a = toRest(origin), b = [a[0], a[1] - l1, z], c = [a[0], b[1] - l2, z];
      cap(a, b, .0092 * s, gloveUV, first.index); cap(b, c, .0086 * s, gloveUV, second.index);
      /* Low orange guards and dark flex gaps read as gloves, without making a mitten. */
      dot(a[0] + k * .0065 * s, a[1] - l1 * .42, z, .005 * s, .012 * s, .007 * s, 'gloveOrange', first.index);
      dot(b[0] + k * .006 * s, b[1] - l2 * .33, z, .004 * s, .009 * s, .006 * s, 'charcoal', second.index);
      fingers.push({first: first.bone, second: second.bone, f});
    }
    const origin = [-k * .012 * s, -.035 * s, .031 * s], l1 = .031 * s, l2 = .029 * s;
    const thumb = joint(side + ' glove thumb', hand, origin, restHand); extraRoots.push(thumb.bone);
    const thumbTip = joint(side + ' glove thumb tip', thumb.bone, [0, -l1, 0], thumb.rest);
    const a = toRest(origin), b = [a[0], a[1] - l1, a[2]], c = [a[0], b[1] - l2, a[2]];
    cap(a, b, .011 * s, gloveUV, thumb.index); cap(b, c, .010 * s, gloveUV, thumbTip.index);
    hands.push({side, k, handIndex, fingers, thumb: thumb.bone, thumbTip: thumbTip.bone, contact: 0, mode: 'relaxed'});
    /* Cuff seam, a real welt at the boot edge, toe-cap seam and crossing laces. All
     * are in the same skinned draw. Toe details use the original foot/toe blend. */
    add(move(new T.TorusGeometry(.039 * s, .0018 * s, 4, 18), x, yw + .012 * s, 0, 1, 1.08, 1, Math.PI / 2), 'charcoal', hi);
    const foot = indices['foot' + side], toe = indices['toe' + side], fx = k * d.hipX;
    const footW = (px, py, pz) => { let t = clamp((pz - (d.toeL - .035 * s)) / (.05 * s), 0, 1); t = t * t * (3 - 2 * t); return [[foot, 1 - t], [toe, t]]; };
    const outline = [[-.09,.030],[-.075,.048],[-.02,.054],[.05,.058],[.12,.057],[.18,.049],[.208,.034],[.219,.015]];
    for (const edge of [-1, 1]) for (let j = 1; j < outline.length; j++) {
      const [za, wa] = outline[j - 1], [zb, wb] = outline[j];
      cap([fx + edge * wa * s * w, .015 * s, za * s], [fx + edge * wb * s * w, .015 * s, zb * s], .0025 * s, 'tan', footW);
    }
    for (const edge of [-1, 1]) for (const z of [-.055, -.025, .015, .055, .095, .13, .165]) {
      add(move(new T.BoxGeometry(.007 * s, .008 * s, .014 * s), fx + edge * .052 * s * w, .006 * s, z * s), 'sole', footW);
    }
    cap([fx - .041 * s * w, .057 * s, .156 * s], [fx, .081 * s, .135 * s], .002 * s, 'charcoal', footW);
    cap([fx, .081 * s, .135 * s], [fx + .041 * s * w, .057 * s, .156 * s], .002 * s, 'charcoal', footW);
    for (let j = 0; j < 3; j++) for (const edge of [-1, 1]) {
      const z = (.079 - j * .026) * s, y = (.089 + j * .013) * s;
      cap([fx - edge * .022 * s, y, z], [fx + edge * .022 * s, y + .010 * s, z - .021 * s], .0016 * s, 'tan', footW);
    }
    /* Tailored sleeve seam, following the forearm; no extra strips over artwork. */
    cap([x + k * .035 * s * w, yw + .045 * s, -.014 * s], [x + k * .043 * s * w, yw + .19 * s, -.014 * s], .0013 * s, 'charcoal', indices['fore' + side]);
  }
  const geometry = mergeGeometries([retained, ...extras], false);
  retained.dispose(); extras.forEach(g => g.dispose());
  if (!geometry) { extraRoots.forEach(b => b.removeFromParent()); throw new Error('Crew finish geometry could not be merged'); }
  const skeleton = new T.Skeleton(bones, inverses);
  mesh.geometry = geometry; mesh.skeleton = skeleton; mesh.material = material; fig.skeleton = skeleton;
  fig.triangles = geometry.index.count / 3;
  const record = {man, fig, hands, original, extraRoots, addedTriangles: fig.triangles - original.triangles};
  fig.root.userData[mark] = true;
  return record;
}

/* Contact profiles respond to the EXISTING reach solution, including its error and
 * blend. They never move a wrist or an item. The palm/prop relationship is unchanged.
 * An unreached target cannot turn an open hand into a closed grip across an air gap. */
function poseHand(record, hand, dt, crew) {
  const {man} = record, h = man.hands?.[hand.handIndex], right = hand.handIndex === 1;
  const valid = h?.target && h.valid && (h.err || 0) < .055;
  const desired = valid ? clamp(h.w, 0, 1) : 0;
  hand.contact += (desired - hand.contact) * (1 - Math.exp(-Math.max(0, dt) * 14));
  const role = man.role?.id || man.name, gesture = man.gest?.name || man.gest?.clip?.name;
  const pointing = right && (man.ch?.point || 0) > .15;
  const typing = role === 'operator' && valid;
  const tablet = role === 'lead' && !right && valid;
  const gun = role === 'mechanic' && right && valid && ['hand', 'nut', 'floor'].includes(crew?.S?.gunAt);
  hand.mode = pointing ? 'point' : typing ? 'typing' : tablet ? 'tablet' : gun ? 'tool' : hand.contact > .15 ? 'grip' : 'relaxed';
  for (const {first, second, f} of hand.fingers) {
    let bend = .23 + f * .045, tip = .44 + f * .045;
    if (pointing) { bend = f ? 1.0 : .04; tip = f ? 1.12 : .04; }
    else if (typing) {
      const tap = Math.pow(Math.max(0, Math.sin((man.t || 0) * (right ? 12.7 : 10.9) + f * 1.72)), 5);
      bend = .18 + tap * .18; tip = .25 + tap * .21;
    } else {
      const gripBend = tablet ? .30 : gun && f === 0 ? .64 : .82 + f * .035;
      const gripTip = tablet ? .82 : gun && f === 0 ? .78 : 1.15;
      bend += (gripBend - bend) * hand.contact; tip += (gripTip - tip) * hand.contact;
    }
    first.rotation.z = -hand.k * bend; second.rotation.z = -hand.k * tip;
    first.rotation.x = (f - 1.5) * .018 * (1 - hand.contact);
  }
  hand.thumb.rotation.x = -.58 + hand.contact * .38;
  hand.thumb.rotation.z = -hand.k * (.28 + hand.contact * .46);
  hand.thumbTip.rotation.z = -hand.k * (.38 + hand.contact * .40);
  if (right && gesture === 'thumbs') {
    hand.thumb.rotation.x = -.85; hand.thumb.rotation.z = 0; hand.thumbTip.rotation.z = 0;
  }
}

export function mountCrewPolish({T, crew, driver = null} = {}) {
  if (!T || !crew?.men) throw new Error('Crew finish needs the existing Three.js instance and crew');
  if (crew[mark]) return crew[mark];
  const people = [...Object.values(crew.men), ...(driver ? [driver] : [])];
  const at = crewAtlas(), finish = finishMaterial(T, at.material), records = [];
  for (const man of new Set(people)) { const record = polishFigure(T, man, finish.material, at); if (record) records.push(record); }
  let disposed = false, workshop = false;
  const api = {
    update(dt = 1 / 60) {
      if (disposed || workshop) return;
      dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
      for (const record of records) {
        for (const hand of record.hands) poseHand(record, hand, dt, crew);
        /* Existing update() has already propagated the body. Only the glove's
         * finger subtrees changed here; avoid another whole-person traversal. */
        for (const bone of record.extraRoots) bone.updateMatrixWorld(true);
      }
    },
    /* Use after the owning scene has cleared and frozen the existing body rigs. */
    setWorkshopMode(active) { workshop = !!active; },
    info: () => ({people: records.length, drawsAdded: 0, workshop, addedTriangles: records.reduce((n, r) => n + r.addedTriangles, 0),
      fingersPerHand: 5, disposed, peopleDetails: records.map(r => ({role: r.man.name || r.fig.title,
        joints: r.fig.skeleton.bones.length, hands: r.hands.map(h => h.mode)}))}),
    dispose() {
      if (disposed) return; disposed = true;
      for (const {fig, original, extraRoots} of records) {
        fig.mesh.geometry.dispose(); fig.mesh.skeleton.dispose();
        fig.mesh.geometry = original.geometry; fig.mesh.skeleton = fig.skeleton = original.skeleton;
        fig.mesh.material = original.material; fig.triangles = original.triangles;
        extraRoots.forEach(b => b.removeFromParent()); delete fig.root.userData[mark];
      }
      finish.material.dispose(); finish.normal?.dispose(); delete crew[mark];
    },
  };
  crew[mark] = api; api.update(.1); return api;
}
