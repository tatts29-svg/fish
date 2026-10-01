# v7.70 — the Forecast P&L in the business's lines (DRAFT — design, then build)

Author: Andrew Fisher · 1 Oct 2026, 17:05 AEST

Andrew, 1 Oct 16:18: "maybe we can use this data to better present the forecast correct with correct terminology as well
as P&L — would be really good." Then, about 16:25: "I don't wanna see last year's." So: this year's figures only, in the lines
and words the business bills and reports in. The wording comes from the 2025 invoices and the July 2026 P&L (the
reference folders); no 2025 figure appears on the page.

## What the business's own paper calls things

| On the invoice to the V8s (2025) | On the P&L | On the page today |
|---|---|---|
| Hire Charges — one block per unit for the event, "QR" quoted rate, plant number or SUB item code | Hire Revenue (1005) for our gear; Rehire Revenue (1010) for SUB lines | "Hire on the contracts, by the rate" / "priced by us from the card"; Rehire in the by-branch table |
| "Transport Charge Each Way" per reference (Item TRANSPORT) | Transport (1030 Cartage Internal, 1031 Cartage External) | the delivery and pickup lines, $6,938 |
| PUMPOUT lines: "FWF Pumpout Service and clean", "Tank Pumpout and clean", "Sewer connect clean and restock" | Toilet Pumpouts (1032, in the Transport group); cost 3325 | "Toilet servicing — priced by us at our pump-out rates" |
| "Installation & Dismantling Charge" (toilet blocks), "Labour Charge" (buildings), "VMS nn — Labour", "Labour — Event Crew", "Installation — Project Manager", "Accomodation and travel" (Item INSTDISMEXTNL / LABOUR) | Installation (1047); cost 2142 external contractors, 2143 internal labour | "Labour — Install" (ticks per piece), "Event labour — the scope" |
| Hydration station, water fill, water deliveries, drinking-water tank | Consumables (1020); cost 2144 — as Finance coded last year's water | the four water lines, "at what we are charged" (v7.69) |
| "LTD Waiver Charge" — a line of its own under the totals | Damage Waiver (1015) | nothing — the 2026 contracts carry no waiver field yet |
| "Rehire" SUB-xxxx lines — fence per metre, barriers each, toilets, buildings | Rehire Revenue (1010); cost 2126 Re Hire Contract Costs (2127 manual) | Rehire by branch |

## The card: "Forecast P&L — in the business's lines" (`pl770`, under the Forecast P&L, before Costs to job end)

Two money columns, **on the record** and **to job end**, both from the figures the page already holds (nothing
re-derived; every line reconciles to the Forecast P&L's totals, and the test proves it).

**REVENUE — charged to the V8s**
1. **Hire Revenue** (1005) · our own gear on the contracts, Rate 1 once for the event, the card where a line has none — *contracts by the rate and from the card, less the hired-in lines and the delivery lines below*.
2. **Rehire Revenue** (1010) · hired-in gear at our rates — the Event Portables toilet lines, the two SUB lines, NVAC's sub-hired forklifts, Advanced's fencing dockets (+ the programme to come).
3. **Transport Revenue** (1030/1031) · delivery and pickup lines on the contracts — *$6,938 today*.
4. **Toilet Pumpouts** (1032) · servicing at our pump-out rates, the water truck and pre-fill at what we are charged.
5. **Consumables** (1020) · water deliveries and the drinking-water tank at what we are charged.
6. **Installation** (1047) · Labour Install ticked per piece, the event labour scope (people, accommodation and travel) — *and the installation inside the fencing card rate, not split out*.
7. **Damage Waiver** (1015) · *not on the 2026 contracts — the branch to say*.
8. **Total Revenue** — equals the Forecast P&L's revenue to the cent.

**DIRECT COSTS — what Coates pays**
1. **Rehire** (2126/2127) · Event Portables' toilet hire (Q6845 and Q6847 lines, delivery and pickup), Advanced's gear.
2. **Toilet Pumpout Costs** (3325) · Event Portables' servicing lines, the water truck and pre-fill (Q6844).
3. **Consumables** (2144) · the water deliveries and tank (Q6846).
4. **Transport** (2120) · the carriers' figures (+ the card for the loads without one).
5. **Installation — external contractors** (2142) · Advanced's crew (dockets and the green book).
6. **R&M** (2357) · the tracker's equipment line.
7. **Total Direct Costs** — the ledger's lines; beside it, in grey, *job costs the P&L carries as overheads*: Travel & Accommodation (3520), Printing (3501) — so this total plus those equals the Forecast P&L's "direct costs known".
8. **Wages** beside, never added (Direct Staff 3210, or 2143 if charged to the install — Finance to say).

**GROSS MARGIN** = Total Revenue − Total Direct Costs · **GM %** · on the record and to job end. The main card's
"Difference so far" is unchanged (it takes the overhead-type costs off too).

**RECOVERY — the ratios the business reads**: Rehire Recovery (1010 ÷ 2126), Transport Recovery ((1030 + 1031 + 1032) ÷
(2120 + 3325)), Consumables Recovery (1020 ÷ 2144), Installation Recovery (1047 ÷ 2142, with "our own install hours are
not priced" said once). Each on the record and to job end. No comparison figures on the page.

**THIS YEAR'S QUESTIONS, named under the card** (not figures, not last year's):
- *Transport*: the contracts carry $6,938 of delivery and pickup against $22,011 paid to carriers so far — are the
  "Transport Charge Each Way" lines still to go on the contracts?
- *Damage waiver*: none on the 2026 contracts — does LTD waiver apply, and at what rate?
- *Fencing*: the card rate bundles hire and installation — the split for 1010 and 1047 is Advanced's to give.

(An earlier draft had a "Rate 1 reads as a weekly figure" flag on the toilet lines. Withdrawn: the Street Rate Card
2026 — `../reference_street_rate_card_2026/` — prices the FWF single at $90.07 for the event and the accessible toilet
at $337.75, with install, demob and pump-outs as their own lines. The contract lines are right. No flags from last
year's figures, anywhere: Andrew, 16:48, "I don't need you flagging info from last year.")

## Build

`patch_v770.py` adds `pl770Model()` and `pl770Card()`, places the card in `renderCosts` after the Forecast P&L, adds the
glance link and a print fold. Nothing existing changes; every figure is read from `moneySummary()`, `rh766Model()`,
`servicing748()`, `cj764Model()`, `fencePaidSplit()`, `DATA.rehire_quotes` and `ONHIRE_ROWS`. Test: the revenue lines
add to `charge.total`; the cost lines plus the overhead-type costs add to `cost.known`; the to-job-end column adds to the
Costs to job end card's figures; the ratios recompute; the flags count; no NaN; desktop and phone; nothing on the record
moves.
