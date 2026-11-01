# P&L v1.18 / v12.78 source review — integration proposals, not live

Author: Andrew Fisher

Reviewed source: `dc055cddc2f88a4879d65a4aa676c974adaf1f90` on `ccr-061f77e8-ivjhrv`. The release owner's current candidate and status are recorded in [PR #1, comment 6554599617](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6554599617). This folder contains source-only review proposals and synthetic tests. The active release source, operational records and live page are unchanged by this handover.

## 1. Finance rule dependencies

`row_rule_scope.patch` passes the source shift to the rule-selection helper. It excludes unrelated weekday/weekend/default-break rules while retaining rules read by that row's calculation branch, genuine input changes and the historical default-rule fingerprint. Saved review events are never rewritten and no reduced-snapshot fallback is introduced. The source-only synthetic test passes 50/50 on the proposal; the original fails the irrelevant-rule cases.

See `FINANCE_RULE_SCOPE.md` for the compatibility boundary. An active branch's threshold rule may still conservatively invalidate a short shift that does not reach that threshold. Historical nonempty irrelevant-rule maps are not automatically migrated. This patch does not claim a general fingerprint migration.

From a clean checkout of the reviewed source, after agreeing integration ownership:

```
git apply --unidiff-zero --check 03_GC500_Delivery_Control/review_01Nov2026_pl_v118/row_rule_scope.patch
git apply --unidiff-zero 03_GC500_Delivery_Control/review_01Nov2026_pl_v118/row_rule_scope.patch
node 03_GC500_Delivery_Control/review_01Nov2026_pl_v118/test_row_rule_scope.cjs 03_GC500_Delivery_Control/v12.78_finance_fingerprint/patch_v1278.py
```

## 2. Worked hours, paid hours and monetary journals

`propose_paid_basis_wording.py` writes review copies outside the checkout. It names existing worked-hour columns, distinguishes them from calculated paid-hour quantities, explains the raw daily register's separate purpose, and states that displayed rounded hour bands must not be re-priced into monetary journals. It retains the salary-allowance and uncosted-wage distinctions. No layout or calculation change is proposed.

All anchors must match the reviewed source exactly; the helper fails on an unexpected or already changed source. Its public synthetic tests pass 6/6. Financial inputs, generated outputs and numerical comparison evidence remain private.

```
python3 03_GC500_Delivery_Control/review_01Nov2026_pl_v118/test_paid_basis_wording.py
python3 03_GC500_Delivery_Control/review_01Nov2026_pl_v118/propose_paid_basis_wording.py --source-root /path/to/reviewed-checkout --output /private/review-copies
```

The release owner reviews those copies before applying the two changed source files. Rebuild the private pack, regenerate its PDF and update the data hash in the page patch. Do not keep an old data pin after changing generated text. Rebuild the page from the latest live base and run affected desktop, phone, Finance, search/caret and print checks, then the usual release guards. Longer notes must print completely. Preserve the raw daily register. Refresh the private pack README as well: the builder does not generate that file. Keep the financial and paid-hours capture provenance distinct.

## Handover boundary

The release owner retains implementation and publication. This is not READY TO UPLOAD, a ledger certification or a live-verification claim. Reconcile successor source before integration. Use the existing guarded release process and independently read the resulting live bytes before reporting a release as live. Any private source-description corrections are supplied separately to Andrew; no originals, operational rows or private financial evidence are included here.

The existing full Costs redraw performance follow-up remains with its previously agreed owner, as stated in the linked handover. It is outside these two narrow proposals.
