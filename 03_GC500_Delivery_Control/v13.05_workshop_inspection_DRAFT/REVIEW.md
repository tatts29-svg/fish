# v13.05 inspection source review

Author: Andrew Fisher

Review recorded 6 November 2026. **Source and offline checks complete; final candidate browser acceptance and publication remain pending.** This record combines the independent integration review with the separate camera and release-guard reviews. It does not claim an independently verified live release.

Candidate 3 manifest: `9d025b77ba6bc9df7df83524acd7274b1d9a0cbf5071a235453d7ad8f99c925f`. The approved scope contains four replacements and three additions, with 242 files retained unchanged and 249 files total. Dashboard, operational records, maps and finance are outside this change.

| Frozen source | SHA-256 |
| --- | --- |
| `car-app.js` | `6302e14ce2b46feb25f6a55116e6c8d31f3b28a5d4b33fffb6713f2ed1070ddc` |
| `index.html` | `beee6f7c2d096c156a699dfeb190714a47292e0a447c82c4a80886d32b5ed4b4` |
| `workshop-camera.js` | `f85eb03715d2d9decb280d9c832832955cc4f6c989aa7195a2dc1ba4b58092a6` |
| `workshop-learning.js` | `e2fe1fa2c609733b47fe2c72f52ec728ac94ff536845fd95b8964de5a3a0aa0a` |
| `workshop-lighting.js` | `730d77c1fc5e9ceae1846c169453d886407f988ba479b8ab791e81d81945e58f` |
| `workshop-selection.js` | `fd0eedb71307bcab099f4b1644517d062335097f1cb10963270dbe388bd7a131` |
| `workshop-ui.js` | `6cc4084cc3ba2edc6114aea33112df9bf591e1d30281504f097dfd7752e9219b` |

The independent integration review found no remaining source blocker in selection, highlighting, UI controls, lighting or app lifecycle. Original model geometry and materials remain preserved. Isolated display picking maps to the registered component; teaching markers do not become selectable equipment. Picking runs on deliberate taps, not every frame. The phone layout reuses existing controls in a scrollable tray and reserves space for the model. Home returns to the workshop overview; Space inside bench controls does not trigger hidden service/refit actions. Lighting adjusts only the existing three light intensities and restores their adopted baseline.

The review found and resolved one resource defect: replacing the highlight position attribute could leave its previous GPU allocation without explicit retirement. The corrected code disposes the owned geometry while the old attribute is still attached, then installs the new attribute. The retained Three.js renderer removes the old buffers and registers the geometry again on its next draw. Independent re-review confirmed the correction. The [selection receipt](evidence/selection-unit.json) records **3,118 passing checks**, including grow/shrink/empty/final disposal, stable-pose buffer retention, isolated display geometry and preservation of original resources; the largest tested highlight contains 3,912 segments in one batch.

The separate camera review independently passed **4,420 checks** against the retained OrbitControls, including the corrected polar-limit path and interruption in both directions. Maximum measured control takeover drift was approximately `2.52e-15` in the offline test. See [camera evidence](evidence/camera-unit.json). The bounding-sphere clearance argument applies to the unprojected path; it is not a general collision guarantee after polar projection. Integrated native checks remain necessary.

The [lighting receipt](evidence/lighting-unit.json) records **33 passing checks**, with no added lights, shadow casters or render passes. The independent release-guard review confirmed the corrected protected inventory matches the committed v13.04 table exactly: all **11 hashes and byte counts**, canonical table SHA-256 `c7c5a5cf3e4e134d386926c7664b04515f7b4057c8b5b632bae79e5b8c6b2d85`. The corrected offline guard suite passed **34 tests**, including the complete-table regression in [test_release1305.py](release/test_release1305.py). Inventory checks establish blob presence and size, not the running process's environment protection.

The earlier [phone preview review](evidence/preview1-review.json) showed the model and controls visible with no reported browser errors or record writes, but used a previous candidate. It is diagnostic evidence only. Acceptance still requires desktop and phone machine checks plus desktop and phone dashboard checks on this exact frozen candidate, guarded publication, and exact live content read-back. No physical-device performance measurement or live-release verification is asserted here.
