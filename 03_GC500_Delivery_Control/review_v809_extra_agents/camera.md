# v8.09 camera and driver review

Author: Andrew Fisher

Reviewed source: `ba9fff7ec48d3d49d037f461c145b1abd6f2c957`, `v8.09_coates_way_machine_DRAFT/work/car-app.js` SHA-256 `718b2cfa403ae8fb0d6bc7b3bde6578719e62802b2eb23c38513e4d0700f1707`. CPU review only; no browser, GPU, deployment or live record writes. The separate Showcase v8.12 cameras are untouched.

## Reproduced defects

1. **P2 — first visible driver frame uses his previous figure position and pose.** `work/car-app.js:618` calls `m.place`, assigns the crouch and exposes the walking figure. `Crewman.place` (`work/crew.js:237`) changes the logical location, while the drawn root and bones update only through `Crewman.update` / `pose` (`work/crew.js:273`, `:433`). `driverStep` skipped `m.update` earlier in this frame because the seated figure was still active. The actual source function and actual figure/rig reproduce a 1.655 m position mismatch on first exit; after Reset invokes `driverHome` while he is at the safe point, the next exit exposes him 6.129 m from the sill for one frame. At 30 fps that is one 33 ms frame, potentially longer during a stalled renderer. The proposed one-line `m.update(0)` immediately before `driverShow(true)` removes both mismatches, preserves the crouch, advances no clock, and leaves every bone transform finite. It changes neither the intended sill swap nor the walk path.

## Conditional source risk — not reproduced on the normal phone viewport

At a synthetic camera aspect of 0.524, `work/car-app.js:589–592` computes a 22.230 m driver shot but `:690` runs the real OrbitControls with `maxDistance=20` (`:100`, `:483`), pulling the lens to 20 m and leaving an action-envelope edge at normalised x 1.055. This CPU result establishes a conditional narrow-aspect fit/limit conflict. **The measured 390 × 844 phone uses a 390 × 493 camera viewport, aspect 0.791, and does not reproduce this clamp.** An earlier estimate incorrectly used full studio height rather than the drawable viewport; it is superseded by the visual owner's measured box. Mixed rotation/resize screenshots are excluded as proof of default phone clipping. Wide and aspect-0.65 CPU projections pass, and the driver silhouette remains inside all tested synthetic shots. The existing `advance()` harness omits `controls.update()` and cannot test this interaction. No standard-phone clipping or camera-limit regression is claimed.

## Reproduced source interaction requiring rendered confirmation

`applySpread` sets `assemblyFit=true` at `work/car-app.js:300`. Once `dxCamStep` finishes returning to the saved camera and clears `DXC.mode` (`:603`), the real frame's gate at `:690` immediately invokes `fit(view)`, which chooses the default view direction (`:268`). A source-executed gate test reproduces the follow-on fit. This conflicts with the driver-camera comment/test claim of returning to the person's own view after exit: a custom orbit may be replaced by a second default-view transition. The fast-forward test omits this gate, so its exact-return assertion cannot establish the final rendered camera. Sole browser owner was asked for a distinct custom view → exit → return → one second later sequence. Whether the additional automatic fit is useful for expanded geometry or needs a different hand-back is a design decision after that capture; no speculative patch supplied.

## Visual judgement kept separate

The rear-quarter driver-door shot is purposeful: it approaches the door side and avoids putting the open door directly in front of the legs. The crouched sill swap and reverse seated swap (`:618`, `:633`) are deliberate collision avoidance in the draft, not reported as a new functional regression. A natural-looking exit should be judged in motion after fixing the stale first frame. A close, short transition or brief door-detail framing may soften the swap; a new skeletal climb sequence would be a larger change needing its own collision and visual checks. No such redesign is proposed here.

The driver is explicitly retained by clear-view when near the car (`work/car-app.js:649`), unlike incidental passing crew. As he moves further away, the general occlusion system may fade him; this has not been declared a defect without the captured sequence. Default crew positions have source-level avoidance rules, but boxes and floor rays alone cannot establish that bodies look natural or remain visually unobstructed.

## Isolated proposal and evidence

Only `work/car-app.js:618` changes. The patch requires the exact reviewed SHA-256 and exact single matching fragment, refuses an existing destination, and cannot edit the supplied source in place. Proposed full-file SHA-256 is `39df72cf086d5a3b31f0288a2d3b6f11c4ed4161f5ff9f95f212e3a41d1542e1`.

- `cameras/patch_camera_spawn.py` — source-path and separate destination-path arguments.
- `cameras/camera_spawn.diff` — one-line isolated change, no full source copy.
- `cameras/camera_cpu.mjs` — accepts `/path/to/work/car-app.js baseline|patched [expected-sha256]` (optional explicit combined-candidate binding; isolated hashes remain the defaults), imports that folder's actual Three.js, figure rig and OrbitControls; no network or DOM.
- `cameras/baseline_cpu.json` — 8 passed reproduction assertions plus projection measurements; the stale-pose reproduction is expected in baseline mode.
- `cameras/patched_cpu.json` — 16 passed assertions including first spawn, spawn after `driverHome` reset, zero-time and finite-bone checks. The conditional narrow-aspect conflict remains measured; the normal phone viewport is not affected in the measured case.

Run the baseline test against the frozen work tree. For the patched test, create an isolated copy of the work folder, apply the patch to a new `car-app.js` destination alongside its unchanged dependencies, then run `node camera_cpu.mjs /path/to/candidate/car-app.js patched`. This test distinguishes a source-bound CPU result from a rendered visual result.

A separate, optional automatic-camera ownership proposal and CPU checks are described in `cameras/ownership_proposal.md`. It is not part of the primary spawn-fix recommendation and awaits an actual relevant rendered trigger.
