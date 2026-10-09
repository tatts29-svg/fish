# v7.48 — Text it says what it is and where it goes (DRAFT: built and tested, not live)

Author: Andrew Fisher · 30 Sep 2026

Andrew: "I want to have the text function work so when I text and send, it will send them, for example, the P41,
what it is — toilets — and the GPS coordinates of where it goes."

## Where it is up to

Built on the live page (v7.45, 8,386,166 bytes) and tested. **Not uploaded**: Claude's container had no
`GC500_EDIT_TOKEN`. Whoever has the key: rebuild on the live page (`toolchain/build.sh v7.48
v7.48_text_it_says_what_and_where_DRAFT/patch_v747.py`), rerun `evidence/practice_tests.js` and both sweeps, upload
with `toolchain/upload_page.py`, rename this folder `_LIVE`, update `STATUS.md`. The patch only touches the Text box
(`dropSmsText`, `smsDropBox`), so it sits on top of v7.46 (GN20 price) without conflict.

## What was wrong

- The text was the email's words: about 10 lines and 650–700 characters. **The service refuses a text over 480
  characters**, so Send could not work for most references.
- It used "—" and "·", which are outside the plain text alphabet: each text held 70 characters instead of 160.
- The facts a driver needs (what it is, the GPS) were in the middle. The master plan's position was worded as
  "the spot master plan D001-26003-03 pinned standing at…", and the pit lane way in was missing.
- Editing the words did not change what "Open a text message" sent.

## What it does now

```
Coates GC500: P41 - Portable building (Building 6m) - QFES Crib Room
GPS: -27.983593, 153.425652 (master plan)
Maps: https://www.google.com/maps/dir/?api=1&destination=-27.983593,153.425652&travelmode=driving
Way in: off the Gold Coast Hwy into the pit lane at its north-west end, then down it the way the race cars go.
Due Wed 23 Sep 2026, on site 07:00
Pictures: https://gc500-production.up.railway.app/v/Coates-GC500-2026#asset/P41
```

- Always: reference and what it is; GPS with where it came from (master plan / pinned on site within N m / placed
  on the map / the area); a Maps link for driving directions; the way in where the pit lane rule or a pinned turn-in
  applies. Then the day and the pictures link only while it stays inside three texts.
- No position recorded: it says so and asks them to ring. It never invents a coordinate.
- Plain characters only ("VMS × 8" reads "VMS x 8").
- The Text box shows a live count (characters and texts). "Full details" swaps in the old long version and back.
  Send is greyed out while the words are over the service's 480. "Open a text message" follows what is typed.

## Checks (evidence/)

- `practice_tests.js` → `practice_results.json`: all 202 references. The longest is 453 characters; 119 fit in
  2 texts and 83 in 3. All are plain characters. Where there is a GPS, it equals the Navigate point exactly, and
  the 142 plan-tagged references say "(master plan)". 50 references carry the pit lane way in. 58 have no position
  recorded (light towers, water-filled barriers, several T-numbers) and say "ring for the exact spot".
- Text box on a phone (WC43, Send stubbed as switched on, nothing sent): 275 characters, 2 texts. Full details gives
  649 characters, Send greyed out; back to short, Send on. Edited words carry into the Messages link. 0 page errors.
- `sweep_desktop.txt`, `sweep_phone.txt`: see the files.
- `shot747_text_wc43_phone.png`.
