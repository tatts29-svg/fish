# Baseplan source refresh and linked supplier estimates — v9.49

Author: Andrew Fisher.

READY for the combined release; publication belongs to the coordinating release owner. Based on verified live v9.48. No operational records, source customer rates, physical allocations or photographs are written.

Andrew supplied the latest Baseplan workbook in the current chat and said the added sub-hire information is “our costs”. He subsequently asked to work the cost out from the linked line. The supplier forecast therefore uses the exact annotated supplier rate, matched source line quantity and existing native charge basis. It is clearly labelled a calculated estimate, not a supplier invoice or confirmed actual.

The parser reads all eleven tabs, normalises the single overwritten Line header, excludes non-line annotation rows, refreshes 320 active lines, and retains the four absent lines in a source-history disclosure. All 317 retained allocations and customer rates remain unchanged. The three new lines enrich the contract source; they do not replace site identities. The Events replacement contract number is shown beside the current site record. The concert generator units already exist and are not added again. Existing repeated fleet numbers remain flagged rather than silently removed.

Two supplier annotations cover nine source lines. VMS uses the native daily window and minimum on each linked line; the refrigerated container uses the native whole-event basis. The customer Revenue branch and supplier cost sales-analysis branch remain distinct. One forecast is reused by Costs to job end, Rehire by branch, Forecast P&L, Finance handover and monthly forecast review. Recorded costs, supplier quotes and actual journal proposals remain unchanged.

A usable native Direct-cost expense with the exact supplier and contract/line replaces the matching estimate. The existing expense Supplier field identifies the supplier; its What, Receipt/invoice or Note text can explicitly identify `contract 1234567 line 2`. Structured contract fields are also recognised. An explicit `period YYYY-MM-DD to YYYY-MM-DD` in Note covers those dates only, end exclusive, preserving uncovered daily cost. A whole-contract entry without a line replaces that supplier's matched contract scope; another contract does not. Overlapping periods are counted once. A partial-period actual against a whole-event price is held and explained because these sources cannot allocate the remaining event cost safely. No record is manufactured and no rate or total is edited.

## Build

The private original is required and SHA-256 checked. Do not commit or upload it for handover.

```sh
BASEPLAN949_XLSX=/private/path/Baseplan-SuperCars.xlsx \
  python3 patch_v949.py /private/path/candidate.html
```

The standard one-path in-place toolchain invocation and optional INPUT OUTPUT invocation are supported. The patch rejects an incorrect base, changed source scope, moved retained allocation, or reapplication.

## Validation

`test_source949.py` reads the private source and checks parser scope, retained customer rates/joins, operational DATA preservation, existing concert-unit matches and reapplication rejection. `test_estimates949.cjs` uses synthetic rates to cover exact supplier/contract/line matches, different contracts, whole scope, partial periods, overlap and unchanged inputs. `native949.cjs` requires private frozen record, clock, baseline and original-source oracle inputs; it blocks writes, captures all sixteen financial models and checks physical units/photos and all seventeen native ties on desktop and phone. Detailed money evidence and screenshots remain private; only sanitised counts are retained here.

The source refresh also releases the existing provisional transport estimate previously held behind the removed Events transport line. Its source charge removal and forecast coverage change are tested separately. No new transport rate was introduced.

Final source validation: 1,647 financial assertions and all 17 native ties passed on each viewport; 251 native unit models and every canonical photo binding remained identical. The phone formula table was visually checked. Exact tested candidate and base hashes are in `evidence/validation.json`.
