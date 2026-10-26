# v12.42.1: the Demob cards without the "booked" zeros

Author: Andrew Fisher · 26 Oct 2026 · a point release on live v12.42 (`4737996a…`), so it sorts before Codex's v12.43.

Andrew, 22:2x: "On the cards I don't like the booked. And ready for booked as it looks like nothing had been booked." The crews pick up without booking first, so the day cards read "Booked 0" and "Ready of booked 0 of 0" under real pick-ups, as if nothing had happened.

## What changes on the Demob tab

- **Day cards.** The box says what was **Picked up** (units and the last time; a day ahead says "to come"). Today's card also says how many units are **Ready for collection now**. The Booked and Ready-of-booked rows are gone. Bookings still show as lines on the day they are booked for, and the box is then headed "Picked up and booked".
- **A day's list and its button** say "Picked up" ("and booked" only when that day has bookings). An empty day says "Nothing picked up on … (yet)".
- **A day ahead** with nothing booked shows the demob's completion now and the units off site, not "Nothing booked for this day yet". With bookings it still says where they take the demob if every one goes.
- **Asset cards** say "Pick-up" beside the Book pick-up button, not "Pick-up: to be booked". A booked card still shows its booking.
- **The Booked pick-ups panel** and the "booked" filter show only once something is booked.

Nothing else changes: the Ready rule, the stamp, the sync, the pictures and every record field are as in v12.42.

## Files

| File | What it does |
|---|---|
| `singles1238_src.js` | The cards module, from `v12.42_demob_cards_LIVE` with the wording above (release `v12.42.1`). |
| `patch_v12421.py` | On the verified live v12.42 page, replaces the v12.42 module (found exactly once) with this one; footer v12.42 → v12.42.1. |
| `tests/test_v12421.cjs` | The v12.42 tests, with the day-card, list and card checks moved to the new wording, plus checks that no "Booked 0", "Ready of booked" or "to be booked" shows. |

## Checks

- Built with `toolchain/build.sh v12.42.1 v12.42.1_demob_daycards_DRAFT/patch_v12421.py`: candidate `74e05c9a0cffa5671a58fbd982db283cb42428e1edc1dc077ad0adc7f7ac08ff`, page check PASS.
- Codex's `candidate_sync_matrix.cjs`: 19/19 (run on a copy whose footer reads v12.42, because the matrix reads two-part version numbers only; the module itself is the candidate's).
- Tests and sweeps: to follow.
