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
- Final v10.68 base/candidate hashes, browser evidence and release read-back are pending. **Not READY TO UPLOAD.**

## Checks so far

- Pure geometry tests: 24/24 (actual badge/ring versus transparent area, rotated/thin geometry, minimum Done footprint, nearby placement, selected visibility, no source mutation).
- Actual patched hit wrapper in VM: 13/13 (active/Done shapes, transparent ring gap, badge/ring priority, useful padding, native fencing fallback, hidden selection, shared-array preservation).
- Source/patch contracts: 9/9 (shape-only bytes, exact build pins, duplicate/drift refusal, release boundary and prior ripple preservation).
- Patched script parses in Node. Dry integration on the current v10.68 draft `101797711b79fde90b2fa6cb1a267cd89360dc42486f28c072e61fa1cc9329a0` yields `07cf8b6eedddc22397f301b9afae875137c608f5d62bae80a78249174cbfd88d` (18,491,946 bytes); `check_page.py` passes all 142 inline scripts and key/author checks. This predecessor is still a draft.
- Overview phone/desktop before/after reproduction, visual inspection, existing shape regressions and final-page required checks: pending shared browser slot/final v10.68 base.

Run from repository root, with authorised private local fixture paths:

```sh
node 03_GC500_Delivery_Control/v10.69_map_pick_clarity_DRAFT/tests/test_geometry1069.cjs
BASE=/private/base.html python3 -m unittest discover -s 03_GC500_Delivery_Control/v10.69_map_pick_clarity_DRAFT/tests -p test_patch1069.py -v
PAGE=/private/candidate.html node 03_GC500_Delivery_Control/v10.69_map_pick_clarity_DRAFT/tests/test_priority1069.cjs
```

All browser checks use the existing GET-only harness and shared `/tmp/gc500-browser.lock`; no test may write an operational record. The release owner rebuilds from the actual verified v10.68, completes required sweeps and affected shape checks, then uses the unchanged guarded page publisher and exact content read-back.
