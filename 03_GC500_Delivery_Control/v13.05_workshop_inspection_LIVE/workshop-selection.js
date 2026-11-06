/* Author: Andrew Fisher. Selection follows the original rendered geometry.
 * One selected-part line batch, no full-scene post-processing or animation loop.
 * Picking runs only after a deliberate tap; an unselectable surface still occludes.
 */
const isVisible = object => {
  for (let node = object; node; node = node.parent) if (!node.visible) return false;
  return true;
};
const materialsOf = object => Array.isArray(object.material) ? object.material : [object.material];
const materialVisible = material => !!material && material.visible !== false && !(material.transparent && material.opacity <= .001);
const materialKey = object => materialsOf(object).map(material => materialVisible(material) ? '1' : '0').join('');
const ancestorFlag = (object, key) => {
  for (let node = object; node; node = node.parent) if (node.userData?.[key]) return true;
  return false;
};
const sameNumbers = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);

export function installWorkshopHighlight({T, parent, color = 0xffa66a, threshold = 28} = {}) {
  if (!T || !parent) throw Error('Component highlighting needs the current scene parent.');
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(0, 3));
  geometry.setDrawRange(0, 0);
  const material = new T.LineBasicMaterial({color, transparent: true, opacity: .68,
    depthTest: true, depthWrite: false, toneMapped: false});
  const line = new T.LineSegments(geometry, material);
  line.name = 'Inspected original component'; line.visible = false; line.frustumCulled = false;
  line.userData.workshopOverlay = true; line.raycast = () => {}; line.renderOrder = 2;
  parent.add(line);
  const edges = new Map(), matrix = new T.Matrix4(), instance = new T.Matrix4(), inverse = new T.Matrix4(), point = new T.Vector3();
  let disposed = false, previous = [], previousTarget = null, vertices = 0, rebuilds = 0, topologyChanges = 0;

  function edgeData(mesh, key) {
    const source = mesh.geometry, position = source?.attributes?.position;
    if (!position || position.count === 0) return null;
    const version = `${position.version}:${source.index?.version || 0}:${key}`;
    let entry = edges.get(source);
    if (entry?.version === version) return entry.geometry.attributes.position;
    if (entry) entry.geometry.dispose();
    // Respect intentionally hidden material groups, without touching the original.
    let filtered = null, used = source;
    if (Array.isArray(mesh.material) && source.groups.length && key.includes('0')) {
      const indices = [];
      for (const group of source.groups) {
        if (!materialVisible(mesh.material[group.materialIndex])) continue;
        const limit = Math.min(group.start + group.count, source.index?.count ?? position.count);
        for (let i = group.start; i < limit; i++) indices.push(source.index ? source.index.getX(i) : i);
      }
      filtered = new T.BufferGeometry(); filtered.setAttribute('position', position); filtered.setIndex(indices); used = filtered;
    }
    const outline = new T.EdgesGeometry(used, threshold);
    filtered?.dispose(); entry = {version, geometry: outline}; edges.set(source, entry);
    return outline.attributes.position;
  }
  function update(target) {
    if (disposed || !target || !isVisible(target)) { hide(); return; }
    parent.updateWorldMatrix(true, false); target.updateWorldMatrix(true, true);
    line.updateWorldMatrix(true, false); inverse.copy(line.matrixWorld).invert();
    const current = [];
    target.traverse(object => {
      if (!object.isMesh || !isVisible(object) || ancestorFlag(object, 'workshopOverlay')) return;
      const key = materialKey(object); if (!key.includes('1')) return;
      const data = edgeData(object, key); if (!data?.count) return;
      const count = object.isInstancedMesh ? Math.min(object.count, object.instanceMatrix.count) : 1;
      if (!count) return;
      current.push({object, data, count, world: object.matrixWorld.elements.slice(),
        instances: object.isInstancedMesh ? object.instanceMatrix.array : null});
    });
    let changed = target !== previousTarget || current.length !== previous.length;
    if (!changed) for (let i = 0; i < current.length; i++) {
      const a = current[i], b = previous[i];
      if (a.object !== b.object || a.data !== b.data || a.count !== b.count || !sameNumbers(a.world, b.world)
        || !!a.instances !== !!b.instances || a.instances && !sameNumbers(a.instances, b.instances)) { changed = true; break; }
    }
    // The overlay parent can move independently of the part.
    const inverseKey = inverse.elements;
    if (!sameNumbers(inverseKey, previousInverse)) changed = true;
    vertices = current.reduce((sum, item) => sum + item.data.count * item.count, 0);
    line.visible = vertices > 0;
    if (!changed) return;
    const existing = geometry.attributes.position;
    if (existing.count !== vertices) {
      // Three releases GPU buffers by inspecting the attributes attached when
      // dispose fires. Retire the old owned buffer BEFORE replacing its attribute;
      // the same geometry is registered again by Three on the next draw.
      geometry.dispose();
      geometry.setAttribute('position', new T.Float32BufferAttribute(vertices * 3, 3).setUsage(T.DynamicDrawUsage));
      topologyChanges++;
    }
    const output = geometry.attributes.position;
    let cursor = 0;
    for (const item of current) {
      matrix.multiplyMatrices(inverse, item.object.matrixWorld);
      for (let index = 0; index < item.count; index++) {
        if (item.object.isInstancedMesh) {
          item.object.getMatrixAt(index, instance); matrix.multiplyMatrices(inverse, item.object.matrixWorld).multiply(instance);
        }
        for (let i = 0; i < item.data.count; i++) {
          point.fromBufferAttribute(item.data, i).applyMatrix4(matrix);
          output.setXYZ(cursor++, point.x, point.y, point.z);
        }
      }
    }
    output.needsUpdate = true; geometry.setDrawRange(0, vertices);
    geometry.boundingBox = null; geometry.boundingSphere = null;
    previous = current.map(item => ({...item, instances: item.instances?.slice() || null}));
    previousTarget = target; previousInverse = inverseKey.slice(); rebuilds++;
  }
  let previousInverse = [];
  function hide() { line.visible = false; }
  function dispose() {
    if (disposed) return; disposed = true; line.removeFromParent();
    for (const item of edges.values()) item.geometry.dispose(); edges.clear();
    geometry.dispose(); material.dispose(); previous = []; previousTarget = null; vertices = 0;
  }
  return {update, hide, dispose, object: line,
    get diagnostics() { return {vertices, segments: vertices / 2, draws: line.visible ? 1 : 0,
      cachedGeometries: edges.size, rebuilds, topologyChanges, disposed}; }};
}

export function installWorkshopPicker({T, element, camera, scene, parts, enabled = () => true,
  onSelect = () => {}, onChange = () => {}, now = () => performance.now()} = {}) {
  if (!T || !element?.addEventListener || !camera || !scene || !parts) throw Error('Workshop picking needs the current canvas, camera, scene and registered components.');
  const raycaster = new T.Raycaster(), pointer = new T.Vector2(), pointers = new Set();
  const listeners = [], stats = {taps: 0, raycasts: 0, selections: 0, lastId: null};
  let start = null, disposed = false;
  const available = () => !disposed && (typeof enabled === 'function' ? enabled() : enabled);
  const catalogue = () => typeof parts === 'function' ? parts() : parts;
  function owner(object, roots) {
    for (let node = object; node; node = node.parent) if (roots.has(node)) return roots.get(node);
    return null;
  }
  function pickAt(clientX, clientY) {
    if (!available() || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
    const rect = element.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0) || clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    const entries = catalogue();
    const roots = new Map((entries || []).filter(part => part?.id && part.group).map(part => [part.group, part.id]));
    if (!roots.size) return null;
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera); raycaster.layers.mask = camera.layers.mask;
    raycaster.near = camera.near; raycaster.far = camera.far;
    const hits = []; stats.raycasts++;
    scene.traverse(object => {
      if (!object.isMesh || !isVisible(object) || !raycaster.layers.test(object.layers)
          || ancestorFlag(object, 'workshopOverlay') || !materialKey(object).includes('1')) return;
      const id = owner(object, roots), lesson = ancestorFlag(object, 'workshopLesson');
      if (lesson && !id) return;
      // Isolated display meshes deliberately have no ordinary car picking handler.
      // Calling the unmodified mesh algorithm reads their current matrices only.
      if (lesson && id) (object.isInstancedMesh ? T.InstancedMesh : T.Mesh).prototype.raycast.call(object, raycaster, hits);
      else object.raycast(raycaster, hits);
    });
    hits.sort((a, b) => a.distance - b.distance);
    const hit = hits.find(candidate => materialVisible(materialsOf(candidate.object)[candidate.face?.materialIndex || 0]));
    if (!hit) return null;
    const id = owner(hit.object, roots);
    return id ? {id, point: hit.point.clone(), instanceId: hit.instanceId ?? null} : null;
  }
  function cancel() { start = null; pointers.clear(); }
  function down(event) {
    if (!available()) { cancel(); return; }
    pointers.add(event.pointerId);
    if (pointers.size !== 1 || event.isPrimary === false || event.button !== undefined && event.button !== 0) { start = null; return; }
    start = {id: event.pointerId, x: event.clientX, y: event.clientY, at: now(), slop: event.pointerType === 'mouse' ? 5 : 9, far: false};
  }
  function move(event) {
    if (start?.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) > start.slop) start.far = true;
  }
  function up(event) {
    const tap = start; pointers.delete(event.pointerId);
    if (!tap || tap.id !== event.pointerId || pointers.size || event.type !== 'pointerup' || tap.far
        || !available() || now() - tap.at > 650 || Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > tap.slop) { start = null; return; }
    start = null; stats.taps++;
    const hit = pickAt(event.clientX, event.clientY); if (!hit) return;
    const accepted = onSelect(hit.id, hit);
    if (accepted !== false && accepted?.ok !== false) { stats.selections++; stats.lastId = hit.id; onChange(hit); }
  }
  function listen(target, type, handler, options = false) {
    target?.addEventListener(type, handler, options); listeners.push([target, type, handler, options]);
  }
  listen(element, 'pointerdown', down, true); listen(element, 'pointermove', move, true);
  listen(element, 'pointerup', up, true); listen(element, 'pointercancel', up, true);
  listen(element, 'lostpointercapture', event => { start = null; pointers.delete(event.pointerId); });
  listen(element.ownerDocument, 'visibilitychange', cancel);
  listen(element.ownerDocument?.defaultView, 'blur', cancel);
  listen(element.ownerDocument?.defaultView, 'pagehide', cancel);
  function dispose() { if (disposed) return; cancel(); disposed = true; for (const [target, type, handler, options] of listeners) target?.removeEventListener(type, handler, options); }
  return {pickAt, cancel, dispose, get diagnostics() { return {...stats, disposed}; }};
}
