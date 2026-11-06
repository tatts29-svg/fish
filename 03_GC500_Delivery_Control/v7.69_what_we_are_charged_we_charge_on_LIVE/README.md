# v7.69 — what we are charged, we charge on (LIVE)

Author: Andrew Fisher · 1 Oct 2026

## Released — 1 Oct 2026 17:02 AEST

The combined v7.68 + v7.69 release is live: **8,637,431 bytes**, SHA256
`ea4643899d33b677c0911b679b0b3e97e5610fe686ab383a39a239a34baf2c43`.
The uploader verified the public view byte for byte. Final review corrected the tank helper to preserve a single
numbered piece and the unnumbered remainder of a partly numbered order, retaining existing ticks.
Seven synthetic regression cases pass; fresh v7.69 desktop/phone checks pass 18/18 each, tank phone checks 16/16,
and both sweeps pass 21 tabs and seven deep links without page or console errors. Phone screenshots inspected.
The earlier build evidence below is historical; `evidence/release.json` records this released candidate.


Andrew, 1 Oct 16:40 AEST, reading the Questions page's "Water services — customer rates still required … Supplier cost is
not the rate charged to the V8s, so no Revenue is assumed": **"all our cost — what we charge should cover what we get
charged."**

## The rule

Every Rehire cost has a Rehire Revenue at least equal to it. Where the card has no line and the branch no rate, the line
is charged to the V8s at the supplier's figure — the floor, never less — until a rate lands, and says so. A rate typed on
Costs stands in; one under the supplier's figure is flagged. (Now in `AGENTS.md`, in Andrew's words.)

## What it changes on the page

The four water lines on the Event Portables quotes were in the approved Rehire cost and charged to the V8s at nothing:

| Line | Quote | Qty | Supplier's figure | Charged on now |
|---|---|---|---|---|
| Water Truck | Q6844 | 1 | $6,800.00 | $6,800.00 at cost |
| Water Truck - Pre fill | Q6844 | 1 | $2,800.00 | $2,800.00 at cost |
| Water delivery | Q6846 | 6 × $375.00 | $2,250.00 | $2,250.00 at cost |
| 3000 Ltr Free Drinking Water Tank | Q6846 | 1 (6 weeks at $350 a week) | $2,100.00 | $2,100.00 at cost |
| | | | **$13,950.00** | **+$13,950.00 Rehire Revenue** |

The supplier's figure is the quote's own total for the line (Q6846 prints the tank as 6 weeks × $350 = $2,100); an earlier reading of the
data block had the tank at $350 and was corrected in the 1 Oct adversarial review.

1. `servicing748()` carries the water lines at the quotes' own figures (`at_cost`, with `service|<description>` as the
   typed-rate key) inside the servicing total — so the P&L's revenue, the Rehire by branch toilets group, the accrual's
   event forecast and the Costs card all follow from the one figure. A rate typed under the supplier's figure is **not
   applied** (the floor holds) and the line says so. `card_lines`, `card_total`, `at_cost_total`, `their_water` and
   `under` (lines with a typed rate that was not applied) are returned beside.
2. The P&L line reads "Toilet servicing, cleaning and water — KINP rehire, priced by us at our pump-out rates · the water
   at what we are charged"; its working names each water line "(at cost)", says what Event Portables charge us for the
   servicing ($46,545) and the water ($13,950), and names any rate typed under cost as not applied. The branch note, the
   stream notes, the management email, the hub card and the Rehire by branch group all say "pump-outs at the card, water
   at what we are charged" instead of "at our pump-out rates". The gap "water services have no
   customer rate" is a caveat now ("charged on at what Event Portables charge us … until the branch puts a rate on").
3. The Costs card's servicing table lists the water lines with "at cost — what Event Portables charge us" and a rate box
   each; the old "Not charged — no line on the card … Needs a price agreed" hint is gone.
4. The Questions item `water-service-rate753` is answered in Andrew's words, with the four lines and their figures.
5. The Rehire by branch card: "Andrew's rule (1 Oct 2026): 'what we charge should cover what we get charged'" with the
   business's figure to job end (Rehire Revenue ÷ Rehire cost plus Installation — external contractors, Advanced's crew
   counted in what we are charged), and each group's own line: "covers what we are charged — ×1.41: $168,144 charged
   against $118,575 Rehire cost to pay", or "supplier cost not on the record — cover cannot be checked" (the two SUB
   lines, the NVAC forklifts), or "SHORT of what we are charged by $…" if ever it is.
6. The accrual row keeps its name (Finance's wording keys on it); its basis names the water lines and its source Q6846.

Nothing on the record changes. Revenue on the record rises by exactly $13,950 (the servicing line); costs do not move
(the $13,950 was already in the approved Rehire cost). Last year Finance coded the water truck with the pump-outs and
the water deliveries and tank as consumables (`../reference_2025_contracts_and_invoices/event_portables_2025.md`) — the
ledger homes for these lines when the P&L is presented in the business's lines (v7.70).

## Files

- `patch_v769.py` — the eight replacements; `python3 patch_v769.py <page.html>` (needs v7.68 first).
- `evidence/practice_tests.js` — the water lines at cost; the pump-outs unchanged; servicing is the revenue line; the
  toilets group follows; the gap is a caveat; the P&L says so; the card lists the lines; the Rehire card says who covers;
  the business's cover is right; revenue up by the water only against the live page read at the same moment; a rehearsed
  typed rate stands in and one under cost is flagged (writes blocked); no broken values; no overflow; no errors.

## Build

```
bash toolchain/build.sh v7.69 v7.68_waste_tank_is_a_piece_of_work_LIVE/patch_v768.py v7.69_what_we_are_charged_we_charge_on_LIVE/patch_v769.py
python3 toolchain/upload_page.py build/GC500_v7.69/GC500_Delivery_Control_hosted.html
```

## Results — the chain on the corrected build `build/GC500_v7.69` (8,637,181 bytes, SHA-256 `383051df1f6e0058…`; v7.68 + v7.69 on the live v7.67), 1 Oct 2026 16:20–16:38 AEST

| Check | Desktop | Phone |
|---|---|---|
| v7.69 practice tests (`evidence/practice_results*.json`) | **18/18** | **18/18** |
| v7.68 waste tank is a piece of work (`regress/v768*`) | **16/16** | **16/16** |
| v7.67 priced by us (`regress/v767*`) | **12/12** | **12/12** |
| v7.66 rehire by branch (`regress/v766*`) | **18/18** | **18/18** |
| v7.64 costs to job end (`regress/v764`) | **22/22** | — |
| v7.65 the Costs tab in one flow (`regress/v765`) | **22/22** | — |
| v7.63 accruals in Andrew's words (`regress/v763`) | **33/33** | — |
| Codex's six synthetic checks | 6/6 | — |
| Sweep, 21 tabs (`regress/sweep_*.json`) | 21 tabs, 0 errors, 0 console | 21 tabs, 0 errors, 0 console |

Against the live page read on the same record at the same moment: revenue +$13,950.00 (the servicing line), Rehire
Revenue to job end +$13,950.00, labour, direct costs known and Rehire cost unchanged.

## The adversarial review (1 Oct, three lenses, every finding verified against the code) and what changed

Confirmed and fixed: the drinking-water tank is $2,100 on Q6846 (6 weeks at $350), not $350 — the floor now uses the
quote's own total; a typed rate under the supplier's figure was charged as typed — now not applied, and the line says so;
six places (the hub card, the Costs card, the branch note, the stream note, the management email, the Rehire by branch
group) still said "at our pump-out rates" for a figure holding the water — all say "pump-outs at the card, the water at
what we are charged"; the Questions card-estimate item quoted the whole $97,302 as pump-outs — it quotes the pump-outs
only; the fencing cover left Advanced's crew out — the cover counts Installation — external contractors; renaming the
accrual row broke Finance's wording — the row keeps its name, its basis names the water and its source Q6846; Andrew's
words are quoted ("should cover"), not paraphrased; the cover sentence says "to pay" for a forecast; the P&L working is
short sentences. Noted, by design: the business cover counts Rehire Revenue for groups whose cost is not on the record,
and says so ("before the N supplier costs not on the record").

**READY TO UPLOAD** with v7.68 — one build, two patches on the live v7.67:
```
bash toolchain/build.sh v7.69 v7.68_waste_tank_is_a_piece_of_work_LIVE/patch_v768.py v7.69_what_we_are_charged_we_charge_on_LIVE/patch_v769.py
python3 toolchain/upload_page.py build/GC500_v7.69/GC500_Delivery_Control_hosted.html
```
