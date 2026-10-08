# v9.00 truck flow part — the Truck flow card folds to one closed line (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT**, built and tested, not uploaded, not committed by this part ·
base: live **v9.18** (sha256 `c547a6de…b14b762`; the work started on v9.11, `408ae6ac…7c2d1`, and live moved while it was
being tested, so it was rebuilt and retested on v9.18) · built page sha256 `524a45b8…5450c160` · the footer is untouched; the
footer step takes the next free number when it publishes

## What Andrew said

On site, about **16:10 AEST, Thu 8 Oct**, with a screenshot of the Timeline's Truck flow card for **Wed 14 Oct**
("TRUCK FLOW · 4 people on · 4 loads": Order 1 P25 › 2 P65 › 3 P66 › 4 P67, People on 4 with Save, Main Beach and Helen
Park rows, Oversized, Curfew first with four "Load n: Kingston load time not known … Make it Load 1" rows, Could share a
truck, Rules · the project manager, 8 Oct 2026, 03:40 AEST):

> "also can we fix this up almost like your making this the hero and it now takes up all the room need to be gone or get rid of it"

## What changes

The card is **folded, not removed** (the layout rule of 2 Oct: "arrange, fold or pack it, never redraw or restyle it").
In its place each day shows **one thin closed line**:

    TRUCK FLOW · 4 loads · 4 to check                                   ›

- **Tap it and the card opens exactly as it is today.** The card's markup inside the fold is v8.91's, byte for byte:
  Order, People on (with Save), the area rows, Oversized, Curfew first with its Make it Load 1 buttons, Could share a
  truck, Rules. Nothing is reworded. Every button is the card's own and goes through the same handlers.
- **"to check"** is the number of the day's delivery loads with a check that needs action, each load counted once, from
  the same day model the card reads (`flow891Day`):
  - Curfew first not on the earliest run: an oversized load with no Kingston load time, or on the road in a restriction;
  - in an area over its limit (the loads the load line's "Area full" chip marks);
  - oversized at a moment when more oversized loads are on site than the guide allows;
  - no arrival window.

  It is never just the number of loads restated. A day with none reads **"nothing to check"**. The line's tooltip says
  how many of each (for 14 Oct: "Kingston load time not known: 4 · no arrival window: 4").
- **Closed by default on every day**, every time the page opens. A fold somebody opens stays open while they work (the
  record syncs every few seconds and Make it Load 1 redraws the day), held in the page's memory only. This is the same way
  the page's other folds (`PFOLD_OPEN`, `SFOLD_OPEN`) work. Opening, closing or looking writes **nothing** to the shared
  record and nothing to browser storage.
- A load line's **"Curfew first" / "Area full"** chip still jumps to the card. It opens the fold first.
- **Prints:** a print opens every Truck flow fold and closes it afterwards, as the v7.95 and v7.96 folds do. The line
  itself never prints, so a printed day is as before. The Drivers and Install PDFs do not read this card and are untouched.
- **Look:** the page's fold look (`details.pfold`: a ruled box, 10/0/10/0 corners, paper ground, 13 px type) with the
  card's own orange edge, and a chevron that turns when open. Colours come from the page's tokens, so light and dark
  both follow the phone. Laptop: 40 px tall. Phone: 44 px tap target, one line, no sideways scroll at 390 px.

## How it is built

`patch_v900_truckflow.py` adds **one style** (before the first `</head>`) and **one script** (before the last
`</body>`). The script wraps the card's own render function, `flow891Card`, by name. The `dayPanels` override that calls
it is not edited, and no markup another release owns is touched.

The patch refuses to run twice (it looks for `flow909-script`). It refuses a base without v8.91's card, or before v9.11.
It proves DATA is byte-identical and round-trips, the footer is untouched, and nothing but the style and the script
was added.

    cd 03_GC500_Delivery_Control
    toolchain/build.sh v909_truckflow v9.00_crew_vms_counts_DRAFT/patch_v900_truckflow.py

Not touched: DATA, the record (read-only), money, the footer, v9.11's Workers picker on each load, the readable
dropdowns, the Arrange loads workspace and its order controls, the load cards, every other script. Between v9.11 and v9.18
the Truck flow script (`flow891-script`) and its styles are byte-identical, so the patch lands the same way on both.

## Checks (record 4508, read-only)

`tests/test_truckflow900.cjs` opens the live base page and the built page one after the other, at the live address, reading
the live record (record 4581). Every write the page tries is aborted by the harness. It checks Wed 14 Oct (the project
manager's screenshot) and today, Thu 8 Oct. It was run four ways: laptop 1440 × 900 and phone 390 × 844, each in light
and dark. **All four pass, 26 of 26 each** (`evidence_truckflow/test_*.log` and `.json`).

| check | result |
|---|---|
| the card's place shows one closed line | 14 Oct: "Truck flow · 4 loads · 4 to check" (the four loads with no Kingston load time and no arrival window). 8 Oct: "Truck flow · 3 loads · 2 to check". The card inside is not shown while the fold is closed. |
| the count is right on every day | all 40 programme days with loads match an independent count in the test, and all draw closed. "Nothing to check" on 22 and 27 Sep, 25, 27, 28, 29 and 30 Oct, 6, 12 and 13 Nov |
| compact | laptop: the line is 40 px tall. Phone: a 44 px tap target, one line, no sideways overflow at 390 px |
| light and dark | the line takes the page's paper and ink tokens in both (checked by colour, and looked at) |
| opening shows the card as it is today | a real press opens it. The card's markup is byte-for-byte the base's and its text is the same (3,343 characters on 14 Oct). Order, People on, the areas, Oversized, Curfew first, Could share a truck and Rules are all there |
| the rest of the Timeline is untouched | with the fold unwrapped, the whole Timeline pane is byte-for-byte the base's: the load cards, the Workers picker, the dropdowns (29 on 14 Oct), the order controls, Arrange loads. The comparison ignores only what differs between any two draws: SVG ids numbered by a running counter, the gantry's on-screen class, the weather's "fetched hh:mm", and an empty style attribute |
| the buttons inside still work the same way | in edit practice (stubs only, captured, never saved), the three Make it Load 1 buttons on 14 Oct, the People on Save and the order controls (▼ / ▲) call the same functions with the same arguments as on the base: `flow891Move(day, load, "first")` and so on |
| nothing is written | the local record, localStorage and sessionStorage are identical (SHA-256) before and after opening, closing and redrawing. Blocked writes: 0 |
| it stays the way it was left | an opened fold stays open through a redraw; a closed one stays closed |
| the jump and the print | a load's Curfew first / Area full jump opens the fold. A print opens every fold and closes it afterwards. The line has a print rule that hides it |
| money | `moneySummary` and `fh866Model` are identical on both pages |
| errors | no page errors on either page, and no write attempted |

**Sweeps** (`toolchain/harness/sweep.js`, record 4581, `evidence_truckflow/sweep_*.json`):

| run | tabs | page errors | console errors | blocked writes |
|---|---|---|---|---|
| build, laptop | 21 (15 shown) | 0 | 0 | 0 |
| build, phone | 21 (15 shown) | 0 | 0 | 0 |
| base, laptop | 21 (15 shown) | 0 | 0 | 0 |
| base, phone | 21 (15 shown) | 0 | 0 | 0 |

On both pages the six tabs not shown are the same ones the page hides on purpose (add, breakdowns, edit, journal, register,
variances). The deep links and back/forward behave the same on both.

**Rig note.** From about 16:30 AEST on 8 Oct the machine's disk was full. Headless Chromium then crashed within seconds
of opening, on the live base page (v9.10 and v9.11) exactly as on the build, first when the page's parked map explorer
loaded. The recorded runs put the browser's temporary files on `/dev/shm` (`TMPDIR`) and needed nothing else.
`NOEXPLORER=1` in the test is kept as a fallback only. The same tests also passed on the v9.11 build earlier, before live
moved (`evidence_truckflow/on_v911/`).

## Evidence

`evidence_truckflow/` (on v9.18; `on_v911/` holds the same set from the v9.11 build):
- `before_*_14oct.png`: the card as it is today, on laptop and phone, light and dark;
- `after_closed_*_14oct.png`: the line, closed, in its place;
- `after_open_*_14oct.png`: the line opened, with the card below it exactly as before;
- `after_closed_*_nothing_2026-10-25.png`: a day with nothing to check;
- `test_*.log` / `.json`: the four test runs; `sweep_*.json`: both sweeps on the build and on the base.

Each screenshot was looked at. No dollar figure is in frame.

## Open

- **This is a layout change.** The rule from 2 Oct says to show a mock-up on the real page and get Andrew's yes before
  building a new layout. This draft is that mock-up: the screenshots show it on the real page, and it goes live only on
  his yes.
- "to check" counts a load with no arrival window, or no Kingston load time on an oversized load, as needing action, as
  the brief asked. Right now that is most coming loads (19 Oct: 29 of 30), so the count stays high until load times are
  given. If Andrew wants only red flags counted (late runs, areas over their limit, oversized over the guide), that is a
  small change.
- "N loads" is the card's own load count (deliveries and pickups). "to check" looks at delivery loads, because the card's
  checks are about delivery loads; 26 Oct reads "7 loads · 1 to check".
