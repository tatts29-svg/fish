# v8.84 — Today wide-screen layout

Author: Andrew Fisher. Claude build. Andrew, 7 Oct with a screenshot of Today on his wide screen: "you need to fix the layout mate", then "Lets get it done". Earlier claimed on the board as v8.80; numbered v8.84 so the page's version keeps counting up after live v8.83.

Presentation only: one stylesheet, plus the version label in the footer. No data, record, Finance or other-tab changes.

| Before (v8.83) | After (v8.84) |
|---|---|
| Today capped at 1760 px, so a wide screen had about 400 px of empty white either side | Today uses the full width with a 16–36 px gutter |
| Banner capped at 1400 px, narrower than the boxes under it | Banner sits in a full-width dark band, centred, held to 42% of screen height |
| Thin dark focus outline down both edges of the pane | Removed (pane focus outline only; controls keep theirs) |
| Paired progress cards uneven heights | Cards in a row are equal height |
| Two cards per row on every desktop | Three per row on screens 1960 px and wider; two on laptops; one on phones. Fencing stays full width |
| Gauge names broke mid-word ("GENERATOR / S") at 1600 px and on wide screens | Once the gauge sits beside the counts, the name scales with its card; whole words only, one line from 1024 to 3840 px. Fencing title unchanged |

## Build

`toolchain/build.sh v8.84 v8.84_today_wide_layout_DRAFT/patch_v884.py` on live v8.83 `88a3584e919d8acd32ac3905099c1d606ec2fe5c1da2793363e8ff870f212457` (11,138,554 bytes). The patch asserts the v8.83 footer marker.

Candidate: `707eac42da308ce5557325d26f897540bbf1ec23f52b175d3d41cf69ea446551`, 11,140,543 bytes.

## Checks

New `tests/test_wide884.cjs` (21 checks): full content width, side gutter, banner band, banner centred and height-capped, cards per row, equal heights, Fencing full row, gauge names whole and unclipped, contacts per row, no pane outline, no horizontal overflow, native animation, redraw keeps layout, scroll, data and money, print untouched, no errors, no live writes. `W=` sets the width; `MOB=1` runs the phone.

Live v8.83 fails 7 of 21 at 2560 px and 5 of 21 at 1600 px (`evidence/control_live_v883/`), so the test catches the old layout.

Full results are in `evidence/` once the suite finishes; the board entry names the final counts.

`test_handling875` (22/28) and `test_paired879` (17/18) give identical results on live v8.83 and on this candidate. They are out of date, not faults: v8.81 renamed "Franna required" to "Franna crane unloading", and Andrew recorded P52 as Franna on 7 Oct at 14:41. Their replacements, `test_unloading881` and `test_paired881`, are in the suite.
