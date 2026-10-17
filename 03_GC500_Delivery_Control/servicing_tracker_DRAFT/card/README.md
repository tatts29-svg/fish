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
| `mock_server.js` | a local, in-memory stand-in for the service built to the API contract (127.0.0.1 only, made-up tokens). It serves the card under the CSP read word for word out of the live `server.js` v5.87. `node mock_server.js --demo` prints a view link and four completion links |
| `test_card.cjs` | Playwright tests, two phone contexts: `node test_card.cjs`. Results in `test_card_results.txt`, phone screenshots in `evidence/` |

## How the card works

- **Completion QR** `/d/<token>#r=REF.sig`: the reference big, its area, how many units, each completion line ("2 × Toilet block
  6 m", "2 × Waste tank") with its asset numbers, Navigate to the pin (or "No pin on the record · ask on site"), then that day's
  jobs as big buttons in Andrew's words from the data (`tasks`, `plans`). A tap shows "Done 02:14"; tapping a done job asks
  before it undoes. Only that reference can be ticked; the service checks the signature (a wrong one is refused and the card says so).
- **No code** (or a code with no signature): every area read only, with percentages and finish times, and a day chooser.
- **Percentages**: a job is one task on one line, weighed by the line's units (WC07's 20 FWF weigh 20); rounded down, so 759 of
  760 shows 99%. The sticky header shows this area's % and everything's % after every tap, and "Area finished hh:mm" (its last job).
  On the current data: 760 jobs a night, 777 on Sunday.
- **Day**: 08:00 to 08:00 Gold Coast time from the service's clock (`now` on every read). Before the event it opens on Friday;
  Thursday is "if needed". It moves on at 08:00 by itself and says so, offering "Stay on <day>" to a phone that ticked in the last
  hour. A day picked by hand shows a loud banner naming it and lapses at the next 08:00. A day not started yet can be looked at,
  not ticked.
- **No signal**: taps go to an outbox on the phone (`gc500.svc1063.<token>.*` keys only) and show "waiting for signal"; each tick
  has its own id, so a resend is never counted twice. An untick names the tick ids it cancels, so a late untick never wipes
  another phone's newer tick. Reads every 15 s while the page is visible, and on signal back, focus and a new scan (hashchange).
  The epoch changing (a recovery or a void) makes it read everything again and resend anything the service lost.
- **Refusals**: 400/403/409/413 drop that one tick with a plain message and send the rest; 429 waits for Retry-After; a JSON 404
  `withdrawn` (and any 404 not marked `no_tracker`) or a 410 stops it for good, keeping unsent ticks on the phone; `no_tracker`
  or an HTML 404 (an older service) waits and tries again at 60 s; `507 full` and `503 no_key` say "ring" and retry slowly.

## Beyond the written contract (matched to the v5.89 server draft of 18 Oct)

Unknown token: JSON 404 `code:'withdrawn'` (counted). Card with no tracker: 404 `code:'no_tracker'` (not counted). A refusal
names the tick (`index`, `id`). GET pages with `more:true` and `seq` = the last tick sent; it also carries `updated` (a change
since the card loaded shows "Reload"). An "already" for a voided tick carries `voided:true`. Voided ticks are left out of GET and
the epoch changes. The mock does the same.

The mock's edit-link answers now match the live v5.89 server. They were aligned on 18 Oct after the end-to-end run on the
real server (`../integration/`), so page v10.63 can be tested on the mock and still work live:
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

- The main page (v10.63) posts this HTML with `tracker_config.json` and prints the sheets; it passes the TEAM lead as
  `--contact-name/--contact-phone` (or the card says "the project manager whose name is on your paperwork").
- Nothing here has touched the live service. Deploy and the page release wait for Andrew's "Upload".
