# v11.94 Costs: the P&L all in

**LIVE 25 Oct 2026 01:25 AEST.**
- Page `0df3556fc262a022b8ccd6fce04c780ce3e415bbc3677832392572ff9ef9194b` (21,978,916 bytes), built on v11.93 `e49bca1a…`.
- Guarded upload. The view link serves the build byte for byte; a separate public download at 01:25:02 matched every byte.
- On the live page, `tests/test_native1194.cjs` passed 13/13 on desktop and 13/13 on phone. Screenshots are in `evidence/live/`.

Author: Andrew Fisher · 25 Oct 2026

Andrew, 25 Oct 2026 (this chat): "costs sorted. P&L sorted. Clean and tidy. All costs should be all in. We should know how much.
Including demob. Apart from fencing. Should be simple. Whats the additional forecasf. This should be 0. We should know all costs.
Everything is onsire. Only thing we wont know. Is fencing". And: "We need this to look amazing . We now have amanagrmnt looking".

## What the "additional forecast" was

It was the rest of the job still to happen, mostly demob, not unknowns. This is what it held on the live page:

| Still to come | Amount | What it is |
|---|---|---|
| Fencing, Advanced's decon weeks 1–3 | $26,522.40 Revenue · $10,350.00 cost | the 2026 programme's remaining weeks: the one true estimate |
| Transport (cartage) | $23,660.56 | demob loads at the card's cost per item ($15,013) and the average so far ($8,648) |
| Labour hire | $40,196.70 | the running sheet's race-weekend and demob shifts at the rates on the record |
| Salary allowance | $14,700.00 | the living-away and uplift allowance, once (labour, Andrew 9 Oct 2026) |
| Accommodation | $4,174.31 | 20 booked nights at the person's own average until the invoice comes (Andrew 23 Oct 2026) |
| Sub-hire, calculated | $5,384.98 | Premiair and Royal Wolf lines, contract rate × days to off-hire |
| Hire Revenue | $2,702.02 | hire to the term date |

## What changed

**The P&L card** (Costs → "Whole-job P&L · all in") has two columns:

| | Job total · all in | Of which · fencing still to come |
|---|---|---|
| Total Revenue | $1,022,962.43 | $26,522.40 |
| Total Direct Costs | $435,415.83 | $10,350.00 |
| Gross Margin · all in (57.4%) | $587,546.60 | $16,172.40 |
| Labour hire and salary allowance | $82,964.27 | — |
| Travel, accommodation, meals and printing | $29,273.55 | — |
| Difference · all in, not a margin yet | $475,308.78 | $16,172.40 |

- **Job total · all in** is every line to job end: the record so far plus the rest of the job at the known rates, demob included.
- **Fencing is the only figure still to come.** Every other line shows a dash.
- **Coates wages and salary stay in hours only** (1,471.5 h), as Andrew ruled on 23 Oct 2026. That's why the bottom line still says
  "not a margin yet".
- **One line under the table names what isn't in it yet**, from the page's own cost gaps:
  - fencing relocation and removal by the hour;
  - final carrier figures;
  - 36 planned transport movements needing a rate or scope;
  - 17 demob movements unpriced;
  - one accreditation task with no transport basis;
  - Coates wages in hours.
- **Across Costs**, "Additional forecast" now reads "Rest of the job" and "Job forecast" reads "Job total". That's two entries in the
  P&L module's own label map.
- **Money is right-aligned** in even-width figures. On a phone each line is a card, with the fencing figure only where it applies.

**Presentation only.** Every figure comes from the page's own models (`pl770Model`, `cj764Model`, `branchFinancial978`), unchanged.
- The new wrapper checks that revenue, direct costs and the difference tie to the cent before it shows anything.
- If they don't tie, the card stays exactly as it was.

**Not touched:** no record, rate, servicing, crew card, QR code or server change.

## Checks

- **Toolchain:** PASS, 187 inline scripts.
- **`tests/test_rules1194.cjs` 18/18:**
  - the build is the live page plus this block, the two label lines and the footer only;
  - today's own figures to the cent: every group, the totals, 57.4%, and fencing the only figure still to come;
  - a cent out, a missing line or a difference that doesn't add up leaves the card as it was;
  - the "not in it yet" wording.
- **`tests/test_native1194.cjs` 13/13 desktop and 13/13 phone,** on the real Costs tab reading the live record:
  - all 14 rows on the screen match the models' figures to the cent;
  - fencing appears on exactly six rows;
  - every cost gap is named;
  - the definitions are there;
  - "Additional forecast" and "Job forecast" no longer appear anywhere on Costs;
  - the phone cards; no sideways scroll; 0 page errors, 0 record writes.
- **Full sweeps** desktop and phone: 27 tabs, 19 shown, 7 deep links, Back; 0 errors, 0 writes.
- **Screenshots** of the card and its foot, on desktop and phone, are in `evidence/`.

## For Andrew to decide

The 17 demob movements and 36 planned movements have no rate on the record. They are named, not priced, because a rate can't be
made up. Give the rates, or say "use the average so far", and they go in. Then the only open line is fencing.

```
toolchain/build.sh v11.94 v11.94_pl_all_in_LIVE/patch_v1194.py
PAGE=build/GC500_v11.94/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.94/base_live.html node v11.94_pl_all_in_LIVE/tests/test_rules1194.cjs
PAGE=build/GC500_v11.94/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node v11.94_pl_all_in_LIVE/tests/test_native1194.cjs
```

Implemented and tested by Claude, for Andrew; not reviewed by Codex.
