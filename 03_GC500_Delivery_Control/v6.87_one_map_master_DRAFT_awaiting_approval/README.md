# v6.87 — DRAFT, not live: one map, the master (Andrew, 27 Sep 2026)

Author: Andrew Fisher

Built from v6.84 + `patch_v685.py` + `patch_v686.py` + `patch_v687.py`. Tested on the local copy only; it goes live on Andrew's yes.

## What it does
- **The Map tab opens on "Master plan"** (D001-26003-03) with 201 markers:
  - 139 units on the unit;
  - 23 area-only lines, drawn dashed (water barriers, plant, pit garage toilets);
  - 19 VMS boards from D025, moved onto the master (that sheet is drawn 44 points to the side), at their traced arrow tips where traced;
  - the 20 stand numbers.
- **Trade chips** show one trade at a time: buildings, toilets, generators, lights, barriers and so on.
- **Stand chips S01–S25**, or pressing a stand number on the map, circle every unit in that stand (e.g. S11 circles 15). They combine with the trade chips.
- **"VMS boards"** shows just the boards.
- **The separate drawings** are off the Map tab's buttons. They stay in Documents, and a search for a callout that is only on one of them still opens that sheet.
- **Search and "show on map"** go to the master and ring the unit.
- **Drawer:** the two master pictures (close up, and the area), then thumbnails of one site photograph and one aerial where they were taken. Where there are none, the stock picture of the product.

## Checks (local)
- Deep data audit shows no issues; 68 running-sheet days are clean.
- Navigation is clean on desktop and phone.
- Accessibility is clean.
- Map test on the master: it opens, zooms, searches and shows on map.
  - First zoom has one slow frame with 201 markers; the rest is smooth.

Screenshots: `A_master_all.png`, `B_stand_S11.png`, `C_toilets.png`, `D_P01_phone.png`.
