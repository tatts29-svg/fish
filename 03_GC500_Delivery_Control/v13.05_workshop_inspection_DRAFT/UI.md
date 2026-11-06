# Inspection controls and camera integration

Author: Andrew Fisher

The existing bench controls retain their IDs and underlying service/lesson actions.
On phones and short landscape screens the same controls move into a compact tray
inside the scene panel. The model viewport ends above that tray in portrait and
beside it in landscape. Long explanations and connection text are grouped in
Details and connections. The tray scrolls internally, so a focused cycle or rotation
control does not scroll the model off the page. Desktop retains its sidebar bench.

The header keeps Overview, Lift and Exit available. Lift returns to the service
controls without changing service progress; Exit restores the original machine
layout. All bench buttons and compact sliders retain 44 px targets. Component
selection, oil/coolant routes, cutaway, challenges, cycle and isolated rotation use
the original state owners and controls.

Manual camera fits use `workshop-camera.js`; entry and real resize fits are instant.
Manual Inspect/View component/Overview uses the helper's interruptible transition.
The helper owns transition zoom limits, while the UI restores saved original limits
on exit. Lift-follow translation shifts both the visible camera and active flight.
The optional `cancelCamera()` host hook clears older app camera motion before a fit,
resize or workshop tour. No second RAF is introduced.

Public integration:

- `overview()` returns to workshop/service controls without changing service progress.
- `cameraMotion` and `cameraActive` expose the helper and whether a fit is moving.
- `inspection` exposes active/engine/component/partId/canSelect/cameraMoving/compact.
- `selectComponent(id)` uses the same registered selection flow as the dropdown.
  It refuses unsupported bench state, a running tour or the locked cycle component.
- `learning.refreshHighlight()` is called after final lesson poses through sync.

`tests/inspection_ui_checks.cjs` is a native-loop extension called by the root's
serialised browser harness before deterministic pose review. It covers actual bench,
crank, cycle keyboard, isolated rotation, 320 px, landscape, reduced motion and exit
layout restoration. Syntax checks pass. Browser and visual acceptance remain with
root; no browser or live publication was performed by this implementation task.
