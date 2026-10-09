# Documents proposal — independent CPU verification

Author: Andrew Fisher · 3 Oct 2026 AEST.

**43/43 checks pass: the unchanged original 28 positive checks plus 15 proposal checks.** The isolated proposal closes the reproduced incoming-record classification failure while preserving the asset hold. This is source/CPU approval of the proposed correction; browser and release approval remain separate.

The [proposal](proposal_e540cbc_documents.py) was applied independently to a new private copy of frozen commit `e540cbc31bef88500f9b781688c53f8693932514`. Inspection of the resulting source diff confirms three changes: `data-ro` on the Documents search input; capture/restoration of category focus around full and partial redraws; and removal of the collection cache in favour of fresh `docCollection()` inside the retained `holdAssets()`. Catalogue, finder, original-opening, printing and upload handlers are unchanged by this proposal.

| Binding | SHA-256 |
| --- | --- |
| Original `docs815_src.js`, unchanged after verification | `99b24b0ffe9abebf893004e51c074dfdde572bb4a61e5c2555f38597e9c42e10` |
| Proposal Python file | `5dc03396df0c9dd49a236d7f367a0852ce344b34ace0aaf1d0737631e30fbd42` |
| Privately patched `docs815_src.js` | `038e6fd2966c374a27b70a0d3195c50f27346e9c7f32f59a607bba6618093168` |

The new positive fixture executes the actual current-base `applyRemote()`, `syncFold()` and `syncRedraw()`. With Documents search focused, the synthetic incoming book record is applied and the full render remains deferred. The next partial redraw now classifies the numbered file as **Fencing dockets**, makes its generated explanation searchable and includes the file in actual search-results markup. It builds assets once and leaves catalogue data, file metadata and the applied record unchanged. The delayed full render remains correct after focus is released.

Additional CPU checks confirm the public-search attribute and category-focus restoration across partial/full redraws, with no focus movement when no category owned focus. These use DOM doubles; they do not replace real Enter/Space/browser-focus testing. No elapsed-time performance claim is made.

Reproduce with the [script](followup_e540cbc_proposal.cjs); [results](followup_e540cbc_proposal_results.json) contain all assertions and source bindings. Run from the repository root with Git, Node and Python 3:

```bash
PROPOSAL815="$(mktemp -d)"
git archive e540cbc31bef88500f9b781688c53f8693932514 \
  03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT \
  | tar -x -C "$PROPOSAL815"
python3 03_GC500_Delivery_Control/review_v815_release/evidence/proposal_e540cbc_documents.py \
  "$PROPOSAL815/03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT/docs815_src.js"
node 03_GC500_Delivery_Control/review_v815_release/evidence/followup_e540cbc_proposal.cjs \
  --source-dir "$PROPOSAL815/03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT" \
  --baseline 03_GC500_Delivery_Control/review_v815_release/evidence/baseline_v813.json \
  --current-base 03_GC500_Delivery_Control/review_v815_release/evidence/followup_e540cbc_base.json \
  --out "$PROPOSAL815/results.json"
```

Expected: **43/43**, no failures, exit **0**. Hash guards reject a different patched source. All fixtures are invented; no operational records are checked into the evidence. Only the private source clone and new review artifacts were written. No implementation-owner files, browser sessions, service/live writes or commits were made by this verification.
