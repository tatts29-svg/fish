# Access & plant on site and complete, 22 Oct 2026 04:26 AEST (21 Oct 18:26 UTC): APPLIED

Author: Andrew Fisher · run by Claude.

Andrew, 22 Oct 2026 (AEST): "Also equipment is wrong. That should read 100% all of that has turned up".

## What was wrong

The Today card's Build index had **Equipment 8 of 12 machines · 66.7%**. The four references short were the access & plant
machines added to the record on 21 Oct 2026 05:01 UTC (rental 9992300 lines 4, 5 and 12; rental 9961976 line 27):

| Reference | Machine | Asset | Record before |
|---|---|---|---|
| EQ0001 | Scissor Lift With Operator Protection 43ft (13.0M) - Diesel | 1220903 | no delivery record |
| EQ0002 | Knuckle Boom 61ft (18.6M) - Diesel | 1300290 | no delivery record |
| EQ0003 | Straight Boom 60ft - Diesel | 1286482 | no delivery record |
| EQ0004 | SUPPLY - Forklift 3.5t Diesel | 1210921 | no delivery record |

Each had its number, contract line and quantity (1) but no light and no Complete tick, so the group counted them as not
confirmed. Buildings, Toilets, Generators and Lighting were already 100%.

## What was done

`node plant.cjs --apply --spec plant_spec.json` — the record runner (a copy of `record_18Oct2026_vms_regos/vms.cjs` with one
addition: after the stage it prints the Today groups from the page's own `todayWorkSummary848`, so the derived figure the
change is meant to move is seen before anything is sent). For each of the four, through the page's own controls on the edit
link, by Andrew Fisher:

- `light` → on site (`setLight`), dated when pressed. No arrival day was invented: Andrew said they have turned up, not when.
- `complete` (`setDone`).

Dry run first on the live page (read-only, every write aborted): 8 ops staged, 4 documents would change, Today groups after
the stage `equipment 12/12 100%`, DRY RUN PASSED. Then `--apply` with the public page checked against sha256
`dc641835…` (v11.07): backup of the whole record `backup_state_20261021T182637Z.json` (version 10476), 4 documents written
(`delivery/EQ0001..EQ0004`), record **10476 → 10480**, every other document unchanged in value, VERIFIED on the service
(`report_20261021T182637Z.json`). A fresh read through the page afterwards: Equipment **12 of 12 · 100%**, Today "5 areas at
100%".

## Still short of 100% on the same card (not touched — Andrew spoke of equipment)

- **Water barriers 303 of 311 · 97.4%**: WB17 (6) and WB18 (2) are "not on site" (set 3 Oct 2026).
- **VMS boards 23 of 24 · 95.8%**: VMS21 is the one due board not on site.
