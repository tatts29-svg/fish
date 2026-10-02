# v8.16 — the reference drawer, simple first, and a Demob tab (DRAFT, not live)

Author: Andrew Fisher · Claude implemented and tested; Codex has not reviewed · 3 Oct 2026 (AEST)

**State: DRAFT.** Not uploaded, not committed by this work, nothing written to the live record. The tests read the live
record through `toolchain/harness/open_page.js`, which aborts every write; the editor checks also stub the page's own
push, so no write is even attempted.

## Build

```
bash toolchain/build.sh v8.16 v8.16_reference_and_demob_DRAFT/patch_v816.py
```

- Base: live v8.13, `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec`, 9,079,773 bytes.
- Build: **`f44af3d5fcf1939163da90317bcfa9f6ce7be5cd80c1f0a03c385528549c8a03`, 9,169,171 bytes**. check_page: every script
  parses, no keys (`pk.eyJ` 0, `AIza` 0), author line present.
- The patch refuses a second run (`v8.16 already applied`) and a page without its anchors (`function place799(`,
  `dest782`, `ZONES782`, `openAssetDraw`, `programmeDaysBefore801`, `dpPrint`). It touches none of v8.09's (the machine)
  or v8.14's (Today) anchors, so either can go first; whoever is second rebuilds.
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
  (orange outside, blue island, grey to confirm, lighting in turn) and the toilet run "WC loads·units".
- The day: branch filter, Confirm the N proposed (editors; an on-page warning with Confirm / Not now, then `setDate(key,
  iso, 'out')` for each, one redraw), Print run sheets, Email the branch(es) (mailto draft only). Four views: Pick-up list
  (the day table, by area, with the source chip, NOT READY, and a More menu: open, move to another day, Emptied, Collected),
  Toilet run, Pump-out run, Trucks and times. Out-of-window plan dates (WB02, WB03, WB14) are listed under the strip.
- **Toilet run.** Event portables = **FWF** (single portable toilets) and **Pee Panel** (urinals) — 233 units on 63
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
  toilet or tank to in transit / not on site the same way, with **one named exception** (`incoming816`): a unit the record
  has never had on site, before its collection window (its own out date or 26 Oct, whichever is first), is on its way IN.
  No date or light-colour shortcut otherwise. `deliveryEmpty` counts the tick; `mergeRecords` keeps value, who, when and
  history (later stamp wins; the same moment keeps "not emptied" on every copy and writes the clash down).
- **Toilet before tank.** Pairs found in the data (one reference holding a toilet block and its waste tank): **WC05, WC20,
  WC27, WC60**. A reference holding toilets and a tank is two stops — the toilets, then the tank — and the toilet run is
  timed first, so a tank never starts before every toilet of its reference is off, on any truck (an unknown-quantity
  toilet still has its stop). Relationships between different references are not in the data and are not invented.
- **Pump-out run:** toilets and tanks due today or on the next working day and not yet emptied — pumped the day before,
  or first thing that morning.
- **Trucks and times:** one load per oversize piece (buildings, toilet blocks, trailers — "Oversize: check permit /
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

### Open questions for Andrew
1. "Event portables": the toilets typed FWF / Pee Panel (233 units), or only the gear sub-hired from **Event Portables**
   (WC33, WC41, WC42, WC43, WC44, WC56, WC59, WC67, WC71, WC81)? Built as the types; one line changes it.
2. Oversize: what permit or travel window applies on Gold Coast roads for buildings and toilet blocks? Nothing invented;
   a note per day on the tab.
3. The planning assumptions above, and whether the no-travel windows apply to the return run as well.
4. Where the per-day oversize note and the assumptions should live: they are per device today; the shared record would
   need a new collection.

## Codex scope: the one Timeline hunk (please review)
In `programmeDaysBefore801()`, after the `evs.forEach(...)` loop, inside the `allAssets().forEach`:
```js
 /* v8.16 - a due-out typed on a reference with no remove event reaches its day as a removal (Andrew, 3 Oct 2026) */
 { const typed816 = deliveryOf(a.key).out_date; if (typed816 && !evs.some(e => e.movement === 'remove')) { const rl = day(typed816).removals; if (!rl.some(r => r.a.key === a.key)) rl.push({a, events: [{date: typed816, sheet: 'due-out typed on the page', activity: null, movement: 'remove', movement_stated: true, quantity_display: null, carrier: null, dd: null, note: null, typed816: true}], moved_from: null}); } }
```
It only adds a removal for a typed due-out where the record has no remove event (an added one-day reference included, review 6a/7); a moved remove event is untouched. Tested: P42 typed
for Wed 4 Nov shows under DUE OUT on the Timeline, in `calendarDays()` and in `dpLoads` (the day documents).

## Tests (`evidence/`)
- `v816_tests.js`: **79 / 79 pass** (desktop and phone): drawer short, no $ on the view link (9 drawers, every fold a
  viewer can open, opened), empty states gone, P42 master plan, controls once, photo slot, folds animate, Demob 197 and
  15 days, one out date and source each (50 / 15 / 132), week rules, branch filter, print (one page per load) and mailto,
  run sheet contents, no load over 24, every portable unit in exactly one load, island priority, no tank before its
  toilet, every time inside 07:00–17:00 and outside the no-travel windows, every toilet/tank on a pump-out list before
  its pick-up, typed due-out on the Timeline, editors' charges, the emptied gate refusing then allowing a collection,
  Confirm N through setDate, reduced motion, no page errors, no sideways scroll.
- `run_all.sh`: the standing suites, one at a time (waits while a 3D rig runs). Results: see below.

STANDING-SUITES-RESULTS
