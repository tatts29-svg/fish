# Manual inspection camera

Author: Andrew Fisher

`installWorkshopCamera({T,camera,controls,element,reducedMotion,onChange})` returns
`moveTo(fit,{instant})`, `update(dt)`, `cancel(reason)`, `translate(delta)`, `active`, `state` and
`dispose()`. Default movement lasts 0.65 seconds, driven only by the existing host
clock. There is no second animation loop and no work while inactive.

The arc uses the shortest wrapped azimuth with polar interpolation, rather than
a shortest quaternion path through the zenith. Every displayed offset is legal
for the host's public min/max polar angles while preserving its current radius
and target. Legal fitted endpoints remain exact; an out-of-range endpoint is
constrained before display. This prevents a camera jump when the user interrupts
above the engine and OrbitControls takes over.

The UI continues to own projection and supply its fitted `minDistance` and
`maxDistance`, together with `center`, `position` and `bounds: box` from the actual
component. Do not assign the target zoom limits before calling the helper. It
temporarily unions the old/destination range and the whole arc's distance range,
then applies the exact destination limits when done. On input cancellation it
keeps the destination range expanded just enough for the currently displayed pose,
preventing a small-part/overview jump. The UI restores original limits on exit. Call
`update(dt)` after the normal OrbitControls update. A move follows an arc around
the destination focus; opposite-side close-ups do not cut through the engine's
centre. When both camera endpoints are outside the actual bounding sphere, the
underlying radial arc remains outside it. Polar correction is applied about the
interpolated controls target and can change that path; the envelope diagnostic
describes the arc endpoints, not general scene collision prevention. A close-up
inside larger overview bounds moves outward along the underlying radius without
overshoot.

Pointerdown, wheel, canvas keyboard interaction and OrbitControls `start` cancel
immediately at the visible pose. Old damping is consumed through the public
controls API at the start, with the visible pose and controls flags preserved.
Auto-rotation pauses for the flight and restores on completion/cancellation.
`onChange(reason)` lets the UI mark current shadows/render state dirty.

When the existing lift-follow code adds the measured engine delta to the visible
camera and target, call `translate(delta)` with that same delta before `update`.
It shifts the active flight's endpoints without applying the delta a second time
to the visible camera. It does nothing when no flight is active.

Use `{instant:true}` for orientation/viewport refits, cancel before starting the
workshop tour or exiting, and dispose with the UI. Reduced motion resolves directly
to the fitted view, including if its preference changes during a flight. The helper
does not change engine geometry, scene lighting or projection.

`tests/test_camera1305.mjs` uses the real Three.js camera/vector implementation to
check opposite-side arcs, input interruption, retargeting, refresh-rate independence,
resize/reduced-motion replacement, invalid input and lifecycle restoration.
Native browser acceptance remains with the integrated UI release.

Integration review reproduced a 0.254866 m cancellation jump in the earlier
candidate at the host's 0.04 radian polar floor. The final tests sample both
directions with the shipped OrbitControls and those actual host limits, including
continuous intermediate frames and input cancellation. This correction is included
in the current source; the earlier candidate must be rebuilt before publication.
