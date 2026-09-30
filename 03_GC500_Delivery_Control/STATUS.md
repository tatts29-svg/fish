# GC500 status board

Shared by Claude and Codex. Update it when you claim work, when something goes live, and when Andrew answers a
question. Newest first in each section. Times AEST.

## Live now

| version | what | live | by |
|---|---|---|---|
| **v7.45** | Monthly financial control on Costs: explicit actual-hours/cost review, labour outlook, billing months and Finance journal proposals. 70 model checks; 38/38 desktop and phone; both sweeps passed. Verified live byte for byte; no record edits or ledger posting. Author: Andrew Fisher. | 30 Sep 2026 22:17 | Codex |
| v7.44 | Add sub-hired gear in the drawer/register; show existing supplier asset numbers throughout. Tested build verified live byte for byte; no record or charge changes. Author: Andrew Fisher. | 30 Sep 2026 21:53 | Codex |
| v7.43 | the drawer shows what is relevant (no accessories on generators, sub-hired says so first, id generator letters only) | 29 Sep 2026 18:18 | Claude |
| v7.42 | the pit lane is the way in | 29 Sep 2026 17:42 | Claude |
| v7.41 | photos stick (one document per photograph, outbox on the phone) | 29 Sep 2026 17:17 | Claude |
| v7.40 | signed fencing papers recorded on the page | 29 Sep 2026 16:16 | Claude |

Record change 29 Sep 2026 18:24: the master plan's positions put on in place of 60 pins (Andrew approved) —
see `record_29Sep2026_master_plan_positions/`.

The live page's own proof: `toolchain/fetch_live.sh` then compare with the release folder's README.

## Claimed — being worked on now

| version | what | who | since |
|---|---|---|---|

No active release claim. Andrew directed that updates be finished, tested and released. v7.45 went live on
30 Sep 2026 at 22:17 AEST. Evidence: `v7.45_monthly_financial_control_LIVE/`.
No actual-hours confirmations, rates, costs or journal entries were entered on the live record. Finance proposals
do not post to a ledger. Use client Tools → Export or the dedicated review backup for the new finance events;
the older service `/api/export` does not include that new collection. Showcase and dashboard previews were not included.

Repository note: direct shared-base status-board writes were blocked by repository safeguards. The release and
this board are recorded on `codex/gc500-v7.45-monthly-finance`; integrate through review, not a direct base push.

Claim a line here and push it BEFORE you start. Clear it when the release is live.

## Waiting on Andrew

- GN20 (350 kVA requested, asset 1276701): Andrew confirmed on 30 Sep 2026 to use the 315 kVA install price. The original 2026 street-card workbook is absent from this checkout and its 315 kVA row is not embedded in the live page. Recover that row before implementing the amount; do not ask Andrew to choose a different rate or change hire/demob pricing. No install tick or live charge has been changed.
- Fencing hire agreements 36559 and 36560: are the CCB lines "event" or "demarcation"? ($3,620.50 across 650 m.)
- Purchase order 4658850 (receipt ID 4922343, $195): which period? Then press Confirm on the Fencing tab.
- Photos left on the service that no place holds: he can Put back WC17 · 1327223 place 2 and P44 · 198481 aerial
  from each drawer (listed under the group, folded).

## Ideas offered, not started

- Event Portables "X of 246" tally on the Inventory.
- A one-page guide for Brendan and Rebecca.
- Showcase graphics upgrade (day and night look) and the Coates Way machine's clear view (no wall through the car).
- Print for drivers / print for installers from the Timeline.
