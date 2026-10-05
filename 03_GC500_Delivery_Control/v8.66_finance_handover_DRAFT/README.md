# v8.66: Finance handover (DRAFT, READY to upload after v8.65)

Author: Andrew Fisher.

Andrew (Claude chat, 6 Oct 2026) shared Finance's feedback from GC500 2025 and said "Lets do it". The feedback, in plain words:

1. A cost reaches the P&L only when its purchase order is receipted; many of last year's POs were not receipted, or only partly.
2. Every cost sent to Finance carries its PO number and the branch it is costed to.
3. Temp labour and transport should be costed to the branch the revenue is in; some POs were costed to NOIS.
4. Forecast the demob costs (sub-hire fencing, transport, labour, other) by branch, so Finance can put them in October with the revenue.
5. Invoice by 31 Oct; if not, tell Finance what to accrue for which branch. Every accrual is messy: get the admin right first.

## What v8.66 adds

A fifth button on Costs & P&L, **Finance handover**, drawn fresh from the record each time it is opened. Four blocks, each a cut of a figure the Costs tab already carries (`cj764Model`, `labourPlan`, `pl752Rows`, `pl760Ticks`, the quotes, the running sheet); nothing is added to the P&L and nothing is invented.

1. **Purchase orders — receipted, and on which branch.** One row per PO on the record: what it is for, the branch it is costed to, the branch the revenue sits in, its value, the receipt ID, and whether it is receipted in Coates' system (in full / part, with the amount / not / not confirmed). A PO costed to a branch the revenue is not in is marked. Editors type these in the row and press Save; an "Add PO" row records an order for any supplier. Saved through the existing `setPo` path (name required, edit link required); a view-only link cannot type.
2. **Every cost to Finance — with its PO and its branch.** The cost streams from To job end, each with the branch costed, the branch of the revenue (for transport and labour: the references' branches, by amount), the POs recorded for it, cost to date / to come / to job end, and what Finance still need (no PO; PO not confirmed receipted; branch not recorded; costed to a branch the revenue is not in). The total equals To job end's costs plus the wages priced, to the cent.
3. **Demob — the forecast, by branch.** Sub-hire fencing removal (not forecast: the deconstruction weeks in the programme file are not dated for 2026, and the row says who supplies the figure), the demob transport loads by branch (carrier figures where they exist, the card's transport cost once a reference where they do not, and the loads with no basis named), wages after the race weekend from the running sheet (with the unpriced hours named), and the toilets' pickup from the quotes. Underneath, the demob labour we charge per piece still to tick, by branch (revenue, kept apart).
4. **Invoice by 31 Oct — by branch, and what to accrue if not.** What each branch charges the V8s on the record and to job end, what the contract export says is billed (0 of 308 lines at the 24 Sep export), and the not-yet-billed figure Finance accrue per branch if the invoices are not out. The branches add to the P&L's Revenue on the record and to job end, to the cent; anything on no branch is a named row. Days to the deadline on the headline.

Copy for Finance (plain text) and Export handover CSV (the four blocks, every row) on the heading.

### Record

The PO row gains the fields `stream`, `revenue_branch`, `receipted`, `receipted_amount` and `what`, written only when an editor saves a row. Because non-fencing orders can now be recorded, `poFencing866` keeps the fencing PO card, the fencing trace and the fencing accrual on the fencing contractor's orders only (any order with no stream, or stream `fencing`); the branch plates and this view read all of them. The build changes no record.

### Not on the record, said so on the page

- Receipting: every one of the 9 fencing POs reads "Receipting not confirmed" until someone sets it (6 of them also have no value typed).
- Who owns each branch's invoicing: not a field on the record; the page says Andrew is to name them.
- Fencing removal: no dated deconstruction week for 2026, so no forecast; the demob loads' carrier figures; 457.5 h of post-event wages with no pay rate.

## Checks (candidate `ec09a62b…`)

- `tests/test_handover866.cjs`: desktop 22/22, phone 22/22 (`evidence/test866_*.log`). It checks: five buttons, Finance handover once; the view mounts with its heading; one row per PO with a receipting status; PO values add to the record; the fencing stream carries every fencing PO on the fencing branch; costs to Finance = To job end's costs + wages priced to the cent; every cost on "the job" is flagged branch not recorded; demob labour by branch = the labour plan's demob slots; demob total = its rows; the invoice block adds to Revenue on the record and to job end; the 31 Oct deadline and the days; the CSV's four sections and author; the copy text; no phone number or email; a non-fencing PO added in memory (never saved) is listed with its branches and flagged when costed to NOIS with revenue in KINP, and stays out of the fencing PO card and the fencing accrual; Save on a view-only link changes nothing and sends nothing; the P&L summary comes back whole; no page errors; no writes.
- `v8.65 tests/test_costs865.cjs` on this page: 33/33 desktop and phone. Codex's `test_finance862.cjs`: PASS 1366 and 390. `test_flicker863.cjs`: 24/24 desktop and phone.
- Sweeps desktop/phone: 21 tabs, 15 shown, 0 errors, 0 console, 0 attempted writes (`evidence/sweep_*.json`). `check_page.py`: PASS. Secrets: 0.
- Screenshots: `evidence/handover_desk_1.png`, `handover_desk_2.png`, `handover_phone_1..3.png`.

## Candidate and publication

- Base: the **v8.65 candidate** `4ad46aa4da2acf270bfb013d25817312ff9b74f554e6c562dbf83de9112f4ebf` (patch_v865.py on live v8.64 `d725d9ac…`). `patch_v866.py` asserts that base.
- Candidate `ec09a62b1eff5b00bf2cce9473c812f58fb2df3f53258091e7e99ccc548c92b6`, 11,058,262 bytes.
- Build while live is v8.64: `toolchain/build.sh v8.66 v8.65_costs_one_source_DRAFT/patch_v865.py v8.66_finance_handover_DRAFT/patch_v866.py`. Once v8.65 is live: `toolchain/build.sh v8.66 v8.66_finance_handover_DRAFT/patch_v866.py`. Upload: `toolchain/upload_page.py`.
- Either way the page is the same bytes. v8.66 cannot go live before v8.65.
