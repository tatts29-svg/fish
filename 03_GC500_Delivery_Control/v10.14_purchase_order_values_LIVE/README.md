# Purchase-order values and source-backed supplier reconciliation — live

Author: Andrew Fisher

Known purchase-order values now appear beside their reference with the dollar sign and two decimal places. Fencing, Finance, cost-stream references and reviewed fencing trace labels all read the same current order value. Unknown amounts show the reference alone; an explicit zero shows $0.00. Finance purchase-order summaries retain cents.

The native amount inputs and Save buttons stay intact. Following the user's clarification, the release also reconciles underlying supplier docket costs to the approved programme. Source allocations belong to the existing shared purchase-order record, with original document identity, dated lines and explicit credits. They do not replace physical quantities or customer rate-card lines. Dated supplier labour is classified once under Installation; the order value itself is never added again to Direct costs. A changed order value shows a difference instead of scaling the supplier charges to fit.

Approved native values are entered separately through the page's own purchase-order function, with a backup, exact document write gate and fresh shared-record readback. Invoice, receipt and payment states require their own evidence. Detailed commercial evidence and operational amounts remain in private storage rather than the public repository.

Exact base: live v10.13, SHA256 `ab5fe3dc666b68b3b9ec27a731ff3edad06ba0fa3db4da3910ecbc11b9184143`.

Checks:

- `node tests/test_po_values1014.cjs` — synthetic known, zero, missing, edited and escaped values.
- `python3 tests/test_patch1014.py /path/to/live.html` — exact base and repeat guards for the presentation stage; native writer and receipt logic preserved.
- `PAGE=/path/to/candidate.html STATE=/private/state.json OUT=/private/browser-check.json node tests/check_po_values1014.cjs` — frozen read-only browser fixture; Fencing, Finance, trace, Save, exports and no duplicated charges.

LIVE 14 Oct 2026 at 14:53 AEST. Source 8624480c; exact public candidate `b1bd7bc843632a5ccb99bcead3dfd47a31f2d9810ac1459b4218d1d13d91df7a`, 15,219,992 bytes and 109 parsed scripts. Required phone/desktop sweeps and source, financial, rendered-DOM and native-practice checks passed. The authorised supplier pricing and separate physical transcription correction were saved through guarded native operations and verified against the shared record.

A fresh read initially queried the forecast before the source-document registry settled. Independent settled reads confirmed the persisted correction and expected financial differences. The resulting investigation also reproduced a deferred-redraw cache weakness; v10.15 handles that source dependency without further operational changes. Original failed evidence remains private alongside the corrected readiness checks.

The rendered P/O card is exempt from an older operational-page cleanup that removed its number and currency column. A browser regression check verifies the actual post-cleanup DOM, its amount input/Save control and expandable supplier detail. Current record locations and existing verified schedule/source links accompany each docket. Exact map geometry is not inferred from area names.

A separate source-backed physical transcription correction retains its original schedule assignment and capped programme allowance through `attribution1014/`. Both original and corrected exact source signatures are covered; unrelated changes still require review.
