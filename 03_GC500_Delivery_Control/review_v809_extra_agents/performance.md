# v8.09 rendering and lifecycle review

Author: Andrew Fisher · 3 Oct 2026, AEST · review and isolated proposal only

Reviewed source: `ba9fff7ec48d3d49d037f461c145b1abd6f2c957`, `v8.09_coates_way_machine_DRAFT/work/`. Claude retains implementation ownership. No live files, operational records or deployment changed. No browser or GPU process was started by this reviewer.

Two confirmed lifecycle defects should be corrected before this source is released. Both already exist in the draft's `base/` and are carried into `work/`; these are not regressions introduced by the new appearance work. The proposed fixes retain geometry, materials, lights, camera behaviour, quality levels and target resolution.

## Confirmed defects and isolated corrections

1. **P1 — each Quality cycle back to Laptop abandons post-processing resources.** `car-app.js:466–477` constructs GTAO and Output passes, but `dropComposer()` only calls `EffectComposer.dispose()`. The bundled `EffectComposer.js:220` disposes its own two targets and copy pass, not the added passes. Consequently GTAO's three render targets, two noise textures and shader materials, and the output material, receive no disposal call. Merely adding `gtao.dispose()` is incomplete: bundled `GTAOPass.js:150` also omits `gtaoMaterial` and `blendMaterial`. The proposal disposes all owned passes once, including a GTAO pass constructed just before setup fails; disposes the composer; and completes the bundled GTAO disposer. Partial stack-construction failure uses the same cleanup.
2. **P2 — hidden-tab time can leave image quality reduced on return.** `car-app.js:694,796` resets the simulation clock on `visibilitychange` but retains the FPS sampling window and first quality-assessment clock. Replaying the real handlers with 24 visible frames followed by 58.3 seconds hidden produces `fps=0`, marks the one-time quality assessment complete, and changes Balanced to Laptop. That quality level remains until manually changed or reloaded. The adaptive frame average also remains stale. The proposal resets render, FPS and adaptive sampling windows on visibility changes and persisted `pageshow`; it does not change a quality setting or reset the machine's state. Resume then retains Balanced and waits for fresh visible evidence before deciding quality.

The portable proposal is [performance/make_patch.py](performance/make_patch.py). It requires explicit `--source` and `--output` directories, rejects overlapping directories, verifies both complete input SHA-256 hashes and exact replacement fragments, and writes a separate proposal. Only `car-app.js` and `vendor/addons/postprocessing/GTAOPass.js` change. [binding.json](performance/binding.json) binds reviewed and proposed bytes. No complete application source is included in this review folder.

## Verification

[ownership_test.mjs](performance/ownership_test.mjs) runs without a browser. It uses the source's real `EffectComposer`, `GTAOPass`, `RenderPass`, `OutputPass`, materials and render targets, observing their actual dispose events. The renderer supplies only the pixel-ratio method needed to construct these objects; no GPU allocation or frame rate is inferred.

| Check | Frozen source | Proposal |
| --- | --- | --- |
| Five constructed/dropped quality stacks; 14 tracked resources per stack | Only the two composer targets disposed; 12 resources undisposed on each cycle | All 14 disposed exactly once on every cycle |
| Repeated cleanup | References cleared | References cleared; no second disposal |
| GTAO constructed but not appended when setup fails | Its target undisposed | Target disposed once |
| First quality check after hidden interval | Balanced becomes Laptop; stale adaptive average | Balanced retained; FPS and adaptive windows reset |
| Changed JavaScript parses | — | Both changed files pass `node --check` |

Full results: [baseline_results.json](performance/baseline_results.json), [proposal_results.json](performance/proposal_results.json). The failure in baseline JSON is intentional reproduction, not a test-harness error.

Reproduce with Node 24 and Python 3, supplying the frozen draft's `work` directory and a separate scratch output directory:

```sh
python3 performance/make_patch.py --source "$V809_WORK" --output "$V809_PROPOSAL"
node performance/ownership_test.mjs "$V809_WORK"
node performance/ownership_test.mjs "$V809_PROPOSAL" --expect-pass
```

## Rendering budget and quality observations

- The scene retains native canvas MSAA, sRGB output, ACES tone mapping, 2,048/4,096 shadow maps, high-quality texture filtering and GTAO on higher levels. The proposal reduces none of these.
- The camera-motion path renders at a lower ratio while moving, then restores still detail after 180 ms. Adaptive still/move scales are bounded and have recovery delay/backoff; this is preferable to permanently removing vehicle detail.
- Shadows update on meaningful scene changes rather than every frame; small sub-4 cm shadow casters are omitted while their visible geometry remains. Static scene matrices and garage geometry batching are already present.
- Desktop Ultra targets 8.29 million drawing-buffer pixels, subject to ratio caps and adaptation. This is a source-level target, not a guarantee of 3,840 × 2,160 interactive presentation. A 4K export uses an explicit 3,840 × 2,160 buffer; phones omit the post stack for capture. No export or physical-device FPS was measured in this review.
- The phone Quality cycle is Laptop/Balanced only. Prints have per-image and total scaling budgets, but base-size prints are never reduced: the existing evidence reports 26.97 MP on a phone despite the nominal 20 MP ceiling. This is an explicit floor in the source, so the ceiling must not be described as a hard total-memory limit. Actual device memory headroom still needs measurement.
- High and Ultra intentionally allocate more print pixels. Keep those opt-in levels and repair resource ownership before proposing any blanket resolution reduction. The 4-sample post target is requested directly; Three.js clamps it to available samples. `FXQ.samplesFor()` exists but is not used by the current constructor.

## Lifecycle and remaining checks

- `frameBody` exits while `document.hidden`; `pagehide` stops its one animation loop and quiets audio; persisted `pageshow` resumes it. No action-path accumulation of animation loops or event listeners was found. Setup installs listeners once. A context-loss event after setup displays fallback, stops the loop and offers Reload; automatic scene reconstruction is not implemented or claimed.
- The independent integration reviewer checked the exact v8.13 host `f07e92cc…`: `machineClose()` blanks and removes the iframe, and `machineFrameLoad(kind)` destroys the previous iframe on a view switch. Those host paths do not leave a CSS-hidden machine drawing in the background.
- Resize updates camera projection, renderer and composer dimensions. A complete runtime resize/context-loss/restore exercise, repeated 4K captures, and GPU memory measurement remain with the single browser owner. CPU dispose evidence proves missing cleanup, not a measured number of leaked GPU bytes.
- No aesthetic changes are proposed from this source-only pass. Matched visual judgement belongs to the vehicle-appearance reviewer. Prioritise stable resource use and fresh timing samples so users can keep the detailed picture they selected.

This is a review of the exact frozen source and an isolated corrective proposal, not release approval. The implementation owner must integrate it with other accepted fixes, then rerun affected runtime checks on the final source.
