# v9.00 truck flow part — the Truck flow card folds to one closed line (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT**, built and tested, not uploaded, not committed by this part ·
base: live **v9.11** (sha256 `408ae6ac…7c2d1`) · the footer step takes the next free number when it publishes

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
it is not edited, and no markup Codex owns is touched.

The patch refuses to run twice (it looks for `flow909-script`). It refuses a base without v8.91's card, or before v9.11.
It proves DATA is byte-identical and round-trips, the footer is untouched, and nothing but the style and the script
was added.

    cd 03_GC500_Delivery_Control
    toolchain/build.sh v909_truckflow v9.00_crew_vms_counts_DRAFT/patch_v900_truckflow.py

Not touched: DATA, the record (read-only), money, the footer, v9.11's Workers picker on each load, the readable
dropdowns, the Arrange loads workspace and its order controls, the load cards, every other script.

## Checks (record 4508, read-only)

RESULTS_PLACEHOLDER

## Evidence

`evidence_truckflow/`:
- before and after screenshots for 14 Oct: laptop and phone, light and dark, the card as it is (before), the line closed
  (after), and the line opened (after);
- one day with nothing to check;
- the JSON results of each test run, and both sweeps.

Each screenshot was looked at. No dollar figure is in frame.

## Open

- **This is a layout change.** The rule from 2 Oct says to show a mock-up on the real page and get Andrew's yes before
  building a new layout. This draft is that mock-up: the screenshots show it on the real page, and it goes live only on
  his yes.
- "to check" counts a load with no Kingston load time as needing action, as the card's own Curfew first row does. If
  Andrew wants only red flags counted (late runs, areas over their limit), that is a one-line change.
