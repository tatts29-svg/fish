# Map interactions and navigation audit — v10.65

Author: Andrew Fisher

VERIFIED LIVE — 18 Oct 2026 08:00 AEST. Guarded page and machine publication succeeded, followed by exact public-byte read-back and fresh desktop/phone browser checks. Release source: `f6143b0c6f14bac3690ae81f21287f06997e99a9`; implementation: `ba3bd4d1d3ff0a1dab39d0baf3d75abe99aaa0a7`.

Four reproduced defects are corrected:

- Manual zoom cancels the map's automatic flight to a reference, so two animations cannot compete for the camera. Repeated wheel inputs still accumulate.
- A delayed Costs scroll restoration cannot move a newly opened tab, override a later scroll, or undo a form jump made by the same click. Same-view refresh retains the reading position.
- A new selection's ripple begins when its first frame can be shown, rather than spending its opening frames while the camera moves.
- The embedded 3D equipment viewer stops its selected-equipment animation and skips record projection work while the Map explorer is hidden. Returning resumes through the existing polling loop. Standalone 3D is unchanged.

The page changes are limited to the Costs presentation wrapper, the selected-shape ripple and the exact explorer script allowlist. The machine changes are limited to `explorer.js`, `explorer-merge.js` and their index script pins; 233 other descriptors are preserved. No quantity, charge, completion, geometry, image or operational record changes.

The build pipeline uses `toolchain/build.sh v10.65 v10.65_map_navigation_LIVE/patch_v1065.py` from the delivery-control directory. `prepare_machine1065.py` accepts an exact three-file source directory and writes the reviewed machine candidate. The release wrapper supports authenticated read-only preflight before publication. It rejects unexpected server blobs and inventory changes during staging, in addition to the live-manifest guard; the final GET/POST race still requires coordinated publication.

Validation sources are in `camera/`, `navigation/`, `shape/`, `lifecycle/`, `tests/` and `release/`. Full page bytes, live records, screenshots and CPU profiles stay in private scratch storage. Both screen sizes passed 62 shape checks, 16 integrated map checks, 5 Costs scroll checks, and the full 24-route/7-link sweep with zero page errors, console errors or record-write attempts. Focused source and release guard results are in `evidence/validation.json`. Phone screenshots were visually reviewed. Independent subagent source reviews found no remaining blocker; Claude has not reviewed this candidate. Fresh live desktop and phone checks each pass all 16 map and 5 Costs cases with zero page errors, attempted record writes or local page substitutions. A separate public GET read verified the page, active manifest, all three changed assets and healthy server v5.89. Exact hashes and server-blob preservation are recorded in `evidence/publication.json`.

Remaining work stays explicit: Claude owns v10.61 load/Today/Build/flicker/idle and shared model calculations, plus servicing v10.63. The known overview badge/shape and Done-label overlap need a separate visually verified correction; this release preserves their current drawing and hit priority. The phone profile still shows expensive status projection work, so this release does not claim the full page-speed target is met.

Published page: `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8` (18,302,611 bytes). Published machine: `8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6`. Claude should rebuild v10.61 and v10.63 page drafts from this live base and preserve the exact allowed script sets.

Additional fresh-phone observation: after returning from 3D to the plan close-up, all 12 visible drawing tiles were sharp within 540 ms and prefetch drained within 1.06 s, with no page errors or record-write attempts. The earlier partial-tile screenshot was transient loading. This single observation is not a general speed guarantee.
