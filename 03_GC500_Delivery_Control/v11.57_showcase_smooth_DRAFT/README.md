# Showcase preparation and responsiveness — READY TO UPLOAD

Author: Andrew Fisher

Andrew reported that Showcase was slow and freezing. Circuit construction held the main thread, unused equipment calculations ran on information scenes, the covered dashboard still performed layout work, and closing could wait for unfinished GPU work.

The repair divides the existing circuit construction into interruptible steps, compiles shaders in parallel where supported, keeps incomplete scenes private and cancels them when closed or switched away. Information scenes calculate only the figures they use. The covered dashboard stops rendering. The renderer allows one outstanding GPU frame, polls without waiting, and defers destruction of the old graphics context until after closing.

The existing presentation, chosen look, circuit/car geometry, shared figures and record remain intact. Synchronous constructors remain for standalone callers; their generator counterparts preserve lexical scope, order and random seeds. The existing slow-device quality controls remain. No new record writes, rates, map positions or QR changes.

Base: live v11.56, SHA-256 `c59fbc57dd1c17d1b831a93ad936c205a0128703d842e7579af5896b2d812da6` (21,429,685 bytes). Candidate: `10d3e9484e7b650b65555dab7b5a0c2db40582897add645f56a84038fe2ff213` (21,566,999 bytes). This preserves the preceding gate-search and equipment releases.

Validation: toolchain PASS (170 inline scripts); focused desktop and phone checks 16/16 each, including every static mesh/line byte and circuit/car statistic against the original constructors, cancellation, backdrop changes, pause/navigation, dashboard restoration and untouched record; GPU scheduling/deferred-cleanup checks PASS; wrong-base and repeated-patch refusal PASS; phone screenshot inspected. Desktop and phone sweeps: 27 registered tabs, 19 shown each, no page errors, console errors or attempted writes. Guarded upload dry run passed: base unchanged and edit access confirmed. READY TO UPLOAD; not live.

Measurements in Chromium 151 with SwiftShader (software graphics):

- Final actual-playback probe: opening 256.8 ms, closing 717.1 ms, ten scene changes, no page errors or attempted writes. The preceding intermediate candidate closed in 12,992 ms before deferred cleanup.
- Controlled 4x CPU preparation probe, with drawing disabled to isolate main-thread construction: baseline v11.54 mount blocked for 35,871 ms and the maximum 50 ms heartbeat gap was 38,235 ms. Final candidate's largest construction task was 3,328 ms and maximum heartbeat gap 4,246 ms; 742 heartbeat ticks ran during preparation. Its final adapter mount took 33.5 ms. The baseline constructors are unchanged in v11.56 and are compared byte for byte by the functional test.
- Native graphics-context creation is not interruptible. Software GPU frames still take seconds here; this is not a hardware frame-rate measurement or a promise of zero latency on every device. The controls and scene progression remain separate from that graphics queue.

Raw screenshots, record captures and profiler files remain private. Only aggregate verification belongs here. Tests use the shared read-only harness and abort writes.

Build: `toolchain/build.sh v11.57 v11.57_showcase_smooth_DRAFT/patch_v1157.py`. The patch checks the complete base SHA plus exact constructor digests. Normal builds use the checked-in counterparts and do not need npm. Optional regeneration: `npm ci`, then `node derive_constructors.cjs base_live.html` (acorn is used only for this step).

Run `tests/test_v1157.cjs` with `PAGE` and private `OUT`; repeat with `MOB=1`. `LIVE=1` repeats the full test on the public page; `tests/live_v1157.cjs` checks published opening, cancellation, navigation and record integrity. Run `tests/test_gpu1157.cjs` for the scheduling/cleanup contract. `tests/benchmark_v1157.cjs` writes aggregate timing to `OUT` (a file); `tests/playback_v1157.cjs` writes to `OUT` (an existing private directory). Use `CHROMIUM_PATH` when needed and serialize browser probes. Both toolchain sweeps are required. Publish through the guarded `toolchain/upload_page.py`, never bypassing its live-base check.
