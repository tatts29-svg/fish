# Fridge placements and refrigerated-container arrival — 14 Oct 2026

Author: Andrew Fisher

The authorised native record update is saved live. The page remains v10.12; no page release was required.

| Reference | Confirmed change |
| --- | --- |
| P46 → P54 | Existing fridge **1328957** moved once. Its original P46 placement remains in removed history. |
| P46 | Replacement fridge **1272751**, quantity 1. |
| T0265 | Four existing planned fridges arrived 14 October and complete: **1318501, 1260164, 1283996, 1311992**. |
| T0266 | One subhired refrigerated container, **920584**, arrived **13 October**; completion recorded 14 October. Supplier: **United Rentals (Royal Wolf)**. |

Andrew supplied the asset numbers, placements and arrival dates in this chat. This morning's original **Baseplan SuperCars (2).xlsx**, sheet **9974042-KINP**, row 3 / contract **9974042, line 2**, independently lists the refrigerated container as delivered 13 October. The sheet identifies supplier ROY002 and names United Rentals Australia Pty Ltd / Royal Wolf at B12. It uses SUB-2131; it does not contain physical number 920584 or reference T0266. Those links come from Andrew's confirmed site information.

The current page's native accessory controls moved/replaced the P46 fridge. Native typed-unit controls recorded the four T0265 fridges and the T0266 supplier-owned container without additional accessories or duplicate quantities. Existing building identities, photos, completion states and dates were preserved.

The legacy arrival schema requires an ISO timestamp. T0266 uses the start of the confirmed AEST day, with explicit `date_only`, `effective_date` and real `recorded_at` provenance and a visible note that the exact arrival time was not supplied. The current page's validated import function applied this correction to a clone of the fresh record; a full document comparison permitted only the authorised changes. Arrival lists now count T0266 on 13 October only. Completion remains a truthful 14 October recording. Some legacy time displays can still show the date-boundary clock value; it is not an observed arrival time.

## Verification and safeguards

- Exact live page SHA256: `cde0aae30d5e528e85c2b16189bf0c0828397b87a7b3d10c1695362b19a58105`.
- Read-only extended practice: 56 scoped checks, 33 proposed writes, zero server writes.
- Independent extended reviews: 66 operational checks and 39 financial checks passed.
- Live update: native version **5992 → 6025**, **33** acknowledged writes, full fresh server and native readbacks equal the intended record. Changes made elsewhere between practice and application were preserved by the fresh baseline and exact write gate.
- Fresh actual-public browser verification: **57 checks passed** on native **6025**, with zero errors, writes or substituted page.
- Rates, contracts, branch settings, labour selections, supplier receipts and Direct-cost records were not changed. Existing building photos, unrelated assets, future physical demob and unknown off-hire dates were preserved.

Private backups, exact native bodies and commercial review evidence are outside Git under `/workspace/private-fridges14Oct2026/`. The successful apply directory is `record_14Oct2026_fridges_2026-10-14T00-00-01-667Z`. Independent reviews are in the preceding extended-practice directory, `record_14Oct2026_fridges_2026-10-13T23-57-34-571Z`.

## Financial limits

This batch does not sign off all job pricing. The onsite priced subtotal increases by **$234.18** from the fridge changes, at original rate precision. Source-contract Revenue, P&L and Direct costs are unchanged. T0265 still exposes Delivery/Pickup allocation holds. T0266's hire and transport already exist in the source ledger, but its item-level Hire/Delivery/Pickup allocation remains unresolved; no new charge was added to duplicate them. The supplier estimate remains a forecast, not a claimed invoice. Whole-contract `setRental` is not a safe substitute for the missing exact-line allocation.

The shared scripts refuse to reapply once the identities have been recorded. They require a fresh backup, exact live page hash, unchanged record before transmission, allowlisted native documents, durable acknowledgements and full readback. Credentials are read only from the private environment and never written to logs or Git.
