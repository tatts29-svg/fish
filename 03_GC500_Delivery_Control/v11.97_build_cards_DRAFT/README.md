# v11.97 Build cards: delivery windows and the recorded weather

Author: Andrew Fisher

DRAFT, 25 Oct 2026. The mock-up on the real page went to Andrew at 02:03 AEST. It isn't uploaded until he says yes.

Andrew, 25 Oct 2026: "Lets push our limits and do improvement with the build cards. Also we shouldc have a delivery window can we mention this Delivery booked betweem this time and this time".

## What changes (Build tab only, nothing recorded)

1. **Every load with a Coates booking text** says "Delivery booked between HH:MM and HH:MM". It also says if the delivery was re-booked, e.g. "Re-booked 05:00–10:00 · Coates text 9 Sep 13:29". If it was re-booked to another day, e.g. "Re-booked for 22 Sep 09:00–15:00".
   - **Source.** The Coates booking texts already on the page (`ontime1057`: 126 units, texts to 22 Oct 2026 04:57). Matching is by day and reference.
   - **"One of" texts.** A text naming one of several references goes where the on-time model paired it. If that set's texts give different windows, the line says "matched by arrival order". If unpaired, the window is certain only when every text for the set gives the same window and there's one text per reference. Otherwise the line names the references, e.g. "one Coates text for GN04, GN10, GN19, GN24 or GN25".
   - **Texts that share a window** share one line.
   - **Loads with no window.**
     - Event Portables' own loads and team gear show nothing.
     - A Coates delivery that came with no booking text says so.
     - No time is ever made up.
2. **Every Build day card with a booking text** gets a row after DAY'S DELIVERIES.
   - The row reads "Deliveries booked between 04:30–13:30", from the first window's start to the last window's end, with how many texts that is.
   - Below it is a 04:00–18:00 time line. Each booked window is a bar.
   - The marks on the bars:
     - a green dot means done in the window;
     - an amber dot means done late, with a dotted line showing how late;
     - a red ✕ means not delivered;
     - an arrow means done on a later day;
     - an outline bar means there's no delivered text.
   - Every mark is the on-time model's own figure (`ontime1057.model(iso).counted`), never recounted.
   - The card's read-out names the windows before "Weather:".
3. **Card weather for 10–22 Oct.** These cards said "History unavailable". They now take the Bureau of Meteorology Gold Coast Seaway daily observations, station 040764.
   - The file is `IDCJDW4050.202610`, prepared 06:26 UTC on 24 Oct 2026 and retrieved 2026-10-24T15:42:41Z. Its snapshot hash is in `history1197.json`.
   - `weather1197.py` converts it by v9.84's rules. It reproduced all 33 archived rows from the Bureau files first: September in full, and 1–9 Oct from the new October file. Fog on 12 Sep and 6 Oct was compared without the sky fields, which v9.84 took from a second source.
   - The 13 new days go into the v9.84 archive under their own source entry. The archived rows are untouched.
   - The new days classify no sky conditions, which is v9.84's rule. None are partial.

Footer reads v11.97. No record, rate, servicing, crew card, QR code, map position or server change.

## Files

- `cards1197_src.js`: the core (`BW1197` when no document) plus two wrappers.
  - `timeline846Line`: puts the band at the end of the load's references. The v9.91 load cards move those whole into the card summary.
  - `BuildCards984.html`: puts the row before Coates on time.
- `cards1197.css`: styles in the card's own type and rules, with phone widths.
- `weather1197.py`, `history1197.json`: the Bureau conversion and the 13 added days.
- `patch_v1197.py`: the patch. It accepts only the exact live base below.

## Base and candidate

- Base: live v11.95 (Codex) `5868677a6bb4a59b4a9ffb6c8b2014a5be0b07661dfafeec74f8e149d1e3000b`, 21,995,841 bytes.
- Candidate: `938bb27a43e7d7e9dc82235189dfc6f49b35a8b8aba271bf35d4b3602bc84e98`, 22,031,947 bytes, 189 inline scripts. `check_page` passes.

## Checks

| Check | Result |
|---|---|
| `tests/test_rules1197.cjs` | 30/30 |
| `tests/test_native1197.cjs` desktop | 22/22 |
| `tests/test_native1197.cjs` phone | 22/22 |
| Sweeps, desktop and phone | 27 tabs, 19 shown, 7 routes and Back; 0 errors; 0 writes |

- **Rules test** runs on the real booking texts in the built page. It checks:
  - every wording case: re-booked the same day, re-booked to another day, one window shared by two texts, two kinds on one load, "one of" certain, "one of" unpaired, the on-time pairing, Event Portables, team gear, no booking text;
  - the day model and its lanes;
  - the weather extension against the v9.84 archive and the Bureau figures;
  - no phone numbers, no assistant names.
- **Native test** reads the live record and writes nothing. It checks:
  - 46 cards, 23 with booking texts, one row each, none elsewhere;
  - every row placed after DAY'S DELIVERIES;
  - every dot, ✕ and arrow equal to the on-time model's count (110 dots);
  - the wording on 14 Sep (P05, WC05, P01) and on 8 Oct (Event Portables nothing, Coates WC09 windowed);
  - the 14 Oct weather from the Bureau, with no card left saying "History unavailable";
  - two redraws and the Details toggle never doubling anything;
  - Demob carrying no rows;
  - no sideways scroll, 0 page errors, 0 writes.

Evidence: `evidence/` holds the mock-up screenshots sent to Andrew, with staff names blurred.
