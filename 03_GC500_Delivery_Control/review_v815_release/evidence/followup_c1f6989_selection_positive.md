# Selection preservation — isolated correction

Author: Andrew Fisher · 3 Oct 2026 AEST.

**70/70 CPU checks pass: the previous 43 positive assertions are unchanged, and 27 new checks cover selection, asynchronous refresh and focus etiquette.** Browser verification remains with the release owner. This is a proposal, not a published release.

The [isolated patch](proposal_c1f6989_selection.py) applies to a private copy of frozen `c1f69890736fae4c004e4643ff4139bb19cebeeb` source or its exact built page. It leaves the implementation-owner files untouched.

| Binding | SHA-256 |
| --- | --- |
| Original built page | `665f53fef3bd685260771c2d8e2867531263f3af7e9c84d870c316797f4c15fb` |
| Proposal Python file | `5972e8769cd43972019adb5daf9227814aeebf6f7a215de97462d67d800849e2` |
| Patched Documents source | `da33522f35097ce2987e26ede691cd9d99b6e606e6522af8a0e02bb9e07cf134` |
| Privately patched built page | `35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770` |

The selected document ID persists separately from a pending one-time focus request. Full and partial redraws reapply `aria-current`; a row that owned keyboard focus before replacement receives it again without a new scroll jump. A still-pending initial jump resolves the current DOM row, so a replaced node cannot swallow the request. Moving to another control cancels that pending focus action. Typing a new Documents query, clearing the query, choosing a category, following a category link or opening a photo reference clears the selection identity and pending request.

[Positive script](followup_c1f6989_selection_positive.cjs) and [results](followup_c1f6989_selection_positive_results.json) confirm:

- File-list completion both before and after the initial focus timer preserves marker and focus.
- Full and partial redraws retain selected-row focus and avoid another scroll jump.
- Search, category and other-control focus is respected for pending and completed selections, with and without an intervening redraw.
- New query/category choices remove stale selection; redraws do not change catalogue data, file metadata or book records.

Reproduce after creating a private copy of the three draft source files and retaining the exact original built HTML outside the repository:

```bash
python3 03_GC500_Delivery_Control/review_v815_release/evidence/proposal_c1f6989_selection.py \
  "$PRIVATE_SOURCE_DIR/docs815_src.js"
node 03_GC500_Delivery_Control/review_v815_release/evidence/followup_c1f6989_selection_positive.cjs \
  --source-dir "$PRIVATE_SOURCE_DIR" \
  --baseline 03_GC500_Delivery_Control/review_v815_release/evidence/baseline_v813.json \
  --current-base 03_GC500_Delivery_Control/review_v815_release/evidence/followup_e540cbc_base.json \
  --page "$ORIGINAL_C1F6989_PAGE" \
  --out "$PRIVATE_RESULT_PATH"
```

Expected: `preservedPositiveChecks: 43`, `selectionChecksPassed: 27`, `selectionChecksTotal: 27`, no failures, exit 0. The prior positive fixture's source binding is updated in memory for this proposal; none of its 43 assertions are changed. Real source functions run against invented records and DOM/timer doubles. These results make no browser geometry or elapsed-time performance claim. Python/JavaScript syntax checks also pass. No browser, network/live writes or commits were performed.
