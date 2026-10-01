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

DRAFT — patch and source checks prepared for independent review, browser tests and both sweeps before release.

Source extraction check passes; **26/26 synthetic checks pass**. They cover the three supported types, unknown rates,
unchanged supplier-cost gaps, existing docket columns without double counting, current/future versus past and
unconfirmed weeks, quantity validation, reconciliation and patch guards. Evidence: `evidence/synthetic_results.json`.

From the GC500 folder:

```bash
python3 v7.71_fencing_forecast_card_lookup_DRAFT/verify_card_source.py
node v7.71_fencing_forecast_card_lookup_DRAFT/evidence/synthetic_tests.js build/GC500_v7.69/GC500_Delivery_Control_hosted.html
bash toolchain/build.sh v7.71 v7.71_fencing_forecast_card_lookup_DRAFT/patch_v771.py
```
