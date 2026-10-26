# v12.32: the departed stamp, and asset numbers and known sizes on every Demob line

Author: Andrew Fisher · 26 Oct 2026

Andrew asked for this on 26 Oct 2026, once GN24 had gone:
- "Asset no 1277089 left 60kva trailer left 810AM"
- "Need to update everywhere and we create a departed stamp some how please"
- "I want asset numbers and known size and dimensions please"
- "Need this to be really good and look really good is this live"

GN24's departure (asset 1277089, 26 Oct 08:10) was recorded first, through the page's own Record departure form
(`record_26Oct2026_departures`, second run). This release changes how a departure looks, not the record.

## What it shows

**A DEPARTED ink stamp.** A reference whose departure record has every unit gone wears a green, double-ruled stamp with the day and
time it left and who recorded it, for example "DEPARTED · MON 26 OCT · 07:40 · recorded by Andrew Fisher".
- **On the Demob pick-up list:** beside the green Picked up light, in place of the plain "Picked up" line.
- **At the top of the reference's own page (the drawer):** a big stamp with the year, and under it what left, unit by unit, with the
  asset numbers: "LEFT SITE · 1 × 60kva · 1277089".
- **The drawer's state card:** reads "DEPARTED · left site 26 Oct 08:10 · recorded 26 Oct 10:36 · Andrew Fisher", not "In transit".

**Departed, in words, everywhere.** Everywhere the page puts a reference's state into words (search, the finder, unit lines, the
driver card, the light's title), a reference that has left in full now reads "Departed 26 Oct 08:10" instead of "In transit".
Only the words change. The light, its colour, the counts and every rule that reads the state stay exactly as recorded.

**Asset numbers and known sizes on every line.** Each Demob line still shows the unit asset numbers and the size, weight and rating
the page holds (`Loading931`), each saying where it comes from. Where the record holds nothing, the line now says so in grey:
- "Size not on record", when there are asset numbers but no size;
- "Asset no. and size not on record", when there is neither.

No size is worked out or made up.

## The rules

| What | Where it comes from |
|---|---|
| Departed, and when | The departure record (`Departure1211`, read through `Departed1229`): every unit gone, with the time on the form. |
| Who recorded it | The same departure record. |
| What left | The departure record's items and unit numbers. |
| Asset numbers and sizes | The page's own unit and loading records (`gcUnits925`, `Loading931`), unchanged from v12.31. |

A reference with only some units gone is not stamped. It keeps its lights and words as before.

**Not changed:** the record, the plan, the loads, the Emptied gate, the Ready ticks, charges, QR codes and the servicing tracker.

## Files

| File | What it does |
|---|---|
| `departed1232_src.js` | The module and its styles, inserted just before `</body>`. It draws the stamp (`Stamp1232.html`), lists what left (`Stamp1232.left`), puts the big stamp in the drawer (wraps `drawerTidy`), and words a departed reference as Departed (wraps `deliveryView`). |
| `patch_v1232.py` | Five exact-text edits on the verified v12.31 page (BASE `ab553fe3…`), plus the module and the footer: the stamp in the Demob status cell, the two "not on record" lines, and the drawer state card's title and line. |
| `tests/test_v1232.cjs` | 48 checks: v12.31's Demob checks, updated for the stamp, plus the new ones below. |

**What the new checks read (live record, view link):**
- GN24 and GN10 read "Departed" with the time they left; GN19, still on site, reads "On site".
- The light, its colour and the state stay as recorded.
- GN10's row wears the stamp with Mon 26 Oct · 07:40.
- GN24's drawer has the big stamp, "1 × 60kva · 1277089", and a state card reading Departed, left site 26 Oct 08:10.
- Every row shows its asset numbers and size from the record, or says not on record.
- Today's tally names GN10 07:40 and GN24 08:10, and today's card reads "Picked up 2 · last 08:10".

**What it rehearses (sync held in the page, nothing sent):** GN19 picked up through the green light now wears the stamp, reads
Departed everywhere, and today's card counts three.

## Checks

- **LIVE 26 Oct 2026 11:09 AEST.** The view link serves the build byte for byte: 15,513,431 bytes, sha256 `69872696…`. A separate public fetch is identical. On the live bytes: desktop 48/48 and phone 48/48 (`evidence/test_live_desktop.txt`, `evidence/test_live_phone.txt`).

- Desktop 48/48 and phone 48/48 on candidate `69872696` (`evidence/test_v1232_desktop.txt`, `evidence/test_v1232_phone.txt`).
- Every rehearsal was captured in the page, and nothing reached the network.
- Both sweeps: 27 tabs, 19 panes shown, 7 deep links; 0 errors, 0 console messages and 0 writes (`evidence/sweeps.json`).
- Pictures are in `evidence/`.

## On the record, shown as it stands

- **GN10** shows its planned pick-up (Tue 27 Oct 07:30) beside its stamp (Mon 26 Oct 07:40): it went a day early.
- **Barrier lines** show the product code (ARMORZONMASHTL2) as the asset number, because that is what the record holds for them.
- **Light towers and barriers** have no size on the record, so they read "Size not on record". Sizes from the spec sheets can be
  added to the record on Andrew's word.
