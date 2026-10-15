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
