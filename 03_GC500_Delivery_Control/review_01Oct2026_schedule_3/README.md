# Review of GC500_26_Schedule_3.xlsx against the record — 1 Oct 2026, 15:10 AEST

Author: Andrew Fisher. Read only: nothing on the page or the record was changed. Andrew, 1 Oct: "can we check to ensure
we are not missing anything." The workbook is kept here (`GC500_26_Schedule_3.xlsx`, SHA-256 `ed10b89dac530f63…`); its
rows as read are `schedule_3_rows_as_read.json` (260 rows over Week 6 … Demob Week 3; BOQ and Labour are not schedule);
the record as read is `record_as_read.json` (202 references, 242 events, 34 unreferenced rows, 7 fencing rows, version
3406); the comparison is `comparison.json`.

## Short answer

**Nothing is missing.** Every reference the workbook names is on the record, and every one of the 207 keyed rows has an
event on the record in the same week. The unkeyed rows (VMS, light towers, forklifts, fencing semis, the WC-TV block, the
pit-garage toilets) are on the record too, under the page's own task numbers.

What the workbook knows that the record does not is **asset numbers** — thirteen cells — and two of those point at
something wrong on the record itself. There are also six dates and a few quantities where the workbook and the record
disagree; most are the plan moving and the record carrying the actual day, two need Andrew's word.

## 1. Schedule 3 against Schedule 2 (this morning's file)

Three cells changed; everything else is identical.

| Sheet | Row | What changed |
|---|---|---|
| Week 2 | 3.5T Forklift Std, Supply | moved from Week 1 (12 Oct) to **6 Oct**, now with DD 26109954 |
| Week 2 | P46 QPS Command Post | asset **1327213 → 1322579** |
| Event Week | GN24 80 kVA | asset added: **1276412** "ex Gymp, trying to get Mead" |

## 2. Asset numbers the workbook carries that the record does not — and what they mean

| Sheet | Reference | Workbook says | Record says | Reading |
|---|---|---|---|---|
| Week 4 | **P44** | 1273656 | 198481 | **Swapped with P58** on one side or the other. Baseplan has 1273656 on P44's line? — no: the contracts carry no number for either. Andrew to say which building is which. |
| Week 4 | **P58** | 198481 | 1273656 | the other half of the swap |
| Week 4 | **P13** | 1097345 | 1097346 | one digit apart; and the record has 1097345 on **P15**, where the workbook has **127579** (a six-digit number — a typo of 1275790-something, or of 1097345). Andrew to confirm P13 and P15 from the plates. |
| Week 2 | **P46** | 1322579 (new in Schedule 3) | 1327213 | the record's 1327213 is **also on P04** (Baseplan has 1327213 on both the P04 and the P46 lines — the same unit on two contracts lines). Schedule 3's 1322579 resolves it: put 1322579 on P46 once confirmed, and the P04/P46 duplicate goes. |
| Week 5 | **HRP** | 1282487 | 1189410 | 1282487 is on **P36** on the record; the workbook also writes 1282487 on **P63** (Week 1) and 1189410 on **P67** (Week 1). Four buildings, two numbers, written on both sides differently — Andrew to walk them. |
| Week 1 | **P63** | 1282487 | — | see HRP |
| Week 1 | **P67** | 1189410 | — | see HRP |
| Week 5 | **P27** | 1097343 | — | on the record 1097343 is **P18**'s number. One of the two. |
| Week 3 | **P53** | 1327222 | — | on the record 1327222 is **P36**'s number (P36 then carries 1282487 and 1327222 — two numbers on a 6 m building). |
| Event Week | **GN19** | 1261271 "was a 20 kVA, now a 60 kVA" | — | on the record and the contracts 1261271 is **GN01**'s 60 kVA (line 7). Baseplan's GN19 line (16) is 1276507. Andrew to say which set goes where. |
| Event Week | **GN24** | 1276412 "ex Gymp" | — | new; not on any contract line yet. Put on when confirmed. |
| Event Week | LT05 | 1224783-1224791 (the pair) | LT05 1224783 · LT06 1224791 | consistent — the workbook writes the pair on one row |

So: **two swaps or near-swaps (P44/P58, P13/P15), one duplicate on the record (1327213 on P04 and P46), four numbers written
on two references each (1282487, 1189410, 1097343, 1327222), one number claimed by two generators (1261271: GN01 and
GN19), and one genuinely new number (GN24 1276412).** None of these can be settled from paper; each needs Andrew's word
or the plate on the unit, then it is a number put on or moved on the page (the drawer's number box, or Change → Swap).

## 3. Dates and quantities that differ

| Sheet | Reference | Workbook | Record | Reading |
|---|---|---|---|---|
| Week 3 | WC01 accessible toilet | 30 Sep | 28 Sep (T0060) | the record carries the planned day; the light says when it landed |
| Week 3 | WC50 FWF | 30 Sep | 28 Sep (T0247) | as above |
| Week 3 | WC60 | two rows, qty 1 and 2, no date, DD 26104424 / 26106375 & 26106388 | 2 on 1 Oct (T0248) | the record is right: both blocks arrived and were installed today (WC60 record change, 14:03) |
| Week 1 | WC67 FWF | 13 Oct, **qty 4** | 12 Oct, qty 2 (T0262) · and 1 Oct, qty 2 | WC67 came today with **2** units (0793, 0769 — Andrew, 15:00). Is a second pair of 2 still due on 13 Oct, making 4? Andrew to say. |
| Event Week | WB14 TL2 | 25 Oct | 21 Oct (T0171) | two rows in the workbook (install / removal); the record has both days as separate events — no gap |
| Demob | WB20, WB19 | 29 Oct / 6 Nov | 26 Oct / 2 Nov | as WB14: reinstate and removal are two events on the record — no gap |
| Week 5 | P09 | qty cell reads **1097377** | qty 1 | the asset number typed in the quantity column of the workbook — a cell to fix in the workbook |
| Event Week | LT05 | qty 2 | 1 | the pair LT05/LT06 on one row; the record has one each — no gap |
| Week 2 | WC09, WC31 | pee panel 6 / block 2; 16-pan 2 | 4 / 4; 1 | the record's quantities came from the contracts (WC09 10 units, WC31 2 ×16-pan); the workbook rows split them differently — totals to confirm against the quotes |
| Week 1 | WC51 FWF | 6 | 1 (T0121) | the contract line says **6** — the record's event quantity is short by 5; Andrew to confirm 6 and the page's quantity box is set |

## 4. What is NOT in the workbook that the record has

Nothing of substance. The record's extra events are rows the page split (a building and its toilet; LT05 and LT06; a
reinstate and a removal), not deliveries the workbook lacks.

## 5. Transport

As reviewed this morning on Schedule 2 (`../review_01Oct2026_schedule_2_transport/`): figures only on Weeks 6, 5 and 4,
$22,018; 19 booked loads without a figure; nothing from 28 Sep on. Schedule 3 adds no transport figure.

## What to do

Each line above is a question for Andrew, not a change the record can make on its own. Once he says: the numbers go on
through the page (the drawer's number box, or Change → Swap for the swaps), WC51's quantity is set, WC67's second pair
is confirmed or not. Nothing is changed by this review.
