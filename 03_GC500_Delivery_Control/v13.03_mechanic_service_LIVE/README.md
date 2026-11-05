# Coates Way mechanic service

Author: Andrew Fisher · 5 Nov 2026

LIVE — registered 5 Nov 2026 at 23:43:34 AEST. Guarded publication, exact public
read-back and the fresh live phone browser check are complete.

Published manifest: `380d057f6eee18c948c29741a0ab5d431801ff7f796fef9b5c158170214c5c98`.
Original-model checks pass: service 6,556; mechanic 360; lessons 3,976;
showcase 416; release guards 26. Exact results are in `evidence/`.

Andrew approved the working mechanic, complete modelled lift/refit, four-stroke
explanation, component inspection and controllable workshop tour in the current
chat. This extends the original Coates car and v13.02 workshop. It is an interactive
mechanical illustration, not a manufacturer service procedure or live telemetry.

The service controller gives the mechanic, original hose paths, ten bellhousing
fasteners, rigging and 101 engine objects one reversible sequence. The engine must
be supported before the rig can detach; bench lessons require cleared rigging.
The mechanic uses the existing articulated figure, with modelled tools and
reachable handling points. Scrubbing and reversing reproduce the same poses.

Four-stroke explanations follow the original cylinder and cam-driven valve motion,
including overlap. Sixteen components can be brought forward and rotated, with a
line back to the fitted location and references to their connections. Original
resources are shared and restored. The 126-second workshop tour supports pause,
seek, orbit takeover and manual lesson takeover, and ends with the engine refitted.
Reduced-motion preferences are respected. The event dashboard Showcase is separate.

## Exact base and scope

Shared source branch: `ccr-061f77e8-ivjhrv`. Isolated implementation branch:
`codex/machine-service-1303`. Starting source:
`d45e5162573c8f227c93f07f1326382794ed358e`; claim:
`e6bddba0a0163aede2927977e54f57973e54b079`.

Live machine base: v13.02, 241 files,
`b4e46efb6726d18b807f8160d19199a40858f38fd93c2ab09bcd650c67b43cc7`.
The candidate retains 237 files byte-for-byte, replaces four and adds four, for 245.
Main dashboard remains v13.01,
`2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b`.
No operational records, finance calculations, map dependencies or existing artwork
are changed. Existing changed-module import edges carry `v=13.03` to avoid stale
one-hour caches.

## Reproduction and verification

`prepare1303.py <verified-base-machine-dir> <fresh-output-dir>` patches the exact
v13.02 application with the shared replacement helper and copies the six reviewed
workshop modules. It refuses a different application hash or an existing output.
`release/README.md` documents complete retained-file assembly, the four actual
browser receipts and guarded publication/read-back.

Run the original-model unit checks with Node:

- `tests/test_workshop_service.mjs`
- `tests/test_workshop_mechanic.mjs`
- `tests/test_workshop_lessons.mjs`
- `tests/test_workshop_showcase.mjs`

Run `tests/test_browser.cjs` on the complete candidate tree with `PREVIEW_ROOT`, a
fresh `OUT`, and `MOB=1` for phone. Run `tests/test_dashboard.cjs` with the exact
candidate and unchanged dashboard. Browser runs are serialised through
`flock /tmp/gc500-browser.lock`; all test requests are GET-only, with writes blocked.
The dashboard tests cover native machine entry/exit, 27 routes, seven links and Back.
`tests/test_live.cjs` verifies a publication using an empty cache, real public bytes,
phone controls and a final identity recheck. It does not substitute candidate files.

Phone viewport checks establish layout and interaction, not physical-phone frame
rate or thermal performance. Source and visual reviews are recorded with the final
acceptance results. The machine release owner publishes only after the final
candidate passes the guards and all four bound receipts.

Final acceptance: machine desktop 84/84 and phone 86/86, dashboard 97/97 each
(27 routes, seven links and Back), no errors or writes. Machine receipts were
saved only after browser/server closure. Independent source, geometry, visual and
release reviews pass. See `evidence/REVIEW.md` and the four bound JSON receipts.

## Publication and live verification

Published from `a051db095677d2b3631e2e687fc817a9ca35baa1`; implementation and
acceptance evidence were frozen at `f34a21a76e45ef9d9514f33f6db3841244f8ae1b`.
The server registration timestamp is `2026-11-05T13:43:34.001Z`.
Machine `v13.03-mechanic-service`: 245 files, 169,957,572 bytes.

The guard uploaded eight changed blobs, retained 237 exact file descriptors and
verified all eight public files byte-for-byte after registration. The dashboard
hash and all eleven protected unlisted blobs remain unchanged. No operational
record writes occurred. Receipts: `evidence/publication.json` and
`evidence/live-status.json`.

The fresh live phone browser passed 12/12 checks with an empty request cache,
continuous production rendering and no candidate substitution. It verified all
eight changed files, 73 loaded public machine files, native service play/pause,
supported/rig-clear bench, hand crank, four-stroke selection, component rotation,
exit/restoration and final manifest/dashboard identity. Zero runtime/console
errors and zero record writes. The two live screenshots were visually reviewed.

The initial live run reached its 30-second native action timeout at Start service.
Its receipt is retained as `evidence/live-browser-initial.json`. The successful
recheck increased only the harness action budget to 120 seconds, retained native
visibility/stability/hit-target checks, and used no forced click or render-loop
modification. No production files changed between these attempts. This verifies
live behaviour, not physical-phone frame rate or loading speed.

Future machine changes start from published manifest
`380d057f6eee18c948c29741a0ab5d431801ff7f796fef9b5c158170214c5c98`.
Page-only work still starts from dashboard v13.01 hash above. Claude retains event
Showcase/race narration and finance. This was implemented and published by Codex
with independent Codex source/geometry/visual/release reviews; Claude receipt or
review is not claimed.
