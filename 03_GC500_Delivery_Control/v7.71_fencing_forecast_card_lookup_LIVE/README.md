# v7.71 — issued-card rates in the fencing forecast

Author: Andrew Fisher

Current and future programme lines without a docket column were reported as having no customer rate even when the
issued card supplied one. The forecast now looks up the three supported types from that card. Supplier costs remain
unknown; actual dockets, existing column rates, past weeks and unconfirmed demob weeks keep their existing treatment.
This changes forecast Revenue only and makes no shared-record or ledger writes.

`forecast_card771.json` identifies the original PDF, hash and row labels. Reproduce its extraction with
`python3 verify_card_source.py`; normal builds validate the source hash and read the JSON using Python's standard
library. `--write` regenerates the map for review. Synthetic regression tests exercise the forecast without project
records or actual financial totals.

LIVE — 1 Oct 2026 17:19 AEST. The public view serves the uploaded build byte for byte.

- Build: 8,638,736 bytes; SHA256 `919b23f2b030af4b5a06c2a6b98661a3e637040582ede75e9d51cdcb181b3d29`.
- Issued-source verification, 26 synthetic checks, 13 browser integration checks and 22 forecast regression checks pass.
- Desktop and phone sweeps: 21 tabs and 7 deep links each, zero page or console errors.
- Phone screenshots inspected. Upload dry-run passed; no shared-record edits or ledger postings.
- Actual Revenue, supplier costs, cost gaps, existing docket rates and past/non-rolled weeks verified unchanged.

The browser comparison and source review contain project financial details and remain in the private release evidence.
`evidence/release.json` records the non-sensitive verification result.

Source extraction check passes; **26/26 synthetic checks pass**. They cover the three supported types, unknown rates,
unchanged supplier-cost gaps, existing docket columns without double counting, current/future versus past and
unconfirmed weeks, quantity validation, reconciliation and patch guards. Evidence: `evidence/synthetic_results.json`.

From the GC500 folder:

```bash
python3 v7.71_fencing_forecast_card_lookup_DRAFT/verify_card_source.py
node v7.71_fencing_forecast_card_lookup_DRAFT/evidence/synthetic_tests.js build/GC500_v7.69/GC500_Delivery_Control_hosted.html
bash toolchain/build.sh v7.71 v7.71_fencing_forecast_card_lookup_DRAFT/patch_v771.py
```
