**VERIFIED LIVE — 18 Oct 2026.** This release is included in published v10.71, SHA256 `34a6b81b4f5adc76a46c2d28670d24d1f72e0233092d13dd3445f8b0805b1df2`,18,506,356 bytes, published12:41 AEST and independently read back. Source382d0ee. Earlier draft/testing notes below are retained as history. Author: Andrew Fisher.

# Map pick and reference clearance — DRAFT

Author: Andrew Fisher.

This bounded follow-up fixes the two remaining map overlaps from HANDOVER_2. It does not change pins, master outlines, dimensions, quantities, status records, camera behaviour or the six pinned explorer scripts. The machine archive does not change, so no server-blob inventory guard needs to be changed by this release.

The kept circle's actual status badge and ring strokes retain their tap priority. Its transparent interior and enlarged finger target no longer take a tap from a visible neighbouring shape. Finished shapes shown by Done participate in the same visible-geometry selection before padded fallbacks. Hidden selected shapes are not added back as invisible tap targets. Padding still works in otherwise empty space.

Existing reference text checks the currently projected shape footprints, including the 12 px minimum Done footprints. It uses a nearby free side when the original position would cover a neighbour. Crowded unselected text can be suppressed until zoom or selection gives it room; a selected reference remains available. All status fills and ticks paint before reference text, preventing a later Done fill from painting over an earlier reference. The shape projections are shared between clearance and paint rather than calculated twice per frame.

## Source and release boundary

- Owner: the page release owner on STATUS.md; implementation in this folder only.
- Initial visual/source fixture: verified public v10.65 `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8`.
- Exact original shape-script SHA-256: `2ed1461a29f678593b744e871d60489f46de97c49d4901a0670217fe8596f7d2`.
- `patch_v1069.py` production entry requires the final v10.68 predecessor. `apply_shape()` supports a v10.65 isolated map fixture only; that fixture is not a release candidate.
- The patch refuses changed shape source, changed/expanded explorer allowlists, drifted anchors, a wrong predecessor or a second application. Every non-shape byte remains identical in the isolated transform; the production entry additionally advances the one release footer.
- Focused map proof is complete on the exact current v10.68 draft/candidate hashes below. Final standing release checks and live read-back remain with the release owner; this folder is still DRAFT, not a claim of publication.

## Checks so far

- Pure geometry tests: 24/24 (actual badge/ring versus transparent area, rotated/thin geometry, minimum Done footprint, nearby placement, selected visibility, no source mutation).
- Actual patched hit wrapper in VM: 13/13 (active/Done shapes, transparent ring gap, badge/ring priority, useful padding, native fencing fallback, hidden selection, shared-array preservation).
- Source/patch contracts: 9/9 (shape-only bytes, exact build pins, duplicate/drift refusal, release boundary and prior ripple preservation).
- Patched script parses in Node. Dry integration on the current v10.68 draft `101797711b79fde90b2fa6cb1a267cd89360dc42486f28c072e61fa1cc9329a0` yields `07cf8b6eedddc22397f301b9afae875137c608f5d62bae80a78249174cbfd88d` (18,491,946 bytes); `check_page.py` passes all 142 inline scripts and key/author checks. This predecessor is still a draft.
- Focused before/after browser proof: predecessor 13/13 and candidate 109/109 at each viewport (390 × 844 at DPR 2 and 1440 × 900 at DPR 1). Each candidate covers 48 active/Done/zoom/rotation cases. The predecessor reproduced 34 misdirected sampled hits on phone and 12 on desktop, plus four label overlaps on each; the candidate has zero in either category. A real touch/click selects the visible Done shape.
- Original master aerials and vector drawing are fully rendered and visually inspected on both sizes. Tests check 87 exact machine assets against the verified manifest; the real-tap reference photo is content-hash verified. No placeholders, page/console errors, shared-record writes or changed pins. Frozen API record 9704 keeps the comparison stable. This does not claim current third-party hybrid/satellite coverage or physical-phone testing.
- Sanitised evidence: `evidence/browser_checks.json`; full screenshots/results stay in private evidence storage. Earlier network/cache and full-`/tmp` attempts are not counted as passes. The final run uses a dedicated writable `TMPDIR` and preserves exact packed-vector HTTP 206 byte-range semantics.
- Final-page standing checks, affected existing shape regressions and verified-live predecessor/read-back remain with the release owner.

Run from repository root, with authorised private local fixture paths:

```sh
node 03_GC500_Delivery_Control/v10.69_map_pick_clarity_LIVE/tests/test_geometry1069.cjs
BASE=/private/base.html python3 -m unittest discover -s 03_GC500_Delivery_Control/v10.69_map_pick_clarity_LIVE/tests -p test_patch1069.py -v
PAGE=/private/candidate.html node 03_GC500_Delivery_Control/v10.69_map_pick_clarity_LIVE/tests/test_priority1069.cjs
```

All browser checks use the existing GET-only harness and shared `/tmp/gc500-browser.lock`; no test may write an operational record. The release owner rebuilds from the actual verified v10.68, completes required sweeps and affected shape checks, then uses the unchanged guarded page publisher and exact content read-back.

## Focused browser reproduction

Use the exact private v10.68/v10.69 HTML files, frozen API fixture and verified machine manifest. Clear inherited media overrides. Set `NODE_PATH` to the shared toolchain dependencies, `CHROMIUM_PATH` to the installed browser, and `TMPDIR` to a private directory with enough space. Under `flock /tmp/gc500-browser.lock`, run `tests/test_browser1069.cjs /private/candidate.html` with `GC500_FIXTURE`, `GC500_CACHE`, `GC500_MAP_MANIFEST` and private `OUT` paths. `GC500_MAP_ALLOW_GET=1` allows canonical read-only GETs for uncached genuine assets; every machine response must match the pinned manifest. Use `MOB=1` for phone and `BASELINE=1` for the predecessor. API state remains frozen; no operational writes are permitted.
