# Monthly financial control — v7.45 LIVE

Author: Andrew Fisher

LIVE **30 Sep 2026 at 22:17 AEST**. The public view link was verified to serve the tested build byte for byte:
8,383,024 bytes; SHA-256 `8d810104069b7bee5cc68fcf4fc2afb716656d91394f0855627fa75261593857`.
Upload accepted at `2026-09-30T12:17:24.057Z`. No live record edits or accounting-system postings were made.

Andrew asked for actuals and forecasts, monthly billing visibility and the hours/costs Finance needs to journal into Installation. He then directed that agreed updates be finished, tested and released. This release adds that review workflow to **Costs → Actuals, forecast & Finance journals**, with a link from the Running sheet.

## What it does

- Separates confirmed worked hours, paid/allocation hours, past hours awaiting confirmation and future planned hours. Passing a date never confirms a shift.
- Records optional verified payroll/invoice cost and supporting evidence for each shift. Hours multiplied by a rate remain a calculation, not proof of a payroll or ledger actual.
- Allows a separate cost-rate assumption with its source and on-cost basis. Salary, CNA and labour-hire pay splits keep the existing rules; customer charge rates are never substituted for costs.
- Shows the whole-job labour outlook from recorded shifts, counting each once. Unknown rates and unresolved past hours are prominent; an entirely unpriced outlook says “Not priced”. This is not a complete project-cost or profit figure.
- Records the expected month-end billing month and a reason for deferral while keeping the original work month. No pre-bill amount or automatic cost transfer.
- Records Finance proposals for allocation, accrual, WIP/deferral and reversal, including work/posting/reversal months, accounts, evidence, approval identity and external posting reference.
- Keeps journal amounts outside labour-cost totals. Already allocated shifts and overlapping active allocations are protected against duplicate allocation. A fully posted matching reversal allows a corrected replacement allocation.
- Retains every review revision. Changed hours, rates or payroll evidence trigger review; stale journal sources cannot be silently approved. Posted entries cannot be overwritten as if they never happened.
- Exports a Finance CSV and a lossless review backup. CSV text is protected against spreadsheet formula interpretation.

This page does **not** connect to payroll or post to an accounting ledger. “Posted externally” records the reference entered by a person. Finance must decide the appropriate accounting treatment; delayed customer billing alone does not justify moving an incurred expense.

## How to use it

1. Open the usual edit link, then **Costs** and select the work month.
2. Use **Review shifts → Review / confirm** to check recorded hours against timesheets. Enter verified cost only when supported by payroll or invoice evidence. Correct or extend the source plan on the Running sheet.
3. Use **Set cost rate** where a Finance cost assumption is needed, stating whether on-costs are included. A changed rate prompts re-review of previous confirmations.
4. Set the **expected billing month**, with a reason if it is later than the work month.
5. Use **Prepare allocation proposal** or **Add journal proposal**. Record Finance’s approval and external posting reference only when they exist. Export the review schedule for Finance.

The public view link can change the displayed month and export evidence, but cannot create or alter a financial review.

## Record safety and backup

New entries live in the separate `finance745` append-only map, one synced document per revision. No existing shift, wage rate, customer rate, installation tick or charge is migrated or changed. No reviews or journals are seeded by this release. Failed local saves roll back the attempted entry; concurrent edits are flagged rather than silently replacing evidence.

The page’s **Tools → Export/Import**, the dedicated review backup and document-by-document sync preserve the new map. The service’s older `/api/export` endpoint has a fixed collection list and does not include it. Use the client export for a complete backup; this page-only release does not update that backend endpoint.

## Unchanged and still outstanding

- Existing reference financials, labour-charge projections, sub-hire records, map pins and source shifts remain unchanged.
- Today, the MP4/weather banner, existing speedos and Showcase are not changed.
- GN20’s 350 kVA install amount is **not fixed by this release**. Andrew approved the 315 kVA basis; its original rate row is still unavailable. The notice now states that approval accurately. Hire and demob prices are unchanged.
- Existing hours are not automatically treated as actuals, and existing supplier costs are not assumed already allocated. A person must verify those facts.

## Evidence

- Model checks: **70/70**. Browser practice: **38/38 desktop and 38/38 phone**. Both full sweeps: **21 tabs and seven deep links**, zero page, console or navigation errors.
- All **202 references** and the existing labour-charge plan were unchanged by the practice workflow. Only the isolated test browser held seven Finance events and their own audit metadata; no test writes reached the service.
- Five inline scripts passed syntax and secret checks. Reapplying the patch was refused without changing the build hash. Upload preflight confirmed edit access and an unchanged live base.
- `evidence/model_test.js`: in-memory financial and persistence safeguards, no network.
- `evidence/practice_tests.js`: desktop and phone UI workflow, GET-only live harness; all test writes captured in the isolated browser.
- `evidence/sweep_desktop.json` and `sweep_phone.json`: complete navigation sweeps.
- `evidence/finance_*_phone.png`: actual phone-viewport checks, not a design mockup.
- `evidence/live_smoke.js` and its JSON/screenshots: fresh actual-public-page verification after deployment, without local page substitution.
- Post-release checks passed **9/9 on desktop and 9/9 on phone**: correct public build, view-only month navigation, edit protection, source availability, unchanged record, viewport fit and zero page/console/write errors. There were no Finance review events seeded in the live record.

The build used `toolchain/build.sh v7.45 v7.45_monthly_financial_control/patch_v745.py` from the then-live v7.44 page. The release folder is now `v7.45_monthly_financial_control_LIVE/`. Repeating the patch on the current live page is intentionally refused; the retained `build/GC500_v7.45/base_live.html` is the original reproduction base.
