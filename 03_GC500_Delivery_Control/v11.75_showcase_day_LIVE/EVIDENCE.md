# v11.75 release evidence

Author: Andrew Fisher

Implementation: `68a551033a1f6beb6ea58f8834e920434e6dbaf7` on `ccr-061f77e8-ivjhrv`. Claim: `e79c1e9db76b8afa853e7094d9465540863f0f9f`.

Base v11.74: `98a4d37322b8cd216b93922d365ef8fac1fa3617821909548dd5974577abeb46`.
Exact live v11.75: `4ed371e093ecf70323b28dacc0259b8831dba36e0bb4bc742ab8e037c6d9dc9e`, 21,753,217 bytes.

- Shared build/check passes; 173 inline scripts parse.
- GPU/clock regressions pass: simulation continues while drawing waits; paused dirty redraw and hidden resume; severe/moderate quality handling; deferred resource disposal and quality changes; lost context; retained 3D under severe stalls; unchanged core physics/audio clock.
- Native software-WebGL desktop and phone: 15/15 each. Remembered slow-device data cannot replace Day; real high/low frames preserve colour conversion, daylight and backdrop; low detail removes six glow passes. Explicit Night and flat choices, pause/navigation, reopen and Close work. Private record snapshot unchanged; no errors or attempted writes.
- Both shared full-app sweeps: 27 tabs, 19 shown directly, seven deep links and browser Back, zero page/console/navigation errors and zero attempted writes.
- Desktop and phone low-detail screenshots inspected. Geometry/placement unchanged; culling cells retain every original source index.
- Controlled-camera workload: normal submitted indices 5,336,577 → 4,233,003; low 2,886,495 → 1,785,972. Draw calls 130 → 324 and 95 → 268 respectively. These are workload counts, not physical-device FPS evidence.

Software rendering does not establish smoothness on Andrew's computer. His continued v11.74 failure report remains valid; v11.75 awaits his device result. No second-agent review or agreement claimed. Raw images, timing traces and operational data stay private.

Published with the shared guarded uploader on 24 Oct 2026 at 11:43:54 AEST from READY source `312e2946cbed0c02bc65308b660bac16effdee16`. The base was unchanged; service accepted the page; the uploader read the exact complete bytes back. A separate public GET at 11:44:10.062688 AEST independently matched the complete build and SHA-256 above. Actual-live desktop and phone repeated the 15 focused browser assertions each, with no page errors or attempted writes. No live operational record mutation was performed.
