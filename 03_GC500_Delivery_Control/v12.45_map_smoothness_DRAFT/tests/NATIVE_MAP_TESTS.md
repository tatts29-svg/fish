Author: Andrew Fisher

These native Chromium checks open the supplied HTML at the normal view address with a frozen native record. They reject operational HTTP writes. The existing harness's Google basemap-session POST is the sole non-GET exception. Set `STATE` to an authorised private state snapshot and `OUT` to a private evidence directory; do not commit the snapshot or screenshots.

Run from this release folder using the repository's normal Playwright/Chromium environment. Run browsers serially with `/tmp/gc500-browser.lock`.

```sh
PAGE="$BASE" EXPECT_REUSE=0 MOB=1 OUT="$PRIVATE_OUT/base-tiles" node tests/map_native_tiles.cjs
PAGE="$CANDIDATE" MOB=1 OUT="$PRIVATE_OUT/candidate-tiles" node tests/map_native_tiles.cjs
PAGE="$BASE" EXPECT_REUSE=0 MOB=1 OUT="$PRIVATE_OUT/base-readiness" node tests/map_native_readiness.cjs
PAGE="$CANDIDATE" MOB=1 OUT="$PRIVATE_OUT/candidate-readiness" node tests/map_native_readiness.cjs
```

`map_native_tiles.cjs` verifies real loaded tiles in the satellite asset map, VMS removals, and fencing closure plan/satellite maps at 2500%. Twelve identical native view updates must preserve tile node identities, tile source selection, and pin/line counts. It waits beyond the closure map's 150 ms settle timer.

`map_native_readiness.cjs` first waits for actual SVG image load events. It then delays replacement Esri tile GET responses while changing level. The candidate must retain loaded previous imagery until the new level finishes, retain one completed coarse anchor, and retire obsolete intermediate imagery. Returning to the original completed coarse view must reuse its already-loaded nodes without refetching the anchor. A finer target layer may still need its own requests, so the test also checks retained anchor coverage at sampled viewport points. The test confirms requests were actually held; it does not infer readiness from node insertion.

These checks establish tile continuity and avoidable DOM churn. They do not establish a frame-rate guarantee, mobile network performance, whole-application financial correctness, or independent verification of a deployed release. `map_native_closure_readiness.cjs` applies the same check to closure plan source-byte requests. `map_native_pins.cjs` verifies identical markup retains pin nodes and hit targets; filter and zoom changes still update the current model, while a sibling overlay survives. `map_native_drawing.cjs` exposes only the native tile-callback boundary and holds load callbacks across a detail transition. It checks loaded fallback remains; it makes no frame-timing claim. Run each candidate check with both `MOB=1` and `MOB=0`.

A completed coarse anchor preserves coverage already seen. Newly revealed areas still need their own imagery; this is not a guarantee that every cold viewport is immediately sharp. The separate source-fragment tests cover failed loads, later retry, obsolete callbacks, bounded retained layers, and drawing-sheet fallback readiness.
