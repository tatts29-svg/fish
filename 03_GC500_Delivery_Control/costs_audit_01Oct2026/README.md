# Costs audit — every cost right, everything forecastable forecast, the data clean (1 Oct 2026)

Author: Andrew Fisher · audit by Claude on the four-patch Costs build (v7.60–v7.63 on the live v7.59), the live record (version 3283) as at 12:30 AEST 1 Oct 2026

Andrew, 1 Oct: "All costs must be correct and accurate. And forecast as much as we can. Clean data, tidy, presentable — all in on GC500."

## 1. What is wrong or incomplete today (correctness)

| # | Finding | Effect | Fix | Owner |
|---|---|---|---|---|
| C1 | **Transport counts one load per reference.** WC05 went in on two trucks on 14 Sep (dockets 26067317 and 26067323, $290+ each); the P&L's transport cost takes the first figure per reference, so $290 is missed (36 loads $21,721 on the P&L; 37 loads $22,011 on the schedule). | Direct costs understated $290; the P&L and the Accruals section disagree | Count every load with a figure, by its docket, not one per reference | Claude (v7.64) |
| C2 | **Three fencing dockets are priced to the customer but not costed.** F010, F025, F027 carry relocation metres (50, 60, 27.5 m) charged at the card's $8.65/m ($1,190 revenue) but Advanced bill relocation by the hour, not the metre, so their cost shows $0. Those hours are the green book ($1,250, 12.5 h) — the same work, costed once there. | Not an error once stated; today it reads as three dockets with no cost | Say so on the dockets and in the fencing cost note; no figure changes | Claude (v7.64) |
| C3 | **Four dockets carry no quantities** (F003 36503, F019 36519, F023 36523, F030 36531): nothing to price either side. | Possible missing revenue and cost | Confirm what is on them with Advanced | Andrew |
| C4 | **One docket has no date** (workbook Week 6 row 3, $3,757 charge / $2,475 cost). The charge side dates it to the week's last day; the accruals model leaves it undated. | The two sections disagree by $3,757 revenue / $2,475 cost | Date it to the week's last day on both sides and say so | Claude (v7.64) |
| C5 | **Labour wages are unpriced for the Coates people** — 1,626 of 2,103 hours (Aaron Zelvis, Alfie Harris, Andrew Fisher, Jayden Paul, Wayne Crimmin). Only Job Connect is priced ($31,824). | The biggest cost on the job is hours, not dollars; the P&L says so but the business cannot see it | A cost rate per person or role, typed at **Set cost rate** under Month-end control; the forecast completes itself | Andrew (Finance for the rates) |
| C6 | **Alfie Harris: 31 accommodation nights with no rate** (his priced nights are $248.78 and $176.04). | Accommodation understated by about $6,600 | Type the rate on the tracker | Andrew |
| C7 | **Three sub-hired contract lines with no supplier cost**: refrigerated container SUB-2131 (ROY002, charged $1,428), forklift extension SUB-2527 (QUE011, $9.30), the 5 t forklift MISCITEM on 9961976 (charged $12,063). | Rehire cost understated; the margin on those lines is unknown | Supplier quotes or invoices | Andrew |
| C8 | **Two NVAC contract lines with no rate** (telehandler fork extension 1800 mm; forklift tyne rotator). | Revenue understated | A rate, typed on the Costs tab card, or confirm no charge | Andrew |
| C9 | **Water truck, pre-fill, water delivery, 3,000 L tank**: $12,200 of supplier cost inside the approved toilet quotes with no customer rate. | Cost with no revenue against it | Confirm the customer rate or that Coates wears it | Andrew |
| C10 | **Event Portables quote Q6846 ($4,850) has no hire dates**; Q6847 has delivery = collection (22 Oct). | Q6846 cannot be put in a month | Dates from Event Portables | Andrew |
| C11 | **The fence team of six on the event labour scope are not on the tracker** — their cost is not on the record while their charge ($36,715 of people) is. | Cost understated over the race weekend | Who supplies them and at what rate | Andrew |
| C12 | **Twelve September loads delivered 28 Sep have no transport figure yet** (GN01, P06, P38, P39, P42, WC01 ×2, WC41, WC42, WC43, WC50; WC81 on 14 Sep), and no October or November load has one. | Transport understated now and not forecast | Forecast from the card's transport cost per reference (C12 below); real figures as carriers invoice | Claude (forecast) · Andrew (figures) |

Nothing above changes a figure that is right today: the P&L's $555,930 revenue and $235,082 known direct costs reconcile line by line to the record as it stands.

## 2. What can be forecast now, from the record (forecast to job end)

The page forecasts revenue to job end ($555,930) but costs only to date ($235,082). These streams can be carried to job end from what is on the record, each with its basis stated and its unknowns named:

| Stream | To date (known) | To come (forecast) | Job forecast | Basis of the forecast · what is not in it |
|---|---|---|---|---|
| **Fencing — Advanced (STPS)** | $75,872 (63 dockets, weeks 6–3 at their sheet) + green book $1,250 | **about $109,900** | **about $187,000** | The 2026 fencing programme's quantities for construction weeks 2 and 1 and the event week × Advanced's rates (clean $10/m, scrim $24.40/m, CCB $5.40/m, V gates $50, ped gates $36). Not in it: relocation hours (billed hourly), hoarding 137 m, flat feet 136 m, WPF 135 m (no rate on Advanced's sheet), removal (no cost rate), and the deconstruction weeks (still carrying 2025 dates — a reference, not a plan) |
| **Fencing — revenue at the 2026 card (STPS)** | $120,913 (dockets to date) | **about $166,900** | **about $287,800** | The same programme quantities × the card (clean $16.16, scrim $25.53, relocation $8.65, ped gates $36.18, CCB event $7.51, demarcation $13.08; removal and V gates included in the metre). Not in it: hoarding, flat feet, WPF (no card line). **This is the largest gap on the page: the P&L's revenue forecast carries fencing to date only** |
| **Toilets — Event Portables (KINP)** | $0 invoiced | $118,575 | **$118,575** | The four approved quotes ex GST (Q6845 $54,230, Q6844 $56,145, Q6846 $4,850, Q6847 $3,350); "the final total may change" |
| **Transport (cartage)** | $22,011 (37 loads with a figure, 35 marked "and more") | **about $7,500 + the unrated loads** | **about $29,500 +** | The card's transport cost per reference for the 27 references still to be carried or without a figure (11 September, 16 October: $7,492). Not in it: 22 October/November loads without a reference or card line — at the average so far ($595 a load) about $13,100 more. Real carrier figures replace these as they land |
| **Accommodation** | $5,948 to date | $9,616 planned + 31 unpriced nights (about $6,600 at Alfie's own rates) | **about $22,200** | The tracker's nights; the unpriced nights at the person's own priced rates until a rate is typed |
| **Labour — wages** | Job Connect $6,285 (September, confirmed) | Job Connect $25,539 planned | **Job Connect $31,824; Coates people 1,626 h, no rate** | The running sheet's hours at the rates on the record. Needs C5 |
| **Meals, expenses, equipment R&M** | $1,381 + $719 (incl. radios $578) | not forecast | $2,100 to date | To date only; small |
| **Sub-hire on the contracts** | — | — | unknown | Needs C7 |
| **Event scope people not on the tracker** | — | — | unknown | Needs C11 |

**Forecast direct costs to job end, from the record today: about $390,000 known-plus-forecast, before Coates wages and the unknowns** (fencing $187,000 + toilets $118,575 + transport $29,500 + accommodation $22,200 + Job Connect $31,824 + expenses $2,100). Against a revenue forecast that, with the fencing programme carried to job end, rises from $555,930 to **about $722,800**. Both halves are forecasts with named gaps; neither is a result.

## 3. Presentation — one flow, no duplicates

The Costs tab today runs 53,000 characters in roughly 20 blocks, four of which say the same thing twice:

- "Are we making money?" (the v5.83 ledger) repeats the Forecast P&L above it; its streams, by-branch and categories are all in the P&L now.
- "Revenue — charged to the V8s by branch" repeats the P&L's By branch table.
- "Direct costs — known so far by the eight categories" appears inside the P&L and again as its own card.
- Transport appears as a P&L line, its own card, and an accruals row.

Proposed flow (v7.65): **1 At a glance** (Revenue forecast · Direct costs forecast to job end · Difference so far · what is not priced) → **2 Forecast P&L by branch** (v7.60) → **3 Costs to job end by category** (new: to date · to come · job forecast · basis) → **4 Month-end**: Accruals for Finance (v7.63) and Finance journals (v7.45) → **5 The detail**, folded: dockets, loads, tracker, purchase orders, the card. The old ledger and the duplicate by-branch card go; every figure keeps one home.

## 4. Build plan

| Version | What | Status |
|---|---|---|
| v7.60 → v7.63 | Costs in Andrew's structure; Accruals for Finance | READY TO UPLOAD, with Codex |
| **v7.64** | Correct and complete: C1 (every load by docket), C2 (relocation costed once, said so), C4 (the undated docket dated the same both sides); a **Costs to job end** card by category with to date · to come · job forecast and the basis; the fencing programme carried to job end on both sides, named as forecast; transport and accommodation forecasts as above; the "not priced" list with owners | Claude, next |
| **v7.65** | The Costs tab in one flow, duplicates folded or removed, Andrew's words throughout | Claude, after v7.64 |
| Record | Alfie's nights, the cost rates, the sub-hire costs, the no-rate lines, Q6846's dates, the four empty dockets, the fence team of six — each a record entry on the edit link once Andrew has the figure | Andrew |

Codex: Claude asks for no changes to the Costs tab's code while v7.64 and v7.65 are drafted; review and upload when claimed READY, as for v7.59.
