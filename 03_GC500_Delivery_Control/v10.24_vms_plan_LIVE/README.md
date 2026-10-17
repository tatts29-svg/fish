# v10.24 — VMS plan: a VMS boards tab, one sheet per position, the A4 pack

Author: Andrew Fisher · 15 Oct 2026

> LIVE 15 Oct 2026 08:06 AEST (Andrew: "Upload"): page `681da5c7c631a5ccefe25a0f294020feb79a204e2e89211ebb7ff191a9e73dac` published and re-read
> byte for byte by the view link; the pack PDF uploaded 08:06 AEST, VERIFIED on the service (`report_20261014T220640Z.json`).

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
- **Each card**: the plan's words for the spot; the phase and dates; where it comes from or moves to; **four
  satellite views of our own on every board** — the live Mapbox/Maxar imagery the page's satellite board uses,
  drawn as static pictures centred on the pin with the service's own map token (the one Andrew set on Railway on
  18 Sep; restricted to this address, asked of the service once per page load): the exact spot about 50 m across,
  a close-up about 110 m, the area about 480 m and the way in about 1.4 km, north up, street names on, an orange
  ring and cross on the pin, a scale bar and a north mark drawn over them by the page (Andrew, 15 Oct about 06:05
  AEST: "I want our shots better. I want whoever is placing these to have confidence so they know where to go";
  about 06:20: "better pinned locations better drop off images so its clear.. 4 images if needed or more"); if the service gives no key, the registered 2022 aerial stands
  in where it covers the spot; **iEDM's own map crop and photo** for every position (the plan's pages, rendered and
  cropped, red dot and all); a **QR** that opens Google Maps driving directions to the pin and a Navigate button; the **pin**
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
  dates, the four satellite views (exact spot and close-up large, the area and the way in beside the plan crop; the
  sheet waits for the map key and for every picture before the print bar says ready), then a 34 mm QR with the pin and its basis, when, storage,
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
the 2022 aerial at 115 m across and again on the live satellite at 50 m across (`tests/shots/montage*.jpg`). That
50 m pass moved five pins onto the road they belong to (15 Oct 2026): VMS 01 onto the Gold Coast Highway median south
of Queen St, VMS 03 about 15 m east onto the southbound lanes, VMS 09 onto the highway's eastern verge at the
Convention Centre, VMS 10 onto Old Burleigh Rd at the Kurrawa roundabout, VMS 23 onto the highway north of the Sundale
Bridge (`montage_moved_pins_*.jpg`); every pin is now on its carriageway, verge or path. The accuracy
stated on each line (30–60 m) is the honest figure for a board placed from a plan; the pin taken on site with the phone
button, or a lat/lon typed on the line, becomes the position of record and prints on the sheet. The live satellite
pictures cover all 28 positions; the page's own 2022 aerial (the fallback) covers 17 (not 01, 02, 03, 07, 08, 09, 10,
17, 21, 23, 24). Boards 11–23 are named by their position number (contract 9961265 lists VMS11–VMS23, sub-hire,
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
toolchain/build.sh v10.24 v10.24_vms_plan_LIVE/patch_v1024.py
PAGE=build/GC500_v10.24/GC500_Delivery_Control_hosted.html node v10.24_vms_plan_LIVE/tests/test_vms1024.cjs
PAGE=build/GC500_v10.24/GC500_Delivery_Control_hosted.html node v10.24_vms_plan_LIVE/generate_vms.cjs
```

| check | result |
|---|---|
| view link, phone: 28 cards (10 + 13 + 5), a QR, a navigate link and the plan crop on each, four satellite views on every card (112 pictures, all loaded), every field disabled, nothing pre-ticked, VMS 20's two messages, vms1 → 1211354 and VMS09 → 1211404, Brenden's note on 13, footer v10.24, no errors, no writes | PASS (24 of 24, `tests/test_vms1024_result.json`) |
| edit practice, phone (every PUT aborted): asset, number plate, notes, a typed position; a non-Gold-Coast position and an unknown position refused; the in-place tick; one document, stamped and named; exactly the planned PUTs (loads, stamps, by); the card re-renders with the values | PASS, every PUT aborted by the harness |
| print path, desktop: `#print/vms/20` one sheet (two messages, QR, four satellite views and the plan picture, four identity boxes, zoom 1); `#print/vms/all` 28 sheets with 27 page breaks, every one fitted; Close restores the page | PASS |
| the other tabs route; the Equipment tab's VMS register fold is still there | PASS |
| desktop sweep / phone sweep | 24 tabs each, 0 errors, 0 console, 0 writes |
| the pack: 28 sheets, 140 of 140 pictures loaded, min zoom 1, 20,875,244 bytes, sha256 `c1903e0b1311e253…` | PASS (`evidence/build.json`) |
| screenshots, the pin montages and the pack looked at | `tests/shots/` (`pack_sheet_01.png` is sheet 1 of the pack) |

## Source

| file | sha256 |
|---|---|
| live v10.23 (base) | `d44a51537bd00a5a0d89cea58356fb39ce3a423c09faea62b77b546f99934b97` |
| iEDM VMS001-26003-01 (private upload; on the record as a document since 9 Oct) | `9ef1527d…` |
| candidate `build/GC500_v10.24/GC500_Delivery_Control_hosted.html` | `681da5c7c631a5ccefe25a0f294020feb79a204e2e89211ebb7ff191a9e73dac` |
