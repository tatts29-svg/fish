# Workshop render integration

Author: Andrew Fisher

Scope: `workshop-render.js` and `tests/test_render1304.mjs`. The application owner
applies the changes below to the exact v13.03 `car-app.js`. This file itself does
not patch or publish anything.

## Defects and bounded improvement

The old order samples camera motion, tiny-part LOD and workshop finish LOD before
`workshop.update(dt)` moves the camera and engine. Move the workshop update ahead
of those final render decisions so they see this frame's pose and camera.

The old workshop shadow test compares the pose only immediately before and after
its update. If the sequence stops during the 66 ms throttle window, the final pose
is never requested on a later frame. The coordinator compares against the pose
actually drawn into the shadow map, retains pending changes and flushes them at
pause/completion. This also covers cycle rotation and changes to component,
cutaway, teaching fault and hand crank.

When all current workshop motion has stopped, the camera and picture remain
unchanged for one second, and no host motion remains, duplicate final draws may
be reused. Every animation and input/state/camera/projection/quality/size change
still draws immediately. A refresh occurs at least every 250 ms plus one host tick
to include asynchronous print/texture updates. All model/UI/input ticks still run.
No quality tier, device pixel ratio or clock is increased or bypassed.

The pure controller tests pass 112 checks. On a 10-second 30 Hz stationary schedule,
63 of 301 final draws remain and 238 duplicates are reused; the maximum refresh gap
is 266.67 ms. This is a scheduling count, not measured phone performance.

## Integration points

1. Import the new module and create one controller at module scope:

```js
import {createWorkshopRenderControl} from './workshop-render.js';
const workshopRender = createWorkshopRenderControl();
window.__workshopRender = workshopRender;
```

2. At the start of `onResize()`, after the existing renderer/camera guard, call
`workshopRender.invalidate('resize')`. Even an unchanged-size `renderer.setSize`
can clear a WebGL drawing buffer, so dimensions alone are not sufficient.

3. Change the adaptive sampling call at the start of `frameBody`:

```js
if (!workshop?.active || !workshopRender.idle) adapt(now, now-lastRender);
```

4. In `frame(now)`, retain the draw count before `frameBody`. Skip its CPU/frame-rate
fast-mode sampling when the active workshop reused the picture or is deliberately
idle. Otherwise retain the existing calculation unchanged:

```js
const t0 = performance.now(), beforeDraw = workshopRender.drawCount;
frameBody(now);
if (workshop?.active && (workshopRender.idle || workshopRender.drawCount === beforeDraw)) return;
const c = performance.now() - t0;
// Existing `if(c>.25){...}` follows unchanged.
```

5. Remove the old `frameCount++; if(now-fpsTime>1000){...}` block from immediately
before `updateCallout()`. Keep that exact block for the actual-draw path below.
Replace the final frame segment, from `motionStep(now)` through the old render,
with the following order. Retain `updateCallout()` / `updateServiceCallouts()` as
before; they update DOM only. `externalMotion` deliberately fails open for the
original drive, fans, wheel service, cockpit springs and self test:

```js
if (workshop?.active) workshop.update(dt);
motionStep(now);
if (occl && !workshop?.active) occl.update(dt);
detailStep();
finish?.update({camera, quality});
shadowStep(now);
const externalMotion = !!(
  drive.running || !drive.stationary || dynoSpin > 0 || service.moving ||
  Math.abs(drive.spread-drive.spreadTarget) > 1e-4 ||
  drive.pulls.some((value, index) => Math.abs(value-drive.pullTargets[index]) > 1e-4) ||
  cabin.fan || cabin.fanAuto || cabin.ign || shiftHand > 0 || cockpit?.selfTesting ||
  cockpit?.joints?.some(joint => Math.abs(joint.to-joint.at)>1e-4 || Math.abs(joint.v)>1e-3)
);
const decision = workshopRender.plan({
  now, workshop, camera, renderer, quality, externalMotion,
  detailKey: `${detailHidden}|${finish?.diagnostics?.detailVisible || 0}`,
  shadowDirty: renderer.shadowMap.needsUpdate,
});
if (decision.resetTiming) {
  fpsTime = now; frameCount = fps = frameEma = slowSince = 0; adaptAt = now;
}
if (decision.shadow) renderer.shadowMap.needsUpdate = true;
if (decision.draw) {
  if (!decision.idle) {
    // Move the existing `frameCount++; if(now-fpsTime>1000){...}` block here.
    // It now counts only frames submitted to the final render; intentional
    // reuse/refresh never triggers the existing automatic quality downgrade.
  }
  (composer ? composer.render() : renderer.render(scene, camera));
  workshopRender.commit(decision);
  if (workshop?.active && decision.shadow) workshop.shadowDirty = false;
}
```

If the existing FPS block invokes `applyQuality()`, it invalidates via `onResize()`
and resizes before this render, preserving the existing no-blank-frame behaviour.
The new revision is observed next frame; no stale snapshot can be retained.

6. In `updateUI()`, report intentional idle accurately:

```js
if (fps || workshopRender.idle) setT('render-stats',
  `${workshopRender.idle ? 'Still view' : fps+' fps'} · ${renderer.domElement.width} × ${renderer.domElement.height}`);
```

7. In the existing `pagehide` handler, take the event argument. After stopping the
animation loop, call `workshopRender.reset()` when `event.persisted`; otherwise
call `workshopRender.dispose()`. Reset again in the persisted `pageshow` path
before restarting the loop. The controller listens to document input and
visibility; its disposal removes every listener. Browser destruction owns other
application resources as before. Do not dispose the controller on ordinary
workshop exit: `plan` detects inactive state and restores the normal render path.

8. Remove the old per-frame `was !== workshop.motionKey` shadow block. Its separate
`workshopShadowAt` declaration is now unused and may be removed. Do not maintain
two shadow decisions. The existing general `shadowStep` remains intact.

## Browser acceptance required

Use the final candidate and verify:

- Continuous native workshop entry and action controls work after a stationary
  interval; actual mouse/touch events wake the picture, no forced click.
- Paused bench and service yield increasing `diagnostics.reused` with stable DPR;
  playback yields increasing draws and no reused frames while moving.
- Rotate, seek, change component/cutaway, turn the crank, choose oil/coolant/fault,
  orbit, resize/orientation and change quality after idle; each paints its new view.
- Stop service/cycle within a shadow throttle interval; `pendingShadow` clears and
  the final pose is shadow-rendered. Existing service/lesson motion stays exact.
- Exit restores ordinary car drawing and controls; reduced-motion remains honoured.
- Final-render screenshots remain current after `onResize`, even at equal size.
- No errors, console errors, operation writes or loss of existing paths.

The candidate visual/actual browser checks belong to the application owner. The
pure test does not establish real device loading time, graphics memory or frame rate.

## Actual browser correction

The first candidate's focused browser diagnostic kept drawing all 70 stationary
frames. There was no external motion or pending shadow, but OrbitControls
alternated the camera z coordinate by `8.88e-16` and quaternion components by
`2–5e-17`. Exact camera equality therefore never settled.

The corrected coordinator compares only camera/projection scalar values with an
absolute tolerance of `1e-12`. It does not modify the actual camera or matrices.
All mechanical state, viewport dimensions, pixel ratio, quality and input revision
comparisons remain exact. The observation is anchored until a meaningful change,
so individually tiny real camera movements accumulate and still wake the picture.
Regression checks use the actual recorded values, verify accumulated motion and
require even a `1e-14` mechanical-progress change to redraw and update shadows.
The final pure suite passes 112 checks. A fresh final-candidate browser run remains
required before claiming actual stationary draw reuse.
