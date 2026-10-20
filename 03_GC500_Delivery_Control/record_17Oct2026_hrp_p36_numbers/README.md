# Record operation, 17 Oct 2026: HRP and P36 get their site numbers back

Author: Andrew Fisher · 17 Oct 2026 (02:51 AEST; 16 Oct 16:51 UTC)

Status: **APPLIED and VERIFIED on the live record**, 9515 → 9527, 12 documents (`report_20261016T165112Z.json`). Every
other document unchanged in value. Backup of the whole record before: `backup_state_20261016T165112Z.json`, key redacted.

Andrew, 17 Oct 2026: "AA and HRP SHOULD have asset numbers on them where did my asset number go for these".

## What happened

The 15 Oct dockets fill (`../record_15Oct2026_dockets_fill/`) took 1189410 off HRP and put it on P36, and took 1282487
off P36. It did that on the branch's paperwork: docket 26085104 calls 1189410 the "P36 Portable Building Shell", and
Baseplan line 121 has 1282487 as P63's planned shell, still Pending.

That overrode Andrew's own site record, which says the opposite:

| Reference | Andrew's site record | Where it comes from |
|---|---|---|
| HRP (Hire Republic Crib Room) | 1189410 | Loading recorded by Andrew on 10 Oct 17:53; drop photos tagged 1189410 on 18 Sep and 25 Sep |
| P36 (Harry the Hirer) | 1282487 | Loading recorded by Andrew on 10 Oct 17:53; drop photos tagged 1282487 on 18 Sep and 25 Sep |
| AA (Active Air Crib Room) | 142514 | Loading recorded by Andrew on 10 Oct 17:55; drop photos 18 Sep and 25 Sep. **Never touched; still showing.** |

Andrew's rule: his site record is the truth, and the branch paperwork is what gets checked against it.

## What was written

The page's own number controls did it (`numbers_fill.cjs`, spec `numbers_spec.json`):

1. `numberTakeOff` P36 1189410
2. `numberPutOn` HRP 1189410 (after the page's clash check)
3. `numberPutOn` P36 1282487

1327222 stays off P36; it is P66's shell (docket 26126001).

## What it changes in the money

The total is unchanged. The building breakdown is still **$147,017.32**, and $149,017.32 with the containers' contract
transport; the v10.49 test passes 19/19 and the v10.50 test 17/17 on this record. One line moves between buildings:

- **Baseplan 9968862 line 93 hire, $1,426.07**, joins by asset number. It now sits on **HRP**, not P36.
- **P36 (1282487)** and **AA (142514)** are on no Baseplan hire line. Both have been on site since September.

## For the branch

- Docket 26085104 labels 1189410 as P36's shell; on site it is HRP's crib room.
- Baseplan line 121 still shows 1282487 as Pending for P63. It has been on site at P36 since at least 18 Sep, and
  no contract line hires it.
- AA 142514 is also on site and on no hire line.

Before the hire is reconciled, ask the branch which contract line covers 1282487 and 142514.

The photos can't settle it on their own, because the plates in them can't be read. The site record is Andrew's own
entries made at the building.
