# v10.24 — VMS plan: a VMS boards tab, one sheet per position, the A4 pack

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 05:45 AEST in Claude's chat, with iEDM's `VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf`
and three emails: "We need to work on vms this is going to be a job that needs to be organised and planned. I want
these as a direct pin on where they are with a satellite image of where it needs to go. Maybe we do a sheet for each.
With as much data as possible with qr navigation. Satellite image master image easy to understand. Generate an image
of it if we need to. Asset numbers. Number plate will be added later on. So maybe its own tab. So we have a print out
and an edit of details. I have added as much details as possible of changes. An edit of notes in the tab against each
vms reference in case some have special instructions. I think have one big huge a4 easy to understand colourful a4 pdf."

## What is on the page (`patch_v1024.py`, `vms1024.js`, `vms1024.css`, `vms1024.json`, `media/`)

- **A VMS boards tab (`#vms`)**, phone first, one card per position on iEDM's plan: 28 positions — construction /
  demob 01–08, 22, 23; event 02a, 03a, 05a, 07a (the relocations of 02, 03, 05, 07), 09–12, 18–21, 24; the five
  end-of-session boards 13–17 (in at the conclusion of track activity Fri/Sat/Sun, stored in the Altus compound on
  Cypress Ave, the T2, T11 and T10 runoffs). Filters: all, construction, event, end of session.
- **Each card**: the plan's words for the spot; the phase and dates; where it comes from or moves to; a **satellite
  close-up** from the page's registered 2022 aerial (about 190 m across, orange ring on the pin) for the 17 positions
  the aerial covers; **iEDM's own map crop and photo** for every position (the plan's pages, rendered and cropped, red
  dot and all); a **QR** that opens Google Maps driving directions to the pin and a Navigate button; the **pin**
  (lat, lon) and its basis; **VMS 20's two messages** with their times and facing; the **board** standing there
  (vms1–vms8 from the record's T0001 numbering for 01–08; VMS09 and VMS10 from the v9.13 register); **asset number**,
  **number plate**, **notes / special instructions** (Brenden's and Steve's words preloaded where they apply), an
  **in place as drawn** tick, a **position** field and a **Pin here with this phone** button.
- **The record**: one document per position on the shared `loads` collection, `kind: "vms1024"`, key `vms1024/<pos>`
  — asset, rego (the number plate), notes, lat/lon with how/who/when, inPlace, by, at — written through the page's own
  path (`mayWrite` on the edit link only, `whoAmI`, `stampIt`, `save`, `bump`). A typed position must be on the Gold
  Coast; a phone pin records its accuracy. The truck-load code ignores these documents (no `keys`, no `card`). A view
  link shows everything and changes nothing. The v9.13 VMS register on the Equipment tab is untouched and still feeds
  the board identity where a position names a contract board.
- **Print**: `#print/vms/<pos>` one A4 sheet (the pre-start's print style): orange board number, the spot, phase and
  dates, the satellite close-up and the plan crop side by side, a 34 mm QR with the pin and its basis, when, storage,
  the messages, four identity boxes (board, asset number, number plate, in place), notes with write-in lines, placed
  by / date / checked by, and the issued line. `#print/vms/all` prints the whole plan, 28 pages, a page break before
  each. The **pack PDF** (`generate_vms.cjs` → `pdfs/GC500_VMS_Plan_Pack_2026-10-15_Issued.pdf`) is made from that
  renderer and uploaded with `upload_vms.py` as a pack file; it lists in Documents → Packs.
- Footer ` · v10.23` → ` · v10.24`. Ten anchors in the main script (tab list, glyph, pane, dispatch, the print deep link,
  the print bar document and words, hash-to-tab) each matched once; the data, media, style and script blocks go before
  `</body>`. The plan crops add 1.8 MB to the page as inline JPEGs (the v10.20 precedent).

## Where the pins come from (and how sure they are)

The D025 sheet's VMS callout bubbles were checked on the aerial first: they sit tens of metres off the spots (several in
the Nerang River), so they are not used. Every position is placed from the plan's own map crop against something the
page already holds to the metre — the master plan's gates (G1, G8, G9, G10), turn markers (T2, T4, T11), WC16, P60, the
pit lane line — or the named intersection (TomTom cross-street geocode, 15 Oct 2026), then checked as an orange ring on
the 2022 aerial at 115 m across (`tests/shots/montage*.jpg`): every pin on its carriageway, verge or path. The accuracy
stated on each line (30–60 m) is the honest figure for a board placed from a plan; the pin taken on site with the phone
button, or a lat/lon typed on the line, becomes the position of record and prints on the sheet. Eleven positions are
outside the page's aerial cover (01, 02, 03, 07, 08, 09, 10, 17, 21, 23, 24): their sheets carry the plan crop and the
QR, no satellite. Boards 11–23 are named by their position number (contract 9961265 lists VMS11–VMS23, sub-hire,
pending; Brenden's email calls the end-of-session boards VMS13–17 by position); 24 has no contract board yet (the plan's
24 positions against the contract's 23 boards, open item R16/R30).

## What has changed, in the words it came in (preloaded on the cards)

- Brenden Meek, Branch Manager - Relief: "5x boards VMS13-17 will need to go out early. As track will be closed and
  they show everyone how to get out of the track." (notes on 13–17)
- Steve Haines, Safety and Traffic Coordinator, iEDM, "VMS gate 6": VMS 20 moved slightly, orientation and message
  change at midday each day; Message 1 09:00–12:00 facing westbound towards Ocean Ave "TICKETS → / GATE 6 ←"; Message 2
  from 12:00 facing northbound towards Gate 6 "SURFERS PARADISE ↑ / LIGHT RAIL →"; Fri 23 – Sun 25 Oct; the board on
  site Mon 19 Oct 09:00 – Mon 26 Oct 17:00 (read from his spreadsheet screenshot; confirm against the spreadsheet).
- Brenden Meek, 7 Oct 2026 09:29, "VMS": VMS 9 & 10 went out 8 Oct; VMS 9 is the board Andrew took from pit lane; VMS 10
  came down with the accessible toilet, a rehire unit from Premiair. (notes on 09 and 10)

## Checks (`tests/test_vms1024.cjs`, read only through the harness; results in `tests/test_vms1024_result.json`)

```sh
toolchain/build.sh v10.24 v10.24_vms_plan_DRAFT/patch_v1024.py
PAGE=build/GC500_v10.24/GC500_Delivery_Control_hosted.html node v10.24_vms_plan_DRAFT/tests/test_vms1024.cjs
PAGE=build/GC500_v10.24/GC500_Delivery_Control_hosted.html node v10.24_vms_plan_DRAFT/generate_vms.cjs
```

| check | result |
|---|---|
| view link, phone: 28 cards (10 + 13 + 5), a QR, a navigate link and the plan crop on each, satellite close-ups for every in-frame position, every field disabled, nothing pre-ticked, VMS 20's two messages, vms1 → 1211354 and VMS09 → 1211404, Brenden's note on 13, footer v10.24, no errors, no writes | see STATUS.md top entry |
| edit practice, phone (every PUT aborted): asset, number plate, notes, a typed position; a non-Gold-Coast position and an unknown position refused; the in-place tick; one document, stamped and named; exactly the planned PUTs (loads, stamps, by); the card re-renders with the values | see STATUS.md top entry |
| print path, desktop: `#print/vms/20` one sheet (two messages, QR, satellite and plan pictures, four identity boxes, zoom 1); `#print/vms/all` 28 sheets with 27 page breaks, every one fitted; Close restores the page | see STATUS.md top entry |
| the other tabs route; the Equipment tab's VMS register fold is still there | see STATUS.md top entry |
| desktop sweep / phone sweep | see STATUS.md top entry |
| screenshots and the pack looked at | `tests/shots/` |

## Source

| file | sha256 |
|---|---|
| live v10.23 (base) | `d44a51537bd00a5a0d89cea58356fb39ce3a423c09faea62b77b546f99934b97` |
| iEDM VMS001-26003-01 (private upload; on the record as a document since 9 Oct) | `9ef1527d…` |
| candidate | see STATUS.md top entry |
