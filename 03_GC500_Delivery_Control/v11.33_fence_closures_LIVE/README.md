# v11.33 — Fence closures tab (#fenceclose): the ten closure points as marked, each race day's fence closure and windows, ticks and a sheet

Author: Andrew Fisher. Built on live v11.32 `82cc502b…`. LIVE line and hashes in STATUS.md.

## Andrew's word, 23 Oct 2026

"When i spoke about closures im talking about fence closure. This is data i got from v8s" (the Supercars Track access
details). "This is what we work with this is also not a order it goes in" (the marked master layout: the circled numbers
are not the order the points close in). Three jobs for the morning: VMS, Fencing, Servicing.

## What the tab shows

- **The ten closure points** from the page's closures record (`DATA.closures.marks`, read off the marked plan on
  19 Sep 2026): numbered and coloured as on the plan (1 black, 1 orange, 2 black, 2 teal, 3 black, 3 pink, 4 teal, 5 pink,
  6 orange, 7 orange) with the place as read. The number is not the order.
- **Three race days** (Fri 23, Sat 24, Sun 25) with the day's times: the 07:00 fence closure (Armco gates and circuit),
  the morning window written on the plan (Fri 7-8am, Sat and Sun 7-7.25am), 07:45 all vehicles off, the closing lap, patron
  gates, the evening opening lap, the evening window written on the plan (Fri 6-7pm, Sat 5.53pm-7pm, Sun 5.15-7pm),
  accredited vehicles, concert finish, Mac Park access.
- **Ticks**: Closed and Opened per point per day with the time, a note per point, crew and notes, the crew's sign-off and
  the project manager's audit. Through the page's write path on the edit link; nothing pre-ticked; the view link refuses.
- **Print closures sheet / Save as PDF**: one A4 page on #print/fenceclose/<date>, form GC500-RS-FC-01 v1.
- **The Fencing tab's closure card** now reads "what closes, and when" and "The closure points as marked on the plan",
  and says the circled numbers are not the order (the project manager's word, 23 Oct 2026). The record's own
  `order_basis` text (19 Sep) is left as data; the page no longer shows it.

## Files

- `patch_v1133.py` — requires live v11.32 by SHA-256; the v11.32 mechanics plus the closure card wording; footer.
- `fenceclose1133.js`, `fenceclose1133.css` — the tab, the record (kind `fenceclose1133` on the loads collection), the sheet.
- `tests/test_v1133.cjs` — desktop and phone.

## Checks

- Dry build on a scratch copy of live v11.32, scrubbed as the build is, then the real build from live: byte for byte the
  same (`0d2f2726…`).
- `tests/test_v1133.cjs`: 12/12 desktop and phone on the build; live results in STATUS.md.
- Regressions on the build: v11.32 12/12, v11.31 11/11 (evidence/regression_dry/).
- Sweeps, desktop and phone: 27 tabs (the new one shown with its text), 7 hashes, Back, 0 console, 0 writes blocked.
- The crew card is untouched; no tracker republish.
- Screenshots: `evidence/fenceclose_tab_*.png`, `evidence/fenceclose_sheet_*.png`.
