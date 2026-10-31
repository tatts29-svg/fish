# Documents cache — frozen source follow-up

Author: Andrew Fisher · 3 Oct 2026 AEST.

**The original 28 positive correction checks pass again on e540cbc. The additional cache/redraw checks pass 13/14; one new stale-classification issue remains.** This is independent source/CPU evidence, not READY or live approval. Earlier 6a0bb20 results are not used as results for this snapshot.

Exact commit: `e540cbc31bef88500f9b781688c53f8693932514`.

| File | SHA-256 |
| --- | --- |
| `docs815_src.js` | `99b24b0ffe9abebf893004e51c074dfdde572bb4a61e5c2555f38597e9c42e10` |
| `patch_v815.py` | `2d0a8457f22049123ecf437c6ef05fcf9bdd781e98c8e3508783e1744ea2c161` |
| `v815.css` | `81c2bf72a6438adf8aaa8c6dd4072629671f01b8be4b1d4a8f34952798cd4e21` |

**P2 — incoming book changes do not invalidate the collection while Documents search keeps focus.** The cache seeded at `docs815_src.js:314` and reused at `:357` checks only file-registry identity, length, timestamp and loading state. Document classification also depends on book numbers and asset numbers. In the exact current base, `applyRemote()` at line 39478 applies records through `syncFold()`, then requests `syncRedraw()` at line 39529. That function defers a full render while `docQ815` owns focus. Further search keystrokes use the unchanged cached collection.

The synthetic reproduction adds a book record for `54321` through those actual remote-handler functions. A previously uploaded, untyped `synthetic_cache_54321.jpg` stays classified as **Photographs** on a partial redraw; a fresh `docCollection()` correctly returns **Fencing dockets**. The stale collection also lacks its generated docket explanation, so note-based searching can miss it. Releasing focus and allowing the pending full redraw repairs the classification. No actual record or uploaded file is used or changed. Preserve `holdAssets()` while making cache validity depend on relevant record changes, or invalidate this cache when those changes are applied.

The other checks confirm that full rendering seeds the collection, unchanged partial redraws reuse it, and all four existing registry guards trigger recomputation. Each tested partial redraw performs one asset build through the actual current-base `holdAssets()` helper. The actual `docsRedraw()` does invoke a full renderer and reseed the cache. Source inspection confirms file refresh calls it and normal Documents rendering goes through the held full-render path. These are functional/call-count checks; they do not measure or independently verify the owner's timing claim.

The previous five corrections remain covered: retained twin notes/search, map/invoice reference actions, plan subgroup routing, corrected finder file/page destinations and missing-row selection, and the complete persistent native-print list with unchanged screen state. All 28 pass on the newly hash-bound source.

[Script](followup_e540cbc.cjs), [results](followup_e540cbc_results.json), and [current-base function excerpts](followup_e540cbc_base.json) are portable. The excerpts contain source functions only, no operational records. Their originating base is 9,074,112 bytes with SHA-256 `6365fd0965e1ae1fcf75fdd6aad076b2662697443addfae49a3d6016a39f9fce`; excerpt-file SHA-256 is `842a878f0108ac4bd0a3639d5e2bd66377115f6e5592c2a4045954c414ab3278`.

Reproduce from the repository root with Git, Node and Python 3:

```bash
FOLLOWUP815="$(mktemp -d)"
git archive e540cbc31bef88500f9b781688c53f8693932514 \
  03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT \
  | tar -x -C "$FOLLOWUP815"
node 03_GC500_Delivery_Control/review_v815_release/evidence/followup_e540cbc.cjs \
  --source-dir "$FOLLOWUP815/03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT" \
  --baseline 03_GC500_Delivery_Control/review_v815_release/evidence/baseline_v813.json \
  --current-base 03_GC500_Delivery_Control/review_v815_release/evidence/followup_e540cbc_base.json \
  --out "$FOLLOWUP815/results.json"
```

Expected on this frozen snapshot: original checks **28/28**, additional checks **13/14**, overall **41/42**, exit **1** for the reproduced incoming-record failure. Hash guards reject another source version. Small DOM, asset and timer doubles isolate the actual functions; browser focus, rendered PDF, layout and production performance remain separate release-owner checks.

Only new `followup_e540cbc*` review files were added. No implementation edits, browser sessions, network/live writes or commits were made.
