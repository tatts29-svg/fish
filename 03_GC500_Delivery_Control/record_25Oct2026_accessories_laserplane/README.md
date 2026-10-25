# Record: four building items and the laserplane (EQ0006) added, on Andrew's word

Author: Andrew Fisher.
- **Applied:** 25 Oct 2026 12:50 AEST, on the live page `91f90060…`, record version 10824 → 10847.
- **Made by:** Andrew Fisher via Claude.
- **Backup:** the whole record before the run is kept private, outside the repo: scratchpad `record_25Oct2026_accessories_laserplane/backup_state_20261025T025049Z.json`.
- **Report:** `report_20261025T025049Z.json`.

Andrew, 25 Oct 2026, on the items Coates' delivery dockets name that our record did not hold: "yes onsite please add".
Those items were the P05 microwave, the CP1 fridge and urn, the P09 boiling-water unit, and the laserplane (1065384) on the plant contract.

| Reference | Before | After |
|---|---|---|
| P05 | the schedule's microwave, no number | **Microwave 1320150** (the number goes on the schedule's row, so the count stays one) |
| CP1 | the schedule's fridge and urn, no numbers | **Fridge 1116687, Urn 119810** (on the schedule's rows, so the counts are unchanged) |
| P09 | no boiling-water unit | **Zip boiler 1254390** (boiling-water unit), one more item on P09 |
| EQ0006 | did not exist | **Laserplane 1065384**, filed under Other; note "Rental 9987005, line 8."; branch MEAD; quantity 1, 1 of 1 received; on site; complete |

**How it was done:**
- Through the page's own controls, as an editor would:
  - the drawer's Attach form for the four building items;
  - the page's Add form (`addReference`) for the laserplane, the way EQ0001–EQ0005 were added;
  - then `setQty`, `setSupplied`, `setLight` and `setDone`.
- The runner is `acc.cjs`: the record runner of `../record_23Oct2026_eq0005_p34_gn24/three.cjs` plus one new step, `add_ref`. It also reads the P&L and Today's groups before and after the stage (read only).
- Four dry runs came first, every write aborted.
  - The first filed the laserplane under Access & plant. That turned Today's Equipment from 12/12 into "12 of ?": a laserplane isn't a forklift or access machine, so the group couldn't count it.
  - Filed under Other, Equipment stays 12/12.
- Then `--apply`:
  - the public page's SHA-256 was checked first;
  - exactly the 23 planned documents were written, each acknowledged 200;
  - every op was verified on the service;
  - every other document is unchanged in value.

**What it changes, and what it doesn't:**
- The P&L by branch is unchanged: KINP $241,028.14, NVAC $75,154.36, STPS $41,142.65, MEAD $16,859.02 (the record-hire figures the page sums).
- Baseplan has the laserplane at $0 on 9987005 line 8. The page's copy of the contracts (Baseplan (4), 15 Oct) has no line 8 yet, so EQ0006 joins no contract line until (7) comes onto the page.
- EQ0006's on-site day is 25 Oct, the day Andrew confirmed it. The day it turned up isn't on our record; it can be dated on his word.

The edit key is never printed, logged or stored.
