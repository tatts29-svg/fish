# Quantity, ownership and progress audit

Author: Andrew Fisher

Base: exact v10.11 live page SHA-256 `a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557`.
State: scoped patches tested; the root release composes and verifies the final candidate before publication.

`patch_inventory1012.py` adds the missing single-item path to the existing typed inventory ownership projection. WC70 and WC72 each have a verified Event Portables FWF identity, but the old Inventory counted each as unidentified because it only reconciled mixed-item locations or VMS. The correction retains the existing receipt, complete identity coverage, duplicate-number and reference guards. It changes ownership counts only; quantities, physical status, photos and native records remain unchanged.

`patch_percentage1012.py` and `percentage1012.js` keep raw progress ratios separate from display rounding. Near-complete work cannot round up to 100% or turn all lights green. VMS completion-review bounds remain visible when the required scope is provisional. The patch retains missing-data and stale-record guards, the seven equally weighted category index and the existing separate fencing quantities.

Validation:

- 99 precision checks execute original and patched source, reproduce the earlier false completion, and verify all 103 inline scripts parse. Independently reviewed and rerun.
- 19 inventory identity tests verify supplier/Coates ownership, mixed items, partial receipts, unknown scope, duplicates, reference mismatches and idempotent aggregation.
- 21 pure quantity/receipt/collection tests verify typed Demob subtraction, duplicate collection rejection, reference/load denominators, unknown and future states.
- 29 blocked-write browser checks on the quantity and inventory candidate reconcile 182 typed quantity groups and 108 fully identified on-site ownership groups. In-memory quantity, receipt, completion and collection changes propagate through Today, Build, map status/quantity, Inventory and supplier runs. Every fixture restores the exact shared record. Zero browser errors or attempted operational writes.

The checks distinguish receipt from physical completion and physical collection. A delivered item can satisfy Build delivery counts while its installation remains incomplete. A two-unit pickup reduces current stock by two and cannot close a six-unit Demob scope. Metres and unit counts are never added to calculate the seven-category index.

## Shared quantity rule

`patch_description_quantity1012.py` and `description_quantity1012.js` implement the project manager’s latest instruction: a separate described item counts as one when no quantity is supplied; an explicit description quantity counts as stated. A valid structured quantity, including zero, takes precedence. The shared projection feeds direct charge-line readers and `qtyOf`, preserving rate keys and source evidence. Existing asset-number inference no longer decides the count. Capacities, dimensions, reference numbers and fleet numbers cannot become quantities.

63 independent parser/projection tests cover explicit and missing quantities, legacy inferred defaults, mixed item descriptions, schedule rows, context preservation and dimension boundaries. Valid described defaults are priceable and are not flagged as missing. Truly invalid explicit quantities remain unpriced; Inventory excludes those invalid lines and provides a compact reference correction link. The former Inventory-only unknown-quantity proposal is superseded and is not included.

An exact same-record before/after comparison retained all 191 charge-line quantities and five monetary totals. The current 182 active typed quantity groups remain consistent across Inventory and map. Nine formerly blank planned schedule quantities now explicitly read one, matching their existing order quantities. Recorded arrivals, completed work and collection records remain separate from inferred planned scope.

## Re-run

Set `PAGE` to the final local candidate. `EXPECTED_SHA` may bind the browser and pure quantity tests to the expected exact hash.

```sh
BASE=/workspace/private-argon-review-14Oct2026/live.html node numbers/test_percentage1012.cjs
PAGE=/absolute/candidate.html node numbers/inventory1012.cjs
PAGE=/absolute/candidate.html node numbers/quantities1012.cjs
node numbers/test_description_independent1012.cjs
CHROMIUM_PATH=/usr/bin/chromium PAGE=/absolute/candidate.html OUT=/absolute/evidence-directory flock /tmp/gc500-browser.lock node numbers/check_numbers1012.cjs
```

The browser harness intercepts the page at the public view URL and blocks operational writes. It reads the current shared record. Private fixture snapshots remain outside the repository; committed evidence contains assertions, hashes and aggregate counts.
