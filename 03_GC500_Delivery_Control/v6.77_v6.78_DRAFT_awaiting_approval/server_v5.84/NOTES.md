# server v5.84: notes

Base: `server_v5.83/server.js` (sha256 `b8d38b8f…`, byte-identical to live). Every change is commented in the
code with `v5.84 —` and the reason. The full diff is `server_v5.83_to_v5.84.diff`. No dependencies were added and
no external services are used.

## What changed, briefly

1. **Compression.**
   - **Page.** Served brotli when the client accepts `br` (a q=0 is honoured), otherwise gzip as before.
     - `app.html.br` is quality 11: 1.44 MB against 1.83 MB gzip for the 6.65 MB page.
     - It is made once per uploaded version, off the event loop, and tagged with that version's ETag in
       `app.html.br.etag`.
     - Until it exists (the ~16 s after an upload, or the first boot on an older upload), gzip is served.
   - **`/w/` files.** Machine files of type html, js, mjs, css, json, gltf, svg, glb, hdr, bin, wasm, csv, md and
     txt, 1 KB or larger, are compressed once per blob hash into `machine/cz/<sha>.br|.gz`.
     - This happens in the background, one file at a time: when a set is registered, at boot, and on first request.
     - jpg, png, webp, mp3, m4a, ogg, woff2, woff and ktx2 are never compressed.
     - A copy that saves less than 10% is not kept; a `.x` marker records that it was tried.
     - Range requests are always answered from the plain bytes.
   - **ETags and caching.**
     - Each representation has its own ETag (`"…"`, `"…-gz"`, `"…-br"`). A 304 is answered only for the tag of
       the representation this request would get.
     - `Vary: Accept-Encoding` is set on all of them.
     - Consequence: every browser downloads the page once more after the deploy, because its cached ETag
       belonged to an encoding that now has a different tag.
2. **Saved before confirmed.**
   - The 150 ms restartable debounce is gone. `persist()` now returns a promise that settles when a save
     containing the change has been written, fsynced and renamed into place.
   - `PUT` and `DELETE /api/doc` answer 200 only after that, and 507 if it failed.
   - Saves are grouped: changes that arrive while a save is in flight go into the next one. There is no timer to
     push back.
   - **Also fixed, found while testing:** v5.58's "refuse every write until a write lands again" could never
     recover, because the refusal stopped the only thing that saves. A refused write now retries the save once
     first.
   - **SIGTERM and SIGINT handlers:**
     1. stop accepting connections;
     2. wait for the save in flight and any queued one;
     3. let pending answers go out (up to 3 s) and flush the write log;
     4. exit, with a hard cap of 8 s.
   - Node is PID 1 in the container, and PID 1 ignores signals it has no handler for. So until now a redeploy's
     SIGTERM did nothing, and the SIGKILL that followed cut off whatever was being written.
3. **A damaged store at start.** Every store used to be read as `try { JSON.parse } catch { first run }`. Now
   `loadStore()` handles each case:

   | Situation | What v5.84 does |
   |---|---|
   | File missing, no snapshot of it | First run (unchanged) |
   | File missing, but snapshots of it exist | Treated as lost: loads the newest valid snapshot |
   | File present but unparseable or the wrong shape | Moves it aside as `<name>.corrupt-<time>`, loads the newest valid snapshot (by mtime), writes it back |
   | Damaged, and no valid snapshot | Refuses to start (exit 1) with the file's name; the damaged file is left in place, so every restart refuses the same way |

   - A recovery is logged as `!!!!! GC500 … RECOVERED FROM SNAPSHOT`, repeated in the start-up line, and shown on
     `/health` as `record_recovered` (null when nothing was recovered).
   - This covers `records.json` and `files.json`.
   - `cards.json`, `reports.json` and `scoped_reports.json` are not snapshotted, so for them a damaged file means
     refusing to start. An empty cards file saved over a damaged one would cut every driver's link.
   - Reports can hold inline photographs, which is why they are not snapshotted hourly.
4. **Snapshots.**
   - A boot snapshot (`records-<YYYYMMDDHHMM>-boot.json`) is taken at every start.
   - `files.json` is now snapshotted alongside the record, both hourly and at boot (`files-…`).
   - Boot snapshots rotate separately (12 kept), so a crash loop cannot push out the 96 hourly ones.
   - Snapshots are written to a temporary name and renamed.
   - A store that has never been written is not snapshotted. Otherwise its absence at the next start would set
     off a false recovery; this was caught in testing.
5. **Prototype keys.**
   - `__proto__`, `constructor` and `prototype` (any case) are refused with 400 as a collection or doc id, and
     as a file id in upload, delete, re-file, thumbnail and serve.
   - Collections and files are now looked up as own properties only. `toString` and similar names can no longer
     reach inherited functions, which was also a DoS: `DELETE /api/doc/constructor/keys` deleted `Object.keys`.
6. **Headers on the page (`/v/`, `/e/`, including 304s):**
   - `Strict-Transport-Security: max-age=15552000`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin`, not `no-referrer`: see below.
   - The existing `X-Frame-Options: SAMEORIGIN` stays.
   - **No CSP:** see below.
7. **Upload errors.**
   - Two throws inside `uploadFile`'s pipeline callback crashed the process: the rename, and `persistFiles`,
     which now returns its error like `persistCards`. Both are caught, the index is restored, and 507 is answered.
   - A full disk while streaming is answered 507, not 400.
   - `uploadApp` writes all three temporary files first, renames them last, and answers 507 on failure. The page
     that was live stays live.
   - Re-file and delete restore the index and answer 507 if its write fails. Delete writes the index before
     removing the bytes.
   - The request handler is now a named async `route()`, and the server attaches a `.catch` to it. Every
     un-awaited `return asyncHandler()` (uploadApp, registerMachine and the rest) is covered: 507 for a full
     disk, 500 otherwise, and no crash. The error log line never contains a key.
   - Tested on a 3 MB tmpfs. v5.83 on the same disk crashed on a page upload; v5.84 answered 507 and stayed up.
8. **Wrong-key limiter.**
   - A request that presents a key which turns out wrong is counted per address. This covers `/v`, `/e`,
     `/admin`, `/w`, `/f`, `/m`, the API header or `?t=`, and unknown drop-card tokens.
   - After 30 in 5 minutes, that address gets 429 with `Retry-After` on every keyed path. That includes a right
     key, or the limit would slow no guessing.
   - Not counted, so normal use cannot trip it:
     - a right key;
     - a missing file under a right key;
     - a request with no key at all.
   - The page itself stops polling as soon as its key is refused (`syncStop('revoked')` on 401/404), so a stale
     tab cannot trip it either.
   - `/health` and `/` are never limited.
   - Counts live in memory and are bounded to 20,000 addresses. They reset on restart.
9. **Server file off the public set.** `SERVER_FILE` and `SERVER_FILE_KEEP` blobs are never deleted by a machine
   register. The register answer gains `kept_unlisted`. See DEPLOY.md.

## Deliberate deviations from the brief, and why

- **`Referrer-Policy: strict-origin` instead of `no-referrer` on the page.**
  - The page loads Mapbox GL and its tiles and the Google Maps script straight from the browser. It sets no
    `referrerPolicy` of its own (checked: none in the 6.6 MB page).
  - Both keys are restricted to this site's address, and Mapbox and Google check that restriction against the
    Referer header. The README says the page "sends Mapbox only its origin as referrer" for exactly this reason,
    and the machine pages already use `strict-origin-when-cross-origin` for the same keys.
  - `no-referrer` would therefore switch off the live map and the 3D view.
  - `strict-origin` sends only `https://gc500-production.up.railway.app/`, never the path. So the link's token
    never leaves in a Referer, same-origin or cross-origin, and nothing is sent over plain http. That meets the
    intent: stop the token leaking.
  - **Not verified locally:** with no Mapbox or Google keys here, the live map and 3D views could not be
    exercised. Check them in step 3 of DEPLOY.md.
- **No Content-Security-Policy on the page.** It could not be verified to leave the page fully working:
  - The page is one 6.6 MB HTML file whose code is inline scripts, inline styles and inline handlers, so any
    policy needs `'unsafe-inline'`. That largely defeats a CSP's main purpose, script injection.
  - The views that need outside hosts could not be tested locally, because no Mapbox or Google keys are
    available here:
    - Mapbox GL (api.mapbox.com, events.mapbox.com, blob workers)
    - the Google Maps JS API and its tiles (maps.googleapis.com, maps.gstatic.com, *.googleapis.com)
    - Cesium (cdn.jsdelivr.net)
  - A policy that looks right but blocks the live map on race day costs more than it protects.
  - Suggested path, if wanted:
    1. Ship it as `Content-Security-Policy-Report-Only` with a small report endpoint on this service.
    2. Watch a few days of real use across all views.
    3. Enforce it.
    4. Separately, move the page's inline code to hashed or nonced scripts in the build, so that
       `'unsafe-inline'` can go.
  - `frame-ancestors` is already covered by `X-Frame-Options: SAMEORIGIN`.
- **Limiter address.** It uses Railway's `X-Real-IP`, which Railway's edge sets. The socket address is the edge's
  own, so keying on it would put every user in one bucket and let one bad client block everyone. The Railway docs
  do not say whether a client-sent `X-Real-IP` is overwritten. If it is passed through:
  - a client could dodge the limit by changing the header;
  - a client could get another address blocked for 5 minutes by sending wrong keys under that address.

  Neither exposes data. Worth a check with `X-Railway-Debug` after the deploy if it matters.
- **cards, reports and scoped reports: refuse rather than recover** (above). Snapshots are not taken for these
  because reports can hold inline photos.

## What the view link can read: options for the owner (no change made)

Today the view link, which is meant to be shared widely, can read:

- **The whole record** (`/api/state`), including:
  - rates, costs, fence rates and costs;
  - contracts and purchase orders;
  - notes;
  - the names people typed.
- **The export** (`/api/export`). It has no level check, so any valid key can download the complete record as a
  file.
- **The file list** (`/api/files`) **and every file** in it (`/f/<view>/<id>`), including invoices filed against
  branches.
- **The machine set.** Until step 4 of the deploy, that includes the server source.

Drop cards, card reports, texting and email are already edit-only.

| Option | What it does | Impact |
|---|---|---|
| **A. Longer, unguessable view token, rotated now** (e.g. 32 random bytes, base64url) | Makes guessing impossible and cuts off any copies forwarded so far | Everyone with the view link needs the new one. Open pages stop syncing and say so. Forwarding a link still shares everything; the limiter slows guessing but does nothing about forwarding. Cheapest; no code change. |
| **B. Trimmed view record** | Server filters `/api/state`, `/api/export` and `/api/files` for view level: leave out the money collections (`rates`, `accRates`, `fenceRates`, `fenceCosts`, `costs`, `purchaseOrders`, `contracts`, `rental`), invoices and typed names, and refuse `/api/export` to view | Moderate code change; needs a page build check. Any view-link screen that shows those figures (cost panels, rate tables, invoice cards) will be empty or must say "edit link only". The page should hide those tabs for view, not show zeros. The biggest reduction in exposure for a widely shared link. |
| **C. Export and invoices edit-only** (a subset of B) | Two one-line level checks: `/api/export` edit-only; `/f/` and `/api/files` hide `kind: invoice` from view | Smallest code change that removes the bulk-download and invoice exposure. View-link users lose the export button (if the page shows it) and invoice cards. |
| **D. Two view links** | A "crew" view token that gets a trimmed record, and the current full view link kept for the few who need it | Most flexible. More links to manage; same code as B, plus a third token. |
| **E. Real sign-in** (Coates tenant, per person) | Replaces link-keys | Owner decided against it on 11 Sep 2026; noted for completeness. |

Recommendation for the owner to weigh: **C now** (small, low-risk), with **A** at the same time if the view link
has travelled further than intended, and **B** or **D** after race week if costs should not be visible to
everyone with the link.

## Left as they were, and why

- **`sms.json`, `mail.json`, `media.json`, `machine.json` still read as "empty on error".** These were not in the
  brief.
  - `sms.json` and `mail.json`: an empty file resets the day's send counters, which weakens the daily caps.
  - `machine.json`: an empty index makes the next machine import delete every blob it does not list. The server
    blob is still safe because v5.84 keeps it.
  - `media.json`: an empty index means the page upload gate refuses until media is re-imported.
  - Candidates for the same `loadStore` treatment in a later build.
- **A record write answered 507 stays in memory.** Other readers see it, and the next successful save writes it.
  The page keeps and retries it as for any 507, and the write is last-writer-wins and idempotent. Undoing it
  across grouped saves would add risk for no gain.
- **A replacement file whose index write fails.** The new bytes are already in place and the index keeps the old
  card, so the listed hash can disagree with the bytes until the file is uploaded again. Rare; it needs a full
  disk at exactly that moment.
- **Limiter state is in memory.** It resets on every deploy, which is acceptable for a light limiter.
- **`SERVER_B64` still holds an older server.** v5.84 is too large for one variable (see DEPLOY.md). Keep
  `SERVER_FILE` set.
- **The machine set's version name** (`v5.85-dyno`) is unrelated to the server version (v5.84). They only look
  alike.
