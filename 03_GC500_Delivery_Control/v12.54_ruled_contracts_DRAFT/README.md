# Ruled-contract calculation reconciliation — v12.54

Author: Andrew Fisher

Status: DRAFT, source adapter tested; no application patch or import yet. Not READY or live.

Scope follows PR1 handovers6481063732 and6481171078 on exact verified live50.1 predecessor `69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2`. The five currently ruled contracts are the bounded source scope. Recognise their approved Price-only charges and reconcile existing per-piece and aggregate coverage before applying ledger/branch differences. Preserve every unruled contract, all operational records, current styling and unrelated calculations.

## Completed preparation

`source_adapter.py` reads a private export only with its complete expected SHA256, an explicit approved-contract map and the checked source schema. It preserves explicit zero, blank values, fractional quantities and numeric item types. A scoped refresh preserves all unruled rows and site matches; additions require reviewed unmatched templates. Removals and effective rate overrides reject for separate review. The old full importer must not be run on a contract subset.

The adapter deliberately stops at rental source rows. It does not change contract summaries, plant copies, financial readers or the live page. Those consumers need explicit reconciliation before integration. No source price is inferred from a missing rate.

Fifteen synthetic tests pass for schema/fingerprint/scope, duplicates, numeric precision, source immutability, overrides, explicit additions and preservation. The parser also reads the previously supplied original export successfully; this checks the reader against an existing real schema and does not establish a review of the missing new export.

Run the source tests from the repository root:

```bash
python -m unittest discover -s 03_GC500_Delivery_Control/v12.54_ruled_contracts_DRAFT/tests -v
```

Read-only native route capture on exact live50.1 completed without runtime/console errors or record writes. Its detailed evidence stays private. Standalone unknown flags must be reconciled with existing aggregate/per-piece routes before any whole-source charge is added; a numerical match alone does not establish charge coverage.

## Remaining dependency and release gates

The private Baseplan9 original and its complete fingerprint are still unavailable here. The shared comparison lacks fields required for a full import. Its authorised private location has been requested through PR1; no private original or source rows should be posted publicly.

Next: review that original, reconcile the scoped source changes with all existing effective overrides and charge coverage, implement one shared financial path, and prove net ledger/branch movements and unrelated-output preservation. Run the applicable native, phone and full release checks on the final candidate before READY. No exact net movement, completed import, or release is claimed by this draft.

Codex implements, tests and independently verifies. Claude publishes only a READY candidate through the guarded release process and retains operational record work. Previews51/52/53 keep their separate visual/access gates.
