# Departed equipment follows its plan footprint — v12.88

Author: Andrew Fisher

LIVE — published 3 Nov 2026 12:26 AEST (02:26:04.072 UTC). Fresh public bytes and live browser checks are verified.

Departed equipment previously received a separate round symbol at its reference location. Its traced plan footprint appeared only when selected or included in another equipment layer. This change makes eligible departed references use the existing plan geometry automatically, preserving the drawing's position, orientation and recorded door geometry.

The scope is map presentation. Existing completion and departure readers remain authoritative. No operational or financial record is changed. A partial collection remains a reference-level count: the source does not assign every individual asset to a particular polygon. Shared, moved or missing footprints must not be represented as invented exact shapes or door sides. Existing standard/catalogue outlines remain distinguishable from traced geometry.

Starting branch: `ccr-061f77e8-ivjhrv`; claim commit `f018e094895dd0370bf79e615578f81eedf48913`.

Base page v12.86: SHA-256 `92c1a3163ecf76e05e42d47ce4c94c78dea8d60e28d5b506b0cec560c7ce2865`.

Active map machine: `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`. This parent-page change is intended to leave that machine and the satellite/3D sources unchanged.

## Result and checks

Candidate SHA-256: `d348e813db15b3ed3df125e14dd877597cbd8b410a4c13440c64244a86f85c37`, 16,955,759 bytes. Implementation commit: `5a934bebd5c07994742c49258c083294d44f1409` (preserves the concurrent fencing draft).

- Standard build and checker: all 223 inline scripts parse; no new credentials.
- Scope proof: only the two map presentation scripts and footer change. The financial logic and underlying record readers are byte-identical. Exact rebuild, wrong-base and duplicate-patch guards pass; reviewed map script allowlists remain unchanged.
- Focused integration: 43 checks pass. Actual unselected polygon and door strokes match the source at different rotations and zooms; selection/touch, complete/partial/review states, group counts, moved/shared/cancelled guards and unassigned-outline tags pass. Native departure states agree with the shared model. No runtime or console errors; no attempted record writes.
- Actual phone and tablet screenshots inspected. Sourced door leaves remain visible; partial collections use the complete reference outline dashed with one group count. No particular asset is assigned to a polygon by inference.
- Existing map regression passes: all seven adapters, status bridge, traced geometry, return navigation and the retained photographic 3D scene with a visible native equipment model. No runtime/console errors or attempted writes.
- Full desktop and phone sweeps each pass all 27 tabs, seven deep links and Back. Routing matches the prior release; no runtime errors, console errors or attempted writes.
- Independent source and visual review found no blocker for this bounded change. Other scopes have not been incorporated or independently audited by this release.

Redraw timing was measured separately from network loading. The paced, warmed comparison reported synchronous map redraw median/p95 of 6.8/12.4 ms at overview and 4.1/7.3 ms close up; deferred labels were measured separately. The first burst stress measurement had an 88.1 ms p95 / 185.6 ms maximum at close up; this did not reproduce with paced frames after tiles and fonts settled. Both measurements are retained privately. These are test-environment observations, not a universal device or instant-loading guarantee. Departure tags have no continuous idle animation loop.

Shared, moved and unassigned shapes retain explicit fallback labels; catalogue and mixed outlines say so. The main PNG exporter keeps its existing composition and is outside this presentation correction. No imagery provenance or 3D-source replacement is claimed.

## Reproduce

From `03_GC500_Delivery_Control`, use the shared `toolchain/build.sh v12.88 v12.88_departed_plan_footprints_LIVE/patch_v1288.py`. Run `tests/check_scope1288.py` with the private exact base and candidate paths. The browser tests require `PAGE` and private `OUT`; set `BASELINE_PAGE` and `PACED=1` for the paced comparison. Run all browser work serially under `/tmp/gc500-browser.lock`. The preceding release's `tests/check_map1286.cjs` supplies the retained-map/3D regression; use the standard desktop and phone sweeps as required by AGENTS.md.

Private screenshots, detailed record comparisons and performance evidence remain outside Git. All tests use the read-only harness. Publication uses the standard unchanged-live-base guard, followed by independent public-byte and browser read-back.

## Publication and live read-back

READY source: `d58b34aea2a3473d4215ac71af2998c65fd1cc60`. Standard uploader verified the unchanged v12.86 base and published at `2026-11-03T02:26:04.072Z`. A separate public fetch matches the candidate SHA-256 and all 16,955,759 bytes exactly. The machine manifest and shared record are identical immediately before and after publication.

Fresh live browser runs with no local page override pass the same 43 focused footprint checks and the retained-map/3D regression, with no runtime/console errors or attempted record writes. The live phone/tablet screenshots were inspected. Live burst timing remains variable; this release does not claim all devices or network loads are instant.

The concurrent fencing draft must be rebuilt and retested from these live bytes with a later coordinated version; its v12.86 fresh-base guard must not be bypassed.
