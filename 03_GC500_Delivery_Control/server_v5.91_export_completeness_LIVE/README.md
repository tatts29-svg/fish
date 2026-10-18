# Server v5.91 — complete native record export

Author: Andrew Fisher · 18 Oct 2026

**VERIFIED LIVE — 18 Oct 2026 12:58 AEST.** Claude performed the Railway switch and recorded the running-file hash in PR #1 comment6244962648. Codex independently verified healthy v5.91, unchanged page/full shared state/machine, all retained server blobs and unauthenticated ticks rejection. At13:09 AEST, all55 exportable collections and54 native aliases matched the actual v10.71 native export field-for-field, including records, loads, fence_dockets and costs. No operational writes. Source4b106c0138e3d5706d58f274f8b966df3757db67; serverc1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7,292,090 bytes. Author: Andrew Fisher.

The hosted export omitted eleven native record collections and wrapped signed-paper values incorrectly. That meant a
record exported through the service could lose site information even though phones had synced it correctly. v5.91
folds the same exportable collections as the current native page, including the atomic quantity metadata used to retain
received and installed amounts after a planned quantity changes. It changes only `require_fold()` and the two server
version labels. All other routes and persistence code remain byte-for-byte v5.90.

Exact predecessor: `55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec` (v5.90).
Candidate: `c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7`, 292,090 bytes.

## Export contract

- Restores `lineRates`, `serviceNotes`, `fenceCollections`, `runRules`, `answers`, `finance745`, `photoLinks`, `gates`,
  `spares`, `subhire` and `vmsboard` using their exact native value/list/map kinds.
- `docketPapers` exports the value itself, including an object or array, instead of a second `{v: ...}` wrapper.
- Value maps preserve `false`, `0`, `null`, empty strings and arrays exactly as native `fromDocs` does. Lists use the
  native key/id ordering. Missing collections still have their native empty shape.
- Valid `scope1017` metadata travels atomically inside a quantity document. The export reconstructs its derived load
  entry using the exact native validation and decode rules. Ordinary carrier loads stay; stale or invalid scope cache
  entries are discarded just as native `ScopeSync1017.attach` does. This is a pure exported projection: stored
  quantities, received/installed values, delivery status, pricing and the underlying documents are not changed.
- Adds the native record-less envelope aliases, including entries/places, stamps and the other existing record fields,
  so removing the nested `records` envelope does not drop their data.
- **55 of 56 synced collections are exportable. `mapKeys` is intentionally excluded.** Native `exportRecord` deletes
  those hosted-address credentials and native import rejects them. The server follows that existing privacy rule.
  Tracker keys, signatures, tokens and private tracker stores are not added to the export. Unknown collections are
  not copied wholesale. Native build-only metadata and unsynced crew data are not invented.

The native contract used by the tests is exact v10.66 page
`4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6`. The oracle executes its actual collection
registry, `fromDocs`, quantity-scope wrapper/`attach`, and `exportRecord`; it is not a second implementation of the fix.

## Reproduce and validate

```sh
python3 patch_server_v591.py ../server_v5.90_servicing_tracker_DRAFT/server.js server.js
node --check server.js
TMPDIR=/path/to/private/scratch node test_export591.cjs
TMPDIR=/path/to/private/scratch GC500_ROLLBACK_SERVER=/path/to/exact/v5.87/server.js python3 run_legacy.py
TMPDIR=/path/to/private/scratch node rehearse_deploy591.js
node ../servicing_tracker_DRAFT/card/test_worker.cjs
```

`GC500_NATIVE_PAGE` may point at the exact native page above if its build path differs. Wrong page/source identities
are refused. `run_legacy.py` copies the original v5.90 suites to a disposable folder and adapts only version-label
literals; no substantive assertion is removed. Its optional positional arguments select named suites for a bounded
retry. The original tracker suite retains its v5.87 rollback check. All servers/providers are localhost fixtures with
fake credentials; no test writes to Railway or sends a real message.

The exact candidate passed: native export VM/HTTP **32/32**, original tracker **84/84**, reliability **25/25**,
delivery **45/45**, MMS sender **14/14**, MMS **37/37**, four-boot rehearsal **31/31**, and unchanged worker **14/14**.
Exact rebuild, wrong-base refusal and repeated-application refusal also pass. `validation.json` records test source hashes; `reproducibility.json` records exact rebuild and guard
refusal. The four-boot rehearsal uses v5.90 → v5.91 → v5.90 → v5.91 on one synthetic volume. It verifies complete
exports each time, unchanged document/file bytes, retained cards/ticks/signatures/voids, and a new signed tick accepted
while rolled back. Export completeness improvements disappear on v5.90, but the source documents remain intact and
the full export returns when v5.91 boots again.

An independent source and oracle review found no blocker: the native kinds and atomic decoder match, map-key privacy
stands, and all bytes outside folding and the two version labels match the predecessor. The read-only live verification is recorded above. `DEPLOY_HANDOVER.md` gives the release/rollback checks.


## Native-page upload-envelope compatibility

The native oracle now also accepts exact v10.66 `9724e2a644833e7b6e56139b7954add2f639e348f03c6b6c9d109e0229cc821a`,
but only after verifying that removing its exact after-doctype identity comment restores the original pinned `4b5b727b…`
page byte-for-byte. No arbitrary page is accepted. The local native/HTTP suite passes 32/32 again;
`envelope_oracle_validation.json` records that supplemental run. Production server bytes remain
`c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7`; existing full regression evidence remains valid.
