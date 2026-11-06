# Maps and satellite upgrade — live

Author: Andrew Fisher.

Andrew asked in the Codex chat for a satellite/maps makeover: quicker zoom, clearer detail and easier use. This release fixes measured map overflow, duplicate record opening and camera/request lifecycle faults, and arranges the existing controls. It does not move equipment or alter operational records.

Claude confirmed Maps/Satellite ownership in [PR1 comment5948731165](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5948731165). His separate v8.09 machine files are retained. Codex and five delegated agents implement and independently check the scoped components. Andrew's later explicit map makeover instruction supplies the map-only authorisation; this is not approval for unrelated pending layouts.

The host page starts from exact live v8.12, `cd3159be30b7ec931d5ffa907b90b585e6851a2210a2e7230d3fde74b0b46bee`. The retained shared machine set is `d53a38c6e4f51dce99aae0ab9ce2420408c2c6b6135ddaecac93c785533645cf`, 219 files. Only these machine paths may change:

- `explorer/explorer.js`: visible-view loading, request recovery, deterministic camera commands and map-first selection.
- `explorer/index.html`: existing controls folded and arranged, reachable phone controls and content-hashed scripts.
- `explorer/explorer-merge.js`: explicit record opening, selection clearing and 3D readiness ownership.
- `poc3d/index.html`: ground-relative low cameras, interrupted-motion cancellation and manual recovery.

The host patch sizes the iframe from its actual top to the usable footer boundary, observes size changes, keeps one bounded pending 3D request, and removes the map's repeated known-view-only notice (the footer still identifies access; unknown access remains visible).

The request and camera tests reproduce faults against live code and exercise corrected behaviours against the candidate. The large source drawing remains available on demand for deep vector detail, export and fallback. Removing its speculative background load does not add photographic detail or change the imagery provider's maximum resolution. Google imagery attribution and explicit user activation of billed 3D remain intact.

Build the page with `toolchain/build.sh v8.13 v8.13_maps_satellite_LIVE/patch_v813.py`. Build the four assets with `build_assets813.py SOURCE_DIRECTORY RETAINED_MANIFEST`. The sources must match the reviewed live fingerprints. Source originals and complete operational/browser logs stay in the private workspace; published evidence contains checks and fingerprints only.

Current state: **LIVE, 2 October 2026 at 20:03 AEST**. Public page and all four map assets match the tested bytes. All operational collections and record 3552 are unchanged. Verified by `evidence/release_verification.json` and `evidence/machine813_publication.json`. Source was frozen at commit `05c65bf` before publication. Exact host `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec`, 9,079,773 bytes; live machine set `65c47180502d9052ca3661e5aedd06683e8168c1e9be9297bcbcb7c2e4d9fe86`. The four changed paths are verified and all 215 other descriptors are identical. Final checks pass: both 21-tab/seven-link sweeps and Back with zero page or console errors, 134 standing functional assertions, 21 navigation CPU checks, 13 host checks, independent 2D/entry reviews, and the separately bound 3D recovery/settled-imagery checks. See `evidence/ready813.json` and the linked summaries for exact source bindings and overlapping test counts. Codex implements and publishes with independent subagent review; Claude confirmed ownership but is not claimed as the final map reviewer.

Independent review reproduced and corrected the phone map extending about 319 px below its usable area, two panels opening from one map pick, a stale reference after category changes, Sources dismissal and long-checksum overflow, and a compass blocking Full screen in short landscape. All four existing direction controls remain available. The earlier functional 3D screenshots were taken during loading; separate settled phone and wide captures have zero pending or processing tiles. Manual recovery was checked by the real pointer hit and button press after graphics loss.

Baseline qualification: the first UX browser run used the exact v8.12 host but an older cached external Explorer entry/engine. Its observed geometry is an older-source fixture, not an exact fresh-live before/after comparison. All final candidate UI runs supplied and checked the exact candidate assets. The separate performance comparison explicitly supplies the verified original entry and selected engine in fresh per-case caches, so its measured download result is unaffected. The publication check verifies the actual served bytes independently.

The measured first-view download reduction is 14,439,157 bytes on both tested viewport profiles; startup and zoom latency are mixed. See [PERFORMANCE.md](PERFORMANCE.md) for measurements, sample sizes and limitations. No faultlessness, physical-device frame-rate, universal faster-zoom or higher-resolution-provider claim is made. A stalled parser-blocking Cesium CDN transfer remains outside the later runtime recovery timer; the 2D map remains independently available.

Andrew also asked whether installed-track satellite images can be found. [IMAGERY.md](IMAGERY.md) records the verified 26 October 2019 helicopter photo and the 15–16 October 2014 partial-setup overhead survey, with attribution and use limits. No event-day satellite capture or new imagery layer is claimed.

The actual published phone view passed 8/8 checks in a fresh isolated test cache with no local file overrides: exact host/entry/engine/merge bytes, visible map within the footer, local selection, explicit Open record, and no page errors, console errors, operational writes or 3D opening. An initial shared test-cache response was discarded; one fresh readiness wait timed out without a state capture and was not reproduced in the bounded diagnostic check. Its cause is unestablished. These attempts remain in `evidence/live813_phone_smoke.json`; no extra product fix or universal outage guarantee is claimed.
