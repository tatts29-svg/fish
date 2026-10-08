Author: Andrew Fisher.

DRAFT — Showcase car and track reliability, 8 Oct 2026.

The Showcase previously stopped after its first presentation and lap, and its graphics-quality ladder could unmount the scene after loading stalls. It now loops by default, opens at Balanced, ignores setup stalls and keeps the scene at its lowest graphics setting. Manual quality, pause, camera, vehicle and reduced-motion choices remain available.

Camera visibility batching submits only potentially visible spectators, vegetation, with conservative bounds and extra space for animated geometry. Source triangles, coordinates, roads, buildings, driving dynamics and cameras are preserved. Track-detail preparation is spread over successive frames. Hidden figures and underlying-page record redraws are deferred; revealing figures or closing catches up. Close releases model caches. Broadcast reuses one player; interrupted engine audio resumes. Context loss shows the fallback immediately and attempts recovery after four seconds, with the existing manual retry available.

The photos are private visual references, without GPS or verified master-plan positions; no placement or circuit routing is inferred from filename order.

Validation in progress: source parsing and secret checks, 23 visibility/topology invariants, 53 phone controls/reopen/context-recovery checks (10 closes, post-GC heap stabilising near 242 MB), and desktop controls plus both navigation sweeps. Operational tests are read-only. Private browser captures and measurements remain outside Git. Software-renderer results are relative workload evidence, not physical-device FPS or a guarantee of zero lag.

Rebuild from the then-serving page using the shared build tool and patch_v918.py. The patch refuses reapplication and a base missing drops911. Nothing is READY or LIVE until the final tests and public verification are recorded.
