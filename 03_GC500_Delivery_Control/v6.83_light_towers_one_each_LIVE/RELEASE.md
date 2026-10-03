# v6.83 — LIVE 27 Sep 2026 (about 05:45 AEST), on Andrew's instruction: "Light towers qty 1 yes"

Author: Andrew Fisher

Built from v6.82 + `patch_v683.py`. The v6.81 draft fixes are still not in; they wait on Andrew's yes.

## What it does
- **Which references:** the 17 light towers (LT01–LT04, LTC01–LTC14). Each has no asset numbers and no schedule quantity.
- **What they now ask for:** 1 each.
- **The rule:** it applies where the only charge line is a Light Tower with no quantity and the reference is named as a single numbered tower.
- **What the line says:** it gives the reason, and a quantity a person types still wins.

## Effect (live, verified)

| | Before | After |
|---|---|---|
| Labour charged | $12,809.50 | $12,809.50 (no light-tower labour ticked yet) |
| Labour to come | $23,126 | $24,630 |
| Labour later (demob) | $34,702 | $36,206 |
| Labour lines with no quantity | 34 | **0** |
| Charges total | $401,622.58 | $401,622.58 |

The quantity questions on the Questions page are gone. Review items R01, R02 and TX04 remain for the branch to confirm.

## Checks
- **Local:**
  - deep data audit shows no issues;
  - 68 running-sheet days are clean;
  - navigation is clean on phone;
  - accessibility is clean.
- **Live:**
  - `/v/` equals the build byte for byte;
  - no page errors.

## Rollback
Re-upload v6.82.
