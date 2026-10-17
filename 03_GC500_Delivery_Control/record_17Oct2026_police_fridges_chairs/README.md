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

## Not done

- **1129733 and 1157786** ("Came in Today"). Neither number is anywhere on the record, the Baseplan exports, Schedule 9
  or the register, and nothing says what they are or which reference they belong to. Waiting on Andrew.
