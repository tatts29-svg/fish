# v10.59 — late loads named by reference and description; arrivals on the day they came; the checked figures (LIVE)

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026: "Do we know what was late and by how late is what we need to know what was late. What description
it relates too"; "the swivel chairs turned up on the correct day. So did the fridges"; "What dates they should of had
turn up. Have it as those dates".

- **Part A** (`part_a_latedesc.py`): Coates on time names each late or failed load by its reference and description, in
  More info ("P60 Gate 5 Ticket Box · Ticket box · window 05:30–08:30 · done 08:56 · 26 min late") and on the card (up
  to three, then "+n more · More info"). A "one of" booking the site record pairs is named as that reference. A
  reference with no description shows its item (never a location string).
- **Part B** (`part_b_arrived.py`): `arrivedOn1059.set(key, iso, why)` adds one day-only entry to the light history, in
  the record's existing form (T0266's): 00:00 that day, `date_only`, `effective_date`, `recorded_at`. Every past-day view
  counts the item from that day; a light set after it is not a second arrival; no screen prints 00:00. It refuses on the
  view link, for today or later, a bad date, a light the record does not hold itself, or a light that changed after that
  day. The screens that read the light history were classified by an independent review (106 sites + a critic).
- **Part C** (`part_c_checked.py`, data `ontime1059_units.json`): the independent check's three confirmed fixes. P16
  counts on 21 Sep (re-booked mid-window), 34 min late, so 21 Sep 22% (2 of 9) and 22 Sep 0 of 1; WC17's "Both toilets
  turned up 08:00" times both units; the 13 Oct rough-terrain forklift is T0109 (on time). `build_ontime1057.py` gained
  `RE_BOOKED` and the T0109 `REVIEWED` entry.

## Build and checks

```
bash toolchain/build.sh v10.59 v10.59_late_desc_arrived_DRAFT/patch_v1059.py
python3 toolchain/upload_page.py build/GC500_v10.59/GC500_Delivery_Control_hosted.html
```

- On live v10.58 `3afd6b5b…`. check_page PASS.
- `tests/test_v1059.cjs` 154/154 (desktop and phone): every figure, the named late lines and card lines, no late reasons,
  part B in page memory (14 Oct 11/14 → 14/14 with P26, P28, P34; Furniture 4; arrivals read "time not recorded"; no
  second arrival on 17 Oct; T0266 unchanged; refusals).
- v10.58 `test_part2.cjs` 107/107, v10.57 `test_part1.cjs` 72/72, v10.53 `test_twinsteer1053` 36/36.
- Sweeps desktop and phone: 24 tabs (18 shown on the view link), 7 links, 0 errors, 0 console messages.
- v10.58 `test_part3.cjs` is superseded by `test_v1059.cjs` (the late-line wording changed on purpose).

## Live

Uploaded 17 Oct 2026 13:29 AEST on Andrew's "Upload" (base guard passed on v10.58 `3afd6b5b…`); the view link serves the
build byte for byte: 18,257,843 bytes, sha256 `2b06724918d04bde…`.

## After upload (done 13:30, record 9698 → 9701)

A record step (`record_17Oct2026_police_fridges_chairs/`, op `arrived`) calls `arrivedOn1059.set` for P26, P28 and P34
with 14 Oct. FR01/FR02 stay on 17 Oct, the day they came.

Performance moves to v10.61; the Map explorer shape markers are v10.60.
