# Record operation, 15 Oct 2026: what the delivery dockets and the latest Baseplan settle

Author: Andrew Fisher · 15 Oct 2026

Status: **APPLIED and VERIFIED on the live record, 15 Oct 2026 15:49 AEST — record version 6469 → 6498, 29 documents
written, every other document unchanged in value.** Report `report_20261015T054922Z.json` (key redacted); backup of the
whole record before, `backup_state_20261015T054922Z.json`, beside it. Andrew, 15 Oct 2026 about 15:50 AEST in
Claude's chat: "fix anything that is relevant to truth please … we have all the data we need. true fact".

## What was written, and why

Each change rests on the branch's own delivery docket (the Delivery Dockets sheet of the Baseplan export of 15 Oct,
sha256 `ba246d4a…`) or on the contract line of the same export. The page's own controls did the writing
(`dockets_fill.cjs`, spec `fill_spec.json`): the drawer's number rule (`numberPutOn` after the clash check,
`numberTakeOff` with a tombstone so an older copy cannot put the number back), the drawer's accessory Edit and Save,
`setLight`, and the Questions note field (`setQAnswer`).

| Reference | Change | Evidence |
|---|---|---|
| HRP | 1189410 off | Docket 26085104 delivered 1189410 on 17 Sep as "P36 Portable Building Shell". It showed on HRP through an old contract join. |
| P36 | 1282487 off, 1327222 off, **1189410 on** | 1282487 is P63's planned shell (Baseplan line 121, still Pending); 1327222 is P66's shell (docket 26126001, 14 Oct); 1189410 is P36's. |
| P06 | 1097453 off, **1087453 on** | Baseplan line 64 and docket 26094121 (30 Sep) carry 1087453 for P06; the schedule wrote 1097453 for the same building. |
| GN06 | 1283681 off | The 15 Oct export carries 1283681 as a spare generator; GN06 is 1320828, confirmed on site this morning. |
| P66 | fridge 131190 → 1311990 | A dropped digit; docket 26126001 and Baseplan line 115. |
| P33 | fridge 1238952 → 1328952 | Digits in the wrong order; docket 26064103 and Baseplan line 26. |
| WB06 | light on site | Three Armorzone dockets dated 15 Oct (26126575, 26126597, 26126606) to Gold Coast Hwy, Main Beach. Not ticked complete. |
| Question TX03 | note | P20 is one building, 1097339, docket 26076698, 17 Sep 13:01; P21 is one building, 1327220, docket 26076820, 17 Sep 12:29. The second load link on each is superseded. |
| Question R10 | note | Contract 9968929 books the office and lunchroom pick-up for 13 Nov; Schedule 9 Demob Week 3 still shows 12 Nov. Pick-up: 13 Nov. |

## What the dry run showed, so it was left alone

- **WC07's twenty Coates toilets are already on the page** through the contract lines (the page reads delivered
  contract lines by number). One of the twenty reads 1317743 on the contract line and 1317643 on the docket; the
  contract line stands until the plate is read.
- **The fridges for P01, P03, P04 and P05 are already on the page** the same way; so are the numbers the morning
  review listed as fill candidates.
- **LT01–LT04** are not references the page can take a number on (no schedule row); the four towers delivered to the
  Molendinar council yard on 11 Sep stay on their contract lines, which the v10.26 page carries with their rates.
- **P10, P11, P13, P14, P36, P37, HRP, T0243** already read on site on the page (a complete tick means on the ground);
  nothing to set.
- **P46 1327213, P27 1097343, P53 1327222** do not show on those references on the page; nothing to take off.
- **CP1's fridge and urn, P09's auto boil, GN23's distribution board**: their contract lines now carry the numbers; the
  drawer would have added a second row beside the schedule's unnumbered one, so nothing was added.

## Checks

| Check | Result |
|---|---|
| Dry run through the harness, every write aborted | passed: 12 ops staged, 29 documents would be sent, 0 page errors |
| Apply: public page sha256 equal to the reviewed `66878d12…` | yes |
| Startup queue | clear |
| Writes allowed through the gate | exactly the 29 planned, once each, all acknowledged 200 |
| Service after: every op holds; other documents unchanged in value | yes |
