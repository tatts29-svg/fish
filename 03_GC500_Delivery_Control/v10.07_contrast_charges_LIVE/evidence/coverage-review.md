Author: Andrew Fisher

# Arrived-equipment charge review

Baseline: read-only public v10.06, SHA `fc7995c79cd5df18c47de4f2c05f1499382ba0313ae8b27dd23d783606a59068`, shared record 5796, 13 Oct 2026 at 20:36 AEST. No record changes.

Final combined candidate: SHA `0106085127fbb27dd15942261925c667cf4db429e28f45ac540776252095ce18`, same shared record 5796, checked 13 Oct 2026 at 20:57 AEST. All 17 coverage controls, 51 independent before/after financial invariants and 56 independent pure/integration-wrapper scenarios pass. The candidate moves the existing $4,033.01 pee-panel hire into current KINP Rehire Revenue once, removes it from remaining forecast and retains whole-job Revenue, Direct costs, generator charges, service charges and transport unchanged. October includes that existing amount once as a Finance review; nothing is added to September. Five previously silent work-scope gaps are now explicit. This is candidate verification, not a claim of publication.

Final contrast rebuild: SHA `b5d99de88886d9f03aad7af2177b68b1239919542f6c27e2d80be7ec9a89bdfb`. All 95 full script blocks, including DATA, and all non-style HTML are byte-for-byte identical to the audited candidate. `finance-final-equivalence.json` proves the style-only difference. Financial evidence therefore remains valid without replaying unchanged calculations; the workbook names this final release hash and the original financial capture hash separately.

The audit checked 185 reference/item groups, including 117 with received quantities. All 17 checks passed: applicable automatic service quantities, manual stairs, unique service lines, Costs/P&L/branch reconciliation, transport actual/remaining reconciliation and generator branch totals. Zero browser/model errors or write attempts.

Included service charges for arrived quantities:

| Charge | Applicable item groups | Pieces | Revenue ex GST |
|---|---:|---:|---:|
| Install | 104 | 269 | $20,606.69 |
| Levelling | 57 | 71 | $5,205.00 |
| Cleaning | 57 | 71 | $8,900.55 |
| Demob | 104 | 269 | $20,606.69 |

These are charge inclusions, not assertions that future cleaning, pickup or demob has physically happened. Stairs remain manually selected. All arrived item groups have a branch. The six waste tanks have included hire and separate applicable install/level/clean/demob charges; their transport coverage still needs confirmation.

## Remaining coverage questions

- 32 transport legs across 17 arrived references need an exact rate or existing-contract allocation. A separate 46 legs across 23 pending references remain forecast questions. Existing transport is not charged a second time to clear a hold.
- Ten arrived hire/quantity/allocation holds comprise five primary items and five accessories. Some are contract linkage or duplicate-reference questions, not proof that the whole-job Revenue is missing.
- Five arrived item groups have no exact service-rate match. An empty service list does not establish that work is free. The v10.07 candidate now shows the warning for trailer toilets, a 3 m container and three TL2 barrier references. Coates own-use equipment remains excluded.
- The candidate fixes the six arrived pee panels' existing approved $4,033.01 hire classification. That same amount is now arrived Revenue; no price increase or duplicate amount was added.
- No damage waiver was added. The existing unconfigured-waiver marker is a separate job-policy issue, not permission to add 25% or another amount.

Direct-cost completeness is separate: 17 labour records lack hours (two past/current, 15 future); 92 shifts have hours but no usable cost rate (43 past/current, 49 future). Fifteen historical reviews are stale/orphaned. Customer per-piece charges do not prove that payroll or supplier costs are complete.

Private detail: `/workspace/private-gc500-finance1007/coverage-snapshot.json`, `coverage-register.json` and `coverage-register.csv`. These include the exact references, source fields and actions and are not committed to the public repository.

User workbook: `/workspace/output/GC500_Charge_Audit_13Oct2026.xlsx`, two tabs — Existing charges (208 rows including accessories) and Needs fixing (32 grouped customer-charge actions plus two separate labour Direct-cost summaries). Unknown rates are blank, not zero. Existing contract aliases and asset-number differences carry exact contract-line actions; they are not described as new money to add. Figures tie to the final candidate's $380,578.98 onsite priced subtotal. Item-group counts are not counts of unique physical assets.

Verdict: all applicable priced arrived service charges reconcile. Full charge completeness remains partial until the unresolved rate, scope, quantity and contract allocations are settled; do not describe every cost as 100% complete.
