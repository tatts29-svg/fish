# Recorded event crew hours

Author: Andrew Fisher.

**LIVE — 26 Oct 2026 16:25:37 AEST.**

An explicitly linked service note supplies the total person-hours for an existing event crew day. The agreed customer event scope keeps its existing hours, rates, overrides and amount. The green book carries the supplier cost once, and the original roster remains available as source history. Uncovered dates keep their existing forecast.

The native service-note form records the scope confirmation with the paper. The shared resolver checks the paper identity, date, hours, current scope and supplier basis before replacing a supplier forecast. Duplicate, stale or conflicting evidence is shown for review. It does not infer individual worked hours, create Finance confirmations or change rates. Ordinary service notes keep their existing treatment. Linked amounts use exact decimal products and sums, rounded once at the service-note boundary.

Finance, the running sheet and supplier fencing calculations use the same supplier coverage decision. Confirmed membership of the existing customer scope prevents a duplicate ordinary customer charge even if the supplier basis separately needs review. Invalid or stale scope evidence cannot activate that exclusion. Covered planned shifts cannot acquire a second individual actual cost or journal. Existing records and unrelated charges are preserved.

## Build and checks

```sh
toolchain/build.sh v12.37 v12.37_event_crew_actuals_DRAFT/patch_v1237.py
```

The patch accepts the coordinated v12.35 or v12.36 base and refuses repeat application. Build from the current live page and retain the uploader's unchanged-base guard.

The tests use synthetic papers and frozen read-only record snapshots. All HTTP writes are denied. Run browser checks serially under `/tmp/gc500-browser.lock`; keep raw records, financial model output and screenshots in private evidence storage.

Release acceptance requires the shared page checker, resolver and native financial regressions, preservation comparison, desktop and phone sweeps, and inspection of the changed phone view. The final source, hashes, checks and read-back will be recorded here when complete.

Frozen candidate: `d0c7d444d9b9c1aef434478a283bb4fc5b0cbafeb70a329cc1a561f982bb986a` (15,615,874 bytes), built on independently read live v12.36 `d7bd77da6e982c0ac3af19a8e5b183c09bc05e9bf78f267d5e1bea1f8ede689f`. Shared checker passed 210 scripts and resolver checks passed 76/76. Native desktop and phone checks passed 92/92 each; comparison against the original live base passed 24/24. Both full shared navigation sweeps passed 27 tabs / 19 visible panes / 7 deep links / Back, with zero runtime errors, console errors or blocked record-write attempts. Seven phone captures were inspected. Upload dry run verified edit access and the unchanged live base. Implementation source: `a3b1a07883a297950873ee228c948bd51dc252d1`. No operational record writes were performed by these checks. Codex implemented, tested and independently reviewed this scope; no Claude review or receipt is claimed.

## Publication

READY source `9e5982b1c54beeac284ea37f2c880749fedf0e19`. The guarded upload kept the unchanged-base check and verified the public bytes. A separate public GET at 16:25:59 AEST independently matched all 15,615,874 bytes and SHA-256 `d0c7d444d9b9c1aef434478a283bb4fc5b0cbafeb70a329cc1a561f982bb986a`, the new module and v12.37 footer. No operational record was changed by publication. Raw record and screenshot evidence stays private.
