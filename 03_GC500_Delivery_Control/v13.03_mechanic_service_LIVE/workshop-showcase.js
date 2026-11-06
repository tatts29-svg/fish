/* Author: Andrew Fisher.
 * User-controlled workshop story on the existing service master and engine.
 * This is separate from the event dashboard's Showcase. No second lift clock,
 * no duplicate engine, no manufacturer service instructions or invented data.
 * Host: normal poses -> service -> learning -> lessons -> showcase -> render.
 * The director reapplies the same masters at dt=0 after a deterministic seek.
 */
const DURATION = 126;
const SHOTS = Object.freeze([
  {id: 'mechanic', start: 0, end: 18, from: 0, to: .18, label: 'The mechanic at work', detail: 'Follow the tool and the modelled engine connections.', direction: [-.85, .42, .95], size: 1.45},
  {id: 'rig', start: 18, end: 28, from: .18, to: .30, label: 'Connect the lifting gear', detail: 'The rig meets the engine before the crane takes the load.', direction: [-.78, .48, .95], size: 1.85},
  {id: 'lift', start: 28, end: 50, from: .30, to: .78, label: 'From the car to the bench', detail: 'The same engine rises clear, travels across and lowers onto its support.', direction: [-.82, .36, .95], size: 2.0},
  {id: 'unhook', start: 50, end: 62, from: .78, to: 1, label: 'Supported and unhooked', detail: 'Watch the support take the engine and the lifting gear move clear.', direction: [-.72, .43, 1], size: 1.8},
  {id: 'cycle', start: 62, end: 82, from: 1, to: 1, label: 'One four-stroke cycle', detail: 'Intake, compression, power and exhaust: two crank turns, one cam turn.', direction: [.25, .20, 1], size: .52},
  {id: 'component', start: 82, end: 94, from: 1, to: 1, label: 'Look around the piston', detail: 'Inspect the crown, skirt and rings of the modelled component.', direction: [-.70, .40, 1], size: .34},
  {id: 'refit', start: 94, end: 126, from: 1, to: 0, label: 'Return to the Coates car', detail: 'Follow the reverse sequence through the rig, engine and connections.', direction: [-.85, .38, .95], size: 2.0},
]);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function installWorkshopShowcase({T, camera, controls, service, lift, learning, lessons, reducedMotion = false} = {}) {
  if (!T || !camera || !controls?.target || !service?.setProgress || !lift || !learning || !lessons) {
    throw new Error('Workshop showcase needs the camera and existing service, lift and lessons.');
  }
  let active = false, playing = false, progress = 0, disposed = false;
  let current = SHOTS[0], lessonMode = 'none', pauseReason = '', blend = null, cameraStep = '';
  let savedMaxDistance = null;
  const vector = value => value?.isVector3 ? value.clone() : Array.isArray(value) && value.length >= 3 ? new T.Vector3(...value) : null;
  const finiteVector = value => value && [value.x, value.y, value.z].every(Number.isFinite);
  const motionReduced = () => typeof reducedMotion === 'function' ? !!reducedMotion() : !!reducedMotion;
  const point = new T.Vector3(), extent = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3();
  const worldUp = new T.Vector3(0, 1, 0);
  function sample(value) {
    const seconds = clamp(value) * DURATION;
    const shot = SHOTS.find(item => seconds < item.end) || SHOTS.at(-1);
    const amount = clamp((seconds - shot.start) / (shot.end - shot.start));
    return {shot, amount, seconds, serviceProgress: shot.from + (shot.to - shot.from) * amount};
  }
  function haltClocks() {
    service.setPlaying(false); lift.setPlaying(false); lessons.setPlaying(false);
  }
  function closeLesson() {
    if (lessonMode !== 'none') {
      lessons.reset(); learning.reset(); lessonMode = 'none';
    }
  }
  function applyModel() {
    const sampled = sample(progress), wanted = sampled.shot.id === 'cycle' ? 'cycle' : sampled.shot.id === 'component' ? 'isolate' : 'none';
    current = sampled.shot;
    // Isolation must restore the source before the service master moves it.
    if (wanted !== lessonMode) closeLesson();
    haltClocks();
    // Direction also drives the mechanic's cues and the ordinary Continue
    // button after exiting the tour; decreasing progress alone is insufficient.
    service.setDirection(sampled.shot.id === 'refit' ? -1 : 1);
    service.setProgress(sampled.serviceProgress); service.update(0);
    if (wanted !== 'none') {
      if (lessonMode !== wanted) {
        const opened = learning.setMode('inspect');
        if (opened?.ok === false) throw Error(opened.reason || 'The service bench is not ready.');
        learning.selectPart('piston-1'); learning.setCutaway(true);
        const result = lessons.setMode(wanted);
        if (result?.ok === false) throw Error(result.reason || 'The workshop lesson is not ready.');
        lessonMode = wanted;
      }
      if (wanted === 'cycle') lessons.setCycleAngle(sampled.amount * Math.PI * 4);
      else {
        // A complete cycle gives this isolated view a deterministic starting pose,
        // whether reached by playback, reverse scrub or a direct seek.
        lessons.setCycleAngle(Math.PI * 4);
        lessons.setRotation(motionReduced() ? 0 : sampled.amount * Math.PI * 2);
      }
    }
    learning.update(0); lessons.update(0);
    return sampled;
  }
  function sourceBounds(shot) {
    let box;
    if (shot.id === 'cycle' || shot.id === 'component') box = lessons.bounds;
    else if (shot.id === 'lift' || shot.id === 'refit') box = service.bounds || lift.bounds;
    if (box?.isBox3 && !box.isEmpty() && finiteVector(box.min) && finiteVector(box.max)) return box.clone();
    const focus = shot.id === 'cycle' || shot.id === 'component' ? vector(lessons.focus) || vector(learning.focus) : vector(service.focus) || vector(lift.diagnostics?.loadWorld);
    if (!finiteVector(focus)) throw Error('Workshop showcase cannot find the modelled action.');
    return new T.Box3().setFromCenterAndSize(focus, new T.Vector3(shot.size, shot.size * .8, shot.size));
  }
  function desiredCamera() {
    const box = sourceBounds(current), center = box.getCenter(new T.Vector3());
    box.getSize(extent);
    // Small parts still have breathing room; large lifts are framed from their
    // actual world bounds, including the hook and service target.
    if (Math.max(extent.x, extent.y, extent.z) < current.size) box.expandByScalar((current.size - Math.max(extent.x, extent.y, extent.z)) / 2);
    const direction = new T.Vector3(...current.direction).normalize();
    right.crossVectors(worldUp, direction).normalize(); up.crossVectors(direction, right).normalize();
    const tan = Math.tan(T.MathUtils.degToRad(camera.fov) / 2) / (camera.zoom || 1);
    const aspect = Math.max(.1, camera.aspect || 1);
    // Preserve the host's view offset for the workshop control dock. Reserve its
    // vertical shift on both sides so every shot also fits a narrow phone view.
    const view = camera.view;
    const usable = view?.enabled ? clamp(1 - 2 * Math.abs(view.offsetY || 0) / Math.max(1, view.fullHeight), .35, 1) : .86;
    let distance = .7;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      point.set(x, y, z).sub(center);
      const depth = point.dot(direction);
      distance = Math.max(distance, Math.abs(point.dot(right)) / (tan * aspect) + depth, Math.abs(point.dot(up)) / (tan * usable) + depth);
    }
    distance *= 1.14;
    return {position: center.clone().addScaledVector(direction, distance), target: center, distance};
  }
  function beginBlend() {
    blend = {position: camera.position.clone(), target: controls.target.clone(), elapsed: 0};
  }
  function frame(dt, snap = false) {
    const desired = desiredCamera(), reduced = motionReduced();
    if (reduced && !snap && current.id === cameraStep) return;
    if (!snap && !reduced && current.id !== cameraStep && !blend) beginBlend();
    cameraStep = current.id;
    if (snap || reduced) blend = null;
    let position = desired.position, target = desired.target;
    if (blend) {
      blend.elapsed += Math.max(0, dt);
      const t = ease(blend.elapsed / 1.2);
      target = blend.target.clone().lerp(desired.target, t);
      // Blend around the target, rather than passing through an engine when the
      // user has orbited to the opposite side before resuming the showcase.
      const from = blend.position.clone().sub(blend.target), to = desired.position.clone().sub(desired.target);
      const fromLength = from.length(), toLength = to.length();
      const turn = new T.Quaternion().setFromUnitVectors(from.normalize(), to.normalize());
      const partial = new T.Quaternion().slerp(turn, t);
      position = from.applyQuaternion(partial).multiplyScalar(fromLength + (toLength - fromLength) * t).add(target);
      if (t >= 1) blend = null;
    }
    controls.maxDistance = Math.max(savedMaxDistance || 0, desired.distance * 1.25, position.distanceTo(target) * 1.1);
    camera.position.copy(position); controls.target.copy(target); camera.lookAt(target); camera.updateMatrixWorld(true);
  }
  function start(options = {}) {
    if (disposed) return {ok: false, reason: 'The workshop showcase has closed.'};
    if (!service.active) {
      const entered = service.enter?.();
      if (entered?.ok === false || !service.active) return entered || {ok: false, reason: 'Open the engine workshop first.'};
    }
    if (!active) savedMaxDistance = controls.maxDistance;
    lessons.reset(); learning.reset(); lessonMode = 'none';
    active = true; playing = options.playing !== false; pauseReason = '';
    progress = Number.isFinite(options.progress) ? clamp(options.progress) : 0;
    cameraStep = ''; beginBlend();
    applyModel(); frame(0, motionReduced());
    if (progress >= 1) { playing = false; pauseReason = 'complete'; }
    return {ok: true};
  }
  function pause(reason = 'user') {
    if (!active) return;
    playing = false; pauseReason = reason; blend = null; haltClocks();
  }
  function resume() {
    if (!active || disposed) return {ok: false, reason: 'Start the workshop showcase first.'};
    if (progress >= 1) progress = 0;
    playing = true; pauseReason = ''; beginBlend();
    if (motionReduced()) { applyModel(); frame(0, true); }
    return {ok: true};
  }
  function seek(value) {
    if (!Number.isFinite(value)) return {ok: false, reason: 'Use a finite showcase position.'};
    if (!active) { const result = start({progress: value, playing: false}); if (!result.ok) return result; }
    progress = clamp(value); pause('seek'); applyModel(); frame(0, true);
    if (progress >= 1) pauseReason = 'complete';
    return {ok: true};
  }
  function stop() {
    if (!active) return;
    pause(); closeLesson();
    // Keep the service pose and camera. The user can immediately carry on with
    // the ordinary controls; the outer workshop Exit owns full restoration.
    service.update(0); learning.update(0); lessons.update(0);
    active = false; cameraStep = ''; blend = null; pauseReason = '';
    if (savedMaxDistance !== null) controls.maxDistance = savedMaxDistance;
    savedMaxDistance = null;
  }
  function update(dt = 0) {
    if (!active || disposed) return;
    if (!service.active) { stop(); return; }
    const elapsed = Number.isFinite(dt) ? clamp(dt, 0, .25) : 0;
    if (playing) progress = Math.min(1, progress + elapsed / DURATION);
    applyModel();
    if (playing) frame(elapsed);
    if (playing && progress >= 1) pause('complete');
  }
  const onOrbit = () => { if (active) pause('orbit'); };
  controls.addEventListener?.('start', onOrbit);
  return {
    start, pause, resume, stop, seek, update,
    get active() { return active; }, get playing() { return playing; }, get progress() { return progress; },
    get step() { return current.id; },
    get label() {
      if (progress >= 1) return 'Back in the Coates car';
      const phase = current.id === 'cycle' ? lessons.state?.phase : null;
      return phase?.label ? `${phase.label} stroke` : current.label;
    },
    get detail() {
      if (progress >= 1) return 'The workshop sequence is complete. Explore the car or replay it.';
      const phase = current.id === 'cycle' ? lessons.state?.phase : null;
      return phase?.instruction || current.detail;
    },
    get state() { return {active, playing, progress, step: current.id, label: this.label, detail: this.detail, pauseReason, duration: DURATION, reducedMotion: motionReduced()}; },
    get steps() { return SHOTS.map(({id, start, end, label, detail}) => ({id, start: start / DURATION, end: end / DURATION, label, detail})); },
    dispose() { if (disposed) return; stop(); controls.removeEventListener?.('start', onOrbit); disposed = true; },
  };
}
