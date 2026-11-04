# v12.99 — clear Demob cards and stable weather

Author: Andrew Fisher

Demob opened without requesting its forecast, past observations stopped at 22 October, and unchanged weather refreshes replaced the artwork repeatedly. Equipment lists were squeezed beside their headings and shorter equipment cards stretched to the height of their neighbours.

This release keeps the existing card components and fixes those faults. Equipment lists use the available width; cards keep natural internal spacing. The progress panel owns the daily pickup count, while the summary retains the last pickup time and the separate ready-for-collection quantity.

Historical weather now includes 23 October–4 November from the same official BOM Gold Coast observations. All 46 original daily rows remain unchanged. The 4 November row is explicitly partial: its unpublished maximum and gust remain null, and the available minimum is labelled. Instantaneous observations are not substituted for daily extremes. The source snapshots, preparation dates and hashes are in `weather_sources/` and the conversion is reproducible with `weather_archive1299.py`.

Demob starts the existing native forecast loaders on direct entry and checks their freshness while active. Unchanged observations keep the same weather DOM and animation; changed readings update the affected cards. Hidden and reduced-motion behavior is retained. Forecasts and outlooks retain their own labels. The observed archive is a verified snapshot through 4 November; future observed days require the existing archive-maintenance workflow. This release does not add a weather-history server endpoint.

The native Person form also gains an optional, clearable **Last day on site**. It keeps the person in current contacts through that date and omits them afterwards. Historical source records, hours, rates, employers and branches are retained. `AboutContacts1089.current(people, additions, asOf)` accepts an explicit historical date; omitting it uses today. Cancelling programmed shifts remains a separate, reversible native record action. Person-specific correction facts and backups remain private.

## Release state

DRAFT — implementation and focused checks pass; final UI/regression checks and guarded publication are underway. Ownership is on the shared status board.

- Agreed source branch: `ccr-061f77e8-ivjhrv`.
- Claim source: `859de6dda2e7e6ff6a05f74bdd29729aa4a1e0ac`.
- Required live base v12.98: `ec4640ad3d8e8f99250247f40c98958d0b123b590e7c431973460f715f00d24d`.
- Candidate SHA-256: `ae11b779720acbaf6b4e8d32061cc7da5c9218e9eaa017cceb0343defa73e8ee`, 17,060,912 bytes.
- Shared build checks all 224 inline scripts. Fourteen focused Node checks and six archive/integration Python checks pass.
- Scope guard preserves `DATA`, all map scripts, native record writers and financial calculation functions.
- Detailed native screenshots and record-correction evidence stay in private storage.

## Reproduce

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.99 03_GC500_Delivery_Control/v12.99_demob_weather_DRAFT/patch_v1299.py
node --test 03_GC500_Delivery_Control/v12.99_demob_weather_DRAFT/tests/*.test.js
python3 03_GC500_Delivery_Control/v12.99_demob_weather_DRAFT/tests/test_weather_archive1299.py BASE
python3 03_GC500_Delivery_Control/v12.99_demob_weather_DRAFT/check_scope.py BASE CANDIDATE
```

Run `tests/check_weather_ui.cjs` and `tests/check_demob_clarity_ui.cjs` through the shared read-only browser harness under `/tmp/gc500-browser.lock`; set `PAGE` to the candidate and `OUT` to private evidence storage. Use `LIVE=1` for public read-back. Both whole-page regression sweeps remain required. The separate private operational correction must be backed up, rehearsed with all writes blocked, then applied only through the native page functions and independently read back.
