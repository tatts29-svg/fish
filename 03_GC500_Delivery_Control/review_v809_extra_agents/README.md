# Independent support for the Coates Way vehicle draft

Author: Andrew Fisher.

Andrew asked in the Codex chat: “Lets add extra agents”. Six parallel reviewers are assigned vehicle appearance, cameras/driver sequencing, phone controls, rendering performance, mechanical behaviour and release integration. The first pass uses exact Claude draft ba9fff7ec48d3d49d037f461c145b1abd6f2c957. Claude retains implementation ownership of the moving v8.09 source. Reviewers work against an isolated snapshot and may supply independently tested patch proposals in this review folder; they do not change or publish his draft. One reviewer owns browser/GPU work; other reviews use source and bounded CPU checks to avoid competing performance measurements. Findings and handover follow here.

## First corrective handover — 3 Oct 2026, AEST

Andrew also said: “We want 10/10” and “Visually we want perfection. And a wow omg when peoplel see what we did”. Six reviewers completed separate source passes; one reviewer is completing the matched desktop/phone visual captures. Claude acknowledged the assignments on coordination PR #1 and held the exact source steady for this pass. This folder contains reviewable corrections, not a published release or a claim of visual perfection.

| Area | Reproduced finding and proposal | Report |
| --- | --- | --- |
| Phone | A second touch can leave steering held and orbit disabled; opening Find a part leaves the tour underneath it. Small fixes, two button names and a separately identified optional tour-focus improvement. | [phone.md](phone.md) |
| Driver | The first visible walking frame uses a stale position and pose, including after Reset. Synchronise the actual figure before showing it. | [camera.md](camera.md) |
| Image quality | Changing quality abandons post-processing resources; returning from a hidden tab can reduce quality using time when nothing was being drawn. Correct cleanup and restart timing samples. | [performance.md](performance.md) |
| Mechanical detail | Starter state reaches the clutch one frame late; clutch take-up varies with the size of the frame step. Apply current state first and integrate the existing ramp correctly. | [mechanics.md](mechanics.md) |
| Integration | All four proposals replay and compose without overlapping changed lines. Existing maps and unrelated assets remain in the complete manifest. | [integration.md](integration.md) |

The independently composed candidate passes the scoped control, real figure/OrbitControls, mechanical, resource-disposal, timing, module and asset-union checks. Exact combined `car-app.js`: `2dcb49b9e26dded7f4ce14e5733c40ab48691ca8ee66d49dc53527026cb25afb`; proposed union: `9dd88ab40fe8fa2f09fa6d3ecca9213170cd641f23e14967a4930a3df32955c2`, 226 files. All four v8.13 map descriptors remain exact. These hashes describe the four-proposal review candidate, not live content. Reproduction commands and exact evidence are in the integration report.

A narrow-aspect driver-camera limit is a conditional source finding. The measured normal phone canvas is 390 × 493, so the earlier estimate based on the whole studio is invalid; standard-phone clipping is not claimed. No camera-angle or camera-ownership change is in the combined proposal. The separate Showcase cameras remain untouched.

The appearance reviewer has captured matched car, powertrain and cockpit views. The same-camera complete-body preview uses the existing Cutaway switch and gives the race car a stronger opening silhouette; it is an art-direction option, not a default change. Captures remain private and will be shown to Andrew. Software-renderer captures do not establish physical-device frame rate.

Claude owns acceptance and integration, followed by affected runtime suites and final visual review on the exact combined source. No production asset, operational record, backend or access setting was changed. v8.13 remains the verified live release.
