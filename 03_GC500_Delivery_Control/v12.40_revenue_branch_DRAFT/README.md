# Exact customer Revenue branches

Author: Andrew Fisher.

**DRAFT — native financial checks and release integration pending. Not ready to upload.**

A confirmed customer charge sometimes belongs to a different financial branch while its source sales code, supplier cost and physical equipment record must remain intact. The existing whole-reference branch setter cannot express that distinction for a mixed reference.

This patch records a named, dated Revenue branch decision against one exact ordinary contract hire row or one event-scope role. The existing customer branch reader and event-role allocation use that decision; the charge amount and category stay unchanged. Supplier pricing, cost branches, source codes, operational references, dates and dockets are not edited. Generator-specific and separately allocated contract models remain outside this control.

The decision binds the exact source, current ordinary branch and relevant customer override. A source change makes the decision visible for review and restores the ordinary allocation until reviewed. Clearing and reapplying retain complete prior decisions. The native setter rejects stale revisions and concurrent edits. Free-text question answers cannot overwrite these records.

Controls sit on the existing Costs contract line and customer event-scope row. No decision is installed by the release. Private evidence, financial figures and record inputs remain outside this repository.

## Checks and release

```sh
node v12.40_revenue_branch_DRAFT/tests/test_revenue1240.cjs
toolchain/build.sh v12.40 v12.40_revenue_branch_DRAFT/patch_v1240.py
```

Synthetic resolver/native API checks pass 61/61 and cover exact identity, stale source and overrides, permission/name gates, history, concurrency, remaining customer Revenue, role preservation and unrelated physical/source records. Browser acceptance must also prove whole-job and category totals, every supplier cost and cost branch, Finance allocation and the underlying record are unchanged. Both final navigation sweeps and a phone inspection are required before READY.

The patch requires the coordinated v12.39 source and refuses another base or repeat application. Final publication starts from current verified live bytes through the shared build and unchanged-base uploader. No private record change or publication has been performed by this draft.
