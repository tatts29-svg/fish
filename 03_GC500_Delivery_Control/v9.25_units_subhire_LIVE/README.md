# v9.25 — physical units and supplier evidence

Author: Andrew Fisher

State: VERIFIED LIVE within v9.28 — 9 Oct 2026 03:28 AEST. Public page SHA256 `592e73b38e8c5fb1d5bf98d00915c49550ab860b322f82fb957a99acc0369093` (12,262,425 bytes). The guarded upload verified the full served bytes. Combined evidence is in `../v9.28_finance_attribution_LIVE/evidence/combined_release.json`.

Adds a compact description selector to each native asset drawer, then shows recorded physical units with their own owner, fleet number, costing branch, explicitly assigned photos and existing work evidence. Info has a company selector, links to each unit's reference, pending identification, and the original supplier quote breakdown. Native history, count, loading, photo and labour editors remain available.

`gcUnits925(a)` exports only identified physical rows with stable IDs from `transportUnitId924`. Numbered native units keep their asset-based identity when metadata is added; an explicitly identified unnamed physical unit gets a UUID slot. VMS board identity follows the existing VMS register and its effective owning company. Split bookings export only their explicitly allocated asset numbers; an empty booking allocation exports no physical units. Planned quantities never create fictional unit identities.

Explicit metadata saves use a UUID-keyed `unit925-record` document under the native `S.loads` collection. The save requires editing permission and a named operator, rejects stale document/source snapshots and duplicate company/fleet identities, and preserves unrelated documents. It does not migrate unit arrays, supplied quantities, labour ticks, photos or finance. The adapter flags contradictory recorded classifications until the original record is corrected. Removed source identities remain history and cannot silently reappear as current gear.

Unit photos are read only from their recorded unit association. Reference-wide photos and ambiguous repeated fleet numbers stay unassigned. Existing work is labelled as unit-specific only when an explicit native per-unit labour key and a unique current/historical fleet association are available; description-level work is labelled accordingly. Original quote links require a ready document index and the matching source hash. Existing unnumbered transport UUID slots are shown with their original identity without duplicate creation. Supplier quote coverage is shown without inventing another covered unit, adding another transport charge, or changing totals. Quoted services, hire periods, staff labour and transport remain distinct.

Apply `patch_v925.py PAGE.html` to the integrated v9.24 build. It requires the native unit/work readers and v9.24 identity helper, appends the production module/styles once, and advances only the release footer. The native WC09 item correction is supplied by the preceding v9.23 release, not duplicated here. No upload is performed by this folder.

Validation:

- `node tests/test_units925.cjs`: identity, ownership, booking, source conflict, photo isolation and captured save tests; synthetic records only.
- `PAGE=/path/to/base.html INJECT925=1 node tests/browser925.cjs`: GET-only actual-page phone and financial preservation checks; screenshots/results go to `OUT925` outside Git. Run under the shared browser lock. It blocks all non-GET requests including mapping session calls.
- Final combined build must also be tested after preceding release modules and the current native record are integrated.
