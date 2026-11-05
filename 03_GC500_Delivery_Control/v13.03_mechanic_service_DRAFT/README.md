# Coates Way mechanic service

Author: Andrew Fisher · 5 Nov 2026

DRAFT — source frozen; final browser acceptance in progress. Not yet live.

Frozen candidate: `380d057f6eee18c948c29741a0ab5d431801ff7f796fef9b5c158170214c5c98`.
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
