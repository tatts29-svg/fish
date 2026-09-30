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
| v7.47 | Text it says what it is and where it goes: reference, what it is, GPS (master plan wins), Maps link, pit lane way in, inside three plain texts (the old text was ~700 characters; the service refuses over 480). **Built and tested, NOT live**: Claude's container has no edit key. Rebuild on live and upload per `v7.47_text_it_says_what_and_where_DRAFT/README.md` — Claude or Codex, whoever has the key first. Author: Andrew Fisher. | Claude | 30 Sep 2026 |
| v7.46 | Apply GN20's approved 315 kVA install basis from Andrew's uploaded Rate Card 2026 (1).xlsx. Preserve hire/demob and other references; verify, test and release. Author: Andrew Fisher. | Codex | 30 Sep 2026 22:21 |

Andrew directed that updates be finished, tested and released. v7.45 went live on
30 Sep 2026 at 22:17 AEST. Evidence: `v7.45_monthly_financial_control_LIVE/`.
No actual-hours confirmations, rates, costs or journal entries were entered on the live record. Finance proposals
do not post to a ledger. Use client Tools → Export or the dedicated review backup for the new finance events;
the older service `/api/export` does not include that new collection. Showcase and dashboard previews were not included.

Repository note: direct shared-base status-board writes were blocked by repository safeguards. The release and
this board are recorded on `codex/gc500-v7.45-monthly-finance`; integrate through review, not a direct base push.
30 Sep 2026: Claude merged `codex/gc500-v7.46-gn20-install` into `claude/ampol-reporting-suite-access-h2hy90`, so
that branch holds both agents' work. Codex: before claiming, also read the board on that branch (Claude's claims
land there).

Claim a line here and push it BEFORE you start. Clear it when the release is live.

## Waiting on Andrew

- Toilets and servicing (Costs): Event Portables rehire shows $69,092 charged against $118,575 cost (−$49,483).
  Andrew asked on 30 Sep "what do we need". Three gaps, all commercial, none the page can close on its own:
  (1) the servicing on Event Portables quote Q6844 (780 FWF services, 24 tank pump-outs, 51 block cleans, $46,545
  their cost) is on no contract line — $85,102 at our street card's pump-out rates, not charged;
  (2) the water truck, pre-fill, water delivery and drinking-water tank (Q6844/Q6846, $12,200 their cost) have no
  line on our card and are not charged; (3) 7 lines on KINP contracts with no rate: 9968955 lines 3, 49, 50, 54,
  94, 95 (sewage holding tanks WC05, WC20 x2, WC27, WC60 x2) and 9968929 line 7 (FWF toilet). Needs the customer's
  agreement that servicing and water are billable, and the branch to put the lines and rates on the contracts.

- GN20 source recovered: Andrew uploaded Rate Card 2026 (1).xlsx on 30 Sep. Street Rate Card 2026 A79/B79 identifies Generator 315 KVA and $333.12 combined labour. v7.46 is verifying the existing equal install/demob split and applying only the approved install component; no hire/demob change.
- Fencing hire agreements 36559 and 36560: are the CCB lines "event" or "demarcation"? ($3,620.50 across 650 m.)
- Purchase order 4658850 (receipt ID 4922343, $195): which period? Then press Confirm on the Fencing tab.
- Photos left on the service that no place holds: he can Put back WC17 · 1327223 place 2 and P44 · 198481 aerial
  from each drawer (listed under the group, folded).

## Ideas offered, not started

- Event Portables "X of 246" tally on the Inventory.
- A one-page guide for Brendan and Rebecca.
- Showcase graphics upgrade (day and night look) and the Coates Way machine's clear view (no wall through the car).
- Print for drivers / print for installers from the Timeline.
