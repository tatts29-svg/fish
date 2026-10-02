# Layout map: purpose, section importance and repeats, every tab

Author: Andrew Fisher · 2 Oct 2026 · Claude · **a proposal for Andrew's decision, nothing changed on the page**

Andrew's instructions:
- "We need layout improvements and ensure we are not doubling up on showing data. Every section needs a importance."
- "We need to start to tidy up things now to ensure we dont double up on information. Layout needs to be perfection now."

## How the repeats were found

`toolchain/harness/repeat_check.js` opens every tab of a build and opens every fold. It splits each tab into its sections (cards, plates, panels, tables) and lists every figure that shows in more than one section, on the same tab or on another. It works only from what is visible on screen.

Figures counted:
- dollar amounts of $1,000 or more;
- metres of 100 m or more;
- "N of M" counts.

Not counted: small counts, percentages, dates, and the More info explanations.

Run on the v7.96 candidate (`c0056535…`), which includes the one-tab Today and Equipment:

```
cd toolchain && PAGE=../build/GC500_v7.96/GC500_Delivery_Control_hosted.html OUT=../layout_map_02Oct2026/repeats_v796.json node harness/repeat_check.js
```

**156 figures repeat: 115 across tabs and 41 on the same tab.**
- `repeats_v796.txt` lists every one, and the pairs of sections that share them, most first.
- `repeats_v796.json` is the same, machine-readable.

**Gap:** Timeline and Documents draw their content without the card and table marks the checker reads, so the checker sees them as empty. Their repeats aren't in these numbers yet.

## The repeats, grouped by what they are

| # | What repeats | Where | Shared figures | Proposed single home (Andrew to decide) |
|---|---|---|---|---|
| R1 | **Each fencing docket's metres and dollars** | Fencing: Docket register, By area, Fencing by day, Quoted quantities · Costs: Charge lines on the record | 57, 48 and 47 between the pairs | **Fencing → Docket register.** By day and By area become views of that one register (a sort or filter, not separate tables). Costs shows one fencing total line and links to it. |
| R2 | **The money totals**: revenue $572,467, direct costs $235,372, difference $337,095, and the streams | Today: Money (Revenue by stream; Are we making money?) · Costs: At a glance, the P&L sheet, the Forecast P&L table | 3 to 14 per pair; the three totals show up to 5 times | **Costs** for the money detail. Today keeps one line (revenue · direct costs · difference) linking to Costs. Within Costs, At a glance, the P&L sheet and the forecast table currently say the same totals three times; one should carry them. |
| R3 | **Revenue by branch** (STPS $202,165, KINP $138,920, NVAC $47,292, MEAD $9,552, all $397,929) | Today: By branch (All branches together + each branch card) · Costs: By branch table, the P&L sheet | 7 per pair | **One home.** Either Today's By branch cards (with Costs linking there) or Costs' By branch table. Inside Today, "All branches together" also repeats each branch card. |
| R4 | **Labour and wages** ($15,564, $22,011, $31,823) | Costs: Internal labour, the P&L sheet · Running sheet: Running totals · Questions: Pending | 3 to 8 per pair | **Running sheet for the hours, Costs for the dollars.** Questions keeps the question words and links to the figure. |
| R5 | **Street card rates** ($2,100, $6,800, $2,800…) | Costs: From the Street Rate Card 2026 · Questions: Answered or history | 12 | **Costs.** The Questions history says what was decided and links to the rate. |
| R6 | **Fencing planned against done** (137.5 m, 215 m, 800 m…) | Today: the trade-by-trade detail "Fencing — planned to date against done" and By group's Fencing plate · Fencing: Quoted quantities | 3 per pair | **Fencing tab.** Today keeps the By group Fencing plate, its one summary. |
| R7 | **Today's Fencing card dollars** ($120,913) | Today: Fencing card and By group Fencing | 1 | **Kept on Andrew's word** (2 Oct 2026): "why isnt the info of fencing in today". |
| R8 | **Scorecard figures** (1,895 m, 800 of 1,895, 75 of 75) | Coates Way: the third ring · Questions · Today: Deliveries | 3 | Coates Way's scorecard is a summary that points at the job; it could read the same figures as words ("fencing demarcation behind") and link. Andrew to say. |

## Every tab's purpose, and the importance of each section (proposal)

Importance key:
- **1** = what the person opened the tab for; first on screen.
- **2** = working detail; open, but below the 1s.
- **3** = reference; folded to one line.

| Tab | Its one job | 1 (first) | 2 (working) | 3 (folded) |
|---|---|---|---|---|
| **Today** | what is happening on site today, and where the job stands | the lights, deliveries due, programme card, Next programme day, Delivery updates, Who to call, Fencing | Also on the schedule, Map, Documents, Roads, By group | By branch, Money, On site, the trade-by-trade detail (already folded in v7.95) |
| **Timeline** | what is due, day by day | the chosen day's deliveries and removals | the week view, carrier loads | the programme sheets |
| **Equipment** | what was ordered, what is on site, where it goes | On site now (Inventory) | Still to come, every location; Spares | Every reference, Rental contracts, Branches (folded in v7.96) |
| **Map explorer** | where everything is | the map | search, layers | the drawing list |
| **Documents** | find a paper | the category cards and search | the files of a category | the catalogue notes |
| **Fencing** | what the crew did, and what it is worth | the week (planned, done, to do) and the race-weekend close order | **one** Docket register (R1), Rates | Purchase orders, Green book, Blue book, the CW4 differences, Paid to Advanced by P&L line |
| **Costs** | the money: revenue, direct costs, the difference | Where the job stands on money (**one** set of totals, R2) | Forecast P&L, Revenue, Direct costs, Recovery, By branch (R3) | Month-end for Finance, Labour forecast, the working, the card rates (R5), the charge lines (R1) |
| **Pre-starts** | the form for the morning | the form | — | — |
| **Running sheet** | hours and people, by day | the day | Running totals (R4) | — |
| **Questions** | what needs Andrew's answer | Needs an answer | Pending | Answered or history (words and links, no repeated figures: R4, R5) |
| **The Coates Way** | the operating lens | the machine and the centre | the rings | the traits and disciplines (R8) |

## What happens next

1. Andrew picks a home for R1 to R6 and R8, and confirms or changes the importance table.
2. Each tab is then mocked up on the real page and shown to Andrew before it's built, as AGENTS.md requires.
   - Codex: Timeline, Documents, Fencing and Costs.
   - Claude: Map explorer and Coates Way, plus Today and Equipment follow-ups.
3. Every release runs `repeat_check.js` and reports its count. The count must fall, and every repeat left must be one Andrew chose to keep (the `KEPT` list in the script).
