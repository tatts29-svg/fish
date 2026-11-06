# Coates Way machine — frozen source release audit

Author: Andrew Fisher · 3 Oct 2026 AEST.

**The required review corrections are integrated in source. This snapshot is not READY TO UPLOAD.** The independent source/CPU audit below does not replace the implementation owner's final browser runs, visual review or exact release handover. The moving draft, live service and operational records were not changed.

## Exact scope

- Frozen source: `c1f6fb5587c43472bf0db1cde053bbf0fd21a707`, recovered with `git archive` into a private directory. This is an audit of that commit, not a claim that its author has frozen later work.
- Compared against the four accepted proposals in `review_v809_extra_agents/` from `25ef793` / `f45961b`, originally prepared on `ba9fff7ec48d3d49d037f461c145b1abd6f2c957`.
- Current `car-app.js`: `d2964c3138eb1b2429a542cfb598adb507ae345b6b92858c78231fdbe49ff3c8`.
- Original combined proposal `car-app.js`: `2dcb49b9e26dded7f4ce14e5733c40ab48691ca8ee66d49dc53527026cb25afb`.

All 63 current `work/` files match the independent combined proposal byte for byte except `car-app.js`. Its **only** difference is the deliberately omitted, optional Next-heading focus change: opening the tour still focuses its heading, while subsequent Next presses retain focus on Next. `evidence/CHANGES_ui.md` explicitly records the keyboard rationale: repeatedly moving focus to the heading requires a user to tab back to Next each time. This is a legitimate scope decision, not a missing required fix. There are no unexplained extra production-source changes against the combined proposal.

The separate camera-ownership and complete-body-opening options were not part of the accepted combined correction. They remain unimplemented options. The rejected v8.17 Lottie/custom-motion direction remains parked and excluded.

## Required corrections and independent checks

| Area | Integrated source and result on this exact snapshot |
| --- | --- |
| Phone pointer ownership | The second pointer preserves the original wheel grab. Both release orders and cancellation clear the held state; car orbit restores and cockpit orbit remains disabled as intended. Eight extracted-source pointer checks pass. |
| Tour/register overlap | `openRegister()` ends the tour before opening the register. The extracted-source single-surface check passes. Both added button names match the proposal. |
| Driver first visible frame | The figure receives `m.update(0)` before it becomes visible. Actual figure/Three.js CPU checks confirm sill position, crouch, finite transforms and no clock advance on first exit and after Reset. The new browser regression also checks facing direction; that browser run was not repeated here. |
| Resource ownership | Composer passes are disposed once; GTAO's two omitted materials are disposed; failed setup uses the same cleanup. Actual Three.js ownership checks report each of 14 tracked resources disposed once over five cycles, plus idempotent and detached-pass cleanup. |
| Hidden-tab timing | Resume resets assessment/render timing. Extracted real timing logic retains Balanced after the hidden interval. This is not a physical-device FPS or GPU-memory result. |
| Clutch ordering and ramp | Current starter state reaches the clutch before engine animation. The first starting frame passes zero turn to the gearbox. Release passes 1/3 rad for 1, 2, 10 and 100 partitions; restart, stopped, reverse and clamp-crossing checks pass. |
| Module/assets | All 59 local JavaScript modules parse; main and legacy entry graphs link; checked literal assets resolve in the complete union. |

Six CPU/static subprocesses passed: phone controls, button names, driver, mechanics, rendering ownership/timing and integration. The phone test was copied privately and its single **optional** heading-focus assertion changed to require the documented retained `tour-next` focus; all mandatory assertions were unchanged. Its nine mandatory candidate checks pass. The original proposal test would intentionally fail that optional expectation, so it must not be represented as an unmodified 10/10 proposal-test pass.

The camera harness continues to record the known conditional narrow-aspect limit: OrbitControls clamps a requested distance above 20 at canvas ratios around 0.552 and below. It does not establish a normal-phone defect; the earlier measured normal-phone canvas was 390 × 493. Normal playback and actual target viewports remain part of final visual review.

## Complete machine union

The offline union was independently recomputed against the verified v8.13 machine manifest `65c47180502d9052ca3661e5aedd06683e8168c1e9be9297bcbcb7c2e4d9fe86`:

- Candidate digest: `7d2ff39f645696c212197f1bf0c7dfe8e4a01c232c4e3ca1dbea359b53500a1e`.
- 226 files, 172,348,506 bytes; 17 existing files change, seven are added, 202 existing descriptors are preserved and no existing file is removed.
- All four map descriptors remain exact: `explorer/explorer.js`, `explorer/explorer-merge.js`, `explorer/index.html`, `poc3d/index.html`.
- All 56 copied base files still match their retained live descriptors. Service count and size limits pass.

This is a review-only union, not a registered release. Its different digest from the earlier `9dd88ab4…` proposal union is fully explained by the optional focus decision. Its identical byte count is incidental. **Do not upload `work/` alone:** it omits 163 retained live files. Obtain the then-current live manifest and preserve its unrelated descriptors before publication; the retained v8.13 manifest here was not re-fetched by this read-only audit.

## Final handover gaps

1. **Exact final browser evidence is absent from this frozen handover.** New regression checks exist in `ui_tests.js`, `driver_tests.js`, `mech_tests.js` and `fx_tests.js`, covering all required corrections. Earlier prose records are useful history, but this snapshot has no saved result JSON/log or screenshot set bound to the current source and complete union. Obtain the owner's completed runs or execute them on the final candidate; save counts, failures, viewport/DPR/query, source/union hashes and reviewed phone/desktop images. Do not infer that tests passed from their presence.
2. **The test rig still uses a moving fallback baseline.** `machine_rig.js` is unchanged: any missing local path is fetched from the live `/w/Coates-GC500-2026/` address without checking its descriptor/hash or writing a provenance log. Its “fetched once … and cached” comment is not implemented by that file. Bind fetched asset bytes to the retained complete union, fail unknown/mismatched assets and save the response manifest with the final runs. Static linkage found no missing local module in this snapshot; the issue is test provenance, not a demonstrated absent module.
3. **Affected legacy path coverage is not recorded.** `style.css` changes and `mechanism.html` uses it with legacy `app.js`. Static linkage passes; a bounded legacy controls/readability check remains part of the affected browser scope.
4. **No exact READY publication handover exists in this snapshot.** The draft README still says in progress and names an older machine version. Finish and freeze the agreed source; provide final source commit, then-live retained digest and reviewed complete candidate digest. Guard registration immediately against a changed live digest, then read back the registered digest and every changed public asset. Confirm host machine open/close and navigation on the current host. An altered host requires its affected/standing checks and sweeps.

No new mandatory source defect was found in the accepted correction set. The outstanding items are final runtime/visual evidence and publication provenance, not permission to take a moving draft. No browser or GPU session was opened during this audit.

## Evidence

`evidence/audit_c1f6fb5.json` binds the current work-tree hashes, subprocess results, source differences, required phone results, mechanics results, rendering lifecycle results and union descriptors. Full private logs are in `/workspace/private-v809-release-c1f6fb5-evidence/`; source snapshot is `/workspace/private-v809-release-c1f6fb5/`.

The existing integration helper accepts the original verified snapshot with `--work` pointing at this current recovered tree. Its internal `sourceCommit` remains the original baseline `ba9fff7e`; it must not be mistaken for the current candidate's commit. This audit's outer source binding and `workFiles` hashes identify the actual tested candidate `c1f6fb5`. No source or result was relabelled as a final live release.
