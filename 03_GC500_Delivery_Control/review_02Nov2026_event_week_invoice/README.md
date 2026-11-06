# Review: Advanced's event-week invoice sheet (PO 4647522) against our record, 2 Nov 2026 (Claude, read only)

Author: Andrew Fisher. Nothing on the record changed; no page uploaded.

Andrew, 2 Nov 2026, sent "Fw: GC500 - EVENT - Commercial Approval": Advanced's sheet "P003-25003-01 GC600 2026 Coates Hire Fencing
Programme - EVENT WEEK - INV TOTALS - 30-10-2026" (one page, PO 4647522, **$86,438.00 ex GST**, commercial approval box blank) and a
63-page scan of their head-office copies of the event-week papers (hire agreements 36623–36771, service notes 24482–24495). Both are
private inputs, not committed; the per-docket check (CSV) is private too.

## The sheet

Clean 692.5 m @ 10.00 = 6,925.00 · braced for scrim 1,077.5 m @ 24.40 = 26,291.00 · relocation 14.0 h @ 100 = 1,400.00 · vehicle
gates 49 @ 50.00 = 2,450.00 · demarcation CCB 1,505 m @ 5.40 = 8,127.00 · installer standard 175 h @ 100 = 17,500.00 · overtime
147.5 h @ 142 = 20,945.00 · team leader 14 days @ 200 = 2,800.00. Removal 85 m (collection 28561) carries no rate. Re-adds to
86,438.00 to the cent. Rates are the same as their weeks 1–5 sheets (approved, invoiced and receipted).

## Against our record (live v12.81 `3b17c3de…`, record 12853)

Our record holds event week at **$71,159.70** at Advanced's rates (48 dockets 34,568.70; 11 notes 67 h 6,700.00; crew 210.5 h @ 142
29,891.00), the figure inside the pack's 79,184.70 accrual. The sheet is **$15,278.30** more, and it splits to the cent:

| | $ |
|---|---:|
| 36766 and 36768: papers say CC barrier 10 m and 50 m ($324.00 at 5.40); sheet bills 60 installer hours ($6,000.00) — **error** | +5,676.00 |
| Bracing added to existing fences (36632, 36644, 36763): 282.5 m braced less clean, as their paid weeks did (36597, 36519) | +4,068.00 |
| Team leader 2 a day × 7 days @ 200 (as weeks 1–5) | +2,800.00 |
| 36623 hoarding 102.5 m billed at the braced-for-scrim rate (their sheet has no hoarding line) | +2,501.00 |
| Vehicle gates (wheels) 45 @ 50 with the gate panels out of the fence metres (as weeks 1–5) | +1,125.00 |
| Scrim metres settled by their sheet on 14 papers (more on 36624, 36626, 36630; less on 36629, 36631, 36639, 36642, 36643, 36649, 36759, 36761) | +1,116.00 |
| 36771 Triangle CZ: paper has no metres (26 panels, 4 wheels); sheet 55 m + 4 gates | +750.00 |
| 36641 Gate 1 (21 Oct): not on our record; head-office copy shows CCB 25 m | +207.00 |
| CCB and flat feet: 36634 billed 5 m (paper 12.5 m), 36635 flat feet 35 m not billed, 36638 88 m billed as 90 m | −218.70 |
| 24491 (22 Oct, S15 demarcation, 1 h) on our record, not on the sheet | −100.00 |
| Friday crew 24493: 63 h standard + 9 h overtime (we hold 72 h @ 142; quote 27172 race-day rate) | −2,646.00 |
| **Total** | **+15,278.30** |

Two docket numbers are misprinted on the sheet: 366454 is 36645 and 36670 is 36770 (amounts match ours). 36630's paper says
"Not scrimmed, confirmed with Jake"; the sheet bills its 7 braces as 17.5 m braced for scrim (+252.00, inside the scrim line above).

## What it means

Corrected for the 36766/36768 error the claim is **$80,762.00 ex GST**: $9,602.30 above what the pack accrues for event week. The V8s
side stays as invoiced (Andrew's ruling of 31 Oct). Approval, the reply to Advanced, putting the approved sheet on PO 4647522, and
recording 36641 from the head-office copy all wait on Andrew's word.

Probes: `ew_dump.cjs` (event-week dockets, notes and crew from the live page, read only), `sp1014.cjs` (the approved weekly sheets'
precedents), both under the browser lock with every write aborted.
