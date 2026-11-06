# v11.35 — Twin-steer ask off, Build stops at 22 Oct, Coates on time from the 22 Oct texts

Author: Andrew Fisher. Built on live v11.34 `a9bf0214…`. LIVE line and hashes in STATUS.md.

## Andrew's word, 23 Oct 2026

- "every time we want to print things we get asked for the twin steer can we remove this now."
- "in build we dont want any cards past and from 23/10/26."
- "I also sent you list of deliveries sms times this has not been updated on any build data cards we should show a
  percentage. There is nothing from monday this week."

## What changes

1. **Twin-steer.** The tick dialog before a print or PDF, the Ctrl+P hold, the print-button hold and the compulsory
   checklist box are off (`armed()` is always true; the checklist wrapper is skipped). The red banner stays on every
   tab and the rule still stamps every PDF page.
2. **Build tab.** The day strip and the agenda stop at 22 Oct 2026. The calendar itself (routes, the Change tab, the
   prints) is untouched.
3. **Coates on time.** The units rebuilt from the delivery texts exported 22 Oct 2026 04:57 (384 texts, 8 Sep 09:39 to
   21 Oct 12:21): 126 units, 18 of them 19 to 22 Oct. The 108 units both exports share are unchanged; the four 19 Oct
   units the page already held gained their on-its-way and delivered times. Six of the new units match no programme
   row or register line (a 43 ft scissor lift, two Trakmat loads, an external service, a knuckle boom, a straight boom
   and a portable air conditioner); they are listed, with the Coates delivered time standing in for a site time.
   `build_ontime1135.py` is `build_ontime1057.py` with the export date; the raw export stays out of the repository.

## Files

- `patch_v1135.py` — requires live v11.34 by SHA-256; the three replacements and the data swap; footer.
- `build_ontime1135.py`, `ontime1135_units.json` — the rebuild (run with `python3 -I` on the export).
- `tests/test_v1135.cjs` — desktop and phone: a print button opens the print view with no tick dialog and the banner
  still there; the Build strip ends at 22 Oct while `calendarDays()` runs on; the embedded data is the 22 Oct export
  with 126 units; Monday 19, Tuesday 20 and Wednesday 21 Oct show their COATES ON TIME row with a percentage; More info
  says the texts are loaded to 22 Oct 2026; record unchanged, no errors, no writes.

## Checks

- Dry build on a scratch copy of live v11.34, scrubbed as the build is, then the real build from live: byte for byte the
  same (`823a9035…`).
- `tests/test_v1135.cjs`: 9/9 desktop and phone on the build; 9/9 desktop and phone on live.
- Regression on the build: v11.33 12/12. Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 console, 0 writes blocked.
- LIVE 23 Oct 2026 03:56 AEST. The crew card is untouched; no tracker republish.
