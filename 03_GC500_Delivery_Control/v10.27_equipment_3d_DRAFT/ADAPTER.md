# Equipment projection

Author: Andrew Fisher

`adapter1027.js` is an additive script, inserted after the existing page scripts and before `</body>`. It exposes `window.GC500Equipment1027` for the same-origin explorer and 3D child.

- `catalogue()` returns lightweight mapped reference rows: reference, kind, position, active state and `extrudable`.
- `snapshot(projectPoint, refs)` reads at most 32 requested references. Omit `refs` for the original five-reference Gate 6 example. `projectPoint(x, y)` is the explorer's existing sheet-point-to-`[latitude, longitude]` function. No second registration is stored.
- `get(ref, projectPoint)` returns one reference using the same projection.
- `open(ref, 'details' | 'photos')` opens the native drawer. Photos opens the existing FWF location gallery first, where available. It creates no new photo associations.

The snapshot contains named items, current quantities, received and installed quantities, the existing explicit completion classification, suppliers, known dimensions, source notes, available photograph counts and plan polygons. It includes no pricing, branch charges, credentials or record mutators. Each read is fresh and uses one existing `holdAssets` scope; no record-dependent answer survives between calls.

`location.kind` is `master`, `pin`, `place` or `area`. The native rule chooses a master tag on the unit first, then a recorded site pin or placement, then a broad area. `extrudable: false` means preserve the existing marker and do not invent a precise equipment position. Plan polygons are emitted only for master positions. A newer site pin does not inherit the previous plan polygon. Known dimensions and a drawing footprint remain different evidence; for example, the Gate 6 P60 contract footprint and the drawing rectangle differ. Missing heights stay null. A renderer may use clearly identified illustrative heights, never turn them into measured facts.

`dimensions.massKg` is a per-unit verified transport mass, only when every matched product agrees. Different or missing masses remain null while common dimensions stay available. Guide-model masses never become actual equipment weights. The patch also repairs the native identity serialiser so saved actual specifications can be checked against their physical unit.

Each component retains all native `doors` with their projected midpoint, drawing bearing, edge index/fraction, width and source. `doorCount` counts those doorway records; the original primary `doorBearingDeg` and `doorEdge` remain for compatibility. Door locations come from the same master/revised geometry as the footprint. Truck driver/passenger loading-side selections do not establish site-facing directions. An illustrated open leaf does not indicate a door's physical open/closed state on site.

`test_adapter1027.cjs` uses the shared read-only browser rig. It checks the native quantity/completion result, isolated output objects, no changes to shared state, valid/invalid projection handling, broader reference access, no guessed heights, and native grouped-photo navigation. All attempted network writes are aborted by the rig.

Run with `PAGE=/absolute/path/to/candidate.html CHROMIUM_PATH=/usr/bin/chromium node test_adapter1027.cjs` where Chromium is installed at that path.

15 October browser verification against the exact v10.25 source and current shared record: 149 mapped canonical references in the supported types, including 19 broad-area markers that must not be extruded. All batches of up to 24 references projected without errors. No record writes occurred. Native daily work, Costs and P&L functions were not modified.
