# v12.19 — the V8s charged on Advanced's quantities

Author: Andrew Fisher. 25 Oct 2026. **LIVE 16:57 AEST**: the view link serves `6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16` byte for byte (15,366,122 bytes); `tests/test_v1219.cjs` 15/15 against the live page (`evidence/test_live.txt`).

Andrew (Claude's chat): "we work off the advanced fencing qty we have the cost we pay advanced - same qty we have the charge we chARGE V8". Before that: "what we are being invoiced for is what we will charge V8s for simple", and the Pay and charge table (`review_25Oct2026_baseplan7/`, commit 744dd539).

| | Before | After |
|---|---|---|
| V8 fencing charge | $340,871.73 | $364,816.40 |
| What we pay Advanced | unchanged | unchanged |
| P&L Rehire Revenue | $398,702.68 | $422,647.35 |
| Gross Margin | $536,013.20 | $559,957.87 |

## Rule
- **Dockets on Advanced's approved sheets (115)** are charged on the sheet's quantities, at the 2026 card or the named rates:
  - clean, scrim and pedestrian gates as billed;
  - vehicle gates at $40.40 each, the 2.5 m of fence a gate takes the place of;
  - bases at the card's block rate, $3.02;
  - relocation hours at $142;
  - CCB on their metres, split by the docket's own types.
- **Week 6 and the event week (52 dockets)** stay on our dockets, with vehicle gates priced the same way.
- **Labour notes:** 108.5 h at $142 = $15,407. This replaces the 25 Sep 2026 wording "a cost only".
- **At cost:** team leader $9,200, weed mat $2,580, shade cloth $784, and order 4658850 $195. This replaces the team-leader rule of 15 Oct 2026.
- These extras are fencing lines on the Costs tab, so the Fencing tab, the Costs category, the branch roll-up (STPS) and the P&L read one figure.
- Area metres, Today and progress stay on the papers.
- No double charge with the C004 event scope: the labour notes are 19–22 Oct; the C004 fence team works the race days.

## Checks
- `tests/test_v1219.cjs` (base = live v12.18, side by side): 15/15 on desktop and 15/15 on phone.
- `check_page`: PASS.
- Both full sweeps: 27 tabs and 7 deep links, 0 errors, 0 console messages, 0 writes.
- Phone screenshots: `evidence/`.

Build: `toolchain/build.sh v12.19 v12.19_invoiced_qty_LIVE/patch_v1219.py`, on live v12.18 `677b41fce24fafdc1795259a272b4770c5d719e1dd2b3be245909ee484d0b4d4` → `6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16`, 15,366,122 bytes.
