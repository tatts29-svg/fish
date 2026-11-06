# Documents corrections — source follow-up

Author: Andrew Fisher · 3 Oct 2026 AEST.

**All five earlier findings pass the independent positive source/CPU follow-up: 28/28 checks.** No unresolved failure was found in those five corrections. This closes their source-level findings; final browser, PDF, visual and release checks remain with the release owner. It is not a READY or live declaration.

Exact source commit: `6a0bb204d5bf55e4b65be8cf07866e7b3f1402df`, privately recovered with `git archive`. File bindings:

| File | SHA-256 |
| --- | --- |
| `docs815_src.js` | `c1b9ff330d049b55c0a508e7b44804437ca55adb8447892695c2afc5d4bc484b` |
| `patch_v815.py` | `297ea67049c35aa697f39e0385f09d93e2975c2ee98d13e03591845aee8e31bf` |
| `v815.css` | `779f727b970592dc8e4ca699c2394db10bc9e2beea5ca3dfa6ed130e0af6034c` |

| Earlier finding | Corrected behaviour checked |
| --- | --- |
| Native Print lost the catalogue | `renderDocs815()` always includes a complete `printList815()`. Print CSS shows it and hides the screen body. Initial, filtered and category-selected views retain every non-photo once; photos have the documented per-reference summary. Pre-start/plate folds become headings. The Print button and a thrown print call leave screen state unchanged. |
| Maps/invoices lost their reference | `meta815()` carries the recorded reference and `data-open815` action, including an unknown-reference fixture. The wired action calls the existing `openAsset()`. Original file URLs remain available. |
| Plan button opened dockets | `fencing` maps to Drawings and `docsub815-fencing`; the real renderer schedules scrolling to that subgroup. Explicit `dockets` still maps to signed papers. |
| Header results lost the selected file | The actual Python patch now aliases both document and per-day IDs to the uploaded twin. Header selection opens that URL with the existing `_blank`/`noopener` options and preserves `#page=3`. A missing result clears an unrelated category/filter, renders the named row and applies current/focus/scroll treatment. |
| Twin notes disappeared | Missing catalogue metadata, including notes and per-day pages, carries into the merged upload. Notes and the uploaded title remain searchable. Details shows/hides the note and updates `aria-expanded`. |

The [new positive script](followup_6a0bb20.cjs) executes the corrected functions with invented data and small DOM/helper doubles. It parses the real Python patch with Python's AST and executes its exact collection/finder replacement strings against the verified baseline function excerpts. It does not change expected failures in the old defect probe or relabel its results. [Results](followup_6a0bb20_results.json) record all 28 assertions and source hashes.

Reproduce from the repository root using Node, Python 3 and Git; no dependencies, network, credentials, browser or operational files are required:

```bash
FOLLOWUP815="$(mktemp -d)"
git archive 6a0bb204d5bf55e4b65be8cf07866e7b3f1402df \
  03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT \
  | tar -x -C "$FOLLOWUP815"
node 03_GC500_Delivery_Control/review_v815_release/evidence/followup_6a0bb20.cjs \
  --source-dir "$FOLLOWUP815/03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT" \
  --baseline 03_GC500_Delivery_Control/review_v815_release/evidence/baseline_v813.json \
  --out "$FOLLOWUP815/results.json"
```

Expected: `passed: 28`, `total: 28`, `failures: []`. Exit 0 means these corrected-source checks pass. Hash guards refuse another source version.

The owner's browser suite now includes native print-media/PDF coverage, plan subgroup landing, reference clicks and header selection. Its completed final results were not independently rerun here. The earlier `run_all.sh` exit-aggregation weakness remains: use each suite's actual completion and exit status for the final gate. This follow-up makes no phone-layout, graphics, performance or visual-approval claim about the additional card styling in this snapshot.

Only new `followup_6a0bb20*` review artifacts were added. No implementation edits, browser sessions, network calls, operational-data reads/writes, Git comments or commits were made.
