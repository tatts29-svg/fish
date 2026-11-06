# Morning audit — 14 Oct 2026

Author: Andrew Fisher

Andrew requested: “Audit today so far”. This was a read-only audit, with operational and financial records captured at 09:11–09:12 AEST and focused phone checks completed at 09:15 AEST. The native record remained 5874. Baseline: native 5814 at 06:12 AEST. No operational records, prices, hours, application code or releases were changed.

Site confirmations, Andrew's instructions and current agreed rate cards remain authoritative. Baseplan is supporting evidence. Source financial detail and the two-tab workbook are retained privately, not committed here.

## Outcome

Four buildings — P25, P65, P66 and P67 — were newly recorded onsite this morning. This establishes the status-entry times, not independently confirmed physical arrival dates. Automatic applicable work and transport selections follow the received quantities. Manual stairs selections require the review below.

Today's proposed 24-FWF supplier load matches Build at all seven stops. No new FWF receipt is recorded today. All 11 supplier receipt/planning date groups match their Build projections. Remaining allocated FWF runs are 24 on 14 Oct, 24 on 15 Oct, 24 on 16 Oct and four on 17 Oct. Six additional FWF have no destination allocation. The confirmed 194-FWF requirement reconciles as 112 received, 76 allocated remaining and six unallocated. Six pee panels and two 16-pan blocks are separate products. No active Event Portables identity duplicate or restoration of the removed WC69 number was found.

Generator hire obeys the published standby rate from delivery through Thursday 22 Oct, the full rate on 23–25 Oct, and no hire from Monday 26 Oct. Original rate precision and per-contract rounding are preserved. Financial arithmetic and branch controls pass for the recorded inputs; this does not certify source allocations or missing prices as complete.

## Needs attention

1. **P66 hire allocation:** one received building selects the confirmed-asset line and an old blank-asset placeholder. The drawer and central contract source valuation include both; the arrived package correctly counts one. Reconcile the source allocation across the drawer, Costs and P&L. This is an existing source allocation, not a second new transaction posted this morning.
2. **P65 forecast allocation:** the received building uses its confirmed-asset source line, while the old P65 placeholder remains held in forecast. Reconcile the placeholder against legitimate remaining scope before removing anything.
3. **Stairs:** all four newly recorded buildings have physical Steps complete, while priced Stairs remains zero. Check the intended manual charge selection; a completion tick does not establish a billable quantity.
4. **Toilet destinations:** allocate the six unallocated FWF to confirmed destinations before adding them to the daily runs. Do not invent deliveries.
5. **Labour:** Eric and Kyle have no actual hours entered today. The latest manual availability contains four names and excludes Kyle, although he remains on the roster. Check attendance before changing the saved list. Kyle's race-weekend nights and six separate fencing people remain recorded.
6. **Existing financial holds:** 52 rate/allocation entries across 32 reference/item groups remain, unchanged this morning. They cover 16 delivery, 16 pickup, six hire-price, five work-scope/rate, four hire-quantity/allocation, three existing-hire allocation, one cable-period and one forklift type/date/branch review. The user-excluded damage-waiver placeholder is not a missing charge to add. GN20 trip amounts deliberately remain editable/unpriced as instructed.
7. **Legacy forklift alias:** T0004/FL02 share one physical forklift. Hire is counted once. Clarify the alias without adding another unit or hire charge.

The private workbook lists exact references, source contracts/lines and amounts. T0109 has no explicit actual-arrival date; old schedule wording must not be reported as confirmed arrival evidence. WC29/WC30 routing is not a proven defect: current master-sheet geometry supports the current classification. No map or route change is justified by this audit alone.

## Verification and limits

- 46 operational controls pass.
- 27 financial consistency and morning-movement controls pass.
- 68 independent generator checks plus total reconciliation pass.
- 25 focused actual-public phone checks pass at 390 × 844: Today/Build date selection, selected Demob card, tested control legibility, no page-wide overflow, persistent P33 open sections/scroll, explicit Close/Back and no runtime errors.
- The public view was kept read-only. Save modules are present; editing/acknowledgement was not exercised in this audit. Isolated edit-handler tests belong to the v10.12 release evidence.
- One map-session POST was blocked by the GET-only guard. It was not an operational write. Map tile-session loading is outside this audit's UI coverage.
- Exact v10.12 public SHA256: `cde0aae30d5e528e85c2b16189bf0c0828397b87a7b3d10c1695362b19a58105`, 15,164,541 bytes. No substituted page was used.

## Private handover

- Audit records and source capture: `/workspace/private-today-audit14Oct2026/operations.json`
- Operational review: `/workspace/private-today-audit14Oct2026/operational-findings.json`
- Financial review: `/workspace/private-today-audit14Oct2026/finance/financial-audit-summary.json`
- Targeted source-allocation probe: `/workspace/private-today-audit14Oct2026/finance/allocation-probe.json`
- Phone checks and screenshots: `/workspace/private-today-audit14Oct2026/ui/`
- Workbook: `/workspace/output/GC500_Today_Audit_14Oct2026.xlsx` — Existing / Needs fixing.
- Workbook generation and verification: `/workspace/private-today-audit14Oct2026/make_report.py` and `workbook-check.json`.

Root combined separate operational, financial, generator and phone reviews. An independent financial review of the workbook identified and corrected the T0109 arrival wording before delivery. Nothing was imported or posted; cost sign-off remains open on the findings above.
