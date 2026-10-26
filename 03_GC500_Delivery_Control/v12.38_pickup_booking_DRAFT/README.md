# v12.38: the Demob tab, one card per asset

Author: Andrew Fisher · 26 Oct 2026 · built on live v12.37 (`d0c7d444…`, Codex's supplier crew actuals; v12.38 touches none of it)

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

- a **waste tank stays on its toilet's card** (Set 1 tank with Set 1 toilet);
- **water barriers** (and ground mats) stay one card a run, with no asset number on each;
- **what is inside a building** is listed on the building's card.

So WC09 is 2 Coates toilet blocks in our list and 16 Event Portables units (10 FWF, 6 pee panels) under Event Portables. WC31 is the Coates accessible toilet and the two Event Portables 16 Pan blocks.

**Each card** carries:

- the icon of what it is: generator, lighting tower, message board, portable toilet, accessible toilet, pee panel, toilet block, waste tank, building, ticket box, boom lift, scissor lift, forklift, fridge, chair, barriers or mats;
- its asset number (and rego), owner, where it is, the day it arrived, size and weight;
- two map pictures, close up (190 m) and wider area (840 m). These are the page's own "on the map" pictures, with the icon and a pulsing ring on the spot. Tap either for the full card (Navigate, Send).
- Navigate, Text, Email and Send (the two pictures and the words to the phone's share menu);
- its Ready light (Not ready · Ready · Picked up) and its booked pick-up.

**Not ready until ticked.** A unit reads Not ready until someone ticks it Ready (or Emptied, for a toilet), or it has left. A unit's own tick, the reference's tick and Emptied are compared by time, and the newest stands. Nothing reads "Not checked yet".

**Every VMS board, 24.** Each shows its asset number, its rego and where it stands now, from the pins on the record. VMS 02, 03, 05 and 07 are at their 02a/03a/05a/07a pins, and boards 13–17 show where they go after the race. VMS 21, 22 and 24 (Premiair 97T, 445T, 450T) are on the VMS plan but are not units on any delivery reference, so their cards come from the VMS plan; Ready and booking for those three open once they are on a delivery reference.

**Book the pick-up.** On the edit link, every card on site has **Book pick-up**. It opens a sheet with:

- a **calendar** for the day: demob days marked, past days shut, nothing picked until you pick;
- a **clock** for the time (hour, then minutes), or type it (07:30, 0730, 7);
- a note (who is collecting);
- "Book all N <supplier> units at <reference>" to book every one of that supplier's units there at once.

Save, Clear booking and Cancel. The view link shows bookings and cannot change them. **Booked pick-ups** lists every booking by day and time; it is built only from what people have booked.

**Find and filter.** Find any asset number, GC500 ID, VMS number or rego; filter by Not ready / Ready / Picked up / Booked. The group chips jump to each group.

**The days: only what was booked or picked up.** A day card counts **Booked**, **Ready of booked** and **Picked up**. It lists each line with its reference, a description, its asset numbers and the time, e.g. "GN10 · 20kva generator · 1283681 · 07:40". A day's list holds only the units booked for it or picked up on it. The schedule's own plan (toilet runs, trucks, run sheets, "confirm the proposed", planned counts) is put away.

**The progress lit up.** The same figures as before (units off site, references fully gone, the demob days, the even pace), now with:

- a glowing ring and line, and today's point pulsing;
- **five stars** that light as the demob completes, one for every 20% off site, the next one glowing as it fills.

## What is written to the record

Two new fields on a reference's delivery record, each unit on its own clock, only when someone presses on the edit link:

| Field | What it holds |
|---|---|
| `ready1238_units` | `{unit: {on, at, by, why}}`: the unit's own Ready / Not ready tick |
| `pickup1238_units` | `{unit: {at, note, by, set}}`: the booked moment in Queensland time (`""` once cleared); `set` is its clock |
| `ready1238_history`, `pickup1238_history` | every tick and booking (400 at most) |

`mergeRecords` keeps, unit by unit, the later stamp (a tie goes to the larger record); the histories join; a record holding only these is kept (`deliveryEmpty`). A unit is keyed `owner|asset number`. No departure, Emptied, charge, QR or tracker change.

## Files

| File | What it does |
|---|---|
| `singles1238_src.js` | The cards, the owners, the Ready light and the booking (calendar and clock), the pictures, find and filter, booked pick-ups, the day cards and a day's list. |
| `glow1238_src.js` | The progress card lit up, with the five stars. |
| `patch_v1238.py` | On the verified live v12.37 page, 8 edits: the unit merge and histories in `mergeRecords`; `deliveryEmpty`; v12.36's overview and progress give way; v12.36's count names assets; v12.36's watcher leaves the new parts alone. It inserts both modules and changes the footer v12.37 → v12.38. |
| `tests/test_v1238.cjs` | Part A: the live record on the view link. Part B: a unit's Ready tick and its booking rehearsed with the sync held in the page, and the merge proven on copies. |

The earlier drafts of this release (`pickup1238_src.js`, `cardpics1238_src.js`: per-reference booking and three pictures) are superseded and removed.
