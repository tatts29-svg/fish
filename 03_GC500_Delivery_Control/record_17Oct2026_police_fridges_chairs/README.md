# Police fridges onto P26 and P28; the chairs (P34) on site

Author: Andrew Fisher · 17 Oct 2026, 12:13 AEST · record 9638 → 9667, VERIFIED

Andrew, 17 Oct 2026: "Need to fix this up" with a note:

- "1311992 - These were for the Police"
- "1283996 - These were for the Police"
- "1129733 - Came in Today"
- "1157786 - Came in Today"
- "The ones for police can go in 2 story building are P26 & P28"
- "Also the swivel chairs turned up on the correct day. So did the fridges"

## What the record held

- 1311992 and 1283996 came on 14 Oct with T0265's four fridges. On 15 Oct Andrew asked for them to go on P46 (QPS
  Command Post), and they were attached there as Fridge accessories (`record_15Oct2026_p46_fridges/`).
- **P26** and **P28** are the schedule's two "Fridge Delivery" lines (Fridge Lge, T0125 and T0126, customer scars),
  due 14 Oct (Schedule 9, 15 Oct, moved them from 16 Oct). Both were still "not on site".
- **P34** is "Chair Delivery" (Pad Chair × 2, T0127), due 14 Oct, still "not on site". These are the chairs Andrew
  calls swivel chairs.
- The 14 Oct Build card read 11 / 16 received, with FR01, FR02, P26, P28 and P34 "Receipt incomplete".

## What was done (`police.cjs`, spec `police_spec.json`)

Through the page's own controls on the edit link:

| Ref | Change |
|---|---|
| P46 | Fridge 1311992 and Fridge 1283996 taken off with the drawer's Take off button (Put back is under the list). Air conditioners 1327959 and 1327960 stay. |
| P26 | Number 1311992 on; description "Fridge · Police 2-storey building" (the schedule's "Fridge Delivery" kept beside it); light on site; note. |
| P28 | Number 1283996 on; the same description; light on site; note. |
| P34 | Light on site; note ("the swivel chairs turned up on the correct day"; the schedule calls them Pad Chair × 2). |

- 1311992 → P26 and 1283996 → P28 follow the order Andrew wrote them in. They are the same kind of fridge on the same
  delivery. If it is the other way round, swap the two numbers.
- Each note says the item came on 14 Oct, the day it was due, and was recorded on site 17 Oct.
- The page stamps a light at the moment it is set, so these read as recorded on 17 Oct. Putting them on the 14 Oct
  card needs the "arrived on" day in v10.59. A second small record step sets it once v10.59 is live.
- Runner copied from `record_17Oct2026_cancelled_removed/remove.cjs`, with three more ops: `acc_off` (the drawer's
  Take off), `note` (setDeliveryNote) and `desc` (setDesc).
- Dry run first: 12 ops, 29 documents, no page errors. Apply: backup `backup_state_20261017T021317Z.json`; 29 PUTs,
  all 200; every op read back on the service; every other document unchanged in value; report
  `report_20261017T021317Z.json`. No key in any file.

## Second step, 12:32 AEST · record 9667 → 9690, VERIFIED (`police2_spec.json`)

Asked where 1129733 and 1157786 belonged, Andrew said: "So the 4 that were for police 2 went to p46 then 2 went to
p26 and p28 and ilve been told amd the 2 that you mentioed are for broadcast".

- T0265's 14 Oct delivery was four fridges: 1318501, 1260164, 1283996 and 1311992. All four were for the police.
  1311992 and 1283996 are on P26 and P28 (step one), so the two on P46 are **1318501 and 1260164**. This morning's
  broadcast record (`record_17Oct2026_broadcast_fridges/`) had put those two on FR01 and FR02. That was wrong.
- The broadcast fridges are the two that came in today, **1129733** and **1157786**.

| Ref | Change |
|---|---|
| FR01 | 1318501 off; 1129733 on; note rewritten (came in 17 Oct; the correction and why) |
| FR02 | 1260164 off; 1157786 on; note rewritten |
| P46 | Fridge 1318501 and Fridge 1260164 attached through the drawer's Accessories form, each described "Police fridge, from T0265's 14 Oct delivery". P46 now carries air conditioners 1327959 and 1327960 and fridges 1318501 and 1260164. |

- 1129733 → FR01 and 1157786 → FR02 follow the order Andrew wrote them in (two identical broadcast fridges).
- FR01 and FR02 really did arrive on 17 Oct, so their light time stands. Only P26, P28 and P34 get the 14 Oct
  arrival day in v10.59.
- Dry run first: 8 ops, 23 documents, no page errors. Apply: backup `backup_state_20261017T023200Z.json`; 23 PUTs, all
  200; every op read back on the service; every other document unchanged; report `report_20261017T023200Z.json`.

## Third step, 12:37 AEST · record 9690 → 9693, VERIFIED (`police3_spec.json`)

Andrew, 17 Oct 2026: "What dates they should of had turn up. Have it as those dates".

- **FR01 and FR02** were given 14 Oct as their plan day this morning, on the wrong reading that they were T0265's.
  They carry 1129733 and 1157786, which came in on 17 Oct, and they have no schedule line. Their due-in day is now
  **17 Oct**, through the drawer's own date field (`setDate`; the 14 Oct plan day stays beside it, with who moved it
  and when). They no longer sit on the 14 Oct card.
- **P26, P28 and P34** were due 14 Oct and came that day. Their 14 Oct arrival goes in with v10.59's arrived-on day,
  once v10.59 is live (the page cannot back-date a light).
- **The runner learned one thing:** on the edit link, the page lists a reference's accessories with new rows ahead of
  taken-off ones, so after step two it rewrites `accessories/P46` in that order on load. The spec names that document
  in `reorderOk`, and the runner accepts it only when the rows are the same as on the service. It went out with the
  date writes, and the report confirms the same nine rows. Nothing else is loosened.
- 3 documents (delivery/FR01, delivery/FR02, accessories/P46), all 200, read back; every other document unchanged;
  report `report_20261017T023727Z.json`, backup `backup_state_20261017T023727Z.json`.
