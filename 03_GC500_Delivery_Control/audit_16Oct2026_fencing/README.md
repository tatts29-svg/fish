# Fencing audit, 16 Oct 2026 — record and page checked against themselves (source papers to follow)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Please start auditing and fixing. I'm going to send you more soon."

Read-only audit of the live record (8064) and the live page (v10.44). No record changes. The papers Andrew is sending
will settle the open items below.

## What checks out

| Check | Result |
|---|---|
| Active hire agreements on the record | 53 captured (one set aside), 112 in all with the built-in ones; no duplicate docket numbers |
| Metres against panel and barrier counts (2.5 m each) | 50 of 53 match exactly; the other 3 are explained on the docket (scrim-only 36570, service-note scrim F-AFV-0026, CCB 36595 awaiting its category) |
| Every docket's charge recomputed at the 2026 card | all 112 agree with the page to the cent; $275,347.99 charged |
| Paid side | $168,642.20 on dockets + $4,150.00 green labour notes = $172,792.20, as the card shows |
| Collections | 10 forms, shown separately, not netted off hire agreements (as intended) |
| Paper records | no doubled fencing papers, service notes or collection forms |

## What needs Andrew's call

**1. Is braced (not scrimmed) fence charged as scrim?** Advanced bill "Braced for scrim" at $24.40/m in place of clean
fence at $10.00/m. On four dockets they billed scrim the signed docket doesn't show:

| Docket | Where | Docket says | Advanced billed | If not scrimmed: Advanced over clean | If braced = scrim: V8s charge short |
|---|---|---|---|---|---|
| 36581 | S04 Corporate | "Braced only, not scrimmed" | 72.5 m | $1,044.00 | $1,850.93 |
| 36583 | Helen Park C.2 | "Not scrimmed as requested by John, IEDM" | 55 m | $792.00 | $1,404.15 |
| 36587 | Event Ops perimeter | "Not scrimmed as requested by John" | 22.5 m | $324.00 | $574.43 |
| 36574 | TV parking | nothing about scrim | 10 m | $144.00 | $255.30 |
| | | | **160 m** | **$2,304.00** | **$4,084.81** |

The record's own precedents disagree: 36503 (braced fence charged as scrim), 36519/36531/36523 (bracing, no extra
charge), 36566 (braced bases charged as fence blocks, $3.02 each). 36581 is the sharpest case: we pay $1,044.00 and charge $0.

**2. Dockets show more scrim than Advanced billed** (our charge is backed by the signed docket; Advanced may bill more):
36575 S01–S02 stairs 135 m (none billed, up to $1,944.00), 36579 Commodore Park 55 m (up to $792.00), 36588 Club 500
Toilets 32.5 m (up to $468.00).

**3. Already on the page for review:** CCB event-or-demarcation on 6 dockets (1,145 m on 5, plus 36595's 10 m, charged
$0 until decided); 36503 Sea World Drive still has no metres for its scrim charge; the brace count on 36568 (151 or
157), 8 reused bases at PB03, gate counts on 36516 and 36550. Relocation (137.5 m, $1,189.65 charged) and fence blocks
(216 on 36566, $652.32) have no supplier cost, so their margin is unknown.

## Fixed

v10.45 lists every scrim difference between Advanced's bill and the signed docket in "What needs reconciling" on the
Fencing tab (4 → 11 items), with both money readings, worked out live from the record. A difference fully explained by
vehicle-gate panels (36577) is left out. No charge, cost or record changes.

Scripts: `fence_audit.py` (docket metres vs counts, from a GET of /api/state) and `fence_sup.cjs` (supplier lines vs
docket quantities, on the page, read only).
