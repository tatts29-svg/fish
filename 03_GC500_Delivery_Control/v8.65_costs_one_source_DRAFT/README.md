> Included in the verified live combined v8.66 release (6 Oct2026 08:45 AEST). No independent v8.65 upload was performed. Patch remains here for the combined build history.

# v8.65: Costs & P&L, one source for each figure (DRAFT, READY to upload)

Author: Andrew Fisher.

Andrew (Claude chat, 6 Oct 2026): "We need to review costings we need to clean this up so much conflicting information. Or doubling up of info i need you to look at every part in tools and costs and P&L we need to make sure everything makes sense example. What is the forecast for all the labour if it was ticked. Whats the actual now ... it needs to be correct". Then: "Make sure we check all areas in this area. We dont want to double up by showing the same info multiple times in this area. We need to be clear."

## What was wrong (read from live v8.64, record 3851, on 6 Oct 2026 ~06:35 AEST; `evidence/figures_before_after.txt`)

| # | Finding | Where | Cause |
|---|---------|-------|-------|
| F1 | **Two answers to "labour if every line were ticked"**: $71,318.91 (the P&L's Installation to job end, less event people) and $70,434.06 (the Accruals card's Labour Install forecast). | P&L lines card; Accruals "Labour — the forecast, both sides" | `labourRevenue858` counted install AND demob on the one relocation task (T0159, 5 VMS moved, $884.85); `labourPlan` left relocations out altogether. Two forecasts, two rules. |
| F2 | **A phantom row "Relocated or moved units · $0.01"**, and labour ticked read $19,825.85 in one place and $19,825.84 in another. | Accruals card; Pricing | Half-cent card rates (a VMS install is $88.485) left line totals at a half cent; two sums of the same ticks landed a cent apart and the gap was shown as a fake row. |
| F3 | **The glance said the opposite of what it did**: "labour still to tick is excluded" from Revenue to job end, while the figure included $51,493 of it. | At a glance, Revenue tile | The v8.54 clarity pass rewrote the tile note by position with stale words. |
| F4 | "Priced wages $49,249.83 (Job Connect)" — $14,700 of it is the salary allowance forecast, not Job Connect. | At a glance, Direct costs tile | Same v8.54 note. |
| F5 | The same headline printed over and over: revenue on the record 8 times, direct costs known 4, the difference 4, costs to job end 5. | Glance, Forecast P&L header tiles and its "Difference so far" line, three metric cards on the P&L-lines card, prose | Each card restated the headline before its own content. |
| F6 | Two "Difference" tiles side by side at 61% and 58% with no word on why. | P&L-lines card | One was the ledger gross margin before travel, accommodation, meals and wages; it was labelled "Difference before overheads". |
| F7 | The wages sentence ("wages — 100 of 236 shifts priced; $34,549.83 …") twice in one card. | Forecast P&L by branch | Under the cost total and again as the first "Not in it yet" bullet. |
| F8 | Sub-view headings read "runsheet — …" (the internal key) and "Pricing — …" under buttons that say Workforce costs and Customer rates & charges. | Costs & P&L sub-views (hidden headings, screen readers and search) | `paneHeadingHtml` used the tab key. |
| F9 | On a phone, a dollar figure broke across two lines ("$612,654.3 / 7"). | At a glance | Two 26 px figures side by side in a 390 px tile. |

## The fix

- **One rule for a relocation, in both forecasts.** A relocation re-installs the plant, so its install, steps and levelling are forecast; its demob is not, because the plant is demobbed once, on the reference it came from. `labourRevenue858` and `labourPlan` now read the same references and apply the same rule. *Andrew to confirm the rule (below).*
- **Money is cents, by one rule.** `labourCents865`: each card line's labour is its rate × pieces, rounded to the cent once per labour line; the lines add. `labourMoney`, `pl760Ticks`, `labourRevenue858` and `labourPlan` all use it, so the P&L, the Accruals card and the Pricing tab add to the same cent by construction. The phantom row is gone.
- **The glance says what it carries.** The Revenue note names the labour still to tick and its amount; the wages note splits Job Connect from the salary allowance forecast; and a fifth tile, **Labour per piece**, gives the two figures Andrew asked for: ticked so far, and if every line were ticked, with what is still to tick.
- **One place for each headline figure.** The glance is the one place. The Forecast P&L by branch loses its header tiles and its "Difference so far" line (its by-branch table and totals stay); the P&L-lines card loses the three metric cards that repeated the glance and keeps the one figure no other card has, now named **Ledger gross margin — before travel, accommodation, meals and wages**. The duplicated wages sentence is removed. Presentation only, in the same way as the v8.54 clarity pass; the models, the record and every table are unchanged.
- **Labour, the whole job, in one card** under the glance, opening with three plain headlines (Andrew: "total labour to charge forecast … really easy to understand"): *Total labour we will charge, to job end*, *What the labour costs us, priced to job end*, and *Labour charged less labour cost priced*; the glance tile is now **Labour we charge** (per piece + the race weekend people), the same total as the headline and the P&L's Installation line (Andrew: "we also have the costs for race weekend. For labour so we need to be clear on total forecast for labour"). Two tables, both sides, each to job end: what we charge (labour per piece + the race weekend people from the scope = the P&L's Installation line) and what it costs us (the running sheet: race weekend 23–25 Oct, the rest of the job, the salary allowance = the P&L's wages priced), with the hours that still have no pay rate named, and the one line "labour charged less labour cost priced". The Event crew card (a planned roster for the race days) moves into The working, with the people.
- **Plain words on the six folds**: "By branch — who bills what…", "On Finance's P&L lines…", "To job end — what is still to come…", "Hired-in gear…", "Month-end — what Finance should accrue…", "Actual hours and costs…".
- The sub-view headings carry their buttons' words. On a phone the two figures of a tile stack so a number is never broken.
- The v8.54 clarity adapters now address tiles by their name, not their position, so the new tile does not inherit another tile's words.

## The labour answer (as at record 3851, 6 Oct 2026)

| | Figure | Basis |
|---|---|---|
| **Labour ticked so far** (actual, charged) | **$19,825.88** | 182 ticks: install, steps, levelling and demob at the 2026 card, per piece |
| **If every line were ticked** (forecast) | **$70,877.12** | every priced labour line on every live reference at the card; relocation install in, relocation demob out |
| Still to tick | $51,051.24 | the difference, already inside Revenue to job end |
| **Race weekend — the people we charge** | **$36,714.96** | 368.9 h over 23–25 Oct at the scope's rates (C004-25003-01), provisional |
| **Total labour we charge, to job end** | **$107,592.08** | = the P&L's Installation line (1047); $56,540.84 charged so far |
| Cost side: race weekend wages priced | $6,228.25 | 24 shifts, 283 h paid, 8 people; 103 h priced, **180 h with no pay rate yet** |
| Cost side: rest of the job wages priced | $28,321.58 | 212 shifts, 2,129.5 h; 895 h priced, 1,234.5 h with no rate |
| Cost side: salary allowance forecast | $14,700.00 | Andrew's living-away/uplift allowance, whole job |
| **Total labour cost priced, to job end** | **$49,249.83** | $8,781.76 to date; = the P&L's wages priced |
| Cost side: not priced | 1,414.5 h | Coates wages hours with no rate (Aaron Zelvis, Alfie Harris, Jayden Paul, Wayne Crimmin, Frank Devilles, Ludwig Chee) |
| Labour charged less labour cost priced, to job end | $58,342.25 | before the 1,414.5 h are priced; not a margin |

Before the fix the same page gave $71,318.91 and $70,434.06 for the forecast and $19,825.85 / $19,825.84 for the actual.

## Decisions for Andrew (not changed here)

1. **Relocation rule.** v8.65 forecasts install on a relocation and not demob (T0159, 5 VMS: $442.43 in, $442.43 out). If a relocation should charge nothing, or both, say so and it is a one-line change.
2. **Job Connect on the P&L.** The roster calls labour hire "already coded to Installation", but the P&L keeps the $34,549.83 on its own wages line rather than 2142 Installation — external contractors ($2,375, Advanced's crew). Finance to say which; the page should then match.
3. **Race-weekend hours tell four stories**: 368.9 h charged (the scope), 283 h rostered, 283.5 h cost, 216 planned paid hours on the Event crew card. One block for the weekend would be clearer; which hours are the ones to show?
4. **Deeper cuts.** The roster totals still appear three ways (Workforce costs, "The working → Labour, accommodation, meals and expenses", and the Month-end cards). Each is a different cut (register, summary, month). Say the word and the summary fold goes.

## Checks

- `tests/test_costs865.cjs`: desktop 33/33, phone 33/33 (`evidence/test865_*.log`). The same test on live v8.64 fails 13/24: the faults above. It checks: ticks add to the P&L charge to the cent; every line total is whole cents; no phantom row; Accruals charged = P&L charge; one labour forecast (labourRevenue858 = Accruals Labour Install = labourPlan); P&L Installation = labour + event people, on the record and to job end; the relocation rule; the P&L reconciles; glance = P&L to job end; the glance words; the Labour tile figures match the models; the ledger gross margin label; the one-place removals (revenue on the record printed at most 3 times); the labour card's totals equal the P&L's Installation line and wages priced, and its race-weekend row carries the running sheet's race-day hours; the Event crew card in the working; plain fold titles; sub-view headings; Codex's v8.62 rule (no money on the operational tabs); no page errors; no writes.
- Codex's `test_finance862.cjs`: PASS at 1366 and 390.
- `test_flicker863.cjs` on this page: 24/24.
- Sweeps desktop/phone: 21 tabs, the same 15 shown as live, 0 errors, 0 console, 0 attempted writes (`evidence/sweeps_v865.log`). `check_page.py`: PASS. Secrets: 0.

## Candidate

- Base live v8.64 `d725d9acd069a208be3e3ecc757f3b914c9b98bff67a5432475dde6e2ae7a7d2`.
- Candidate `4ad46aa4da2acf270bfb013d25817312ff9b74f554e6c562dbf83de9112f4ebf`, 11,018,927 bytes (supersedes `5a408923…` and `7c659fe5…`).
- Build: `toolchain/build.sh v8.65 v8.65_costs_one_source_DRAFT/patch_v865.py`. Upload: `toolchain/upload_page.py`.
- Because labour is now in whole cents, revenue on the record moves from $612,654.34 to $612,654.37 (+3c) and Revenue to job end from $999,934.66 to $999,492.87 (the relocation demob, −$442.43, and the cents). No record is changed.
