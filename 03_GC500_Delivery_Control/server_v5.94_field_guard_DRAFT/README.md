# Server v5.94 — the delivery field guard and the snapshot read — DRAFT, not live

Author: Andrew Fisher · built 27 Oct 2026 04:55 AEST · nothing here has been deployed

**In short:** a page that doesn't know a delivery field can no longer wipe it. When a delivery document is
written without one of 16 named fields that the stored copy holds, the server keeps the stored value. If both
copies carry a unit map, the server merges it unit by unit using the page's own rule. Separately, the edit key can
now list and read the server's own record snapshots. That is how the laptop's lost 21:56–22:13 changes can be read
back.

All 65 focused checks and all 255 retained checks pass on throw-away local servers (127.0.0.1 only). A replay of the
incident on a private copy of the record keeps every wiped Ready field. Nothing was sent to the live service or to
Railway.

| | |
|---|---|
| Base (live, running since 25 Oct 2026 17:45 AEST) | v5.93 `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46`, 294,310 bytes |
| This build | v5.94 `6057f04e01ba919b8b2b3872fdac6edf2f1577cb86efe84e5ce4a42ec4a97f02`, 304,701 bytes |
| Made by | `python3 patch_server_v594.py server.js` on a copy of the v5.93 file (it checks the base hash and refuses to run twice) |

## What happened

At 03:59:55 AEST on 27 Oct 2026, an edit-link page sat in a phone tab overnight. It had been opened before page v12.31
(10:29 on 26 Oct), so it knew nothing of the Demob fields. The tab woke, read the record and, 3 s later, wrote 68
delivery documents back. Each one had lost every field that page did not know: `ready1231`, `ready1231_at`,
`ready1231_by`, `ready1231_why`, `ready1231_history`, `ready1238_units`, `ready1238_history`, `pickup1238_units` and
`pickup1238_history`. Every other field was unchanged.

Two things combine to cause this:

- **Every page rebuilds delivery documents from a fixed list.** When any page version opens, `mergeRecords` rebuilds
  each delivery document from the fields that version knows, then writes back every document that differs from the
  service.
- **The server stores documents whole.** It replaces the whole document on each write, and the last writer wins.

The Ready ticks were put back by hand in record run 10. The 1238 fields first went live in v12.42 at 20:19 on 26 Oct,
so a tab opened before 20:19 that evening would strip them too, not only a tab opened before 10:29.

## What v5.94 changes, and nothing else

**A. The delivery field guard** (`guard594.js`, inserted into `setDoc`). `setDoc` is the only place a document is
set, and `PUT /api/doc/delivery/<id>` is the only route that writes a delivery document, so the guard covers every
write. When the write lands on a stored document, these rules apply before it is stored:

1. **Missing fields are kept.** Take each field on the list below that the stored document holds and the incoming
   document leaves out altogether (not an own property). The stored value is copied across exactly as it is.
2. **A sent field stands.** If a field is sent, any value and `null` included, it is the sender's word. `null` clears.
3. **Unit maps are merged.** If both copies carry `ready1238_units`, or both carry `pickup1238_units` (as plain
   objects), they are merged unit by unit using the page's own rule (below). No unit on either side is ever dropped.
4. **Histories are never merged.** A history that is sent stands as sent. A history that is left out keeps the
   stored one.
5. **Everything else is stored exactly as sent.**
6. **A brand-new document is stored as sent**, because there is no stored copy to keep from.

The guard reads the stored document and completes the body in the same synchronous step that stores it, so no other
write can land in between. Each write still moves the record on by exactly one version, gets one log line and one
save. The answer to the page is unchanged (`200 {version}`). The page reads only `version`, so a stale tab's retries
end cleanly. A 409 or 422 would have made it retry forever.

When the guard keeps anything, it writes one extra line to `writes.log`, beside the usual `set` line for the same
version. The line holds field names and a count, never a value:
`{"at":…,"v":…,"what":"delivery fields kept","coll":"delivery","id":"GN25","kept":["ready1231",…],"unitsKept":0}`.
`unitsKept` counts the unit entries taken from the stored copy: every unit in a map copied whole, plus each stored
unit that won the merge.

The capability `delivery_field_guard_version: 1` appears everywhere `lock_declarations_version` is reported:
`/health`, the crew tracker read and the tick save acknowledgement.

**B. The snapshot read**, edit key only (`snap594.js`):

| Request | Answer |
|---|---|
| `GET /api/admin/snapshots` | `[{name, bytes, mtime}]`, newest first by modification time (then name) |
| `GET /api/admin/snapshot/<name>` | the file's bytes, `application/json`, `Cache-Control: no-store` |

- **Which names.** Only `records-YYYYMMDDHH.json` (hourly; the stamp is the UTC hour) and
  `records-YYYYMMDDHHMM-boot.json` (one at each start) are listed or served.
- **Matching.** The name has to match `^records-\d{10}(\d{2}-boot)?\.json$` exactly, as it arrives in the address,
  and it is never decoded first. A name that does not match, or a file that is not there, gets 404. Encoded slashes,
  dot segments, NUL and every other trick get 404 as well.
- **Never served.** `files-*` and `ticks-*` snapshots are never served. A ticks snapshot carries every tracker's
  signing secret and the crew-card tokens.
- **Access.** A view link gets 403 and no key or a wrong key gets 401, the same as `/api/admin/machine`. As with
  `/api/export`, the key may come in the header or in `?t=`.
- **Read only.** Nothing is written into the snapshot folder, because a `records-*` file placed there could be loaded
  at a later start.

**C. The banner** gains a v5.94 line in front: *"server v5.94 — THE DELIVERY FIELD GUARD (…; Andrew Fisher, 27 Oct
2026) + v5.93 — THE SERVICING TRACKER (…"*. The rest of the banner is byte for byte as v5.93 had it. `/health`
`build` reads `v5.94`.

## The 16 guarded fields, and why each one

A field is on the list only if both of these hold:

- **An older page can strip it.** The field was added after the first page release. A tab opened before that release
  does not know it, and its `mergeRecords` drops it.
- **No current writer removes it.** No writer in the live page (v12.42.1, `85826c9b…`) deletes it, leaves it out on
  purpose or shrinks it.

I checked the live page for this: there are 0 `delete` statements on any of these fields. Every clear is a new dated
entry instead.

| Fields | Added | How a current page clears it | Stored now (post-wipe copy, 214 delivery docs) |
|---|---|---|---|
| `ready1231`, `ready1231_at`, `ready1231_by`, `ready1231_why`, `ready1231_history` | v12.31, live 26 Oct 10:29 | `setReady` always writes all five; Not ready is `ready1231:false` with a stamp | 3 docs before the wipe, 0 after (restored by run 10) |
| `ready1238_units`, `ready1238_history` | v12.38 code, live in v12.42 on 26 Oct 20:19 | `setUnitReady` writes a superset map; Not ready is `{on:false, at, by, why}` | stripped; 54 docs again after run 10 (page audit, v11373) |
| `pickup1238_units`, `pickup1238_history` | as above | `setBooking` writes a superset map; a cleared booking is `{at:'', note:'', by, set}` | stripped |
| `emptied`, `emptied_at`, `emptied_by`, `emptied_history` | v8.16, 3 Oct | `revokeEmptied816` writes `emptied:false` with a stamp and a history line | 50 docs |
| `timeline841` | v8.41, 4 Oct | a clear is a stage-0 proof | 16 docs |
| `loading872` | v8.72, 7 Oct | a clear is `side:''` on that load | 69 docs |
| `handling875` | v8.75, 7 Oct; methods widened in v8.81 | a clear is `method:''` | 48 docs; 42 use tilt-tray or forklift, which (per the page audit) a pre-v8.81 page's check rejects and drops |

The first nine are the incident's fields. The last seven are guarded for the same reason: an old enough tab strips
them, and nothing current removes them. A tab open since early October is unlikely, but the guard costs nothing on
those fields.

**Why it is a named list and not "keep anything missing".** Five live writers delete delivery fields on purpose:

| Writer | Fields it deletes |
|---|---|
| `setEta` | `eta` |
| `setDeliveryNote` | `note` |
| `setDate` | back to plan: `date`/`date_by`/`date_at` or `out_date`/`out_by`/`out_at`; new reschedule: the `*_off_*` stamps |
| `setDone`, `setLight` | the dated-complete trio `done_date_only`, `done_effective_date`, `done_recorded_at` |

`mergeRecords` also leaves `out_portions` out by design, and `moveRecord` drops `light` and `rescheduled` on its copy.
A generic rule would silently undo every one of those clears. Each future page release that deletes a field would
then need a server change, or its clear would fail without a word.

These stay unguarded on purpose: `eta`, `note`, the date and out-date groups and their off stamps, the dated-complete
trio, `out_portions`, `light` and `rescheduled`. The test suite proves those clears still clear (check 35).

## The unit-map merge

This is the page's own rule, word for word from the live page's `mergeRecords`. Singles1238's `umap` and `keepUnits`
apply the same rule. The comment in the code quotes it:

```js
const um1238 = (x, y, t) => { const o = Object.assign({}, x && typeof x === 'object' ? x : {}); Object.keys(y && typeof y === 'object' ? y : {}).forEach(u => { const p = o[u], q = y[u]; if (!q || typeof q !== 'object') return; const s1 = String(q[t] || ''), s0 = p ? String(p[t] || '') : ''; if (!p || s1 > s0 || (s1 === s0 && J(q) < J(p))) o[u] = q; }); return o; };
```

Here `J = v => JSON.stringify(v === undefined ? null : v)`.

- **The stamp.** `ready1238_units` is judged by `at` (when the unit was ticked). `pickup1238_units` is judged by `set`
  (when the booking was written). A booking's own `at` is the booked pick-up time, not a stamp.
- **Who wins.**
  - The later stamp wins.
  - An entry with no stamp loses to any stamped one.
  - On the same stamp, the smaller JSON text wins. That makes Not ready beat Ready, and a cleared booking beat a
    booking, whichever copy arrives first.
- **One addition.** A stored unit whose entry is not an object (the page never writes one) is kept when the incoming
  map has no entry for that unit, so no unit on either side is dropped.
- **Unit ids.** Ids are set as own properties, so a unit named `__proto__` stays a unit.

The merge also closes the two-phone race: a phone that has not yet folded in another phone's unit can no longer write
over it.

## Known limits

- **Only the delivery collection is guarded.** Every other collection (`supplied`, `assetNumbers`, `photoLinks`,
  `labour`, `fenceDockets` and the rest) is still whole-document, last writer wins. A stale page could still strip a
  field it doesn't know from those. None was touched in the incident: comparing the 20:25 backup (v11123) with the
  04:14 copy (v11319) across all 45 collections, only 3 delivery documents differ, and only in the five `ready1231`
  fields. (The 1238 fields were added and stripped between those two copies, so neither shows them.)
- **DELETE is not guarded.** A pre-v12.31 page's `deliveryEmpty` ignores the Ready and 1238 fields. If such a page
  clears an ETA or note on a document whose only other content is Ready data, it would DELETE that document. The
  current page counts those fields, and the audit found no stored document that is at risk today. Guarding DELETE is a
  separate decision (refuse it, or keep `{_k, guarded fields}`), so it is left out of this change set. Check 40 records
  today's behaviour.
- **A field the sender does know is last writer wins, as before.** Example: a v12.31–v12.41 tab knows `ready1231`, so
  its `ready1231` stands as sent, while its missing 1238 fields are kept. Scalars are not compared by stamp, and
  histories are not merged.
- **A new page field must be added to `DELIVERY_KEEP` in the same change set.** Today's v12.42.1 tabs will strip any
  delivery field a later release adds, because `mergeRecords` still works from a field list.
- **Some deliberate removals of these fields no longer work.** Import "replace", and a move onto a reference that
  already holds guarded fields, now keep those fields where they used to remove them. That is the price of the guard.
  Both are rare, and neither has happened on this job.
- **The writing page sees the merged result only after its next refresh.** It adopts its own version without
  re-reading the record (`ackVersion`), so it shows the merge only after another device writes. This is harmless: there
  is no write loop.
- **The server cannot tell a stale page by its headers.** The page sends no build header, so the guard judges only
  what the body leaves out.
- **It does not bring back what was already lost.** That is what the snapshot read is for.

## Reading the laptop's 21:56–22:13 changes back

**Deploy v5.94 before the snapshots age out.** Hourly snapshots are kept by count, 96 of them, with at most one per
UTC hour. A snapshot is therefore deleted no sooner than about 95 hours after it is taken:

- `records-2026102612.json` (taken during 22:00–22:59 AEST on 26 Oct) goes no earlier than about 22:00 AEST on
  Fri 30 Oct.
- `records-2026102617.json` (03:00–03:59 AEST on 27 Oct) goes no earlier than about 03:00 AEST on Sat 31 Oct.

The redeploy adds one boot snapshot. Boot snapshots rotate separately, so the redeploy prunes nothing.

**Which snapshot.** The stale page's writes began at about 17:59:55Z on 26 Oct and ended at version 11319. If its 68
writes were consecutive versions, as the incident notes say, the last version before the wipe is 11251. Use the
newest snapshot whose `updated` is before 17:59:55Z and after 12:13Z on 26 Oct (22:13 AEST), and whose `version` is
11251 or lower; that one holds the laptop's work and is from before the wipe. The "03:00 snapshot" Andrew chose is `records-2026102617.json` (UTC hour 17 is 03:00–03:59
AEST).

If the process has run without a restart since the v5.93 switch (07:45:37Z, 25 Oct), hourly snapshots fall at about
HH:45 UTC, which puts that file about 15 minutes before the wipe. I could not check this from here: list the
snapshots and read `version` and `updated` before trusting any one of them.

**How.** Use two GETs with the edit key in the `x-gc500-token` header, the way the toolchain's read-back scripts take
it from the environment: first `/api/admin/snapshots`, then `/api/admin/snapshot/<name>`.

- Keep the file privately, outside the repository; it is the whole record.
- Compare the 15 references named on STATUS.md against the live record.
- Putting anything back is a record run on Andrew's word, through the page's own functions, as AGENTS.md sets out.
  The snapshot read itself changes nothing.

## Tests

All runs were on throw-away servers bound to 127.0.0.1, with fake tokens and a temporary `DATA_DIR`, and each test
process had an explicit environment (`GC500_EDIT_TOKEN` is never read). Logs were kept in the scratchpad, not here.

| Suite | Result | What it covers |
|---|---|---|
| `test_field_guard.cjs` (new) | 65/65 | the guard (stale write keeps every field byte for byte and still applies the sent fields; 68 stale documents in a row; null clears; sent fields and histories stand as sent; unit-map union, the later stamp both ways, the equal-stamp tie both ways, `set` not `at` for bookings, cleared booking wins; current-page writes and deliberate clears unchanged; new documents and other collections stored as sent; one version per write; the log line; `__proto__` as a unit; restart) · the snapshot read (list and byte-for-byte read of the server's own boot snapshot and of placed files; 26 bad names and 5 dot-segment addresses refused; ticks and files snapshots never served; 401/403; nothing written) · rollback to v5.93 on v5.94's data and forward again |
| `run_legacy.py`: the five retained v5.90 suites | 205/205 (tracker 84, tracker590 25, delivery 45, mms_sender 14, mms 37) | unchanged assertions, original fixture, the v5.87 rollback file |
| `run_legacy.py`: v5.93's focused `test_declarations.cjs` | 50/50 | including its rollback to v5.92 |

**Build-label expectations changed for the retained runs, and nothing else:**

- `v5.90` becomes `v5.94` in all five v5.90 suites, plain and regex, as v5.93's runner did. That covers test_tracker
  check 1, test_delivery "server v5.94 starts", test_mms_sender "health says v5.94", test_mms "health says build
  v5.94", and the same literal in the check labels.
- test_tracker check 64's banner pattern becomes
  `/server v5\.94 — THE DELIVERY FIELD GUARD \(.*\) \+ v5\.93 — THE SERVICING TRACKER/`, because the v5.94 line now
  sits in front.
- `test_declarations.cjs` first check: `health.build==='v5.93'` becomes `'v5.94'`.

**Mutation check.** The new suite was also run against eight deliberately broken copies of this server, and each one
failed at the check meant to catch it:

| Broken copy | Caught at |
|---|---|
| guard off | check 8 |
| bookings judged by `at` | check 28 |
| tie rule reversed | check 26 |
| non-object stored unit dropped | check 30 |
| snapshot pattern widened to `ticks-` | check 45 |
| name decoded before matching | check 52 |
| view link allowed | check 55 |
| log line off | check 12 |

**Incident replay (private, counts only, not in the repo).** A throw-away server was seeded with the 20:25 backup
(v11123). All 214 delivery documents from the 04:14 post-wipe copy were then written back the way the stale page
wrote them.

| | v5.93 | v5.94 |
|---|---|---|
| Documents still equal to the backup | 211 of 214 | 214 of 214 |
| Documents that lost the `ready1231` family | 3 | 0 |
| "fields kept" log lines | none | 3, each naming exactly the five `ready1231` fields |
| Other 44 collections | unchanged | unchanged |

The temporary copies were deleted.

## Deploy (when Andrew says go), mirroring `../server_v5.93_switch/README.md`

1. **Pre-flight, GET only.**
   - `/health` reads v5.93, `ok`, no `record_recovered`, no `tracker_refusing`.
   - Take a private backup of health, version, full state, cards, the full tick history, the machine inventory and the
     page, with v5.93's `stage.py` pattern. Change its two hashes (OLD = v5.93 `8764451d…`, NEW = v5.94 `6057f04e…`)
     and its build check (`v5.93`). Keep the backup outside the repository.
2. **Stage the blob.** `PUT /api/admin/machine/blob/6057f04e01ba919b8b2b3872fdac6edf2f1577cb86efe84e5ce4a42ec4a97f02`
   with this `server.js` (what `stage.py --execute` does). Read it back in `/api/admin/machine` at 304,701 bytes.
   Check that state, cards, page and tick history are unchanged and the running server is still v5.93. Never prune
   the staged blob while it waits.
3. **One Railway change on service `gc500`, production:**
   - `SERVER_FILE` = `6057f04e01ba919b8b2b3872fdac6edf2f1577cb86efe84e5ce4a42ec4a97f02`
   - `SERVER_FILE_KEEP` = `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46` (v5.93) in front of the
     list in force since the v5.93 switch, giving these ten entries:
     `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46,bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396,c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7,55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec,cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c,d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc,f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9,76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684,264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14,b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd`
   - Change nothing else and read no variable. Then do **one redeploy**.
4. **Read back, GET only.**
   - The boot log names `6057f04e…` as the volume blob and `/app/server.js`, and the banner starts
     "server v5.94 — THE DELIVERY FIELD GUARD".
   - `/health` shows `build: v5.94`, `delivery_field_guard_version: 1`, `lock_declarations_version: 1`,
     `crew_groups_version: 1`, `record_recovered: null` and `tracker_refusing: null`, with the version, files and cards
     as before.
   - Run v5.93's `readback.py` against the backup, with its two hash constants updated. It checks that the page is byte
     for byte, the state version is the same with 0 documents differing (or legitimate new writes named), the cards are
     equal, the inventory keeps every blob, all tracker histories, signed links and configuration are equal, and
     `/api/ticks` without a key gives 401.
   - New checks: `/api/admin/snapshots` with the edit key lists `records-*` only, and gives 401 without a key.
   - Write no test documents to the live record: the guard is proven on local servers.
5. **Record it.** Put the STATUS.md LIVE entry and the PR #1 report in place, rename this folder to `_LIVE`, and then
   read the snapshot as described above.

**Rollback:** set `SERVER_FILE` = `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46` (v5.93) and do one
redeploy, leaving the keep list as set. v5.93 reads the same `records.json` with no recovery (check 61). It simply
stops guarding, and the snapshot read goes away.

## Files

| File | What it is |
|---|---|
| `server.js` | v5.94, `6057f04e…` |
| `patch_server_v594.py` | the patch, run on the exact v5.93 bytes |
| `guard594.js` | the guard source |
| `snap594.js` | the snapshot read source |
| `test_field_guard.cjs` | the 65 focused checks |
| `run_legacy.py` | the 205 retained checks plus v5.93's 50 |
| `validation.json` | hashes and results |

The edit key is never printed, logged or stored.
