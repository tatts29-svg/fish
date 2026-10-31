# v11.87 Message the servicing teams

**LIVE 24 Oct 2026 17:29 AEST.** Page `b18acda01b96e653ff39612f12ed2dae29123d0dded5e8757fd680ac8b13bdfa` (21,908,533 bytes) on base v11.86 `b8366b09…`, guarded upload; the view link serves the build byte for byte. On the live page `tests/test_native1187.cjs` passed 35/35 desktop and 35/35 phone (nothing sent); `/health` v5.92, crew groups 1, 215 completions (tonight's first ticks arriving). Screenshots in `evidence/live/`.

Author: Andrew Fisher · 24 Oct 2026

Andrew, 24 Oct 2026 (this chat, about servicing): "Please make sure the services is functioning and improvements are done. Lets do a
message to if things are missing. We can message each team and let them know. 5 teams when u message its send message to both..
clear simple and easy."

## Checked first (read only, 17:00 AEST)

- **Server:** v5.92 healthy: `crew_groups_version` 1, 213 completions saved, no refusals.
- **Tracker:** the event tracker reads cleanly in the Servicing tab: 15 areas, 74 places, 83 lines, 265 units.
- **Crews:** all five groups are on the crew card.
- **Fri 23 night** finished at 78%: pump out 94% (12 places missed), clean & restock 74% (18), water 65% (24).
- **Sat 24 night** had not started.

## What changed

The **Servicing tab** (edit link, event tracker only) has a new card, **Message the teams**. It sits straight under the pump /
clean / water meters on a phone, and after the job meters on a computer.

**The five crews.** These are the crew card's own groups:

| Crew | People | Jobs in their message |
|---|---|---|
| Cleaners | Kev & Cassie | clean & restock (+ final lock-up on Sunday) |
| Pump truck | AJ & Kelly | pump out (+ final lock-up) |
| Pump truck | Sa & Mark | pump out (+ final lock-up) |
| Pump truck | Damien & Keegan | pump out (+ final lock-up) |
| Water truck | Kim & Chad | water check & refill (none on the final night) |

**The card.** Each row shows how many places are still to do on the selected night for that crew's jobs. Once the night has
closed at 08:00, it shows what was **missed**. It also shows how many places that crew saved itself tonight. Tapping **Message**
opens a drawer:

- **Numbers.** One mobile for each of the two people, kept **on this phone only** (localStorage). They are never written to the
  record, the page, the repo or a log.
- **The message.** It is ready to send and can be edited. Places are listed under their area numbers, within the service's
  480-character limit. A long list folds to whole areas, then "+ N more in Areas 5-14 (see Not done yet on the servicing card)".
- **Areas in the message.** This is folded away by default. Untick an area, for example when another pump truck is doing it.
- **Send to both.** This goes through the service's own texting (`/api/sms`), the same route and handling as the v7.77 Text drawer:
  - a result for each number, and **Check delivery**;
  - locked after sending, so there is no double send.
- **Text from my phone instead** opens the phone's own Messages with both numbers and the words.
- **Copy the words** copies the message.

When everything is done, the button reads **Say thanks** and the message is a thank-you.

An example (from the test fixture):

```
Hi AJ & Kelly - GC500 servicing, Sat 24 night. Still to do - pump out (4 places):
Area 1 Pit Lane: WC12 x4
Area 3 Island West: WC07 x20, T0024 x2
No area yet: WC100 x2
Please get to these and scan the QR at each one when done. Thanks, Andrew
```

**Not changed.** Every count comes from `SvcState` on the panel's own reading (`SvcScope1170`'s active list), so the card always
agrees with the meters. There is no change to the record, the tracker, ticks, the crew card HTML, signed QR links, the server,
charges or the servicing count.

## Checks

- **Toolchain:** PASS, 180 inline scripts.
- **`tests/test_rules1187.cjs` 57/57:**
  - the build equals live plus this block and the footer;
  - job mapping per crew, night and final;
  - pending, undone and voided ticks still count as missing;
  - each pump truck is credited only with its own saved places;
  - the wording for open, missed, nothing left and no jobs;
  - 480 characters and plain text for every crew and night;
  - folding;
  - card escaping;
  - number and link formats.
- **`tests/test_native1187.cjs` 35/35 desktop and 35/35 phone,** in the real Servicing tab on the real tracker reading (GET only).
  Every `/api/sms` call is answered by the test, so nothing is sent. It checks:
  - the card's place and counts, and that it does not overflow;
  - the drawer: names and numbers, the one-number, half-typed and both-numbers states, and the areas;
  - the exact POST body and headers, and the per-number results;
  - delivery, the lock, numbers kept and restored, Escape;
  - texting switched off: phone and copy only;
  - losing the edit link removes the card and the drawer;
  - 0 page errors, 0 record writes.
- **Full sweeps** desktop and phone: 27 tabs, 19 shown, 7 deep links, Back; 0 errors, 0 writes.
- **Phone and desktop screenshots** are in `evidence/` and were inspected.

```
toolchain/build.sh v11.87 v11.87_message_teams_LIVE/patch_v1187.py
PAGE=build/GC500_v11.87/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.87/base_live.html node v11.87_message_teams_LIVE/tests/test_rules1187.cjs
PAGE=build/GC500_v11.87/GC500_Delivery_Control_hosted.html [MOB=1] node v11.87_message_teams_LIVE/tests/test_native1187.cjs
```

Built on live v11.86 `b8366b090459abf3e2e571ab995551b81355c4f2f23a294749eb9eab64588840`. Implemented and tested by Claude, for Andrew;
not reviewed by Codex.
