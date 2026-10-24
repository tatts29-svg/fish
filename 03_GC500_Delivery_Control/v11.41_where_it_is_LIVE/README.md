# v11.41 — "Where it is": every VMS board and every generator on satellite

Author: Andrew Fisher. Built on live v11.40 `0beba233…`. LIVE 23 Oct 2026 07:43 AEST, page `7a7255c8…` (full hash in STATUS.md).

## Andrew's word, 23 Oct 2026 (photographs of the Map explorer)

- "When i look for generators i cant see where some of them are."
- "Cant see all vms boards on here either."

## Why the explorer cannot show them

- The Map explorer draws on the master layout's sheet. Seven boards sit off that sheet on the record: VMS 01 (Gold Coast
  Hwy median south of Queen St), 02 (Waterways Dr), 03 (Gold Coast Hwy north of Breaker St), 07 (Main Beach Pde at John
  Kemp St), 23 (Gold Coast Hwy north of Sundale Bridge), 09 (Gold Coast Hwy north of T E Peters Dr) and 10 (Old Burleigh
  Rd). VMS 08 and 22 fall on the inset.
- The generators: 14 references. Twelve carry the master plan's drawing-label pin (the record's position state: "candidate
  — drawing label only, physical position not verified"), GN06 the iEDM Gate 6 drawing's, and the Concert pair (1316182,
  1316183, no number on any drawing, so the reference reads "GN?") Andrew's supplied pin of 12 Oct. GN25 (1244536) has no
  position on the record at all, so no map can place it. GN20 (S01) and GN21 sit 4 m apart and draw as one at the
  whole-plan view.

## What changes

A satellite map from the page's own positions (`satmap1141.js`), mounted twice:
- **Under the Map explorer** (`#pane-map`, after the explorer card): every board the record places, anywhere, the five
  end-of-session boards in their removal colours and the rest violet; every placed generator as a green square with its
  units; All / VMS boards / Generators filter.
- **Under the VMS boards tab's head** (`#pane-vms`): the boards alone.

Each pin carries its number and label; tap a pin to navigate; pinch, wheel, drag, + / − / Fit; a list under the map with
how each position is known and a Navigate link; references with no position listed as such ("pin it on the page to put it
on the map"). The card is put back whenever the pane redraws (a MutationObserver on the pane, because the explorer pane
redraws after its render returns). No position is guessed; the record is untouched; the crew card untouched.

## Files

- `patch_v1141.py` — requires live v11.40 by SHA-256; appends style and script before the last `</body>`; footer.
- `satmap1141.js` — the engine (`window.SatMap1141`: MOUNTS, boards, generators, maps, setZoom, fit, tiles, satZoom, pct).
- `tests/test_v1141.cjs` — desktop and phone: the card under the explorer with 28 boards (the seven off the sheet with
  positions) and 14 generators (13 placed, GN25 listed without a position), both renders wrapped, pins, colours, labels,
  list and links, the filter, Esri tiles, zoom and Fit, the map really drawing (brightness clip), the boards-only map under
  the VMS boards tab's head; record unchanged, no errors, no writes. Screenshots at fit, at GN23 (6400%) and the VMS tab.

## Checks

- Dry build on a scratch copy of live v11.40, scrubbed as the build is, then the real build from live: byte for byte the
  same (`7a7255c8…`).
- `tests/test_v1141.cjs`: 10/10 desktop and phone on the build; 10/10 desktop and phone on live.
- Regressions on the build: v11.40 (VMS map) 11/11; v11.32 11/12 (its three-mornings check, superseded since v11.39).
  Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 console, 0 writes blocked.
