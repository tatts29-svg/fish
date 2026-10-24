# v11.75 — retain 3D and daylight under graphics load

Author: Andrew Fisher

DRAFT — Codex owns implementation, tests and guarded publication. Claim `e79c1e9db76b8afa853e7094d9465540863f0f9f` on `ccr-061f77e8-ivjhrv`. Not live, no independent Claude review.

Andrew reports continued poor playback on desktop Chrome/Edge, repeated unwanted changes to K220, and Day becoming dark. The v11.74 automatic flat-circuit fallback does not satisfy that request.

This correction removes automatic backdrop switching, including the remembered slow-device opening. Explicit backdrop selection still works. Low-cost rendering keeps the existing colour conversion and daylight sky; it removes the six optional glow passes instead of bypassing the whole compositor. Daylight detail is no longer discarded when glow is reduced. Native quality reductions wait until outstanding GPU work completes before releasing render targets.

The existing conservative visibility checks now cover additional static buildings, fences, track and stand meshes. Every source triangle remains available; only off-camera cells are skipped. Shadow casters use the light's view, with camera visibility restored afterwards. Preparation remains cooperative. In the same controlled Day camera, low-detail submitted indices fell from 2,886,495 to 1,785,972 (38.1% fewer); the normal frame fell from 5,336,577 to 4,233,003 (20.7% fewer). This is a workload count, not a physical-device FPS claim. Draw-call fragmentation increased in this probe; actual browser checks and visual checks remain required.

Base v11.74 SHA-256 `98a4d37322b8cd216b93922d365ef8fac1fa3617821909548dd5974577abeb46`. Current candidate SHA-256 `4ed371e093ecf70323b28dacc0259b8831dba36e0bb4bc742ab8e037c6d9dc9e`, 21,753,217 bytes. All 173 scripts parse. Actual-clock/GPU lifecycle tests pass, including retained 3D under severe stalls and deferred quality changes. Desktop/phone browser and daylight checks, full sweeps and guarded publication are pending. No shared-record or private-photo changes.

Use the shared build/check/upload toolchain; browser tests use the read-only harness and `/tmp/gc500-browser.lock`. Detailed raw screenshots and timing traces remain private. The task includes no claim that the user's physical device has been verified.
