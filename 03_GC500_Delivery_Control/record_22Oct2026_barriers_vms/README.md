# Record: water barriers WB17 and WB18 on site and complete; VMS21 in place and complete

Author: Andrew Fisher. Applied 22 Oct 2026 08:08 AEST on the live v11.11 page (`9aee0e49…`), record version 10484 → 10489,
by Andrew Fisher via Claude. Backup of the whole record before: `backup_state_20261021T220814Z.json`. Report:
`report_20261021T220814Z.json`.

Andrew, 22 Oct 2026: "Barriers all done"; "We mention vms boards there is 24 in total everyone is towed around the track
and set to location. So we talk as in everything is done so we dont need to revisit this again."

## What the record said before

| Reference | Before | Why Today read short |
|---|---|---|
| WB17 Racing kerbs (T6/7/8/9), 6 × TL2 | not on site since 3 Oct | Water barriers 303 of 311 |
| WB18 Racing kerbs (T2), 2 × TL2 | not on site since 3 Oct | Water barriers 303 of 311 |
| VMS21 (plan position 21, contract 9961265 line 28) | arrival of 21 Oct withdrawn to "not confirmed" the same day | VMS boards 23 of 24 |

## What was done, through the page's own controls

`barriers.cjs` (the record runner, from `record_21Oct2026_access_plant/plant.cjs`, with two new ops for the VMS plan):

- WB17, WB18: the delivery light to **on site** (`setLight`), then **Complete** (`setDone`), as an editor pressing them.
  The light is dated when pressed; no arrival day is invented.
- VMS21: the VMS plan's own **in-place tick** (`VMS1024.write(pos, {inPlace:true})`, which writes the arrival "on site"
  dated today through `VMSArrival1098.prepare`), then the **complete tick** (`VMSArrival1098.setComplete`). The Today
  VMS count reads exactly these records.

Dry run first (read-only, every write aborted): Today groups after the stage buildings 52/52, toilets 265/265, barriers
311/311, generators 14/14, lighting 6/6, VMS 24/24, equipment 12/12. Then `--apply` with the public page's SHA-256
checked, the startup queue clear, exactly the five planned documents allowed through once each (`delivery/WB17`,
`delivery/WB18`, `loads/vms1024/21` and its two audit documents), every other document verified unchanged in value, and
every op verified on the service.

## Result

Today: every equipment group at 100%. The race-day broadcast (v11.12) speaks the same: 311 barriers every one placed,
24 boards every one towed and set.
