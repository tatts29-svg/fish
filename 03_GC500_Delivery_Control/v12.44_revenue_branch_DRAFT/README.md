# Exact customer Revenue branches

Author: Andrew Fisher.

**DRAFT — release v12.44, renamed from the reserved v12.40 scope. Native financial checks and release integration pending. Not ready to upload.**

The stable `RevenueBranch1240` API, script marker, decision keys and history schema remain unchanged. The release rename follows the urgent performance work and preserves the separately owned Demob releases. Earlier v12.40 previews are superseded; no v12.44 candidate has been verified live.

A confirmed customer charge sometimes belongs to a different financial branch while its source sales code, supplier cost and physical equipment record must remain intact. The existing whole-reference branch setter cannot express that distinction for a mixed reference.

This patch records a named, dated Revenue branch decision against one exact ordinary contract hire row or one event-scope role. The existing customer branch reader and event-role allocation use that decision; the charge amount and category stay unchanged. Supplier pricing, cost branches, source codes, operational references, dates and dockets are not edited. Generator-specific and separately allocated contract models remain outside this control.

The decision binds the exact source, current ordinary branch and relevant customer override. A source change makes the decision visible for review and restores the ordinary allocation until reviewed. Clearing and reapplying retain complete prior decisions. The native setter rejects stale revisions and concurrent edits. Free-text question answers cannot overwrite these records.

Controls sit on the existing Costs contract line and customer event-scope row. No decision is installed by the release. Private evidence, financial figures and record inputs remain outside this repository.

## Checks and release

```sh
node v12.44_revenue_branch_DRAFT/tests/test_revenue1240.cjs
node v12.44_revenue_branch_DRAFT/tests/test_transfer_oracle.cjs
node v12.44_revenue_branch_DRAFT/tests/test_native_document_shape.cjs
toolchain/build.sh v12.44 v12.44_revenue_branch_DRAFT/patch_v1244.py
```

Synthetic resolver/native API checks pass 61/61 and cover exact identity, stale source and overrides, permission/name gates, history, concurrency, remaining customer Revenue, role preservation and unrelated physical/source records. A separate test-only transfer oracle passes 43/43 synthetic checks. It derives expected current/job branch movement from frozen contract contributions, remaining forecast rows and the agreed scope's grouped cent allocation. Missing, duplicate, misdirected or residual-hidden transfers and incorrect Finance invoice rows fail independently of the new branch reader.

Browser gates are prepared but have not run on the final release or preceding applied customer record. The harness requires an explicit frozen record, verifies its native documents/version and empty queue, and rejects all HTTP writes. Only absent versus empty top-level collection maps are equivalent; every logical document and nested value remains exact. The shape boundary passes 39/39 offline checks, including refusal of missing, moved or changed documents and malformed collections. Version, inflight and queue checks remain exact. This test-only normalization never applies to an operational write plan.

The inactive-release comparison preserves all financial, category, branch, source and physical projections; native staged decisions must match the independent transfer oracle. Its source branches come from the pre-set ordinary reader, with an additional check that the module's retained source agrees. Both final navigation sweeps and a phone inspection remain required before READY.

The patch requires the coordinated v12.43 source and refuses another base or repeat application. Final publication starts from current verified live bytes through the shared build and unchanged-base uploader. No private record change or publication has been performed by this draft.
