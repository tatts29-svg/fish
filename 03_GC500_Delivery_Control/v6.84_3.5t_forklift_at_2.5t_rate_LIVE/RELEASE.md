# v6.84 — LIVE 27 Sep 2026, on Andrew's instruction: "If we didn't supply enough 2.5t then the 3.5t is the same rate as the 2.5t"

Author: Andrew Fisher

Built from v6.83 + `patch_v684.py`. The v6.81 draft fixes are still not in.

## What changed
The card has no 3.5 t forklift line. T0085 (3.5 t standard forklift, Supply, 6–26 Oct) had no rate, and is now priced on the card's 2.5 t standard line: $123.31/day × 21 days = **$2,589.44**. The reason is written on the line.

This agrees with the rule already in place, that the rate follows what was asked for. For example, T0004 (a 2.5 t ask, filled by the 3.0 t container forklift 1197839) is charged at the 2.5 t rate.

**Effect:** the card hire comparison goes from $199,922.05 to $202,511.49, and card transport rises by $500. The contract charges total is unchanged.

## Forklift supply check (rental system, 27 Sep 2026) — `fork.json`

| Asked (schedule) | Supplied |
|---|---|
| T0003, 5 t, Phillip Park, from 11 Sep | NVAC line 31, subhired 5 t with 1.8 m tynes, delivered 11 Sep (PO 4647983) |
| T0004, 2.5 t, Phillip Park, from 11 Sep | NVAC line 21, 3.0 t container forklift 1197839, delivered 11 Sep; charged at 2.5 t |
| T0005, 2.5 t RT ×2, Macintosh, from 14 Sep | 1312577 on hire. 1247787 was returned 17 Sep; AT009 (PO 4654789) covered 17–18 Sep; 1247787 is booked back from 30 Sep with tyne rotator 1302007. **One short from 18 Sep to 30 Sep on the rental record** |
| T0085, 3.5 t std, Supply, from 5–6 Oct | 1210921 (3.5 t) booked from 5 Oct, plus fork extensions 1262224 |
| T0109, 2.5 t std, Events, from 12 Oct | 1214298 booked from 12 Oct |

**Not on the schedule:** MEAD contract 9968726 has a 2.5 t RT (1298390) and a 5.0 t RT (1321364), with transport, booked 19–27 Oct.

**NVAC contract 9961976 has no rate on any forklift line.** At card rates the forklifts are worth about $52,105 over the job, so this needs checking against Baseplan's billing.

## Checks
- **Local:** deep data audit shows no issues; running sheet is clean; accessibility is clean.
- **Live:** `/v/` equals the build byte for byte; T0085 shows $2,589.44.
