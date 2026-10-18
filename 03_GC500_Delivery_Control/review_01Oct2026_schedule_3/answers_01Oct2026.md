# Schedule 3 open items — what the evidence settles, 1 Oct 2026

Author: Andrew Fisher · 1 Oct 2026, 15:35 AEST · read only: nothing on the page, the record or the repo was changed by this
read. Andrew, 15:00: "need you both to look at the questions and answer as much as you can … surely you both can clean
up a lot of this." This answers the thirteen asset-number cells and five quantity/date rows left open in `README.md`
§2–3, from the evidence in the repo. Codex is asked to check it the same way (PR #1).

**Of the thirteen asset-number cells and five quantity/date rows, nine are settled by the paper, three are likely with
one look to confirm, and four genuinely need Andrew (a plate or a yes/no).**

## What was read, and how it ranks

| Source | File | Carries |
|---|---|---|
| Baseplan export 1 Oct 14:50 | `../v7.66_rehire_by_branch_LIVE/sources/Baseplan_SuperCars_2026-10-01_1450.xlsx` (308 lines, 10 sheets, 70 columns) | per line: Status, **Item** (plant number / MISCITEM / SUB-xxxx), Description (reference prefix + size), Quantity, Rate 1, Sales Analysis Code, Supplier Sub Rental, Start Date, **Delivery Number** (the DD docket), Memo, **Serial Number**, Rate ID. Identical in every field to the earlier 1 Oct export in `../v7.61_accruals_for_finance_LIVE/sources/` |
| Record as read (v3406) | `record_as_read.json` | numbers and events |
| Schedule 3 / 2 rows | `schedule_3_rows_as_read.json`, `../review_01Oct2026_schedule_2_transport/schedule_2_rows_as_read.json` | cells incl. DD |
| Andrew's on-site pins (GPS fixes keyed reference/unit, who, when) | `../record_29Sep2026_master_plan_positions/pins_before.json` (`fixes`, `by`, `stamps`) | which unit the page held when Andrew stood at it |
| Drop photographs keyed reference · asset · place, upload time | `../v7.41_photos_stick_LIVE/evidence/uploads_vs_record_29Sep2026.md` | same |
| READMEs recording Andrew's words / record history | `../v7.35_…/README.md`, `../v7.33_…/README.md`, `../v7.27_…/README.md` (contract labels crossed at WC06), `../v7.23_…/handover_questions_review_28Sep2026.md`, `../v6.89_…/RELEASE.md`, `../questions_01Oct2026_decision_sheet/README.md` | — |
| Older page data | `../v6.01_v6.10_banner_and_look/ops_layer.json.v601`, `../satellite_explorer/explorer/assets/register.json`, `../v6.96_…/explorer/assets/plan_items.json` | scheduled vs supplied numbers before site corrections |

Ranking, strongest first: (1) a number Andrew put on a reference **on site** then pinned or photographed against on
later days; (2) a Baseplan line **Delivered with a docket that the workbook's own DD cell also carries**; (3) a Pending
Baseplan line; (4) a workbook cell alone. Caution: Baseplan labels have been crossed before (v7.27: 9968955 bills WC06
for 1212502/1058086, which are at WC04/WC02).

Docket dating: 26064xxx = 14 Sep, 26076xxx = 16 Sep, 26077xxx = 17 Sep, 26081xxx = 21 Sep, 26083924 = 17 Sep, 26088xxx
= 23 Sep, 26098710 = 28 Sep, 26102–26103xxx = 30 Sep. Dockets raised 1 Oct (WC60's, P46's 26106162, the forklift's
26109954) are **not** in this export.

---

## 1. P44 / P58 — 1273656 and 198481

**Evidence**
- Baseplan 9968862-KINP **line 59**: 1273656, "P44 Portable Building Shell 6.0M x 3.0M - Cyclonic Rated", Delivered, 23 Sep, **DD 26088630**, serial 6175. **Line 61**: 198481, "P58 Portable Building Shell 6.0M x 3.0M", Delivered, 23 Sep, **DD 26088639**, serial 5539.
- Schedule 3 Week 4 row 12: P44 1273656, dd "not torren dd#26088630"; row 13: P58 198481, dd "not torren DD#26088639". Schedule 2 identical. Workbook = Baseplan, docket for docket.
- Record: P44 **198481** (T0050, dd 26088630), P58 **1273656** (T0051, dd 26088639) — same dockets, numbers the other way.
- Site history: pin `P58/u1273656` Andrew Fisher **24 Sep 08:45** (the morning after delivery — the page already held 1273656 on P58, against the schedule, so put on by hand). Pin `P44/u1273656` **25 Sep 07:07:00** (page still offered the schedule's number at P44); **56 s later** (07:07:56) the first P44 photographs were filed against **198481**, and at 07:11 P58's against **1273656**; again 29 Sep 04:17–04:19 (uploads table rows 95–98, 131–133). 28 Sep handover R03: "corrected P13/P15 and swapped P44/P58" — the same site pass whose P13/P15 correction Baseplan's dockets prove right. `ops_layer.json.v601` (25 Sep): both still "from the schedule", supplied [].
- P44 and P58 are adjacent on the plan, both 6 m, both landed 23 Sep on two trucks (KEV, SFL).

**Conclusion.** The record's pairing was made on site by Andrew on 24–25 Sep and photographed twice; the branch's lines carry the planned pairing with the dockets. Two drops swapped on the ground is the ordinary explanation — the branch's labels are crossed, as at WC06.
**Confidence: likely.**
**Action.** One look at P44's plate (or the P44 drawer photos of 25 Sep 07:07 / 29 Sep 04:17, taken against 198481). If 198481 is at P44: no record change; the branch swaps Item on lines 59/61; workbook Week 4 rows 12–13 take the record's numbers. If the plate reads 1273656: Change → Swap P44 ↔ P58 on the page.

## 2. P13 / P15 — 1097345, 1097346, "127579"

**Evidence**
- Baseplan **line 51**: 1097346, "P13 … 4.8M x 2.4M", Delivered 21 Sep, **DD 26081372**, serial 410141. **Line 55**: 1097345, "P15 … 4.8M x 2.4M", Delivered 21 Sep, **DD 26081392**, serial 410140.
- Schedule 3 Week 4 row 2: P13 "1097345 + TOILET", dd **26081372**; row 4: P15 "127579 + TOILET", dd **26081392** — the workbook's own dockets belong to 1097346 (P13) and 1097345 (P15).
- Record: P13 1097346 (T0041, dd 26081372), P15 1097345 (T0043, dd 26081392). Pins `P13/u1097346` 22 Sep 15:49, `P15/u1097345` 22 Sep 15:51 (Andrew); photographs P13 · 1097346 22 Sep 15:48 and 25 Sep 18:26, P15 · 1097345 25 Sep 18:27.
- "127579" is nowhere in Baseplan; a mis-key carried from Schedule 1 (also in `register.json` 25 Sep, `ops_layer.json.v601`).

**Conclusion.** Record right: P13 = 1097346, P15 = 1097345. **Settled.**
**Action.** Workbook Week 4 row 2 → 1097346, row 4 → 1097345. No record change.

## 3. P46 — 1322579 against 1327213 (also on P04)

**Evidence**
- Baseplan **line 7**: 1327213, "P04 … 12.0M x 3.0M - Cyclonic Rated", Delivered 14 Sep, **DD 26064087, serial 261179**. **Line 94**: 1327213, "P46 … 12.0M", **Pending, no docket, serial 261179** — the same unit cloned.
- Record: P04 1327213 (T0008, dd "D2D. DD#26064087"); P46 1327213 (T0086, 6 Oct). Pin `P04/u1327213` 22 Sep 09:24; photo P04 · 1327213 25 Sep 18:29.
- Schedule 3 Week 2 row 6: P46 **1322579**, dd **26106162**, SFL, 6 Oct (Schedule 2: 1327213, no docket).
- **Baseplan line 4**: **1322579**, "**P03** … 12.0M x 3.0M - Cyclonic Rated", **Delivered 14 Sep, DD 26064081, serial 7856.B120.3** (line 6, the P03 fridge 1328955, on the same docket).
- Record and workbook say P03 = **1327212** (Week 5 row 3: P03 1327212, dd "D2P. DD#26064081"); pin `P03/u1327212` 22 Sep 09:20; photo P03 · 1327212 25 Sep 18:30. **1327212 appears nowhere in Baseplan** (13272xx batch there: 1327211, 1327213, 1327215–1327228, serials 2611xx; 13225xx batch: 1322579, 1322583, serials 7856.B120.x). The pin and photos were filed against the number the page held (the schedule's) — they do not prove the plate.
- Docket 26106162 (1 Oct) is not in the export.

**Conclusion.** (a) **1327213 comes off P46** — P04's building, on site since 14 Sep; line 94 is a Pending copy. (b) **1322579 depends on P03's plate.** Baseplan ties 1322579 to P03 on the docket the workbook's P03 row carries. Plate 1322579 → P03's record number changes and the P46 cell cannot be 1322579. Plate 1327212 → line 4 is wrong, 1322579 is at the yard and goes to P46.
**Confidence:** (a) settled; (b) needs Andrew — P03's plate.
**Action.** Now: take 1327213 off P46. Then P03's plate: 1322579 → put it on P03 and ask the branch what is on DD 26106162 for P46; 1327212 → put 1322579 on P46 as planned and tell the branch line 4 is wrong.

## 4. HRP / P36 / P63 / P67 / P53 — 1282487, 1189410, 1327222

**Evidence**
- Baseplan 9968862-KINP: **line 93** 1189410, "P36 … 6.0M - Cyclonic Rated", **Delivered, DD 26085104** (raised ~22 Sep), serial 895; **line 108** 1189410, "P67 Commentary Booth 6.0M", **Pending, no docket, serial 895** (same unit); **line 121** 1282487, "P63 … 6.0M", **Pending, no docket**, serial J003219-19; **line 82** 1327222, "P53 … 6.0M - Cyclonic Rated", **Pending, no docket**, serial 261188 (line 84 P53 fridge Pending). **No HRP line exists** (no "Hire Republic"/"HRP"/"Crib" in any description or memo; the only unprefixed building line is 89, a 3.6 m shell 1268865).
- Record: HRP 1189410 (T0034, 17 Sep); P36 1327222 + 1282487 (T0232, 17 Sep); P63 none (build 15 Oct, demob 27 Oct); P67 none (build 14 Oct, demob 27 Oct); P53 **cancelled**, no number.
- Who put the site numbers on (`../v7.35_…/README.md`): "1282487 — recorded on site against P36 — Andrew Fisher; taken off P63 and HRP at 13:21 on 17 Sep, pinned at P36 on 21 Sep"; "1327222 — the schedule's P36 row (the schedule's P53 row has it too) — nobody typed it." Pin `HRP/u1189410` 22 Sep 15:39. Photos 18 Sep 10:01–10:03: HRP · 1189410, P36 · 1282487; again 25 Sep 18:22–18:23. `ops_layer.json.v601`: HRP scheduled [1282487] supplied [1189410]; P36 scheduled [1327222] supplied [1282487]. On 17 Sep two 6 m buildings landed (schedule: P36 "1st DD#26077026", HRP "2nd DD#26077039" — neither docket is in the export) and Andrew recorded on the day which was which, overriding the plan.
- Schedule 3: Week 5 rows 35–36 P36 1327222, HRP 1282487 (plan, unchanged since Schedule 1); Week 1 row 16 **P67 1189410** (14 Oct), row 22 **P63 1282487** (15 Oct); Week 3 row 14 P53 1327222 (29 Sep "Crane onsite"); Demob rows P63/P67 27 Oct, P53 30 Oct. **HRP and P36 have no demob row anywhere; P63 and P67 do.**
- Same shape a third time: **P41** 1189412, line 63 Delivered DD 26088652 serial 897, built 23 Sep, no demob row; **P65** line 110 "P65 Commentary Booth" 1189412 **Pending serial 897**, build 14 Oct, demob 27 Oct; record has 1189412 on both.
- Andrew 29 Sep (v7.35): "Bug with P53 … That number is used somewhere else now." / "That number belongs on P36." Decision sheet 30 Sep item 8 defaults the other way: "retire 1327222, keep 1282487". P53 was cancel:false on 26 Sep (`../v6.89_…/coverage_register_vs_drawings.json`), cancelled on the record by 29 Sep.

**Conclusion.** (1) **HRP = 1189410, P36 = 1282487 stand** (Andrew on site 17 Sep, photographed twice). Line 93 "P36" is charging HRP's building; P36's own 1282487 sits on the Pending "P63" line — never docketed. (2) **1327222 is not at P36**: its only line is Pending without a docket, P53 never arrived, nothing from site recorded it; Andrew's 29 Sep remark reads as the schedule's plan, his 17 Sep site entry says 1282487. (3) **P63 = 1282487 / P67 = 1189410 in the workbook are the branch's planned relocations** of the P36 and HRP crib rooms on 14/15 Oct, exactly as P41 → P65. Nothing to put on today (the page rightly blocks adding them elsewhere, v7.35). (4) **P53**: cancelled on the record, live in the workbook and on lines 82/84 — yes/no needed.
**Confidence:** (1)(2) likely — one look at P36's plate (or its drawer photos of 18/25 Sep, taken against 1282487); (3) likely; (4) needs Andrew.
**Action.** P36 → Change → Allocated asset numbers → take **1327222** off. HRP unchanged. Workbook rows 35–36 → P36 1282487, HRP 1189410. P63/P67 stay empty; on 14/15 Oct Change → Swap/move (1282487 → P63, 1189410 → P67, 1189412 → P65). Branch: no HRP line; line 121 is really P36 until 15 Oct; lines 108/110/121 are relocations. Andrew: P53 cancelled for good? Yes → clear Week 3 row 14 and Demob row 39, close lines 82/84. No → un-cancel on the page; 1327222 is its unit when it lands.

## 5. P27 — 1097343

Baseplan **line 36**: 1097343, "P18 … 4.8M x 2.4M", Delivered 16 Sep, **DD 26076747**; **no P27 line**. Schedule 3 Week 5 row 28: P18 1097343, load "3rd DD#26076747" (the workbook's own P18 row carries the docket); row 33: P27 1097343, "D2P Last", no docket. Record: P18 1097343 (T0029); P27 **cancelled** (v6.89, 26 Sep: "P27 and P29 are cancelled on the register"). Pin `P18/u1097343` 22 Sep 16:00.
**Settled.** Workbook row 33 cell to clear; no record change.

## 6. P53 — see section 4.

## 7. GN19 — 1261271

Baseplan 9961976-NVAC **line 7**: 1261271, "**GN19**-Generator - 60kVA (Diesel)", Pending, 19–26 Oct, Memo "GN01-", serial FGWPEP63KJS700359. **Line 16**: 1276507, "**GN01**-Generator - 60kVA (Diesel)", **Delivered 28 Sep, DD 26098710**, Memo "GN19-". Both 1 Oct exports read this way; the memos carry the old labels — the branch swapped the descriptions. The record's contracts are the **24 Sep** export (`../v7.61_…/README.md` line 86; STATUS: 1 Oct export "not folded in"), which is why the earlier review read line 7 as GN01. Older page data (`ops_layer.json.v601`, `register.json`, `plan_items.json`) had GN01 = 1261271, GN19 = 1276507 — the original plan. Schedule 3: GN01 1276507 DD 26098710 28 Sep; GN19 1261271 19 Oct "WAS A 20KVA / Now a 60kva". Record: GN01 1276507; GN19 no number.
**Settled.** Put **1261271** on GN19 (planned, 19 Oct). Separately fold the 1 Oct export into the record's contracts.

## 8. GN24 — 1276412

Line 17: no Item, "GN24-Generator - Diesel - 80kVA", Pending 19 Oct. 1276412 is on no line and nowhere else in the repo. **Line 40** (new since 24 Sep, like line 41): **1276416**, "Generator - Diesel - 80kVA", **no reference prefix**, Pending 19 Oct, **Rate 1 $339** (the only NVAC plant line with a rate), serial HARMDB0ACN3076273 — one digit from 1276412, unknown to the record.
**Needs Andrew** (the digits) and the branch (which line is GN24's). Confirm 1276412 vs line 40's 1276416, put the confirmed number on GN24 as planned, ask the branch to label line 40 so the $339 sits on a reference.

## 9. WC51 — "6 vs 1"

Record WC51 has two events: T0121 Accessible qty 1 **and T0122 FWF qty 6**. Baseplan line 110 "WC51 FWF Toilet" MISCITEM **qty 6** $90.07; line 111 Accessible qty 1 $337.75. Workbook rows 26–27 the same. `comparison.json` paired the FWF row with T0121 (first event on that date) — an artefact of the comparison. **Settled, no action**; the README's "short by 5" is withdrawn.

## 10. WC09 / WC31

Record WC09: T0101 FWF 4, T0102 Toilet Block 6m 2, T0259 Pee Panel 6 = workbook rows 29–31 one for one. WC31: T0096 Accessible 1, T0097 16Pan 2 = rows 24–25. Baseplan line 102 WC09 FWF MISCITEM **qty 10** (= 4 FWF + 6 pee panels at the same $90.07; no pee-panel line on any contract), lines 103/105 two blocks; line 97 WC31 Accessible 1, line 98 16 Pan Block qty 2 $2,852.13. Same comparison artefact. **Settled, no action** (pricing note for the branch only).

## 11. WC67

Baseplan line 84: "WC67 Toilet Portable - Fresh Water Flush" **qty 2**, Pending. Andrew 1 Oct: "WC67 here and complete and installed. Assets no 0793 0769" — 2 units (written 15:06). Record: T0081 2 on 1 Oct; T0262 **2 on 12 Oct**. Workbook (Schedule 3 and 2 alike): 2 on 1 Oct; **4 on 13 Oct, "up from 2"**. Nothing else in the repo itemises WC67. Two readings: total 4 (record) or total 6. Either way line 84 is short. **Needs Andrew**: 4 or 6; then T0262 dated 13 Oct with qty 2 or 4, and the branch takes line 84 to the total.

## 12. P09 — qty cell 1097377

Baseplan line 28: 1268824 "P09 … 6.0M - Cyclonic Rated", Delivered 16 Sep, **DD 26076665** (the workbook row's load cell carries it); 9968955 line 1: 1097377 "WC05 Toilet Block", DD 26067317. Record P09 1268824; WC05 1097377 + 1328978. Already answered 28 Sep (handover R02). **Settled**: workbook Week 5 row 26 qty → 1; no record change.

## 13. LT05/06 — lines 19/20: 1224783 and 1224791 "LT05/06-Lighting Tower POD Metro". Consistent.

---

## Summary table

| Item | Conclusion | Confidence | Action |
|---|---|---|---|
| P44 / P58 | record (site, 24–25 Sep) P44 198481 / P58 1273656; Baseplan lines 59/61 + workbook reverse, same dockets | likely | one look; then branch swaps lines 59/61, workbook follows — or Change → Swap |
| P13 / P15 | record right (lines 51/55; dockets match workbook cells) | settled | fix workbook cells |
| P46 | 1327213 is P04's; line 94 a clone | settled | take 1327213 off P46 |
| P46 / P03 | 1322579 is on P03's line 4, Delivered on P03's own docket; record's P03 1327212 unknown to Baseplan | needs Andrew | P03's plate decides |
| HRP / P36 | HRP 1189410, P36 1282487 (site 17 Sep); 1327222 never left the yard | likely | take 1327222 off P36 |
| P63 / P67 | branch's planned relocations of P36/HRP (lines 121/108 Pending, same units; crib rooms no demob rows) — as P41 → P65 | likely | nothing now; move 14/15 Oct |
| P53 | cancelled on record, live in workbook + lines 82/84 | needs Andrew | yes/no |
| P27 | 1097343 is P18's; P27 cancelled, no line | settled | clear workbook cell |
| GN19 | 1261271 (line 7 reads GN19; GN01 = 1276507 Delivered DD 26098710) | settled | put 1261271 on GN19; refresh export on record |
| GN24 | 1276412 on no line; new line 40 1276416 80 kVA $339 one digit away | needs Andrew | confirm digits |
| WC51 | artefact; T0122 FWF 6 = line 110 = workbook | settled | none |
| WC09 / WC31 | artefact; record = workbook; line 102's 10 = 4 + 6 pee panels | settled | none |
| WC67 | line 84 says 2; 2 landed; total 4 or 6 unknown | needs Andrew | total, then T0262 and line 84 |
| P09 | WC05's number in qty cell | settled | workbook cell → 1 |
| LT05/06 | consistent | settled | none |

Record changes implied (through the page, once Andrew says): P46 take 1327213 off; P36 take 1327222 off; GN19 put 1261271 on; plus whichever of P44/P58 and P03/P46 the plates decide.

---

## Baseplan cost columns

### (a) SUB-2131, SUB-2527, NVAC lines 31 and 34 — every populated column

The export has **no supplier cost column**. Supplier-side fields are only `Supplier Sub Rental` (a code) and `Sales Analysis Code` (…-SUB). Every money column is the customer charge (Price, Prebill Amount, Rate 1–5) or billing state (Last Billed Amount, Last Total Amount, Billed Amount, Billed Units, Tot(inc.SD,DW&GST)) — all 0 on all 308 lines.

| column | 9974042-KINP line 2 | 9968726-MEAD line 9 | 9961976-NVAC line 31 | 9961976-NVAC line 34 |
|---|---|---|---|---|
| Status | Pending | Pending | Delivered | Delivered |
| Item | **SUB-2131** | **SUB-2527** | MISCITEM | MISCITEM |
| Description | Container - Refrigerated 6.0M x 2.4M | Forklift Attachment - Extension | COATES- 5T FORKLIFT 1.8TYNNES | AT009 Forklift Rough Terrain 2.5t With Switchable 2WD to 4WD |
| Quantity | 1 | 1 | 1 | 1 |
| Rate 1 | **1428** | **9.30** | **0** | **0** |
| Rate 2 / 3 / 4 / 5 | 0/0/0/0 | 8.37/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| Expected Term Date | 2026-11-13 | 2026-10-27 | 2026-10-26 08:00 | 2026-09-18 08:00 |
| Sales Analysis Code | **STPS-SUB** | **MEAD-SUB** | NVAC-HIR | NVAC-HIR |
| Supplier Sub Rental | **ROY002** | **QUE011** | — | — |
| Start Date / Time | 2026-10-05 10:00 | 2026-10-19 07:00 | 2026-09-11 08:00 | 2026-09-17 12:00 |
| Rate Type | W | W | W | W |
| Memo | — | — | **PHILLIP PARK 1.8 TYNNES NOT EXTENSIONS. FENCING. ASSET 50004 PO 4647983** | **COATES PO 4654789** |
| Delivery Number | — | — | 26056641 | 26083924 |
| Booked Delivery / Pickup | 2026-10-05 / 2026-11-13 | 2026-10-19 / 2026-10-27 | 2026-09-11 / 2026-10-26 | 2026-09-17 / 2026-09-18 |
| Rate ID | 128709 | 128695 | 128695 | 128695 |
| all billing columns | 0 | 0 | 0 | 0 |

The SUB lines carry a supplier code and a customer rate, no cost. Lines 31/34 carry no supplier code, no rate, and a Coates **PO number in the memo (4647983 with "ASSET 50004"; 4654789)** — the only pointer to the Rehire cost, which is not in the export. The suppliers' figures still have to come from the POs.

### (b) Supplier / analysis-code style columns — every value

- **Supplier Sub Rental**: empty 306 · ROY002 1 · QUE011 1.
- **Sales Analysis Code**: KINP-HIR 219 · STPS-HIR 38 · NVAC-HIR 35 · KINP-FRI 5 · MEAD-HIR 4 · MEAD-FRI 4 · STPS-FRI 1 · STPS-SUB 1 · MEAD-SUB 1.
- Rate ID: 128709 ×157 · 128695 ×52 · 128666 ×15 · 0 ×32 · empty ×52. Status: Pending 169 · Delivered 92 · Del Req 42 · Applied 4 · Returned 1. Rate Type: W ×298.
- Never populated: Bundle Equipment, Flat Monthly Charge, Split Sales Analysis Code, Last Bill Date/Time, Billed To Date/Time, Swap Date/Time/From Line, Package Name, T Status, Rate Approver, Linked EQ Line, Job Code, PickUp Request Number, Package Type, Sequence #, Group Report Option, Sell Price, Quoted Qty, Quoted Price, Billing Option, Display Labor Tickets, Warehouse.
- There is **no "subhired" flag**; rehire is marked only by Item "SUB-…" + a -SUB code + a supplier code.

### (c) Toilet lines with Coates plant numbers — 31 lines, $32,164.13 (Rate 1 × qty), all KINP-HIR

Nothing in any description, memo, code or column marks any of them as Event Portables. Lines (line · plant · description · serial · Rate 1): 9973977 line 1 · 1311144 · WCTV Toilet Block Male Female Cyclone Rated · J006705.7 · 2476.85 | 9968955: 1 · 1097377 · WC05 Toilet Block · 410162 · 3227.41; 3 · 1328978 · WC05 Sewage Holding Tank · 106410 · 0; 4–9 · 1211961 / 1200601 / 1211969 / 1211963 / 1211964 / 1083399 · WC21 FWF · Coates1211961 / B9574 / Coates1211969 / Coates1211963 / Coates1211964 / 13643 · 90.07; 10–11 · 1322587 / 1322588 · WC16 blocks · 7856.B14.1/.2 · 2476.85; 12–13 · 1288823 / 1248439 · WC100 Toilet Portable - With Trailer · 237.71; 14–17 · 1002747 / 1195658 / 1211971 / 1002565 · WC12 FWF · 90.07; 18–19 · 1212172 / 1103497 · WC11 FWF · 90.07; 20–21 · 1327224 / 1327223 · WC17 blocks · 261190/261189 · 2476.85; 22 · 1211974 · FWF (no reference) · 90.07; 23 · 1211976 · WC04 FWF · 90.07; 44–45 · 1212502 / 1058086 · WC06 FWF · C3323 / 11110 · 90.07 (v7.27: physically at WC04/WC02); 47–48 · 1327228 / 1327225 · WC20 blocks · 261194/261191 · 3227.41 (Pending); 52 · 1119484 · WC27 block · 410953 · 3227.41 (Del Req); 55–56 · 1327226 / 1303835 · WC15 blocks · 261192 / 5250.5.8 · 2476.85 (Del Req) | 9968929 line 7 · 1211968 · FWF · Coates1211968 · 0.

Reading: a seven-digit Coates plant number with a "Coates<plant>" or manufacturer serial is a **Coates fleet unit**, as the plant-numbered forklifts are Coates's own hire. Event Portables units on the record carry four-digit fleet numbers (0793, 0769, 0146, 0037…) and sit on MISCITEM lines or blank-Item lines. Nothing supports counting these 31 lines as Event Portables rehire; the v7.66 card does ("31 lines carry a Coates plant number"). Andrew's "some of the toilets may not have MISC next to them" fits the 64 blank-Item lines, not the plant-numbered ones. **If these 31 are Coates's own, the KINP toilets' Rehire Revenue in v7.66 drops by about $32,164 and Hire Revenue rises by the same — a word from Andrew before the figure is relied on.**

## Side findings for the board

1. The record's contracts are the **24 Sep** export; lines 7/16 (GN19/GN01) now read the other way, lines 40/41 are new, P53's lines still Pending — refresh the export on the record.
2. Cloned Baseplan lines (same serial twice): 94 = 7 (261179), 108 = 93 (895), 110 = 63 (897) — the second is a plan/relocation, not a second unit.
3. **No contract line for HRP**; line 93 (labelled P36) charges HRP's building; P36's 1282487 is on the Pending "P63" line 121.
4. Record duplicates: 1327213 (P04/P46), 1189412 (P41/P65) explained above; 1264929 (T0002/NVLT) and 1197839 (T0004/FL02) are the unreferenced Week 6 rows carrying their references' units.
