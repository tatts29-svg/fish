# v11.48 — The Event nights and Change deliveries pages set aside

Author: Andrew Fisher. Built on live v11.47 `beb194dd…`. LIVE 23 Oct 2026 10:47 AEST, page `d87a23c8…` (21,397,158 bytes;
full hash in STATUS.md).

## Andrew's words, 23 Oct 2026

"can we remove event night we dont need as we have the servicing tab now"; "can we also remove change deliveries Tab we
dont need any more".

## What changes

- Both names go into `TABS_OFF`, the page's own set-aside set (v5.91, as Register and Journal): off the tab strip and the
  More menu; a link to either lands on Today and says "The … page has been set aside"; the `#print/nights/<date>` route
  with it. The panes, their code and the records are untouched, so taking a name out of the set puts the page back exactly
  as it was.
- The Build day card's "Edit · Change deliveries" tile and the Edit pane's "Add a reference" / "Change deliveries by day"
  buttons are hidden while Change deliveries is set aside (the Add page has landed on Change deliveries since v7.02, so
  adding a reference or swapping a number on a location through the page waits on the name coming out of the set).
- The servicing tracker panel and its publish fold are on the Servicing tab (v10.84): the trackers and their printed codes
  are unaffected.

## Files

- `patch_v1148.py` — requires live v11.47 by SHA-256; the set, the tile, the two buttons; footer.
- `tests/test_v1148.cjs` — desktop and phone: both names in the set and still in TABS; no button for either anywhere in the
  navigation, Servicing and VMS boards still offered; a link to each lands on Today with the notice; the print link too;
  the Build day cards without the tile; the Servicing tab with its heading, the tracker panel and the publish code; VMS
  removals still opens; record unchanged, no errors, no writes.

## Checks

- Dry build on a copy of live v11.47, scrubbed as the build is, check_page PASS; the real build from live byte for byte the
  same (`d87a23c8…`).
- `tests/test_v1148.cjs`: 12/12 desktop and phone on the build; 12/12 desktop and phone on live.
- Regressions on the build: v11.46 11/11, v11.44 11/11, v11.35 8/9 desktop and phone (its one miss presses the Event
  nights print button, now set aside: superseded).
- Sweeps, desktop and phone: 27 tabs (19 shown: the two set aside join the six before), 7 hashes, Back, 0 errors, 0
  console, 0 writes blocked.
