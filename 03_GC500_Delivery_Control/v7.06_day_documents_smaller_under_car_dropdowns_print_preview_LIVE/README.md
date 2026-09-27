# v7.06: day documents smaller, under the car, drop-downs, and a print preview (LIVE)

Author: Andrew Fisher

Andrew, 27 Sep 2026, with a phone screenshot of the whole Timeline printing:
"They dont print right... prints all day cards. Nothing aligns. Drop box for installs and drivers, print all, or each
one individually by reference no. One page for each. I dont want empty space. You're mentioning Monday multiple times.
They probably need to be smaller and under the car. Approval to fix now."

- **Cause:** on Android and iPhone the print sheet opens after window.print() has returned and 'afterprint' has fired, so
  the page had already switched back to the Timeline.
  - Every document now opens as a preview (the pages on screen, with Print / Save as PDF and Close) that stays exactly
    as it prints until Close.
  - On a phone the preview is scaled to the screen; the paper is not scaled.
- **Drivers and Install are drop-downs:** Print all, or one load, listed as "Load 4 · GN01 · WC01 · WC42 · 10:30 · SFL BOGIE".
  It's one A4 page per load.
- **The plate:** one slim row under the banner picture, with the date shown once (no weekday) and no empty space.

**LIVE: 27 Sep 2026, 20:07 AEST.** The page is v7.04 live + `patch_v706.py`, verified byte for byte on the view link.

**Tests, desktop and phone**, with 'afterprint' fired straight after print() the way a phone does:
| What | Pages |
|---|---|
| Load 4 alone | 1 |
| Install, print all | 7 |
| Pre-start | 1 |

- The pre-starts page still prints one page.
- No page errors.
