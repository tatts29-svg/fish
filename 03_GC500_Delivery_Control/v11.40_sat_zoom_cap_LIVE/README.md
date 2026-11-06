# v11.40 — Satellite zoom capped at Esri's sharpest real imagery

Author: Andrew Fisher. Built on live v11.39 `26351b4f…`. LIVE 23 Oct 2026 07:27 AEST, page `0beba233…`.

## Why

On the live v11.39 page the Fence closures map on Satellite at 1600% showed grey "Map data not yet available" tiles: past
zoom 20 Esri World Imagery has no imagery over the Gold Coast (a zoom-21 request returns a 2.5 KB placeholder; zoom 20
returns real tiles). Both satellite maps (Fence closures, VMS removals) now stop at zoom 20 and draw those tiles larger
past it. Nothing else changes; footer v11.40.

## Files

- `patch_v1140.py` — requires live v11.39 by SHA-256; the two `satZoom` functions' cap 21 → 20; footer.
- `tests/test_v1140_closures.cjs` (test_v1138 with the 16000% check expecting zoom 20) and `tests/test_v1140_vms.cjs`
  (test_v1139 with the 1600% check expecting zoom 20).

## Checks

- Dry build on a scratch copy of live v11.39, scrubbed as the build is, then the real build from live: byte for byte the
  same (`0beba233…`).
- test_v1140_closures 9/9 desktop and phone on the build, 9/9 on live; test_v1140_vms 11/11 desktop and phone on the
  build, 11/11 on live (phone). Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 console, 0 writes blocked.
