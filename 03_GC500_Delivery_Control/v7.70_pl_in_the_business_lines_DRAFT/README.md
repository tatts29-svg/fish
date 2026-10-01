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

## Build

Built on the live v7.69 (Codex's upload of 17:02 AEST, 8,637,431 bytes, SHA-256 `ea4643899d33b677…` — v7.68 + v7.69
with his correction to the tank helper): `bash toolchain/build.sh v7.70 v7.70_pl_in_the_business_lines_DRAFT/patch_v770.py`
→ `build/GC500_v7.70/GC500_Delivery_Control_hosted.html` **8,656,702 bytes, SHA-256 `43c5b5629270c810…`**, check_page
PASS (secrets 0).

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
