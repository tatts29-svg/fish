# Component selection and geometry detail

Author: Andrew Fisher

The inspection highlight now follows the existing rendered part geometry. It is
one depth-tested, depth-write-disabled `LineSegments` batch for the selected part;
its warm Coates accent does not alter the original material or use a screen-wide
outline pass. Cached `EdgesGeometry` supplies the component's real feature edges.
Current child/instance transforms, material visibility, source geometry replacements
and isolated-display rotation are respected. Still poses do not rewrite the edge
buffer. Buffer-size changes dispatch geometry disposal while the previous owned
attribute is still attached, allowing Three to free its GPU allocation before
replacement. Final disposal releases the current buffer and owned material/cache
resources. Original render resources are never disposed.

This is a feature-edge highlight, not an x-ray or a new model silhouette. Hidden
surfaces remain hidden. The separate lesson marker for the original fitted location
retains its existing contextual meaning.

`installWorkshopPicker({T,element,camera,scene,parts,enabled,onSelect,onChange})`
accepts `parts` as an array or getter returning `{id,group}` entries. Use
`parts: () => workshop.learning.pickParts` and
`enabled: () => workshop.inspection.canSelect`; the UI remains the authority for
supported bench, tour and cycle restrictions. The getter includes the current
visible isolated display under its registered component identity.

- `pickAt(clientX,clientY)` is read-only and returns `{id,point,instanceId}` or null.
- Native pointer release selects only after a deliberate primary tap: at most
  650 ms and 5 px mouse/9 px touch, with no intermediate drag or additional pointer.
- The nearest visible rendered surface determines occlusion, including surfaces
  without an inspection entry. Hidden ancestors/materials and teaching overlays
  do not intercept. An explicit registered display replica is eligible even though
  the separate ordinary-car picking handler is intentionally disabled for it.
- Raycasts run on tap only. `pickAt` also supports read-only test target discovery;
  it neither changes selection nor replaces native interaction acceptance.
- Blur, visibility changes, pagehide and lost pointer capture cancel old gestures.
  `dispose()` removes listeners. No animation loop or operational writes are added.
- Diagnostics expose taps, raycasts, successful selections and lastId.

`learning.refreshHighlight()` must run after the final lesson/showcase pose. The UI
calls it centrally when synchronising the bench. The existing helper name,
`Inspected original component`, is retained for lesson visibility compatibility.
`learning.diagnostics.highlight` records vertices, segments, draws, edge cache size,
rewrites and lifecycle. The visible isolation replica is used after lessons move it;
original geometry and source object ownership remain unchanged.

Checks: `WORKSHOP_SOURCE=<verified machine> node tests/test_selection1305.mjs`.
The focused suite passes 3,118 assertions: actual sixteen components with the live
finish hardware installed, geometry/instance following, real isolated-display
rotation, source resource preservation, synthetic occlusion/material/layer cases,
primary-tap intent, drag-away-back, long press, multitouch, capture loss, pagehide,
visibility and disposal. Largest actual selected batch is 3,912 segments in one
draw. Browser and live acceptance are separately owned by the release integrator.
