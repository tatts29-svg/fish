# v12.16 The fence under the scrim charged once, and GN20 back on the P&L

**LIVE 25 Oct 2026 14:18 AEST.**
- Page `4ab22e6bf6a9af93c255fd3732ae8ba57f047dccfb1d3be770b4b1ac7d8d0382` (15,347,262 bytes), built on v12.15 `786142f3…`.
- Guarded upload. The view link serves the build byte for byte; a separate public download at 14:19:00 matched every byte.
- On the live page, `tests/test_v1216.cjs` passed 14/14 (`evidence/test_v1216_live.txt`).

Author: Andrew Fisher · 25 Oct 2026

Andrew, 25 Oct 2026 (this chat):
- "we charge once": the scrim fence. The fencing breakdown had shown the fence under the scrim charged as clean, then again inside the scrim rate.
- "we then to make sure we update all costs and P&L with our data please".
- Earlier: "please add GN20 Back and all costs please add all this data back in". GN20 (the 350 kVA, 1276701) was on site after all. It went back on the record as GN20-A this morning: `../record_25Oct2026_gn20_back/`, record 10848 → 10870.

## What changed

**1. The fence under the scrim is charged once** (`fence1216_src.js`).
- The crews write the whole fence run as clean, scrimmed sections included. On 109 of the 115 dockets Advanced have invoiced, their clean metres are exactly the paper's clean, less the scrim and 2.5 m for each vehicle gate.
- The scrim rate is the fence with the shade cloth on it: $25.53 = the card's $16.16 fence + $9.37 cloth.
- So each priced docket with scrim carries one more line: "Clean — the fence under the scrim, charged once in the scrim". That's its scrim metres off the clean, at the clean rate.
- The paid side takes the same line off only where the docket is at Advanced's rate sheet. Their approved pricing (weeks 1–5) already bills the fence once.
- The papers' quantities stay as written. Progress, Today and the by-area metres read the papers, not the charge, so they don't move. The by-area table leaves the charge line out of its metres.

**2. GN20 back on the P&L** (data).
- Contract 9961976 line 6 (the 350 kVA 1276701) comes back from the source history to the on-hire rows. It reads Delivered from 30 Sep, matched to GN20-A by its asset number. This reverses v11.18's "never came".
- The on-hire summary, the 9961976 contract entry and the assignments are recounted.
- The register's GN20 entry now says where the set went.

**3. Footer:** v12.15 → v12.16.

## What it does to the figures (live record, at build time)

| | v12.15 | v12.16 | Change |
|---|---|---|---|
| Fencing charged (Fencing tab = Costs category) | $405,150.96 | $340,871.73 | −$64,279.23 |
| Fencing paid to Advanced | $250,273.20 | $244,173.20 | −$6,100.00 (event week, at their rate sheet) |
| NVAC hire (GN20-A, 30 Sep on) | $57,104.36 | $63,945.19 | +$6,840.83 |
| P&L: Hire Revenue | $223,277.89 | $230,118.72 | +$6,840.83 |
| P&L: Rehire Revenue | $462,981.91 | $398,702.68 | −$64,279.23 |
| P&L: Total Revenue | $1,022,962.43 | $965,524.03 | −$57,438.40 |
| P&L: Total Direct Costs | $435,415.83 | $429,315.83 | −$6,100.00 |
| P&L: Gross Margin · all in | $587,546.60 (57.4%) | $536,208.20 (55.5%) | −$51,338.40 |
| P&L: Difference · all in | $475,308.78 | $423,970.38 | −$51,338.40 |

- Weeks 4–6 are receipted, so those invoices stand at their order amounts. Only the unbilled event week moves on the paid side.
- Unchanged:
  - every docket's quantities;
  - Today (generators 15/15) and the area metres;
  - the fencing still to come ($26,522.40 / $10,350.00).

## Checks

- **Toolchain:** PASS, 197 inline scripts, no keys.
- **`tests/test_v1216.cjs`:** 14/14 on desktop and 14/14 on phone. It runs live v12.15 and the build side by side on the live record:
  - the charge is down by each docket's scrim metres at $16.1607, to the cent;
  - every docket's line is on the right side;
  - the quantities are unchanged;
  - the Costs category equals the Fencing tab;
  - the paid change is only on unbilled rate-sheet dockets, and the paid split ties;
  - Today and the area metres are unchanged, with no area below zero;
  - GN20-A carries line 6 from 30 Sep on NVAC, and NVAC is up by its hire;
  - the P&L model's own checks hold and the card renders;
  - the difference moves by exactly the three amounts;
  - the GN20 note and the footer;
  - 0 errors and 0 writes.
- **Full sweeps,** desktop and phone: 27 tabs, 19 shown, 7 deep links, Back; 0 errors, 0 console messages, 0 record writes (`evidence/sweeps.json`).
- **Phone screenshots** of the P&L card and a scrim docket (36759) are in `evidence/`, with names blurred.

**Not touched:** no record writes, no rate changes, no servicing, no crew card, no QR code, no server change.

Implemented and tested by Claude alone; Codex has not reviewed it.
