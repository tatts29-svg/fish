# v7.70 — the Forecast P&L in the business's lines (BUILT on the live v7.69 — results below)

Author: Andrew Fisher · 1 Oct 2026, 17:25 AEST

Andrew, 1 Oct 16:18: "maybe we can use this data to better present the forecast correct with correct terminology as well
as P&L — would be really good." About 16:25: "I don't wanna see last year's." 16:50, with the Street Rate Card 2026 beside
the page: "this info is literally trying to help us come up with correct logic on how things are getting priced, and how
we can do things better and split things into the correct kitty." 16:51: "I have management looking at GC500 tonight.
Please make sure the costs are all up to date with as much data as possible. No bugs, it's clean and tidy and easy to
understand." 16:57: "I need both yourself and Codex working together, making this a wow factor, like we know what we
are doing."

So: this year's figures only, on the lines and in the words the business bills and reports in. The line names and codes
are the Coates P&L's (the July 2026 statement in `../pl_guide_01Oct2026/`); the kitty each charge goes to is the 2026
street card's column for it (`../reference_street_rate_card_2026/`). No 2025 figure appears on the page.

## The card: "The Forecast P&L in the business's lines" (`#pl770`, under the Forecast P&L, before Costs to job end)

Two money columns, **on the record** and **to job end**, both from the figures the page already holds — nothing
re-derived — and the card checks itself: the revenue lines add to the Forecast P&L's revenue and the cost lines plus the
below-the-line costs add to its direct costs known, to the cent; to job end, both equal the Costs to job end card's
figures. If a line ever fails to reconcile the totals row says so instead of pretending.

**Revenue — charged to the V8s**

| Line | What it reads from | On the record today |
|---|---|---|
| 1005 Hire Revenue | the contracts by the rate and from the card, less the delivery lines and the hired-in lines | $187,300 |
| 1010 Rehire Revenue | the Event Portables toilet lines, the SUB lines and the sub-hired forklifts (the Rehire by branch groups, less the servicing the toilets group carries) + Advanced's fencing dockets at the card; to job end + the fencing programme to come | $203,691 (job $452,500) |
| 1030 · 1031 Transport Revenue | the delivery and pickup lines on the contracts | $6,938 |
| 1032 Toilet Pumpouts | the servicing at the card's pump-out rates + the water truck and pre-fill at cost (Q6844) | $94,702 |
| 1020 Consumables | the water deliveries and the drinking-water tank at cost (Q6846) | $4,350 |
| 1047 Installation | Labour Install ticked per piece + the event labour scope (people, accommodation and travel) | $74,987 |
| 1015 Damage Waiver | nothing — not on the 2026 contracts; the card says waiver on the hire only; the branch's rate | — |
| **Total revenue** | = the Forecast P&L's revenue | **$571,967** (job $820,777) |

**Direct costs — what Coates pays**

| Line | What it reads from | On the record today |
|---|---|---|
| 2126 · 2127 Rehire | Event Portables' Q6845 and Q6847 (the toilet hire with their delivery and pickup) + Advanced's gear on the dockets; to job end + the fencing programme at Advanced's rates | $132,602 (job $312,692) |
| 3325 Toilet Pumpout Costs | Q6844: the service visits, tank pump-outs, block cleans, the water truck and the pre-fill | $56,145 |
| 2144 Consumables | Q6846: the water deliveries and the tank, with their delivery and pickup | $4,850 |
| 2120 Transport | the carriers' figures; to job end + the loads without a figure at the card and the average | $22,011 (job $44,376) |
| 2142 Installation — external contractors | Advanced's crew on the dockets + the green book | $2,100 |
| **Direct costs — the ledger's lines** | | **$217,708** (job $420,162) |
| 3520 · 2357 · 3501 Travel and accommodation, meals, R&M, printing | the tracker — job costs the P&L carries below the direct lines | $17,664 (job $24,249) |
| **Direct costs known — the Forecast P&L's figure** | = the Forecast P&L's direct costs known; to job end = the Costs to job end card | **$235,372** (job $444,411) |
| 3210 · 2143 Wages | beside, never added — Direct Staff, or Installation internal labour if charged to the install; Finance says which | $6,925 (job $31,824) |

The four Event Portables quotes are split by what each line is (the quote's own delivery and pickup go with its
largest kitty); the split adds back to the P&L's rehire figure to the cent, and if it ever did not the whole figure
would stay on Rehire and the two lines would say "inside the Rehire figure above".

**Gross margin** = revenue − the ledger's direct lines, with the %, on the record and to job end (before wages, travel
and accommodation; "not a result until the branches have billed"). **Difference** = the Forecast P&L's "Difference so
far" and, to job end, the At a glance figure after priced wages — the same numbers as the cards above.

**Recovery — the ratios the business reads**: Rehire Recovery (1010 ÷ 2126), Transport Recovery ((1030 + 1031 + 1032) ÷
(2120 + 3325) — the P&L groups the pump-outs with transport; the words give cartage alone: $6,938 on the contracts
against $22,011 paid to carriers, the transport charge lines being the branch's to add), Consumables Recovery (1020 ÷
2144 — under one today because Q6846's $500 delivery and pickup are not charged on yet; the words say so), Installation
Recovery (not readable yet: our own install hours carry no wage rate and the fencing install sits inside the fence
rate — the words say so). On the record and to job end.

A line in the At a glance flow jumps to the card ("In the business's lines — the same figures on the P&L's own lines,
with the recovery ratios").

## What it is not

Not a new total anywhere; not a comparison with any other year; not a change to any existing figure, card or wording.
`patch_v770.py` only inserts: the two functions before the Rehire by branch block, one line in `renderCosts`, one line
in the At a glance flow, two CSS rules. The diff of the build against the live page shows the three anchor lines
re-emitted with the insertions and nothing else removed.

## Corrected after the three-lens review (17:30)

Arithmetic: every figure recomputed independently from the page's functions matched to the cent — no change. Wording
and robustness, fixed: the direct-costs tile is the Costs to job end figure ($444,411) with the ledger split in its
note, so three cards no longer show two "direct costs to job end"; the difference tile is "Difference before
overheads — the P&L's Gross Margin once the costs are complete", never "margin" on its own, and the fourth tile is
the Forecast P&L's own "Difference so far — not a margin yet" (its figure, to the dollar); the 1010 and 2126 lines
bridge to the Rehire by branch card's figures ("the Rehire by branch card's $302,742 less the $99,052 of servicing
and water the P&L posts to Toilet Pumpouts and Consumables below"; "the Forecast P&L carries the four quotes as one
Rehire cost of $118,575"), and Rehire Recovery names that card's ×1.47 beside its own ×1.45; one classification of the
quote lines on both sides (the same `kit()`), so a renamed line can never land on different lines for revenue and
cost; R&M (2357, the tracker's equipment lines, $578) on its own direct line, the below-the-line row being travel,
accommodation, meals and printing (3520 · 3501); the transport line reads "2120 · 2140" with the recoverable / not
recovered words; the wages row reads "Temporary Staff · 3210 · 2143" (Job Connect's people); cleaning and fire
extinguishers land where their words say (fire extinguishers on Hire Revenue, cleaning on a 1025 line when ticked —
both nought today); Hire Revenue says "gear on the contracts not booked as hired in" and "Rate 1 over the event —
forklifts, VMS and water barriers by the day from when they go in"; the words when the quotes are not approved
(the quoted figure, "not counted") or the dockets not split ("gear and crew together"); quote names joined with
commas and "and"; "kitty" off the card; the Transport Recovery words give cartage alone to job end too (×0.16).

## Build

Built with v7.72 (the management tidy) on the live v7.71 (Codex's fencing forecast lookup, 8,638,736 bytes):
`bash toolchain/build.sh v7.72 v7.70_pl_in_the_business_lines_DRAFT/patch_v770.py v7.72_tidy_for_management_DRAFT/patch_v772.py`
→ `build/GC500_v7.72/GC500_Delivery_Control_hosted.html` **8,662,539 bytes, SHA-256 `8695ee3806155d87…`**, check_page
PASS (secrets 0). (An earlier build of v7.70 alone on the live v7.69 — 8,656,702 bytes — was 27/27 before the review's
corrections.)

## Results

`evidence/practice_tests.js` — 26 checks on the build (GETs only; every write the page tries is aborted): the card is
drawn; the revenue lines add to the P&L's revenue and to job end to the Costs to job end card's figure; the cost lines
plus the below-the-line costs add to direct costs known and to job end to the Costs card; the four quotes split by
kitty add to the rehire figure, with Q6844 whole on 3325, Q6846 whole on 2144, Q6845 + Q6847 on 2126; Hire = contracts
− delivery − hired-in lines; Rehire = hired-in lines + fencing; Transport = the delivery lines; Pumpouts + Consumables
= the servicing line with the truck and pre-fill on the pump-outs; Installation = labour ticked + the scope; Damage
Waiver carries no figure; Difference so far = the P&L's and to job end = the glance's after priced wages; gross margin
and its %; Transport Recovery groups the pump-outs and names cartage alone; Installation Recovery not readable yet;
Consumables Recovery says what is not charged on; four recovery rows; no NaN / undefined / null / template leftovers;
nothing from another year; the twelve P&L codes read; the glance link; the Forecast P&L's revenue tile unchanged; the
card does not widen the page; no page or console errors. Desktop and phone.

The results table is filled in from `evidence/desktop_run.log`, `evidence/phone_run.log` and `evidence/regress/` when
the chain finishes (see the board).

## Open for the next patch (not tonight)

- Q6846's delivery and pickup ($500) are a cost we are charged and not charged on — Andrew's rule says charge it on.
  v7.72 or later: a line at cost beside the water lines.
- Damage waiver and the transport charge lines: the branch's to add to the contracts; the card names both.
