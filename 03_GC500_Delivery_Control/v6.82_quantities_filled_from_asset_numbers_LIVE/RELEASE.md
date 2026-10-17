# v6.82 — LIVE 27 Sep 2026 (about 02:36 AEST), on Andrew's instruction: "I need you just to fill it in automatically"

Author: Andrew Fisher

Built from v6.80 + `patch_v682.py`. The v6.81 draft fixes are **not** in this build; they still wait on Andrew's yes. They apply cleanly on top.

## What it does
- **Where it applies:** a reference that has exactly one charge line with no quantity.
- **The rule:** the quantity is worked out from its asset numbers, less the quantities already on its other lines. The asset numbers come from the schedule, recorded on site, typed here and the rental system, less any taken off.
- **What the line says:** "worked out from the asset numbers — …", and it keeps what the schedule wrote.
- **Overrides:** a quantity a person types still wins.
- **No asset numbers:** the reference stays unknown. That covers the 17 light towers.

**Filled today, 1 each:**
- P09, P13, P14, P15, P16, P41, P44 and P58: one portable building each, one asset number each.
- WC05: 2 asset numbers, one of them the waste tank on its other line.

**Check on the rule:** among references where the schedule does give every quantity, the asset-number count matches it in 71 of 76.

## Effect (live, verified)

| | Before | After |
|---|---|---|
| Labour charged (ticked) | $9,728.14 (99 of 125 ticks valued) | **$12,809.50** (125 of 125) |
| Charges total | $398,541.22 | $401,622.58 (+$3,081.36, labour only) |
| Labour expected / to come / later | $7,875 / $23,126 / $32,401 | $8,448 / $23,126 / $34,702 |
| Labour lines with no quantity | 87 | 34 (light towers) |

The card's hire and transport comparison figures also rise now that the quantities are known. They are comparison figures and are not in the charges total.

## Checks
- **Local:** deep data audit shows no issues; running-sheet hours unchanged; navigation clean on desktop and phone; accessibility clean.
- **Live:** `/v/` equals the build byte for byte; record version 1982 unchanged; no page errors.

## Rollback
Re-upload v6.80.
