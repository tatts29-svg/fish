# v7.82 — maps accuracy and driver rules (DRAFT — for Codex's review)

Author: Andrew Fisher · 2 Oct 2026 · built on the live page v7.80 (`303029e3…`) and the live explorer (v7.58, md5 `1407e270…`)

## What Andrew asked (2 Oct 2026)

- "You have picked locations that don't exist. Example GN21 — where did you get that location from? If we go to the
  generator map we can then find the correct location." Analyse all maps and map documents. If a unit is not on the
  master, go back to its own map, find it and add it to the master. **Don't make it up.**
- Main Beach drivers: a seaside drop comes in from the end he marked (`evidence/andrew_main_beach_entry_route_02Oct2026.jpg`).
  A drop on the other side of the road, e.g. S08, enters from the other end of Main Beach Pde, so it goes round the
  way a race car would. Make this very clear on deliveries.
- Stagger drivers, and bring things in the right order, because of congestion on site every week of Supercars.
- Waste tanks go first. A toilet block that sits on a tank must not arrive before the tank. GN21 (60 kVA) always goes
  first into a tight spot; GN20 (350 kVA) only once GN21 is placed. Apply this to everything coming, and check it
  against what has already been done.
- The sequence (set later the same day): "P03 then P01 then P05, then WC05 waste tank, then WC05 toilet block, then
  P04. Trucks must arrive in this order. Staggered. Trucks should not arrive out of order to this sequence or entry
  won't be allowed, waiting delays will incur."
- Loading: "load times will need to be done minimum 5am at Kingston to allow time to get to Gold Coast. So you wouldn't
  load a waste tank after 9am and a toilet block first. Needs to be very clear. Common sense." Trucks can't travel to the
  Gold Coast 07:00–09:00 or 16:00–18:00 ("they can't travel between a certain time to Gold Coast, I told you this").
- The time: "When requests are made or a time frame on site, it means it needs to be off loaded by a certain time, not
  arrive right on that time. If a request is for 9 AM … he will need to be early as he needs to be unloaded by 10 am.
  Multiple work fronts operate. If we hold up or have delays we then delay all other work fronts (construction of
  stands, fencing erecting). If we miss times we miss access into areas … closed off by concrete barriers, or no
  traffic controllers. Time frames must be adhered to."
- Unloading: "Unloading time min 30m." And the times worked back are "leaving Kingston at that time, not loading".
- Dispatch: "No drivers should leave the pick up point until they have firm instructions on where they are going. Every
  item has a map drop off location and a direction point they need to head to."
- Printing: "The print drivers PDFs are generally fine from the pick up point, so the transport team will have to download
  these and give them to the drivers. What would be cool is prompts before they print, ensuring the process is followed -
  putting responsibility back on whoever prints these. This isn't a do-your-job-properly, so it needs to be done neatly.
  The Coates way, the life saving rules way, the positive communication way. Tidy, neat, dummy it down, don't over
  complicate." Then: "Drop-off locations can be done at the branch via Edit. If they update it, the run sheet locations
  update. This responsibility falls on whoever is printing these off." And: "We need to check this theory though -
  every reference should now have a drop-off location to match to."
- Park entries: watch for wildlife and branches; some spots are very tight.
- When something is complete, mark it on the map with an icon that pulses in its own way, clear and not confusing.

## 1. Map accuracy

**Why GN21 was in the wrong place.** On 27 Sep we read the generator positions off the generator drawing D024 by
machine (`locations_from_master_27sep/trace.py`). It followed each callout's leader line to its end. For 021, two lines
cross, it took the wrong one, and it put GN21 by Gate 2 / Commodore Dr, 423 m from where it goes. Nobody checked the
result against the master, and that was our miss. On D024, 021's arrow lands beside 020's at the west end of the pit
lane (`evidence/D024_gn20_21.jpg`).

**And every other generator was a few metres off too (Andrew, 2 Oct: "you can see an orange mark that looks like a
generator").** The master D001 draws each generator as an orange symbol. The 27 Sep reading used the end of D024's
arrow, which stops beside the symbol: on the road (GN03, GN01, GN20), on the fence line (GN06, GN13), on the next
building (GN18, GN23) or in the trees (GN24). **Fixed: all twelve now sit on their own orange symbol**, read off D001
and turned into GPS through the 12 nearest unit tags (worst fit 0.1 m) (`evidence/generators_on_their_master_symbol.json`,
before: `evidence/generators_before_red_ours_blue_symbol.jpg`, after: `evidence/generators_after_on_symbol.jpg`):

| | GN01 | GN03 | GN04 | GN06 | GN10 | GN13 | GN18 | GN19 | GN20 | GN21 | GN23 | GN24 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| moved (m) | 4.4 | 9.0 | 1.3 | 6.5 | 4.1 | 8.7 | 13.5 | 10.2 | 9.4 | 423 | 6.5 | 7.1 |

GN20 (350 kVA, the larger symbol) and GN21 (60 kVA, the smaller) sit side by side, about 4 m apart, at the pit lane's
west end. That is the tight spot GN21 goes into first. The old close/wide proof pictures were centred on the wrong
spots and are taken off the moved generators.

**P47 (QPS Amenities Crib Room, due 6 Oct): confirmed by Andrew, 2 Oct ("P47 looks good").** The current master
(rev 03) does not draw P47. D022 (rev 02) callout 047 points into the QPS compound by Gate 2 / Commodore Park, and the
position sits there beside P46 (`evidence/P47_D022_rev02_callout_047.jpg`, `evidence/P47_master_rev03_sharp.jpg`). The
text reads "GPS: … (confirmed by the project manager)", so its source is stated honestly: not "master plan".

**Light towers LTC01–LTC14 are not on the master as symbols.** They were made from blue fans on D024 (the legend has no
symbol for them). Several sit in a traffic lane. They are **not changed**, because there is no symbol to check them
against. They are listed for a check on site, or for Andrew to mark (`evidence/light_towers_and_other_arrow_positions.jpg`). P26, P28, P47, CP1 and T0243 came from arrows
too, and they sit on or against their buildings on the master.

**Every other master position was compared with its own drawing** (`evidence/crosscheck_master_vs_own_drawing.json`):
133 units, median 5 m apart. The four large gaps are all explained, and none is a master error:

| Unit | Gap | What the evidence shows |
|---|---|---|
| GN06 | 1,019 m | The master was right to within metres (now on its symbol): 120 The Esplanade, Surfers Paradise (reverse lookup). D024 draws it in the Esplanade panel (`evidence/D024_006.jpg`). The page's own arrow-to-ground conversion for that panel is what is off. |
| GN10 | 653 m | The master was right to within metres (now on its symbol): 162 The Esplanade, at the Main Beach Pde corner (`evidence/D024_010.jpg`). Same panel conversion issue. |
| GN04 | 183 m | The master is right (on its symbol): 3355 Gold Coast Hwy, by S15 / Jarriparilla Park (`evidence/D024_004.jpg`). |
| P53, P54 | 45–61 m | The master and D022 agree: the west edge of Helen Park by Breaker St (`evidence/D001_P53_54.jpg`, `D022_053_054.jpg`). This is an edge-of-sheet conversion effect. |

All other gaps are 32 m or less, and the board already explains them (rev 03 master against rev 02 sheets, and block tags).
The arrow-conversion issue only affects the fallback used when a unit has no master position. GN04, GN06 and GN10 all
have one, so nothing a driver sees uses that fallback. It is a follow-up, not part of this release.

**The 57 references with no exact position stay without one. Nothing is invented.** By group:
- **Area only on the master** (water barriers WB02–WB20, pit-garage toilets PG01/03/05/29, T0005, T0024, T0025, T0085,
  T0258, T0265, T0266). The master names the area, not the spot. The text says "Location not yet confirmed. Please
  contact the site team before departure".
- **Off site on D024:** LT01–LT06 are in the Molendinar storage-yard box. GN25 is in D024's side box "025 Seaway
  carpark", which has no drawn point.
- **VMS lines** (T0001 ×8, T0103 ×2, T0128 ×2, T0158 ×8, T0159 ×5, T0169, T0170): D025 draws 27 VMS positions, but the
  schedule does not say which contract line goes to which board, so none is assigned.
- **On no drawing:** WC10, WC85, WC100, T0021, T0089, T0162, T0176, T0019, T0268, T0109, FL01, FL02, NVLT, GN?, T0002,
  T0003, T0004, WB01, WB05, WB06.

## 2. Driver rules — in every text, in Full details and in the drawer

**Main Beach Pde, by side.** The side is worked out from the drop's position against Main Beach Pde's line (TomTom,
`evidence/main_beach_pde_tomtom.json`, from the Seaworld Dr & MacArthur Pde roundabout to Surfers Paradise). Only drops
within 70 m of the road and between its two ends get an entry line. A drop within 6 m of the road is "on the road" and
follows the race direction. Pinned positions are worked out the same way when the text is made.

| Side | Text | Drops today |
|---|---|---|
| Seaside | `ENTRY: seaside - in at the Seaworld Dr roundabout end of Main Beach Pde, drive south.` | GN13, LTC05, P45, P69, WC50, WC56, WC57, WC59, WC60, WC61, WC62 · the area-only T0024, T0025 and T0085 get the line once they are pinned |
| Land side / on the road | `ENTRY: land side - in from the Surfers end of Main Beach Pde, drive north (race direction).` | WC23, WC26, WC27 (S08), WC28, WC33, LTC06 · the area-only WB02 and WB19 (S08), WB15 and WB17 get the line once they are pinned |

**Delivery order** (the project manager, 2 Oct 2026). Andrew set the Macintosh Island sequence exactly: "P03 then P01 then
P05, then WC05 waste tank, then WC05 toilet block, then P04. Trucks must arrive in this order. Staggered. Trucks should
not arrive out of order to this sequence or entry won't be allowed; waiting delays will incur." This replaces my first
reading, in which P05 waited for WC05.

| Reference | Line in the text |
|---|---|
| P03 | `ORDER: truck 1 of 6 (P03, P01, P05, WC05 tank, WC05 toilet, P04). Out of order = no entry.` |
| P01 | `ORDER: truck 2 of 6 - only after P03 is in. Out of order = no entry.` |
| P05 | `ORDER: truck 3 of 6 - only after P01 is in. Out of order = no entry.` |
| WC05 | `ORDER: trucks 4-5 of 6: tank, toilet, after P05. Out of order = no entry.` |
| P04 | `ORDER: truck 6 of 6 - only after the WC05 toilet block is in. Out of order = no entry.` |
| GN21 | `ORDER: GN21 60kVA first - tight spot. GN20 350kVA after it.` |
| GN20 | `ORDER: only after GN21 60kVA is placed (tight spot).` |
| any reference with a waste tank (WC20, WC27, WC60 …) | `ORDER: waste tank first - no toilet block before the tank is in.` |

Full details and the drawer also carry the whole sequence: "1 P03 > 2 P01 > 3 P05 > 4 WC05 waste tank > 5 WC05 toilet
block > 6 P04. One truck at a time, staggered. A truck out of this order is refused entry and waits - waiting delays
apply."

**Park drops** (Macintosh Island, Helen Park, any "Park", and everything under the pit-lane rule):
`PARK: wildlife and low branches - very tight. Escort only.` This goes in the text where it fits, and always in Full
details and the drawer. **Stagger**: `Stagger arrivals - the site is congested every Supercars week.` This goes in the
text only where it adds no extra text, and always in Full details and the drawer. Full details also carries D007's
event-week rules: one-way counter-clockwise circuit traffic from 00:00 Mon 20 Oct to 17:00 Mon 27 Oct, 40 km/h on
track, and 10 km/h in Macintosh Park.

The ORDER and ENTRY lines are never trimmed. For 7 messages (P01, P03, P04, P05, WC27, WC60, and WC20, which is due 7
Oct), the room they take means the delivery-details link moves to Full details. Six of the seven are already delivered.
Every due date stays. Three-text messages go from 100 to 119 of 201. Every message stays inside three plain texts
(maximum 458 of 459).

**The drawer** shows a "Driver rules" box for each reference a rule touches. It lists the order, whether each
prerequisite is in place on the record, the way in, the park caution and the stagger.

**Checked against what has already been done** (the record's on-site times, AEST). Some of these times look like when
the light was ticked, not when the truck arrived, so treat them as "check" rather than a finding:

| Rule | On the record | Reads |
|---|---|---|
| P03 → P01 | P01 08:00, P03 08:30 on 14 Sep | out of order |
| P01 → P05 | P01 08:00, P05 09:00 | in order |
| P05 → WC05 | P05 09:00, WC05 16:45 | in order |
| WC05 → P04 | P04 12:00, WC05 16:45 on 14 Sep | out of order |
| GN21 → GN20 | GN20 07:23, GN21 10:49 on 30 Sep | out of order |
| tank first | WC27 and WC60 done; **WC20 due 7 Oct** carries the tank rule | — |

### Firm instructions before anyone leaves (dispatch)

No driver leaves the pick-up point without **both**:
1. the drop-off location on the map (a pin, a placed position or the master plan);
2. a direction point to head for: the way in (a pinned turn-in, the pit lane rule, or the Main Beach Pde entry end).

- **Every Full details** carries `DISPATCH: no driver leaves the pick-up point without firm instructions - the drop-off
  location on the map AND the direction point to head for (the way in). If either is missing, the truck holds until
  the site team gives it.` Then `READY TO SEND` or `NOT READY TO SEND: <what's missing>. Hold the truck.`
- **The drawer** gets a Dispatch row: green "Ready to send", or red "NOT READY TO SEND", pointing to the existing
  **Pin the way in** button.
- **The text**: with no location it already says "Location not yet confirmed. Please contact the site team before
  departure." With a location but no way in it now leads with `HOLD: way in not set - do not leave until site gives
  it.` No due date is lost.

**Where we stand (116 deliveries still to come):**

| | Count |
|---|---|
| Ready to send (location and way in) | **19**: GN13, GN24, LTC05, LTC06, LTC09, LTC10, LTC11, LTC14, P45, P69, WC09, WC20, WC23, WC26, WC28, WC57, WC61, WC62, WC73 |
| Location on the map, no way in | 58 |
| No location and no way in | 39 (the ones the map audit found on no drawing) |

Only one way in has been pinned on site so far. **This is the main job before the next deliveries:** pin the way in
for the 58, and get locations for the 39. I haven't guessed a gate for any of them. A gate that's closed by barriers on
the day would send a driver the wrong way. `window.gc500NotReady()` lists them with what's missing.

### Before the driver sheets print

**Drivers ▾ → All loads / Load N** (the PDFs the transport team downloads, prints or emails) now opens a short check
first. Nothing is made until it's done. The install-team sheets and the pre-start aren't held up.

- **What the page knows, in one box.** Green: "All 6 items have a drop-off pin and a way in." Or red: "6 items not
  ready to send - set them here at the branch in Edit (the drop-off on the map, and the way in) - the sheets update with
  them". Each red item is one tap from **Fix in Edit ›**, which opens that item, where the existing **Place it from
  outside** and **Pin the way in** buttons are.
- **Four plain ticks:**
  1. Anything in red is fixed in Edit first, or it stays in the yard until it is. (When all are green: "Every driver has
     a drop-off pin and a way in.")
  2. Leave times work: in before 07:00, or on the road after 09:00. No travel 07:00-09:00 or 16:00-18:00.
  3. Loads go in order. Waste tanks before toilet blocks.
  4. I have talked each driver through their sheet. If anything looks wrong on the day, they stop and call site.
- **Checked by** (a name, remembered on that device). The button stays locked until all four ticks and a name are in.
- **Every sheet** then carries, small, at the foot: `Checked by <name> · 02 Oct 2026, 05:10 · drop-off, way in, times
  and order`. That's the responsibility, on the paper. It's only stamped for 15 minutes after the check, so an old
  check never lands on a later print.
- Tone: "A quick check - about 30 seconds. You're the last set of eyes before a truck leaves the yard. Thanks for
  getting it right first time." Footer: "Safe, clear, on time. If in doubt, stop and ask."

Screenshots: `evidence/print_check_desktop.png`, `evidence/print_check_phone.png`.

### Does every reference have a drop-off? (checked, 197 references on the live record)

| Drop-off | References |
|---|---|
| Exact: master-plan position | 139 |
| Exact: pinned on site | 2 |
| **Area only** (master-plan zone, not a spot) | **23** |
| **None** | **33** |

**Not yet. 56 references have no exact drop-off:** WB 15, T 23, LT 6, PG 4, WC 3, GN 2, FL 2, NVLT 1. The 17 area-only
and 22 with none that are **still to come** are the ones to place at the branch before their sheets go out:
GN25, GN?, LT01-LT06, PG01, PG03, PG05, PG29, WB04-WB07, WB13-WB20, WC10, WC85, T0089, T0258, T0103, T0265, T0266, T0128,
T0158, T0159, T0162, T0268, T0169, T0170, T0176.

**A bug this found, now fixed.** The driver sheet put a master-plan *area* ahead of a position placed at the branch. So
"Place it from outside" changed the text and the map but **not the sheet**. Now the order is: a pin on site, then a
master-plan unit position, then a placed position, then an area. A branch placement reaches the sheet, the text and
Navigate together (test D5). A master-plan unit position still wins over a placement, as it already did in the text.

### Loading at Kingston

Every Full details and drawer carry:

`LOAD: loaded and away from Kingston by 05:00, in the delivery order - about 70 min to site. NO travel to the Gold
Coast 07:00-09:00 or 16:00-18:00 - be in before 07:00, or travel after 09:00.`

The text carries a short `LOAD: Kingston by 05:00, in order.` only where it fits inside three texts (P01 and P05
today). It never displaces the due date. The 70 minutes is the page's own planning figure (`transport.kingston_run`:
46.7 km straight line × 1.25 at 60 km/h + 10 min), not a live time. The schedule's `load_time` is read as the time the
truck is loaded and leaves Kingston, as `transport.time_meaning` (11 Sep) already says.

**The load check** (drawer and Full details, units still to come) flags a load that:
- leaves Kingston after 05:00;
- puts the truck on the road in a no-travel window (when the delivery has no time asked for; with one, the time check
  below makes the call);
- loads a waste tank after (or alongside) its toilet block;
- doesn't leave after the truck before it in the sequence (same slot = not staggered).

A unit already on site gets no check, so finished work shows no noise.

### The time is an unloaded-by time

The time on a delivery (the drawer's time field) means **the truck is unloaded by then**. Unloading takes **at least 30
min**, and the truck can't be on the road to the Gold Coast **07:00–09:00 or 16:00–18:00**. So the page works back:

| Unloaded by | On site by | Leave Kingston by (loaded) |
|---|---|---|
| 07:00 | 06:30 | 05:20 |
| 09:00 | **07:00** (no travel 07:00–09:00) | 05:50 |
| 10:00 | **07:00** | 05:50 |
| 10:30 | **07:00** | 05:50 |
| 10:40 | 10:10 | 09:00 |
| 12:00 | 11:30 | 10:20 |
| 18:30 | **16:00** (no travel 16:00–18:00) | 14:50 |

- **Every Full details** carries: `TIME: the time given is when you must be UNLOADED by - not when you arrive. Unloading
  takes at least 30 min, so be on site 30 min before it - and no travel to the Gold Coast 07:00-09:00 or 16:00-18:00, so
  a run that would hit those hours comes in before them. Miss it and the other crews wait, or the area is closed
  (barriers in, no traffic control). Time frames must be kept.`
- **The text** for a delivery still to come reads `Due Fri 16 Oct 2026, on site by 07:00, unloaded by 09:00`. If all 99
  still-to-come texts were given a time, none would lose its due date.
- **The drawer**: the field is labelled "Unloaded by (the time asked for)", hint "on site at least 30 min before". The
  Time row reads e.g. "Unloaded by **09:00** - so on site by **07:00** (no travel 07:00-09:00, so in before 07:00),
  leave Kingston by **05:50**, loaded before then".
- **Timeline cards, the running sheet and the printed card** say "unloaded by" for anything still to come.
- **Delivered records keep their own words** ("on site 07:00"). The 50 times on the record are all on delivered units,
  and some look like stamps (14:36, 14:37), so they aren't relabelled.

**The time check** (units still to come with a time): when the truck reaches site from its scheduled departure; red if
it's on the road in a no-travel window, lands after the unloaded-by time, or leaves less than 30 min to unload. Each
gives the "Leave Kingston by" time. Today no delivery still to come has a time or a load time, so it's quiet until one
is entered. On the 14 Sep plan as if still to come (all 07:00): P03/P01 (04:30) on site about 05:40, 80 min to
unload; P05 (05:00) 06:10, 50 min; WC05 tank (08:30) on the road in the no-travel window; WC05 toilet block and P04
(09:30) land after 07:00. All of those should have left Kingston by 05:20.

**Something to settle:** `transport.arrival` (11 Sep) says "however early a truck loads, it reaches the Gold Coast
after 07:00", while 24 delivered units carry 07:00. With the new rules that note no longer holds for an early time. I
haven't changed it.

## 3. Done on the map

- **Master plan and drawing sheets** (the page): a finished unit's green tick (all its Complete ticks) now **beats
  twice and rests**, every 3.2 s. Nothing else on the map moves like it (the amber light breathes, and a search ring
  is orange). Reduced motion keeps the tick still.
- **Plan on satellite explorer** (the Map tab's default view; the machine file `explorer/explorer.js`): a **✓ Done**
  chip under Find, on by default, with the count and a one-line key ("green tick, double beat = finished"). Each
  finished unit gets a green tick badge and a thin green ring that beats twice and rests, all in step. The rings stay
  still while the map is moving. The chip hides the layer, and the choice is kept on that device. The list comes from
  the page (`gc500DoneKeys`) every 4 s, so a new tick shows without a reload.
  Screenshots: `evidence/explorer_done_desktop.png`, `explorer_done_close_desktop.png`.

## Build

```
bash toolchain/build.sh v7.82 v7.82_maps_accuracy_and_driver_rules_DRAFT/patch_v782.py
python3 v7.82_maps_accuracy_and_driver_rules_DRAFT/patch_explorer782.py <live explorer/explorer.js> v7.82_maps_accuracy_and_driver_rules_DRAFT/release/explorer/explorer.js
```

- **Page:** 8,694,336 bytes, SHA-256 `e8a25aca9e776b927c5d7444581876c2ab909d6818e331c4b71cdd9605ea6f10`, on live
  `303029e3…`; check_page PASS, no keys.
- **Explorer:** `release/explorer/explorer.js`, 127,456 bytes, md5 `c7238da1d48709a36866a2ac8fa39684`, on live md5
  `1407e270…`. Only this one machine file changes.

## Results — on the final page `e8a25aca…` (rerun after Andrew confirmed P47 and set the six-truck sequence) and explorer `c7238da1…`

| Check | Result |
|---|---|
| `evidence/rules_tests.js` (18): GN21 beside GN20; every generator on its orange symbol; order lines; waste tanks; Main Beach seaside/land side; Full details; drawer box; park caution; the order check against the record; the done tick's double beat on the master plan; the explorer's finished list; no due date lost; no page errors | **18/18 desktop · 18/18 phone** |
| `evidence/explorer_done_tests.js` (6): the live explorer with this explorer.js swapped in. Done chip on by default with the count; every finished unit has a double-beat ring; the chip hides the layer and remembers it; a new tick shows without a reload; the Find chips still work; no page errors | **6/6 desktop · 6/6 phone** |
| v7.80 Fencing card checks | **5/5** |
| v7.75 fresh-after-save checks | **11/11 desktop · 11/11 phone** |
| The released P&L suite | **31/31 desktop · 31/31 phone** |
| Codex's v7.76 navigation regressions | **21/21** |
| Sweeps | **21 tabs, 7 deep links, 0 page errors, 0 console — desktop and phone** |
| Codex's v7.79 Text it checks | **21/23**. The two misses are this release's intended changes: (1) "master-plan provenance" — P47 now reads "(confirmed by the project manager)" instead of "(master plan)", because the master does not draw it; (2) "every link that fitted still fits" — the 7 messages where an ORDER/ENTRY line takes the link's room. Every other check passes, including no due date lost, GSM budget (max 458 of 459), welcome, navigation, GPS, access, unresolved destinations and no writes. |

Every test is read-only: GETs only, writes aborted, and no texts sent.

**Claude: complete on page `e8a25aca…` and explorer `c7238da1…`. Handed to Codex for review.** Release, once both have
reviewed: the page upload, plus the one machine file `explorer/explorer.js` (Codex's edit key). Not ready to upload
before then.

## For Andrew to confirm

1. The seaside entry: "in at the Seaworld Dr roundabout end, drive south" is how I read your marked map. Your red line
   also shows the approach from Southport along the Gold Coast Hwy, over the bridge and along the Broadwater edge. The
   text states only the entry end; I can add the approach if you want it.
3. "Done" means the Complete tick.
4. The seaside and land-side lists above. Tell me any drop that's on the wrong list.
