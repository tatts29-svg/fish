# v11.89 Servicing: tap a place to see who did it

**LIVE 24 Oct 2026 18:28 AEST.**
- Page `e8b601db60ccb0788e258a203598bf1c480e2aa966613a05e1f5d3983acea52d` (21,938,983 bytes), built on v11.88 `f5a38360…`.
- Guarded upload. The view link serves the build byte for byte; a separate public download at 18:28:33 matched every byte.
- On the live page, `tests/test_native1189.cjs` passed 30/30 on desktop and 30/30 on phone. Screenshots are in `evidence/live/`.
- Earlier releases still pass on the new live page:
  - v11.87 `test_native1187.cjs`: 35/35 on desktop and phone (nothing sent).
  - v11.88 `test_native1188.cjs`: 21/21 on desktop and phone. One phone run first missed its "only the site plan shows" check: the plan
    card had no height yet at the 800 ms mark. On rerun it passed 21/21, on this page and on the old v11.88 page.

Author: Andrew Fisher · 24 Oct 2026

Andrew, 24 Oct 2026 (this chat): "Also i want to be able to tap on something thats already been done find out who did it. So much was
missed last night."

## What it does

This is on the Servicing tab, on the edit link, for the event tracker only.

- **Tap any place in an area table** (the reference name, or anywhere on its row) to open a sheet for that place on the selected night.
  The sheet shows each job:
  - **Done:** the time, and the crew saved with the completion: "✓ Done 21:43 · By Kev & Cassie · Cleaners".
  - **Missed, or not done yet:** whose job it is. The cleaners clean and restock, the water truck checks and refills the water, and the
    three pump trucks pump out. On the last night, the pump trucks and the cleaners pump out, clean and lock.
  - **History:** every tick, untick and cancel for the job, in order, with the crew each one carried. For example:
    "17:19 ticked (later unticked) · Kev & Cassie", then "17:19 unticked · crew not recorded".
- **On the servicing map,** a **Who did it** button sits beside "Share map + jobs" on the selected place and opens the same sheet.
- **On Message the teams,** a crew's "N done tonight" count is now a button. It lists every place saved with that crew's name.
  - The number listed is the number tapped.
  - Another crew's job saved with that name is marked "another crew's job"; a place with only those is listed apart.
  - Tapping a place in the list opens that place's history.
- **Previous nights** (Fri 23 and earlier) work the same way, from "Previous nights · saved history".

## What the record can and can't say

The crew is only what each completion carries. The crew cards started saving the crew group at **Sat 24 Oct, 10:20** (the crew page
update).

- **Friday's completions** were all saved before that. Their sheets show the job and the time, and say "Crew not recorded · saved
  before crew names were kept". **No crew is ever guessed.**
- **Friday's missed jobs** show whose job they were, by role.
- **From Saturday on,** every tick carries the crew that saved it.

## Fixed on the way

- **The area tables and the printed shift report** looked crew labels up in the reference list, which carries no crew groups. A saved
  crew printed as **"Crew group cleaners"** instead of "Cleaners — Kev & Cassie". Labels now come from the crew card's own list, the one
  the crews choose from.
  - The crews' QR pages carry their own copy and are not touched. No QR code changes.
- **In the area tables,** the crew text sat beside the time and ran into the next column on a phone.
  - It now sits under the time, people's names only.
  - "Group not recorded" is said once, in the sheet, not in every cell.
  - Reference names are dotted-underlined to show they can be tapped.

Nothing else changes: no record, tracker, tick, crew card, QR code, server or charge. The page only reads what the panel already reads.
Every component is kept as built.

## Checks

- **Toolchain:** PASS, 182 inline scripts.
- **`tests/test_rules1189.cjs` 37/37** (node, on the shared rules taken from the page itself):
  - the build is the live page plus this block and the footer only;
  - Friday: done with its time, crew not recorded, no name guessed; missed jobs say whose job;
  - Saturday: the crew saved with each completion, the full tick/untick history, a cancel shown as cancelled;
  - a tick still waiting to sync shows the crew it carries but is not counted for the crew until saved;
  - every crew's list count equals its done count on Message the teams; another crew's job is listed apart;
  - the table tidy, and buttons on the event tracker only;
  - the label fix: as live, "Crew group cleaners"; fixed, "Cleaners — Kev & Cassie"; everything else unchanged.
- **`tests/test_native1189.cjs` 30/30 desktop and 30/30 phone,** on the real page reading the live tracker (GET only, nothing written,
  every /api/sms call answered by the test, none made):
  - all 74 places tappable; no "Group not recorded" in the cells;
  - tonight's real WC57 tick and untick (17:19, Kev & Cassie) shown in its history;
  - Fri 23: WC12 done with times and "crew not recorded", PG01 missed with whose job, WC20's grouped lines open the whole place,
    a tap anywhere on a row works, the sheet fits the phone, the table stays inside its card;
  - the map's Who did it button;
  - part 3b adds two made-up ticks to the test browser's own copy of the reading (never sent, never saved, no picture kept), because
    no crew had a completion saved yet tonight. It drives the crew paths in the real panel: names under the times, the crew list,
    the place sheet, and the shift report naming the crews;
  - Escape and close; losing the edit link closes the sheet; 0 page errors, 0 record writes, 0 texts.
- **Full sweeps** desktop and phone: 27 tabs, 19 shown, 7 deep links, Back; 0 errors, 0 writes.
- **Screenshots** in `evidence/` (real data only) were inspected. The page's own tap halo (`interaction-halo1018`, 420 ms) is waited
  out before each picture.

```
toolchain/build.sh v11.89 v11.89_who_did_it_LIVE/patch_v1189.py
PAGE=build/GC500_v11.89/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.89/base_live.html node v11.89_who_did_it_LIVE/tests/test_rules1189.cjs
PAGE=build/GC500_v11.89/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node v11.89_who_did_it_LIVE/tests/test_native1189.cjs
```

Built on live v11.88 `f5a383605877e87621652520250dfbeb5006f3abf3861845b759492d534e462c`. Implemented and tested by Claude, for Andrew;
not reviewed by Codex.
