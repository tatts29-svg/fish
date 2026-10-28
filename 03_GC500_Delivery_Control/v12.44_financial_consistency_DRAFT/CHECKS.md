# v12.44 financial consistency checks — DRAFT

Author: Andrew Fisher.

Reviewed base: verified live v12.43, SHA-256 `7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f`.

Tested preview: SHA-256 `e5d4a499a0156f5d369a1a25623f9dc7817c14ededde78bee6245ab7bef810e9`, 16,035,256 bytes. This is a local draft, not a published release or a final invoice.

Completed checks on the current projection:

- 60 synthetic customer-water preservation checks.
- 44 synthetic combined-FWF checks, including cents, branch/category preservation and refusing changed/ambiguous source evidence.
- 24 extracted-native regression assertions across three tests: FWF tick projection, existing financial holds, and explicitly partial demob detail.
- 214 inline scripts passed the shared page checker.
- 93 frozen-native financial comparison checks passed against the exact v12.43 base. All reconciliation ties and branch-cent checks passed. Supplier models, direct costs, source contracts and native documents remained equivalent; both sessions had zero runtime errors, console errors and HTTP write attempts. The financial plan removes only already-held references; physical source documents remain intact.

The exact-source/refusal tests previously passed all five cases. They must be rerun with every final rebased candidate, together with the other affected checks. The source guard requires an explicit matching SHA-256 and the reviewed predecessor footer.

Independent read-only source review identified two explanation issues, now corrected and covered: obsolete below-floor water warnings, and demob detail appearing complete despite the FWF approval providing only a combined amount.

Evidence contains native operational and financial data and stays in authorised private storage. Do not copy the native JSON, screenshots, amounts, source attachments or record contents into this repository or coordination comments. Public results here describe checks and hashes only.

Remaining before publication: rebase onto the agreed release after the prioritised map changes, review the new exact predecessor, repeat frozen-state and fresh-state document preservation, run the affected phone read-back and both shared full-page sweeps, then use guarded publication with byte-for-byte live read-back. The phone overview has been inspected; a focused changed-section read-back script is supplied but is not yet a completed final release gate. No browser timing acceptance claim is made from the single instrumented model comparison.
