/* Author: Andrew Fisher.
 * v13.04 — finer surface definition on the existing illustrative V8, without changing its mechanisms,
 * original GC500 body, livery or Coates Way artwork. No model or texture download.
 * Detail locations follow car-powertrain.js and engine-accessories.js at source
 * 04b39247275b6b99475185560e43828f1c8fdcec. These are details of that illustration,
 * not a specification of a manufacturer's engine or a lifting procedure.
 */
const installations = new WeakMap();

export function installWorkshopFinish({T, engine, studioRoot, renderer, camera, quality = 'laptop'} = {}) {
  if (!T || !engine?.root || !engine.removable) throw new Error('Workshop finish needs the existing powertrain');
  if (installations.has(engine.root)) return installations.get(engine.root);
  const originals = new Map(), ownedMaterials = new Set(), geometries = new Set(), textures = new Set();
  const details = [], parts = new Map(engine.removable.map(part => [part.id, part.group]));
  const families = {}, cache = new Map();
  let disposed = false, changedMeshes = 0;
  const surfaceMaps = new Map();
  const materialList = material => Array.isArray(material) ? material : [material];
  const finishes = {
    cast: {color: 0x718087, metalness: .72, roughness: .52, bumpScale: .00065, envMapIntensity: .88},
    machined: {color: 0xc1ccd1, metalness: .96, roughness: .24, bumpScale: .00010, envMapIntensity: 1.08},
    brushed: {color: 0x9caab3, metalness: .90, roughness: .34, bumpScale: .00022, envMapIntensity: .96},
    darkSteel: {color: 0x2d3b43, metalness: .84, roughness: .38, bumpScale: .00016, envMapIntensity: 1.0},
    rubber: {color: 0x12171b, metalness: 0, roughness: .88, bumpScale: .00065, envMapIntensity: .30},
    ceramic: {color: 0xe7e9e3, metalness: 0, roughness: .28, bumpScale: 0, envMapIntensity: .55},
    stainless: {color: 0xa4afb4, metalness: .94, roughness: .28, bumpScale: .0001, envMapIntensity: .90},
  };
  // Four small deterministic maps describe surface finish, never a new part or
  // a manufacturer's specification. Shared, mipmapped data textures retain fine
  // detail close up and filter to a quiet surface at the full-workshop distance.
  function surfaceMap(family) {
    const kind = family === 'darkSteel' ? 'brushed' : family === 'stainless' ? 'machined' : family;
    if (!['cast', 'machined', 'brushed', 'rubber'].includes(kind)) return null;
    if (surfaceMaps.has(kind)) return surfaceMaps.get(kind);
    const width = 128, data = new Uint8Array(width * width * 4);
    const noise = (x, y) => {
      let n = Math.imul((x & 127) + 19, 374761393) ^ Math.imul((y & 127) + 47, 668265263);
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
      const fine = noise(x, y), broad = (noise(x >> 2, y >> 2) + noise(x >> 3, y >> 3)) / 2;
      const turning = .5 + .5 * Math.sin(x / width * Math.PI * 2 * 24);
      const brushing = .5 + .5 * Math.sin(y / width * Math.PI * 2 * 16);
      const signal = kind === 'cast' ? .52 * fine + .48 * broad
        : kind === 'machined' ? .82 * turning + .18 * fine
          : kind === 'brushed' ? .72 * brushing + .28 * fine : .7 * fine + .3 * broad;
      const value = Math.round(205 + signal * 50), offset = (y * width + x) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = value; data[offset + 3] = 255;
    }
    const texture = new T.DataTexture(data, width, width, T.RGBAFormat);
    texture.name = `Workshop ${kind} micro-surface`;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.magFilter = T.LinearFilter; texture.minFilter = T.LinearMipmapLinearFilter;
    texture.generateMipmaps = true; texture.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
    texture.colorSpace = T.NoColorSpace;
    texture.repeat.setScalar(kind === 'cast' || kind === 'rubber' ? 3 : 1);
    texture.needsUpdate = true;
    surfaceMaps.set(kind, texture); textures.add(texture); return texture;
  }
  function finished(original, family) {
    const key = `${original.uuid}:${family}`;
    if (cache.has(key)) return cache.get(key);
    const material = original.clone();
    Object.assign(material, finishes[family]);
    // Copy colour into a Color, rather than replacing Three's Color with a number.
    material.color = new T.Color(finishes[family].color);
    material.name = `Workshop ${family}`;
    material.userData = {...original.userData, workshopFinish: family};
    const surface = surfaceMap(family);
    if (surface) { material.bumpMap = surface; material.roughnessMap = surface; }
    if ('clearcoat' in material) material.clearcoat = 0;
    material.needsUpdate = true;
    cache.set(key, material); ownedMaterials.add(material);
    return material;
  }
  function protectedSurface(material, object) {
    if (!material || object.userData?.livery || material.userData?.gc500Panel !== undefined || material.map) return true;
    const c = material.color;
    // Orange section edges, rails, springs and paint stay the original material.
    return c && c.r > .45 && c.r > c.g * 1.75 && c.g > c.b * 1.25;
  }
  function familyFor(name) {
    if (/Ceramic insulator/.test(name)) return 'ceramic';
    if (/coolant hoses|plug leads|Cap terminals|distributor cap|Ribbed belt|timing belt|CV boots|Intake throat|Seven-blade fan/i.test(name)) return 'rubber';
    if (/casting|Cast sump|Pump housing|Pump body|Alternator case|Ribbed gearbox case|Finned differential|Radiator core/i.test(name)) return 'cast';
    if (/Camshaft and|Crank webs|bearing journals|Three piston rings|Belt ribs|Tensioner arm|Drive tower|Starter body/i.test(name)) return 'darkSteel';
    if (/Four curved headers|Header flanges/i.test(name)) return 'stainless';
    if (/Machined|Main journals|Valve stem|cam follower|piston|Hex fasteners|Pulley|cover fins|open aluminium|Terminal, hex|Drain plug/i.test(name)) return 'machined';
    if (/Connecting rod|Cooling fan|cooling fins|Radiator fins|Butterfly plates|Throttle shaft|Link rod|Spring seat|gear|shaft/i.test(name)) return 'brushed';
    return null;
  }
  // Only recognised powertrain surfaces: the cockpit contains original car parts
  // after fitCarMechanics, so it and any newly installed service module are skipped.
  for (const [id, group] of parts) {
    if (id === 'cockpit') continue;
    group.traverse(object => {
      if (!object.isMesh || object.userData?.workshopDetail) return;
      const family = familyFor(object.name);
      if (!family) return;
      let changed = false;
      const replacements = materialList(object.material).map(material => {
        if (protectedSurface(material, object)) return material;
        changed = true; return finished(material, family);
      });
      if (!changed) return;
      originals.set(object, object.material);
      object.material = Array.isArray(object.material) ? replacements : replacements[0];
      changedMeshes++; families[family] = (families[family] || 0) + 1;
    });
  }

  const detailMetal = new T.MeshStandardMaterial({...finishes.machined, name: 'Workshop fasteners'});
  const detailSatin = new T.MeshStandardMaterial({...finishes.brushed, name: 'Workshop clamp bands'});
  ownedMaterials.add(detailMetal); ownedMaterials.add(detailSatin);
  // A true flat-sided head and thin flat washer produce a readable highlight at
  // their edge. Their existing placements and outside envelopes stay unchanged.
  function radialProfile(profile, segments, capped = false) {
    const vertices = [], uv = [];
    const point = (ring, angle) => [Math.sin(angle) * ring[0], ring[1], Math.cos(angle) * ring[0]];
    function tri(a, b, c) { vertices.push(...a, ...b, ...c); uv.push(a[0] / 3 + .5, a[2] / 3 + .5, b[0] / 3 + .5, b[2] / 3 + .5, c[0] / 3 + .5, c[2] / 3 + .5); }
    for (let row = 0; row < profile.length - 1; row++) for (let i = 0; i < segments; i++) {
      const a = i / segments * Math.PI * 2, b = (i + 1) / segments * Math.PI * 2;
      const p = point(profile[row], a), q = point(profile[row], b), r = point(profile[row + 1], a), s = point(profile[row + 1], b);
      tri(p, q, s); tri(p, s, r);
    }
    if (capped) for (let i = 0; i < segments; i++) {
      const a = i / segments * Math.PI * 2, b = (i + 1) / segments * Math.PI * 2;
      tri([0, profile[0][1], 0], point(profile[0], b), point(profile[0], a));
      tri([0, profile.at(-1)[1], 0], point(profile.at(-1), a), point(profile.at(-1), b));
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return geometry;
  }
  const hex = radialProfile([[.82, -.5], [1, -.32], [1, .32], [.82, .5]], 6, true);
  const washer = radialProfile([[.78, -.10], [1.16, -.10], [1.2, -.06], [1.2, .06], [1.16, .10], [.78, .10], [.74, .06], [.74, -.06], [.78, -.10]], 24);
  const band = new T.CylinderGeometry(1, 1, 1, 20, 1, true);
  detailSatin.side = T.DoubleSide;
  const box = new T.BoxGeometry(1, 1, 1);
  for (const geometry of [hex, washer, band, box]) geometries.add(geometry);
  const matrix = new T.Matrix4(), position = new T.Vector3(), rotation = new T.Quaternion(), size = new T.Vector3();
  const up = new T.Vector3(0, 1, 0), axis = new T.Vector3();
  function groupFor(id) {
    const parent = parts.get(id);
    if (!parent) return null;
    const group = new T.Group(); group.name = `Workshop detail · ${id}`;
    group.userData.workshopDetail = true; group.userData.sourcePartId = id;
    group.userData.detailVisibilityInitialised = false;
    parent.add(group); details.push(group); return group;
  }
  // Each descriptor is position, dimensions, then a local Euler or axis direction.
  function instances(group, geometry, material, placements, name) {
    if (!group || !placements.length) return;
    const mesh = new T.InstancedMesh(geometry, material, placements.length);
    mesh.name = name; mesh.userData.workshopDetail = true;
    mesh.castShadow = false; mesh.receiveShadow = true;
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i]; position.fromArray(p.p); size.fromArray(p.s);
      if (p.axis) rotation.setFromUnitVectors(up, axis.fromArray(p.axis).normalize());
      else rotation.setFromEuler(new T.Euler(...(p.r || [0, 0, 0])));
      matrix.compose(position, rotation, size); mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); group.add(mesh);
  }
  function fasteners(id, points, radius = .010, tilt = 0) {
    const group = groupFor(id);
    if (!group) return;
    const normal = new T.Vector3(0, 1, 0).applyAxisAngle(new T.Vector3(1, 0, 0), tilt);
    const washerScale = radius * 1.15, washerThickness = washerScale * .20;
    // Input points lie on the actual drawn flange surface. The washer sits on
    // that surface and the head sits on the washer; neither floats or intersects.
    instances(group, hex, detailMetal, points.map(p => ({p: p.map((value, i) => value + normal.getComponent(i) * (washerThickness + .0045)), s: [radius, .009, radius], r: [tilt, 0, 0]})), 'Flange hex fasteners');
    instances(group, washer, detailSatin, points.map(p => ({p: p.map((value, i) => value + normal.getComponent(i) * washerThickness / 2), s: [washerScale, washerScale, washerScale], r: [tilt, 0, 0]})), 'Flange washers');
  }
  // The sectioned sump's flange top is .062 + .008/2 in engine-systems.js.
  fasteners('oil-pan', [
    ...[-.40, -.20, 0, .20, .40].flatMap(x => [[x, .066, -.49], [x, .066, .49]]),
    ...[-.30, 0, .30].flatMap(z => [[-.495, .066, z], [.495, .066, z]]),
  ], .009);
  // Head deck and side edges come from bankPoint(.429) and the .231-wide head.
  // These stay clear of each animated valve pair, rather than bolting across it.
  for (const side of [-1, 1]) {
    const c = Math.SQRT1_2, points = [];
    for (const x of [-.57, -.30, 0, .30, .57]) for (const lateral of [-.096, .096]) {
      points.push([x, .4615 * c - side * lateral * c, side * .4615 * c + lateral * c]);
    }
    fasteners(`cylinder-head-${side > 0 ? 'near' : 'far'}`, points, .008, side * Math.PI / 4);
  }
  // Injector collars on the existing eight .019-radius injector bodies.
  const fuel = groupFor('intake-trumpets');
  instances(fuel, band, detailSatin, [-.45, -.15, .15, .45].flatMap(x => [-1, 1].map(side => ({p: [x, .455, side * .186], s: [.0198, .009, .0198]}))), 'Eight injector retaining collars');
  // Alternator casing's existing twelve fins surround its .070-radius body.
  const alternator = groupFor('alternator');
  instances(alternator, hex, detailMetal, [0, 1, 2].map(i => {
    const a = i * Math.PI * 2 / 3;
    return {p: [-.157, Math.cos(a) * .053, Math.sin(a) * .053], s: [.006, .008, .006], axis: [-1, 0, 0]};
  }), 'Alternator casing tie bolts');
  // Clamp axes follow the endpoint tangents of the exact upper and lower hose
  // curves. They stay children of cooling-system when that part is removed.
  const cooling = groupFor('cooling-system');
  const clampSites = [
    {p: [.059, .235, -.469], axis: [.20, .05, .01], radius: .038},
    {p: [.556, .268, -.373], axis: [.13, .02, .12], radius: .038},
    {p: [.059, -.218, .474], axis: [.14, -.06, .03], radius: .037},
    {p: [.638, -.065, .293], axis: [.19, .22, -.20], radius: .037},
  ];
  instances(cooling, band, detailSatin, clampSites.map(s => ({...s, s: [s.radius, .012, s.radius]})), 'Four coolant hose clamp bands');
  instances(cooling, box, detailMetal, clampSites.map(s => ({p: [s.p[0], s.p[1] + s.radius + .003, s.p[2]], s: [.017, .008, .009]})), 'Hose clamp screw housings');
  // Four screw heads share the same instance order as their existing housings.
  // The service controller carries indices 1/3 with the engine-side hose ends.
  instances(cooling, hex, detailMetal, clampSites.map(s => ({p: [s.p[0], s.p[1] + s.radius + .0085, s.p[2]], s: [.0035, .003, .0035]})), 'Four hose clamp screw heads');

  // Broader slabs, satin epoxy and a softer reflection keep the mechanism and
  // bay markings legible. Clone the maps: the existing floor owns the originals.
  const epoxy = studioRoot?.userData?.epoxy;
  if (epoxy?.material?.isMeshPhysicalMaterial) {
    originals.set(epoxy, epoxy.material);
    const material = epoxy.material.clone(); ownedMaterials.add(material);
    material.name = 'Workshop satin epoxy';
    material.roughnessMap = null; material.roughness = .64;
    material.metalness = .02; material.clearcoat = .24; material.clearcoatRoughness = .5;
    material.aoMapIntensity = .52;
    if (material.map) {
      // fx-quality prints keep a live texture reference in their provenance.
      // Texture.clone() JSON-copies userData and throws on that cycle. Copy the
      // rendering fields through a separate descriptor; never edit the source's
      // userData, even temporarily. Three still shares the live canvas Source.
      const original = material.map;
      material.map = new original.constructor().copy({...original, userData: {}});
      textures.add(material.map);
      material.map.repeat.multiplyScalar(.38); material.map.needsUpdate = true;
    }
    material.userData = {...material.userData, solid: {opacity: 1, envMapIntensity: .48}, overReflector: {opacity: .94, envMapIntensity: .28}};
    material.opacity = studioRoot.userData.reflector?.visible ? .94 : 1;
    material.envMapIntensity = studioRoot.userData.reflector?.visible ? .28 : .48;
    material.needsUpdate = true; epoxy.material = material;
  }

  const centre = new T.Vector3(), eye = new T.Vector3();
  function update(options = {}) {
    if (disposed) return;
    camera = options.camera || camera; quality = options.quality || quality;
    if (!camera) return;
    camera.getWorldPosition(eye);
    const limit = quality === 'laptop' ? 6.5 : quality === 'balanced' ? 9 : 14;
    for (const group of details) {
      group.getWorldPosition(centre);
      // Retain the current side through a narrow hysteresis band. Slow orbiting
      // near the threshold must not make fasteners repeatedly appear/disappear.
      const boundary = group.userData.detailVisibilityInitialised ? limit * (group.visible ? 1.10 : .90) : limit;
      group.visible = eye.distanceToSquared(centre) < boundary * boundary;
      group.userData.detailVisibilityInitialised = true;
    }
  }
  const api = {
    update,
    get diagnostics() {
      let instances = 0, draws = 0, triangles = 0;
      for (const group of details) for (const mesh of group.children) { draws++; instances += mesh.count || 0; triangles += (mesh.geometry.index?.count || mesh.geometry.attributes.position.count) / 3 * mesh.count; }
      return {changedMeshes, families: {...families}, detailGroups: details.length, detailDraws: draws, detailInstances: instances, detailTriangles: triangles, detailVisible: details.filter(group => group.visible).length, surfaceMaps: surfaceMaps.size, surfaceBytes: [...surfaceMaps.values()].reduce((sum, texture) => sum + texture.image.data.byteLength, 0), disposed};
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const [object, material] of originals) object.material = material;
      for (const group of details) group.removeFromParent();
      for (const material of ownedMaterials) material.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const texture of textures) texture.dispose();
      installations.delete(engine.root);
      if (renderer?.shadowMap) renderer.shadowMap.needsUpdate = true;
    },
  };
  installations.set(engine.root, api);
  update();
  if (renderer?.shadowMap) renderer.shadowMap.needsUpdate = true;
  return api;
}
