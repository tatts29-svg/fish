# v7.59 — the QR code, Navigate and Text it as one tidy set (LIVE)

**LIVE in the combined v7.59 page, 1 Oct 2026 08:11 AEST.** The public view serves the build byte for byte: **8,489,105 bytes**, SHA256 `ed1e2f4b9e97b94558d09522bdd9b7c64aaf1e18740a39dd88494227b388a403`. 55 focused checks and both 21-tab/7-link sweeps passed, with zero page or console errors. Earlier build sizes below describe the draft checks. No shared records changed.

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "Can we add the Text me near the QR code, make this look really tidy and pretty please. Make it
go live."

v7.57 put the Text it button beside the QR code and Navigate on every Timeline load line. This makes the three read
as one set, styles only:

- the two pills the same height and shape (56 px, fully rounded): Navigate stays the orange one that pulses; Text it
  is the dark one with the orange bubble and an orange edge, and lights up orange on touch;
- the QR tile the same height as the pills, even 10 px gaps;
- on a phone the QR sits at the left (92 px, easy to scan) with the two pills stacked at full width beside it.

No words, no behaviour and no record change. `evidence/shot759_load_line.png`, `evidence/shot759_load_line_phone.png`.

## Build and evidence

`build/GC500_v7.59/GC500_Delivery_Control_hosted.html` — v7.55 → v7.56 → v7.57 → v7.59 on the live v7.54;
**8,489,119 bytes**, check_page PASS, key grep clean.

| check | desktop | phone |
|---|---|---|
| v7.57 practice test (button, box, picture, send, drawer's Text it) | pass, 0 errors | pass, 0 errors |
| sweep.js | 21 tabs, 0 errors, 0 console | 21 tabs, 0 errors, 0 console |

Upload this build in place of `build/GC500_v7.57`. Rebuild: `toolchain/build.sh v7.59 v7.55_…/patch_v755.py
v7.56_…/patch_v756.py v7.57_…/patch_v757.py v7.59_…/patch_v759.py`.
