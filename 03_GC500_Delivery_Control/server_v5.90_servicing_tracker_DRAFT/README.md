# Server v5.90 — servicing tracker reliability

Author: Andrew Fisher · 18 Oct 2026

DRAFT — local checks complete, including the reviewed worker storage-failure correction and truthful no-contact fallback. Not deployed. The server owner publishes after the card/panel integration checks and independent source review. This patch starts from the exact live v5.89 server `cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c`; it never changes the operational record, prices, quantities, or completion status.

Candidate: `fb69c73d65b1cc5d206f902d6be226a08b463e6d86abbe7b38292be5d3798524`, 289,048 bytes. The full 214-check baseline passed on previous candidate `afd7c216b5e5fa63964a7cb57b655fb7276f982029b3d9338a9847fd414ab1e8`. After the worker/contact-text correction and crew script-identity field, all affected checks passed on these exact final bytes: 25 HTTP reliability checks and 14 worker VM checks; rebuild and source parity also pass. The unchanged server-contract suites retain their recorded baseline results; they were not silently relabelled as rerun. See `reproducibility.json` for the identical rebuild and repeat-application refusal. The offline worker is an exact copy of `../servicing_tracker_DRAFT/card/tracker_sw.js`, embedded by the guarded patch.

## Changes

- The signed hourly allowance is **60 successful fresh-tick POSTs per reference per tracker**. A photographed sheet can exhaust its own reference, never another reference's signed allowance. Address limits still protect request parsing; failed writes and idempotent retries spend no reference allowance. A 429 names the blocked `ref`, `index`, `id`, and `retry_after` so a phone may defer that reference while sending another.
- The active store cap is **25,000 unvoided ticks per tracker**. Voiding restores that capacity without deleting audit events or changing an old id's retry answer. A separate **100,000 retained-tick ceiling per tracker** bounds its history (`507 history_full`, `full:true`). A TEST tracker never consumes a real tracker's allowance. `/health.tracker_ticks` remains the historical total for compatibility; admin reads explicitly name active and historical counts.
- Updating a tracker whose signing key is missing returns **409 `key_lost`**, with `reprint_required:true`, before changing its card. The editor must restore the original private store or deliberately send **`rekey:true`** and reprint every completion sheet. Ordinary updates with a kept key retain every existing signature.
- Admin tick reads use a cursor and leave signing links/void history out by default. Crew and admin reads share the same bounded, binary-search cursor walk.
- Crew tick reads include `card_script_hash`, the existing CSP SHA-256 hash of the exact stored and served card script. A phone compares this with its running script to detect an old cached card even when service days have not changed. This adds no signing keys, QR signatures, or contact fields to the response and does not rotate existing completion codes.
- Error pages without a supplied contact now say to contact the project manager on site; they no longer invent a name on the paperwork.
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
```

`test_tracker.js` retains the original rollback to v5.87; its source may be supplied through `GC500_ROLLBACK_SERVER` in sparse checkouts. All tests bind only 127.0.0.1, use fake credentials and temporary stores, and stop only their own processes. No test contacts the live service or sends a real message.

| Check | Result |
|---|---|
| Existing tracker suite, updated deliberate contract assertions | 84/84 |
| New reliability probes, final bytes | 25/25 |
| Offline-worker VM checks, final embedded source | 14/14 |
| Existing delivery status | 45/45 |
| Existing MMS sender | 14/14 |
| Existing MMS | 37/37 |
| Staged blob, v5.89 rollback and v5.90 roll-forward rehearsal | 14/14 |
| Exact rebuild; wrong/repeated-base refusal; worker source matches | Passed |

The 25 new probes cover worker route/CSP/ordinary-card isolation, exact served-script identity and same-token updates with unchanged service days, default and explicit admin reads, missing-key refusal with unchanged card bytes, deliberate rekey and signatures, per-tracker cap, void freeing capacity, pagination/void pagination, restart, retained-history ceiling, operational-record byte identity, and truthful unknown/expired contact wording. The existing reference-limit probe confirms another reference and idempotent retry still work after one reference reaches its hourly limit.

These are server/HTTP checks. Fresh offline scans and two-phone/multiple-tab card behaviour need the card integration suite on these exact bytes before crew readiness is claimed. No real carrier/iPhone/laminated-sheet scan is claimed.

## Publication and rollback

Use the same staged-blob process as v5.89, with exact preflight/source verification and private record/export backup. Stage this `server.js` under its SHA through the guarded admin blob route. Preserve every current server blob and machine descriptor; add the current v5.89 hash to `SERVER_FILE_KEEP`, switch only `SERVER_FILE` to the tested v5.90 hash, preserve all other Railway bindings, and redeploy once at a quiet time. Verify actual running file hash, `/health.build`, record version, card/tick health, protected blob inventory, and unchanged public page bytes before calling it live.

Rollback: `SERVER_FILE=cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c`, retaining the v5.90 blob. The append-only data format has not changed. v5.89 can still read and accept the saved ticks/signatures, but its old shared-cap, silent-rekey and full-admin-read limitations return; do not update a key-lost tracker while rolled back. Existing warmed offline cards keep their installed worker, but v5.89 cannot install the new worker for a new phone.
