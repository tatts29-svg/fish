# GC500 v6.00 — the machine's hero is a loop · The Coates Way machine v5.82

25 Sep 2026. Applied on top of v5.99c (see `../v5.90_v5.91_navigation/`).

## The delivery page (v6.00)
- `patch_v600.py` — the Coates Way card plays a 14 s loop of the cog exhibit itself (running, released into its exploded view
  while the camera circles it, put back together), muted and inline, resting off screen, the first frame as its poster, the
  still for anyone with reduced motion. The clip is hosted media (mp4 first, a VP9 webm for a browser without H.264, a webp
  poster) added to the kit's media manifest and to the page's media table; the manifest digest is recomputed the service's way.
  Also: on a phone the banner's race-day clock sits under the days, whole (it was clipped by the pod's edge).
- `hero_capture.js` + `hero_encode2.sh` — the capture (mechanism.html?hero=1, 420 frames at 30 fps, 1920×1194) and the encode
  (1440×896: mp4 crf 27, webm crf 40, poster webp).
- `verify_v600.js`, `probe_phone2.js`, `probe_phone3.js` — the checks: the loop plays on the Coates Way tab, the phone countdown
  fits, what overflows a 390 px phone (only the sideways-scrolling table wrappers and the day strip, by design).
- `build_asset_app.py.v600` — the builder with the same card, style and wiring changes.

## The machine (v5.82) — `machine_v5.82/`
The changed sources only (the machine's tree lives outside this repository, in the handover pack): `dist/app.js` and
`dist/mechanism.html` (the `?hero=1` capture hook), `dist/car-cockpit.js` and `dist/car-app.js` (the speedo, the crew radio
head unit, the ignition key with a head and its lamp, 267 draws), `dist/engine-kinematics.js` and `dist/car.css` (the eye looks
6 cm lower so the whole wheel sits above the dock; the toast moved off the wheel), `dist/crew.js` and `tests/crew.test.mjs`
(route margins that adapt to each end's clearance, corner fillets eased off the footprints, and the test that no person is ever
inside a footprint — 618,596 checks over three service cycles). `patch_machine_v582.py` is the cockpit patch as first applied;
`CLAUDE_HANDOVER.md` carries the full entry. `hero/cockpit_v582.jpg` is the cockpit from the seat after the change;
`hero/machine_hero_poster.webp` is the loop's poster. The video files are not committed (6 MB); they are on the service.

Published 25 Sep 2026: machine set `v5.82-explorer` (172 files, with the explorer, the 3D proof and the server copy) and the
v6.00 page with 135 media assets.
