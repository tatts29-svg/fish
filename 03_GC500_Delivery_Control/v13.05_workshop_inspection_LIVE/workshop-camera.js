/* Author: Andrew Fisher.
 * Manual workshop inspection moves on the host's existing animation clock.
 * The UI supplies framing/projection and target zoom limits. During a flight
 * the helper keeps both the current and destination views legal for controls.
 */
const finiteVector = value => !!value && [value.x, value.y, value.z].every(Number.isFinite);
const ease = value => value * value * (3 - 2 * value);

export function installWorkshopCamera({T, camera, controls, element, reducedMotion = false,
  onChange = () => {}, duration = .65} = {}) {
  if (!T || !camera?.position || !controls?.target) throw Error('Workshop camera needs the existing camera and controls.');
  if (!Number.isFinite(duration) || duration <= 0 || duration > 2) throw Error('Workshop camera duration must be between zero and two seconds.');
  const offset = new T.Vector3(), point = new T.Vector3(), look = new T.Vector3();
  const viewOffset = new T.Vector3(), up = new T.Vector3(), yAxis = new T.Vector3(0, 1, 0);
  const upToY = new T.Quaternion(), upFromY = new T.Quaternion(), polar = new T.Spherical(), arc = new T.Spherical();
  let flight = null, disposed = false, lastReason = 'ready', revision = 0;
  const motionReduced = () => typeof reducedMotion === 'function' ? !!reducedMotion() : !!reducedMotion;
  const notify = reason => { lastReason = reason; revision++; onChange(reason); };

  function restoreAutoRotate(value) {
    if (value?.autoRotate !== undefined) controls.autoRotate = value.autoRotate;
  }

  function applyLimits(value, preservePose = false) {
    const distance = camera.position.distanceTo(controls.target);
    controls.minDistance = preservePose ? Math.min(value.minDistance, distance) : value.minDistance;
    controls.maxDistance = preservePose ? Math.max(value.maxDistance, distance) : value.maxDistance;
  }

  function cancel(reason = 'cancelled') {
    if (!flight) return false;
    const previous = flight; flight = null; applyLimits(previous, true); restoreAutoRotate(previous); notify(reason); return true;
  }

  function constrainPolar(position, target) {
    viewOffset.copy(position).sub(target);
    if (viewOffset.lengthSq() < 1e-18) return;
    upToY.setFromUnitVectors(up.copy(camera.up).normalize(), yAxis);
    polar.setFromVector3(viewOffset.applyQuaternion(upToY));
    const low = Math.max(1e-6, Number.isFinite(controls.minPolarAngle) ? controls.minPolarAngle : 0);
    const high = Math.max(low, Math.min(Math.PI - 1e-6, Number.isFinite(controls.maxPolarAngle) ? controls.maxPolarAngle : Math.PI));
    const phi = Math.max(low, Math.min(high, polar.phi));
    if (Math.abs(phi - polar.phi) <= 1e-12) return;
    polar.phi = phi; upFromY.copy(upToY).invert();
    position.copy(target).add(viewOffset.setFromSpherical(polar).applyQuaternion(upFromY));
  }

  function apply(position, target) {
    // Keep the displayed pose legal for the next real OrbitControls update,
    // including when a pointer interrupts halfway around the engine.
    constrainPolar(position, target);
    camera.position.copy(position); controls.target.copy(target);
    camera.lookAt(target); camera.updateMatrixWorld(true);
  }

  // Consume any old orbit damping through the public controls API, then put the
  // visible pose back. No private OrbitControls state is changed. Otherwise a
  // stale drag can resume after an inspection move finishes.
  function settleControls() {
    if (typeof controls.update !== 'function') return;
    const position = camera.position.clone(), target = controls.target.clone();
    const quaternion = camera.quaternion.clone(), damping = controls.enableDamping, auto = controls.autoRotate;
    try {
      controls.enableDamping = false; controls.autoRotate = false; controls.update(0);
    } finally {
      camera.position.copy(position); camera.quaternion.copy(quaternion); controls.target.copy(target);
      camera.updateMatrixWorld(true); controls.enableDamping = damping; controls.autoRotate = auto;
    }
  }

  function moveTo(fit, {instant = false} = {}) {
    if (disposed) return {ok: false, reason: 'The workshop camera has closed.'};
    if (!finiteVector(fit?.center) || !finiteVector(fit?.position) ||
        !finiteVector(camera.position) || !finiteVector(controls.target)) {
      return {ok: false, reason: 'Inspection needs finite model bounds and camera positions.'};
    }
    const center = fit.center.clone(), destination = fit.position.clone();
    constrainPolar(destination, center);
    const to = destination.clone().sub(center), toRadius = to.length();
    if (toRadius < 1e-6) return {ok: false, reason: 'Inspection camera must remain outside its focus point.'};
    const minDistance = fit.minDistance ?? controls.minDistance ?? 0;
    const maxDistance = fit.maxDistance ?? controls.maxDistance ?? Infinity;
    if (!Number.isFinite(minDistance) || minDistance < 0 || !(maxDistance > minDistance) ||
        (maxDistance !== Infinity && !Number.isFinite(maxDistance)) || toRadius < minDistance || toRadius > maxDistance) {
      return {ok: false, reason: 'Inspection needs zoom limits that contain the fitted view.'};
    }
    // Copy the actual model bounds now: animated source bounds may change later.
    const bounds = fit.bounds?.isBox3 && !fit.bounds.isEmpty() && finiteVector(fit.bounds.min) && finiteVector(fit.bounds.max)
      ? fit.bounds.clone() : null;
    cancel('retargeted'); settleControls();
    if (instant || motionReduced()) {
      apply(destination, center); applyLimits({minDistance, maxDistance}); notify(instant ? 'instant' : 'reduced-motion');
      return {ok: true, animated: false};
    }
    const fromPosition = camera.position.clone(), fromTarget = controls.target.clone();
    if (fromPosition.distanceToSquared(destination) < 1e-16 && fromTarget.distanceToSquared(center) < 1e-16) {
      apply(destination, center); applyLimits({minDistance, maxDistance}); notify('already-framed'); return {ok: true, animated: false};
    }
    // Orbit about the destination's real focus, rather than linearly crossing
    // its engine/part. A large overview may contain the starting close-up; in
    // that case the radial move leaves the enclosing bounds without dipping
    // towards their centre. The caller never receives fabricated dimensions.
    const from = fromPosition.clone().sub(center), fromRadius = from.length();
    if (fromRadius > 1e-9) from.divideScalar(fromRadius); else from.copy(to).normalize();
    to.normalize();
    let envelope = 0;
    if (bounds) {
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        envelope = Math.max(envelope, point.set(x, y, z).distanceTo(center));
      }
    }
    const alignment = new T.Quaternion().setFromUnitVectors(camera.up.clone().normalize(), yAxis);
    const fromPolar = new T.Spherical().setFromVector3(from.clone().applyQuaternion(alignment));
    const toPolar = new T.Spherical().setFromVector3(to.clone().applyQuaternion(alignment));
    let thetaDelta = toPolar.theta - fromPolar.theta;
    thetaDelta = ((thetaDelta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    // A shortest quaternion arc can pass through the zenith. Clamping that arc
    // would flip its azimuth at the pole; interpolate its wrapped azimuth and
    // polar angle instead, going around the engine without that discontinuity.
    flight = {fromPosition, fromTarget, center, destination, from, fromRadius, toRadius,
      fromPhi: fromPolar.phi, toPhi: toPolar.phi, fromTheta: fromPolar.theta, thetaDelta,
      toWorld: alignment.invert(), elapsed: 0, envelope,
      outsideEnvelope: envelope > 0 && fromRadius >= envelope && toRadius >= envelope,
      minDistance, maxDistance, autoRotate: controls.autoRotate};
    // The target also moves during a focus request. Triangle bounds cover its
    // whole path, so an intervening controls.update cannot clamp a tiny valve
    // view to the larger overview distance (or the reverse).
    const targetTravel = fromTarget.distanceTo(center);
    controls.minDistance = Math.min(controls.minDistance ?? 0, minDistance, Math.max(0, Math.min(fromRadius, toRadius) - targetTravel));
    controls.maxDistance = Math.max(controls.maxDistance ?? Infinity, maxDistance, Math.max(fromRadius, toRadius) + targetTravel);
    if (controls.autoRotate !== undefined) controls.autoRotate = false;
    notify('started'); return {ok: true, animated: true};
  }

  function update(dt = 0) {
    if (!flight || disposed) return false;
    const current = flight;
    if (motionReduced()) {
      flight = null; apply(current.destination, current.center); applyLimits(current); restoreAutoRotate(current); notify('reduced-motion'); return true;
    }
    if (!Number.isFinite(dt) || dt <= 0) return false;
    current.elapsed = Math.min(duration, current.elapsed + dt);
    const t = ease(current.elapsed / duration);
    if (current.elapsed >= duration) {
      flight = null; apply(current.destination, current.center); applyLimits(current); restoreAutoRotate(current); notify('complete'); return true;
    }
    const radius = current.fromRadius + (current.toRadius - current.fromRadius) * t;
    arc.set(radius, current.fromPhi + (current.toPhi - current.fromPhi) * t, current.fromTheta + current.thetaDelta * t);
    offset.setFromSpherical(arc).applyQuaternion(current.toWorld);
    point.copy(current.center).add(offset); look.lerpVectors(current.fromTarget, current.center, t);
    apply(point, look); notify('moving'); return true;
  }

  // The lift's existing follow code moves the visible camera and target. Shift
  // an in-flight destination by that same measured model delta so its next
  // absolute interpolation cannot pull the view back to the old engine pose.
  function translate(delta) {
    if (!flight || disposed || !finiteVector(delta) || delta.lengthSq() === 0) return false;
    flight.fromPosition.add(delta); flight.fromTarget.add(delta);
    flight.center.add(delta); flight.destination.add(delta);
    return true;
  }

  const interrupt = () => cancel('input');
  const pointerOptions = {capture: true, passive: true};
  for (const event of ['pointerdown', 'wheel', 'keydown']) element?.addEventListener?.(event, interrupt, pointerOptions);
  controls.addEventListener?.('start', interrupt);

  return {
    moveTo, update, cancel, translate,
    get active() { return !!flight; },
    get state() { return {active: !!flight, disposed, reason: lastReason, revision,
      duration, elapsed: flight?.elapsed || 0, outsideEnvelope: !!flight?.outsideEnvelope}; },
    dispose() {
      if (disposed) return;
      cancel('disposed'); disposed = true;
      for (const event of ['pointerdown', 'wheel', 'keydown']) element?.removeEventListener?.(event, interrupt, pointerOptions);
      controls.removeEventListener?.('start', interrupt);
    },
  };
}
