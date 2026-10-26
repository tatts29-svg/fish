# Recorded event crew hours

Author: Andrew Fisher.

**DRAFT — integration checks in progress. Not ready to upload.**

An explicitly linked service note supplies the total person-hours for an existing event crew day. The customer event scope uses those hours at its existing customer rate. The green book carries the supplier cost once, and the original roster remains available as source history. Uncovered dates keep their existing forecast.

The native service-note form records the scope confirmation with the paper. The shared resolver checks the paper identity, date, hours, current scope and supplier basis before replacing a forecast. Duplicate, stale or conflicting evidence is shown for review. It does not infer individual worked hours, create Finance confirmations or change rates. Ordinary service notes keep their existing treatment. Linked amounts use exact decimal products and sums, rounded once at the service-note or customer-line boundary.

Finance, the running sheet, customer event scope and fencing calculations use the same coverage decision. Covered planned shifts cannot acquire a second individual actual cost or journal. Existing records and unrelated charges are preserved.

## Build and checks

```sh
toolchain/build.sh v12.37 v12.37_event_crew_actuals_DRAFT/patch_v1237.py
```

The patch accepts the coordinated v12.35 or v12.36 base and refuses repeat application. Build from the current live page and retain the uploader's unchanged-base guard.

The tests use synthetic papers and frozen read-only record snapshots. All HTTP writes are denied. Run browser checks serially under `/tmp/gc500-browser.lock`; keep raw records, financial model output and screenshots in private evidence storage.

Release acceptance requires the shared page checker, resolver and native financial regressions, preservation comparison, desktop and phone sweeps, and inspection of the changed phone view. The final source, hashes, checks and read-back will be recorded here when complete.
