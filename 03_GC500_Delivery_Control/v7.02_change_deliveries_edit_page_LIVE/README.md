# v7.02: Change deliveries (the Edit page) + 3D status box fix (LIVE)

Author: Andrew Fisher

**Change deliveries** opens from the Edit tile on the Day documents plate, from Tools and from the Edit page.
- Pick a type, then its reference.
- Change the due-in or due-out day, with "back to the plan day".
- Asset numbers use a clash rule: a number already on another reference is refused, with "Move it" to shift it in one step.
- The description and "where it goes" can be edited.
- Pin it on the map by tapping the Map explorer.
- New references are added with the next free number suggested.
- "Changes on this day" shows who changed what and when, with Put back.
- Everything goes through the one shared record, so the Timeline, the truck lines, the pre-start, the print-outs, the
  register, the drawer and the map follow within seconds on every phone.
- A view link can look but not change anything.

**3D (v7.14b):** the status box fades after 2.5 s, and any tap closes it. 3D stays on Auto unless Ultra is pressed.

**LIVE: 27 Sep 2026, 23:13 AEST.**
- Page (v7.12 + `patch_v702.py` + `patch_v702_plate.py`), machine-set files `explorer/explorer-merge.js` (a 3-way merge
  of the Map speed build and the v7.02 pick block) and `poc3d/index.html`.
- Machine set 09fd8459ad33 (219 files). Everything was verified byte for byte on the view link.
- Tests: `test702` 41/41 on phone and desktop with the merged explorer; the Map explorer checks pass; the 3D status box
  closes on tap; quality stays on Auto; no errors.
