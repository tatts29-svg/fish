# server v5.84: test evidence

Everything below ran against **my own local instances on 127.0.0.1:8815** with the test tokens
(`viewtokenviewtoken1` and `edittokenedittoken1`), on 26 Sep 2026.
- The live service was not contacted.
- The instance on port 8814 was not touched.
- Only the processes these scripts started were stopped, by their own PIDs.

Final `server.js` sha256: `264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14`.

| Evidence | How to reproduce | Result |
|---|---|---|
| Server behaviour (49 checks) | `node test_server.js` | **49 / 49 pass** |
| Dashboard in Chromium, view and edit links | `./start.sh` then `node browser_test.js` | **pass / pass** |
| Same browser walk against unchanged v5.83 (baseline) | `SRV=<v5.83> ./start.sh; node browser_test.js` | same errors, i.e. none new |
| Deploy and rollback rehearsal | `./rehearse_deploy.sh` | as DEPLOY.md expects |

## Test data

`data/` was created for these tests and holds:
- `records.json`, copied from `/tmp/claude-0/gc500_local_8814/records.json` (version 1982);
- `machine.json` and `machine/blobs/`, hard-linked from the same local copy (the v5.85-dyno set, 208 files,
  164 MB), so that `/w/` compression and the server-blob handling could be tested.

The server itself creates `snapshots/`, `files/`, `thumbs/`, `media/` and `machine/cz/` at start.

The page and its media were uploaded exactly as `upload_kit.py` does, from the scratchpad:
`GC500_BASE=http://127.0.0.1:8815 GC500_EDIT_TOKEN=edittokenedittoken1 python3 upload_kit.py kit600/GC500_v6.00_reimport`

```
version: 200 {"version":1982,"updated":"2026-09-25T11:17:17.410Z","level":"edit"}
media: uploaded 175, already saved 0, of 175
manifest: 200 {"sha256":"cfc86a3d9fac981efaad704d41e1cdbc4fc5b60508720ec541f071c059b41de3","files":175,"already":false}
page: 200 {"etag":"\"4f00748271eab6c6\"","bytes":6650027,"uploaded":"2026-09-26T10:47:48.810Z","build_version":"assets-1.0.0","built":"2026-09-25","refs":["AA","CP1","GN0 …
```

- **Reference copy for the byte comparisons.** Another session rebuilt the kit HTML after this upload: it is now
  6,668,432 bytes, against the 6,650,027 uploaded. The comparisons therefore use the page the server holds,
  `data/app.html` (ETag `"4f00748271eab6c6"`), which is the uploaded one.
- **Disk-full phase.** It uses a synthetic 6 MB page, because the kit page is refused 409 by the media gate
  before any write happens.

## `node test_server.js`

Phases:
1. The main instance (compression, 304, headers, `/w/`, durable writes, token levels, prototype keys, the
   limiter, the server blob).
2. SIGTERM, with the same burst against v5.83 as a contrast.
3. Damaged stores at start-up, on copies of the data.
4. A real full disk: a 3 MB tmpfs mounted as `DATA_DIR`, with v5.83 as a contrast.

Lines marked `     ` are information rather than checks.

```

## 1. Main instance (data/, page uploaded with upload_kit.py)
     uploaded page: 6650027 bytes, sha256 4f00748271eab6c6 (ETag "4f00748271eab6c6")
PASS page over br: 200, Content-Encoding br, decodes to the uploaded page byte for byte  — 1438432 bytes on the wire for 6650027 (21.6%)
PASS page over gzip (client without br): Content-Encoding gzip, decodes to the page  — 1830015 bytes
PASS page with no Accept-Encoding (edit link): identity, the page itself  — 6650027 bytes
PASS br;q=0 is honoured (gzip served instead)
PASS Vary: Accept-Encoding on every page representation
PASS each representation has its own ETag  — "4f00748271eab6c6-br" "4f00748271eab6c6-gz" "4f00748271eab6c6"
PASS 304 for a matching ETag, each encoding (br, gzip, identity), empty body  — 304,304,304
PASS 200 for a stale ETag; 200 when the tag belongs to another encoding
PASS security headers on /v/ and /e/ (200 and 304): HSTS 15552000, nosniff, Referrer-Policy strict-origin  — X-Frame-Options SAMEORIGIN; no CSP on the page: true
PASS /w/ JavaScript over br, decodes to the blob (sha matches the manifest)  — vendor/three.module.js: 207048 of 1314681 bytes
PASS /w/ JavaScript over gzip when br is not accepted  — 265698 bytes
PASS /w/ 304 on the br ETag, Vary: Accept-Encoding  — "ce1fa418de16a19495a9f72495580e30-br"
PASS /w/ Range request answered from the plain bytes (206, no Content-Encoding)
PASS /w/ binary model data compressed (glb)  — assets/machine/coates-23.glb: 1527084 of 12938556 via br
PASS /w/ already-compressed type never compressed (mp3)
PASS compressed copies cached per blob hash on disk (machine/cz/<sha256>.br|.gz)  — 188 entries
PASS 40 concurrent edit-token writes: each one is in records.json on disk when its 200 arrives  — 40/40 · version 2381 -> 2421
PASS a DELETE is on disk when its 200 arrives
PASS view token still cannot write (doc PUT/DELETE, file upload, page upload, machine register all 403)  — 403,403,403,403,403
PASS view token still reads the whole record (/api/state 200, level view)
PASS edit token still writes (doc PUT 200, file upload 200)  — 200,200
PASS admin page still opens on the edit token
PASS __proto__ / constructor / prototype refused with 400 (doc collection, doc id, DELETE, file upload, file delete, re-file, thumb)  — 400,400,400,400,400,400,400,400,400
PASS nothing reached the prototype: /f/<view>/__proto__ 404, record has no such collections, service still answers  — collections: 27
PASS an inherited name ("toString") becomes an ordinary own collection, not a write onto Object.prototype.toString
PASS 30 wrong keys from one address answered as before (401), the 31st gets 429 with Retry-After  — 31st: 429, Retry-After 300s
PASS that address is refused on every keyed path while blocked — page link 429, even the right key 429
PASS another address is not affected (API 200, page 200)
PASS 100 requests with a right key (incl. 404s for missing files) or no key at all never trip it  — statuses seen: 200,404,401
PASS /health is never limited
PASS server blob uploaded, manifest registered WITHOUT server/gc500-server.js; new blob (SERVER_FILE) and rollback blob (SERVER_FILE_KEEP) both still on the volume  — register: {"sha256":"6928b042e6dc10ef920569108e3ec19939294521ec9fc95c848b3b60a39fce69","version":"6928b042e6dc-noserver","files":207,"already":true,"removed":1,"kept_unli
PASS the server source is no longer downloadable with the view link (/w/<view>/server/gc500-server.js 404)
PASS the machine entry page still serves after the re-register

## 2. SIGTERM flushes (same instance)
PASS SIGTERM mid-burst: clean exit 0 after the flush  — {"code":0,"sig":null}
PASS every write that was answered 200 is on disk  — 49 answered 200
PASS every accepted write was also answered 200 before the exit  — 49 answered of 49 accepted
PASS every write the service accepted (in writes.log) is on disk, answered or not  — 49 accepted, 49 of them on disk
     log: GC500 SIGTERM: flushing before exit | GC500 SIGTERM: record v2474 saved, exiting

   contrast: the same burst against v5.83 (unchanged), SIGTERM
     v5.83: 60 writes answered 200, then SIGTERM within the 150 ms debounce: 0 of them on disk (informational; this is the fault fixed)

## 3. A damaged store at start-up
PASS records.json cut in half: starts from the newest valid snapshot, NOT empty  — version 2381 from records-202609261101-boot.json, 27 collections
PASS /health says so (record_recovered)  — [{"store":"record","file":"records.json","reason":"does not parse (Unterminated string in JSON at position 96132 (line 1 column 96133))","loaded_from":"records-202609261101-boot.json","damaged_copy":"records.json.corrupt-2026-09-26T11-01-40-580Z","at":"2026-09-26T11:01:40.582Z"}]
PASS the damaged file is kept aside, byte for byte  — records.json.corrupt-2026-09-26T11-01-40-580Z
PASS the deploy log says it loudly  — !!!!! GC500 RECORD RECOVERED FROM SNAPSHOT records-202609261101-boot.json: /tmp/claude-0/stage/server/data_corrupt/records.json does not parse (Unterm…
PASS a start-up snapshot was taken (records and files, -boot)
PASS files.json damaged: recovered from its own snapshot (files-*.json)  — [{"store":"file index","file":"files.json","reason":"does not parse (Unexpected end of JSON input)","loaded_from":"files-202609261101-boot.json","damaged_copy":"files.json.corrupt-2026-09-26T11-01-40-704Z","at":"2026-09-26T11:01:40.705Z"}]
PASS damaged record and no snapshot: refuses to start (exit 1), damaged file untouched  — {"code":1,"sig":null}
PASS damaged cards.json (no snapshot kept): refuses to start rather than start with no cards  — {"code":1,"sig":null}
     log: !!!!! GC500 REFUSING TO START: /tmp/claude-0/stage/server/data_cards/cards.json does not parse (Unexpected end of JSON input), and there is no valid snapshot of the drop cards to recover from. Nothing
PASS a genuine first run (empty volume) still starts, with an empty record

## 4. A full disk (3 MB tmpfs as DATA_DIR)
PASS v5.84: 4 MB file upload onto a full disk answered 507, service up  — upload 507, /health 200
PASS v5.84: 6 MB page upload onto a full disk answered 507, service up, no page half-installed  — upload 507, /health 200
PASS v5.84: a record write onto a full disk is answered 507 (not 200), /health 503; after space is freed the next write is 200 and on disk  — full: 507/503 · freed: 200/200
     v5.83 on the same full disk: file upload 400, then /health 200; page upload socket ECONNRESET, then /health down

49 of 49 checks passed
```

Notes on the output:
- **"page over br … 21.6%".** The page travels as 1,438,432 bytes against 1,830,015 for gzip and 6,650,027 plain.
- **The two contrast lines show the faults this build fixes, reproduced on unchanged v5.83:**
  - all 60 acknowledged writes were lost on SIGTERM;
  - a page upload onto a full disk killed the process (ECONNRESET, then /health down).

  The instance log shows v5.83's uncaught `ENOSPC … at uploadApp`.

## `node browser_test.js` (v5.84)

For each link, the test:
1. opens the page;
2. waits for sync;
3. visits all 18 tabs;
4. opens the machine (`explorer`) from the Coates Way tab;
5. records page errors, failed same-origin requests and every local HTTP error.

```
{
 "link": "view",
 "load_ms": 60093,
 "main": {
  "status": 200,
  "content-encoding": "br",
  "strict-transport-security": "max-age=15552000",
  "referrer-policy": "strict-origin",
  "x-content-type-options": "nosniff"
 },
 "sync": {
  "backend": true,
  "readonly": true,
  "state": "live"
 },
 "tabs_visited": 18,
 "machine_opened": "explorer",
 "http_errors_local": [
  "503 /api/weather",
  "503 /api/weather/forecast"
 ],
 "machine_files_by_encoding": {
  "br": 7,
  "identity": 66
 },
 "local_statuses": {
  "200": 120,
  "206": 3,
  "503": 9
 },
 "footer": "GC500 2026 · Surfers Paradise Street Circuit Care Deeply · Customer Focused · Be Our Best · One Team · Competitive Spirit Open",
 "pageErrors": [],
 "consoleErrors": [
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)"
 ],
 "failedLocal": [
  "/m/viewtokenviewtoken1/0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34.mp net::ERR_ABORTED",
  "/m/viewtokenviewtoken1/0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34.mp net::ERR_ABORTED"
 ]
}
PASS dashboard on the view link: br page, no page errors, no failed local requests (aborted media ranges aside), no local HTTP errors but the 503 of the unset weather key, synced read-only
{
 "link": "edit",
 "load_ms": 60897,
 "main": {
  "status": 200,
  "content-encoding": "br",
  "strict-transport-security": "max-age=15552000",
  "referrer-policy": "strict-origin",
  "x-content-type-options": "nosniff"
 },
 "sync": {
  "backend": true,
  "readonly": false,
  "state": "live"
 },
 "tabs_visited": 18,
 "machine_opened": "explorer",
 "http_errors_local": [
  "503 /api/weather",
  "503 /api/weather/forecast"
 ],
 "machine_files_by_encoding": {
  "br": 7,
  "identity": 66
 },
 "local_statuses": {
  "200": 125,
  "206": 3,
  "503": 8
 },
 "footer": "GC500 2026 · Surfers Paradise Street Circuit Care Deeply · Customer Focused · Be Our Best · One Team · Competitive Spirit Open",
 "pageErrors": [],
 "consoleErrors": [
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
  "Failed to load resource: the server responded with a status of 503 (Service Unavailable)"
 ],
 "failedLocal": [
  "/m/edittokenedittoken1/0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34.mp net::ERR_ABORTED",
  "/m/edittokenedittoken1/0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34.mp net::ERR_ABORTED"
 ]
}
PASS dashboard on the edit link: br page, no page errors, no failed local requests (aborted media ranges aside), no local HTTP errors but the 503 of the unset weather key, synced with edit rights
```

- **The only local HTTP errors are expected:** `/api/weather` and `/api/weather/forecast` answer 503 because no
  `WEATHERAPI_KEY` is set locally.
- **The aborted request is the hero video.** Its range request is aborted as the tabs change. It happens
  identically on v5.83 (below).
- **Machine files:** 7 came brotli-compressed and 66 plain. The plain ones are types that are never compressed,
  files under 1 KB, or copies not worth keeping. v5.83 served all 73 plain.

## Baseline: the same walk against unchanged v5.83

```
view main gzip pageErrors [] http_errors ['503 /api/weather', '503 /api/weather/forecast'] failedLocal ['/m/viewtokenviewtoken1/0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34.mp net::ERR_ABORTED', '/m/viewtokenviewtoken1/0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34.mp net::ERR_ABORTED'] w {'identity': 73}
edit main gzip pageErrors [] http_errors ['503 /api/weather', '503 /api/weather/forecast'] failedLocal ['/m/edittokenedittoken1/0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34.mp net::ERR_ABORTED', '/m/edittokenedittoken1/0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34.mp net::ERR_ABORTED'] w {'identity': 73}
```

Same page errors (none), same HTTP errors and the same aborted video range. The only difference is the encoding:
v5.83 serves the page gzip and the machine uncompressed.

## `./rehearse_deploy.sh`: DEPLOY.md, step by step, locally

The script uses the start command's own logic (`/app` replaced by a local directory) and the repo's
`tools/machine_set.py`. "Live" starts as v5.83, booted from blob `b8d38b8f…` and listed publicly as
`server/gc500-server.js`.

```

### before: live runs v5.83 from SERVER_FILE=b8d38b8f889b (listed in the public set as server/gc500-server.js)
{"ok":true,"disk":"writing","version":2474,"app":false,"files":0,"cards":0,"cards_live":0,"machine":true}
public download of the server source with the VIEW link: 200

### step 1: upload the v5.84 blob (v5.83 still live; nothing registered)
{"sha256":"264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14","bytes":216494,"already":false}
inventory has v5.84 blob: True · has v5.83 blob: True

### step 2: variables SERVER_FILE=264363128b6c SERVER_FILE_KEEP=b8d38b8f889b; redeploy (SIGTERM old, start command boots the new blob)
server v5.84 — HARDENED 
server blob 2 kept off the public set

### step 3: verify
{"ok":true,"disk":"writing","version":2474,"app":false,"files":0,"cards":0,"cards_live":0,"machine":true,"record_recovered":null,"build":"v5.84"}

### step 4: take server/gc500-server.js out of the public set (machine_set.py, kept files only, nothing uploaded)
kept files: 207
kept 207 files from /tmp/claude-0/stage/server/deploy/machine_v585_noserver_keep.json
set: 207 files, 164.2 MB, digest 6928b042e6dc, 0 local files to offer
blobs: 0 uploaded, 207 already on the volume
register: 200 {'sha256': '6928b042e6dc10ef920569108e3ec19939294521ec9fc95c848b3b60a39fce69', 'version': 'v5.85-dyno-noserver', 'files': 207, 'already': False, 'removed': 0, 'kept_unlisted': 2}
public download of the server source with the VIEW link: 404
machine entry page: 200
on volume: 264363128b6c
on volume: b8d38b8f889b
{"ready":true,"version":"v5.85-dyno-noserver","label":"The Coates Way · V8 Connected + Satellite plan explorer","built":null,"entry":"index.html","files":207,"bytes":172137431,"registered":"2026-09-26T11:05:10.298Z","sha256":"6928b042e6dc10ef920569108e3ec19939294521ec9fc95c848b3b60a39fce69"}

### step 4b: a restart after the re-register still boots v5.84 from its (unlisted) blob
{"ok":true,"disk":"writing","version":2474,"app":false,"files":0,"cards":0,"cards_live":0,"machine":true,"record_recovered":null,"build":"v5.84"}

### rollback: SERVER_FILE=b8d38b8f889b; redeploy
server v5.83 — THE FORECAST 
{"ok":true,"disk":"writing","version":2474,"app":false,"files":0,"cards":0,"cards_live":0,"machine":true}
page on the view link: 503 (503 = no page uploaded in this rehearsal copy; unchanged v5.83 behaviour)

### roll forward again: SERVER_FILE=264363128b6c
server v5.84 — HARDENED 
{"ok":true,"disk":"writing","version":2474,"app":false,"files":0,"cards":0,"cards_live":0,"machine":true,"record_recovered":null,"build":"v5.84"}

rehearsal done
```

## Files

| File | What |
|---|---|
| `server.js` | v5.84 |
| `server_v5.83_to_v5.84.diff` | the change |
| `test_server.js`, `browser_test.js`, `rehearse_deploy.sh` | the tests |
| `start.sh`, `stop.sh` | start or stop this instance by its recorded PID |
| `test_output.txt`, `browser_output.txt`, `browser_output_583_baseline.txt`, `rehearsal_output.txt`, `upload_kit.out` | raw outputs |
| `test_instance.log`, `browser_instance.log`, `rehearsal.log` | server logs from the runs |
