# v11.15 — the crews' QR pages, v3.1: rings that fill, the chequered strip, the tick that draws itself, the finished moment

Author: Andrew Fisher. Built on live v11.14 `4d421ade…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026, after v11.14: "Remember i need this to look amazing.. thankyou so much".

## On top of v11.14's race-night card

- **Rings.** Every percentage sits in a ring that fills as the night goes on: orange while there is work to go, green
  and pulsing at 100 %. In the sticky strip (this area and everything, with "N to go" beside each), in the progress
  blocks, and on every area in the list.
- **The race strip.** A chequered band across the top of the header and an orange light line under it.
- **The reference ignites** when the page opens (its glow flares and settles).
- **The tick draws itself** in green when Complete is tapped; the untouched Complete button carries a faint orange
  ring so the crew can see where to press.
- **Save & close** carries a slow light sweep over its pulse. **The Saved card** has slow green rays behind the text.
- **The finished moment.** When the last job in an area is ticked, the "Still to go" block becomes an
  **AREA FINISHED hh:mm** stamp with "Every reference in Area n is done. On to the next one!", and the area glows green
  in the list with "Area finished hh:mm · All done".

Same ids, classes, data attributes, ticks, outbox, service worker and signed codes as before; `prefers-reduced-motion`
stops every animation. Nothing here ticks the job record or changes a charge.

## What changed

1. `servicing_tracker_DRAFT/card/card.css` (v3.1 block appended), `card_src.js` (rings in `progHtml`, `compactHtml`,
   `areasHtml`; the finished stamp in `leftHtml`). The card's own suite `test_card_v2.cjs`: **46/46**
   (`test_card_v2_results_v31.txt`).
2. `patch_v1115.py`: the page's crew card template `SVC1067_CARD.html` rebuilt from those sources (as v11.14 and
   v10.67); `SVC1067_CARD.data` unchanged. Footer v11.14 → v11.15.
3. `update_card.cjs`: the live card re-posted under its **existing token** from the page's own control on the edit link
   (dry run first; every printed QR code keeps working; the 75 signed links, key and ticks checked unchanged after).

## Checks

Card suite 46/46. Toolchain PASS all checks. `test_broadcast1113` on this build 36/37 (the footer now v11.15). Phone
screenshots on the local mock in `evidence/` (`tests/shot_card_mock.cjs` and `tests/shot_finish_mock.cjs`, the
latter finishing Area 13). Dry run of the live update passed against this build. Sweeps, the live update and its
verification: see STATUS.
