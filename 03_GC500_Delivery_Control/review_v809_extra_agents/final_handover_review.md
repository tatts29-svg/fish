# v8.09 machine — final independent handover review

Author: Andrew Fisher · 3 Oct 2026 AEST.

**The frozen machine handover passes the independent source, asset and evidence review. No remaining source/payload blocker was found.** This is approval of the reviewed handover for guarded registration after v8.16; it is not a LIVE declaration. No browser, GPU or network workload was started for this review.

Source is `dfec015586208531bbe31fe507d44cc9cc49955e`, explicitly READY in board `d5b1e7c4c4d1b5b44ac1f0a552eb843a183034ae`. All **63 work files** are byte-identical to previously audited `c1f6fb5`; the four accepted corrective groups remain exactly as reviewed. The optional camera-ownership, complete-body opening and Next-heading focus proposals are excluded. Rejected v8.17 Lottie work remains parked and is not part of this union.

| Verified item | Result |
| --- | --- |
| Base | `65c47180502d9052ca3661e5aedd06683e8168c1e9be9297bcbcb7c2e4d9fe86`; 219 files, 172,184,133 bytes |
| Full candidate union | `7d2ff39f645696c212197f1bf0c7dfe8e4a01c232c4e3ca1dbea359b53500a1e`; 226 files, 172,348,506 bytes |
| Delta | 17 changed + 7 new; 202 complete descriptors preserved; zero removed |
| Local bytes | All 24 changed/new payloads and all 63 work files match candidate hashes/sizes; 56 base files match base descriptors |
| Maps | All four v8.13 map descriptors remain exact, including both explorer scripts and both explorer/3D entries |
| Closure | 97 resolved executable/asset references; three additional names occur only in comments; zero missing runtime references; 61-module graph and 34 audio clips resolve |
| Runtime evidence | 782/782 final checks; two people runs of 2,193 samples each, no failures or errors |
| Runtime provenance | 19 sessions, including two baseline comparisons; all 17 work sessions bind the candidate; 63 distinct local work files and 40 distinct fetched assets match the union |

The canonical digest was independently recomputed, the owner's union/closure scripts were rerun only in a private archive, and the stock `satellite_explorer/tools/machine_set.py --dry-run` produced the identical complete manifest. The manifest JSON file hash is `b6cedf5839d005d3597608b58037d64700d586086de067d70ec87f140760a59f`; registration uses the canonical **7d2ff39f…** digest above, not the file hash. The [aggregate evidence](final_handover_aggregate.json) records all 24 payload hashes, the four map descriptors, per-suite totals and source bindings.

Final totals are driver 86, UI 549, mechanics 54, effects 51 and legacy 42 = **782**. The superseded 4K failure is the documented screen-pixel/CSS-pixel comparison; the corrected check accounts for zoom and additionally requires clipping. Its 134/134 rerun passes, as does a separate 107/107 phone QUICK rerun that is **not counted again**. The two baseline legacy failures concern the old close-button size. Baseline provenance mismatches for old `style.css` and `cockpit-surfaces.js` are expected comparisons; candidate sessions have none. Runtime evidence is software-rendered and does not establish physical-device FPS or GPU memory performance. Existing very narrow canvas-ratio camera-clamp limitations remain documented.

The owner recorded a public GET comparison of 56 base files and all four map files, all matching. This review checked that evidence and its bindings, but did not perform a new live read. The publisher must still prove the base is current and verify post-registration public bytes.

Two README wording issues are non-blocking: its source row remains a placeholder (the READY board supplies the exact commit above), and its host-entry sentence says all three entries are unchanged even though `index.html` is one of the 17 reviewed changes. The two map entries are unchanged. The aggregate counts and manifest are correct.

The prepared guarded publisher is [publish_machine809.py](../review_v809_release/evidence/publish_machine809.py), reviewed at SHA-256 `09c038ca8d3ded7589f32c62267b6b6a4422b3787ba89be49a1a2be745e91851`. Offline verification confirms its three frozen input-file bindings and exact 219→226 union. It admits only the 24 reviewed blob hashes, permits only their blob PUTs and the exact manifest POST, rechecks the live base and current page immediately before registration, and verifies **every one of the 226 public files** afterwards. It keeps diagnostics private and credentials in `GC500_EDIT_TOKEN`. No publisher main function or network call was executed during review. Use a new private output subdirectory; the wrapper deliberately refuses an existing directory.

For the publisher, the reviewed command shape is:

```bash
python3 03_GC500_Delivery_Control/review_v809_release/evidence/publish_machine809.py \
  --base-manifest "$FROZEN809/evidence/handover/base_manifest_v813.json" \
  --manifest "$FROZEN809/evidence/manifest_v809.json" \
  --work "$FROZEN809/work" \
  --machine-tool 03_GC500_Delivery_Control/satellite_explorer/tools/machine_set.py \
  --expected-page-sha "$PUBLISHED816_SHA256" \
  --private-dir "$PRIVATE809/publication"
```

Keep the release claim frozen: the service has no compare-and-swap registration API, so the immediate base check plus coordinated publication prevents replacing another agent's new union. Capture private record fingerprints before/after separately; machine registration does not authorise record changes.

[live_smoke809.cjs](../review_v809_release/evidence/live_smoke809.cjs) is prepared and syntax-checked only. With `OUT` outside Git and `EXPECTED_PAGE_SHA256` set to the current host, it creates a fresh machine cache, opens the actual public host and native machine on desktop/phone, checks the served application hash/runtime, then closes with the native Back control and checks frame removal/focus. It writes private screenshots/results and closes browsers serially. Root retains the GPU slot and decides when to run it. Final gates are guarded registration, full public readback, unchanged record fingerprints and this current-host smoke.
