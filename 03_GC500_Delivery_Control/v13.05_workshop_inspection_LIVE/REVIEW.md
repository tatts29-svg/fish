# v13.05 inspection source review

Author: Andrew Fisher

Review completed 6 November 2026. **Source, offline and final candidate acceptance, guarded publication and root’s fresh actual-live phone verification all pass.** Independent source/guard and offline receipt reviews are separate from root’s public browser verification; no Claude review is claimed.

Candidate 5 manifest: `b4cf3f0b2b768031f26d7463bdb8c7168506a1faee048f046407d8d1103b75b2`. The approved scope contains four replacements and three additions, with 242 files retained unchanged and 249 files total. Dashboard, operational records, maps and finance are outside this change.

| Frozen source | SHA-256 |
| --- | --- |
| `car-app.js` | `6302e14ce2b46feb25f6a55116e6c8d31f3b28a5d4b33fffb6713f2ed1070ddc` |
| `index.html` | `beee6f7c2d096c156a699dfeb190714a47292e0a447c82c4a80886d32b5ed4b4` |
| `workshop-camera.js` | `f85eb03715d2d9decb280d9c832832955cc4f6c989aa7195a2dc1ba4b58092a6` |
| `workshop-learning.js` | `e2fe1fa2c609733b47fe2c72f52ec728ac94ff536845fd95b8964de5a3a0aa0a` |
| `workshop-lighting.js` | `730d77c1fc5e9ceae1846c169453d886407f988ba479b8ab791e81d81945e58f` |
| `workshop-selection.js` | `fd0eedb71307bcab099f4b1644517d062335097f1cb10963270dbe388bd7a131` |
| `workshop-ui.js` | `88bfbeb876d51036c8e8b1b1f72ab320451d1d998402946299d23e8a39c3c1b9` |

The independent integration review found no remaining source blocker in selection, highlighting, UI controls, lighting or app lifecycle. Original model geometry and materials remain preserved. Isolated display picking maps to the registered component; teaching markers do not become selectable equipment. Picking runs on deliberate taps, not every frame. The phone layout reuses existing controls in a scrollable tray and reserves space for the model. Home returns to the workshop overview; Space inside bench controls does not trigger hidden service/refit actions. Lighting adjusts only the existing three light intensities and restores their adopted baseline.

Phone checking exposed an orientation regression: changing from a 320-pixel portrait viewport to 844 × 390 landscape could leave the portrait tray height active before the next frame/ResizeObserver callback, collapsing the model viewport to zero height. The frozen source moves tray sizing and landscape geometry into CSS clamps and an orientation media query, and invokes the existing framing path on native resize. Independent static review confirmed the control nodes, desktop/exit restoration and listener cleanup remain intact, with no additional animation loop or timer.

The subsequent strict phone check caught a separate six-pixel header overflow. Candidate 5 adds a compact-landscape media rule for header padding, gaps and the established phone wordmark width. Independent static review confirmed that this is the only change from candidate 4; control dimensions, visibility and camera geometry are preserved. Native Chromium HTML/CSS diagnostics show document width equal to viewport width and all measured header controls inside at widths 800, 801, 812, 844, 896 and 932 pixels. Those focused diagnostics do not replace full candidate acceptance.

The review found and resolved one resource defect: replacing the highlight position attribute could leave its previous GPU allocation without explicit retirement. The corrected code disposes the owned geometry while the old attribute is still attached, then installs the new attribute. The retained Three.js renderer removes the old buffers and registers the geometry again on its next draw. Independent re-review confirmed the correction. The [selection receipt](evidence/selection-unit.json) records **3,118 passing checks**, including grow/shrink/empty/final disposal, stable-pose buffer retention, isolated display geometry and preservation of original resources; the largest tested highlight contains 3,912 segments in one batch.

The separate camera review independently passed **4,420 checks** against the retained OrbitControls, including the corrected polar-limit path and interruption in both directions. Maximum measured control takeover drift was approximately `2.52e-15` in the offline test. See [camera evidence](evidence/camera-unit.json). The bounding-sphere clearance argument applies to the unprojected path; it is not a general collision guarantee after polar projection. Integrated native checks remain necessary.

The [lighting receipt](evidence/lighting-unit.json) records **33 passing checks**, with no added lights, shadow casters or render passes. The independent release-guard review confirmed the corrected protected inventory matches the committed v13.04 table exactly: all **11 hashes and byte counts**, canonical table SHA-256 `c7c5a5cf3e4e134d386926c7664b04515f7b4057c8b5b632bae79e5b8c6b2d85`. The corrected offline guard suite passed **34 tests**, including the complete-table regression in [test_release1305.py](release/test_release1305.py). Inventory checks establish blob presence and size, not the running process's environment protection.

The earlier [phone preview review](evidence/preview1-review.json) showed the model and controls visible with no reported browser errors or record writes, but used a previous candidate. Candidate 3 desktop dashboard diagnostics also passed 99 checks with no errors or writes. These are diagnostic results, not acceptance of candidate 5. At that earlier diagnostic stage, candidate 5 acceptance and publication were pending. The final acceptance and live results below supersede that stage; physical-device performance remains unmeasured.

The candidate 5 phone run completed 125 checks, including every new native interaction and the orientation regression, before an immediate legacy reduced-motion assertion ran ahead of the native media-query change event. Independent review approved a bounded wait for the actual media query and adopted lift preference; no synthetic event, application change or relaxed assertion. The failure is preserved in `evidence/phone3-failure.json`. Fresh full machine acceptance subsequently passed as recorded below; the partial run is not a passing acceptance receipt.

## Final candidate acceptance

Candidate 5 passes 127 desktop and 147 phone machine checks, plus 99 desktop and 100 phone dashboard checks. All four exact-candidate receipts report zero runtime/console errors and zero record writes; dashboard checks cover 27 routes and seven deep links each. The existing release validator accepted all four receipts and rehashed the complete 249-file tree. See `evidence/acceptance-validation.json`. Root reviewed final desktop and phone screenshots; independent phone layout review also passed. Source remains frozen at the seven hashes above. Publication and fresh actual-live verification subsequently passed, as recorded below.

## Publication and actual-live verification

Published source `8bb27046aa89ca585f7d7ef04db84e5d7e9fa042`, tested source `e8e22732d37f4f1ce37c74f173822c451c2388f1`. Registration completed 6 Nov 2026 15:39:50 AEST. `evidence/publication.json` records exact public bytes, the expected 249-file manifest, 242 retained descriptors, eleven protected unlisted blobs and unchanged dashboard. `publication-review.json` is the independent offline consistency review performed before the live browser result; its historical pending status does not describe the final release.

Root’s fresh public phone session subsequently passed 31/31 checks: all seven changed modules exact, all 77 loaded machine files hash-verified, empty cache, no candidate substitutions, zero runtime/console errors and zero record writes. Actual native controls and exact light/exposure restoration pass. `evidence/live-browser.json` SHA-256: `6f69f2ffcf8eb95f7555d5e0c156b86415297b2535915e0c80bf85caa222f055`. Root visually reviewed the live cycle screenshot: visible model above usable controls, Coates orange preserved. Screenshots and browser emulation establish layout and function, not physical-phone frame rate. No remaining release blocker.
