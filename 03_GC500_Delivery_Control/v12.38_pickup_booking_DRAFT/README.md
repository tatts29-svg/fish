# v12.38: the Demob cards — book the pick-up, three pictures on every card, directions to send, and every VMS board

Author: Andrew Fisher · 26 Oct 2026

## What Andrew asked for (26 Oct 2026)

- "i want a spot someon can add the date and time when it will be picked up" and "lets not pre date anything the pick up data is buil;t from this"
- "i want more pics min 3 for each and navigateion with a tex or email that send the"
- "dont forget to add VMS Boards here too please. mention their asset no and Location and rego no"

## What the Demob tab gains (on top of v12.36)

**Book the pick-up.** On the edit link every card still on site has a **Book pick-up** button. It opens a sheet with:

- a date (today ready), a time to pick, and an optional note (who is collecting);
- **Save booking**, **Clear booking** (once there is one), **Cancel**.

The booking is saved on the reference's delivery record as its own field, with who booked it and when, and a history:

| Field | What it holds |
|---|---|
| `pickup1238_at` | the booked moment in Queensland time, e.g. `2026-10-27T07:00:00+10:00`; `""` once cleared |
| `pickup1238_note` | who is collecting, or a note (80 characters at most) |
| `pickup1238_by` | who booked it ("Recording as") |
| `pickup1238_set` | when it was booked or cleared: the clock it merges on |
| `pickup1238_history` | every booking and clearing (400 at most) |

It merges on its own clock, the way the Ready tick does (`mergeRecords`): the later booking wins on any copy. A clearing is a dated change too, so it beats an older booking. The histories join, and a record holding only a booking is kept (`deliveryEmpty`).

The card says **Pick-up booked: Tue 27 Oct · 07:00**, with the note and who booked it. A card with no booking says **Pick-up time: to be booked**. Nothing is pre-dated. The view link shows the booking and cannot change it.

**Booked pick-ups**, under the demob percentage: every booking by day and time, with each one's state (Ready, Not ready, Not checked yet, part picked up). It is built only from what people have booked; tap a line to go to its card.

**Three pictures on every card.** Beside each card is the master plan (v12.36, the equipment's icon in a neon ring). Across the card are two more, drawn from the page's own site aerial with the same icon and ring on the spot:

- the **close up** (about 190 m across);
- the **wider area** (about 840 m across).

Tap either for the page's own "on the map" card (the full pictures, Navigate, Send). A place off the aerial says so and opens the satellite pictures there.

**Directions to send.** Under the pictures:

- **Navigate:** driving directions to the spot.
- **Text** and **Email:** a new text or email on the phone. It holds what it is, its asset numbers, where it is, its size and weight, how it stands, any booked pick-up and the directions link. Nothing is sent from the page.
- **Send:** the three pictures and the words, to the phone's share menu (email, messages and so on). Without a share menu the pictures are saved and the words copied.

**Every VMS board.** Under the VMS boards group, one card per board on the VMS plan:

- where it stands (the plan's own words for the position);
- its asset number and rego, as the VMS tab holds them, or "to confirm";
- On site, or Picked up with the time when its asset number has left on the departure record;
- Navigate, Text and Email.

Also: the size and weight pills' source tag ("guide") stays in one piece on a phone.

No departure, Ready, Emptied, charge, QR or tracker change. The booking is the only new thing written to the record, and only when someone books on the edit link.

## Files

| File | What it does |
|---|---|
| `pickup1238_src.js` | The booking: the field, the sheet, the spot on each card, the booked pick-ups list. |
| `cardpics1238_src.js` | The card pictures (aerial close up and wider area), Navigate, Text, Email and Send, and the VMS boards. |
| `patch_v1238.py` | On the verified live v12.36 page: the booking's merge and history in `mergeRecords`, `deliveryEmpty`, v12.36's spot on each card calling the booking, v12.36's watcher leaving the new rows alone; inserts both modules; footer v12.36 → v12.38. |
| `tests/test_v1238.cjs` | The live record on the view link (spots, list, pictures, directions, VMS boards), then the booking rehearsed with the sync held in the page, and the merge proven on copies. |
