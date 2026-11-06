# Servicing tracker: the crew card (DRAFT, not live)

Author: Andrew Fisher · 18 Oct 2026

Andrew, 18 Oct 2026: "purely just a track" · "There is a compmetion qr code for their refernece. They scan. It whe all done.
And click tap. This only alows them to complete the refernce qr code. Must shows percentage complete for the area. And again
for everything" · "Just times" · "each refernce needs to have 3 ticks ... Waste tanks is only a pump out ... Sunday night will
need a extra. locked and confirmed empty. No water will be needed".

The page a crew's phone opens from a printed QR code. It is the drop card's `html`, served at `/d/<token>` under the card
Content-Security-Policy. Nothing on it ticks the job record, changes a delivery state or a charge, and no names exist on it.

## Files

| file | what it is |
|---|---|
| `build_card.js` | the generator: `node build_card.js` turns `../tracker_data.json` into `card.html` and `tracker_config.json` (the `tracker` block of the card body). Options `--data`, `--out`, `--contact-name`, `--contact-phone`. Also a module: `buildCardHtml(data, {contact})`, `trackerConfig(data)` |
| `card_src.js`, `card.css` | the card's one script and its styles (the generator writes the data into the script with every `<` escaped) |
| `card.html`, `tracker_config.json` | what the generator made from the current data |
| `mock_server.js` | a local, in-memory stand-in for the service built to the API contract (127.0.0.1 only, made-up tokens). It reads the base card CSP from the v5.89 draft and adds the tracker-only worker policy; the separate real-server test checks the final v5.90 policy and bytes. `node mock_server.js --demo` prints a view link and four completion links |
| `test_card.cjs` | Playwright tests, two phone contexts: `node test_card.cjs`. Results in `test_card_results.txt`, phone screenshots in `evidence/` |

## How the card works

- **Completion QR** `/d/<token>#r=REF.sig`: the reference big, its area, how many units, each completion line ("2 × Toilet block
  6 m", "2 × Waste tank") with its asset numbers, Navigate to the pin (or "No pin on the record · ask on site"), then that day's
  jobs as big buttons in Andrew's words from the data (`tasks`, `plans`). A tap shows "Done 02:14"; tapping a done job asks
  before it undoes. Only that reference can be ticked; the service checks the signature (a wrong one is refused and the card says so).
- **No code** (or a code with no signature): every area read only, with percentages and finish times, and a day chooser.
- **Percentages**: a job is one task on one line, weighed by the line's units (WC07's 20 FWF weigh 20); rounded down, so 759 of
  760 shows 99%. The compact sticky header shows this area's % and everything's % after every tap, and "Area finished hh:mm" (its last job).
  On the current data: 760 jobs a night, 777 on Sunday.
- **Day**: 08:00 to 08:00 Gold Coast time from the service's clock (`now` on every read). Before the event it opens on Friday;
  Thursday is "if needed". It moves on at 08:00 by itself and says so, offering "Stay on <day>" to a phone that ticked in the last
  hour. A past-day choice names its expiry and ends after two hours at most, or 30 minutes without a tap. Other manual choices lapse at the next 08:00. Recent taps are retained across new QR tabs, and a tap across the rollover first redraws the visible day instead of silently recording a different day. A day not started yet can be looked at,
  not ticked.
- **No signal**: taps go to an outbox on the phone (`gc500.svc1067.<token>.*` keys only) and show "waiting for signal"; each tick
  has its own id, so a resend is never counted twice. An untick names the tick ids it cancels, so a late untick never wipes
  another phone's newer tick. Reads every 15 s while the page is visible, and on signal back, focus and a new scan (hashchange).
  Each waiting and saved tick has its own immutable storage key, so one tab cannot overwrite another tab’s queue. The epoch changing (a recovery or a void) makes it read everything again and resend anything the service lost; dependencies send before their undo.
- **Refusals**: 400/403/409/413 drop a permanent refusal with a plain message and send the rest; `400 job_cap` retains the tick and retries slowly; 429 waits for Retry-After; a JSON 404
  `withdrawn` (and any 404 not marked `no_tracker`) or a 410 stops it for good, keeping unsent ticks on the phone; `no_tracker`
  or an HTML 404 (an older service) waits and tries again at 60 s; `507 full` and `503 no_key` say "ring" and retry slowly.

## Beyond the written contract (matched to the v5.89 server draft of 18 Oct)

Unknown token: JSON 404 `code:'withdrawn'` (counted). Card with no tracker: 404 `code:'no_tracker'` (not counted). A refusal
names the tick (`index`, `id`). GET pages with `more:true` and `seq` = the last tick sent; it also carries `updated` (a change
since the card loaded shows "Reload"). An "already" for a voided tick carries `voided:true`. Voided ticks are left out of GET and
the epoch changes. The mock does the same.

The mock's edit-link answers now match the live v5.89 server. They were aligned on 18 Oct after the end-to-end run on the
real server (`../integration/`), so page v10.67 can be tested on the mock and still work live:
- `GET /api/ticks?token=` carries `tracker`, not `config`; voided ticks are marked `voided: true`; voids are listed apart in
  `voids: [{vid, ids, at}]`. Without a token it gives `{now, service_day, trackers}`; an unknown token gives 404 `no_tracker`.
- `POST /api/ticks/void` answers `{voided: [ids], already: [ids], epoch}`; an id that is not a tick gives 400 `unknown_ids`.
- `POST /api/cards` returns the tracker block `{links, refs, lines, days, key_new}`.
- The codes are 400 `bad_tracker`, 409 `tracker_exists` (with the live token) and 409 `tracker_required`.
- `DELETE` answers `{withdrawn: token}`.

## Checks (18 Oct 2026)

`node test_card.cjs`: 158 passed, 0 failed (about 45 s), on the data with Andrew's final job rules. Covers the generated card
(one bare script, no handlers, only Google Maps links, data escaped), the mock against the contract, the day rules and server
clock, two phones ticking with area and overall percentages by units, the signature limit, undo, offline and back, an offline
untick against another phone's later tick, a lost reply, a dropped tick, recovery and void, 429, 503, Sunday, 08:00 change-over
and lapse, the trailing slash, storage keys, CSP violations (none), requests (none leave 127.0.0.1), hostile text, paging,
withdrawn/finished/older service on fake timers, and 360 px light and dark with no sideways scroll.

## Still to do

- The main page (v10.67) posts this HTML with `tracker_config.json` and prints the sheets; it passes the TEAM lead as
  `--contact-name/--contact-phone` (or the card says "Contact the Coates events project manager on site").
- Nothing here has touched the live service. Andrew has authorized the handover takeover; root owns the guarded server/page release after the final integration gates and exact read-back.

## Reliability fixes for page v10.67 (18 Oct 2026, draft)

- `card_src.js` and the panel embed exactly the same `panel_mockup/state.js`; task progress shows weighted done/total jobs for each area, as well as overall percentages.
- Only a compact status/day/percentage strip stays sticky. Alerts, day choices and full totals scroll in the page, so multiple refusals cannot cover the job buttons.
- Last confirmed tick snapshots and the service-clock offset stay on this phone. A fresh offline scan shows **Saved copy** with its time, not Live; without a prior service clock, ticking is disabled until a read succeeds.
- `tracker_sw.js` caches only the exact `/d/<token>` HTML, with or without its trailing slash. It never handles the tick API, any write, another token, or the main page. A 404/410 removes the cached card. The v5.90 server serves this worker with token-specific scope and permits it only on tracker cards.
- Open a sheet once with signal and wait for **Ready for offline scans** before relying on fresh offline scans on that phone. The worker must acknowledge a saved card before that message appears. A first-ever offline scan cannot work; storage/browser restrictions are reported honestly.
- Stored events use `gc500.svc1067.<token>.ob.<id>` / `sent.<id>`. Snapshot keys are immutable; a stale tab cannot overwrite a newer confirmed snapshot. An undo is always explicit because a second tab may already be sending its target.

New local-only regression sources: `test_reliability.cjs` (VM storage/time/state), `test_offline_tabs.cjs` (fresh offline scan, two real tabs, 08:00 and 360 × 640 header). Browser validation and real-server integration are release gates, not implied by the earlier v5.89 results above. No live tracker or operational record has been created by this work.

## Source freeze and verification (18 Oct 2026)

Author: Andrew Fisher. Production card SHA-256 `953233d43de21949f5a7704ee19c973c94b9864a789c86aef9f6d90437a85842` (85,771 bytes), script CSP pin `sha256-FH7yTunzdga9W3zQlEGG4smavLW5vYWlvt9ojHhil9Y=`. The accompanying v5.90 crew GET adds `card_script_hash` using the same exact stored-script function that supplies the response CSP. The card compares this with a digest of its own executed script. An old offline shell therefore cannot silently keep old quantities, tasks, contact data or code after reconnecting. A mismatch disables ticks and asks for Reload; a received identity with a still-pending digest also disables ticks until verified. The cached timestamp is dated explicitly.

Completed local checks: `test_reliability.cjs` 18/18; `test_worker.cjs` 14/14 (including Cache Storage quota/access failure); final `test_offline_tabs.cjs` 18/18 (fresh offline tabs, two-tab persistence, small-phone header, same-day/same-timestamp quantity upgrade, pending digest). No page errors or CSP violations. The 360 × 640 screenshot `evidence/card_compact_late_360.png` was inspected: the sticky strip stays compact and the jobs scroll clear of it. The full card suite was repeated on this exact final source: 158/158 passed in 42 seconds. A separate byte-for-byte comparison confirmed that the current generator produces the frozen `card.html` exactly.

`test_server_protocol.cjs` passed 23/23 against exact v5.90 source SHA-256 `fb69c73d65b1cc5d206f902d6be226a08b463e6d86abbe7b38292be5d3798524` (289,048 bytes). This focused integration uses a throw-away local data directory, fake tokens, two synthetic references, and no remote requests. It verified crew/admin cursors, exact HTML/script/worker bytes, cached reopening, queued taps across tabs after one closes, same-token HTML changes and safe stale-card reload, weighted totals and an unchanged job-record file. There were no remote browser requests, script errors or CSP violations. Machine-readable evidence is in `evidence/card_real_server_protocol.json` and `evidence/card_final_validation.json`. The main-page administrative flow has a separate owner/test. Real iPhone/Android camera scanning, private browsing persistence and carrier-network operation are not claimed by local Chromium results.

## Release order verified on 18 Oct 2026

The unchanged final card `953233d4…` passed 23 local browser/protocol checks against exact server v5.90 `55a19453…`. `test_v589_compatibility.cjs` separately passed 14 checks on unchanged v5.89 `cb32d00e…`: online ticks and an already-open tab’s offline queue still work, while fresh offline QR scans do not. The card honestly says offline scans are not ready. v5.89 also lacks the new exact script identity, so it cannot provide the same stale-card protection. Switch the server first, verify it, then publish the new card and page. No real-phone or live-record tests are claimed.
