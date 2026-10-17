# Server v5.89 — the servicing tracker (DRAFT, not deployed)

Author: Andrew Fisher · 18 Oct 2026 · one patch on the live server v5.87 (`d5a0d777…`)

**State: DRAFT.** Built and tested on this machine only. Nothing has been uploaded, staged or deployed, and nothing
live was called. Going live needs Andrew's "Upload" (steps below). The version still has to be claimed on `STATUS.md`
(Codex's server v5.88 claim from 2 Oct is still on the board, with no files; this draft takes v5.89).

## Why

Andrew, 18 Oct 2026: "I dont want it set up so you tick it and charged. Its purely just a track. Can it not have its own
seperate html that is linked to nothing else. But still links results to main."

His brief the same day: "Carried by crews" · "Just times" · "Waste tanks too" · "We can have multiple printed off for
each. I can even laminate them" · "they can tick that refernce number as complete. One refernce number may have other
completion lines as they will have a different desription" · "There is a compmetion qr code for their refernece. They
scan. It whe all done. And click tap. This only alows them to complete the refernce qr code. Must shows percentage
complete for the area. And again for everything" · "each refernce needs to have 3 ticks Water fillled. Pumped out
Restock/Cleaned ... As these could be 3 different job. Waste tanks is only a pump out. Toilet blocks will only need a
pump out and clean. Sunday night will need a extra. locked and confirmed empty. No water will be needed".

Days: "8am thursday to 8am friday, 8am friday to 8am saturday, 8am saturday to 8am sunday, 8am sunday to 8am monday"
(Thursday "is a just in case"). His job rules later that day ("Corrext with 1. 2 is correct. 3 let go with need to be
cleaned regardless"): blocks with their own tank or on the sewer are cleaned only, the tank takes the pump-out, and FWFs
are still cleaned on Sunday. These arrive in the list the page posts (kind `blockclean`); the server holds no job rule of
its own.

A card page cannot read anything back from v5.87, so crews could never see each other's ticks or the percentages.
That needs a server addition, and this is it.

## What v5.89 adds (and nothing else)

| | |
|---|---|
| `POST /api/cards` (edit link) | an optional `tracker: {days:[{id,plan}], lines:[{id,ref,kind,qty}], plans:{kind:{plan:[tasks]}}}`. Checked whole: **400** with the reason if it does not check out (never quietly dropped). **409** if a card that has a tracker is re-posted without one. **409 with the live token** if a second live tracker for the same load is posted without its token. `keys` and `targets` forced to `[]`. A tracker needs `expires` on or after the day after its last service day (its last service runs to 08:00 that morning). The first time, the service makes a secret of 32 random bytes; the answer carries `tracker.links = {REF: sig}`, `sig = base64url(HMAC-SHA256(secret, token + ':' + REF))` cut to 16. Re-posting keeps the token, the secret (so every printed code keeps working) and every tick. |
| `GET /d/<token>/ticks?since=<seq>` | anyone holding the card. Memory only: no open counted, nothing saved, no log line. `{now, epoch, seq, days, ticks:[{id, seq, ref, line, task, day, done, undoes, at, tapped_at}], service_day, updated, more}`. Voided ticks are left out. At most 2,000 ticks a reply; `seq` is where the next read starts (`more: true` when cut). |
| `POST /d/<token>/ticks` | `{ticks:[1..20 of {id, ref, sig, line, task, day, done, undoes, tapped_at}]}` → `{saved:[{id, seq, at, already}], now, epoch}`. Checked: the signature for its reference (timing-safe), the line belongs to the reference, the task is on that line's kind for that day's plan, the day is configured and not after today's service day (Gold Coast date of the service's clock minus 8 h), an untick names done ticks of the same job and day. Idempotent by id (same tick: `already`; different: **409**). Body ≤ 2 KB (**413**). Rate limits **429 + Retry-After**. A cap per job per day. Every tick is checked before any is kept; a refusal names the first bad tick (`index`, `id`, `code`) and keeps none of that POST, so the phone drops that one and sends the rest. |
| `GET /api/ticks[?token=]` (edit link) | with a token: the list, the signatures, every tick (voided ones marked) and every void. Without: one line per tracker, no signatures. View link **403**. |
| `POST /api/ticks/void` (edit link) | `{token, ids}`: sets ticks aside with a line of its own (a TEST card, a flood). Nothing is deleted; the epoch moves on so every phone reads again. |
| report routes on a tracker card | **404** `no_reports`, not counted as a wrong key (and no 6 MB report bodies from a laminated sheet). |
| card tokens | looked up as own properties everywhere (`/d/` routes, the token re-use on `POST /api/cards`, `DELETE /api/cards/<t>`, `/api/reports?token=`). v5.87 served `GET /d/propertyIsEnumerable` as a blank 200 that rewrote cards.json, withdrew "constructor" with a 200, and answered `/api/reports?token=constructor` with a 500. |
| a tracker card's opens | written to cards.json and the log at most once a minute (with how many opens it stands for), not on every scan. |
| labels | `/health` → `build: 'v5.89'`, `tracker_ticks`, `tracker_notes`; the start-up banner names v5.89 and the tracker. |

**What it never does:** read or write the record, a delivery state, a tick on the page, a count or a charge ("Scans and
ticks never change either figure"). No names exist anywhere ("Just times"). The secret never leaves the service: not to
a phone, not into any listing (not even the edit link's), not into writes.log. Signatures appear only in the edit link's
`POST /api/cards` answer and `GET /api/ticks?token=`, which exist to print them.

### The store

`DATA_DIR/tracker_ticks.jsonl`: one JSON line per event (`epoch`, `key`, `tick`, `void`), written with `appendFileSync`
on an open file and `fsync`ed before the answer, never rewritten whole for a tick. A failed write is cut back off the
file, so a half line never glues itself to the next good one. Snapshots: at every start, hourly (24 kept), and the
moment a tracker's secret is made. At start: a last line cut short is dropped and noted (`tracker_notes`); a damaged
line in the middle, ticks out of order, or a missing or empty file with snapshots → the file is set aside under
`.corrupt-<time>`, every good line kept, the newest snapshot fills in, the result written back, a new **epoch**, and
`/health record_recovered` says so. With nothing to recover from it starts empty and says so. **It never refuses to
start** — the record, the edit link and the drivers' cards never stop for a track.

### Limits (all in the patch, one place)

| | |
|---|---|
| body | 2 KB a POST, 1–20 ticks (about 10 full-size ticks fit in 2 KB — the card keeps its batches under 1,900 bytes) |
| per address | 60 POSTs a minute; 120 reads a minute |
| per tracker | 1,200 POSTs an hour from every address together |
| per job | 12 ticks and unticks (not voided) for one line, one task, one day — then **400** `job_cap` |
| whole store | 25,000 ticks, then **507** `full` (a whole tracker at its caps is about 11,000) |

The per-address limit is looser than the review's suggested 20 a minute: crews can share one mobile address, a 429
only delays (the card keeps its ticks and goes again), and what bounds a flood is the signature (one reference per
photographed code) and the per-job cap, not this limit.

## The review (`../servicing_tracker_DRAFT/design_and_review_18Oct.json`) — what landed here

| review item | in v5.89 |
|---|---|
| BLOCKER: one sheet can flood or fake the tracker; no recovery; flood slows the record | signed completion codes (one reference each); per-address and per-tracker rate limits with 429 + Retry-After; per-job cap; edit-only void; append-only file (no whole-file rewrite per tick); reads capped at 2,000 a reply; tracker opens written at most once a minute; snapshots of ticks kept to a day; store cap 25,000 |
| typed crew name → XSS on the edit link | no names exist anywhere; nothing typed is stored (the page must still escape what it shows) |
| a re-post with a bad or missing tracker turns it into a driver card | 400 for a bad tracker, 409 for a tracker card re-posted without one; 404s carry codes (`withdrawn`, `no_tracker`, `no_reports`, `expired`) |
| late offline untick wipes another crew's newer tick | `undoes` names the cancelled ticks; checked against the same reference, line, task and day |
| recovery loses ticks silently and reuses seq | `epoch` in every read and every POST answer, changed by any recovery or void; recovery salvages good lines and merges the snapshot |
| trailing slash, 413 retried forever | the route takes `/d/<t>/ticks`, `/d/<t>//ticks` and `/ticks/`; 413 answered before reading |
| two trackers for one load | 409 with the live token |
| day pick and 08:00 | the server refuses a day after today's service day; the service day is worked out from the service's clock |
| damaged tick file stops the service | set aside and salvaged, never a refusal to start |
| hasOwnProperty on card tokens | fixed in every card lookup, old routes included |
| test steps write to live | the deploy and rollback are rehearsed locally (`rehearse_deploy.js`); a TEST tracker on live can be voided afterwards |
| (page and card items: escaping, the panel surviving the run sheet's redraw, `phone` not `mobile`, hashchange, twin-steer wording on print) | for page v10.63 and the card, not the server |

## Build

```
python3 patch_server_v589.py ../server_v5.87_pictures_from_shared_number_LIVE/server.js server.js
```

`server.js` **283,062 bytes, SHA-256 `cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c`**,
`node --check` passes. The patch refuses any base but `d5a0d777…` and refuses to run twice; every replacement must
match exactly once. Against v5.87: 19 lines changed (all listed above) and 583 lines added; the live v5.87 file
itself is untouched.

## Tests (local only: 127.0.0.1, fake tokens, throw-away `DATA_DIR`, Node v22.22.0)

Run with `TMPDIR=<scratch folder> node <file>`. Results are saved beside each file.

| file | result | what |
|---|---|---|
| `test_tracker.js` | **84/84** | making and validation (16 broken lists → 400, nothing made; 409 × 4); signatures (WC07's cannot tick WC06; none → 403; the HMAC formula); jobs per kind and day (no water on Sunday, lock only on Sunday, tanks only pumped, blocks pumped and cleaned, tanked and sewer blocks cleaned only, Thursday's night jobs); retries (already, 409, a bad tick keeps none of its POST, 10 full ticks in 2 KB); unticks with `undoes` (two phones, one late); the phone's time (kept, held to arrival, dropped); WC07 weighs 20; rate limits per address, per tracker, reads; per-job cap and void; wrong tokens counted, right ones not; report routes 404; 413 and a cut-off chunked body; reads write nothing; ten scans → one write; `propertyIsEnumerable`, `constructor`, `__proto__`; `/api/ticks` edit-only; void (one line, epoch moves, voided tick not resurrected); re-post keeps token, signatures and ticks; no signature or secret in any listing, log or file but the store; **no record writes** (records.json byte for byte, `/api/version` unchanged, writes.log only card and tracker lines); append-only (same inode, prefix unchanged); restart keeps the epoch; a cut-short last line; a damaged middle line; the file lost; a failed write (507, then saved once, file clean after restart); expiry 410 after 26 Oct; **rollback: v5.87 on v5.89's data starts**, serves the card, answers `/ticks` with its plain 404 (not counted), lists no secret; back on v5.89 with every tick; the 08:00 boundary (07:59:59 Friday is Thursday's service); nothing tickable on 18 Oct; 1,200 POSTs an hour per tracker; the 25,000 store cap; a damaged file with no snapshot still starts |
| `rehearse_deploy.js` | **14/14** | the Upload steps on a local volume: v5.87 booting from its blob; the v5.89 blob staged with `PUT /api/admin/machine/blob/<sha>` and listed; a wrong-hash upload refused; the start command's copy (`server from volume blob …`, sha256sum matches); v5.89 up, banner and `/health` right, record version unchanged; a tracker made and ticked; rolled back to v5.87 (card opens, ticks wait); rolled forward with every tick; a `SERVER_FILE` typo shows as a missing blob |
| `test_mms_sender_v587_on_v589.js` | **14/14** | v5.87's sender suite, label check now v5.89 |
| `test_delivery_v586_on_v589.js` | **45/45** | v5.86's delivery-status suite, label check now v5.89 |
| `test_mms_v585_on_v589.js` | **37/37** | v5.85's MMS suite, label check now v5.89 |

`fake_clock.js` sets the local server's clock for the tests (`node -r ./fake_clock.js server.js`). It is test-only:
`server.js` has no clock setting of its own.

## For the card and the page (built to the same contract)

- A POST of 20 full-size ticks does not fit 2 KB; about 10 do. The card already batches under 1,900 bytes.
- On a refusal (400, 403, 409, 413) the answer names the first bad tick (`index`, `id`, `code`) and none of that POST
  was kept. Codes: `bad_body`, `bad_tick`, `bad_id`, `bad_sig` (403), `line`, `day`, `future_day`, `task`, `undoes`,
  `id_reused` (409), `job_cap`, `too_big` (413), `slow_down` (429), `disk` (507, retry), `full` (507), `no_key` (503,
  the tracker lost its secret: retry; the codes need printing again), and on the route `withdrawn` (stop for good),
  `no_tracker`, `expired` (410). On rollback the route answers v5.87's plain HTML 404.
- A tick sent again after it was voided answers `already: true, voided: true`; the card should not show it as done
  (it disappears at the next read anyway, as the epoch moved on).
- `service_day` in each read is the service's own day (08:00 to 08:00 Gold Coast time).
- A TEST tracker needs `expires` on or after the day after its last day (for a TEST day of today, tomorrow).

## To go live (Andrew's "Upload")

Order: this server first, then page v10.63, then make and print the tracker. Before Thu 22 Oct 08:00, at a quiet hour.
The edit key comes only from `GC500_EDIT_TOKEN` and goes to curl on stdin (`-H @-`), never on the command line.

1. **Claim** server v5.89 on `STATUS.md` and push; mark this folder READY TO UPLOAD with its commit.
2. **Pre-flight (read only):** `GET /health` (expect build v5.87; note the record version). `GET /api/version` with the
   edit key must say `level: edit`. `GET /api/export` → keep the copy privately, out of git. Read the Railway variables:
   `SERVER_FILE` = `d5a0d777…`, `SERVER_FILE_KEEP` (expected `f5b9a3f7…`, `76afbd99…`, `264363…`, `b8d38b…`),
   `MMS_FROM=shared`, `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`.
3. **Stage:** `PUT /api/admin/machine/blob/cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c` with the
   bytes of `server.js` (expect `bytes: 283062`). `GET /api/admin/machine` must list `cb32d00e…` and `d5a0d777…`.
   **No machine import** (admin page or `machine_set.py`) until step 4 is done: v5.87 deletes any blob not named in
   `SERVER_FILE`/`SERVER_FILE_KEEP`.
4. **One Railway change:** `SERVER_FILE=cb32d00e…`; `SERVER_FILE_KEEP` = `d5a0d777…` plus every existing entry; keep
   `MMS_FROM`. One redeploy (a gap of about 10 s).
5. **Verify:** deploy log `server from volume blob cb32d00e…` and `sha256sum /app/server.js` = `cb32d00e…`; banner
   starts `server v5.89 — THE SERVICING TRACKER`, shows `servicing tracker 0 trackers, 0 ticks` and `server blob N kept
   off the public set`, no `RECOVERED`; `/health` → `ok: true`, `build: v5.89`, `tracker_ticks: 0`,
   `record_recovered: null`, the same record version; the view page's bytes unchanged; `GET /api/ticks` with the edit
   key → `{trackers: []}`, with the view key → 403. A banner still saying v5.87 means a typo in `SERVER_FILE`; an older
   server means it booted the `SERVER_B64` fallback (v5.78) — roll back at once.
6. **Then** the page (v10.63) on its own Upload, and the tracker: a TEST tracker first (`load
   'servicing-tracker:TEST'`), scanned on two phones, ticked and unticked, then its ticks voided with
   `POST /api/ticks/void`; then the real one, checked with GET only (it opens and shows 0 ticks); print and laminate.
   Never withdraw it during the event — fix the list by re-posting with the same token ("Update the tracker").

## Rollback

`SERVER_FILE=d5a0d777…` (keep `cb32d00e…` in `SERVER_FILE_KEEP`), one redeploy, `/health` → v5.87. Nothing in the
record needs undoing. `tracker_ticks.jsonl` and the card's `tracker` field stay and are ignored; the tracker card still
opens; its `/ticks` answers v5.87's plain 404 (not counted), so phones keep their ticks and send them when v5.89 is back
(rehearsed: `rehearse_deploy.js` 9–12, `test_tracker.js` 73–76). While on v5.87: do not re-post the tracker card (v5.87
drops the `tracker` field), and note v5.87 would accept a report posted on it. If the log says `REFUSING TO START`, do
not roll back blindly (v5.84 `DEPLOY.md`).

## Not checked here

The live Railway variables, the start command's literal text and the Node version actually running were not read (the
v5.83 README records `node:20-alpine`; the append is fsynced explicitly, so it does not depend on the version). No live
call was made.

## Pre-deploy review (18 Oct 2026, three independent reviewers)

All three: safe to deploy; every existing route, header and data file behaves as v5.87 (57- and 30-request side-by-side runs,
identical after normalising times and ids); the secret never leaves the service. Fixed before deploy: unsigned junk POSTs no longer
spend the tracker's shared hourly allowance (only signed, fresh ticks do; tests 80 and 80b); /health gains `tracker_refusing`.
Left for later (minor, tracker-only): recovery write order after a damaged line plus a failed write at boot; voided ticks do not
free store capacity; full reads are per-address capped. Rebuilt: 283,062 bytes, sha256 cb32d00e…; test_tracker 84/84, v5.86
delivery 45/45, v5.87 sender 14/14, v5.85 MMS 37/37, deploy rehearsal 14/14.
