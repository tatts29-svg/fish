# v12.45.1 financial consistency checks — DRAFT

Author: Andrew Fisher.

Reviewed predecessor candidate: v12.45 on v12.43.1, SHA-256 `61aad6aecefa69e5040de6d7f47ca2920001b21c2d93aad5d4b6fcfcd398da79`. This is the supplied map draft, not a live-release claim.

Offline financial preview: SHA-256 `dd88aa87016c1734f26b346afff07bfffcac5b5820e1eafa2a9b0bb0b73a6355`, 16,059,128 bytes. Not READY TO UPLOAD or live.

The financial helper files and their integration helper are byte-identical to the checked v12.44 draft. The adaptation changes the release wrapper to require the exact reviewed v12.45 SHA and footer, retain the off-site ring/picture-cache/map implementation markers, reject either pre-existing financial helper and emit v12.45.1. No new calculation or business rule was added.

Completed offline checks on this predecessor and preview:

- 69 synthetic customer-water preservation and quantity-description checks, including ordinary rows and missing adjustment metadata.
- 44 synthetic combined-FWF checks, including cents, branch/category preservation and refusing changed/ambiguous source evidence.
- 24 extracted-native regression assertions across three tests: FWF tick projection, existing financial holds, and explicitly partial demob detail.
- Nine source/boundary tests. These reject wrong hashes, changed bytes, five wrong predecessors, four missing predecessor markers, both partial financial-helper states and repeat application. They also prove exact retention of all eight map45 source blocks and all 12 non-footer v12.43.1 replacements, plus unchanged financial helper files.
- Shared page checker: 214 inline scripts pass; author and credential checks pass with no new credentials.

The original v12.44 preview `ef9363be5b7ed4b3ed4d258b1e192eeec4fa973e4a2b451a4caca7590112373a` and its historical native checks remain in the original draft folder. Those checks do not certify this rebased candidate against the current record.

Remaining before READY: confirmed live predecessor, fresh native financial and document comparison, affected phone read-back with screenshot inspection, and both shared full-page sweeps. The native and UI gates must use the same current complete frozen record. No browser has been acquired for this successor yet.

The separate original-Baseplan and approved-exception review remains pending; this consistency repair does not certify a final invoice or settle missing business evidence. No timing acceptance claim is made.

Evidence contains native operational and financial data and stays in authorised private storage. Do not copy the native JSON, screenshots, amounts, source attachments or record contents into this repository or coordination comments. Public results here describe checks and hashes only.

Codex builds/tests the final source. Claude uploads only after a READY handover naming the exact source commit, verified live predecessor and final candidate hash. The guarded upload must refuse a changed live base and prove full live byte equivalence before this is reported LIVE.
