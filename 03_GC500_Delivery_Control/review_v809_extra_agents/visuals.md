# v8.09 vehicle appearance and browser evidence

Author: Andrew Fisher

Review target: immutable Claude source `ba9fff7ec48d3d49d037f461c145b1abd6f2c957`, frozen `v8.09_coates_way_machine_DRAFT/base` and `work`. Review only; no source, record, deployment or default-view change. This report does not cover later moving source.

The work is visibly better, but detail improvements alone do not establish the requested “wow” result. The complete-body view is the strongest hero image in this pass: the orange bonnet, grille and continuous shoulder line read immediately as a race car. The existing opening cutaway is excellent for showing the mechanical work. Both should remain available.

## Preserve

- The recognisable #26 silhouette, Coates orange, original body proportions and low front three-quarter opening angle. The full-body comparison uses that same angle, with only the existing Cutaway button changed.
- The denser exposed engine, orange coilovers, pipework and new tyre lettering. These improve the real opening view, not just a close-up or a texture metric.
- The cockpit's distinctive Coates Way wheel and labelled controls. At equal desktop pixel ratio, the wheel and labels remain readable. The first work cockpit picture was softer because SwiftShader had reduced its ratio to 0.75; it was recaptured at 1 before judging materials.
- The more complete driver and grounded stand-up pose. The inspected desktop exit shows him beside the open door, with his feet on the floor, rather than projecting through the roof.

## Three highest-value follow-ups

| Priority | Action | Evidence and qualification |
|---|---|---|
| 1 | Finish driver/camera continuity before adding more detail. | The real-page first visible walker sample has logical position `[0.7,-1.5]` but scene-root position `[0,0,0]`. The next sample catches up. This corroborates the camera review's source-bound one-frame pop. Its proposed fix belongs with that review. The driver shot also leaves much of the rear quarter beyond the left edge while the fan and black monitor backs dominate the right; that composition judgement is subjective, not a claim that the driver is clipped. |
| 2 | Put the existing complete-body picture in front of Andrew as an optional hero direction. | `desk_car_complete_work.png` is a same-camera, Laptop, ratio-1 capture made through the existing button. It communicates the race car more strongly than the cutaway. No automatic reveal, changed default, layout change or new camera has been implemented. |
| 3 | Give the vehicle stronger visual priority over workshop props in a reviewed lighting/staging pass. | The bright orange lift post directly behind the windscreen and the black suspended box pull attention from the roof and bonnet in both versions. In the exit shot, monitor backs occupy a large area. Preserve the garage detail and safety equipment; first try a narrow background-light balance or an existing-view framing mock-up, then assess against the current picture. This is art-direction advice, not a reproduced functional defect or a tested code proposal. |

No separate visual patch was created: the reproduced motion and interface/resource faults are covered by the other reviewers' isolated proposals, and the two subjective visual suggestions need a picture-led decision rather than an untested source edit.

## Browser findings shared with the other reviewers

All completed capture reports recorded **zero captured page errors and zero console errors**. This is limited to the sampled sessions; it is not a release sweep or a faultlessness claim. Every browser started for this review is closed, and GPU ownership has been handed back.

- **Confirmed:** the guided-tour card remains visible/open when Find a part opens the native register modal. Both desktop and phone reproduce it. Phone card rectangle: x8, y404.19, 374×242.81 CSS px.
- **Confirmed reachable:** at 667×375 touch landscape, Controls' close button is 44×44 CSS px at x606/y126 and `elementFromPoint` hits `exhibit-close`. The card ends at y323; the dock starts at y333 and continues below the viewport. This case does not reproduce an unreachable close button.
- **Confirmed resource growth:** after initial texture allocation settles, the phone's rendered Balanced/Laptop cycles report 97→95→103→101 textures, +6 per complete repeat; program count stays 143. The rendering reviewer has the resource-disposal proof/proposal. These are resource counts, not physical-device frame-rate measurements.
- **Not confirmed for the standard phone:** the proposed 20 m driver-camera clamp issue was calculated using the whole studio height. The actual 390×844 work canvas is 390×493, with the dock outside it. The initial driver test followed landscape→portrait and caught a pending resize cancelling the scripted shot; its blank/cropped samples are excluded as proof of a normal portrait entry. The conditional narrow-aspect source risk remains in the camera review.

## Evidence and reproduction

Private evidence folder: `/workspace/private-v809-support/visuals/`.

| Purpose | Files |
|---|---|
| Desktop matched opening and engine | `desk_car_base.png`, `desk_car_work.png`, `desk_engine_base.png`, `desk_engine_work.png` |
| Desktop matched cockpit | `desk_cog_base.png`, **`desk_cog_work_fixed1.png`**; do not use the earlier adaptive `desk_cog_work.png` for sharpness comparison |
| Optional complete-body hero | `desk_car_complete_work.png` |
| Phone matched views | `phone_car_base.png`, `phone_car_work.png`, `phone_engine_base.png`, `phone_engine_work.png`, `phone_cog_base.png`, `phone_cog_work.png` |
| Actual exit poses | `desk_driver_crawlout_work.png`, `desk_driver_stepout_work.png`, `desk_driver_duck_work.png`; corresponding state/camera records in `desk_browser_cases.json` |
| Phone UI checks and resource counts | `phone_tour_register_work.png`, `phone_short_landscape_controls_work.png`, `phone_browser_cases.json` |
| Source/asset bindings | `source_bindings.json`, `cache*/asset_digest.jsonl` |
| Portable fixed-pose capture scripts | Tracked `visuals/capture_review.js`, `visuals/desk_extra.js`, `visuals/machine_rig.js` |
| Compact checked-in evidence | Tracked `visuals/evidence.json`: source bindings, image hashes, captures, first-spawn sample, UI checks and resource counts |

The portable scripts accept `SOURCE_ROOT` (the frozen folder containing `base` and `work`), `GC500_TOOLCHAIN` (the shared toolchain directory), and required `OUT` (a private directory outside Git). `NODE_PATH` points to the toolchain node_modules and `CHROMIUM_PATH` to Chromium. Use a **fresh `GC500_CACHE`** for each independent remote baseline. Capture base before work, because work reuses its saved camera JSON. Example:

```bash
SOURCE_ROOT=/workspace/private-v809-support/ba9fff7e/03_GC500_Delivery_Control/v8.09_coates_way_machine_DRAFT \
GC500_TOOLCHAIN=/workspace/fish/03_GC500_Delivery_Control/toolchain \
OUT=/workspace/private-v809-support/visuals \
GC500_CACHE=/workspace/private-v809-support/visuals/cache_new_baseline \
CHROMIUM_PATH=/usr/bin/chromium \
NODE_PATH=/workspace/fish/03_GC500_Delivery_Control/toolchain/node_modules \
node /workspace/gc500-showcase-full-lap/03_GC500_Delivery_Control/review_v809_extra_agents/visuals/capture_review.js base phone
```

The portable scripts passed `node --check`; they retain the executed capture logic with path arguments added. The exploratory mixed-resize script remains private and is not part of the portable fixed-pose checks. A fresh-entry phone driver script was prepared but not run; no finding depends on it.

The private rig serves the frozen files and fetches missing assets using GET only. Non-GET and non-loopback browser requests are aborted. It appends two test-only frame/resume hooks to the served JavaScript response; it does not change the frozen file. Driver phase sampling fast-forwards `__cw.advance`, then calls the actual production frame function once and captures the resulting image. It is not a real-time video or a frame-rate benchmark.

Desktop uses 1440×900 at ratio1; phone uses 390×844 at ratio2 for the fixed comparison. Camera positions/quaternions/targets are taken from base and reused in work; the phone canvas dimensions differ because the existing work CSS changes the available scene area. Crew/crane positions vary with elapsed load time and are not deterministic comparison inputs. Browser uses Chromium/SwiftShader, so physical-device performance, memory limits, “4K crystal clear on every phone” and visual perfection are not claimed.

The bindings record 56 base files and 63 work files. SHA-256 of the compact sorted per-file descriptor JSON: base `bd9c83e5a594a79dc51049c5039064b0b63653fd79401e4677ee42d31428db19`; work `c3e8f74d3883e5081d12045da227c9eff05600b368d991ae4388a9ac518b7d9e`. All five remote assets have identical hashes/bytes across captured base/work caches; the first desktop base cache's five bodies also match the later path-bound responses. No provider session URL or credential is recorded.
