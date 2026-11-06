# v9.00 truck flow part — the Truck flow card folds to one closed line (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT**, built and tested, not uploaded, not committed by this part ·
base: live **v9.18** (sha256 `c547a6de…b14b762`; the work started on v9.11, `408ae6ac…7c2d1`, and live moved while it was
being tested, so it is built and tested on v9.18; live was still v9.18 at the last build) · built page sha256
`6a6b057c…5e17fe0` · the footer is untouched; the footer step takes the next free number when it publishes

## What Andrew said

On site, about **16:10 AEST, Thu 8 Oct**, with a screenshot of the Timeline's Truck flow card for **Wed 14 Oct**
("TRUCK FLOW · 4 people on · 4 loads": Order 1 P25 › 2 P65 › 3 P66 › 4 P67, People on 4 with Save, Main Beach and Helen
Park rows, Oversized, Curfew first with four "Load n: Kingston load time not known … Make it Load 1" rows, Could share a
truck, Rules · the project manager, 8 Oct 2026, 03:40 AEST):

> "also can we fix this up almost like your making this the hero and it now takes up all the room need to be gone or get rid of it"

## What changes

The card is **folded, not removed** (the layout rule of 2 Oct: "arrange, fold or pack it, never redraw or restyle it").
In its place each day shows **one thin closed line**:

    TRUCK FLOW · 4 loads · 4 to check                                   ›     (14 Oct)
    TRUCK FLOW · 10 loads · 1 to check · 9 need a time                 ›     (13 Oct)
    TRUCK FLOW · 1 load · nothing to check                              ›     (25 Oct)

- **Tap it and the card opens exactly as it is today.** The card's markup inside the fold is v8.91's, byte for byte:
  Order, People on (with Save), the area rows, Oversized, Curfew first with its Make it Load 1 buttons, Could share a
  truck, Rules. Nothing is reworded. Every button is the card's own and goes through the same handlers.
- **"to check"** counts only the day's delivery loads with a **red flag**, each load once, from the same day model the
  card reads (`flow891Day`):
  - Curfew first not on the earliest run: an oversized load with **no Kingston load time**, or **on the road in a
    restriction**;
  - in an **area over its limit** (the loads the load line's "Area full" chip marks);
  - **oversized over the guide** at one time.
- **"need a time"** counts, separately, the loads whose only gap is **no arrival window** (a load that is also red is
  counted once, under "to check"). This was changed after review: counting "no window" as a check made most lines read
  the same number twice ("10 loads · 10 to check" on 13 Oct, when 9 of those were only missing a window). Now the line
  says why on a phone, with no tooltip: "1 to check · 9 need a time".
- A day with neither reads **"nothing to check"**. The tooltip still names how many of each.
- **On a phone the line leaves out "N loads".** The same count sits right under it ("DUE IN (4) · 4 LOADS"), and it is
  the one part that pushed the longest day (14 Sep, "4 to check · 3 need a time") past one line at 390 px. Phone line:
  "TRUCK FLOW · 4 to check". The laptop keeps "N loads", as the brief worded it.
- **Closed by default on every day**, every time the page opens. A fold somebody opens stays open while they work (the
  record syncs every few seconds and Make it Load 1 redraws the day), held in the page's memory only. This is the same way
  the page's other folds (`PFOLD_OPEN`, `SFOLD_OPEN`) work. Opening, closing or looking writes **nothing** to the shared
  record and nothing to browser storage.
- A load line's **"Curfew first" / "Area full"** chip still jumps to the card. It opens the fold first.
- **Prints:** a print opens every Truck flow fold and closes it afterwards, as the v7.95 and v7.96 folds do. The line
  itself never prints, so a printed day is as before. The Drivers and Install PDFs do not read this card and are untouched.
- **Look:** the page's fold look (`details.pfold`: a ruled box, 10/0/10/0 corners, paper ground, 13 px type) with the
  card's own orange edge, and a chevron that turns when open. "to check" is in the page's stop red, "need a time" in its
  amber (`--sem-gap-ink`). Colours come from the page's tokens, so light and dark both follow the phone. Laptop: 40 px
  tall. Phone: 44 px tap target, one line, no sideways scroll at 390 px. The orange hover edge is for a mouse only
  (`@media (hover:hover)`), so a tap on a phone no longer leaves the edge orange.

## How it is built

`patch_v900_truckflow.py` adds **one style** (before the first `</head>`) and **one script** (before the last
`</body>`). The script wraps the card's own render function, `flow891Card`, by name. The `dayPanels` override that calls
it is not edited, and no markup another release owns is touched.

The patch refuses to run twice (it looks for `flow909-script`). It refuses a base without v8.91's card, and a base
without v9.11's Arrange loads workspace (`drops911-workspace`, the function the previous release added; the v9.11 footer
number is checked as well). It proves DATA is byte-identical and round-trips, the footer is untouched, and nothing but
the style and the script was added. Checked: a second run stops ("already applied"); a page with the v9.11 workspace
taken out stops ("wrong base"); the v9.11 page (`408ae6ac…`) and the v9.18 page both take it.

    cd 03_GC500_Delivery_Control
    toolchain/build.sh v909_truckflow v9.00_crew_vms_counts_DRAFT/patch_v900_truckflow.py

Not touched: DATA, the record (read-only), money, the footer, v9.11's Workers picker on each load, the readable
dropdowns, the Arrange loads workspace and its order controls, the load cards, every other script. Between v9.11 and v9.18
the Truck flow script (`flow891-script`) and its styles are byte-identical, so the patch lands the same way on both.

## Checks (record 4581, read-only)

`tests/test_truckflow900.cjs` opens the live base page and the built page one after the other, at the live address, reading
the live record (record 4581 on both). Every write the page tries is aborted by the harness. It checks Wed 14 Oct (the
project manager's screenshot) and today, Thu 8 Oct, and every programme day for the count. It was run four ways: laptop
1440 × 900 and phone 390 × 844, each in light and dark. **All four pass: laptop 27 of 27, phone 29 of 29**
(`evidence_truckflow/test_*.log` and `.json`).

| check | result |
|---|---|
| the card's place shows one closed line | 14 Oct: "Truck flow · 4 loads · 4 to check" (four oversized loads with no Kingston load time; phone "Truck flow · 4 to check"). 8 Oct: "Truck flow · 3 loads · 2 to check" (two on the road in a restriction). The card inside is not shown while the fold is closed. |
| the count is right on every day | the test works the count out **from the base card's own rendered rows**, not from the day model or the patch: Curfew first rows marked `unknown` / `late` ("Load n"), the "(loads a, b)" of an area row over its limit, the oversized loads whose Order windows overlap past the guide when the Oversized row is flagged, and Order entries with no window (no `<em>`) for "need a time". All 40 programme days with loads match and draw closed. "Nothing to check" on 22 and 27 Sep, 25, 27, 28, 29 and 30 Oct, 6, 12 and 13 Nov |
| compact | laptop: the line is 40 px tall. Phone: a 44 px tap target, one line, no sideways overflow at 390 px. The longest line of the programme (14 Sep) is drawn on screen as well: nothing cut off on laptop or phone |
| no sticky hover | phone: after a tap the line's edge is the rule colour, `rgb(228, 224, 220)` in light; the device has no hover |
| light and dark | the line takes the page's paper and ink tokens in both (checked by colour, and looked at) |
| opening shows the card as it is today | a real press (a tap on the phone) opens it. The card's markup is byte-for-byte the base's and its text is the same (3,343 characters on 14 Oct). Order, People on, the areas, Oversized, Curfew first, Could share a truck and Rules are all there |
| the rest of the Timeline is untouched | with the fold unwrapped, the whole Timeline pane is byte-for-byte the base's: the load cards, the Workers picker, the dropdowns (29 on 14 Oct), the order controls, Arrange loads. The comparison ignores only what differs between any two draws: ids and names from a running counter (`wx818-`, `tl841-`, and now the Lifting radios `handling875-<load>-<n>`), the gantry's on-screen class, the weather's "fetched hh:mm", and an empty style attribute. Both pages wait until the two weather services have answered or given up before they are compared (one run failed when Open-Meteo answered on one page and not the other; that was weather, not Truck flow) |
| the buttons inside still work the same way | in edit practice (stubs only, captured, never saved), the three Make it Load 1 buttons on 14 Oct, the People on Save and the order controls (▼ / ▲) call the same functions with the same arguments as on the base: `flow891Move(day, load, "first")` and so on |
| nothing is written | the local record, localStorage and sessionStorage are identical (SHA-256) before and after opening, closing and redrawing. Blocked writes: 0 |
| it stays the way it was left | an opened fold stays open through a redraw; a closed one stays closed |
| the jump and the print | a load's Curfew first / Area full jump opens the fold. A print opens every fold and closes it afterwards. The line has a print rule that hides it |
| money | `moneySummary` and `fh866Model` are identical on both pages |
| errors | no page errors on either page, and no write attempted |

The lines for every day (record 4581): "to check" now equals the load count on 5 days only (16, 17, 23, 25 Sep and
14 Oct), and on each of those every load really has a red flag. 13 Oct reads "1 to check · 9 need a time", 15 Oct
"3 to check · 9 need a time", 19 Oct "29 need a time".

**Sweeps** (`toolchain/harness/sweep.js`, record 4581, `evidence_truckflow/sweep_*.json`):

SWEEP_TABLE

**Rig note.** From about 16:30 AEST on 8 Oct the machine's disk was full. Headless Chromium then crashed within seconds
of opening, on the live base page (v9.10 and v9.11) exactly as on the build, first when the page's parked map explorer
loaded. The recorded runs put the browser's temporary files on `/dev/shm` (`TMPDIR`) and needed nothing else.
`NOEXPLORER=1` in the test is kept as a fallback only. The toolchain's Playwright now asks for a newer browser than the
machine has, so the runs name the installed one (`CHROMIUM_PATH=/opt/pw-browsers/chromium`).

## Evidence

`evidence_truckflow/` (on v9.18; `on_v911/` holds the earlier set from the v9.11 build, before the count was changed):
- `before_*_14oct.png`: the card as it is today, on laptop and phone, light and dark;
- `after_closed_*_14oct.png`: the line, closed, in its place;
- `after_open_*_14oct.png`: the line opened, with the card below it exactly as before;
- `after_closed_*_longest_2026-09-14.png`: the longest line ("4 to check · 3 need a time"), one line on the phone;
- `after_closed_*_needtime_2026-10-16.png`: a day with only loads waiting for a time;
- `after_closed_*_nothing_2026-10-25.png`: a day with nothing to check;
- `test_*.log` / `.json`: the four test runs; `sweep_*.json`: both sweeps on the build and on the base.

Each screenshot was looked at. No dollar figure is in frame.

## Open

- **This is a layout change.** The rule from 2 Oct says to show a mock-up on the real page and get Andrew's yes before
  building a new layout. This draft is that mock-up: the screenshots show it on the real page, and it goes live only on
  his yes.
- **The count is Andrew's call.** It now counts red flags only, with loads waiting for an arrival window in their own
  words ("9 need a time"). If he would rather the line say only red flags, the "need a time" words come off; if he wants
  the window gaps back in "to check", that is the earlier version.
- **Repeated words when open.** Opened, "Truck flow" shows in the line and again in the card's header (the card is kept
  byte for byte), and on the laptop "N loads" also sits above "DUE IN (n) · n LOADS". The brief worded the line this way.
  If Andrew minds, the laptop line can drop "N loads" as the phone already does.
- "N loads" is the card's own load count (deliveries and pickups). The checks are about delivery loads, so 26 Oct reads
  "7 loads · 1 needs a time".
- Git: WIP commits `eefe895` and `5e82d94` already hold interim versions of this part's patch, README, test and evidence.
  Whoever commits next should commit these final versions in one go.
