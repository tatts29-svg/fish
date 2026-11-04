# v12.98 — visible equipment locations on Build and Demob maps

Author: Andrew Fisher

Andrew requested brighter glowing equipment outlines and a pulsating circle around each mapped location on both Build and Demob. The v12.97 preview outlines became difficult to see when reduced to card size.

The existing map pictures now carry an SVG overlay with a bright source outline and a 44-pixel location ring. Ring size stays legible when cards resize; its centre follows the exact picture crop. Build's three panels preserve their independent native crops. Demob's close-up, wider-area and whole-site maps and full picture dialog use the same picture metadata. Exported pictures retain a static bright circle.

Source polygons, angles, door details, current and historical location resolution, map controls, cards and weather remain intact. A location ring is a visual locator, not an equipment footprint or a new completion claim. Shared or unassigned positions keep their existing qualifications; no outline is invented for them. Missing locations do not gain a marker.

The pulse uses CSS opacity/transform animation. It does not redraw, re-encode or refetch map pictures. Offscreen, inactive and hidden maps pause; reduced-motion users retain a static ring. Projection metadata follows the existing bounded image caches and is released with each picture.

## Release state

VERIFIED LIVE — uploaded 5 Nov 2026 03:18 AEST (`2026-11-04T17:18:07.321Z`) from READY source `4c511cd87cca72a1d85944630f436b7854a66281`. The guarded uploader and independent public read-back both match the exact release bytes. Fresh public phone checks pass without a candidate override. The machine release and shared record are unchanged across publication. Ownership and other work holds remain on the shared status board.

- Agreed branch: `ccr-061f77e8-ivjhrv`.
- Starting source: `9f3d2de3bc3357f1919278b090ed36eb311c0567`.
- Required live base SHA-256: `567b19b3b767b66a273d0956aced913b942808f98e8f0c1f6075114c17f87261` (v12.97).
- Candidate SHA-256: `ec4640ad3d8e8f99250247f40c98958d0b123b590e7c431973460f715f00d24d`, 17042608 bytes.
- Shared build: 224 scripts; 14 focused tests; exact scope and base guards; native phone/desktop alignment and motion checks; both 27-tab/seven-link/Back sweeps pass. Zero runtime/console errors or attempted record writes.
- Verification is recorded in `verification.json`.
- Detailed screenshots and native site evidence remain private.

## Reproduce

Use the shared toolchain to build from the exact live base:

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.98 03_GC500_Delivery_Control/v12.98_map_glow_LIVE/patch_v1298.py
node --test 03_GC500_Delivery_Control/v12.98_map_glow_LIVE/tests/*.test.js
python3 03_GC500_Delivery_Control/v12.98_map_glow_LIVE/check_scope.py BASE CANDIDATE
```

Run `tests/check_glow_ui.cjs` under `/tmp/gc500-browser.lock`, with `PAGE` set to the candidate and `OUT` set to private evidence storage. `LIVE=1` instead reads the unmodified public page. Both standard shared browser sweeps are also required. All checks use the read-only harness and must report zero attempted operational writes.
