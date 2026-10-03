# v8.16 — the reference drawer, simple first, and a Demob tab

Author: Andrew Fisher · Claude implemented and tested; Codex reviewed the source three times (88a716e, 6485fa9/0019508,
and the follow-up after 6a0bb20) and every finding is fixed below · 3 Oct 2026 (AEST)

**State: see "Release state" at the end.** Not uploaded and not committed by this work; nothing written to the live record.
The tests read the live record through `toolchain/harness/open_page.js`, which aborts every write; the editor checks
also stub the page's own push, so no write is even attempted.

## Build

```
bash toolchain/build.sh v8.16 v8.16_reference_and_demob_DRAFT/patch_v816.py
```

- Base: **live v8.15, `35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770`, 9,118,422 bytes** (Codex's
  Documents, live 3 Oct). The patch also applies cleanly on v8.14 `6365fd09…`, v8.13 `f07e92cc…` and the v8.14 frozen
  candidate `2595f1cd…` (all checked), so its anchors are clear of the six Today cards v8.14 removed. v8.15 changed none
  of the functions v8.16 reads (openAssetDraw, the photo outbox, setLight, mergeRecords, the Timeline, the tab row).
- Build: **`7ae89da4e80b070ade2977ef4e47ed3e766be6dc7722bd610e21ad78ddaa77d0`, 9,244,210 bytes**. check_page: every
  script parses, no keys (`pk.eyJ` 0, `AIza` 0), author line present.
- Tested source: `demob816_src.js` `3f18954e…`, `drawer816_src.js` `6f87a42c…`, `patch_v816.py` `9b173605…`, `v816.css`
  `cd316ad9…` - not yet committed when tested: the working tree on `1382e98`, where only `demob816_src.js` differs from `a57de005` (one legend sentence on the Demob board). Andrew commits.
- The patch refuses a second run (`v8.16 already applied`) and a page without its anchors (`function place799(`,
  `dest782`, `ZONES782`, `openAssetDraw`, `programmeDaysBefore801`, `dpPrint`). It touches none of v8.09's (the machine)
  anchors.
- Files: `patch_v816.py`, `drawer816_src.js`, `demob816_src.js`, `v816.css`, `evidence/`.

## What Andrew asked (3 Oct 2026, this job's chat)

- The drawer: "clean up the look when we open up the reference ... remove thing we don't need or hide it so it does not
  over crowd ... They go in to find simple data. If they want more data they can expand the area they want to see more of
  use additional animations in here"; "everything is pinned and has a reference location you know all this info I don't
  want to see areas not filled in it looks messy"; on the contract and costs: "people don't wanna see this this is more
  financial. General eyes don't wanna see costs"; on "What was asked for, and what we supplied": "remove or hide it";
  "this is area for reference to also know if its complete and complete it if needed. and see where it goes and see
  reference to where it is".
- Demob: "fil in data if its not filled in ... there is a lot with no off site date ... Demob is 2 weeks from the Monday
  after the race. Priority is everything that is not inside the island then inside the island next. So we should maybe
  have a demob tab ... where we get to pick a date of pick up ... the branch can create run sheets on what to be picked up
  ... Needs to look good". Answers: **demob ends Fri 13 Nov**; **"the island" = Macintosh Island** (`ZONES782.island`).
- Toilets: "demob toilets for event portables we should do a run sheet. as they can take up to 24 when they pick up" —
  **the 24-unit load is Andrew's figure.**
- "obviously waste tanks go after the toilet as the toilet is on top lol. every year apparently this turns into a
  disaster so we need to be very professional here and also keep in mind about travel times. as well as. opening times in
  gold Coast 7-5 and travel times on the road. with oversized. toilets is a big one. no toilet is to be moved or waste tank
  is to be transported unless it has been emptied under no circumstances are they to travel until this is done. they are
  not to be loaded on trucks unless this has been done."
- The look: "remember when we come up with idea we are going for the current super race car look", and on the earlier
  mock-ups: "your mock ups look different to the style we using in all other pages". So nothing here copies the mock-up's
  styling: every part is the page's own component (below).

## What changed

### A. The drawer (`drawer816()` runs after `openAssetDraw` has drawn and wired it; it arranges, it does not redraw)
- **Header:** the race plate, name · type, then discipline · branch · asset number. No Rental ID.
- **Summary** — Today's carbon instrument island (`.card.hubcard.island.dialcard`) with the light's state and "since … ·
  who", the Complete/Levelled/Steps ticks (`.tick`), a Macintosh Island / Outside the island chip, and In and Out as
  Today's gauge tiles (`.ctwo .ctile`), each with its source line. A proposed Out is the act chip with a dashed edge.
  Editors get "Change the dates →", which opens the existing date inputs (same `data-date` / `data-outdate` handlers).
- **Complete it** — Today's lights island (`.island.lights`): the signal head showing this reference's light, a row per
  light (sets it, `data-light`), a row per tick (`data-done`, `data-levelled`, `data-steps` only where `needsLevel` /
  `mentionsSteps`), and **Emptied (pumped out)** on every toilet and waste tank. Each control appears once; the header and
  delivery-card tick buttons are gone. Viewers see them disabled.
- **Where it is** — the destination Navigate uses (`dest782` → `navTargetFor`), its source as a chip ("master plan · on the
  unit", "pinned on site", "no drop yet · pit lane"…), a crop of the page's aerial with a pulsing pin and the island's
  outline, Goes to (typed override or the schedule's words, plus the master plan's "beside …"), Area, Way in, Navigate,
  Send to a phone, On the map, and editors' "Moved? Change it" (the existing override box and Map attached).
- **`<section data-photo-slot="REF">`** straight after Where it is: filled photographs only, one "Add a photo" (slot and
  unit pickers, `dropPhotoAdd`), and the full photo places in an editors-only fold. The outbox and persistence code are
  untouched.
- **Folds** (the drawer's own `details.dsect`, sliding open and closed; reduced motion and Motion off open them still):
  History and notes (the record facts that matter, schedule events, drawing links only if any, light history, delivery
  note, note) · Inside it and asset numbers (editors, or when there is something inside) · Driver's card · **Contract &
  charges — editors only** (`.editonly`: weeks, days charged, what is on hire with $, labour, contract and branch, hire
  start, the rental lines, Costs when it has a line, the transport $ from the driver's card, and any notice carrying a $) ·
  What was supplied (only with a record or variance; otherwise editors' "Record a difference") · Breakdowns (only when
  one exists; otherwise "Report a breakdown" is under More) · Sub-hired gear (editors, or a sub-hired reference).
- **Gone from general view:** the five precision tags (incl. "This link"), Demob-week row, Off-hire lines, Position chip
  and "No drawing callout…" block, empty states ("Nothing reported…", "No cost line…", "None filed…", "No map attached…",
  "Nothing recorded inside…", "No drawing link."), the duplicate rental lines.
- **Driver's card** now names the plan / pin / pit-lane destination instead of "Nothing on the 2026 drawings places this
  one" (`driverPos816`).
- **Footer:** Print drop sheet · Text it · Copy link · More (emails, Equipment page, Report a breakdown, next day /
  cancel / Delete for editors).
- **Height** (folds closed, header + body + footer): P42 4,469 → 1,709 px desktop, 4,933 → 1,908 phone; WC05 4,907 →
  1,874 / 5,448 → 1,999; P46 3,949 → 1,587 / 4,396 → 1,685.

### B. The off-site date
First of: typed `S.delivery[key].out_date` (**confirmed**) → the plan's remove event (**plan**, 50) → a contract off-hire
before 13 Nov (`onhireForAsset` rows' `demob_date`, **contract**, 15; a 13 Nov contract date shows as "hire ends 13 Nov")
→ **proposed** (132), worked out on every draw and never written:
- 15 working days, Mon 26 Oct – Fri 13 Nov. Outside Macintosh Island in week 1, the island in weeks 2–3, **no own
  position at the end of week 3** (Wed 11 – Fri 13 Nov, marked "position to confirm").
- Own position = the `dest782` point unless it is the pit-lane fallback, then the master plan's point, then a pin /
  placement / callout; `ptOf782` + `inPoly782(ZONES782.island)`. Result: 94 outside, 73 island, 30 to confirm — the same
  split as research.md section 4.
- Order: area (Gate 1, Gate 2, Surfers, Main Beach Pde, other outside, island), branch, type, reference — as the 13 Nov
  scratch proposal. Days are levelled (each toilet load goes whole on the day with most room, then the rest fill to an even
  level in order): week 1 21/21/21/21/21, weeks 2–3 15/9/9/8/8, 8/8/8/8/8.
- **Difference from the scratch file:** the 13 Nov scratch file put the 29 no-position references in the island (it counted
  the pit-lane fallback as a position); this build follows the brief and puts them at the end of week 3.

### C. The Demob tab (after Equipment; on a phone in the glyph row, Equipment hyphenates onto two lines to fit)
- Today's racecard island: 15 working days, the rule in words, the four counts as gauge tiles (proposed dashed), the
  order chips, and a **day strip of gauge tiles** that scrolls inside itself: day, date numeral, count, an LED strip
  (orange outside, blue island, grey to confirm, lighting in turn) and the toilet run's units ("WC 24"); a week starts with its Week chip.
- The day: branch filter, Confirm the N proposed (editors; an on-page warning with Confirm / Not now, then `setDate(key,
  iso, 'out')` for each, one redraw), Print run sheets, Email the branch(es) (mailto draft only). Four views: Pick-up list
  (the day table, by area, with the source chip, NOT READY, and a More menu: open, move to another day, Emptied, Collected),
  Toilet run, Pump-out run, Trucks and times. Out-of-window plan dates (WB02, WB03, WB14) are listed under the strip.
- **Toilet run** (now two runs that never mix - see "Two toilet runs, travel time and oversize" below). Event portables = **FWF** (single portable toilets) and **Pee Panel** (urinals) — 233 units on 63
  references. Not counted (they stay on the pick-up list): **Toilet Block 6m, 16Pan Block, Accessible Toilet, Waste tank,
  FWF Trailer**. Proposed portables go as full 24-unit loads, outside the island first, then the island, then those with
  no position; a day can carry several loads; a part load says how many spaces are left and to top up from the next day.
  Mixed references (WC01, WC09, WC51) stay on the list and put their portables on that day's toilet run.
  A reference over 24 units is picked up in **portions**, each with its own day, load, list entry and pump-out; confirming
  writes the last day as the due-out date and the portions beside it (`out_portions`, merged with the due-out day), so the
  split survives a reload; a later move of the date sets the portions aside. A quantity nobody stated is "quantity to
  confirm" — counted as unknown, never as 1 — and its load says its total is not certain (on screen, print and email).
- **Emptied (pumped out)** — a fourth tick on the delivery record (`emptied`, `emptied_by`, `emptied_at`, history), edit
  link only, never set by itself. It clears a unit only with a person and a time, only if it is the newest record (local
  or committed; a same-moment disagreement reads as not emptied), and only if it was recorded after the unit last arrived
  on site — setting a toilet or tank on site again takes an earlier pump-out off, in the setter's name, with the reason.
  The gate: the Demob tab's "Collected — on the truck" is always refused until then; the ordinary lights refuse taking a
  toilet or tank to in transit / not on site the same way, with **one named exception** (`movePurpose816`, see "This pass"): a unit the record
  has never had on site, with a delivery date in the record, before the first event day (23 Oct), its own out date or 26 Oct, whichever is first, is on its way IN.
  From the first event day a unit with no recorded arrival may have been used, so it is gated like any other (968aefb #5).
  No date or light-colour shortcut otherwise. `deliveryEmpty` counts the tick; `mergeRecords` keeps value, who, when and
  history (later stamp wins; the same moment keeps "not emptied" on every copy and writes the clash down).
- **Toilet before tank.** Pairs found in the data (one reference holding a toilet block and its waste tank): **WC05, WC20,
  WC27, WC60**. A reference holding toilets and a tank is two stops — the toilets, then the tank — and the toilet run is
  timed first, so a tank never starts before every toilet of its reference is off, on any truck (an unknown-quantity
  toilet still has its stop). Relationships between different references are not in the data and are not invented.
- **Pump-out run:** toilets and tanks due today or on the next working day and not yet emptied — pumped the day before,
  or first thing that morning.
- **Trucks and times** (oversize is now the branch's flag, see below): one load per big piece (buildings, toilet blocks, trailers — "Oversize: check permit /
  travel window", plus a per-day note), the rest a few to a truck by area, the toilet run in its 24-unit loads; each load
  timed from Kingston and back inside **07:00–17:00 on site** and never on the road 07:00–09:00 or 16:00–18:00, with a
  new truck when the next load would not fit.
- **Run sheets:** one A4 per load in the day documents' look: header (date, branch or toilet run, truck and load, site
  hours, depot, leave / on site / leave site / back), stops in order with area · way in · plate · units, a tick box per
  unit "Pumped out" and "Loaded", the red "MUST BE EMPTIED BEFORE LOADING — DO NOT LOAD IF NOT PUMPED OUT" line, toilet
  before tank, the rules, the assumptions, and sign-off lines for the driver and the site lead.

### Planning figures (for Andrew to confirm; the branch can change them on the tab, kept per device)
| figure | value | source |
|---|---|---|
| Kingston ⇄ circuit, each way | 70 min | the page's `transport.kingston_run` (run782) |
| Between areas in the precinct | 10 min | `DATA.depot.planning.precinct_min` |
| Loading at each stop | 30 min | **assumption**: the PM's 30 min unloading, used for loading |
| Each event portable | 5 min | **assumption** |
| Unloading at Kingston | 30 min | the PM's unloading allowance (UNLOAD_MIN782) |
| Pieces on one truck (not oversize) | 4 | **assumption** |
| Site hours | 07:00–17:00 | Andrew, 3 Oct 2026 |
| No travel | 07:00–09:00, 16:00–18:00 | the PM, 2 Oct 2026 (PEAKS782) — applied both ways |

## This pass (3 Oct 2026): what changed since the frozen drafts Codex reviewed
- **Pump-out gate, the exact rule (968aefb #5, be47bb5 R1; Codex's e540cbc review records it as an interpretation, and
  this is it): the emptied gate applies to outgoing movements only - collection, loading, removal.** *The emptied gate applies to every outgoing movement of a
  toilet or a waste tank - collection, loading, carrying it off, taking it off site - and is passed only by an Emptied
  record with a person and a time, newer than the unit's last arrival on site, whatever the date or the light. The one
  movement it does not gate is an incoming delivery, and only when the record says so (`movePurpose816`): no arrival
  ever recorded, a delivery date in the record (`effectiveDates(a).in`, the plan's or a typed one), and today before
  the first event day (23 Oct), its own out date and 26 Oct, whichever is earliest. A unit with no recorded arrival and
  no delivery date is not assumed to be coming in: refused. Every collection path is forced through the gate whatever
  the purpose says.* When the delivery exception is used the page says so ("recorded as its delivery to site ... the
  emptied rule applies when it leaves"). Why keep it: a new toilet on its way to site has not been used, and refusing its
  amber light would stop delivery tracking during the build (deliveries run until 22 Oct); nothing that may have been
  used can pass. Tests both ways: fixtures 2c, 2d, 2e, R1a-R1d, and Codex's `historyless_before_event_cannot_prove_incoming_trip`
  now passes (that unit has no delivery date in the record).
- **Portions (after 6a0bb20 #1):** every portion carries a stable id (its day and its place among that day's portions,
  e.g. `2026-10-26#2`); the day's loads place **every** portion on that day, not the first one found; confirmation
  writes the ids with the dates and units.
- **Quantity changed after confirmation (after 6a0bb20 #2):** reconciled and said, never lost or double-counted. More
  units than the portions hold ride as an *unplanned* portion on the due-out day ("quantity changed from 25 to 28 since
  confirmed: 3 units unplanned - on the due-out day until moved"); fewer come off the last portions first; a quantity
  now unknown keeps the portions and makes their loads uncertain. Shown on the pick-up list, the toilet run, the board,
  the drawer's Out tile, the email and the run sheet.
- **Quantity corrected to 0 (e540cbc):** a reference whose every unit is known and 0 has nothing to collect: no load,
  no truck stop (the old one-piece fallback now applies only to a reference with no unit rows at all), no pump-out; it
  stays on the pick-up list as "quantity 0 - nothing to collect". 0 and unknown stay distinct.
- **Uncertain loads (after 6a0bb20 #3):** a load holding any unknown quantity shows the amber `cand` chip "to confirm -
  total not certain, count on site", never green "full"; the trucks view and the day tile say "+ to confirm" / "WC n+".
- **Run sheets fit their page:** three toilet-run sheets (28 Oct, 30 Oct, 2 Nov) were taller than A4 and the page
  clipped their sign-off. A load of more than five stops now prints the same sheet tighter; all 98 sheets across the
  15 days fit (largest load 11 stops), and a load past 13 stops is named when printing instead of being clipped. The
  "Pumped out" tick boxes are a grid of six (eight when tight), no longer an overlapping column; short loads get ruled
  "Notes on site" lines.
- **Style:** the load gauge was rendering as a tall blue block (the LED strip only lays out inside a `.ctile`); it is
  now Today's gauge tile with the LED strip. The load heading no longer repeats the gauge's "17 of 24". The run sheet's
  two greys not on the page (#4a4f54, #9aa0a6) are now the day documents' own `--mute`/`--hair`/`--ink`. Dead CSS
  (`lw816`, `lt816`, a duplicated rule) removed. The one visible "(Andrew, 3 Oct 2026)" on the assumptions now reads
  "(the project manager, 3 Oct 2026)", as the scrubber does for every other attribution.
- **Space:** the Demob board's words and counts were 22% empty (2-line text beside a 2x2 block); the four counts sit in
  one row from 1,100 px, **4.1%**. The photo strip fills its row (WC05 36% -> 2%; P42 on a phone 29% -> one row).

## Two toilet runs, travel time and oversize (3 Oct 2026, Andrew's answers relayed by the coordinator)
Andrew: "Its the subhired porta loos will go on a run... coates portaloos will go on their own run if any"; on the supplier:
"They use their own transport and organise.. Looks like they are from brisbane coopers ains"; on the Coates run: "12 -14
toilets". He also sent the Queensland Access Conditions Guide v6.0 (Dec 2023), written up in `access_rules_qld.md`.
- **Who owns each portable** is read from the v7.29 inventory's own record (`owner816`): the supplier's units on the
  reference (`subOf`, e.g. Event Portables) and the Coates asset numbers on it (`invCountNums`, by item where
  `itemNumbersOf` has them). A unit recorded as neither is **"owner to confirm"** and goes on **neither** run; it stays on
  the pick-up list, the pump-out list and the email, flagged. On the live record: **70 sub-hire, 40 Coates, 123 owner to
  confirm** (of 233).
- **Sub-hire pick-up** - "Supplier's own transport, organised by the supplier (Coopers Plains, Brisbane)". A pick-up list,
  not a truck plan: what is ready, in loads of up to 24, where each unit is (its destination and whether that is the
  master plan, a pin or the reference), its emptied status by name and time, the pick-up date, site hours 07:00-17:00.
  No departure, no travel time, no travel field. The supplier is named only where the record names it ("Event Portables"
  on those units); otherwise "sub-hire supplier".
- **Coates toilet run** - only when there are Coates toilets that day. 12-14 per load, planned at 12; a truck the branch
  confirms at 13 or 14 is set on its load (kept on this device); above 14 shows "over 14 - check the truck". Timed from
  Kingston like the branch trucks.
- **Never mixed:** a load holds one run's units only; the gate (emptied, by name and time, before loading), toilet before
  tank, and site hours apply to both. A tank under a supplier's toilet is marked "after the supplier has lifted the
  toilet off it".
- **Travel time, per run:** the Coates toilet run and the branch trucks start from the page's own Kingston figure,
  read from `DATA.transport.kingston_run` (the v7.82 delivery-load rule: 46.7 km straight line x 1.25 at 60 km/h + 10 min
  in the precinct, 70 min), labelled "planning figure, not a live time", editable per run; a live figure goes in the same
  field later. Blank = "travel time to confirm": no departure or return is worked out.
- **Oversize - only a load the branch flags** (a tick on each truck load, kept on this device; nothing is guessed). A
  flagged load shows the project planning window ("the QLD guide bars oversize vehicles in the Gold Coast 07:00-09:00 and
  16:00-18:00 on business days; with site hours 07:00-17:00 we plan oversize moves 09:00-16:00"); a planning latest departure = 16:00 less the
  run's travel time (a planning figure, not a permit time; or "travel time to confirm"); a flag when it leaves after that,
  or when its time on the road overlaps either peak; "stagger departures" when two flagged loads leave
  together (no convoys); "pilot / escort: check permit" (never a number); and "Check TMR Conditions of Operation Database
  before each trip". The source sits in a tooltip: QLD Access Conditions Guide v6.0, s11.2 Table 3, s11.3 Table 4, s9,
  s10.2. A reference dated on a weekend or public holiday inside the window is listed as "not a demob day", with the
  over-3.1 m-wide / 25 m-long weekend rule beside it.
- The page says "(the project manager, 3 Oct 2026)" beside 12-14, as the page's rule on names requires.
- Codex's earlier fixtures were written before the two runs: their synthetic toilets carry no owner, so the page would
  call them "owner to confirm" and make no load (`codex_review/followup_e540cbc_cpu_noshim.log`). They are rerun with
  `codex_review/owner_shim816.js` appended, which says what they assumed (every portable is the supplier's, 24 a load);
  the page never uses it.

## Codex's findings, the fix, and the test
Fixtures: `evidence/codex_fixtures816.js` (CPU, **FIXTURE-COUNT**), Codex's own scripts rerun on this build
(`evidence/codex_review/*_now.json`, `timeline_drawer_recheck_fixed.log`), and the browser suite `v816_tests.js`.

| # | Codex finding | Fix | Test |
|---|---|---|---|
| 88a716e 1 | pump-out gate had a date and a light exception; emptied with no who/when passed | `emptyGate816`: no date or light shortcut; proof = emptied + person + parseable time; `incoming816` is the one named exception (never on site, before the event/collection window); every collection path forced | fixtures 1, 2, 2b, 2c, 2d, 2e, 3; browser [review 1] x3; Codex `gate_*` all false |
| 88a716e 2 | clearance not tied to the use; local tick beat a newer committed un-tick | `emptiedOf816` newest record wins; a pump-out older than the last arrival is stale; `revokeEmptied816` in `setLight` on a new arrival | fixtures 4, 5, 5b, 5c; browser [review 1, 8], [review 7]; Codex `newer_committed_untick`, `reused_reference_old_pumpout` |
| 88a716e 3 | merge dropped emptied and its history | `mergeRecords`: value/who/when on their own clock, history unioned | fixtures 9, 9b, 9c; browser [review 2]; Codex `merge_emptied_evidence` |
| 88a716e 4 | split reference got one date | per-load portions, each with its day; out date = last portion | fixture 7; browser [review 3]; Codex `split_reference_dates` |
| 88a716e 5 | tank before toilet across runs | toilet run timed first; a tank waits for the latest toilet end of its reference on any truck | fixture 8; browser [review 4] and the all-days tank check; Codex `mixed_toilet_tank_order` |
| 88a716e 6 | unknown quantity became 1 | counted 0 + `unknown`, "quantity to confirm", load uncertain on screen, print and email | fixture 6; browser [review 5]; Codex `unknown_quantity` |
| 88a716e 7 | Timeline dropped a same-day added reference's typed removal | the hunk keys on "no remove event", not `out_plan` | Codex recheck 13/13; browser [review 6a] |
| 88a716e 8 | cancelled reference hid its Out date in the drawer | drawer falls back to typed / plan / contract date, marked cancelled | Codex recheck; browser [review 6b] |
| 968aefb 1 | an earlier use's pump-out cleared a later collection | stale-by-arrival + revoke on arrival | fixtures 5, 5b, 5c; Codex `reused_reference_old_pumpout` -> `nextCollectionAllowed:false` |
| 968aefb 2 | confirming a split collapsed it to the last day | `out_portions` saved with the date on the same stamp; merged with the due-out group | fixture F2; Codex `confirm_split_collapses_dates` before = after |
| 968aefb 3 | pump-out only before the final split day | pump list uses every portion's day | fixture F3; Codex `split_early_load_without_pump_task` pump on all 3 days |
| 968aefb 4 | unknown portable vanished after confirmation; tank alone | fixed-date path keeps unknown rows on an uncertain load; a tank waits for that stop | fixtures F4a, F4b; Codex `unknown_confirmed_*`, `unknown_toilet_tank_*` |
| 968aefb 5 / be47bb5 R1 | missing history read as an incoming trip | `movePurpose816`: incoming only with no arrival, a delivery date in the record, and before the event / own out date / 26 Oct; otherwise outgoing and gated | fixtures 2, 2c, **2d, 2e, R1a-R1d (new)**; Codex `historyless_before_event_cannot_prove_incoming_trip` passes |
| 968aefb 6 | equal-time merge depended on order | same moment, two answers -> not emptied on every copy, clash written down | fixtures F6, F6b; Codex `merge_equal_time_order_dependent` (both orders false, clash) |
| 968aefb 7 | added reference lost its explicit removal date | the same-day fallback is dropped only when no dated remove event exists | fixture F7; Codex recheck (its regression assertion flipped: `plan` 5 Nov) |
| after 6a0bb20 1 = be47bb5 R2 | two portions on one day: `.find` kept only the first | portion ids; every portion of the day placed; ids written on confirm | **G1, G1b** - fail on 0006166, pass now |
| after 6a0bb20 2 = be47bb5 R3 | quantity corrected after portions saved | `reconcile816`: unplanned / fewer / now unknown, said everywhere | **G2a-G2e** - fail on 0006166, pass now |
| after 6a0bb20 3 = be47bb5 R4 | uncertain load showed green "full" | amber "to confirm", never "full" | **G3** - fails on 0006166, passes now |
| e540cbc (6ebb321) | a confirmed quantity corrected to 0 became a 1-unit truck stop | `nothing` = every unit known and 0: no load, no truck stop, no pump-out, listed as "quantity 0 - nothing to collect"; the one-piece fallback only for a reference with no unit rows; unknown stays "to confirm" | **G4, G4b, G4c** - fail on 7db16d1, pass now; Codex `followup_e540cbc_cpu` 33/33 |
| abbb01b 1 (ea0dcee) | a reference split between owners lost a day on confirmation | each portion carries its run (`s`), saved as `out_portions[].stream`; the reference is on every portion's day; reconciliation per run | **I1-I4**; Codex `mixed_*` 3/3 |
| abbb01b 2 | Coates loads said "of 24" | cards, gauge, email and trucks use `L.cap` (12, shown 12-14); loads numbered per run with the run named | H3d; Codex `coates_*` 2/2 |
| abbb01b 3 | supplier "Print this load" selected nothing | selected by the run-aware load id (`sub1`), or a bare number | **I5**; Codex `supplier_print_this_load_selects_supplier_run` |
| abbb01b 4 | no reason shown for an unassigned owner | "owner to confirm" (with the count) on the row, the toilet runs, the email | H5; Codex `unknown_owner_is_explained_on_pickup_row` |
| abbb01b 5 | a tank under a supplier's toilet had a clock time and no dependency | the tank stop shows "after the supplier" in place of a time and "HOLD: only after the supplier has lifted the toilet off it, and the tank is emptied" on screen and paper | **I9**; Codex `supplier_tank_dependency_*` 2/2 |
| roads 1 | every run sheet threw (`A.run`) | the sheet reads the run's own travel time; a supplier sheet is a pick-up list | **I6** (all four run types print); browser "Print this load prints a non-empty sheet for every run type" |
| roads 2 | oversize tick had no UI; warnings never shown; old permit warning lost | an "Oversize load (the branch's flag)" tick on every truck load; flagged: permit chip, planning latest departure, pilot / escort "check permit", TMR line, guide in a tooltip, convoy flag; unflagged big piece: "oversize? the branch to say - permit not checked" | H13, H14, **I8**; browser test drives the tick on and off |
| roads 3 | the travel editor was gone and an old override ignored | a travel field per run (Coates toilet run, branch trucks); a figure typed under the old assumptions is kept | **I7**; browser test blanks it and types 90 |
| roads 4 | supplier times printed as 00:00 | the supplier has no times anywhere; an unknown Coates/branch travel time reads "travel time to confirm" | H7, H8; Codex `supplier_null_travel_times_do_not_render_midnight` |
| roads (scope) | the 06:00 "peak" overstatement | the peak flag is exactly the guide's 07:00-09:00 / 16:00-18:00 on-road overlap; the latest departure is labelled a planning figure, not a permit time | **H12b** |
| 8c821da (6b1066d) blocker 1 | mixed-owner dates collapsed (reviewed source predated the per-run portions) | per-run portions through planning and confirmation (above) | **I1-I4**; Codex `followup_abbb01b_streams` mixed 3/3, `followup_8c821da_ui` 20/20 |
| 8c821da blocker 2 | a truck set to 8 left a 12-unit load at 12, "full", free -4 | a lower capacity re-packs the load (12 at 8 becomes 8 + 4, the new load marked "re-packed"); a load over its truck is never "full" - "overloaded - n over this truck's N"; above 14 still warns | **J1, J2**; Codex `followup_8c821da_ui` capacity checks |
| 8c821da (a) | an earlier draft's saved travel setting | carried over once into both runs, labelled "carried over from the earlier Kingston-run setting", and the old setting removed - never silent | **I7** |
| 8c821da (b) | the 09:00-16:00 window read as a legal rule | "Project planning window: the QLD guide bars oversize vehicles in the Gold Coast 07:00-09:00 and 16:00-18:00 on business days; with site hours 07:00-17:00 we plan oversize moves 09:00-16:00." Source in the tooltip: "QLD Access Conditions Guide v6.0 (copy supplied by the project manager)" | browser UI test checks the words; Codex `followup_8c821da_roads` 16/16 |

Before/after evidence: `evidence/codex_fixtures816_before_fix_0006166.log` (8 failed: G1, G1b, G2a-e, G3; G2d only
because the change field did not exist), `evidence/codex_fixtures816_before_zero_fix.log` (G4, G4b, G4c fail on
7db16d1; G4b only because the `nothing` field did not exist) and `evidence/codex_fixtures816.log` (all pass).
Codex's unmodified `timeline_drawer_recheck_968aefb.cjs` stops at its own line 61, which asserts the regression it
found (`proposed`); with the fix the value is `plan` - `timeline_drawer_recheck_fixed.cjs` changes only those two lines.

## Codex scope: the one Timeline hunk (please review)
In `programmeDaysBefore801()`, after the `evs.forEach(...)` loop, inside the `allAssets().forEach`:
```js
 /* v8.16 - a due-out typed on a reference with no remove event reaches its day as a removal (Andrew, 3 Oct 2026) */
 { const typed816 = deliveryOf(a.key).out_date; if (typed816 && !evs.some(e => e.movement === 'remove')) { const rl = day(typed816).removals; if (!rl.some(r => r.a.key === a.key)) rl.push({a, events: [{date: typed816, sheet: 'due-out typed on the page', activity: null, movement: 'remove', movement_stated: true, quantity_display: null, carrier: null, dd: null, note: null, typed816: true}], moved_from: null}); } }
```
It only adds a removal for a typed due-out where the record has no remove event (an added one-day reference included);
a moved remove event is untouched; one removal per reference per day. Tested: P42 typed for Wed 4 Nov shows under DUE
OUT on the Timeline, in `calendarDays()` and in `dpLoads` (the day documents); Codex's recheck 13/13.

## Style: Today side by side
Pictures (scratchpad, not the repo): `v816/compare_today_desktop.png`, `v816/compare_today_phone.png` - Today's cards
beside the drawer and the Demob tab. Every part is the page's own component: the carbon `.card.hubcard.island.dialcard`
with its screws, `.hubtitle`/`h3`, `.chip` (ok / ref / cand / act / crit), `.btn`, `refPlate`, the signal head and
`.hl` light rows, `.ctile` gauge tiles with `.hubbig`-style numerals and the `dashLeds` LED strip, `levelGlyph` /
`stepsGlyph`, `.daytbl`, and the day documents' `dp-page` for the run sheets. No emoji; every glyph used (✓ · — – → ×
⇄ ▾) is already on the page; every colour is already on the page; fonts are the page's Barlow Condensed and Inter.

## Space (layout816.cjs, the v7.99 method: container area against its children at natural size)
| part | desktop 1,440 | phone 390 |
|---|---|---|
| Demob board, words / counts | 4.1% | 4.2% |
| Demob count tiles | 10.6% | 9.4% |
| Demob day strip | 18.0% (gutters between 15 tiles) | 0% (scrolls) |
| Drawer In / Out tiles | 12.8% | 7.2-13.4% |
| Drawer photo strip (WC05) | 2.0% | 2.5% (P42 4.9%) |
| Drawer Complete it | 28.1-29.7% | 28.8-31.0% |
| **Today's own lights card (reference)** | 30.2% | 30.8% |

Complete it is Today's lights component as built (signal head beside the rows), and measures the same as Today's own.
The day bar (branch buttons left, actions right) is a toolbar, not a card row.

## Tests (`evidence/`)
Final candidate `7ae89da4…` built on live v8.15 `35ab1366…`, 3 Oct 2026. The standing suites ran on `cf296035…`, which
differs from it by one sentence in the Demob board's legend (inside `renderDemob816`, nothing Today, Equipment or any other tab
draws); the affected checks - v816 desktop and phone, every CPU fixture and both sweeps - were rerun on `7ae89da4`. All one browser job at a time under
the shared lock (`evidence/run_all.sh`). Read only: the harness aborts every write; no record was touched.

| suite | result |
|---|---|
| `v816_tests.js` (browser, desktop 1,440 + phone 390) | **115 / 115** |
| `codex_fixtures816.js` (CPU: Codex's cases and mine, incl. G1-G4, H1-H16, I1-I9, J1-J2) | **71 / 71** |
| Codex `followup_abbb01b_streams` / `followup_8c821da_ui` / `followup_8c821da_roads` (pin lifted) | **20 / 20 · 20 / 20 · 16 / 16** |
| Codex `followup_e540cbc_cpu` / `followup_6a0bb20_cpu` / `followup_24cb316_cpu` (with `owner_shim816.js`) | **33 / 33 · 26 / 26 · 53 / 53** |
| Codex `followup_cpu_968aefb` / `demob_cpu_audit` (observations) | every observation shows the fixed behaviour |
| Codex Timeline/drawer: `abbb01b`, `e540cbc`, `6a0bb20` (pins lifted, hunk pin kept) / `timeline_drawer_recheck_fixed` | **17 / 17 x3 · 13 / 13**; Timeline hunk SHA-256 `8e9e00f0…` unchanged |
| v7.99 Today | **23 / 23** desktop, **18 / 18** phone |
| packed Today (v7.95) | **20 / 20**, **14 / 14** |
| Equipment (v7.96) | **22 / 22**, **22 / 22** |
| results navigation (v7.96) | **7 / 7**, **7 / 7** |
| one-tab (v7.93) | **20 / 24** desktop and phone - **the same four fail on the live base** (20/24, `scratchpad` run on `35ab1366`): they look for Today's Fencing and roads cards that v8.14 removed with Andrew's yes; not v8.16 |
| navigation | **21 / 21** |
| rules | **45 / 45** |
| fresh-after-save | **11 / 11**, 0 page errors |
| sweeps | **22 tabs** (Demob added) desktop and phone: **0** page errors, **0** console errors |
| repeat_check | 169 - the same count as v8.14's run; the 7 entries that differ are the same money figures at today's values |
| same_figures | every line on every tab matches live |

Before/after logs for the last three rounds of fixes: `codex_fixtures816_before_fix_0006166.log`,
`codex_fixtures816_before_zero_fix.log`. Evidence JSONs from the reruns carry `fixtureProvenance` (the commit each fixture
was written against), `testedSourceCommit` `a57de005…`, `testedJsSha256` `00a72d68…`, `base` and `candidateSha256`
(`evidence/stamp_evidence816.py`). Other release folders' evidence the suites rewrote was put back with `git checkout`.


## Open questions for Andrew
1. **Which toilets are whose (the 24 and the 12-14):** on the record, 70 units are the supplier's (Event Portables on
   WC33, WC41, WC42, WC43, WC44, WC56, WC59, WC67, WC71, WC81) and 40 are Coates' (Coates asset numbers on WC01, WC02,
   WC04, WC06, WC07, WC11, WC12, WC21, WC50, T0024). **123 units have no owner recorded** and are "owner to confirm" on
   neither run until somebody records the supplier's units or the Coates numbers on them (the Equipment / sub-hire
   drawer). Is it right that toilet blocks, accessible toilets, trailers and waste tanks stay off both toilet runs?
2. **Travel times:** the Coates toilet run and the branch trucks use the 70 min Kingston planning figure (not a live
   time, editable per run). Loading 30 min a stop, 5 min a portable and 4 pieces a truck are planning assumptions,
   flagged and editable. Are they right, and does the 07:00-09:00 / 16:00-18:00 rule apply to the run back as well?
3. **Oversize:** which loads does the branch flag (it is a tick per load, never guessed), and what are their widths and
   lengths (the weekend rule is for over 3.1 m wide or 25 m long)? Is QLD Access Conditions Guide v6.0 still current,
   and is there a statewide public holiday in 26 Oct - 13 Nov (none known)? Pilot and escort counts come from the permit.
4. Should the per-day oversize note, the oversize ticks, the Coates truck capacities and the travel times be shared
   (a new record collection) rather than kept on each device?

## Release state
**READY TO UPLOAD (Claude, 3 Oct 2026)** - candidate `7ae89da4e80b070ade2977ef4e47ed3e766be6dc7722bd610e21ad78ddaa77d0`
(9,244,210 bytes) on live v8.15 `35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770`. Every Codex finding
(88a716e 8, 968aefb 7, 6a0bb20 3, e540cbc 1, abbb01b 5 + roads 4, 8c821da 2 + 2) is fixed and its fixture passes.
Claude implemented and tested; Codex reviewed the source in rounds up to 8c821da / 6837e9f and has not reviewed the final
`3f18954e` demob source (one legend sentence after its last review). Upload is Codex's; Andrew commits. If live changes
before upload, rebuild with the one patch and rerun `evidence/run_all.sh`. Nothing in this release writes to the record:
proposed dates, travel times, oversize ticks, capacities and notes stay on the device until a person confirms a date.

