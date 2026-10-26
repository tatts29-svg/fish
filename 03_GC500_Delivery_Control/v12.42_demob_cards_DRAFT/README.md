# v12.42: the Demob tab, one card per asset

Author: Andrew Fisher · 26 Oct 2026 · built on live v12.41 (`e106502b…`, Codex's performance corrections on v12.37). Built and claimed as v12.38; v12.41 went live first, so it is rebuilt on those bytes and numbered forward (Codex holds 43 and 44; the Demob map is v12.45). The source files keep their 1238 names, and so do the record fields.

**Inside v12.41's boundaries.** The cards' render and decorations enter v12.41's one asset hold (`holdAssets`) and its Demob drawing pass, so the selected date's reveal still comes last; decorations the watcher makes enter the same hold; the start-up render runs only for the pane actually showing (`Performance1241.paneActive`).

## What Andrew asked for (26 Oct 2026)

- "i want a spot someon can add the date and time when it will be picked up"; "lets not pre date anything"
- "i dont like this have singles each asset is a single item So you need to mention each. exception will be barriers and what is inside a building"; "excpetion is waste tank and toilet"
- "take out our coates toilest blocks and aset and put in our list"
- "i want everything showing no ready unless i have ticked it or stated it has been picked up"
- "i want the icons to be what the equipment is"; "2 pic for each"; "lets mention date or arrival"
- "date selction should bring up a calendar . time selction should be manual entry or with ease use a clock"
- "nothing should be on the Demob card unless we have put that date on i or its been departed on that date"; "dont forget descriptions"
- "ensure we add all VMS boards"; "the grapgh i want light of even the 5 stars"; "we want colour and glow and pulsate in this demob area"

## What the Demob tab shows now

**Everything on site: one card per asset.** The units come from the record itself (each unit's owner, asset number and, for a VMS board, its board number and rego). Coates' own units, and any owner still to confirm, are in **Coates · our list**; sub-hired units are under **Sub-hired**, by supplier (Event Portables, Premiair Hire, …). Inside each, the groups: generators, lighting towers, buildings, toilets, water barriers, VMS boards, plant, ground protection, furniture.

The exceptions, as Andrew set them:

- a **waste tank stays on its toilet's card**, paired only on the record's word: its label names the toilet or the set (WC20), the reference's note pairs them (WC60: "Toilet block 1119489 with waste tank 1328980; toilet block 1087500 with waste tank 1328981"), or one tank and one block are left once the rest are paired (WC05). Otherwise the tank has its own card;
- **water barriers** (and ground mats) stay one card a run, with no asset number on each;
- **what is inside a building** is listed on the building's card: the air conditioners, fridge and chairs the record keeps there, as units or accessories, never as cards of their own (P01 is one card, with its fridge and two air conditioners on it).

A unit the record has not identified yet still gets a card ("Asset no. to confirm"), so a reference never shows fewer units than it holds. A run the record holds as **not on site**, with nothing collected, is left off (WB19, WB20).

So WC09 is 2 Coates toilet blocks in our list and 16 Event Portables units (10 FWF, 6 pee panels) under Event Portables. WC31 is the Coates accessible toilet and the two Event Portables 16 Pan blocks.

**Each card** carries:

- the icon of what it is: generator, lighting tower, message board, portable toilet, accessible toilet, pee panel, toilet block, waste tank, building, ticket box, boom lift, scissor lift, forklift, fridge, chair, barriers or mats;
- its asset number (and rego), owner, where it is, the day it arrived (the page's own arrival: the latest time it was set on site, never a rescheduled delivery day), size and weight (each unit's own: on a mixed reference such as WC09 the FWF guide is on the FWFs, not on the Coates toilet blocks);
- two map pictures, close up (190 m) and wider area (840 m). These are the page's own "on the map" pictures, with the icon and a pulsing ring on the spot. Tap either for the full card (Navigate, Send).
- Navigate, Text, Email and Send (the two pictures and the words to the phone's share menu);
- its Ready light (Not ready · Ready · Picked up) and its booked pick-up.

**Not ready until ticked** (Andrew, 18:30: "everything ticked not ready. Unless i have done so or if its been collected already"). A unit reads Not ready until it is ticked Ready (its own tick on its card, or a Ready tick on its whole reference where one owner holds every unit there), or it has left. At a reference with two owners (WC09, WC31) a tick on the whole reference is not a tick for any one owner's units: each unit needs its own. Its own tick and the reference's are compared by time, and the newest stands. **Emptied** (pumped out) is the gate a toilet passes before it can be loaded, never a Ready tick: on its own it makes nothing Ready, at a mixed reference or anywhere else; the card says "emptied; tick it Ready when it can go". Nothing reads "Not checked yet".

**Picked up** opens the page's own Record departure form with that unit (and its waste tank) already ticked. A toilet is loaded only once pumped out, so if the reference has no Emptied tick the question says plainly that Emptied covers the whole reference.

**The collection stamp.** A unit that has left carries a big **Picked up** stamp in place of its pictures: neon green, tilted like an ink stamp, glowing and pulsing (a slow glow and a ring that ripples out; still for anyone who has reduced motion set, and plain on paper), with the day and time it left and who recorded it.

**When it left.** Each unit takes its own departure (by its unit id or asset number); then a type with none remaining has all gone; a departure counted without numbers goes to units the record has not identified, never to a numbered unit (the card says "N left without an asset number: which one is still to confirm"); a reference that has left in full gives any unit still unmatched its last departure. A toilet block whose tank has left (or the other way round) says so.

**Every VMS board, 24.** Each shows its asset number, its rego and where it stands now, from the pins on the record. VMS 02, 03, 05 and 07 are at their 02a/03a/05a/07a pins while those are the newer pins; a newer pin back at 02 (and so on) wins. Boards 13–17 are **in storage** after the final removal morning (Mon 26 Oct, from 03:00 or 06:00), or once their off-the-track tick is in: VMS 15 at T2 runoff and VMS 16 behind 2 Breaker St on their store pins; 13, 14 (Altus compound) and 17 (T10 runoff) say their store is not pinned yet, so the pictures and Navigate show the last pin on the track. VMS 21, 22 and 24 (Premiair 97T, 445T, 450T) are on the VMS plan but are not units on any delivery reference, so their cards come from the VMS plan; they read Picked up once the VMS tab records them off site; Ready and booking open once they are on a delivery reference.

**Book the pick-up.** On the edit link, every card on site has **Book pick-up**. It opens a sheet with:

- a **calendar** for the day: demob days marked, past days shut, nothing picked until you pick;
- a **clock** for the time (hour, then minutes), or type it (07:30, 0730, 7);
- a note (who is collecting);
- "Book all N <supplier> units at <reference>" to book every one of that supplier's units there at once.

Save, Clear booking (this unit only, whatever the "Book all" box says) and Cancel. The sheet closes only on a tap on the backdrop, never on a drag out of a field. The view link shows bookings and cannot change them. **Booked pick-ups** lists every booking by day and time; it is built only from what people have booked.

**Find and filter.** Find any asset number, GC500 ID, VMS number or rego; filter by Not ready / Ready / Picked up / Booked. The group chips jump to each group. "Everything on site · N assets" counts only what is still on site, in the branch the chips have chosen, with "M picked up" beside it.

**Pictures that follow the pins.** The spot is looked up again every 30 s and each picture is kept by its place, so a moved pin moves the pictures, Navigate and the words.

**The days: only what was booked or picked up.** A day card counts **Booked**, **Ready of booked** and **Picked up** (in units). It lists each line with its reference, what left (the item's own word: "FWF portable toilet", "Pee Panel"), its asset numbers ("+k without numbers" when a count runs past them) and the time, e.g. "GN10 · 20kva generator · 1283681 · 07:40". A day's list holds the units picked up on it (by the day they left, whatever day they were booked for), the units booked for it, and any run part-collected that day (even once the rest of the run has gone on a later day); its heading counts units, the same as its day card. The schedule's own plan (toilet runs, trucks, run sheets, "confirm the proposed", planned counts) is put away, and the day-list button says "booked and picked up", never the old plan's count.

**How complete, day by day** (Andrew: "a perentage daily on the cards so we know the completion of where we are at daily with demob"). Each demob day card carries the demob's completion, from the progress card's own figures (units off site against the demob's units), so the two always agree:

- a day gone: **complete by the end of the day**, its bar showing what that day moved ("+3.9% this day · 31 units off site · 67 of 800 by the end of the day");
- today: **complete now**, today's part glowing ("+3.9% so far today");
- a day ahead: complete now, and, once pick-ups are booked for it, **where its bookings would take the demob if every booking up to that day goes** ("+1.2% booked for this day (9 units)"), shown striped. Nothing is projected from the old plan.

**The progress lit up.** The same figures as before (units off site, references fully gone, the demob days, the even pace), now with:

- a glowing ring and line, and today's point pulsing;
- **five stars** that light as the demob completes, one for every 20% off site, the next one glowing as it fills;
- the ring never reads 100% while a unit is still on site (99.9% at most).

## What is written to the record

Two new fields on a reference's delivery record, each unit on its own clock, only when someone presses on the edit link:

| Field | What it holds |
|---|---|
| `ready1238_units` | `{unit: {on, at, by, why}}`: the unit's own Ready / Not ready tick |
| `pickup1238_units` | `{unit: {at, note, by, set}}`: the booked moment in Queensland time (`""` once cleared); `set` is its clock |
| `ready1238_history`, `pickup1238_history` | every tick and booking (400 at most) |

A unit is keyed `owner|asset number`, with its unit record's key (`doc`) written beside each tick, so a tick still finds its unit if the number is corrected; a tick made while the owner was to confirm, or on the reference's one card before its units were recorded, is found the same way, the unit's own entry first.

How the copies agree:

- **On opening the page** (and on Import), `mergeRecords` keeps, unit by unit, the later stamp (on the same stamp Not ready beats Ready and a cleared booking beats a booking); the histories join; a record holding only these is kept (`deliveryEmpty`).
- **On the live sync** the store keeps whole delivery documents, the last one written winning. So as each delivery document arrives, any unit tick, booking or history line this browser holds that the store's copy has not got (or holds older) is kept, and the result is sent back up. Two phones ticking or booking different units of one reference a few seconds apart lose nothing. When this browser still has a change of its own waiting to go up for that reference, its waiting copy stands in for the store's, so the store's own copy is read as well: a unit another phone ticked there is kept, and both go up together (Codex's review, 26 Oct 19:05, reproduced and now covered by its 19-case matrix, `review_26Oct2026_v1242_sync/`, and by a test here). On the same stamp the same entry wins on every phone, as on opening (Not ready over Ready, a cleared booking over a booking), and the histories sort the same way everywhere. Nothing is sent back up while this browser cannot save (its storage full, or a damaged copy held): sends then would carry the browser's last saved copy, older than the store's. A Ready tick or booking this browser could not save says "Not saved · keep this page open", as every other writer on the page does, and the booking sheet stays open. A cleared booking is a dated entry, so a clear is never undone. Other delivery fields keep the page's existing rule.

**Known limits, left as they are** (from the independent review):

- A tick or booking on an "asset no. to confirm" card is keyed by its place in the reference's list. If that unit is later given its number on the record, the tick does not follow it; tick the numbered card again. Few units are still to be numbered this late in the demob.
- The store keeps whole delivery documents. A phone that was offline and comes back can still send an older copy of a reference's other fields (as on the live page today); the unit ticks, bookings and their histories are the fields this release protects.
- When the page leaves a reference's pick-ups out for review (its quantities changed after a pick-up), its units show on site, as the progress card counts them, and their cards say the departure record needs review.

The release writes no departure, charge, QR or tracker change itself. The Picked up light hands over to the page's own departure form, and a toilet's Emptied tick is the page's own (`setEmptied816`), asked for in plain words.

## Files

| File | What it does |
|---|---|
| `singles1238_src.js` | The cards, the owners, the Ready light and the booking (calendar and clock), the pictures, find and filter, booked pick-ups, the day cards and a day's list. |
| `glow1238_src.js` | The progress card lit up, with the five stars. |
| `patch_v1242.py` | On the verified live v12.41 page, 9 edits: the unit merge and histories in `mergeRecords`; `deliveryEmpty`; the live sync keeps the unit ticks and bookings (`syncFold`); v12.36's overview and progress give way; v12.36's count names assets on site; v12.36's watcher leaves the new parts alone. It inserts both modules and changes the footer v12.41 → v12.42. |
| `tests/test_v1242.cjs` | Part A: the live record on the view link. Part B: a unit's Ready tick, its booking, Clear on one unit, Picked up opening the departure form, Emptied at a mixed reference, and a store copy without this phone's ticks arriving on the live sync, rehearsed with the sync held in the page; the merge proven on copies. |

The earlier drafts of this release (`pickup1238_src.js`, `cardpics1238_src.js`: per-reference booking and three pictures) are superseded and removed.

## Checks

- Built on verified live v12.41 `e106502b…` with `toolchain/build.sh v12.42 v12.42_demob_cards_DRAFT/patch_v1242.py`: candidate `cc9359b726b5d08820b34014c13b934ae23cd6fbba20ee6e9f9114a675029daa`, 214 inline scripts, page check PASS.
- `tests/test_v1242.cjs`: **46/46 desktop, 46/46 phone** (`evidence/test_v1242_desktop.txt`, `evidence/test_v1242_phone.txt`). It reads the live record on the view link, and rehearses the Ready tick, the booking, Clear on one unit, Picked up opening the departure form, Emptied at a mixed reference and a store copy arriving on the live sync, with the sync held in the page: only WC09's and GN18's delivery documents were written, captured in the page, nothing reached the network.
- Shared sweeps: __SWEEPS__
- An independent review of these fixes (four lenses, each finding verified): __REVIEW__
- Screenshots in `evidence/`; staff names on the day cards are blurred, and redacted in the logs.
