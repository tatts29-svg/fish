# Maps and satellite upgrade — draft

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

Build the page with `toolchain/build.sh v8.13 v8.13_maps_satellite_DRAFT/patch_v813.py`. Build the four assets with `build_assets813.py SOURCE_DIRECTORY RETAINED_MANIFEST`. The sources must match the reviewed live fingerprints. Source originals and complete operational/browser logs stay in the private workspace; published evidence contains checks and fingerprints only.

Current state: component CPU/source checks pass; integrated browser, visual, performance and standing regression checks are in progress. This draft is **not READY TO UPLOAD**. No faultlessness, physical-device frame-rate or provider capture-date claim is made.

Andrew also asked whether installed-track satellite images can be found. Public imagery research is separate from the verified map rendering changes; no new imagery layer is claimed or substituted without source/date/use checks.
