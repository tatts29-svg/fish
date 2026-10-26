# v12.42.1: the Demob cards without the "booked" zeros — LIVE 27 Oct 2026 03:59 AEST

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

- Built on verified live v12.42 `4737996a…` (still live at 27 Oct 03:56) with `toolchain/build.sh v12.42.1 v12.42.1_demob_daycards_DRAFT/patch_v12421.py`: candidate `85826c9bf9fcfc5a1bf10d5464971f4bab751e89fdcdb9152bf74b67a55b0f34`, page check PASS. (An earlier candidate, `74e05c9a…`, was replaced after the independent review below.)
- `tests/test_v12421.cjs`: **60/60 desktop, 60/60 phone** (`evidence/test_v12421_desktop.txt`, `evidence/test_v12421_phone.txt`). It reads the live record on the view link and keeps every v12.42 rehearsal (Ready tick, booking, Clear, Picked up, the live-sync cases, a refused save, the same-stamp rule) with the sync held in the page. Only WC09's, WC31's and GN18's delivery documents were written, captured in the page, and nothing reached the network. New checks: no "Booked 0", "Ready of booked" or "to be booked" anywhere, the day box headed Picked up (with "and booked" only when that day has bookings), a day ahead says "To come", the booked filter goes off when nothing is booked, and the view link shows no bare "Pick-up".
- Codex's `candidate_sync_matrix.cjs`: **19/19** on this module (`evidence/candidate_sync_matrix.json`; run on a copy whose footer reads v12.42, because the matrix reads two-part version numbers only).
- Shared sweeps (`toolchain/harness/sweep.js`), desktop and phone: 27 tabs, 19 shown, 0 tab errors, 0 page errors, 0 blocked writes, 7 hashes with 0 errors, back button returns to #plant (`evidence/sweep_desk.json`, `evidence/sweep_phone.json`).
- Independent review of the first candidate. Fixed: the booked filter is cleared when nothing is booked (no blank list); the view link shows a card's pick-up line only once it is booked; a day's list counts only that day's bookings; a day ahead never says "0 picked up"; a toilet block with its tank counts the half still here.
- Screenshots in `evidence/`; staff names on the day cards are blurred, and redacted in the logs.

## Live

- Uploaded 27 Oct 2026 03:59 AEST: the view link serves `85826c9b…` byte for byte (15,773,016 bytes), confirmed by a separate fetch and cmp.
- Live tests on the live bytes, finished 04:33: **60/60 desktop, 60/60 phone** (`evidence/test_v12421_live_desktop.txt`, `evidence/test_v12421_live_phone.txt`). The first live run (04:00) gave 56/60: three checks were written for 26 Oct (today's card listed 26 Oct's pick-ups) and the fourth found no Ready ticks on the record, because a stale page had wiped them at 03:59:55 (see `../record_26Oct2026_departures/README.md`, tenth run). The day-card checks now read 26 Oct's card and a day with pick-ups, so they hold on any later day.
