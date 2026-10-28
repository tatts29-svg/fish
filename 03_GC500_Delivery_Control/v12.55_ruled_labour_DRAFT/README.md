# v12.55 ruled labour — DRAFT

Author: Andrew Fisher

This separately scoped draft is not part of v12.54 and is not a release claim. It prepares the named contract LABOUR rows for Installation while retaining their original source fields. Cleaning remains separately priced pending clarification of the approved bundle boundary. The full Baseplan import is outside this draft.

The shared customer readers consume one coverage projection. Covered Installation components keep their physical completion, unit count and original rate as provenance. Their customer amount is included in the named contract Installation instead of charged again on the physical card. The remaining FWF aggregate retains its unruled contract contribution; approved event labour moves into Installation while event hours and accommodation remain unchanged. A separate fire projection removes only customer monetary values and keeps the physical record.

Direct cost branch allocation continues to use the original physical Installation rate and the original per-card rounding/share algorithm. Customer billing coverage must not change the supplier or Direct cost allocation basis. The source adapter, raw record, source joins, map, design and release footer are not changed here.

`finance_patch.py` exports `patch_finance(text, path='page')`, `reverse_finance(text)` and `replacements()`. Each replacement requires one exact predecessor boundary. The integrating patch must independently pin its actual predecessor hash; this draft does not authorize applying it to an arbitrary deployed version.

Validation:

- `node tests/test_finance.cjs`
- `node tests/native_preservation.cjs BEFORE_PRIVATE_CAPTURE AFTER_PRIVATE_CAPTURE`
- `python -m unittest discover -s tests -p 'test_patch.py' -v`
- Set `GC500_LABOUR55_BASE` to a privately held exact predecessor HTML to include full byte-for-byte reversal testing.

Native comparison and any detailed monetary results remain private. Release readiness requires the final source scope ruling, fresh source/live reconciliation, the existing guarded publication process, and exact live read-back. No deployment is performed by these files.
