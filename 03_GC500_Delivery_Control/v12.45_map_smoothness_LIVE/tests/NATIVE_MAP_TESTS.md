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

`map_native_closure_satellite.cjs` checks the closure satellite layer at fit and 2500% around a point from the native closure geometry. It waits for real tile load events, compares declared image coordinates with Chromium's resolved SVG lengths, and requires loaded imagery to cover sampled points inside the mapped area. The closure path geometry must remain unchanged. This detects the pre-existing large-coordinate clamp that could leave the satellite map dark despite loaded image elements. Run on phone and desktop; `EXPECT_REUSE=0` records the failing baseline without requiring coverage. Cropped map screenshots remain private and must be inspected.

Native evidence, 28 Oct 2026: candidate `63856220d5541f3e1f66b0bc2ea4bc98cdecee6f41d9804baf59401ffbc9ba57` passed six affected sessions: closure satellite coverage at fit/detail, repeated tile updates across all four SVG map modes, and closure-plan delayed replacement/reverse coverage, each on phone and desktop. No SVG coordinates clamped; every sampled point inside the mapped area had loaded imagery; closure paths and tile source selection were preserved. Repeated identical updates removed no tile nodes. Both viewport screenshots were inspected. All sessions had zero runtime errors, console errors and blocked operational writes.

The preceding candidate `61aad6aecefa69e5040de6d7f47ca2920001b21c2d93aad5d4b6fcfcd398da79` also passed the unchanged satellite-asset delayed-load/reverse checks and drawing fallback checks on phone and desktop, plus phone pin/filter checks. Its screenshots exposed the older closure-satellite defect. Matched native tests on the exact v12.43.1 base `174b7f4c51c46696caa44610eb31b1339c5f3e54dc573fb45c0b652d6f8133ff` reproduced both the satellite blank layer and early drawing fallback removal. The corrected final candidate's six affected checks above were rerun after local-origin rebasing. Raw screenshots, native records and diagnostic traces remain private.

This is focused native evidence, not READY or LIVE status. The release owner records final shared-toolchain checks, financial/record preservation, full sweeps and exact publication read-back separately. Cloud timing variation remains a limit; these checks do not certify every device or every map gesture as lag-free.
