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

## P47 deleted too · 07:33 AEST · record 9602 → 9607, VERIFIED

Andrew, 17 Oct 2026: "Yes correct cancel p47" and "Make sure these numbers dont pop up again and cause confusion".

- P47 (QPS Amenities Crib Room) was cancelled on the page by Andrew on 6 Oct at 12:27, "No longer needed". That
  morning he had said: "P47 is cancelled … p46. Then p51 then p08".
- Its only number, 1327217, is P65's building: Baseplan 9968862 line 110, P65, Delivered. P65 is on site with
  Andrew's passenger door side.
- It was deleted the same way as the others (`remove_p47_spec.json`). Backup `backup_state_20261016T213344Z.json`;
  5 PUTs, all 200; report `report_20261016T213344Z.json`. The money is unchanged (tested in page memory first).

## The numbers no longer pop up anywhere else (live page, all 24 tabs plus the P65, P66, P18 and P36 drawers)

- P27, P29, P47 and P53 show nowhere.
- 1327217 shows only on P65 (hire line 110, $1,426.07).
- 1327222 shows only on P66 (line 113, $1,426.07).
- 1097343 shows only on P18 (line 36, $1,125.84).
- The deletion tombstones travel on every copy of the record. A schedule or Baseplan refresh that still lists these
  references is filtered out by the page's own deleted-asset rule, so they cannot come back.


## T0265 deleted · 08:42 AEST · record 9607 → 9612, VERIFIED

Andrew, 17 Oct 2026: "t0265 we spoke about this and where. fridges are".

- Andrew, 15 Oct 2026: "to265 was cancelled  fridges 1311992 and 1283996 can we add these to P46". Both fridges are on
  P46 as fridge accessories (`record_15Oct2026_p46_fridges/`), and they stay there.
- T0265's other two numbers, 1318501 and 1260164, are on no Baseplan (5) line, no docket, no building and no other paper.
  They were only on T0265's own unit records from 14 Oct, so they go with it.
- Deleted the same way (`remove_t0265_spec.json`): 5 PUTs, all 200; backup `backup_state_20261016T224210Z.json`;
  report `report_20261016T224210Z.json`. Tested in page memory first: every charge unchanged (labour $74,374.67,
  contracts $254,985.83, delivery $123,960.34, buildings $149,017.32), and P46 keeps both fridges.

## WC32 and T0019 deleted · 08:46 AEST · record 9612 → 9622, VERIFIED

Andrew, 17 Oct 2026: "yes delete".

- WC32 (Toilets) was cancelled on 3 Oct at 20:11 on Andrew's word ("wc32 is cancelled"), and the customer's 2 Oct master
  plan dropped it too.
- T0019 (Generator 200 kVA) was taken off its day on 14 Sep and replaced by GN20 (1276701).
- Neither had a number.
- Spec `remove_wc32_t0019_spec.json`: 10 PUTs, all 200; backup `backup_state_20261016T224602Z.json`; report
  `report_20261016T224602Z.json`. The money is unchanged (tested in page memory), and 1276701 stays on GN20.
- Nothing on the page is marked cancelled any more.
