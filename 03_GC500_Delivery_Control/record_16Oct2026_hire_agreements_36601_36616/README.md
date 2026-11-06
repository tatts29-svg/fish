# Hire agreements 36601–36616 received 16 October 2026 (RECORD OPERATION APPLIED)

Author: Andrew Fisher. Andrew, 16 Oct 2026, with photographs: "Here is some more, ensure we file these and analyse and
add all costs." Sixteen Advanced Temporary Fencing hire agreements, installed 12–15 Oct 2026, each signed by Andrew on
16 Oct 2026 (the work dates stay distinct from the sign-off).

## Filed

The sixteen originals went up unchanged as Documents, kind docket, named by their paper number (`36601.jpg` …
`36616.jpg`), with a 480 px WebP preview each (`upload_originals.cjs`, as the page's own Add does); each one's SHA-256
was read back from the service and matches the file in `originals/`. Files on the service 480 → 496.
The Fencing tab links each agreement's photograph by its number.

## Recorded and costed, through the page's own red-book form

Sixteen records were created by `papers_fill.cjs` (the 16 Oct service-note runner extended with the hire-agreement
op): dry run on the live page first (every write aborted; 16 documents planned, none outside the plan), then `--apply`
on the live edit link with the page's sender held, a write gate that let exactly those 16 PUTs through once each, and a
read-back of the whole record. Record version **6615 → 6631**; every other document unchanged in value.
Report `report_20261015T213015Z.json`; the whole record before is `backup_state_20261015T213015Z.json`. Recorded by "Andrew
Fisher". Each is charged to the V8s at the 2026 street rate card and costed at Advanced's sheet by the page's own rules
(`costDocket`), exactly as every earlier agreement.

| Paper | Installed | Where | Card lines | Charged (2026 card) | Paid to Advanced |
|---|---|---|---|---|---|
| 36601 | 12 Oct | Commodore Park - Ticket Entry | 25 m mesh fence (clean), 25 m scrim | $1,042.27 | $860.00 |
| 36602 | 12 Oct | Cove - Optus | 45 m mesh fence (clean), 45 m scrim | $1,876.08 | $1,548.00 |
| 36603 | 13 Oct | Eastern Residents & Demarc - Cable St to Gate 8A - DL & DR | 537.5 m mesh fence (clean), 672.5 m CC barrier, demarcation, 4 pedestrian gates | $17,627.42 | $9,150.50 |
| 36604 | 13 Oct | Breaker St - T11 - DL | 93 m flat-feet CCB | $897.55 | $0.00 |
| 36605 | 13 Oct | Aloha Lane to Cronin St (Crest) | 95 m mesh fence (clean) | $1,535.27 | $950.00 |
| 36606 | 13 Oct | Fishermans Walk | 10 m mesh fence (clean) | $161.61 | $100.00 |
| 36607 | 14 Oct | Main Beach Tower | 47.5 m mesh fence (clean) | $767.63 | $475.00 |
| 36608 | 14 Oct | Ferny Ave to Narrow Neck Court | 117.5 m mesh fence (clean), 192.5 m CC barrier, demarcation | $4,416.78 | $2,214.50 |
| 36609 | 14 Oct | Esplanade south of Meriton - Porsche Lounge C.2 | 420 m mesh fence (clean) | $6,787.49 | $4,200.00 |
| 36610 | 14 Oct | G8 & surround | 367.5 m mesh fence (clean), 200 m CC barrier, demarcation, 2 pedestrian gates | $8,627.43 | $4,827.00 |
| 36611 | 15 Oct | Surfers Paradise Light Rail | 165 m mesh fence (clean), 130 m CC barrier, demarcation | $4,366.92 | $2,352.00 |
| 36612 | 15 Oct | Pacific Ave to Cable St | 315 m mesh fence (clean), 3 pedestrian gates | $5,199.17 | $3,258.00 |
| 36613 | 15 Oct | Porsche C.2 | 70 m CC barrier, demarcation | $915.60 | $378.00 |
| 36614 | 15 Oct | S.0.8 B.O.H. | 40 m mesh fence (clean) | $646.43 | $400.00 |
| 36615 | 15 Oct | Gate 5 Compound | 110 m mesh fence (clean) | $1,777.68 | $1,100.00 |
| 36616 | 15 Oct | Triangle C.2 | 147.5 m mesh fence (clean) | $2,383.70 | $1,475.00 |
| **Total** | | | Mesh fence (clean) 2442.5 m · scrim 70 m · CC barrier demarcation 1265 m · flat-feet CCB 93 m · pedestrian gates 9 | **$59,029.03** | **$33,288.00** |

Prices and totals are blank on every photographed paper; the figures are the page's. 36604's flat-feet CCB is charged
at the card's flat-feet rate ($9.6511 a metre) and paid at nought because Advanced's flat-feet supplier rate is still
unknown (as the 9 Oct record noted).

## How the lines were read

- Mesh fence metres go on the **clean** line. A paper that says "braced & scrimmed" (36601, 36602) carries **scrim** for
  the same metres, the clean-plus-scrim convention Andrew set on 2 Oct. 36609 and 36615 say "not scrimmed, as requested
  by John, IEDM" and carry no scrim. Every other run carries no scrim on its agreement; the scrim done on existing fence
  is on the service notes (24476, 24477, 24481).
- CC barrier goes to **demarcation** where the paper's notes say so (36603, 36608, 36610). Where the paper says only
  "CC Barrier" (36611 Light Rail, 36613 Porsche C2) it is recorded as demarcation, **to confirm**, as 36559 and 36560
  stand; 36613 may be an event line (Porsche Lounge corporate area) — Andrew's call.
- 36604 is flat-feet CCB, 93 m / 42 pieces, on its own line.
- Pedestrian gates are charged each (36603 four, 36610 two, 36612 three). Wheels, bases, clamps and braces are
  components on the paper, not charge lines.
- 36614's base count is written over and reads 18 or 78; 18 is recorded, to confirm. 36614 is the agreement service
  note 24481 names (S08 BOH, the same day). 36596, named on service note 24475, is still not on the page.

```sh
node record_16Oct2026_hire_agreements_36601_36616/upload_originals.cjs            # dry run
node record_16Oct2026_hire_agreements_36601_36616/papers_fill.cjs                 # dry run on the live page
GC500_EXPECTED_PAGE_SHA=<public page sha256> node record_16Oct2026_hire_agreements_36601_36616/papers_fill.cjs --apply
```

## The supplier rates Advanced actually bill (RECORD OPERATION APPLIED, 09:12 AEST)

Andrew, 16 Oct 2026: "We go by what we are being charged for; you have the purchase orders on how we are being
charged." The purchase orders on the record run week 6 to week 1, Event week and Demob (ZINC001 Advanced Temporary
Fencing, branch STPS); week 2's order 4647519 carries Advanced's own invoice totals sheet (commercial approval, 13 Oct
2026) line by line against our papers, and that is the rate sheet we are charged at: clean fence $10 a metre, braced for
scrim $24.40, demarcation CCB $5.40, vehicle gate incl one wheel $50, **pedestrian gate incl one wheel $61**, installer
and relocation labour $100 an hour, team leader $200 a day, two a day. The page's cost tracker already matched all of
those except the pedestrian gate ($36, the old rate row) and carried no flat-feet rate at all; Advanced billed 36591's
flat-feet barriers inside "Demarcation CCB" at $5.40 a metre with no separate line.

So two supplier rates were typed through the Fencing tab's own rate inputs (`rates_spec.json`, the same runner, dry run
then apply with the write gate): **pedestrian gates $61** and **flat-feet CCB $5.40**, recorded under Andrew's name.
Record version 6637 → 6643 (the six documents between 6631 and 6637 were Andrew's own accessory edits on P33 and P66);
report `report_20261015T231236Z.json`. Every gate and flat-feet paper on the record now carries the billed rate: the
sixteen agreements' paid side moved from $33,288.00 to **$34,015.20** (+$225 on nine gates, +$502.20 on 36604's flat
feet); 36591 now pays $793.80 instead of $567.00.

### What week 1's invoice should come to

Order 4647520 (Construction week 1, work 12–16 Oct) is not on the record yet — Advanced's invoice totals sheet for the
week has not arrived. At the rates they billed on week 2, our 27 papers of 12–15 Oct come to:

| Line | Quantity | Rate | Amount |
|---|---|---|---|
| Clean temporary fencing | 2,442.5 m | $10.00 | $24,425.00 |
| Braced for scrim | 70 m | $24.40 | $1,708.00 |
| Demarcation CCB | 1,265 m | $5.40 | $6,831.00 |
| Flat-feet CCB (36604) | 93 m | $5.40 | $502.20 |
| Pedestrian gate incl one wheel | 9 | $61.00 | $549.00 |
| Installer / relocation labour (service notes 24475–24481) | 13 h | $100.00 | $1,300.00 |
| **Papers** | | | **$35,315.20** |
| Team leader, if billed as on week 2 | 4 days × 2 | $200.00 | $1,600.00 |
| **With team leader** | | | **$36,915.20** |

Friday 16 Oct's papers, 36596–36600 (36596 is named on service note 24475) and anything after 36616, are not in this
figure. When Advanced's week-1 sheet arrives it goes on order 4647520 as week 2's did, line by line, and any rate that
differs from these is theirs to explain.

## Three more record operations the same morning

**36611 reclassified (`fix_spec.json`, 6643 → 6646, `report_20261015T232006Z.json`).** The agreement's 130 m of CCB
was first booked as demarcation; the programme's CON WK1 row 46 names the Scrimmage Zone / Monster Energy Event
Compound as event work, so the quantities were moved to the event line through the same write the page's own form
makes ({clean: 165, ccb_event: 130}), note updated, charged at the event rate. 36613 stays pending Andrew's word (event
compound or demarcation).

**Record notes (`notes_fix_spec.json`, 6646 → 6693).** The sixteen agreements' notes were re-saved as "Owner sign-off:
Andrew, 16 Oct 2026" so the programme-link snapshots the page keeps (which drop the full name from narrative text) match
the records exactly.

**36592 set aside, then found to be the wrong copy (`aside_spec.json`, 6693 → 6699, `report_20261015T232819Z.json`).**
36592 (The Hill, Monster CZ, 9 Oct) is on the record twice: `F-AFV-0035·2904` at 137.5 m / 55 panels and
`F-AFV-0035·1e26` at 132.5 m / 53 panels. The `·2904` copy was set aside through the page's own Set aside on the reading
that the paper says 132.5 m. That was the wrong way round. The backups settle it: at record 6128 (14 Oct, 22:34 UTC) the
record held one copy of 36592, the corrected 137.5 m / 55-panel one (the 14 Oct inventory audit calls it "the previously
corrected 36592"); by 6163 (23:05 UTC) it had been re-keyed to `·2904` and the old 9 Oct reading had come back beside it
as `·1e26`. The page's v10.14 attribution expects the corrected signature (137.5 m, 55 panels, credit capped at the 135 m
allowance), so the corrected copy is the one to keep and the resurrected old reading is the duplicate Andrew knew about
and asked to remove.

**The swap back (`swap_spec.json`, PREPARED, dry run passed, not applied).** Two operations through the page's own
buttons: `docket_putback` of `·2904` (the Edit tab's Put back: the record returns to its list, the tombstone is
countered by `deleted/back/<id>`, the aside entry goes) and `docket_aside` of `·1e26`. The runner learned the put-back
op for it (`PUTBACK_IDS`, the write gate allows the eleven documents the page writes for the pair and nothing else, the
removal of `aside/<id>` is gated on expected null). The dry run on the live page (6699) passed: eleven aborted writes,
exactly the plan. The apply was refused twice by this session's permission gate, so it waits: run
`GC500_EXPECTED_PAGE_SHA=<live page sha> node papers_fill.cjs --spec swap_spec.json --apply` with the edit key in the
environment, or put `·2904` back and set `·1e26` aside by hand under Tools → Edit. After it, 36592 is charged once at
137.5 m and its week-2 programme link reads matched again.
