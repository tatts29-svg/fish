# v12.04 Build cards: the stamp inked like a real stamp, CLOSED off, late deliveries named, and the card tidied

Author: Andrew Fisher

Claimed as v12.01. Renumbered to v12.04 because Codex's v12.03 went live first (the footer never goes backwards). It publishes in one build with v12.05, the Servicing night report.

READY TO UPLOAD, 25 Oct 2026. Andrew saw the mock-ups on the real page and said "build it".

Andrew, 25 Oct 2026, in this chat:
- "Remove the closed and have stamp here like its been stamped with a stamp"
- "Theres is a lot saying item late. I want to know what was late"
- "Do we need ti make cards a little wider does this hekp you ?"
- Of the Build cards on his monitor: "Looks over crowded how can we fix"
- To the mock-up: "build it"

## What changes

1. **CLOSED comes off every closed day card** (Build and Demob). TODAY and UPCOMING stay on open cards.
2. **The stamp is the closed mark, inked like a real rubber stamp.**
   - Same artwork and same place in the gap beside the date, re-centred in the taller gap CLOSED leaves.
   - No glow, no screen blend, no pulse: solid ink, a fine speckle where the ink missed and a little uneven pressure.
   - Each card is struck at its own angle (-7°, -9°, -11° or -13°).
3. **A late delivery is named for what it was.**
   - When a Coates booking text names no reference, the on-time list (on the card and in More info) uses the text's own words instead of "Item".
   - The same goes for a reference with no register description. A bracket the text was cut off inside is left off.
   - On 21 Oct:
     - Knuckle Boom 61ft (18.6M) – Diesel · 1 h 21 min late
     - Straight Boom Lift 60ft – Diesel · 34 min late
     - Portable Airconditioner 4.5kW Electric · 4 min late
4. **A late time never splits across two lines** on the card ("1 h 21 min late" stays in one piece).
5. **The tidy-up** ("Looks over crowded"):
   - **One deliveries block.** On a day with the delivery-window chart, the day's deliveries figure moves into the chart's heading, for example "1/2 REFERENCES IN · 4 COATES TEXTS". Its own row comes off, so the figure shows once. The card still reads it out. A day without the chart keeps its DAY'S DELIVERIES row, and so would a day of pickups.
   - **440 px cards on a computer screen** (1280 px and wider). Phones are unchanged; a phone card is already full width.
   - The chart key on one line, without the counts (the chart shows each booking).
   - What went in as plain lines, not boxes.
   - The staff names on one line.
   - A slimmer life-saving-rule strip and a smaller Coates on time ring.
   - 8 Oct card: 1,097 px tall before; 895 px on a computer and 939 px on a phone now.

Every figure, window and time is unchanged. No record, rate, servicing, crew card, QR code or server change.

## Files

- `cards1201.css`: CLOSED off, the stamp, the one-piece late time, and the tidy-up CSS.
- `patch_v1204.py`:
  - the CSS before `steady1143-script`;
  - nine edits inside `ontime1057-script` (the naming helpers `said1201`, `kind1201`, `lbl1201`, `itm1201`);
  - three edits inside `cards1197-script`: `pack1204` folds DAY'S DELIVERIES into the chart heading and is exported on `cards1197` for the checks;
  - footer v12.04;
  - it refuses a base other than live v12.03 `682fcc85…`.
- `tests/test_native1201.cjs`: read only, 15 checks:
  - the naming rule, the 21 Oct names, and "Item" nowhere on 23 days of rows and More info;
  - CLOSED off the 46 closed cards and the Demob ones;
  - the stamp is ink at 4 angles, centred within 2 px and clear of the date, the label line and the weather;
  - 440 px cards on a computer (phone unchanged), the key on one line without counts, What went in without boxes, the 8 Oct card's height;
  - no page errors, zero writes.
- `tests/test_build1204.cjs`: the Build cards suite from v12.04 on, read only, 28 checks. It supersedes v11.99's `test_native1197.cjs`, keeping every check except three that change by design:
  - the chart row now sits straight after the whole-build progress;
  - the 14 Sep heading reads "15/15 REFERENCES IN · 14 COATES TEXTS";
  - the stamp is measured from the week label, as CLOSED is off.
  - It adds: DAY'S DELIVERIES shows once on every card, and each heading carries the same figure the card reads out.

## Where it's up to

- Rebuilt on live v12.03 `682fcc85862c2ba91c2d201b4406901d8d881f4d9e64bdc8e3ef30d00c1c0e69` with v12.05 in the same build.
- Candidate `68a8da20f7576dc58357757efdb54471967c67deb49df68265ee4bf1ed1dc895`, 15,226,860 bytes.
- Tests on desktop and phone: native 15/15, Build suite 28/28, v12.05 native 14/14, sweeps 27/19/7/Back with zero errors and zero writes.
- Next: guarded upload, public bytes check, tests on the live page, LIVE.
