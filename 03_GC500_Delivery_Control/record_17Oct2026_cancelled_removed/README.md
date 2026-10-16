# P27, P29 and P53 removed: cancelled references deleted for good

Author: Andrew Fisher · 17 Oct 2026, 07:25 AEST · record 9587 → 9602, VERIFIED

Andrew, 17 Oct 2026, in chat: "Were these cancelled please check P27, P29, P53", then "If they are cancelled remove
records of them please".

## They were cancelled

| Ref | What | Cancelled | Never came |
|---|---|---|---|
| P27 | Volunteer and Cadet Supervisors, Building 4.8m | Andrew, 15 Sep 2026: "P27 and P29, due the next day, are cancelled and no longer needed" (the page's committed cancellations, in every build since 25 Sep). The customer's iEDM programme also marks it "NOT IN COATES SCOPE". | No number, light, tick, photo or docket. Baseplan never had a P27 line. Its planned 1097343 came as P18 (docket 26076747, 16 Sep). |
| P29 | SCA Stewards, Building 6m | The same 15 Sep words. iEDM: "NOT IN COATES SCOPE". | Nothing on the record at all. No Baseplan line, no docket, no number. |
| P53 | Accred Centre, Building 6m | Cancelled on the page by Andrew, 29 Sep 2026 04:40: "Customer cancelled". Its number 1327222 was taken off the same day. | 1327222 went to P66 (docket 26126001, 14 Oct). Schedule 9's 15 Oct "Fridge Lge" row on P53 reads "inside Thursday building"; P62, in that Thursday, carries Andrew's fridge 1254221. |

P27 had been put back on its day on the page at 07:11 on 17 Oct. That was before Andrew's message asking for cancelled
references to be removed.

## What was done

- Each reference was deleted through the page's own Delete for good (`deleteAsset`), with the reason. The page's
  own words for it: "off the register, the map, the timeline, every count, the costs, the drop sheets and the exports
  — on every copy of the record … There is no put-back." The Journal keeps one line for each.
- First, a dry run (read-only) of 15 documents, all of them tombstones, notes and their stamps.
- Then the apply: whole-record backup `backup_state_20261016T212507Z.json`; public page sha `03ebb3cc…` (v10.56)
  checked; 15 PUTs, all 200.
- A fresh read showed every deletion holds and every other document unchanged in value. Report:
  `report_20261016T212507Z.json`.
- The runner (`remove.cjs`) is the door-sides runner with an `asset_delete` op added.

## Read back on the live page (desktop and phone)

- P27, P29 and P53 are gone. References: 187 → 184. None of the three shows on Equipment, Timeline, Map, Today or
  Costs.
- The money is unchanged: labour $74,374.67, contracts $254,985.83, delivery $123,960.34, buildings $149,017.32.
  Site vs Baseplan still lists P06 only.
- No page errors.

P47 is not part of this. Andrew says it is on site, and it is being checked separately against P65.
