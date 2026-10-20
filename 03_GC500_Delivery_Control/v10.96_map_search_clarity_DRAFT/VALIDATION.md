# Validation — v10.96 draft

Author: Andrew Fisher

Candidate SHA-256: `ac36ea1c391e3105b2e12c901700f1996f40f999a82c34f3e2430fc5a9268852` (18,635,468 bytes). Built with the shared toolchain from the exact v10.95 base in README.md. NOT deployed.

- Standard desktop and phone sweeps: 25 routes, seven deep links and Back passed each; zero application errors, console errors or operational writes. Six legacy/edit-only routes redirect to their expected read-only destinations.
- Injected satellite request failure: native tile error recorded, search remained usable, native Retry restored complete imagery; zero application errors or operational writes. Expected aborted-request diagnostics are confined to this fault test.
- Pure search cases: 15 passed.
- Exact-base and double-apply guards passed. Reversing the added module/footer and two Today visibility guards recovers the original HTML byte for byte.
- Shared page validation passed: all 149 inline scripts parse; author and secret scans passed.
- Read-only focused browser checks: 27 passed each at desktop 1440×1000, phone 390×844 DPR2, and 4K 3840×2160. Each checked 464 current identifier queries, direct keyboard selection, unknown/unplaced handling, refresh preserving selection/camera, hidden-map paints, reduced motion, maximum zoom, unchanged record/financial model/tracker and zero application errors/writes.
- Visual inspection: desktop and phone search views and 4K map viewed as actual screenshot pixels. Opaque search text/background contrast: primary 16.24:1, secondary 10.71:1, references 8.90:1; secondary on selected background 7.17:1. This is not an audit of every inherited control or map feature.

| Measurement | Before | Desktop | Phone | 4K |
| --- | ---: | ---: | ---: | ---: |
| Search median, ms | 28.4 | 1.2 | 1.1 | 1.2 |
| Search p95, ms | 40.5 | 2.2 | 2.2 | 6.5 |
| Host refresh calls for 36 queries | 36 | 0 | 0 | 0 |
| Drawing ready at maximum 64,000% zoom, ms | not equivalent run | 252 | 284 | 2503 |

Deep zoom measurements are sequential visited views, not a guaranteed fully cold network benchmark. A corrected fresh-frame check measured cached maximum zoom at 425 ms on the 4K software-rendered browser; the earlier desktop/phone cache timings accepted an old frame and are excluded. Cold 4K 800% drawing readiness took 5553 ms. The requirement for universally instant rendering is not met and cannot be claimed. Source imagery remains finite resolution.

An initial 4K test assumed the next animation frame would run within 400 ms; it failed the Today overlay removal assertion. The test now waits explicitly for canvas removal (maximum 2500 ms), and passed. The final source was unchanged by that test correction.

Private evidence root on this executor: `/workspace/gc500-release-review/`. Screenshots: `final-desktop1096/search.png`, `final-phone1096/search.png`, `final-4k1096/map.png`; focused results in each directory. No signed PDFs, source images, live records or screenshots are committed to Git.

Implemented and tested by Codex; no Claude review claimed. Physical-device GPU/FPS testing remains outstanding. Publication remains paused.
