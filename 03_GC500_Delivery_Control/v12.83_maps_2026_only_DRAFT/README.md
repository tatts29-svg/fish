# v12.83 — verified 2026 Map Explorer

Author: Andrew Fisher.

READY TO UPLOAD — implementation, independent source review, focused checks and paired desktop/phone sweeps pass; publication and public read-back remain with the coordinating release owner. Andrew instructed on 2 November 2026: “I want map explorer to only contain 2026.” The first eligible source is the existing D001-26003-03 master plan issued 2 October 2026. Its transparent vector pyramid preserves labels, symbols and the registered positions without displaying the drawing’s undated aerial backdrop.

The parent dashboard and separately hosted Explorer need a paired release. The patch removes old satellite choices and secondary imagery rendering, resets saved choices, redirects legacy 3D entry points to the plan, and guards the Explorer’s public mode API. Search, pan, zoom, reference cards, fencing overlays and recorded geographic positions remain supported. Outside-plan positions retain their values and receive a clear notice; no location is invented. PNG export and the overview use the same vector-only plan.

There is no independently verified 2026 aerial or photogrammetric 3D source yet. The embedded Queensland aerial is 2022. Public Esri circuit coverage has 2025 capture dates despite a 2026 release label. The UI states that 2026 aerial and 3D are unavailable; it does not call the plan a satellite image or a 3D capture.

## Inputs and checks

- Dashboard base: v12.81 SHA-256 `3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b`. `patch_v1283.py` checks the exact verified live bytes; the held v12.82 fencing change is excluded.
- Machine base: `8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6`, 236 files. `prepare_machine1283.py` verifies the four source hashes and writes a private candidate with source-bound evidence.
- Verified plan PDF: `8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d`, issued 2 Oct 2026. `explorer/assets/vt/manifest.json` states its tiles contain transparent vectors, symbols and lettering. Georeferencing retains the existing 17 September frame; this is not a surveyed set-out product.
- Release code derives from the existing v10.65 guarded machine publisher, retains all other 232 descriptors, checks the whole inventory before registration and verifies every changed served file. The protected server list follows `server_v5.94_switch/README.md`; current and predecessor server bytes were independently hashed against source. The shared `satellite_explorer/tools/machine_set.py` is hash-pinned unchanged.
- The publisher defaults to no writes. Use `--preflight` for authenticated read-only checks. Publication additionally requires `--dashboard-candidate`, `--explorer-checks` and `--dashboard-checks`: completed browser receipts bind the exact four machine hashes and dashboard bytes, and the live dashboard must still be the pinned v12.81 base before uploads and registration. `--publish` belongs to the coordinating release owner after browser checks and the paired dashboard build pass.
- Run `python release/test_machine1283.py` for mocked release guards. Run the GET-only `tests/test_explorer1283.cjs` with private `CANDIDATE` and `OUT` directories. Required desktop/phone full dashboard sweeps and exact served-byte checks remain the release owner’s responsibility.

Private live copies, manifests, screenshots and provider-query evidence are retained outside the repository. No operational record, price, allocation or financial calculation changes are part of this patch.

## Annual plan updates

Andrew’s subsequent requirement keeps the eventual verified 2026 imagery/3D base fixed while annual plans change. Treat these as separate versioned layers: immutable base identity and capture provenance; annual drawing identity, revision/date, coordinate registration and validated control points. Activation must update all plan-based views together after validation. The current exact plan hash is a reviewed release input, not a claim that this drawing must remain forever. A later plan upload/activation workflow requires its own reviewed implementation; this patch introduces none.

## Focused verification completed

The exact prepared child and dashboard passed the following read-only checks:

- 31 mocked publisher guards, including base races, changed inventory, unexpected writes, wrong or changed candidate bytes, incomplete browser evidence, and live dashboard changes.
- Actual coordinate helper tests: valid main-plan and inset positions, geographic bounds, outside-plan/legend rejection, cold readiness beyond six seconds, superseded/left-tab cancellation, explicit timeout and removal of the previous reference card only after a successful move.
- Standalone Explorer: saved/hash/API/keyboard modes stay on the 2026 plan; unique exact source labels locate, ambiguous/missing matches do not guess; PNG export and direct legacy 3D redirects pass. No old aerial/tile-service requests, browser errors or writes.
- Embedded phone integration: an eight-second delayed plan manifest proves the first cold location request survives; sheet-only/keyless references locate; all 89 current pin records remain available to the existing map model; flattened aerial thumbnails and stale reference cards are absent. Browser errors and writes are zero.
- Desktop/phone screenshots and the 3840 × 3315 PNG export were visually inspected. The map is real 2026 drawing linework, including its inset and legend.

The final dashboard SHA-256 is `10eeb707df306b79c9ee5e870dab64b3037e39806bdd8147e665bc789c01ceff` (16,950,508 bytes). The prepared machine manifest is `1744a9f1a2fb3fc39c8aaae8c91c7e94e9a9c3a463c868eb6d2ea41504069c6a`. These are tested candidates, not live claims.

For the required paired full sweeps, set `CANDIDATE` to the private prepared machine directory and preload `tests/candidate-machine-preload.cjs` through `NODE_OPTIONS=--require=<absolute preload path>`. Run the standard `toolchain/harness/sweep.js` against the final dashboard, once desktop and once with `MOB=1`. The preload serves only the four exact reviewed machine paths; other assets use the shared read-only harness.

Publication order is the guarded machine set, then the guarded dashboard, followed by exact read-back of both. The publisher requires the dashboard candidate plus `browser-result.json` and `dashboard-result.json` from the two focused tests. Every input must retain its tested hash. Author: Andrew Fisher.

## Final release checks

The shared live-base build reproduces the candidate exactly; all 223 inline scripts parse and the source/secret checker passes. Both final paired sweeps pass 27 routes (including expected public aliases), seven deep links and Back, with zero runtime errors, console errors or attempted writes. The parent, four child files, preload and implementation sources retain their tested hashes. Authenticated page dry-run and guarded machine preflight pass. Private receipts remain outside Git. Post-publication verification uses `tests/live_readback1283.cjs` against actual public GET responses, with a fresh fetch cache and no candidate overrides.
