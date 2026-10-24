# The Coates P&L in plain words — and how GC500 reads against it

Author: Andrew Fisher · 1 Oct 2026 · a reading guide; nothing on the page or the record changed

Andrew, 1 Oct: "this is what I want both you and Codex to review and check, double check and triple check. I need you to
understand my business P&L and terminology, so we talk in a way it's easy to understand, and also assist the business:
dummy it down, but in a way anyone can read and understand. Remember the Coates Way. It's a tool we want everyone to
understand."

The workbook is `IS_PL_Jul_26.xlsx` (SHA-256 `40f61e5b…`), the Industrial Solutions P&L for July 2026, the first month of
FY2027. Twenty-four sheets: a one-page summary (`Group`, and one each for `East`, `North`, `South`, `West`), the
442-line detailed P&L (`IS Total` and one per business unit), the branch utilisation sheets (`TU_FU_Redline`), return on
capital (`ROC Calculation`), the EBIT run (`EBIT`) and the budget (`Budget FU&ROC`). Every figure quoted below is read
from the workbook; every GC500 figure is read from the page build `GC500_v7.67f` (the v7.64–v7.67 build, live since
15:04 AEST, verified byte for byte) on the live record at 15:00 AEST. Nothing is estimated here that the workbook or the page does not hold.

Section 1 is the P&L for anyone. Section 2 is the ratios the business is measured on. Section 3 is where every GC500
figure lands on that P&L and what the job's ratios look like. Section 4 is what to change on the page so it speaks the
business's language. Section 5 is the triple check: what was checked, what Codex is asked to check, and what only Andrew
can answer.

---

## 1. The P&L, top to bottom, in plain words

A P&L is one month of the business on one page: what we charged, what it cost us, and what is left. Coates writes it
in a fixed order. Every line below is a line on `IS Total` (its general-ledger code in brackets), with July's actual
beside it so the size of each line is real, not abstract.

### Revenue — what we charged

| The line | In plain words | July 2026 |
|---|---|---|
| **Hire Revenue** (1005 Hire Fleet, 1008 Accrual, 1054 Rebates) | What we charge for hiring out **our own** gear. 1008 is the accrual: hire earned this month but not billed yet, booked now and reversed when the bill goes out. 1054 is the rebates we give back. | $3,120,324 |
| **Rehire Revenue** (1010) | What we charge the customer for gear we **hired in from someone else** — Event Portables' toilets, Advanced's fencing. We charge it at our rates as if it were ours; what we pay the supplier is a cost further down. | $1,121,356 |
| **Transport** (1030 Cartage Internal, 1031 Cartage External, 1032 Toilet Pumpouts) | What we charge for delivery and pickup — on our own trucks (Internal) or a carrier's (External) — and for pumping out toilets. | $443,314 |
| **Consumables** (1020) | What we charge for things that get used up with the hire. | $166,020 |
| **Installation** (1047) | What we charge for installing: fencing erected, buildings set, generators connected, labour per piece. | $592,875 |
| **Fuel and Oil** (1045) | Fuel we charge for. | $8,930 |
| **Damage Revenue** (1015 Damage Waiver, 1041 Damage Costs Recovered) | The damage waiver on the hire, and damage charged back when gear comes home broken. | $132,889 |
| **Other Hire Revenue** (1025 Cleaning, 1048 Environmental Charge, 1055 Miscellaneous) | Cleaning charges, the environmental charge on every contract, and anything else. | $98,548 |
| **Servicing** (1170 Labour Repair Revenue) and **Equipment Sales** (1067) | Repair labour we bill, and the odd sale. | $7,130 |
| **Total Revenue** | Everything above added up. The `Group` sheet shows the same total in four lines: Hire Revenue, Rehire Revenue, Transport Revenue and Other Revenue (everything from Consumables down, $1,006,393). | **$5,691,386** |

The columns beside Actual are **Budget** (the target set before the year started) and **Last Year** (July 2025); the
Var columns are the gap. For a revenue line plus is better; for a cost line plus means we spent more.

### Direct costs — what the hire itself cost us

| The line | In plain words | July 2026 |
|---|---|---|
| **Total Repairs & Maintenance** | Keeping the fleet working: parts and outside repairs ($347,117), the fitters' wages charged to jobs ($327,070) and not charged ($150,946), testing and tagging, travel to repairs. | $833,490 |
| **Equipment Ownership** (rego, insurance, lease payments on the fleet) | Owning the gear, before depreciation. | $73,366 |
| **Rehire** (2126 Re Hire Contract Costs, 2127 Manual) | What we **pay the supplier** for the gear we hired in — Event Portables' invoice, Advanced's hire. | $895,682 |
| **Transport** (2120 Cartage Recoverable, 2140 Not Recovered, 2145 Breakdown, 2147 Branch to Branch, 3325 Toilet Pumpout Costs, our trucks, 3620 Transport Hub) | What we pay the carriers and what our own trucks cost. "Recoverable" means we charge it on; "Not Recovered" means we wore it. What we pay for toilet pump-outs sits here too. | $418,027 |
| **Consumables** (2144) | What the consumables cost us to buy. | $149,192 |
| **Fuel and Oil** (2121) | Fuel for the hire fleet. | $8,342 |
| **Installation** (2142 External Contractors, 2143 Internal Labour) | What we pay installers — a contractor's crew (2142), or our own people's time charged to the install (2143). | $474,706 |
| **Hire Damage** (3308), **Cleaning** (3324), **External Service**, **Motor Vehicles**, **Other** | Fixing damage, cleaning the fleet, service vehicles, stocktake write-offs. | $82,410 |
| **Allocated Direct Costs** (6544) | Direct costs shared out from above the branch. | $49,415 |
| **Total Direct Costs** | Everything above added up. The `Group` sheet shows it in five lines: Total Repairs & Maint, Transport, Rehire, POSA (profit or loss on selling an asset — nil in July) and Other Direct Costs ($837,430, everything else). | **$2,984,630** |

### Gross Margin — what the hire left us

| The line | In plain words | July 2026 |
|---|---|---|
| **Gross Margin** | Revenue less direct costs: what the hire itself made before the cost of running the branch. At the branch $2,756,171; after the allocated direct costs $2,706,757. | **$2,706,757** · 48 % of revenue |

### Overheads — the cost of running the branch

| The line | In plain words | July 2026 |
|---|---|---|
| **Property** | Rent, rates, power, cleaning, security, environmental. | $163,405 |
| **Direct Staff** | The branch's wages and on-costs: salaries, allowances, leave, payroll tax, super, company cars. Not the fitters (they are in R&M) and not the installers (in Installation). | $321,844 |
| **Indirect Staff** | Training, uniforms, medicals, recruitment, staff housing. | $13,786 |
| **Marketing / Entertainment, Telecommunications, IT & EDP, Travel & Accommodation, Bad Debts, Branch Admin, Statutory** | The small lines: phones, data lines, airfares and accommodation, doubtful debts, couriers and stationery, safety, insurance on the non-hire fleet, legal. | $81,406 |
| **Shared services & Allocated Costs** (6538 BU, 6540 Corporate) | The business unit's and head office's costs shared out to the branch. | $726,668 |
| **Total Overheads** | | **$1,307,110** |

### The bottom lines

| The line | In plain words | July 2026 |
|---|---|---|
| **EBITDA** | Earnings before interest, tax, depreciation and amortisation: Gross Margin less overheads. The cash the branch made before paying for the gear's wear. | **$1,399,647** · 25 % of revenue |
| **Depreciation** (6050 Hire Fleet, 6055 Plant, 6062 Leasehold, 6090 Allocation) | The fleet wearing out, spread over its life. | $688,818 |
| **EBIT** | Earnings before interest and tax: what the branch really made. | **$710,828** · 12 % of revenue |

Below EBIT the detailed sheet carries **Salary & Wages** in total ($799,860: base and on-costs $493,579, overtime
$286,617, temps $19,664), **TU** (time utilisation, 0.68: the share of the fleet's time it was on hire) and **Fleet
Original Cost** ($82,515 thousand: what the fleet cost new).

---

## 2. The ratios the business is measured on

Dollars say how big; ratios say how well. The `Group` sheet closes with these, and the business-unit sheets carry
them per branch.

| Ratio | How it is worked out | What it tells you | IS, July 2026 (budget) |
|---|---|---|---|
| **Rehire Recovery** | Rehire Revenue ÷ Rehire cost | For every $1 we paid a supplier for hired-in gear, what we charged the customer. Under 1.0 we lost money on the hire-in. | **1.25** (1.18) |
| **Transport Recovery** | Transport revenue ÷ Transport cost | For every $1 of cartage we paid, what we charged on. | **1.06** (1.14) |
| **Installation Recovery** ("Labour Recovery – Installation") | Installation revenue ÷ Installation cost | For every $1 paid to installers, what we charged for the install. | **1.25** (1.13) |
| **Consumables Recovery** | Consumables revenue ÷ Consumables cost | The mark-up on consumables. | **1.11** (1.23) |
| **Gross Margin %** | Gross Margin ÷ Total Revenue | How much of each revenue dollar the hire itself kept. | **48 %** (55 %) |
| **R&M %** | Total R&M ÷ Hire Revenue | How much of our own-fleet revenue went on keeping the fleet going. Lower is better. | **27 %** (19 %) |
| **EBITDA %** · **EBIT %** | ÷ Total Revenue | The bottom lines as a share of revenue. | **25 %** · **12 %** (31 % · 18 %) |
| **TU** | time on hire ÷ time available | How busy the fleet is. | 0.68 |
| **FU** (financial utilisation, `TU_FU_Redline`) | hire revenue ÷ the fleet's original cost, for the month | How hard the fleet is earning against what it cost. | 0.44 |
| **Redline** | the share of the fleet (by original cost) past its useful life | How much of the fleet is on borrowed time. | 0.18 |
| **ROC** | EBIT ÷ the capital in the fleet | What the business earns on the money tied up in gear. | 0.10 |

The July story in one line: revenue was on budget ($5.69 m against $5.66 m), but it was the **wrong mix** — hire of our
own fleet was $280 k under and rehire was $498 k over — and costs ran $420 k over, so Gross Margin landed at 48 % against
a 55 % budget and EBIT at $711 k against $1,039 k. Rehire Recovery at 1.25 beat budget: the hired-in gear was charged
on well. That is the lens the business reads every job through: **mix, recovery, margin.**

One thing to know before reading on: this workbook is Industrial Solutions' P&L (business units EAIS, NOIS, STIS and
WAIS; branches THOR, PHOS, ROXD, BAWI, ISNS, GLST, MURR, ONSL). GC500's contracts sit on **KINP, NVAC, MEAD and STPS**,
which are not on it. The line names are the same on every Coates branch P&L, so the mapping below holds wherever the
job reports; **which P&L GC500 reports into is Andrew's to say** (Section 5).

---

## 3. GC500 against the P&L: where every page figure lands

The page's Forecast P&L shows **Revenue $556,076 · Direct costs known $235,372 · Difference so far $320,704** (as at
1 Oct, ex GST), and Costs to job end carries both sides to the end: **revenue $804,885 · direct costs $444,411**, with
wages $31,824 beside. Here is the same money in the business's lines.

### 3a. Revenue on the record — $556,076 — by ledger line

| Ledger line | GC500 on the record | What it is on the page |
|---|---|---|
| **Hire Revenue** (1005) — our own gear | **$187,300** | the contract lines by the rate ($228,580) and from the card ($48,436), less the hired-in lines and the delivery lines counted below |
| **Rehire Revenue** (1010) — hired-in gear at our rates | **$203,690** | on the contracts $82,777: KINP's 132 toilet lines $69,092 · NVAC's two sub-hired forklift lines (31 and 34) $12,248 · the two SUB lines $1,437 — plus Advanced's 63 fencing dockets $120,913 (hire and installation in one card rate; see 3d) |
| **Toilet Pumpouts** (1032, in the Transport group) | **$85,102** | the servicing line: 780 pump-outs, 24 tank pump-outs, 51 sewer-connect cleans at our card's rates. The page files it under Rehire Revenue; the ledger has its own line for it |
| **Transport** (1030 Cartage Internal, 1031 Cartage External) | **$6,938** | the delivery and pickup lines on the contracts |
| **Installation** (1047) | **$73,046** | Labour Install, 166 ticks per piece $17,229 · the event labour scope, 368.9 h over the event $55,817 — plus the installation share inside the fencing card rate, not split out yet |
| **Total** | **$556,076** | to the dollar |

To job end the fencing programme adds **$248,810** (Rehire Revenue and Installation together; $48,262 of it behind the
programme — weeks that ended with metres still on the plan), taking revenue to **$804,885**. Two contract lines are not
priced at all (the 1800 mm fork extension, the tyne rotator): unknown, not nought.

### 3b. Direct costs known — $235,372 — by ledger line

| Ledger line | GC500 on the record | What it is on the page |
|---|---|---|
| **Rehire** (2126 Re Hire Contract Costs) | **$193,597** | Event Portables' four approved quotes $118,575 (their servicing $46,545 is inside it — the ledger would carry that part as 3325 Toilet Pumpout Costs) · Advanced's gear on 63 dockets $75,022 |
| **Installation – External Contractors** (2142) | **$2,100** | Advanced's docket labour $850 · the green book 12.5 h at $100 $1,250 |
| **Transport – Cartage Recoverable** (2120) | **$22,011** | 37 loads with a figure on the schedule (35 of them "and more": a floor); 24 Coates-truck loads carry no carrier charge (the ledger's Internal Truck Costs) |
| **R&M Parts** (2357) | **$578** | the tracker's Equip R&M line |
| **Travel & Accommodation** (3520) — an **overhead** on the P&L, not a direct cost | **$17,020** | accommodation 70 nights $15,564 · meals away $1,381 · meals on the road $75 |
| **Printing & Stationery** (3501) — overhead | **$66** | the tracker's printing line |
| **Total** | **$235,372** | to the dollar |

To job end: fencing to come **$180,090** (Advanced's gear and crew for the remaining programme weeks, 2126 and 2142
unsplit), transport to come **$22,364** (the card's transport cost for the references still without a figure), the 31
unpriced nights **$6,585** — **$444,411** in all. **Wages** sit beside, never added: $31,824 for the shifts that have a
rate (1,626 h have none). On the ledger Coates's own people are **Direct Staff** (3210) unless their install time is
charged to the job as **2143 Installation – Internal Labour**; Job Connect's people are **Temporary Staff**. Finance
decides which; the page should name both (Section 4).

Still not in dollars, named on the page as gaps: the supplier's cost for the two SUB lines and the NVAC forklifts; the
loads with no transport figure yet; Alfie Harris's 31 nights; the fence team of six on the event labour scope; Q6846's
hire dates, and Event Portables' invoice and purchase order.

### 3c. The job's ratios, the way the business reads them

| Ratio | GC500 on the record | GC500 to job end | IS, July 2026 | Reading |
|---|---|---|---|---|
| **Rehire Recovery** — the page's Rehire by branch card (toilets with their servicing, the SUB lines, the forklifts, fencing whole) | 288,792 ÷ 193,597 = **1.49** | 537,602 ÷ 373,687 = **1.44** | 1.25 | For every $1 paid to Event Portables and Advanced, $1.44–1.49 charged on. Better than the business's July. Three lines' supplier cost is still missing (the SUB lines, the forklifts), so the real figure is a touch lower. |
| — toilets alone (hire $69,092 + pump-outs $85,102 against Event Portables' $118,575) | **1.30** | 1.30 | | the pump-outs carry it: the toilet hire alone is $69,092 against $118,575 |
| — fencing alone (dockets at the card against Advanced's gear) | 120,913 ÷ 75,022 = **1.61** | 369,723 ÷ 255,112 = **1.45** | | installation is inside both sides here |
| **Transport Recovery** | 6,938 ÷ 22,011 = **0.32** | 6,938 ÷ 44,376 = **0.16** | 1.06 | **The one that needs a look.** The contracts carry $6,938 of delivery and pickup; the schedule already shows $22,011 paid to carriers, with more loads to come. Either the delivery lines are not on the contracts yet, or transport is inside the event rates — Andrew to say (Section 5). As the record stands, every $1 of cartage brings back 32 cents. |
| **Installation Recovery** | 73,046 charged against $2,100 paid to Advanced's crew | — | 1.25 | not readable yet: our own install hours have no wage rate, and the fencing card rate bundles hire and install |
| **Gross Margin %** — "Difference so far" | 320,704 ÷ 556,076 = **58 %** | (804,885 − 444,411 − 31,824) ÷ 804,885 = **41 %** | 48 % (budget 55 %) | the record's 58 % is not a margin yet (wages, transport and three rehire costs missing); carried to job end with the wages that can be priced, the job sits at 41 %, under the business's July 48 % — with 1,626 h of wages, the loads without a figure and the fence team still to land, which only lowers it |

### 3d. From the contract line to the ledger line — who does what

The page is the hand-over between four groups of people who never used to see each other's numbers. Read across a row
to see what each one does with the same item.

| | The branch (KINP, NVAC, MEAD, STPS) | The site (Andrew, the crew, the drivers) | The suppliers and carriers | Finance | What the page does |
|---|---|---|---|---|---|
| **Hire** | puts the line on the contract with Rate 1 | puts the asset number on, ticks install, steps, levelling, demob per piece | — | bills from the contract at month end; accrues the unbilled (1008) | prices every line (Rate 1, else the card, marked), and shows the Labour Install ticks the contracts do not carry yet |
| **Rehire** | books the SUB lines; the toilet lines at our rates | marks a location sub-hired, records the supplier's unit numbers | Event Portables quote and invoice; Advanced's dockets and sheet | 1010 against 2126; Rehire Recovery | holds the quotes as the cost, the card as the revenue, and shows the recovery by branch — never adds the two |
| **Transport** | puts delivery and pickup lines on the contract | books the loads; the drivers text in by reference | the carriers' dockets and figures | 1030/1031 against 2120; Transport Recovery | counts every load by its docket; names the loads with no figure instead of guessing |
| **Installation** | — | the green book, the running sheet | Advanced's crew hours | 1047 against 2142/2143 | carries the crew hours and the green book at their rates; wages beside, never added |
| **Month end** | — | — | — | the accruals, then the journals | the Month-end for Finance card: the accruals in Andrew's words, then the journals, each traced to a docket, a quote or a contract line |

### 3e. What reading the job this way has already caught

All of these came from making every figure trace to a line, a docket or a quote (the record on `STATUS.md`):

- Revenue overstated by $66,292 (generators and towers charged for every day on site instead of the three race days;
  the MEAD forklift at the wrong basis) — corrected in v7.50, $622,222 → $555,930.
- A second truck on WC05 ($290 and more) dropped because transport was counted one load per reference — corrected in
  v7.64 by reading every docket.
- Three Advanced dockets whose relocation metres are billed by the hour, not the metre — shown as hours still to come
  instead of priced per metre; and three programme weeks that ended with metres still on the plan ($41,111 at Advanced's
  rates) were being dropped from the forecast — carried as behind the programme in v7.64.
- Toilet servicing on no contract line ($85,102 of revenue the branch has not billed yet); the Transport Recovery of
  0.32 above. Both are money the business would not see until the final bill, if then.

---

## 4. What to change on the page (proposed v7.68 — not built; Andrew to say)

1. **Name the ledger line on every Forecast P&L row** — "Rehire Revenue · 1010", "Rehire cost · 2126", "Transport (cartage) · 2120" — so Finance reads the card without translating and anyone can look the line up on their own P&L. Andrew's words stay first; the code sits after the dot.
2. **Toilet servicing is Toilet Pumpouts (1032), not Rehire Revenue.** Move the servicing line into the Transport Revenue group, keep "priced by us at our pump-out rates", and note Event Portables' $46,545 as the matching 3325 cost inside the Rehire cost. Rehire Revenue then reads as the business reads it: the toilet hire, the SUB lines, the forklifts and Advanced's gear.
3. **Say the real Rehire Revenue on the first P&L line.** It reads "including Rehire Revenue $1,437" (the two SUB lines only); by the ledger's definition the rehire on the contracts is $82,777. The Rehire by branch card already knows this — the top line should agree with it.
4. **A recovery strip under the three tiles:** Rehire Recovery, Transport Recovery, Installation Recovery and GM %, the job against the business's July (1.25 · 1.06 · 1.25 · 48 %), each with its "not complete yet" flag. This is the one view a branch manager, Finance and the crew would all read the same way.
5. **Accommodation, meals and printing**: keep them under "Any other event-related expenses" (management's category) but say on the line that on the P&L they are overheads (Travel & Accommodation 3520) unless Finance journals them to the job.
6. **Wages**: name the two homes — 2143 Installation – Internal Labour if charged to the install, 3210 Direct Staff if not; Job Connect under Temporary Staff — and let Finance tick which.
7. **Fencing's card rate bundles hire and installation.** Ask Advanced (and the card) for the split so Rehire Revenue (1010) and Installation (1047) each carry their share; until then say so on the fencing row. Installation Recovery means nothing without it.
8. **The accrual**: on the Month-end for Finance card, say that September's accrued revenue (Andrew, 1 Oct: "we want to accrue the revenue") lands in 1008 Hire Revenue – Accrual and reverses when the bill goes out — one sentence, so nobody books it twice.

Nothing in this list changes a figure. Each is wording, a grouping, or a strip of ratios the page can already work out.

---

## 5. The triple check

**Checked here (Claude, 1 Oct 15:00):**
- The `BU MTD YTD` sheet's four business units add to the `IS Total` lines to the cent: Hire Revenue 792,503 + 824,680 + 1,207,308 + 295,834 = 3,120,324; Rehire Revenue 1,121,356; Transport 443,314; Other Revenue 1,006,393; Transport cost 418,027; Rehire cost 895,682; R&M 833,490; Other Direct Costs 837,430.
- Every ratio in Section 2 recomputed from the lines: Rehire 1,121,356 ÷ 895,682 = 1.252; Transport 443,314 ÷ 418,027 = 1.060; Installation 592,875 ÷ 474,706 = 1.249; Consumables 1.113; GM 47.6 %; R&M 26.7 %; EBITDA 24.6 %; EBIT 12.5 % — the `Group` sheet's figures.
- The page's revenue mapping (3a) adds to $556,076 and the costs mapping (3b) to $235,372, the Forecast P&L's own totals; the to-job-end figures add to $804,885 and $444,411, the Costs to job end card's own totals.

**Codex is asked to check (PR #1, 15:08):** re-add the workbook's lines independently; re-add the mapping tables from the
page's `moneySummary()`, `rh766Model()`, `cj764Model()` and `servicing748()`; say where it reads a ledger line
differently (the pump-outs, the fencing bundle, accommodation as an overhead); and challenge the Transport Recovery
finding before it goes to Andrew as a fact.

**Only Andrew can answer:**
1. Which P&L does GC500 report into — Industrial Solutions', or the Brisbane branches' (KINP, NVAC, MEAD, STPS)? The mapping is the same; the comparison figures in 3c are IS July's.
2. Transport: are the delivery and pickup charges to the V8s still to go on the contracts, or is transport inside the event rates? The answer decides whether 0.32 is a billing gap or by design.
3. Wages: are the crew's install hours charged to the job (2143) or carried as branch staff cost (3210)?
4. The fencing split between hire and installation — a question for Advanced and the card.
