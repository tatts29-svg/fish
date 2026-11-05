/* Author: Andrew Fisher.
 * v13.04 — render the final workshop pose, then reuse truly stationary pictures.
 * The application still advances input, controls and every model on every tick.
 * This coordinator only decides whether that already-updated scene needs a draw.
 * It never changes quality, pixel ratio, geometry, materials or animation clocks.
 */
const same = (a, b) => a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
// OrbitControls can alternate the last binary digit of an unchanged camera.
// This tolerance applies only to camera/projection scalars, never model state,
// pixel ratio or viewport dimensions. At the nearest permitted view it is far
// below a visible pixel; neither the camera nor its matrices are changed.
const CAMERA_EPSILON = 1e-12;
const sameFrame = (a, b, cameraStart) => a.length === b.length && a.every((value, i) =>
  Object.is(value, b[i]) || i >= cameraStart && Number.isFinite(value) && Number.isFinite(b[i]) && Math.abs(value - b[i]) <= CAMERA_EPSILON);
const inputEvents = ['pointerdown', 'pointerup', 'pointercancel', 'wheel', 'click', 'input', 'change', 'keydown', 'keyup'];

export function createWorkshopRenderControl({
  eventTarget = typeof document === 'undefined' ? null : document,
  idleReuse = true,
  settleMs = 1000,
  refreshMs = 250,
  shadowMs = 66,
} = {}) {
  for (const [name, value] of Object.entries({settleMs, refreshMs, shadowMs})) {
    if (!Number.isFinite(value) || value < 0) throw Error(`Invalid workshop render ${name}`);
  }
  if (refreshMs === 0) throw Error('Workshop render refreshMs must be positive');
  let active = false, disposed = false, idle = false, revision = 0, observedRevision = -1;
  let observed = [], drawn = [], shadowDrawn = [], lastChange = -Infinity, lastDraw = -Infinity, lastShadow = -Infinity;
  let sequence = 0, awaiting = 0, pendingShadow = false, drawCount = 0, requested = 0, reused = 0, shadowCount = 0;
  let invalidations = 0, lastReason = 'first frame', lastNow = -Infinity;
  const onInput = () => invalidate('input');
  for (const event of inputEvents) eventTarget?.addEventListener?.(event, onInput, {capture: true, passive: true});
  const onVisibility = () => invalidate('visibility');
  eventTarget?.addEventListener?.('visibilitychange', onVisibility);

  function invalidate(reason = 'external change') {
    if (disposed) return;
    revision++; invalidations++; lastReason = String(reason).slice(0, 80);
  }
  function reset() {
    active = idle = pendingShadow = false; observed = []; drawn = []; shadowDrawn = [];
    lastChange = lastDraw = lastShadow = lastNow = -Infinity; observedRevision = -1; awaiting = 0;
  }
  function signatures({workshop, camera, renderer, quality, detailKey}) {
    const service = workshop.service, learning = workshop.learning?.state, lesson = workshop.lessons?.state;
    const showcase = workshop.showcase;
    // All current teaching routes are hand-driven; oilTravel also preserves a
    // full crank turn whose wrapped display angle happens to match the old one.
    const shadow = [
      service?.progress, service?.direction, service?.stage,
      learning?.active, learning?.mode, learning?.cutaway, learning?.selectedId, learning?.crankAngle,
      learning?.challenge?.id, learning?.challenge?.status,
      workshop.learning?.diagnostics?.oilTravel,
      lesson?.active, lesson?.kind, lesson?.crankAngle, lesson?.rotation, lesson?.reducedMotion,
      showcase?.active, showcase?.progress,
    ];
    const frame = shadow.slice();
    frame.push(service?.playing, lesson?.playing, showcase?.playing, quality, detailKey, revision,
      renderer?.domElement?.width, renderer?.domElement?.height, renderer?.getPixelRatio?.());
    const cameraStart = frame.length;
    frame.push(camera?.position?.x, camera?.position?.y, camera?.position?.z,
      camera?.quaternion?.x, camera?.quaternion?.y, camera?.quaternion?.z, camera?.quaternion?.w,
      camera?.zoom, camera?.near, camera?.far, camera?.fov, camera?.aspect);
    for (const number of camera?.projectionMatrix?.elements || []) frame.push(number);
    return {shadow, frame, cameraStart, complete: !!(service && learning && lesson && showcase && camera && renderer),
      moving: !!(service?.playing || lesson?.playing || showcase?.playing)};
  }

  function plan({now, workshop, camera, renderer, quality = 'laptop', detailKey = 0,
    externalMotion = false, shadowDirty = false} = {}) {
    if (disposed) throw Error('Workshop render control is disposed');
    if (!Number.isFinite(now)) throw Error('Workshop render timestamp must be finite');
    const wasIdle = idle;
    if (!workshop?.active) {
      const leaving = active;
      reset();
      return {draw: true, shadow: false, idle: false, resetTiming: wasIdle || leaving, token: 0, active: false};
    }
    requested++;
    if (now < lastNow) { reset(); invalidate('clock reset'); }
    lastNow = now;
    const entering = !active; active = true;
    const {shadow, frame, cameraStart, complete, moving} = signatures({workshop, camera, renderer, quality, detailKey});
    const forced = entering || observedRevision !== revision;
    const changed = !sameFrame(observed, frame, cameraStart);
    if (forced || changed || moving || externalMotion) lastChange = now;
    // Keep the comparison anchored until a meaningful change: a sequence of
    // individually tiny camera moves must accumulate and eventually wake up.
    if (forced || changed) observed = frame;
    observedRevision = revision;
    const animated = moving || !!externalMotion;
    pendingShadow = !same(shadowDrawn, shadow);
    // Compare with the pose actually shadow-rendered, not merely with the pose
    // before this update. A sequence that stops inside the throttle window must
    // flush its final shadow immediately; otherwise it could stay one pose old.
    const needsShadow = !!shadowDirty || !!workshop.shadowDirty ||
      pendingShadow && (entering || !animated || now - lastShadow >= shadowMs);
    idle = !!idleReuse && complete && !animated && !forced && !changed && !needsShadow && now - lastChange >= settleMs;
    const draw = !idle || !sameFrame(drawn, frame, cameraStart) || now - lastDraw >= refreshMs;
    const token = ++sequence; awaiting = token;
    if (!draw) reused++;
    return {draw, shadow: needsShadow, idle, resetTiming: wasIdle !== idle, token, active: true,
      // Keep these snapshots with the decision so commit records what was drawn,
      // even if a caller accidentally plans another frame before committing it.
      frame, shadowFrame: shadow, now};
  }

  function commit(decision) {
    if (disposed) throw Error('Workshop render control is disposed');
    if (!decision?.active) return;
    if (!decision.draw || decision.token !== awaiting) throw Error('Commit only the current workshop draw');
    awaiting = 0; drawn = decision.frame.slice(); lastDraw = decision.now; drawCount++;
    if (decision.shadow) {
      shadowDrawn = decision.shadowFrame.slice(); lastShadow = decision.now; pendingShadow = false; shadowCount++;
    }
  }
  function dispose() {
    if (disposed) return;
    for (const event of inputEvents) eventTarget?.removeEventListener?.(event, onInput, {capture: true});
    eventTarget?.removeEventListener?.('visibilitychange', onVisibility);
    reset(); disposed = true;
  }
  return {plan, commit, invalidate, reset, dispose,
    get idle() { return idle; }, get drawCount() { return drawCount; },
    get diagnostics() { return {active, idle, requested, draws: drawCount, reused, shadowUpdates: shadowCount,
      pendingShadow, invalidations, lastReason, settleMs, refreshMs, shadowMs, idleReuse: !!idleReuse, disposed}; }};
}
