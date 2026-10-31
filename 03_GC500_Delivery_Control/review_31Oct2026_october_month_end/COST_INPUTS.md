# Cost inputs: how every figure in the final P&L pack is derived (portable manifest for an independent audit)

Author: Andrew Fisher. For Codex's audit (PR1 6541370424). Read only; no record changes. Every probe opens the page with
`toolchain/harness/open_page.js` (writes aborted), waits for `SYNC.status === 'live'`, and must run under
`flock -x /tmp/gc500-browser.lock`. Set `PAGE` to the live v12.69 page (`build/GC500_v12.69/GC500_Delivery_Control_hosted.html`,
SHA-256 `038bd277…`). The pack's inputs were captured on record **12640**. v1.8 is checked against record **12676**, where Alfie
Harris's 12 nights carry 223.63 and nothing else differs (`inputs/dated_costs.cjs` with `OUT=<file>`; see the README). Outputs are
written to `/tmp/gc500-scratch/progress/` (change the path in the probe if needed). Private inputs that are NOT here: the 19 invoice PDFs and the Baseplan (12) export (Andrew's
originals); everything on the cost side below comes from the live record and the page.

| Pack figure (build_monthend.py) | Probe (inputs/ or the review folder) | Page function / record path | Derivation |
|---|---|---|---|
| Advanced, billed and receipted, by month | `../review_31Oct2026_fencing_facts/fence_facts.cjs`, `fence_facts2.cjs` | `allDockets()`, `serviceNoteRows()`, `supplierExtras1014()`, `supplierPricing1014()`, `poAll()`, `fenceOrders1159` | each usable docket's `paid_total` by its date (the week 6 workbook row has no date: its week is 9–12 Sep); each note's `cost` by date; each extra's `paid` by date; order 4658850 (29 Sep); the receipted-order adjustments by their week (week 6 and week 5 in September, week 1 in October); billed = weeks 1–6 and the collection |
| Advanced, estimate (event week, demob week 1) | same | same | dockets and notes in Event Week and Demob Week 1 at Advanced's rates, crew notes 24493–24495 included; POs 4647522 and 4647523 (open, this year's) |
| Advanced, demob week 2 | `cost_sources.cjs` | `cj764Model().rows` (Fencing row `toCome`) | the page's forecast, November |
| Event Portables | `inputs/ep_detail.cjs` | `supplierService1068().quotes`, `epCostStatus1094Model()` | the four quotes at the received and counted quantities: Q6845 sub-total + delivery + pickup; Q6844 sub-total; Q6846 sub-total + delivery + pickup; Q6847 sub-total + delivery + pickup. Months: Q6846 by its days (14 Sep–25 Oct, 17 of 42 in September) at its printed total; the rest October |
| Premiair | `inputs/cost_sources.cjs` | `cj764Model().rows` 'Rehire — PREMIAIR…' (`basis` text: rate × days per 9961265 line) | sum of the lines less line 15 (absent from 9961265 in Baseplan (12)); October |
| Royal Wolf | same | 'Rehire — UNITED RENTALS…' row | the keyed cost rate, once (9974042 line 2, on site 13–30 Oct); October |
| Transport, to date | `inputs/dated_all.cjs` | `transport888Core().tFig` | to v1.4: each figure by its event date, figures with no date put in October (from v1.5: the "Transport by month" row) |
| Transport, to come | `inputs/planned_legs.cjs` | `transport888Core().planned` (`forecast.kind === 'card'`), `.forecast.total` | to v1.4: card forecasts by planned date, the rest of `forecast.total` (no date) put in November (from v1.5: the "Transport by month" row) |
| Job Connect (labour hire) | `inputs/labour_register.cjs` → `inputs/build_sheet.py` | `ourCosts()` labour rows, `fin745Rows(today)` costs, person rows | the running sheet's labour-hire cost by day, weeks ending Sunday; invoiced weeks at the PO amounts (4657010, 4660565, 4661783/invoice 15294), w/e 4 Oct split across the months by the sheet's days |
| Accommodation and meals | `inputs/dated_costs.cjs` (`exp`) | `ourCosts()` kinds accommodation, meals, misc (`amount`, `date`) | summed by the line's date: 112 lines, all priced from record 12676 (Alfie Harris's 12 nights at 223.63 on their own dates) |
| Salary allowance | `inputs/ledger_probe.cjs` | `labourAllowance858()` (finance745 record, basis forecast) | split by the salaried hours inside the allowance's record window, 14 Sep–13 Nov: 143 · 256 · 110 of 509 (from v1.5) |
| Consumables POs | `poAll()` (any probe) | `docs.purchaseOrders` | each PO at its amount, in the month of its PO date (in its note) |
| Labour hours by person and branch | `inputs/labour_register.cjs` → `inputs/build_sheet.py` | as above | hours split by the note's branch segments (the rest of the day on KINP); contracts named only outside KINP (9972648, 9961976) |
| Event labour scope by role | `inputs/scope_probe.cjs` and the page's scope data | `scopeBranchAllocation978()` | the C004 roles and their invoicing lines |
| Ludwig Chee's event nights to NVAC (v1.3) | `inputs/ludwig_nights.cjs` | `ourCosts()` kind accommodation | his three priced nights, 23–25 Oct at 218.57, out of October's tracker accommodation on KINP (11,851.89 on 12640; 13,640.93 on 12676, with Alfie Harris's 8 October nights) |
| Transport by month (v1.5) | `inputs/dated_costs.cjs` (`transport`) | `transport888Core().rows` + `.planned` (`date`, `actual`, forecast amount) | each row once by its own date: recorded figure, else its forecast; planned loads by planned date |
| Alfie Harris's 12 nights (v1.5; rate v1.7; on the record v1.8) and the salary window (v1.5) | `inputs/alfie_nights.cjs`; the record's `labourAllowance858` (`from`, `to`) | `ourCosts()` accommodation by person; finance745 | the nights by their dates at 223.63, his amount on all 8 nights of 26–29 Oct and 2–5 Nov, and on the record for all 12 from 12676; the allowance by the salaried hours inside its window |
| Carriers by hire contract (v1.3 match-up) | `inputs/dated_all.cjs` (`tFig`) + Baseplan (12) "Delivery Dockets" (Andrew's original) | `transport888Core().tFig[].event.dd` | each load's docket number → the docket list's Hire Agreement; loads with no docket, or a docket not in Baseplan (12), are left untied |

Checks the pack asserts (v1.8):
- costs by month = costs by branch = 543,508.93 (job end);
- accruals = the journals (211,703.93);
- revenue = the 18 invoices to V8 Supercars (1,001,063.07) + the 839.07 November forecast. Invoice 25124396 is to Gold
  Coast Helitours and is not GC500 revenue;
- every revenue row cross-foots: the hire by month + services = the invoice's ex GST.

`audit_pack.py` derives all of it again from the inputs, not the builder: 171 checks on v1.8.
