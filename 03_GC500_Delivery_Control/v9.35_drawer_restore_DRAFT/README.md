# v9.35 — restore the modern equipment drawer

Author: Andrew Fisher.

READY for combined integration; not LIVE. Root owns the final combined publication. Base is verified live v9.34, SHA256 `b881e8890e8a590fea79ac63657fd43254c5ccdd11735d7f70a1b4874773c33c`.

The v9.33 header read `.length` from `vms913BoardsOn(a)`, which returns null for ordinary equipment. The native drawer caught the exception and silently retained the old long layout; page-error tests therefore missed the regression. The patch normalises that nullable result. It changes no source identity or business record.

The restored drawer also exposed duplicate photo-tool groups for canonical unit IDs and uniquely matching older asset-number photo homes. The presentation helper moves the existing photo cells into one unit group, retaining their exact DOM nodes, native handlers, original unit and slot attributes, pending uploads and stray-file recovery. Existing photos, links, work and files are not migrated or rewritten. Historical/cross-owner ambiguity stays separate. Pending entries are labelled as queued, not confirmed photographs. Read-only controls were checked and required no extra change.

Validation on the frozen scope candidate:

- All 182 reference drawers retain their modern `.sum816` / `.folds816` layout and expected item panels.
- Every card ID matches the native unit model; duplicate photo groups: zero.
- View-link visible photo edit controls: zero across all 182 references.
- Captured native WC09 caption/remove calls retain the original legacy unit 1268858 and slot 0 after consolidation. No service write is made.
- Stored state remains byte-for-byte unchanged; zero runtime errors and zero caught drawer warnings. One existing browser iframe allow/allowfullscreen notice is retained explicitly.
- Nine model regressions and five DOM/action-preservation tests pass. Independent narrow source review found no remaining blocker.
- Desktop/phone WC09, WC20, T0103 and P03 screenshots inspected privately. All 41 inline scripts parse with no new keys.

The strict harness permits public GETs only and records the expected denied Google mapping setup POST. Detailed results and private screenshots are under `/workspace/private-bughunt935/frozen-proof/`. Portable sanitised results and exact hashes are in `evidence/checks.json`. Earlier provisional capture diagnostics are retained privately; final focused and exhaustive capture reruns pass.

Patch: `patch_v935.py` accepts v9.34 only and refuses repeated application. Tests: `test_drawer935.cjs`, `photo_groups935.cjs`, `browser935.cjs`. `PAGE` can select the final combined candidate; browser runs must use the shared lock.
