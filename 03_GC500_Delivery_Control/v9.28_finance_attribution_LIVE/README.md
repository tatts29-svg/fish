# Finance attribution correction — LIVE

Author: Andrew Fisher

State: VERIFIED LIVE within v9.28 — 9 Oct 2026 03:28 AEST. Public page SHA256 `592e73b38e8c5fb1d5bf98d00915c49550ab860b322f82fb957a99acc0369093` (12,262,425 bytes). The guarded upload verified the full served bytes. Combined evidence is in `../v9.28_finance_attribution_LIVE/evidence/combined_release.json`.

Product source commit `6d34a421` follows the reviewed unit identity module and the integrated v9.27 comparison base `04b40af6…`. The publisher independently reproduced the complete chain from the live v9.22 page, then verified guarded publication and full public-byte readback.

Partial transport demand uses only the schedule event’s explicit item and quantity at that item’s existing transport cost. Missing rates or ambiguous demand stay held, rather than inheriting the whole location or an average. Confirmed physical-unit ownership takes precedence over broad toilet-family classification; explicit contract SUB suppliers remain intact. Unresolved toilet ownership is not asserted as Event Portables. Both branch and job forecast models share this rule. Approved supplier quote totals, servicing and their established costing branch remain unchanged; no per-unit supplier quote cost is invented.

`finance928.js` contains pure demand and owner functions, with guarded native read adapters. `patch_v928.py` applies exact-once source replacements and requires v9.27 plus the reviewed units module. `tests/model928.cjs` covers wrong-item, missing-rate, excess-quantity, zero-rate, supplier override and identity ambiguity cases. No operational records are written or migrated. Original/private baseline records and financial deltas are retained only outside the repository.

Validation: 23 pure adversarial assertions pass. Actual-page desktop and phone each pass all 17 native finance reconciliation ties, unchanged contract and approved quote data, unchanged to-date money and supplier quote costing branch, full classification coverage and native record preservation. Native Transport navigation, held-allocation text and viewport checks pass; both screenshots inspected. Each fresh-cache full sweep covers 21 routes, 7 deep links and Back with zero page errors and zero unexpected console errors. Each raw console array has one expected Google createSession failure because the strict GET-only harness deliberately denies its POST; it is retained in evidence and is not an operational write. No tests write operational records. Private financial model snapshots/deltas remain outside the repository.
