# Purchase-order values and source-backed supplier reconciliation — draft

Author: Andrew Fisher

Known purchase-order values now appear beside their reference with the dollar sign and two decimal places. Fencing, Finance, cost-stream references and reviewed fencing trace labels all read the same current order value. Unknown amounts show the reference alone; an explicit zero shows $0.00. Finance purchase-order summaries retain cents.

The native amount inputs and Save buttons stay intact. Following the user's clarification, the release also reconciles underlying supplier docket costs to the approved programme. Source allocations belong to the existing shared purchase-order record, with original document identity, dated lines and explicit credits. They do not replace physical quantities or customer rate-card lines. Dated supplier labour is classified once under Installation; the order value itself is never added again to Direct costs. A changed order value shows a difference instead of scaling the supplier charges to fit.

Approved native values are entered separately through the page's own purchase-order function, with a backup, exact document write gate and fresh shared-record readback. Invoice, receipt and payment states require their own evidence. Detailed commercial evidence and operational amounts remain in private storage rather than the public repository.

Exact base: live v10.13, SHA256 `ab5fe3dc666b68b3b9ec27a731ff3edad06ba0fa3db4da3910ecbc11b9184143`.

Checks:

- `node tests/test_po_values1014.cjs` — synthetic known, zero, missing, edited and escaped values.
- `python3 tests/test_patch1014.py /path/to/live.html` — exact base and repeat guards for the presentation stage; native writer and receipt logic preserved.
- `PAGE=/path/to/candidate.html STATE=/private/state.json OUT=/private/browser-check.json node tests/check_po_values1014.cjs` — frozen read-only browser fixture; Fencing, Finance, trace, Save, exports and no duplicated charges.

Supplier integration is implemented; final checks are in progress. This folder is not yet ready for publication. Final evidence must distinguish the approved pricing-only change from any separately source-backed physical transcription correction. Build, full route sweeps, phone visual review and publication remain with the release owner. Private documents and operational amounts are not part of the patch fixtures.

The rendered P/O card is exempt from an older operational-page cleanup that removed its number and currency column. A browser regression check verifies the actual post-cleanup DOM, its amount input/Save control and expandable supplier detail. Current record locations and existing verified schedule/source links accompany each docket. Exact map geometry is not inferred from area names.

A separate source-backed physical transcription correction retains its original schedule assignment and capped programme allowance through `attribution1014/`. Both original and corrected exact source signatures are covered; unrelated changes still require review.
