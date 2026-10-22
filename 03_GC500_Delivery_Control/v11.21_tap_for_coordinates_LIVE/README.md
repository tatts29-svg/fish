# v11.21 — Map explorer: press and hold anywhere for that spot's coordinates; share them with a picture of the map

Author: Andrew Fisher. The v11.17 layer, unchanged, rebased onto live v11.20 on Andrew's word of 22 Oct 2026: "Go live with
everything". LIVE line and hashes in STATUS.md. The design, the maths and the evidence are in
`../v11.17_tap_for_coordinates_DRAFT/README.md`; this folder carries the patch for the new base and the same tests.

Andrew, 22 Oct 2026: "i want to be able to tap any where in here to get the exact map coordinates ... then i want to be
able to then attach and send a message with those coordinates and a map of that area".

## What `patch_v1121.py` does

Identical to `patch_v1117.py` except for the base and the footer: `spot1117_src.js` (the same bytes) is appended as
`spot1117-script` at the end of the page; the explorer frame's load handler mounts the layer after the v10.60 shapes; footer
v11.20 → v11.21. The patch requires the live v11.20 page by SHA-256 (`44042b0f…`).

## What it does

On the Map explorer, press and hold (right-click on a laptop) anywhere on the map: an orange pin drops and a card gives the
spot's latitude and longitude to six decimals, the two nearest placed references with distance and direction, and "give or
take a metre or two, not a survey". Share with map hands the device's share sheet the words (coordinates, nearest
references, a Maps link, the time) and a 1080×1270 PNG of the map around the pin; Copy and Open in Maps beside it; a clear.
Tap still picks, drag still pans. Read-only: no record writes. Coordinates come from the explorer's own georeferencing,
checked against the pinned references (P01 to 0.0 m; median 0.04 m across 44 pins).

## Checks

Applied to a copy of the v11.20 build before the live build (the same bytes the live build produces): toolchain checks PASS;
`tests/test_v1121.cjs` desktop 22/22 and phone 21/21 (layer present and mounted once, pin and card, coordinates against
the known pins, share words and picture, record unchanged, 0 errors, 0 writes); sweeps desktop + phone 25 tabs / 7 hashes /
Back, 0 errors, 0 blocked writes. The live build and its checks are in STATUS.md.
