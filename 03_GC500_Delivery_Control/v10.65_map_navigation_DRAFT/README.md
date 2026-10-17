# Map interactions and navigation audit — v10.65

Author: Andrew Fisher

DRAFT. Combined candidate built from live v10.64; desktop and phone validation in progress. Not published.

Four reproduced defects are corrected:

- Manual zoom cancels the map's automatic flight to a reference, so two animations cannot compete for the camera. Repeated wheel inputs still accumulate.
- A delayed Costs scroll restoration cannot move a newly opened tab, override a later scroll, or undo a form jump made by the same click. Same-view refresh retains the reading position.
- A new selection's ripple begins when its first frame can be shown, rather than spending its opening frames while the camera moves.
- The embedded 3D equipment viewer stops its selected-equipment animation and skips record projection work while the Map explorer is hidden. Returning resumes through the existing polling loop. Standalone 3D is unchanged.

The page changes are limited to the Costs presentation wrapper, the selected-shape ripple and the exact explorer script allowlist. The machine changes are limited to `explorer.js`, `explorer-merge.js` and their index script pins; 233 other descriptors are preserved. No quantity, charge, completion, geometry, image or operational record changes.

The build pipeline uses `toolchain/build.sh v10.65 v10.65_map_navigation_DRAFT/patch_v1065.py` from the delivery-control directory. `prepare_machine1065.py` accepts an exact three-file source directory and writes the reviewed machine candidate. The release wrapper supports authenticated read-only preflight before publication. It rejects unexpected server blobs and inventory changes during staging, in addition to the live-manifest guard; the final GET/POST race still requires coordinated publication.

Validation sources are in `camera/`, `navigation/`, `shape/`, `lifecycle/`, `tests/` and `release/`. Full page bytes, live records, screenshots and CPU profiles stay in private scratch storage. Publication and final validation evidence will be added after all checks pass.

Remaining work stays explicit: Claude owns v10.61 load/Today/Build/flicker/idle and shared model calculations, plus servicing v10.63. The known overview badge/shape and Done-label overlap need a separate visually verified correction; this release preserves their current drawing and hit priority. The phone profile still shows expensive status projection work, so this release does not claim the full page-speed target is met.
