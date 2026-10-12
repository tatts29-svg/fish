# Recurring fencing conflict — v10.03

Author: Andrew Fisher

Andrew reported the repeated “Two records disagreed” drawer for F-AFV-0002 and requested “Fix and remove”.

Docket 36560 is the 28 Sep 2026 GC Hwy median-strip installation. The signed original confirms 507.5 m mesh, 447.5 m CCB, one pedestrian gate and six wheels. Its verified gate correction was being imported as a second docket. Both records then contributed to totals and triggered the same drawer on every editor startup.

The exact reviewed historical records now resolve to one corrected base ID. Unknown changes remain visible as distinct records and raise a new conflict. Equality ignores JSON key order, existing valid variant hashes are retained, and reopening the same retained conflict does not produce another notice. Native deletion/undo rules run before correction. Pricing uses the same source-backed projection. No styles or operational DATA changed.

Implementation and release: root, with independent signed-paper review and merge regression review. Final candidate is SHA256 `3056702a2a5664050eb9b8cf8592bc2f700ea5faf705829d97f471b83f38e412`, 14,915,214 bytes, 90 inline scripts, from v10.02 `0ed900c790e1cf21686d4b24566d0919e920032c25e66da205fbe4c68494468b`.

90 pure merge regressions and 18 offline native correction guards pass. Final desktop/phone startup, repeated stale-copy sync, 22-route/seven-link navigation and Back checks pass with zero errors or test writes. Source guards, DATA/style preservation and upload dry-run pass. READY TO UPLOAD from source commit8883fb6f. The guarded native reconciliation runner has not been executed; private backups and original signed papers remain outside Git.
