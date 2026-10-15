**Published in v10.36 on 16 Oct 2026 at 06:41 AEST.** Page `d72e7f6198111f51…` (18,024,035 bytes), read back byte for byte by the view link; the stack v10.32 → v10.36 went up together on the live v10.31. Author: Andrew Fisher.

# v10.32 — every outstanding portaloo today, loads of 24; the labour a thing carries (LIVE)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "No FWF loads on Saturday. For toilets, loads of 24, so we do the max on. Stop
deciding." And: "FWF only get an install and a demob. Toilet blocks: install, level, steps, clean, demob. Waste tanks:
install, level, clean, demob. Buildings the same: install, level, steps, clean, demob, unless I have unticked steps or
anything, or added a fire extinguisher or an accessory."

| Change | Effect |
|---|---|
| The Event Portables run sheet proposes **every** portaloo still to come for today, loads of 24 in route order | 34 today: load 1 of 24, load 2 of 10. Nothing on Saturday, Monday or Tuesday. The schedule's and the plan's dates stay on each row as its source. |
| `labourKeep1032(item)`: the labour lines a thing carries | FWF: install, demob. Waste tank: install, levelling, cleaning, demob. Toilet block: install, levelling, steps, cleaning, demob. Buildings and everything else: the card's own lines (a building's fire extinguisher stays offered, as Andrew's per-building tick). Checked against the 2026 street card (sha `551f7b3d…`), which prices FWF and tanks exactly that way. |
| Footer | v10.31 → v10.32 |

No record value changes; every contract line charges what v10.31 charges.

## Checks

| Check | Result |
|---|---|
| `check_page.py` | PASS |
| `tests/test_today1032.cjs` (every write aborted) | ALL 6 CHECKS PASSED |
| `harness/sweep.js` desktop and phone | 24 tabs, 18 shown, no errors |

Build `build/GC500_v10.32/` sha256 `1e9462d1208601dc…` (18,009,861 bytes) on the live v10.31 (`e592f9f5…`). Goes live on Andrew's "Upload".
