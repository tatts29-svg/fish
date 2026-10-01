# v7.69 — what we are charged, we charge on (DRAFT: built and tested with v7.68 on the live v7.67)

Author: Andrew Fisher · 1 Oct 2026

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
| 3000 Ltr Free Drinking Water Tank | Q6846 | 1 | $350.00 | $350.00 at cost |
| | | | **$12,200.00** | **+$12,200.00 Rehire Revenue** |

1. `servicing748()` carries the water lines at cost (`at_cost`, with `service|<description>` as the typed-rate key) inside
   the servicing total — so the P&L's revenue, the Rehire by branch toilets group, the accrual's event forecast and the
   Costs card all follow from the one figure. `card_lines`, `card_total`, `at_cost_total`, `their_water` and `under`
   (lines typed under the supplier's figure) are returned beside.
2. The P&L line reads "Toilet servicing, cleaning and water — KINP rehire, priced by us at our pump-out rates · the water
   at what we are charged"; its working names each water line "(at cost)", says what Event Portables charge us for the
   servicing ($46,545) and the water ($12,200), and flags any line typed under cost. The gap "water services have no
   customer rate" is a caveat now ("charged on at what Event Portables charge us … until the branch puts a rate on").
3. The Costs card's servicing table lists the water lines with "at cost — what Event Portables charge us" and a rate box
   each; the old "Not charged — no line on the card … Needs a price agreed" hint is gone.
4. The Questions item `water-service-rate753` is answered in Andrew's words, with the four lines and their figures.
5. The Rehire by branch card: "Andrew's rule (1 Oct 2026): what we charge covers what we get charged" with the business's
   figure to job end (Rehire Revenue ÷ Rehire cost), and each group's own line: "covers what we are charged: ×1.40
   ($166,394 charged against $118,575 paid)", or "supplier cost not on the record — cover cannot be checked" (the two SUB
   lines, the NVAC forklifts), or "SHORT of what we are charged by $…" if ever it is.
6. The accrual row is named "Toilet servicing and water — event forecast".

Nothing on the record changes. Revenue on the record rises by exactly $12,200 (the servicing line); costs do not move
(the $12,200 was already in the approved Rehire cost).

## Files

- `patch_v769.py` — the eight replacements; `python3 patch_v769.py <page.html>` (needs v7.68 first).
- `evidence/practice_tests.js` — the water lines at cost; the pump-outs unchanged; servicing is the revenue line; the
  toilets group follows; the gap is a caveat; the P&L says so; the card lists the lines; the Rehire card says who covers;
  the business's cover is right; revenue up by the water only against the live page read at the same moment; a rehearsed
  typed rate stands in and one under cost is flagged (writes blocked); no broken values; no overflow; no errors.

## Build

```
bash toolchain/build.sh v7.69 v7.68_waste_tank_is_a_piece_of_work_DRAFT/patch_v768.py v7.69_what_we_are_charged_we_charge_on_DRAFT/patch_v769.py
python3 toolchain/upload_page.py build/GC500_v7.69/GC500_Delivery_Control_hosted.html
```

## Results

_(filled in when the chain finishes)_
