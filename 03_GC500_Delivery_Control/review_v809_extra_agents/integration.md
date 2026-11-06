# v8.09 integration and release review

Author: Andrew Fisher · 3 Oct 2026 AEST.

First pass: the frozen draft combines cleanly with the verified v8.13 live machine manifest. This is an offline preparation finding, not READY TO UPLOAD or permission to publish the draft.

## Exact source and result

- Source: `ba9fff7ec48d3d49d037f461c145b1abd6f2c957`, frozen private snapshot and its `source_manifest.json`; all 133 listed source/evidence files match their recorded SHA-256, with no extra files.
- Retained live machine: `65c47180502d9052ca3661e5aedd06683e8168c1e9be9297bcbcb7c2e4d9fe86`, 219 files. Its canonical digest was independently recomputed.
- All 56 draft `base/` files match the current live descriptors. The draft's README still names the older live version, but the copied machine source has not diverged underneath it.
- `work/` contains 63 files: 16 changed existing files, seven additions, 40 byte-preserved existing files, no removals. The complete proposed union has **226 files, 172,347,556 bytes**; canonical digest **`11fb195295be956895771523f9ceee4dd46c0dff22ab4dda4d80c24803a83ae8`**. This digest describes the unmodified frozen draft plus v8.13, before independent patch proposals.
- All four protected map descriptors remain exact: `explorer/explorer.js`, `explorer/explorer-merge.js`, `explorer/index.html`, `poc3d/index.html`. Of the other 215 current descriptors, 16 change intentionally and 199 remain exact. Seven new module descriptors are added.
- Every local JavaScript module parses. Both `car-app.js` and the legacy `app.js` module graphs link without evaluating code; their static imports and named exports resolve. All checked literal image/model/module asset paths resolve in the union. The service's file-count, total-size and individual-file limits pass.

The full changed/addition lists, descriptor union and evidence are in `integration_evidence/`. Any accepted proposal changes that candidate digest; never reuse the unmodified draft's digest or browser evidence as the new combined result. Reproduce without a browser or network from the repository root:

```bash
python3 03_GC500_Delivery_Control/review_v809_extra_agents/check_integration.py \
  --snapshot /workspace/private-v809-support/ba9fff7e \
  --out /tmp/v809-integration-check
```

For a new machine, recover the frozen source from Git and use the checked-in hash-only manifest (no private source-tree copy is needed):

```bash
mkdir -p /tmp/v809-replay
git archive ba9fff7ec48d3d49d037f461c145b1abd6f2c957 \
  03_GC500_Delivery_Control/v8.09_coates_way_machine_DRAFT | tar -x -C /tmp/v809-replay
cp 03_GC500_Delivery_Control/review_v809_extra_agents/source_manifest.json /tmp/v809-replay/source_manifest.json
python3 03_GC500_Delivery_Control/review_v809_extra_agents/check_integration.py \
  --snapshot /tmp/v809-replay --out /tmp/v809-static-evidence
python3 03_GC500_Delivery_Control/review_v809_extra_agents/check_combined_proposals.py \
  --snapshot /tmp/v809-replay --out /tmp/v809-combined-evidence
```

Use Python 3 and Node 24 for the combined replay. The four proposal generators each read the original frozen source, then the combiner proves their changed line intervals do not overlap and composes them into a new private copy. It never chains whole-file replacement outputs over one another. Output directories for combined replay must be new.

## Preparation and evidence gaps to close

1. **Never register `work/` alone.** It lacks 163 existing live assets, including models, audio, explorer and satellite assets. Use the exact retained live manifest plus reviewed changed/new source files. The generic `machine_set.py` supports that union; its own upload path does not guard against a concurrent replacement of the live manifest. Retain the v8.13 publisher's immediate pre-registration live-digest guard when preparing the v8.09 publisher.
2. **The supplied rig reads a moving asset baseline.** `machine_rig.js` fetches any locally absent path from the current live `/w/Coates-GC500-2026/` address, does not verify fetched bytes against a manifest and, despite its comment, does not itself implement a once-only cache. A missing local source file could silently use its live predecessor. No missing static dependency was found in this exact draft; this remains a test-provenance gap, not a demonstrated missing-asset defect. Bind every fallback response path/size/hash to the retained union, fail unknown/mismatched responses, and save those records with the browser run.
3. **Tests are present; completed results are absent from this snapshot.** It contains UI, driver, people, mechanical and quality test scripts, but no run-result JSON/log or screenshot evidence. Their existence does not prove a run passed on this source. Save the exact source/union hashes, executed command, viewport/DPR/query, result counts and reviewed images. The `before_after.js` helper suppresses a camera-settle timeout and prints only five errors without making those errors fail the process; its output is a visual aid, not a clean-run gate.
4. **The changed legacy path needs its own small check.** `style.css` changes, and retained `mechanism.html` loads it through the legacy `app.js` experience. Static linkage passes for that path. Confirm the legacy entry's controls/readability as affected scope alongside the main `index.html` machine; do not infer this from the main machine UI suite.

## Minimum safe integration

1. The implementation owner accepts or rejects each isolated proposal, combines accepted edits without replacing the whole shared `car-app.js`, and freezes a new exact source commit. Rerun source binding, module checks and the affected CPU checks on that combined tree.
2. Obtain the then-current live manifest. If it remains the digest above, retain every descriptor outside the final agreed change set: 203 existing descriptors for the unmodified draft, or 202 with all four proposals below. Overlay only the agreed existing changes and seven new modules, and assert protected maps remain exact. If live changed, rebuild that union against the new manifest and examine only the actual descriptor conflicts.
3. Run the draft's affected machine UI/driver/people/mechanical/quality suites on the final union, saving a manifest-bound asset log and desktop/phone views. Quality timing from SwiftShader and hand-stepped frames is a relative software-render comparison; it does not establish physical-device FPS or automatic-adaptation behaviour. Exercise normal playback/resume separately for changes to timing or lifecycle.
4. Confirm the host still opens and closes the machine and preserves normal navigation. The exact current host `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec` blanks and removes its iframe both on close and on switching the machine/map/3D view. It does not leave the machine drawing in a merely CSS-hidden frame on those paths. If the host HTML is changed for integration, run its required affected/standing checks and final sweeps; protected map internals need no unrelated re-test when their bytes and shared dependencies remain unchanged.
5. Record READY only after the implementation owner's agreed checks and findings are complete, with the exact source commit, retained live manifest and candidate manifest. Immediately before any later authorised registration, verify live still equals the retained baseline. Read back the registered digest and every changed public asset; preserve all unrelated descriptors and operational records.

## Independent review of the four isolated proposals

All four proposal generators were independently replayed from a fresh `git archive` of the exact commit. Their changed intervals in `car-app.js` do not overlap; each proposal was composed from its own original-source diff, preserving the others. The combined source passed all ten preparation/check subprocesses on Node v24.19.0. This supports handing the fixes to the implementation owner; it does not accept them on that owner's behalf or replace final browser/visual checks.

| Proposal | Independent source assessment | Combined evidence |
|---|---|---|
| Phone controls | Keeping the original wheel grab until its own release/cancel restores the existing release cleanup after a second pointer. Ending the tour before opening the register enforces the intended one-surface rule. Button names add semantics only; Next-heading focus is an optional interaction improvement. | Ten combined control assertions pass, including both release orders and cancellation in car/cockpit views, register opening and tour focus. Static button-name checks pass. |
| Driver spawn frame | `m.update(0)` synchronises the figure's drawn root and crouch pose with its logical sill placement before it becomes visible. It adds no elapsed simulation time and changes no camera framing. | Actual Crewman/Three.js source harness passes 35 checks, including first-visible position, return/reset position and camera cases. |
| Mechanical timing | The clutch change integrates the linear take-up ramp exactly, including a fully clamped remainder and direction. Applying current starter state before animation removes its one-frame lag. The powertrain coupling and service interlocks are unchanged. | Combined module tests pass partition invariance, initial starter frame/call order, restart/stopped cycles, forward/reverse travel and reversal during take-up. |
| Rendering lifecycle | Pass objects own resources beyond EffectComposer's buffers. Explicit pass disposal plus GTAO's two omitted materials closes those ownership gaps; a Set prevents duplicate disposal when GTAO is also in the pass list. Setup-failure cleanup now follows the same path. Resume starts fresh timing windows, with `lastFrameStart=0` letting the first rendered frame establish assessment time. | Actual Three.js objects report each of 14 tracked resources disposed once over five cycles, including idempotent cleanup; detached-GTAO cleanup passes. Extracted real resume/sample logic retains Balanced after the hidden interval. This is lifecycle evidence, not a GPU memory/FPS measurement. |

The final all-proposals review candidate is **226 files, 172,348,506 bytes**, union SHA-256 **`9dd88ab40fe8fa2f09fa6d3ecca9213170cd641f23e14967a4930a3df32955c2`**. Its `car-app.js` is **`2dcb49b9e26dded7f4ce14e5733c40ab48691ca8ee66d49dc53527026cb25afb`**. Compared with live, 17 existing files change and seven are added; 202 existing descriptors remain exact, including all four maps. The extra existing change is `vendor/addons/postprocessing/GTAOPass.js`, a machine post-processing dependency; the retained map entry files do not load it. The unmodified draft's 59 local JavaScript modules/134 static imports and both entry graphs also still parse/link after these proposals.

Exact source intervals, input/output hashes, subprocess results, CPU results and the final union are recorded in `integration_evidence/combined/`. The portable replay command above regenerates that candidate in a private directory. If the owner takes only a subset, compute a new union and bind checks to that subset.

No snapshot, moving implementation branch, live asset, backend or operational record was changed by this review. Browser/GPU work remains with its designated reviewer.
