# Record change, 1 Oct 2026: WC60's two waste tanks — install and levelling ticked, each tank a piece

Author: Andrew Fisher · 1 Oct 2026

## Completed — 1 Oct 2026 17:03 AEST

The authorised follow-up ran through the page after v7.69 was verified live. Private full backups and fresh
service readback were retained. Record version **3503 → 3520**, **17 new documents**, zero updated or deleted
documents; idempotence passed, existing charges preserved and no page errors. The guarded executor checked scope
and concurrent edits before sending only the reviewed additions. The preparation below is historical; do not rerun
it as outstanding work. `completion.json` holds the compact completion proof.


Andrew, 1 Oct 15:30 AEST: "WC60 has 2 waste tanks, I told you this. This needs to have a level cost and install cost."

The numbers are on the record since 14:03 (toilet block 1119489 with waste tank 1328980; 1087500 with 1328981; both
installed and levelled, stairs on — WC60's note). The toilet blocks' install, steps and levelling were ticked by Andrew in
the drawer at 15:13–15:15 ($811.98). The tanks had no line to tick against until v7.68 (`../v7.68_waste_tank_is_a_piece_of_work_DRAFT/`).

**Run only on v7.68 or later.** Through the page's own functions on the edit link, in the name "Andrew Fisher via Claude":

1. `setSupplied('WC60', 'Waste tank', {supplied: 'Waste tank', qty_supplied: 2, nums: ['1328980', '1328981']})` and
   `setSupplied('WC60', 'Toilet Block 6m', {supplied: 'Toilet Block 6m', qty_supplied: 2, nums: ['1119489', '1087500']})`
   — which numbers are the tanks and which the toilet blocks, in Andrew's words, so the pieces never depend on the order
   the numbers sit in.
2. `setLabour('WC60', 'Toilets & amenities', 'Waste tank', 'install', true, tank)` and `'levelling'`, for each tank —
   $145.74 + $104.10 per tank at the card = **$499.68** Labour Install, charged to the V8s.

Nothing else is touched. Or Andrew ticks them himself in the drawer once v7.68 is live: WC60 → Waste tank → Install and
Levelling on each tank. Either way the P&L's "Labour — Install" line rises by $499.68.

```
cd 03_GC500_Delivery_Control/record_01Oct2026_wc60_waste_tanks
GC500_EDIT_TOKEN=… CHROMIUM_PATH=/opt/pw-browsers/chromium DRY=1 node apply_through_the_page.js   # rehearse on the edit link, no write
GC500_EDIT_TOKEN=… CHROMIUM_PATH=/opt/pw-browsers/chromium node apply_through_the_page.js         # the write
```
Writes `record_before.json`, `actions_log.json`, `record_after.json`. Status: **waiting on v7.68 going live** — updated
here when written and verified.
