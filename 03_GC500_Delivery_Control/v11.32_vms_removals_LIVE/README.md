# v11.32 — VMS removals tab (#vmsoff): the five end-of-session boards, when each may come off, where it goes, the Supercars times

Author: Andrew Fisher. Built on live v11.31 `02bdac7d…`. LIVE line and hashes in STATUS.md.

## Andrew's word, 23 Oct 2026

"Another tab. Vms daily removals. Vms 16. Vm17 vms 14 can be taken off track starting 3am. vms13 and vms15 must be taken
off track starting 6am. Vms 16 can go behind here at breaker street" — the link resolves to 2 Breaker St, Main Beach QLD
4217 (-27.9817267, 153.42943), a few metres behind VMS 16's T11 position. "When i spoke about closures im talking about
fence closure. This is data i got from v8s" — the Supercars Track access details, carried on the tab as issued.

## What the tab shows

- **The five boards** (positions 13* to 17* on the VMS plan, the end-of-session boards): position from the plan (a pin set
  on the page overrides it), earliest off-track time as a badge (green 03:00 for VMS 14, 16, 17; amber "not before 06:00"
  for VMS 13, 15), where it goes (VMS 16 behind 2 Breaker St; VMS 15 the T2 runoff; VMS 13 and 14 the Altus compound,
  Cypress Ave; VMS 17 the T10 runoff), Navigate to the board, Navigate to its spot where the spot is pinned.
- **Three removal mornings**: Saturday 24 (after Friday night), Sunday 25 (after Saturday night), Monday 26 (after Sunday
  night, the final removal: no circuit closure, roads reopen 17:00, GC Hwy southbound stays closed Tedder Ave to Surfers
  Blvd until 05:00 Tue 28 Oct). Each shows its timeline: the evening opening lap (boards go out), accredited vehicles,
  Mac Park access, 03:00 and 06:00 (our earliest), the 07:00 fence closure (Armco gates and circuit), 07:45 all vehicles
  off, the closing lap and patron gates.
- **Ticks**: Off the track and Back out tonight per board (Monday has no back-out), a note per board, crew and notes,
  the crew's sign-off and the project manager's audit. Each saves on its own through the page's write path on the edit
  link; nothing is pre-ticked; the view link refuses and springs back.
- **Print removals sheet / Save as PDF**: one A4 page on #print/vmsoff/<date>, form GC500-RS-VR-01 v1.
- **Track access details** as issued by Supercars, all five days, for the record.

## Files

- `patch_v1132.py` — requires live v11.31 by SHA-256; the tab list, glyph, pane, render dispatch, print deep link, print
  bar, hash to tab (the Event nights mechanics), the script and style at the end of the page, footer. Note on `rep()`:
  it matches the old text with its leading whitespace, so a replacement that starts where a space was must start with
  that space (the first dry build landed as `elseif` and failed the page check; fixed before any build was uploaded).
- `vmsoff1132.js`, `vmsoff1132.css` — the tab, the record (kind `vmsoff1132` on the loads collection), the sheet.
- `tests/test_v1132.cjs` — desktop and phone.

## Checks

- Dry build on a scratch copy of live v11.31, scrubbed as the build is, then the real build from live: byte for byte the
  same (`82cc502b…`); the scrub turns the script's dated word into "the project manager, 23 Oct 2026" on the page, as the
  page rule says.
- `tests/test_v1132.cjs`: 12/12 desktop and phone on the build; 12/12 desktop and phone on live.
- Regressions on the build: v11.31 11/11, v11.27 9/9 (evidence/regression_dry/).
- Sweeps, desktop and phone: 26 tabs (the new one shown with its text), 7 hashes, Back, 0 console, 0 writes blocked.
- LIVE 23 Oct 2026 02:51 AEST. The crew card is untouched; no tracker republish.
- Screenshots: `evidence/vmsoff_tab_*.png`, `evidence/vmsoff_sheet_*.png`.
