# Quantity, ownership and progress audit

Author: Andrew Fisher

Base: exact v10.11 live page SHA-256 `a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557`.
State: scoped patches tested; the root release composes and verifies the final candidate before publication.

`patch_inventory1012.py` adds the missing single-item path to the existing typed inventory ownership projection. WC70 and WC72 each have a verified Event Portables FWF identity, but the old Inventory counted each as unidentified because it only reconciled mixed-item locations or VMS. The correction retains the existing receipt, complete identity coverage, duplicate-number and reference guards. It changes ownership counts only; quantities, physical status, photos and native records remain unchanged.

`patch_percentage1012.py` and `percentage1012.js` keep raw progress ratios separate from display rounding. Near-complete work cannot round up to 100% or turn all lights green. VMS completion-review bounds remain visible when the required scope is provisional. The patch retains missing-data and stale-record guards, the seven equally weighted category index and the existing separate fencing quantities.

Validation:

- 94 precision checks execute original and patched source, reproduce the earlier false completion, and verify all 103 inline scripts parse. Independently reviewed and rerun.
- 19 inventory identity tests verify supplier/Coates ownership, mixed items, partial receipts, unknown scope, duplicates, reference mismatches and idempotent aggregation.
- 21 pure quantity/receipt/collection tests verify typed Demob subtraction, duplicate collection rejection, reference/load denominators, unknown and future states.
- 21 blocked-write browser checks on the inventory candidate reconcile 182 typed quantity groups and 108 fully identified on-site ownership groups. In-memory quantity, receipt, completion and collection changes propagate through Today, Build, map status/quantity, Inventory and supplier runs. Every fixture restores the exact shared record. Zero browser errors or attempted operational writes.

The checks distinguish receipt from physical completion and physical collection. A delivered item can satisfy Build delivery counts while its installation remains incomplete. A two-unit pickup reduces current stock by two and cannot close a six-unit Demob scope. Metres and unit counts are never added to calculate the seven-category index.

## Remaining limitation

The original `inventory()` implementation at base line 16103 still substitutes one when an ordered charge-line quantity is unknown. The map and progress readers retain unknown quantity instead. The audited live snapshot has **zero active unknown-quantity charge lines**, so none of the current 182 typed quantity groups is affected. This latent behaviour needs an unknown-aware Inventory presentation and export contract before future missing quantities can be represented safely. It is documented, not silently claimed fixed. No unsupported quantity or operational record was invented during this release.

## Re-run

Set `PAGE` to the final local candidate. `EXPECTED_SHA` may bind the browser and pure quantity tests to the expected exact hash.

```sh
BASE=/workspace/private-argon-review-14Oct2026/live.html node numbers/test_percentage1012.cjs
PAGE=/absolute/candidate.html node numbers/inventory1012.cjs
PAGE=/absolute/candidate.html node numbers/quantities1012.cjs
CHROMIUM_PATH=/usr/bin/chromium PAGE=/absolute/candidate.html OUT=/absolute/evidence-directory flock /tmp/gc500-browser.lock node numbers/check_numbers1012.cjs
```

The browser harness intercepts the page at the public view URL and blocks operational writes. It reads the current shared record. Private fixture snapshots remain outside the repository; committed evidence contains assertions, hashes and aggregate counts.
