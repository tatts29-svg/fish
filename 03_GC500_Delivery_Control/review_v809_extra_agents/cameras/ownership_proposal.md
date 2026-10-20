# Optional future driver-camera ownership proposal

Author: Andrew Fisher

Status: isolated CPU-tested proposal, **not included in the primary spawn patch or four-proposal integration**. No default camera direction, lens, composition or live Showcase camera changes. No release recommendation without a relevant rendered trigger. The actual 390 × 844 phone camera viewport measured by the sole browser owner is 390 × 493, aspect 0.791; it does **not** reproduce the narrow-aspect distance clamp. Earlier full-studio estimates and mixed rotation/resize images are excluded from that claim.

The conditional source risk is that the driver shot can request a distance over the normal OrbitControls limit. The renderer then calls controls.update after positioning the automatic camera. Synthetic aspect 0.524 requests 22.230 m and the normal 20 m limit moves it closer. Residual pan/orbit input also has a chance to change the authored shot while the driver director owns it.

The bounded proposal lets the supplied OrbitControls run every frame, so damping decays normally, but saves and restores the director's position and target around that update while `DXC.mode` is active. It re-aims the camera after restoring. Two preallocated vectors avoid per-frame allocation. The existing manual limit remains 20 m. The existing user gesture event clears camera ownership; view/Reset cancellation and completed return clear it too. The driver-camera paths and timing are untouched.

`patch_camera_ownership.py` accepts source and fresh output paths. It requires frozen `car-app.js` hash `718b2cfa403ae8fb0d6bc7b3bde6578719e62802b2eb23c38513e4d0700f1707`, or the verified spawn-only hash `39df72cf086d5a3b31f0288a2d3b6f11c4ed4161f5ff9f95f212e3a41d1542e1`. Its two replacements each match exactly once. `camera_ownership.diff` is separate from `camera_spawn.diff`. The combined spawn-plus-ownership candidate hash is `f10c3d8d066529ae1c11db5b063f1446f25766de9c5087641121d0d8fa0b5728`.

`camera_ownership_cpu.mjs /path/to/car-app.js baseline|patched expected-sha256` binds to the supplied source and uses its actual OrbitControls, actual driver shot functions, real rendered-frame control block, actual gesture-start callback and camera confinement. The results are in `ownership_baseline_cpu.json` and `ownership_patched_cpu.json`. Tests cover seven viewport aspects including the measured 0.791, fitted action-envelope projection, orbit/pan residual decay, manual gesture release and the unchanged 20 m manual limit, completed saved-camera return, cancellation with no stale restoration, and reduced-motion cuts.

The separate `assemblyFit` interaction remains intentionally explicit: after camera ownership ends, a pending assembly fit still requests the existing default view. The source-bound gate test reproduces that interaction in both candidates; this proposal does not claim to preserve a custom view beyond that subsequent fit. A rendered custom-orbit → driver exit → saved return → follow-on-fit capture was requested before recommending changes to that behaviour.

No browser or GPU was started by this reviewer. The candidate is ready for an isolated browser comparison if its owner elects to pursue this conditional issue; it is not an approved or deployed camera change.
