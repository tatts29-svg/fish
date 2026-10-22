# Record: AA and HRP are tracked, not charged on this job

Author: Andrew Fisher. Applied 22 Oct 2026 13:22 AEST on the live v11.18 page (`61971684…`), record version 10509 → 10543,
by Andrew Fisher via Claude. Backup of the whole record before: `backup_state_20261022T032242Z.json`. Report:
`report_20261022T032242Z.json`.

Andrew, 22 Oct 2026: "can we not charge for these two units we will keep a record of these 2 but no labour charges or
steps or transport or pick up or dmob for these 2 just purely tracking please. AA and HRP pay for there separate are on
HS# 9968926 & 9974238."

## What changed

| Reference | Building | Kept (tracking) | Taken off (charges on this job) |
|---|---|---|---|
| AA · Active Air Crib Room | 142514, 6 m | on site 17 Sep, levelled, steps fitted, complete, photos, place, fridge, table, chairs, fire extinguisher | Costs tab ticks: install, steps, levelling, cleaning, delivery leg, pickup leg, demob |
| HRP · Hire Republic Crib Room | 1189410, 6 m | on site, levelled, steps fitted, complete, photos, place, two air conditioners, fire extinguisher | Costs tab ticks: install, steps, levelling, cleaning, delivery leg, pickup leg, demob |

A note on each building's drawer says why: tracked only, the customer pays for the building on its own contract (HS
9968926 Active Air; HS 9974238 Hire Republic), nothing charged here.

Through the page's own labour control (`labour_off`, fourteen document removals named in the spec's `allowRemove`) and
the delivery note (`note_append`), via `aa_hrp.cjs` (the record runner, unchanged from `steps_ticks.cjs`). Dry run first
with every write aborted; then `--apply` with the public page's SHA-256 checked, exactly the 34 planned documents (14
labour ticks removed, their 14 stamps, the two notes with their stamps and by), every other document verified unchanged
in value, every op verified on the service.

## Still showing, for Andrew's word

- The **fire extinguisher** on each ($52.05 at the card) is charged from the accessory quantity, not a tick. The accessory
  is a thing in the building, so it was left alone; the Costs tab still prices it on both. Taking the quantity to zero
  would say the extinguisher was taken out, which is not true. A page change could carry "tracked only" as a reason the
  costing honours; not done today.
- Neither HS 9968926 nor HS 9974238 is in the Baseplan SuperCars export (15 contracts); they are the customers' own
  contracts, so there is nothing to cross-check there. On 9968862, line 93 (1189410, labelled P36) is HRP's building and
  comes off that contract; AA has no line on 9968862, which is right.
