# v12.45 map smoothness — READY TO UPLOAD

Author: Andrew Fisher

Drawing-sheet tile refreshes could retire the last sharp layer while replacement tiles were still loading. The refresh now keeps the last completed view until the current view has decoded, and bounds retained entries to that completed view plus the current request. Failed loads can retry; obsolete callbacks cannot restore pruned tiles.

The satellite assets map, VMS removals map and fence-closure map replaced all SVG image nodes on repeated updates, even when their tile URLs and geometry were unchanged. They now reuse those image nodes and update only changed attributes. The two satellite maps still regenerate pin markup on every apply, but reuse existing pin nodes when that exact markup is unchanged. Changed pin data and geometry still render. Tile selection, geometry, zoom limits, pin contents, search and layer groups are unchanged. This patch does not change the explorer frame, Claude's off-site rings, Demob pictures, records or financial calculations.

Base for current checks: v12.43.1 `174b7f4c51c46696caa44610eb31b1339c5f3e54dc573fb45c0b652d6f8133ff`. Preview `63856220d5541f3e1f66b0bc2ea4bc98cdecee6f41d9804baf59401ffbc9ba57`, 16,054,255 bytes. The patch requires an explicit matching base SHA and reviewed v12.43/v12.43.1 footer, and refuses repeated application or missing source sections.

Checks so far: 296 source-fragment lifecycle and DOM-identity assertions; 229 projection/geometry assertions; eight release-boundary tests; 214 inline scripts parse. Native before/after, phone/desktop sweeps and final successor rebuild remain required. The SVG helper retains one completed coarse anchor, the last completed view and the current request. The anchor uses the largest completed tile span, preserves its original projected geometry, and supplies retained fit coverage on reverse zoom. Explicit mode clearing removes all layers. A small loading/failure status explains imagery that is not yet available; it changes only with status and never captures gestures. Direct native delayed-load verification is still required. No claim of all map lag or blank frames being resolved. Not READY TO UPLOAD.

The closure satellite map also supplied absolute world coordinates beyond Chromium's SVG length limit: loaded tiles rendered far off screen. A fixed local origin now keeps image coordinates within range and compensates the inverse affine translation. Image URLs, projection, clip and closure lines are preserved. The native baseline reproduced the dark image at fit and zoomed views; the corrected final candidate still requires its native visual gate.

Final corrected candidate native checks pass on phone and desktop: closure satellite
imagery is visible at fit and detailed zoom, resolved SVG positions do not clamp,
loaded tiles cover the mapped sample points and closure paths are unchanged. The
four SVG map modes retain unchanged tiles, and delayed closure-plan loading retains
completed imagery and the reverse-zoom anchor. Six affected sessions have zero
runtime errors, console errors or operational write attempts. Screenshots inspected.
The earlier checks on unchanged drawing/readiness/pin modules remain separately
identified in `tests/NATIVE_MAP_TESTS.md`.

The final candidate also passes all 34 native financial/record-preservation checks.
Full desktop/phone sweeps are running. This remains DRAFT:43.1 must first be
independently verified live, and the shared rebuild must reproduce this exact map
candidate before a READY handover. This is not a claim of universal device speed.

## READY TO UPLOAD, 28 Oct 2026

The corrected candidate is frozen. Both full shared navigation sweeps passed:
27 tabs, 7 deep links and Back on desktop and phone; zero runtime errors,
console errors or operational write attempts. All 34 native financial/record
preservation checks pass on this exact candidate. The formerly blank closure
satellite imagery now renders at fit and detailed zoom on phone and desktop;
source URLs, projection, clipping and closure paths are preserved. Native
screenshots were inspected. Earlier pending statements above are superseded
by this completed gate and `CHECKS.json`.

The predecessor43.1 has been published and independently downloaded byte for
byte. The shared live-source build reproduces the tested candidate exactly.

Frozen implementation/tests source: `bb2cf6ff78c6a6b8934e57002e20f35a238db747`.

```sh
GC500_V1245_BASE_SHA256=174b7f4c51c46696caa44610eb31b1339c5f3e54dc573fb45c0b652d6f8133ff \
  bash 03_GC500_Delivery_Control/toolchain/build.sh v12.45 \
  03_GC500_Delivery_Control/v12.45_map_smoothness_DRAFT/patch_v1245.py
```

Require candidate SHA-256
`63856220d5541f3e1f66b0bc2ea4bc98cdecee6f41d9804baf59401ffbc9ba57`,
16,054,255 bytes. Claude owns the agreed money probe, guarded upload and
public-byte read-back. If the predecessor changes, return for rebase and
necessary checks. Not live until that succeeds. Financial45.1 and read-model46
must use the exact verified successor; Build47 remains a separate preview.
