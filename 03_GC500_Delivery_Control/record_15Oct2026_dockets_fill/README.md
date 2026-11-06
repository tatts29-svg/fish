# Record operation, 15 Oct 2026: what the delivery dockets and the latest Baseplan settle

Author: Andrew Fisher · 15 Oct 2026

Status: **APPLIED and VERIFIED on the live record in three passes** — 15:49 AEST, record 6469 → 6498, 29 documents
(`report_20261015T054922Z.json`); 16:03, 6501 → 6503, the two fridge numbers again after another open copy of the page
wrote the old ones back (`report_20261015T060324Z.json`, spec `fill_spec_fridges_again.json`); 16:48, 6503 → 6562,
59 documents: the questions answered from the data and three toilet identities (`report_20261015T064831Z.json`, spec
`fill_spec_questions.json`). Every other document unchanged in value each time; a backup of the whole record before
each pass sits beside the runner, key redacted from every report. Andrew, 15 Oct 2026 about 15:50 AEST in
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

**Reversed 17 Oct 2026 (HRP and P36 rows):** Andrew's site record has HRP = 1189410 and P36 = 1282487 (his loading of 10 Oct and his photos of 18 and 25 Sep), and his site record outranks the docket. Both numbers were put back; see `../record_17Oct2026_hrp_p36_numbers/`. 1327222 stays off P36.

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

## Third pass, 16:48 — the questions, worked out from what we hold

Andrew, 15 Oct about 16:30 AEST: "You have all the data, you are the brains, I need you to work it out." Each question
got a dated note through the page's own note field (`setQAnswer`), read off the record, the 15 Oct Baseplan export,
Schedule 9, Advanced's weekly approval sheets and the 2026 card as the page holds them. Where a source is silent the
note says the rule applied until a person says otherwise.

| Question | The answer written |
|---|---|
| Advanced's accepted quote | None exists, none needed: paid on measured dockets at the approval-sheet rates, a purchase order a week (4647508, 4647509, 4647517, 4647515, 4647519). |
| Customer rate for "team leader" | No separate line: the customer pays fencing per metre at the card and event people at the Labour Scope roles; Advanced's $200/day is inside our weekly cost. |
| Fencing 6 lines short | Line by line: bracing booked under Clean as components; relocation on the green notes as hours; removal still to do by programme; gates on Advanced's week 2 sheet (33 vehicle, 3 pedestrian) and the rest CON WK1 / Event Week; flat-feet CCB 42 of 45 done, 121 m is Event Week. |
| Closure marks | Working rule: a window is closed at its start and clear by its end; two marks with one order number are the two ends of one section; the colour is the crew. |
| Labour cost basis | Kyle Gover and Daniel Gough at the Job Connect purchase orders; the six Coates staff on salary (a payroll figure the 30 Sep review left blank); Kyle's records without hours are shifts from 15 Oct on. |
| Alfie's nights | $223.63 ex GST, his own rate on the record for 14–17 Sep and 6–9 Oct; planned at that until invoiced. |
| Locations short | WC09 asks 10 on Andrew's word of 14 Oct (6 to come); WC30 asks 8 for 19 Oct and 4 arrived today. Not errors. |
| R26 generator 028 | An off-site reference note on D024, not a position; the only 028 drawn is building 028 (P28) on D022. Nothing to supply. |
| R29 S04 compound | 36546 22.5 m + 36589 15 m + the bridge run 36565 25 m + bracing 36581 cover the 41 m; no gate docketed at S04, so it stays on the event-week list. |
| R30 VMS plan | Settled by what was issued: the 15 Oct VMS plan pack follows VMS001-26003-01; D025's bubbles are not used; 22 boards; charges unchanged. |
| CCB 36595 | Demarcation (rear of S20 shower, Advanced's demarcation column); customer rate $13.08/m. |
| No-rate lines | STPS shade cloth = scrim at $25.53/m when docketed; KINP "Shop Front - Shut Down" is a fit-out of container 1257261 at T0023, no separate hire rate; NVAC board and cable sit inside the generator card rate, the spare and the tyne rotator are Pending with no charge unless called off. |

Identities: WC51's accessible toilet 1197174, WC09's two toilet blocks 1268858 and 1311146 were typed as plain numbers,
so the page counted them as FWF toilets; each came off as a plain number and went on again as the unit it is (the
drawer's unit record, Coates-owned). P63, P65, P66 and WC31 were already identified on the record.

Not done: T0265 is cancelled (Andrew, 14:15) but still on the register with two fridge units, 1260164 and 1318501;
deleting a reference is permanent and is the Delete button's job, so it waits for Andrew. HRP has no Coates docket
with a number: 1282487 (the schedule's) was the planned P63 shell, so HRP's number is genuinely unknown.

## After v10.26 goes live: `fill_spec_after_upload.json`

On v10.26 the Baseplan lines 110, 113 and 121 (Delivered, 1327217, 1327222, 960719) join P65, P66 and P63 and carry
those numbers as the units, so the hand-made unit records for the same numbers read as duplicates ("Duplicate physical
identity"). Once the page is live, this spec sets those three unit records aside (archived, who and when) and the
line's own row stands, as it does for P52 and WC07. Applied 18:00 AEST once v10.28 was live: dry run against the live page passed, then record 6562 → 6568 (6 documents),
each reference left with its one row from the contract line; report `report_20261015T075947Z.json`.

## Checks

| Check | Result |
|---|---|
| Dry run through the harness, every write aborted | passed: 12 ops staged, 29 documents would be sent, 0 page errors |
| Apply: public page sha256 equal to the reviewed `66878d12…` | yes |
| Startup queue | clear |
| Writes allowed through the gate | exactly the 29 planned, once each, all acknowledged 200 |
| Service after: every op holds; other documents unchanged in value | yes |
| Third pass dry run (four rounds, every write aborted) | passed: 24 ops staged, 59 documents, including the drawer's own removal of two emptied number documents |
| Third pass apply | 59 writes allowed once each, acknowledged; verified on the service; other documents unchanged in value |
