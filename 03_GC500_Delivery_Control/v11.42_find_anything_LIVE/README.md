# v11.42 — The finder finds anything: tabs, VMS boards, removal spots and mornings, register asset numbers

Author: Andrew Fisher. Built on live v11.41 `7a7255c8…`. LIVE 23 Oct 2026 08:09 AEST, page `5537771a…` (full hash in
STATUS.md).

## Andrew's word, 23 Oct 2026

"Need to make sure we can find anything with ease."

## What was measured on live v11.41

A GET-only probe of the search box with twenty likely words: references, units, callouts, sheets and documents were found;
"closures", "removals", "where it is", "satellite", "showcase", "Friday", "Breaker", "Altus", "T10" and "1244536" (GN25's
asset number) found nothing; "VMS 10" found sub-hire rows, not the board.

## What changes

Inside the finder's own functions, by text replacement (`patch_v1142.py`):
- **Tabs.** Every entry of TABS, with everyday words as aliases (closures / fence → Fence closures; removals → VMS
  removals; boards / signs → VMS boards; where it is / satellite / explorer → Map explorer; build / calendar → Build;
  showcase / broadcast → the Showcase, opened by `showOpen()`). A tab row opens the tab.
- **VMS boards.** The 28 boards with the page's positions ("VMS 10", "vms16", "VMS 02a", a board's words). A row opens the
  VMS boards tab and zooms the v11.41 satellite map on the board (1600%); the map keeps a view the finder set across the
  pane's own redraw.
- **Removal spots.** Where each end-of-session board goes (behind 2 Breaker St, T2 runoff, T10 runoff, the Altus
  compound on Cypress Ave). A row opens the VMS removals tab with its map zoomed on the spot.
- **Removal mornings.** Friday 23 to Monday 26 Oct; a row opens the removals tab on that morning.
- **Register asset numbers.** An asset's register numbers join its search words, whichever copy of the index runs (a
  wrapper after every copy), so "1244536" finds GN25 first.
The scoring caps and ranks for the new kinds sit beside the old ones; the old kinds are unchanged (PG01, WC43, a callout
still land where they did). The record is untouched; the crew card untouched.

## Files

- `patch_v1142.py` — requires live v11.41 by SHA-256; eight text replacements in finderIndex / finderMatches / finderPick /
  finderRow and the v11.41 map's inject; `find1142-script` (aliases, the index wrapper, the zoom after a tab change); footer.
- `tests/test_v1142.cjs` — desktop and phone: twenty queries and their first hits; the new rows draw with their words and no
  "undefined"; picking "closures" opens Fence closures and closes the finder; picking "VMS 10" opens the VMS boards tab
  with the satellite map at 1600% centred on VMS 10; picking "Breaker" opens the removals map on 2 Breaker St; picking
  "Monday" opens the removals tab on Monday 26 Oct; picking "showcase" opens the Showcase; record unchanged, no errors, no
  writes. Screenshot: the VMS boards map after a pick.

## Checks

- Dry build on a scratch copy of live v11.41, scrubbed as the build is, then the real build from live: byte for byte the
  same (`5537771a…`).
- `tests/test_v1142.cjs`: 16/16 desktop and phone on the build; 16/16 desktop and phone on live.
- Regression on the build: v11.41 10/10. Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 console, 0 writes blocked.
