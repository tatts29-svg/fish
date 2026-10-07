# v8.75 — source-bound schedule refresh and lifting requirements

Author: Andrew Fisher.

DRAFT. Codex implementation and publication owner. Base live v8.74 `918abc9a1234210c5fd48c8896ffe48101a6ff158ae0eadc8a94380009707e13`.

The patch compares checksum-bound private schedule inputs in read-only mode. It updates uniquely matched schedule quantities, loading times and carriers; preserves existing records, assigned asset identities, contract/paid-cost source sections and all unrelated data. Non-time/non-carrier placeholders do not become dispatch facts. Source provenance is retained. A multi-run row becomes separate docket-scoped loads; cargo identity is not invented for those loads. Schedule and BOQ readings remain separate in supporting details.

Lifting requirements use a permanent named/dated shared-record field, kept separate from door side and completion. Crane truck, Franna, generic on-site crane and not-required choices appear in reference controls, native driver/drop/supplier/demob sheets and checklists. Generic source crane wording retains a type-to-confirm label. Clear is distinct from not required. Timestamp merge, export/import and loading-only record retention are covered.

Code contains no private operational values or workbook contents. Private inputs use `V875_PREVIOUS` and `V875_SCHEDULE`; source review evidence goes to caller-provided `V875_LOG`. Do not commit those inputs or logs. Corrected candidate SHA-256 `f981c57a799a7794c8e5fce68a02363223698b3027751fd0b312d99752c447dd`, 11,111,874 bytes. A source-preservation check caught formatting that bypassed the standard field-aware attribution scrub; the replacement now retains the required data declaration spacing. Final tests and publication pending.
