# v11.74 — Showcase playback under graphics load

Author: Andrew Fisher

DRAFT — Codex owns implementation, checks and guarded publication. Not live and not independently reviewed by Claude. Claimed source `723aba5acced7e3b467516c3cd9ef4dfa1389f09` on `ccr-061f77e8-ivjhrv`.

Andrew reports slow motion and freezing and requests urgent attention. v11.57 gated the whole fixed-step simulation behind GPU completion. With 60 animation callbacks per second and 200 ms GPU frames, its 50 ms elapsed-time cap advanced only 0.5 seconds in two wall seconds. The same unchanged clock now advances 2.0 seconds: only drawing waits for the pending GPU frame. A paused redraw remains dirty until it can be submitted. Context loss and hidden intervals cannot advance playback.

The GPU guard also discarded every frame over ten seconds, leaving the worst renderers at costly settings indefinitely. Uninterrupted completed frames now count regardless of duration. Moderate sustained delays retain gradual quality reduction; a frame over one second uses the existing bounded low-cost 3D ladder immediately. Pause/hidden/resume intervals do not count; manual quality opt-out remains respected. Close retains deferred disposal of the old context. If another severe frame is still measured at minimum quality, the existing flat circuit takes over. The chosen 3D backdrop is preserved and a Try 3D circuit button restores it; a device-local timing record makes the next opening fast. No shared record is changed.

Base main v11.73 SHA-256 `0a02e5fdba577f678a3494ffdccca474a126bc7be13dac2015a09d3a1c88dd9f`. Candidate SHA-256 `2ffc7a7c9e4ef9102df0294e51a33a13a89cf7c222bf8318aff69d5f7179f382`, 21,756,249 bytes. Only the GPU scheduling module, existing slow-device fallback module and footer change. The preservation test reverses those edits and proves exact equality of everything else, including all geometry, content, reports and crew code. No record writes or private photos are part of this release.

Completed: all 173 scripts parse; secret/author checks; actual-clock delayed-GPU regression, paused redraw, hidden/resume exclusion, severe/moderate quality guard, manual opt-out, context loss, deferred cleanup and full-page preservation checks. Desktop/phone lifecycle checks, full sweeps, visual inspection and real WebGL playback are in progress. Software WebGL measurements are not physical-device FPS claims.

Build and checks:

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v11.74 03_GC500_Delivery_Control/v11.74_showcase_playback_DRAFT/patch_v1174.py
PAGE=03_GC500_Delivery_Control/build/GC500_v11.74/GC500_Delivery_Control_hosted.html BASE=03_GC500_Delivery_Control/build/GC500_v11.74/base_live.html node 03_GC500_Delivery_Control/v11.74_showcase_playback_DRAFT/tests/test_gpu1174.cjs
# Browser tests use the shared read-only harness and /tmp/gc500-browser.lock.
# PAGE=... OUT=<private evidence folder> node tests/test_browser1174.cjs, then MOB=1.
# PAGE=... node ../toolchain/harness/sweep.js, then MOB=1.
# Actual WebGL probe: ../v11.57_showcase_smooth_LIVE/tests/playback_v1157.cjs.
```
