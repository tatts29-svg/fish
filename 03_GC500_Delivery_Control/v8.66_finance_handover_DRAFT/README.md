# v8.66: Finance handover (DRAFT, READY to upload after v8.65)

Author: Andrew Fisher.

Andrew (Claude chat, 6 Oct 2026) shared Finance's feedback from GC500 2025 and said "Lets do it". The feedback, in plain words:

1. A cost reaches the P&L only when its purchase order is receipted; many of last year's POs were not receipted, or only partly.
2. Every cost sent to Finance carries its PO number and the branch it is costed to.
3. Temp labour and transport should be costed to the branch the revenue is in; some POs were costed to NOIS.
4. Forecast the demob costs (sub-hire fencing, transport, labour, other) by branch, so Finance can put them in October with the revenue.
5. Invoice by 31 Oct; if not, tell Finance what to accrue for which branch. Every accrual is messy: get the admin right first.

## What v8.66 adds

A fifth button on Costs & P&L, **Finance handover**, drawn fresh from the record each time it is opened. Numbers by branch, one basis line per table, no notes (Andrew, 6 Oct: "we don't want stories with these numbers"). The branch on every figure comes from the hire contracts (`branchOf`). Each figure is a cut of one the Costs tab already carries (`cj764Model`, `labourPlan`, `pl752Rows`, `pl760Ticks`, the quotes, the running sheet); nothing is added to the P&L.

1. **Purchase orders.** One row per PO: what it is for, the branch costed, the branch of revenue, value, receipt ID, and receipted in the system (in full / part with the amount / not / not confirmed). A PO costed to a branch the revenue is not in carries a "Branch differs" badge. Editors type in the row and press Save; an "Add PO" row records an order for any supplier. Saved through the existing `setPo` path; a view-only link cannot type.
2. **Costs by branch, to job end.** Each cost stream from To job end split across the contract branches: fencing on the fencing branch, toilets on the toilets branch, transport by each reference's contract branch (carrier figures to date; the card's transport cost once a reference to come), wages, salary allowance, accommodation and meals by the labour per piece on each branch (the shares are printed on the basis line). Every row adds back to its total and the table adds to To job end's costs plus the wages priced, to the cent.
3. **Demob forecast by branch.** Fencing removal (no dated removal programme yet, so "—"), the demob transport loads by branch, wages after the race weekend by the same shares, the toilets' pickup from the quotes. A cut of the costs above, not additional. The basis line names the demob loads with no transport figure and the post-event hours not yet priced, and gives the demob labour we charge per piece still to tick by branch.
4. **Invoice by 31 Oct, by branch.** Revenue on the record, still to come and to job end per branch, the contract export's billed column, and not yet billed (the accrual by branch if the invoices are not out). The event labour scope and the provisional transport to come are their own rows. Adds to the P&L's Revenue on the record and to job end to the cent.

Copy for Finance (plain text) and Export handover CSV (the four tables, every row) on the heading.

### Record

The PO row gains the fields `stream`, `revenue_branch`, `receipted`, `receipted_amount` and `what`, written only when an editor saves a row. Because non-fencing orders can now be recorded, `poFencing866` keeps the fencing PO card, the fencing trace and the fencing accrual on the fencing contractor's orders only (any order with no stream, or stream `fencing`); the branch plates and this view read all of them. The build changes no record.

### Allocation rule, stated once on the page

Wages, salary allowance, accommodation and meals follow the labour per piece on each branch (as at record 3854: KINP 76%, NVAC 13%, STPS 11%). Transport to date is the carriers' figures by the reference's branch; transport to come is the card's transport cost by the reference's branch. Cents are split so every row adds back to its total.

## Checks (candidate `9407ed75…`)

- `tests/test_handover866.cjs`: desktop 23/23, phone 23/23 (`evidence/test866_*.log`). It checks: five buttons, Finance handover once; the view mounts with its heading; one row per PO with a receipting status; PO values add to the record; the fencing cost carries every fencing PO, all on the fencing branch; costs = To job end's costs + wages priced to the cent; every cost splits across the contract branches and adds back to its total, with no cost left on no branch; no notes or requests on the page; demob labour by branch = the labour plan's demob slots; demob total = its rows and its branch columns; the invoice block adds to Revenue on the record and to job end; the 31 Oct deadline and the days; the CSV's four sections and author; the copy text; no phone number or email; a non-fencing PO added in memory (never saved) is listed with its branches and flagged when costed to NOIS with revenue in KINP, and stays out of the fencing PO card and the fencing accrual; Save on a view-only link changes nothing and sends nothing; the P&L summary comes back whole; no page errors; no writes.
- `v8.65 tests/test_costs865.cjs` on this page: 33/33 desktop and phone. Codex's `test_finance862.cjs`: PASS 1366 and 390. `test_flicker863.cjs`: 24/24 desktop and phone.
- Sweeps desktop/phone: 21 tabs, 15 shown, 0 errors, 0 console, 0 attempted writes (`evidence/sweep_*.json`). `check_page.py`: PASS. Secrets: 0.
- Screenshots: `evidence/handover_desk_1.png`, `handover_desk_2.png`, `handover_phone_1..3.png`.

## Candidate and publication

- Base: the **v8.65 candidate** `4ad46aa4da2acf270bfb013d25817312ff9b74f554e6c562dbf83de9112f4ebf` (patch_v865.py on live v8.64 `d725d9ac…`). `patch_v866.py` asserts that base.
- Candidate `9407ed75ae25deeff8662dadc94453f7e90c04072d22218c22bea122bc6151ae`, 11,052,274 bytes.
- Build while live is v8.64: `toolchain/build.sh v8.66 v8.65_costs_one_source_DRAFT/patch_v865.py v8.66_finance_handover_DRAFT/patch_v866.py`. Once v8.65 is live: `toolchain/build.sh v8.66 v8.66_finance_handover_DRAFT/patch_v866.py`. Upload: `toolchain/upload_page.py`.
- Either way the page is the same bytes. v8.66 cannot go live before v8.65.

## Codex final review

Claude source `1a7ff8e4` reproduced the original `9407ed75` candidate exactly. Codex corrected the outstanding PO-value headline to include the unpaid balance of part-receipted orders. A read-only in-memory regression checks an order of 1,234.50 with 1,000.00 receipted adds precisely 234.50 outstanding; no operational save is performed. Branch allocations remain forecast allocations, not payroll or ledger postings. Unpriced hours remain explicit; a priced difference is not final profit.

Final candidate SHA-256 `6fa8a9f3b71191b3e268272aa80a052cdf1855188e86348642da9f03adef16e4`, 11052320 bytes, on live v8.64 `d725d9ac`. This supersedes Claude's original candidate for publication. Includes v8.65 directly; no independent v8.65 publication.
