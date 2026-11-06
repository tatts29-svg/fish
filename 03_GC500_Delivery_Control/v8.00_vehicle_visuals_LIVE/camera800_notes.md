# Selected vehicle detail cameras

Author: Andrew Fisher · 2 October 2026

The existing **Car detail** and **Front detail** controls now fit the selected machine or the complete car-and-trailer combination. The original seven selections, labels, camera headings and lens choices remain. A race-car closeup that already fits and has a clear sight line is retained.

`patch_camera800.py` follows the material component. Two guarded hooks fit the original desired camera rigs before their established exponential following filter. A final camera wrapper checks the filtered frame so resize or attachment motion cannot crop the subject. The original portaloo door camera remains available to other views; an explicitly selected detail view continues showing the complete combination while the door and arm animate.

Bounds come from the current cached source meshes, including car decals, and follow the same wheel, steering, sway, trailer, door and arm transforms as the renderer. Attachment prediction operates on copied state. Per-model part bounds and per-pose world bounds are cached. No source vertices, simulator values, records, placement coordinates, GPU resources or draw calls are changed.

The fitter keeps its azimuth and raises its pitch only when required to clear the existing road fences or source building footprints. Spatial grids bound the collision queries. An unresolved obstruction is reported as `clear: false`; the camera does not claim survey accuracy or move any scenery. Aspect handling includes phone layouts, paused resize and explicit export size. Existing camera smoothing remains frame-rate independent; safety corrections may immediately widen an otherwise cropped frame.

`G.vehicleCameraReport800()` exposes the active view, selection, aspect, projected extents, subject depth and clearance result for normal UI verification. Controlled inspection cameras are separate evidence and do not prove the product camera works.

CPU proof is in `evidence/camera800_checks.cjs` and its JSON report. It covers seven selections × two detail views × four aspect ratios, actual held simulation poses and independently captured draw matrices where supplied, unchanged simulation/selection functions, portaloo door animation, the prior circuit camera handoff, resize/export, cache invalidation and source obstruction behavior. Host CPU timings are diagnostic only. Final real desktop/phone captures remain required before visual approval.
