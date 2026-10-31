# Servicing tracker: review findings and open items (18 Oct 2026)

Author: Andrew Fisher · collected by Claude from the tracker build workflow, for Codex to finish. Raw JSON per agent: the reviews below are verbatim.

## Builder: server_v5.89_servicing_tracker_DRAFT

Open items:

1. **STATUS.md claim not made.** Server v5.89 still has to be claimed there; I was told not to edit outside my folder. Codex's v5.88 claim from 2 Oct is still on the board with no files.
2. **Deploying needs Andrew's "Upload"**, before Thu 22 Oct 08:00. The README has the steps: pre-flight read-only checks, stage blob 8f66feba…, then one Railway change (SERVER_FILE=8f66feba…, SERVER_FILE_KEEP gains d5a0d777…). Then the page v10.63 on its own Upload, then a TEST tracker with its ticks voided afterwards, then the real tracker.
3. **Not checked:** the live Railway variables, the start command's literal text and the Node version actually running were not read.
4. **Contract mismatch.** The contract allows 1 to 20 ticks per POST but also a 2 KB body. Only about 10 full-size ticks fit in 2 KB. The card already batches under 1,900 bytes, so it works; the "20" is only reachable with short ticks.
5. **One refinement for the card owner.** When a POST answer has saved[i].voided === true, the card should not add that tick to its acked list. Today it shows as done briefly until the next read clears it.
6. **The view link sees nothing of the tracker**, because /api/ticks is edit-link only as the contract says. If the main page should show progress on the view link too, that needs either Andrew's word to open a nameless view or the page reading /d/<token>/ticks.
7. **While rolled back to v5.87**, nobody should re-post the tracker card (v5.87 drops the tracker field). v5.87 would also accept a report posted on the tracker card. Both are noted in the README.
8. **The review's page and card items** (escaping, the progress panel surviving the run sheet's redraw, sending contact as phone not mobile, the twin-steer wording on print) belong to page v10.63 and the card, not this server.

## Builder: servicing_tracker_DRAFT/card

Open items:

1. **Contact on the card:** the TEAM lead's name and phone aren't in tracker_data.json. The main-page part should pass them to the generator with `--contact-name` / `--contact-phone`. Without them the card says "ring the project manager whose name is on your paperwork".
2. **Questions for Andrew (from the review, not answered yet):**
   - Should a phone that is still finishing at 08:00 get the "Stay on <day>" offer? I offer it only to phones that ticked in the last hour.
   - Are servicing sheets exempt from printing the twin-steer short form? That is for the sheets part, not the card.
3. **Storage key prefix** `gc500.svc1063.` assumes the page release is numbered v10.63, as in the 18 Oct design. It will need changing if that number changes.
4. **Tests only on the mock:** the card has not been run against the real v5.89 server draft. That should be done once the draft is READY.

## Builder: servicing_tracker_DRAFT/panel_mockup

Open items:

1. Andrew's yes on the layout: the panel at the top of Event nights, and the fold as a table rather than chips.
2. View link: the v5.89 draft answers /api/ticks with 403 there, so the panel would show on the edit link only unless Andrew wants it on the view link too.
3. Not yet word for word: the card still uses its own copy of the rule. It gives identical answers (proven by test_state.cjs), but card/build_card.js should paste state.js in unchanged before release. That file is outside my folder, so I didn't change it.

## Builder: servicing_tracker_DRAFT/print

Open items:

For Andrew:
1. **T0024:** your workbook has it in area 1 with no pin, but the master plan draws it in the Main Beach SUPPLY compound, about 360 m from the pit lane. Its sheet and the area 1 cover show that spot. Please check on site.
2. **Seven locations have no pin and no place on the plan:** SPARE 0164, the Teams Area five (BJR01, SVP01, T0162, T0176, WC85) and WC100. Their sheets say "No pin" / "ask on site".
3. **Location QR for plan-only locations:** PG01, PG03, PG05, PG29 and T0024 have a place on the plan but no pin, so they get no location QR. Coordinates could be worked out from the plan's map registration, but that isn't the record's pin, so it's your call.
4. **WC81:** by the pins it is about 1.6 km from the rest of area 11. The earlier README said 1.4 km.

Still to do before printing for real:
- The live pack can only be made once server v5.89 is deployed and the tracker card exists on the edit link. Save its token and links to a private file outside the repo and run `make_sheets.py --links <private file> --out <outside the repo>`.
- Print one sheet and scan it with an iPhone and an Android, checking the #r= part survives and opens that reference, before laminating. Not done here.
- Whoever records this on STATUS.md should note the size: about 22 MB of PDF and 17 MB of maps going into the repo.

## Builder: servicing_tracker_DRAFT/integration

Open items:

1. **Nothing committed.** STATUS.md is not updated, as it is outside the part folders. Whoever records this should name the new `integration/` folder and the mock change.
2. **Page v10.63 must read the live `/api/ticks` shape:** `tracker`, `ticks` with `voided`, and `voids`. It must also re-post on 409 `tracker_exists` using the returned token. The written contract's word `config` is wrong for live.
3. **Not tested here:** real phones (iPhone and Android) scanning a laminated sheet, and checking that the `#r=` part survives the scanner app. Also untested: real carrier networks with shared addresses, iOS Safari, and the paging path for more than 2,000 ticks on the real server (tested on the mock only).
4. **Still Andrew's call (carried over):** whether the view link should see tracker progress (`/api/ticks` is edit-link only), and the contact name and phone for the card. That contact is not in `tracker_data.json`, so the card says "ring the Coates events project manager whose name is on your paperwork".

## Review

Not ready for crews yet. Every one of Andrew's quoted requirements is met on paper and on screen:
- reference and how many, asset numbers, completion lines with their own descriptions;
- the job wording, waste tanks pump-out only, blocks pump-out and clean, and Sunday adding "Locked & confirmed empty" with no water;
- a completion QR per reference that only ticks that reference;
- a location QR, a map crop with a circle, and a master map with the areas;
- area % and overall %, times only and no names.

The crew's experience at night is where it falls short. I found three major problems, all reproduced on the real v5.89 server, run locally with fake tokens:
1. **Offline only works in a page that is already open.** The card is served `no-store` and has nothing that keeps it on the phone. Scanning a sheet with no signal opens nothing, yet the printed sheets promise "No signal? Taps wait on the phone". The integration test never loads the page fresh for a scan: it changes the address in a tab that is already open.
2. **A second open tab can wipe a queued tick.** Two open tabs each keep their own list of unsent ticks and overwrite each other's copy on the phone. A tap left waiting for signal in one tab is lost for good. It was lost in 3 of my 4 runs.
3. **The fixed header covers the jobs.** It takes 45% of a 360×640 screen normally and 71% after the 08:00 changeover. With three "Not saved" messages it is 742 px on a 640 px screen and the job buttons cannot be reached.

There are also four minor problems: no name to ring on the sheets, "Stay on Friday" lasting 24 hours, an area % that mixes the three crews' jobs, and the main-page panel's % sitting beside a units count that does not match it.

The probe scripts are in /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/review_crew/ (probe_offline.cjs, probe_header.cjs, probe_notices.cjs), with screenshots in shots/. Nothing in the repo was changed and nothing live was called.

### Scanning a sheet with no signal opens nothing, though the sheets promise taps wait on the phone (major)
- Where: server_v5.89_servicing_tracker_DRAFT/server.js:3125 ('Cache-Control': 'no-store' on the tracker card); servicing_tracker_DRAFT/print/make_sheets.py:522; integration/test_integration.cjs:187
- Why: Every completion QR is a fresh page load of /d/<token>#r=REF.sig: one QR per reference, and camera apps usually open each link in a new tab. The server sends the card with 'Cache-Control: no-store' (server.js line 3125), and the card has no service worker or manifest (card.html: 0 matches). So a scan made in a dead spot cannot open the card at all.

Measured on the local v5.89 server: card page Cache-Control is no-store. Phone online, WC06 opened, signal off, then WC09's QR scanned in a new tab gives net::ERR_INTERNET_DISCONNECTED (probe_offline.cjs, step 1).

The outbox only helps inside a tab that is already open. Yet the area cover tells crews 'No signal? Taps wait on the phone and send when signal is back' (make_sheets.py line 522), and the card header says the same.

The tests that pass 'offline' do not load a fresh page for a scan. test_integration.cjs line 187 and test_card.cjs lines 256/285/361 'scan' by setting location.hash in a tab already open, which is not what a camera does.

Even where a cached copy did open, the card stores no last-known ticks. An offline open would show every job undone, so a crew could re-do work another crew already ticked.
- Fix: 1. For tracker cards only, serve /d/<token> with 'Cache-Control: private, max-age=86400' plus an ETag. The QRs differ only after the #, so every reference's scan hits the same cached page once the phone has opened any sheet with signal. The page holds no token or secret. The existing 'Reload' banner covers a re-posted card, and location.reload() revalidates.
2. Keep the last known ticks list (gc500.svc1063.<t>.known, a few KB) in localStorage and draw from it until the first read.
3. Add a test that loads the page fresh (new page, ctx offline) after one online open, and one that opens it with no prior visit. For the no-prior-visit case, word the sheet honestly: 'Open any sheet once with signal at the start of the night; after that scans work without signal and taps send later.'

### Two open tabs overwrite each other's waiting ticks: a tap queued without signal is silently lost (major)
- Where: servicing_tracker_DRAFT/card/card_src.js:109-110, 132-136, 348-349, 362-365
- Why: Each tab reads the outbox from localStorage once at start (card_src.js line 109), then writes its own in-memory copy over the stored one on every tap or send (lines 132, 349). Nothing re-reads or merges the stored copy, and there is no 'storage' listener.

Crews will build up several tabs over a night, one per scan. Reproduced on the real v5.89 server (probe_offline.cjs):
- tabs A (WC06) and B (WC07) are open, then signal drops;
- tap WC07 Pumped out in B: the stored outbox is ['WC07 pump'];
- tap WC06 Pumped out in A: the stored outbox is ['WC06 pump'], so B's tick is gone from the phone's storage;
- B is closed or dropped by the phone; signal returns and A sends;
- the server holds only WC06, and a fresh WC07 scan shows 'Tap when done'.

The tick was lost in 3 of 4 runs. The one survivor was a timing race in the test rig. B had shown 'No signal · 1 tick waiting', so the crew believed it was safe. This breaks the card's own promise that 'no signal never loses a tap'. The same overwrite applies to the 'sent' list used for epoch recovery.
- Fix: 1. Before every write, merge: outbox = union by id of load('outbox') and this tab's outbox, minus ids this tab has seen saved (acked or sent). Do the same for 'sent'.
2. Listen for the 'storage' event to pull in other tabs' queued ticks, so any visible tab sends them.
3. Optionally use a BroadcastChannel so a newly opened tab takes over sending.
4. Add a two-tab offline test: tick in B, then in A, close B, reconnect; the server must hold both.

### The fixed header takes most of a small phone at night and can hide the job buttons completely (major)
- Where: servicing_tracker_DRAFT/card/card.html:143-149; card/card.css:27; card/card_src.js:415-429 (bannersHtml), 428 (one banner per notice)
- Why: All of these sit inside the position:sticky header (card.html lines 143-149, card.css line 27): the 08:00 'Now Saturday's service' banner, the red 'You are on Friday's service' banner, each 'Not saved' message (one per refused tick), the being-updated, no-key and full banners, the day chooser, the time window, and both % bars.

Measured at 360×640 on the real server:
- plain tick view: header 290 px (45%);
- after 08:00 with 'Stay on Friday', or with the red banner: 457 px (71%), leaving 183 px for the jobs (shots/stay_360x640.png);
- with three 'Not saved' messages: header 742 px on a 640 px screen; after scrolling 400 px, the spot at (180,600) is still header (shots/notices_360x640.png).

In that last state the job buttons, and even the area/Everything % at the foot of the header, cannot be seen until each message is dismissed. A swapped or misprinted sheet makes three messages from three taps.
- Fix: 1. Keep only one line sticky: status plus area % and Everything %, about 90 px.
2. Move the day chooser, the window line and all banners into the normal page flow above the reference card.
3. Collapse notices into one banner, e.g. '3 ticks not saved: WC06 Pumped out, Fresh water refilled, Cleaned & restocked (wrong code for WC06)', with a single OK.
4. As a guard, drop position:sticky when the header is taller than about 35% of innerHeight.
5. Add a 360×640 test that the first job button is fully visible below the header with a pick banner and three notices showing.

### 'Ring the project manager whose name is on your paperwork', but the sheets name no one (minor)
- Where: servicing_tracker_DRAFT/print/make_sheets.py (no contact on any page); card/card_src.js:392-396
- Why: Without a contact the card and server fall back to 'Ring the Coates events project manager whose name is on your paperwork' (card_src.js line 395; card.html footer; server.js /d/ 404 and 410 pages). It is the only instruction when ticks are stuck: withdrawn, finished, service full, or codes cannot be checked.

The crews' paperwork is the laminated pack, and make_sheets.py has no contact, phone or name anywhere (grep for contact|phone|ring finds none). The crews may be Event Portables' people (AGENTS.md: 'They also service the coates toilets'), who would not know a Coates project manager. The card README already lists the missing contact as open, but the print pack has no slot for it either.
- Fix: Take one contact (name and mobile, from Andrew) in both generators:
- make_sheets.py --contact-name/--contact-phone, printed on every page footer and each area cover;
- the same values to build_card.js --contact-name/--contact-phone, sent to the server as {name, phone}.
Until then, change the fallback wording so it does not point at paper that says nothing.

### 'Stay on Friday' after 08:00 holds the phone on Friday for 24 hours, and the screen says 'Closed' while jobs still tick (minor)
- Where: servicing_tracker_DRAFT/card/card_src.js:159, 423, 439, 533
- Why: After 08:00 the grace button sets pick = {day: Friday, at: svcDay(now)}, and svcDay(now) is already Saturday (card_src.js line 533). The pick lapses only when svcDay changes (line 159), so at Sunday 08:00. If the same tab is used again that evening (a hash scan in an open tab keeps the pick), Saturday night's ticks land on Friday and Saturday's areas stay at 0%.

The red banner says 'This choice ends at 08:00', which reads as a moment ago. On the same screen the window line says 'Closed Sat 24 08:00' (line 439) while the jobs show 'Tap when done' and still tick (shots/stay_360x640.png).
- Fix: 1. Make a grace 'Stay' (and any pick of a past day) lapse after 2 hours or at the first 30 minutes without a tap, whichever comes first, and name the time: 'This choice ends 10:00 Sat'.
2. While a past day is picked, change the window line to 'Late ticks for Fri 23's service' instead of 'Closed'.
3. Test it: Stay at Sat 08:05, step the clock to Sat 20:00, and the card is back on Saturday.

### Area % mixes the three jobs, so each crew cannot see its own progress (minor)
- Where: servicing_tracker_DRAFT/card/card_src.js:99-103, 442-445 (progHtml), 505
- Why: Andrew: 'these could be 3 different job'. The header bar is done jobs over all jobs for the area (groupStats). A pump-out crew that has done every pump-out in area 5 sees 33% (22 of 66 jobs: 22 FWF × 3 tasks) and never sees 'Area finished'. Nothing on the card says how many pump-outs, refills or cleans are left in the area. The only way is to open 'Show every area' and read the chips reference by reference.
- Fix: Under the area bar, add one compact line per job in Andrew's words for that day's plan, e.g. 'Pumped out 22/22 · Fresh water refilled 0/20 · Cleaned & restocked 0/22', weighted by units like the %. Keep the overall % as it is.

### The main-page panel puts '61%' next to '104 of 263 units', and calls references 'locations', unlike the phone (minor)
- Where: servicing_tracker_DRAFT/panel_mockup/panel_render.js:77; panel_mockup/state.js:80-99
- Why: The panel's headline shows % = done jobs / all jobs, but beside it shows unitsDone, meaning units whose every job is done (state.js lines 80-99; panel_render.js line 77). shoot_results.txt line 6: '61%, 104 of 263 units, 31 of 75 locations'. Andrew would read 61% next to 104/263 (40%) as a wrong figure.

The crew card shows the same day as '…% · 31 of 75 references · n of 760 jobs'. So the main page and the phones use different nouns (locations and units against references and jobs) and different counts for one result. Andrew's word for what is ticked is 'reference'.
- Fix: Show the same figures as the card beside the %: 'x of 75 references · d of 760 jobs'. If units stay, label them 'units fully serviced' on a second line. Use 'reference' on both the panel and the card.

## Review

Safe for the record, but the tracker itself can be knocked out by anyone holding a few of the laminated sheets. I reviewed the server bytes that are on disk and live: server.js cb32d00e…, 283,062 bytes, LIVE since 18 Oct 07:35. These are not the 8f66feba… bytes named in the brief. I read the patch, the card, the panel and the print guards, and ran local probes only: 127.0.0.1, fake tokens, throw-away DATA_DIRs, nothing live. The probe scripts are in /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/sec589/.

What holds up:
- Nothing in the tracker reads or writes the record, a delivery state or a charge.
- The HMAC signatures are sound: 96 bits, compared timing-safe, one key per tracker, never in a URL or a log.
- The secret never leaves the service: not to a phone, not into any listing, writes.log or cards.json, and no route serves the snapshots.
- Stored tick fields are all checked against fixed patterns or the tracker list. The card and the panel escape everything they show, and the card's one script is pinned by its hash.
- Card tokens are now looked up as own properties on every route.
- Rollback to v5.87 is clean.

Problems found:
- Two major ones are flooding from photographed sheets, both shown locally. A few areas' codes can stop every crew phone saving for up to an hour at a time. And void, the README's remedy for a flood, frees no store space, so three floods fill the store for good.
- Two minor ones: a silent new key when the stored key is lost, and an unbounded listing the edit page polls every 20 s.

### A few areas' completion codes can stop every crew phone saving for up to an hour, again every hour (major)
- Where: server_v5.89_servicing_tracker_DRAFT/server.js:290 (TRACK_LIMITS.postTracker 1,200 an hour), :599 and :666 (checked and spent per tracker); servicing_tracker_DRAFT/card/card_src.js:268 (the card waits at most 600 s between retries)
- Why: The 1,200-an-hour allowance is shared by the whole tracker. Every POST that saves at least one signed new tick spends one, whichever reference it is for.

Local probe (probe_hour.js), Friday 23 Oct 22:00 server time:
- I used only the codes on the area 1, 2, 5 and 6 sheets (22 references) and sent one tick per POST.
- POSTs 1 to 1,200 were saved. POST 1,201 got 429.
- A real tick for WC81, in another area and from another address, then got 429 slow_down with Retry-After 3599.

How far it reaches:
- On Sunday night area 12's sheets alone hold 1,404 untaken jobs at the per-job cap. Any two areas exceed 1,200.
- From one address (60 POSTs a minute) the 1,200 take 20 minutes, leaving about 40 minutes locked.
- The whole pack holds 11,208, so this can repeat for about 9 hours without any void.

What crews see: phones keep their ticks (429 is retried), but nothing saves and every area % stays frozen for all crews. test_tracker 80b treats this as intended. The 18 Oct review's "a few hundred an hour per token" did not foresee a holder of some of the sheets spending it.
- Fix: - Key the hourly allowance by token + reference, since that is what a code authorises. For example, 60 new-tick POSTs an hour per reference is far above any real crew's need.
- Keep a tracker-wide ceiling only as a backstop above the whole per-job-cap budget (at least 11,208 ticks), or count it in ticks against that budget.
- Add a test that one area's codes can never 429 another area's phones.

### Voided ticks still count against the 25,000 store cap: three floods fill it for good, and the first already loses real taps (major)
- Where: server.js:285 (TRACK_MAX_EVENTS, shared by every tracker), :407 (track.events counts every tick), :400 (a void frees only the per-job count), :653-654 (job_cap and full checks); card_src.js:309 (a 400 is dropped)
- Why: Local probe (probe_cap.js, probe_cap3b.js, probe_cap4.js), Sunday 25 Oct, the full pack's 75 codes:

1. **Flood 1.** 882 POSTs saved 11,208 ticks, inside every limit. Every job on every open day is now at the per-job cap of 12. A real crew tick gets 400 job_cap, and the card drops it as "Not saved".
2. **Void.** The editor voids all 11,208, as the README says to. The per-job room comes back, but /health tracker_ticks stays at 11,208.
3. **Flood 2**, an hour later: 22,416.
4. **Flood 3**: the store reaches 25,000, of which 24,994 are voided. The next real crew tick gets 507 full.
5. **No way back.** A restart changes nothing. The counter is shared, so a brand-new TEST tracker is refused as well. Only a server change clears it.

This is the 18 Oct review's blocker (store full, no way to clear it, reprint mid-event) back in a slower form. It costs space too: every snapshot then carries the voided flood, about 6.3 MB each, with up to 48 kept on the record's volume (the 26 Sep audit found 5 GB with about 1 GB used).
- Fix: - Count only unvoided ticks against the cap: decrement on void, and keep a separate, much higher line or byte ceiling for the file, for example 100,000 lines.
- Give each tracker its own share, so a TEST tracker can never use the real one's room.
- In the card, treat 400 job_cap like 507 full: keep the tick and retry slowly, so a flood never loses a real tap.
- Consider a void by reference or time window and an un-void on the edit link. The ticks carry no names, so the editor cannot tell flood ticks from real ones.

### If the tracker's key is lost, "Update the tracker" quietly makes a new one, and every laminated code stops working (minor)
- Where: server.js:3359-3366 (POST /api/cards makes a key whenever none is held, even for a card that already has a tracker); the store is not in /api/export
- Why: Local probe (probe_rekey.js):
- I made the tracker; the printed WC07 code ticks (200).
- I then removed tracker_ticks.jsonl and the ticks-* snapshots, as happens on a fresh volume restored from /api/export, which does not carry the tick store or its key.
- A crew tick now gets 503 no_key, and the card keeps it.
- The editor re-posts with the same token: 200 with key_new:true and a different WC07 code.
- The laminated WC07 code now gets 403 bad_sig. The card drops 403 ticks as "Not saved: this QR code is not the one printed for that reference", so ticks that were safely waiting are lost and all 75 codes are dead until the sheets are reprinted.
- Fix: - When the posted token's card already has a tracker and no key is held, refuse with 409 key_lost unless the body says rekey:true. The page should warn that every sheet must be reprinted.
- Add an edit-link-only download of the tick store, key included, so it can be kept off the volume, or let a re-post restore a key from such a backup.

### GET /api/ticks?token= has no cursor: the edit page's 20-second poll pulls the whole store, voided ticks included, plus the 75 codes (minor)
- Where: server.js:679-696 (trackAdmin returns every tick and the links every time); panel_mockup/panel_render.js:82 and integration/test_integration.cjs:198 (the panel reads /api/ticks every 20 s)
- Why: Local probe (probe_size.js), after the flood above:
- GET /api/ticks?token= returned 5,287,514 bytes: 24,999 ticks, 24,994 of them voided, plus all 75 codes.
- Each answer took 78 ms of synchronous work on the service's single thread, which the record shares.
- GET /d/<t>/ticks?since=0 returned 1,205 bytes.

At one read every 20 s that is about 950 MB an hour per open edit tab on Andrew's phone, competing with the record sync. It is the same pattern the 18 Oct review flagged for /api/reports.
- Fix: - Add ?since= to /api/ticks, and leave voided ticks out unless asked for.
- Return links only when asked (?links=1, for printing).
- Have the v10.63 panel read incrementally.

## Review

Not ready on state and time, because of two major problems on the crew card. The server's state and time rules held up under every check I ran:
- the 08:00 service day from the server's clock;
- future days refused;
- idempotency by id;
- unticks that cancel only the ids they name;
- tapped_at clamped to arrival time;
- the epoch changing on a void and on recovery;
- the append-only store.

The panel's state.js and the card's copy agree, and rounding down is exact.

The problems are on the crew card (card_src.js), at the 08:00 change-over, with offline ticks across tabs, and with an untick that is waiting when the service recovers. I reproduced each one locally against the real v5.89 server (sha256 cb32d00e…) with fake_clock.js, throw-away DATA_DIRs and Playwright. Nothing live was called. The probes are in /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/review_state/: probe_0800.cjs, probe_tabs.cjs and probe_recovery.cjs. Every server I started was stopped by its own process id.

### Two tabs of the card on one phone overwrite each other's outbox: a tick shown as "Done · waiting for signal" is lost (major)
- Where: 03_GC500_Delivery_Control/servicing_tracker_DRAFT/card/card_src.js lines 109-110 (outbox and sent read from localStorage once, at load), 132 saveOutbox() and 135 keep('sent') (each tab writes its whole in-memory array), 283 and 303 (written on every pump attempt and answer)
- Why: Each QR scan opens a fresh page, so a crew phone soon has several tabs of the same card open. They share one localStorage key per token, and the last tab to write wins. Run with probe_tabs.cjs (server clock Fri 23 22:00, no signal on the ticks route):
1. Tab 1 ticks WC06 pump, and storage holds [WC06 pump].
2. Tab 2 opens WC07 (it got one read in while loading) and ticks WC07 pump. It shows "Done 22:00 · waiting for signal", and storage now holds [WC07 pump].
3. Tab 2 is closed, as a phone drops a background tab.
4. Signal comes back. Tab 1 sends its tick and then saves its own outbox, which is empty, so storage becomes [].
5. The service holds only WC06 pump. WC07 reopened reads "Tap when done" with an empty outbox, so the crew's tick is gone.
The same overwrite applies to the `sent` list, which is what recovery resends from.
- Fix: Store each waiting tick under its own key (gc500.svc1063.<token>.ob.<id>), and remove that key only when the tick is saved or refused. At load, and on the window 'storage' event, rebuild the outbox by scanning those keys. Do the same for `sent` (one key per id, pruned by age).
If the single array stays, merge on every write instead: re-read the stored array, take the union by id, drop only the ids this tab saved or refused, then write. Merge other tabs' additions in on 'storage' events.
Add a card test with two pages in one context and no signal: tick in each, close the second, restore signal, and both ticks must reach the server.

### "Stay on Friday" is never offered after a fresh scan: a phone that ticked Friday at 07:59 puts its next tick on Saturday, with no banner at all (major)
- Where: card_src.js line 142 (lastTapAt and lastTapDay are in memory only), 167-176 watchClock() (the first synced call only sets lastAuto and never raises `advance`), 350; card/README.md line 34 claims the offer goes to "a phone that ticked in the last hour"
- Why: The grace offer exists so that a crew finishing the night's last references just after 08:00 does not roll them into the next day (review problem 9). It works only inside one open page. A new QR scan is a new page, so the phone's earlier tick is forgotten.
probe_0800.cjs (server clock 24 Oct 07:59:22):
- Phone G ticks WC06 pump on Friday at 07:59:22 and closes the page.
- At 08:00:03 it opens WC07's QR in a new page. After one 5 s redraw it shows Saturday, with Stay offered: false and no banner at all (not even "Now Saturday's service").
- Its WC07 pump is stored as day 2026-10-24, tapped 08:00:09.
Control phone C did the same in one page and got "Now Saturday 24's service … Still finishing Friday 23's? Stay on Friday 23".
Result: Friday's area never reaches 100% or a finished time, and Saturday starts with false progress. That is exactly the area % Andrew asked for.
- Fix: On every tap, keep {day, at} in localStorage (gc500.svc1063.<token>.lastTap), or work it out from the newest tapped_at in sent and outbox. In watchClock's first synced call, if the stored day is earlier than autoDay(now()) and now() - at < 1 h, set advance = {from: stored day, to: auto, grace: true}, so the banner and the Stay button appear in the new page.
Add a test that ticks in page 1 at 07:59, opens page 2 at 08:01, and expects [data-stay] to be present.

### A tap in the seconds after 08:00 lands on the new day although the screen still shows the old one, and it cancels the grace offer (minor)
- Where: card_src.js 341-343 tapJob() and 353-359 undoJob() read the day as shownDay() at tap time; 350 sets lastTapDay to that day; 552 redraws only every 5 s
- Why: The screen is redrawn every 5 s, but a tap takes the day from the clock at the moment of the tap.
probe_0800.cjs, phone R:
- It ticks WC09 water on Friday at 07:59:57.5.
- At 08:00:00.301 the screen shows Friday pressed and "Open now · closes 08:00 Sat 24", and pump reads "Tap when done".
- The pump tap at 08:00:00.37 is stored as day 2026-10-24.
- Because lastTapDay became Saturday, the banner that follows has no "Stay on Friday", even though Friday's water was ticked 3 s earlier.
By the same code, two more things go wrong in that window:
- "Yes, undo" on a Friday job just after 08:00 finds no Saturday state, re-draws and does nothing, so Friday's tick stays.
- Tapping a job already done on Friday (to open its undo) makes a new Saturday tick instead.
- Fix: In render(), remember the day that was drawn (drawnDay). In tapJob() and undoJob(), call watchClock() first. If shownDay() !== drawnDay, redraw and ignore the tap: the advance banner then shows with its Stay offer. Alternatively apply the tap to drawnDay while dayOpen(drawnDay).
Also arm a setTimeout for the next 08:00 (dayStart of the next day minus now()) so the screen turns over on time instead of up to 5 s late.

### An untick waiting on a phone when the service recovers from a snapshot is refused and dropped; the lost tick is then resent, so the job comes back as done (minor)
- Where: card_src.js 261-267 reconcile() appends lost ticks to the END of the outbox (after any waiting untick that names them); 309-320 drops a refused untick for good; server.js 646-650 refuses an untick whose target is not held
- Why: probe_recovery.cjs (server clock Fri 23 22:00):
1. The phone ticks WC06 pump, and the server holds it (id ROnJPbo…).
2. The server stops and tracker_ticks.jsonl is lost.
3. The crew undoes the job while offline. The outbox holds [{done:false, undoes:[ROnJPbo…]}].
4. The server restarts and recovers from the 'made' snapshot (record_recovered: "is missing although snapshots of it exist"). The epoch changes.
5. The untick goes first and is refused 400 'undoes', and the card drops it. Reconcile then resends the lost tick from `sent`.
6. The server holds pump done:true, and the phone shows "Done 22:00" with the banner "Not saved: Undo of WC06 · 2 × FWF · Pumped out (Fri 23): an untick can only cancel a tick of the same job on the same day".
The crew's undo is lost, and the message is hard for a crew to act on.
- Fix: Card:
- In reconcile(), put each requeued tick ahead of any waiting untick that names it, in `sent` order.
- In the 400 handler, when the refused tick is an untick (code 'undoes') and its targets are in `sent` but not in `known`, requeue those targets ahead of it and retry rather than drop it.
Server, as an alternative: hold an untick whose target is not yet known as pending (the way pendingVoid holds a void) and apply it when the target arrives.
Add the probe's sequence as a card or integration test.

### Until the first read succeeds, the phone's own clock decides the day, opens or shuts the jobs, and dates the ticks (minor)
- Where: card_src.js 36-37 (offset 0 until noteServer runs), 56 dayOpen(), 157-160 shownDay(), 343 and 348 (day and tapped_at taken from now()); the comment at 168 and the README say the phone's clock never moves the day
- Why: If the first GET fails (a signal drop just after the page loads, or a 429 behind a shared carrier address), `synced` stays false and Date.now() is used as it is.
Seen in my first run of probe_tabs.cjs: a tab whose ticks route was blocked showed WC07's jobs disabled, "not open yet", while the service clock was Fri 23 22:00, because the phone's clock (17 Oct) ruled.
With a phone clock behind the server, the same path would enable and tick an earlier day, which the server accepts because past days are allowed. With a clock ahead, the tick is refused as future_day and dropped with a notice.
- Fix: Keep the last good offset in localStorage (gc500.svc1063.<token>.offset) and use it until a read answers. If there is none, draw the jobs disabled with "Waiting for the service clock", and have tapJob() return while !synced.
