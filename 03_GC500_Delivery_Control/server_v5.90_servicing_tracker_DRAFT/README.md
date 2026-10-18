# Server v5.90 — servicing tracker reliability

Author: Andrew Fisher · 18 Oct 2026

**READY TO DEPLOY — staged, not switched live.** Codex uploaded the exact tested blob at 18 Oct 2026 10:01:56 AEST (00:01:56 UTC), and verified it in `/api/admin/machine`. Source commit `bbafd3b301097f737ecdae1b61e15ed33795d46b`. All prior blobs remain present; page, machine manifest and operational export are unchanged apart from export timestamp. The running server remains v5.89. Claude owns the Railway switch. **No machine import or page/machine publication until that switch is confirmed.** Main-page servicing integration still depends on the corrected v10.66 boot base. See `DEPLOY_HANDOVER.md` and `staging_verified.json`.

This patch starts from the exact v5.89 server `cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c`; it never changes the operational record, prices, quantities, or completion status.

Candidate: `55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec`, 289,090 bytes. All six HTTP/deploy suites were rerun against these exact bytes: **224/224 passed**, plus **14/14 worker VM checks** and **23/23 final-card/native-server browser checks**. Rebuilding from the guarded base produces identical bytes; repeat/wrong-base application is refused. `validation.json` records the final test-source hashes and scope. The offline worker is an exact copy of `../servicing_tracker_DRAFT/card/tracker_sw.js`, embedded by the patch.

## Changes

- The signed hourly allowance is **60 successful fresh-tick POSTs per reference per tracker**. A photographed sheet can exhaust its own reference, never another reference's signed allowance. Address limits still protect request parsing; failed writes and idempotent retries spend no reference allowance. A 429 names the blocked `ref`, `index`, `id`, and `retry_after` so a phone may defer that reference while sending another.
- The active store cap is **25,000 unvoided ticks per tracker**. Voiding restores that capacity without deleting audit events or changing an old id's retry answer. A separate **100,000 retained-tick ceiling per tracker** bounds its history (`507 history_full`, `full:true`). A TEST tracker never consumes a real tracker's allowance. `/health.tracker_ticks` remains the historical total for compatibility; admin reads explicitly name active and historical counts.
- Updating a tracker whose signing key is missing returns **409 `key_lost`**, with `reprint_required:true`, before changing its card. The editor must restore the original private store or deliberately send **`rekey:true`** and reprint every completion sheet. Ordinary updates with a kept key retain every existing signature.
- Admin tick reads use a cursor and leave signing links/void history out by default. Crew and admin reads share the same bounded, binary-search cursor walk.
- Crew tick reads include `card_script_hash`, the existing CSP SHA-256 hash of the exact stored and served card script. A phone compares this with its running script to detect an old cached card even when service days have not changed. This adds no signing keys, QR signatures, or contact fields to the response and does not rotate existing completion codes.
- Shared 404/410 card error text stays byte-for-byte compatible with v5.89. The tracker card itself has its own tested contact fallback; existing driver routes are not restyled or reworded.
- A live tracker serves **GET `/d/<token>/sw.js`** with `Service-Worker-Allowed: /d/<token>` and `Cache-Control: no-store`. Only tracker HTML gains `worker-src 'self'`. The worker controls this exact card URL (optional trailing slash), caches its successful HTML shell after an online warm-up, and allows a fresh reference scan to reopen offline. It never caches APIs, writes, another card, or the main page. Online 404/410 removes the saved card. Cache-storage failure never discards a successful online response or claims the phone is ready offline. The card response keeps `no-store`; the worker explicitly stores the single shell in Cache Storage. The first ever offline visit still needs an initial online visit, as the card/print instructions explain.

No delivery or report route changes. Legacy driver card cache/CSP behaviour remains unchanged. Tracker signatures never enter public GET replies or logs. View-link access to `/api/ticks` remains 403.

## Admin read contract

`GET /api/ticks?token=T&since=N` (edit link only):

- Existing metadata: `tracker`, `load`, `title`, `expires`, `expired`, `card_withdrawn`, `updated`, `key_kept`, `now`, `service_day`, `epoch`.
- `ticks`: at most 2,000 unvoided ticks whose sequence is greater than `N`.
- `seq`: next read cursor. If `more:true`, the last returned tick's sequence; otherwise the complete current sequence, including skipped voided events.
- `more`, `total_seq`, `active_ticks`, `historical_ticks`.
- On an epoch change, discard the local tick snapshot and read again from zero (the existing crew contract).
- `links` is absent unless **`links=1`**, used for printing.
- **`voided=1`** includes marked voided ticks in the same bounded cursor stream for audit.
- `voids` is absent unless **`voids=1`**. **`void_since=N`** then pages the independent void history: `void_seq` is its next cursor and `void_more` says whether more remains. Each response includes at most 100 void events and at most 2,000 tick ids. Events are never split.

`GET /api/ticks` without a token retains the tracker list with its load/title/expiry/epoch and historic `ticks`; it also adds `active_ticks`. `POST /api/cards` retains its existing `tracker.links` response so printing does not need an extra request.

The default admin response deliberately changes the unused pre-release tracker UI contract. The replacement panel consumes the cursor/default-no-links shape. The old full-audit tests now request `links=1&voided=1&voids=1` explicitly; no assertions about signature protection, record isolation, recovery, or existing routes were removed.

## Build and checks

```sh
python3 patch_server_v590.py ../server_v5.89_servicing_tracker_DRAFT/server.js server.js
node --check server.js
TMPDIR=/path/to/private/scratch node test_tracker590.js
TMPDIR=/path/to/private/scratch node test_tracker.js
TMPDIR=/path/to/private/scratch node test_delivery_v586_on_v590.js
TMPDIR=/path/to/private/scratch node test_mms_sender_v587_on_v590.js
TMPDIR=/path/to/private/scratch node test_mms_v585_on_v590.js
TMPDIR=/path/to/private/scratch node rehearse_deploy.js
node ../servicing_tracker_DRAFT/card/test_worker.cjs
```

`test_tracker.js` retains the original rollback to v5.87; its source may be supplied through `GC500_ROLLBACK_SERVER` in sparse checkouts. All tests bind only 127.0.0.1, use fake credentials and temporary stores, and stop only their own processes. No test contacts the live service or sends a real message.

| Check | Result |
|---|---|
| Existing tracker suite, updated deliberate contract assertions | 84/84 |
| New reliability probes, final bytes | 25/25 |
| Offline-worker VM checks, final embedded source | 14/14 |
| Final card with exact final server; native API and browser protocol | 23/23 |
| Same final card on exact v5.89 rollback server | 14/14 |
| Existing delivery status | 45/45 |
| Existing MMS sender | 14/14 |
| Existing MMS | 37/37 |
| Staged blob, v5.89 rollback and v5.90 roll-forward rehearsal | 19/19 |
| Exact rebuild; wrong/repeated-base refusal; worker source matches | Passed |

The 25 new probes cover worker route/CSP/ordinary-card isolation, exact served-script identity and same-token updates with unchanged service days, default and explicit admin reads, missing-key refusal with unchanged card bytes, deliberate rekey and signatures, per-tracker cap, void freeing capacity, pagination/void pagination, restart, retained-history ceiling, operational-record byte identity, and exact legacy unknown/expired contact wording. The existing reference-limit probe confirms another reference and idempotent retry still work after one reference reaches its hourly limit.

The local rehearsal uses this order: v5.89 → final v5.90 → v5.89 → final v5.90. It creates a tracker, saves and voids a tick on v5.90, accepts a fresh signed tick on the rolled-back v5.89, and proves both active ticks, the void audit and the original completion signature survive the final roll-forward. A further signed tick is accepted. The operational record remains byte-for-byte identical across all four boots. The keep-list fixture includes all five earlier hashes supplied from the release owner's inventory check; production must also retain any additional current entries.

The release owner independently reviewed the final guarded patch and ran the final card `953233d43de21949f5a7704ee19c973c94b9864a789c86aef9f6d90437a85842` against this exact server: **23/23 browser/native-server protocol checks passed**, with the operational record untouched and no external-network, script or CSP errors. Evidence: `../servicing_tracker_DRAFT/card/evidence/card_real_server_protocol.json`.

The same card also passed **14/14 compatibility checks on exact v5.89 `cb32d00e…`**. Online signed ticks and an already-open tab's offline queue work after rollback; a fresh offline QR scan does not, and v5.89 does not expose the new script-identity field. The card truthfully shows “Offline scans not ready”. That rollback result is separate from the 261 checks run on the final v5.90/card/worker combination.

Full-page servicing integration remains pending the corrected v10.66 boot base. Physical iPhone/Android/laminated-sheet scans remain an operator check. No live carrier or paper scan is claimed.

## Publication and rollback

Claude owns the Railway variable switch. The release owner stages the blob and checks the inventory first. Use the same staged-blob process as v5.89, with exact preflight/source verification and private record/export backup. Stage this `server.js` under its SHA through the guarded admin blob route. Preserve every current server blob and machine descriptor; add the current v5.89 hash to `SERVER_FILE_KEEP`, switch only `SERVER_FILE` to the tested v5.90 hash, preserve all other Railway bindings, and redeploy once at a quiet time. Verify actual running file hash, `/health.build`, record version, card/tick health, protected blob inventory, and unchanged public page bytes before calling it live.

Rollback: `SERVER_FILE=cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c`, retaining the v5.90 blob. The append-only data format has not changed. v5.89 can still read and accept the saved ticks/signatures, but its old shared-cap, silent-rekey and full-admin-read limitations return; do not update a key-lost tracker while rolled back. Existing warmed offline cards keep their installed worker, but v5.89 cannot install the new worker for a new phone.
