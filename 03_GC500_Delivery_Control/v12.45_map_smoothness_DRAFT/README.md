# v12.45 map smoothness — DRAFT

Author: Andrew Fisher

Drawing-sheet tile refreshes could retire the last sharp layer while replacement tiles were still loading. The refresh now keeps the last completed view until the current view has decoded, and bounds retained entries to that completed view plus the current request. Failed loads can retry; obsolete callbacks cannot restore pruned tiles.

The satellite assets map, VMS removals map and fence-closure map replaced all SVG image nodes on repeated updates, even when their tile URLs and geometry were unchanged. They now reuse those image nodes and update only changed attributes. The two satellite maps still regenerate pin markup on every apply, but reuse existing pin nodes when that exact markup is unchanged. Changed pin data and geometry still render. Tile selection, geometry, zoom limits, pin contents, search and layer groups are unchanged. This patch does not change the explorer frame, Claude's off-site rings, Demob pictures, records or financial calculations.

Base for current checks: verified v12.43 `7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f`. Preview `3336caa9b9d9065d9638f9e9bd4b57719c8929d5924e9bd5280febda4b4376cf`, 16,043,896 bytes. The patch requires an explicit matching base SHA and reviewed v12.43/v12.43.1 footer, and refuses repeated application or missing source sections.

Checks so far: 296 source-fragment lifecycle, geometry and DOM-identity assertions; seven release-boundary tests; 214 inline scripts parse. Native before/after, phone/desktop sweeps and final successor rebuild remain required. The SVG helper retains one completed coarse anchor, the last completed view and the current request. The anchor uses the largest completed tile span, preserves its original projected geometry, and supplies retained fit coverage on reverse zoom. Explicit mode clearing removes all layers. A small loading/failure status explains imagery that is not yet available; it changes only with status and never captures gestures. Direct native delayed-load verification is still required. No claim of all map lag or blank frames being resolved. Not READY TO UPLOAD.
