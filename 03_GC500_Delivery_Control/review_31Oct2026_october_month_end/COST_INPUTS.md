# Cost inputs: how every figure in the final P&L pack is derived (portable manifest for an independent audit)

Author: Andrew Fisher. For Codex's audit (PR1 6541370424). Read only; no record changes. Every probe opens the page with
`toolchain/harness/open_page.js` (writes aborted), waits for `SYNC.status === 'live'`, and must run under
`flock -x /tmp/gc500-browser.lock`. Set `PAGE` to the live v12.69 page (`build/GC500_v12.69/GC500_Delivery_Control_hosted.html`,
SHA-256 `038bd277…`). The pack was built on record **12640**; outputs are written to `/tmp/gc500-scratch/progress/` (change the
path in the probe if needed). Private inputs that are NOT here: the 19 invoice PDFs and the Baseplan (12) export (Andrew's
originals); everything on the cost side below comes from the live record and the page.

| Pack figure (build_monthend.py) | Probe (inputs/ or the review folder) | Page function / record path | Derivation |
|---|---|---|---|
| Advanced, billed and receipted, by month | `../review_31Oct2026_fencing_facts/fence_facts.cjs`, `fence_facts2.cjs` | `allDockets()`, `serviceNoteRows()`, `supplierExtras1014()`, `supplierPricing1014()`, `poAll()`, `fenceOrders1159` | each usable docket's `paid_total` by its date (the week 6 workbook row has no date: its week is 9–12 Sep); each note's `cost` by date; each extra's `paid` by date; order 4658850 (29 Sep); the receipted-order adjustments by their week (week 6 and week 5 in September, week 1 in October); billed = weeks 1–6 and the collection |
| Advanced, estimate (event week, demob week 1) | same | same | dockets and notes in Event Week and Demob Week 1 at Advanced's rates, crew notes 24493–24495 included; POs 4647522 and 4647523 (open, this year's) |
| Advanced, demob week 2 | `cost_sources.cjs` | `cj764Model().rows` (Fencing row `toCome`) | the page's forecast, November |
| Event Portables | `inputs/ep_detail.cjs` | `supplierService1068().quotes`, `epCostStatus1094Model()` | the four quotes at the received and counted quantities: Q6845 sub-total + delivery + pickup; Q6844 sub-total; Q6846 sub-total + delivery + pickup; Q6847 sub-total + delivery + pickup. Months: Q6846 by its days (14 Sep–25 Oct, 17 of 42 in September) at its printed total; the rest October |
| Premiair | `inputs/cost_sources.cjs` | `cj764Model().rows` 'Rehire — PREMIAIR…' (`basis` text: rate × days per 9961265 line) | sum of the lines less line 15 (absent from 9961265 in Baseplan (12)); October |
| Royal Wolf | same | 'Rehire — UNITED RENTALS…' row | the keyed cost rate, once (9974042 line 2, on site 13–30 Oct); October |
| Transport, to date | `inputs/dated_all.cjs` | `transport888Core().tFig` | each figure by its event date; figures with no date put in October |
| Transport, to come | `inputs/planned_legs.cjs` | `transport888Core().planned` (`forecast.kind === 'card'`), `.forecast.total` | card forecasts by planned date; the rest of `forecast.total` (no date) put in November |
| Job Connect (labour hire) | `inputs/labour_register.cjs` → `inputs/build_sheet.py` | `ourCosts()` labour rows, `fin745Rows(today)` costs, person rows | the running sheet's labour-hire cost by day, weeks ending Sunday; invoiced weeks at the PO amounts (4657010, 4660565, 4661783/invoice 15294), w/e 4 Oct split across the months by the sheet's days |
| Accommodation and meals | `inputs/dated_costs.cjs` (`exp`) | `ourCosts()` kinds accommodation, meals, misc (`amount`, `date`) | summed by the line's date; Alfie Harris's 12 nights (the Accommodation row's `toCome`) in October, no dates on the record |
| Salary allowance | `inputs/ledger_probe.cjs` | `labourAllowance858()` (finance745 record, basis forecast) | split by the salaried hours on the running sheet, 198 · 256 · 110 of 564 |
| Consumables POs | `poAll()` (any probe) | `docs.purchaseOrders` | each PO at its amount, in the month of its PO date (in its note) |
| Labour hours by person and branch | `inputs/labour_register.cjs` → `inputs/build_sheet.py` | as above | hours split by the note's branch segments (the rest of the day on KINP); contracts named only outside KINP (9972648, 9961976) |
| Event labour scope by role | `inputs/scope_probe.cjs` and the page's scope data | `scopeBranchAllocation978()` | the C004 roles and their invoicing lines |
| Ludwig Chee's event nights to NVAC (v1.3) | `inputs/ludwig_nights.cjs` | `ourCosts()` kind accommodation | his three priced nights, 23–25 Oct at 218.57, out of October's 11,851.89 on KINP |
| Carriers by hire contract (v1.3 match-up) | `inputs/dated_all.cjs` (`tFig`) + Baseplan (12) "Delivery Dockets" (Andrew's original) | `transport888Core().tFig[].event.dd` | each load's docket number → the docket list's Hire Agreement; loads with no docket, or a docket not in Baseplan (12), are left untied |

Checks the pack asserts: costs by month = costs by branch = 543,382.98 (job end); accruals = the journals; revenue = the 19
invoices; every revenue row cross-foots (hire days by month + the undated remainder = the invoice's ex GST).
