# Native quantity scope sync review and fix

Author: Andrew Fisher · 14 Oct 2026 · Codex independent review and implementation

`scope_sync1017.js` replaces the first draft's side-effecting quantity decoder. `patch_scope_sync1017.py` must run after `patch_scope1017.py`.

The independent review identified two blocking cases in the initial design:

1. Building the remote input for first sync replaced the local receipt baseline before conflict merging. A newer offline planned quantity could win while its baseline was lost or attached to the wrong numeric value.
2. A remote baseline change at an unchanged numeric quantity was invisible to `syncFold` equality. The cache changed without invalidating derived results or triggering persistence.

Both are corrected. Decoding produces a numeric quantity map with temporary non-enumerable metadata and does not touch the local record. The native quantity setter installs metadata only when the record is applied, and strips the temporary metadata off the stored numeric map. `syncFold` compares both quantity values and receipt scope. First sync attaches metadata to its remote input before merging. Import/first-sync merging selects the baseline alongside the winning quantity rather than as an unrelated truck-load record.

The local `S.loads` entry is a persistence cache only. It is excluded from every native loads-document serialization. Quantity and scope travel together in the existing qtys document, preserving the ordinary numeric `v`. Clearing a quantity override emits `v:null` with its preserved scope so cold reload cannot drop the receipt cap. Exported records and their legacy envelopes retain the cache for imports.

If an older client or imported record wins with a quantity but no metadata, the known prior receipt/install baseline is retained and rebound to that planned quantity. The original receipt evidence and capture time remain unchanged. Missing metadata is not evidence of a new arrival or a reason to erase already known actuals.

Validation: `check_scope_sync1017.cjs` ran against a local scope+sync candidate at the real service address with every non-GET blocked. **27 checks passed**, zero script errors, zero operational non-GET attempts, full native state restored byte for byte and browser closed. Cases include pure decoding, both collection orders, actual `syncFirst` with newer offline data, remote decode followed by local edit, both merge directions, newer remote/legacy updates, same-value metadata invalidation, queued-document precedence, unrelated loads refresh, local JSON reload, both export envelopes, merge import, clearing the override and increasing it again, and mixed-item baselines.

Private detailed results: `/workspace/private-gc500-recheck14Oct2026/fencing/scope-sync-tests.json`. Projection/arrival/work unlocking and all financial totals are tested separately by the scope and financial component owners. The test performs in-memory practice mutations only; it never writes the service record.

Final combined financial interaction review: `check_scope_finance_sync1017.cjs` passed **18 checks** against candidate SHA256 `b9af9ed35e57588d1ec8d6d5712e565a7be02265825e4dd570c8dfc7f86a7609`. This independently exercises a same-value baseline change while financial caches are held, both receipt/stamp arrival orders, preserved supplier/manual-stairs metadata through native serialization and export/import, and a confirmed receipt followed by another planned scope edit. Six received units remain six actual units when the plan increases to ten; the existing installed count remains four and only four units remain forecast. The native document roundtrip and local reload retain those quantities. Zero script errors or operational write attempts; original native record restored exactly and browser closed. Private detailed results: `/workspace/private-gc500-recheck14Oct2026/fencing/scope-finance-sync-tests.json`.

The dedicated native sync suite was also rerun against that exact final combined candidate: **27/27 passed**, zero script errors and zero operational write attempts. Private final results: `/workspace/private-gc500-recheck14Oct2026/fencing/scope-sync-final-tests.json`. Together the final sync and independent financial interaction suites pass all 45 checks.
