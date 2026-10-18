# Broadcast fridges: FR01 (1318501) and FR02 (1260164), TV compound

Author: Andrew Fisher · 17 Oct 2026, 08:48 AEST · record 9622 → 9636, VERIFIED

Andrew, 17 Oct 2026: "the other 2 fridges are for broadcast" (correcting "toilets" to "fridges").

- T0265 (Fridge × 4) was recorded as arrived on 14 Oct with 1318501, 1260164, 1283996 and 1311992
  (`record_14Oct2026_fridges/`).
- Andrew, 15 Oct: "to265 was cancelled  fridges 1311992 and 1283996 can we add these to P46". Those two are on P46.
- T0265 was deleted for good this morning (`record_17Oct2026_cancelled_removed/`). The other two fridges belong to the
  broadcast compound.
- The broadcast compound's gear has its own references: FL03, FL04 and TM01, all "TV compound (broadcast)", added on 16
  Oct. The fridges get the same treatment, one reference per fridge (as FL03/FL04), through the Add tab's own
  `addReference`:

| Ref | Trade · type | Number | Location | Plan / in day | Light |
|---|---|---|---|---|---|
| FR01 | Furniture · Fridge | 1318501 | TV compound | 14 Oct | on site |
| FR02 | Furniture · Fridge | 1260164 | TV compound | 14 Oct | on site |

- Branch KINP. Each has a note giving the history above. Nothing is ticked complete.
- The page can only stamp the light at the moment it is set (17 Oct). The plan and in day is 14 Oct, the day they
  came, and the note says so.
- Tested in page memory first: each number shows only on its own reference. The card hire is $46.84 each, a comparison
  figure; labour, contracts, delivery and buildings totals are unchanged.
- Runner `fridges_arrived.cjs`, copied from `record_16Oct2026_broadcast_kit/kit_arrived.cjs`, with two changes:
  - a per-row in day;
  - a number left on a reference deleted for good counts as free. T0265's archived-by-deletion unit records still
    name these numbers, but the page shows them nowhere.
- Dry run first: 14 documents. Then the apply: backup `backup_state_20261016T224826Z.json`; 14 PUTs, all 200; read-back
  verified; report `report_20261016T224826Z.json`.
