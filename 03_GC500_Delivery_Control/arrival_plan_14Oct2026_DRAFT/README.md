# Wed 14 Oct 2026: Esplanade arrival plan (driver how-to). DRAFT for Andrew's yes

Author: Andrew Fisher

**State: DRAFT v2, handed to Codex on 9 Oct 2026 at about 08:00 AEST.** Andrew in Claude's chat: "once you fix this delivery talk to codex i am approving for him to take over your credits are to low". It's not on the page yet.

## v2 changes (Andrew, about 07:45 AEST 9 Oct)

Andrew asked: "on the drop off lets make it clear on where they turn please show me all run sheets that go with this day too. show them a satteitte image on where they are parking. no trucks arte to jump order"
- **New page 2, "Where to turn & where to park":**
  - Queensland Government aerial imagery, turned so the trucks' direction of travel is up the page.
  - TURN LEFT HERE at the red pedestrian crossing (the Main Beach Pde / Esplanade split).
  - A red ✕ "Not straight on here" on Main Beach Pde past the split.
  - The holding strip with trucks 1–4, and "Truck 1 stops here" at the Higman St end.
  - The drop area.
  - Three steps (Turn, Park, Drop) and a key.
  - The imagery is the public State Program basemap (`spatial-img.information.qld.gov.au … LatestStateProgram_AllUsers/ImageServer/exportImage`). Its attribution is printed on the sheet.
- **Order banner on both pages**, in red: "NO TRUCK JUMPS THE ORDER · 1 P25 → 2 P66 → 3 P65 → 4 P67 · out of order = you wait".
- **The day's run sheets:** produced from the live page (v9.34) through its own print flow in a GET-only harness, then sent to Andrew as one 26-page day pack: this plan, then 16 pages of driver sheets, then 8 pages of install sheets. The pack isn't committed because the run sheets carry site phone numbers. Regenerate it from the page: Timeline → Wed 14 Oct → Drivers / Install.

## Found while doing it (for Codex and Andrew)

- **The 14 Oct driver sheets' arrival windows come from the crew times.**
  - P25 is 06:00–06:30 and P66 is 06:30–07:00.
  - P65 and P67 say "Arrival window not known — agree it with site", because their crew start and finish aren't set.
  - Andrew's plan needs all four parked before 07:00. Either Andrew sets the P65 and P67 times, or the page integration makes the arrival plan set the arrival window for that day (all four arrive 06:00–07:00, in order).
- **The drivers' print check shows 8 open checks for 14 Oct:** "Confirm a separate external spotter during forklift operation" and "Clash check incomplete" on each of P25, P66, P65 and P67. These hold the trucks until they're cleared on the page.
- **The print check's site limits** say "maximum 2 trucks loading/unloading at once. 4 people, 2 forklifts". The plan holds four trucks in the strip and unloads them one at a time, so it fits.

## Build inputs and private references (added at Codex's request, 9 Oct ~08:00)

**Rebuild:** `cd source && python3 build_maps.py && python3 build_aerial.py && python3 build_sheet.py`, then `node render.js <abs path to source>` with Playwright (`NODE_PATH=toolchain/node_modules`, Chromium at `/opt/pw-browsers/chromium` in Claude's container). The outputs (`maps.json`, `aerial.svg`, `sheet.html`, `sheet.pdf`, `sheet.png`) are written next to the scripts.

**Proved:** a fresh copy of `source/` rebuilt the 2-page sheet at 934,095 bytes, the same as the committed PDF.

**Inputs in `source/`:**

| File | What it is |
|---|---|
| `osm.json` | OpenStreetMap roads, water and parks for the route area. Overpass via maps.mail.ru, 8 Oct 21:31 UTC. © OpenStreetMap contributors, ODbL |
| `tiles/` | 72 OpenStreetMap standard tiles (z16 / z18 / z19) for the muted map backgrounds, fetched once with an identifying user agent |
| `aerial.jpg` and `aerial.json` | Queensland Government State Program basemap export (bbox in `aerial.json`, EPSG:3857, 1200 × 1725 px). Attribution as printed on the sheet |
| `fonts.css` | The page's own embedded Inter and Barlow Condensed fonts, so the sheet matches the page |

**Andrew's original marked references (private, encrypted):** `private/arrival_inputs_09oct.zip.enc`.
- **Encryption:** the papers password, same method as the other inputs folders: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in private/arrival_inputs_09oct.zip.enc -out /tmp/arrival_inputs_09oct.zip`.
- **Hashes:** zip sha256 `84fdaa003c7c36ba39694c096e26ae935554f40328874c9a73fa1ede97dbe685`, enc `4cb8bbb51037a395897e12f5d8f3a093fcb0e51e139368443592f132f1688520`. The round trip was proved.
- **Contents:** Andrew's four Google Maps / Google Earth screenshots with his red pencil lines, as he sent them (WebP):
  1. `1_esplanade_holding_strip_red`: the holding strip.
  2. `2_waterways_dr_after_sundale_bridge`
  3. `3_macarthur_pde_to_main_beach_pde`
  4. `4_main_beach_pde_google_earth`
- **Why encrypted:** they're Google imagery and show his browser's internal bookmarks bar. They're reference only and are never printed on the sheet ("dont uise my pencilled durings").

## For Codex (page integration, after Andrew's yes on the look)

1. Add the two pages to the 14 Oct day documents. Put them at the front of the Drivers PDFs and the day run sheets, with an "Arrival plan" button on the 14 Oct Timeline day. Rebuild with `source/build_sheet.py`, or embed `aerial.svg` and the two map SVGs from `maps.json`.
2. Add `ORDER782` entries for P25, P66, P65 and P67 (truck n of 4, `after` the previous one, `seq: true`). Give the 14 Oct sequence its own text, so `SEQ782` (the 14 Sep Macintosh Island text) isn't reused. The rules then flow into texts, Full details, the drawer and the run sheet.
3. Override the way-in for these four on 14 Oct with Andrew's route: Sundale Bridge, left Waterways Dr, MacArthur Pde, Main Beach Pde, keep left onto the Esplanade at the red crossing, and the holding strip.
4. Set the arrival window for the day to 06:00–07:00, in order (see above).
5. No record changes are needed for any of this.

## Andrew's words (to Claude in chat, about 07:30 AEST 9 Oct 2026, with four Google Earth screenshots marked in red)

> need you r help to create a how to please for next wedenday and tody it up where the red is is where the trucks can park and they must come in the correct order P25 P66 P65 P67 they must all be here before the 1 load restiictions happen the correct load order is on the run sheet for the day theri best route ins over the sundale bridge and then turn rn left at waterways drive. then onto mcarthur parade and then onto main beach parade to that location drop point. traffic controllers will be in place from 6Am so its important trucks are all here and no trucks are to jump in front of the next we have limited space so its important they turn up in the correct order and the door are on the correct side for unloading. please make this look good. dont uise my pencilled durings they look bad so we need to tidy this up and this become part of the run sheet for wednesday please next week.

## What the sheet says and where each fact comes from

| Fact | Source |
|---|---|
| Order P25 → P66 → P65 → P67 | Andrew's message; the same order is on the page record's 14 Oct run order (`flow891/2026-10-14/order`, saved by Andrew 07:06 AEST 9 Oct) |
| Door sides: P25 passenger, P66 driver, P65 passenger, P67 driver | The page record's loading sides (`loading872`), set by Andrew 07:00–07:04 AEST 9 Oct |
| Tilt-tray unloading for all four | The page record's unloading method (`handling875`), set by Andrew 07:01–07:04 AEST 9 Oct |
| Buildings: P25 Building 4.8 m (asset 1189408), the others Building 6 m | Schedule items on the page (`dpItems`) and the unit record |
| Traffic control from 06:00 | Andrew's message. The page record also has traffic control Required on all four loads |
| "All four parked by 07:00" | Andrew: "before the load restrictions". The page's own rule (LOAD782): no travel to the Gold Coast 07:00–09:00 |
| "Load at Kingston in this order, leave by 05:00" | The page's own rule for morning deliveries (LOAD782). It is an assumption for this day; Andrew to confirm |
| Route | Andrew's message, checked against OpenStreetMap: no leg runs against a one-way |
| Holding strip | Andrew's red marking, redrawn on the one-way Esplanade's landward lane between the Main Beach Pde split and Higman St. The strip is about 119 m; four trucks need about 61 m (13 m each plus 3 m gaps) |
| Truck 1 at the front (Higman St end), 2–4 behind | Inferred so the trucks arrive and unload in order without passing each other. Andrew to confirm |
| Drop area | The four buildings' positions on master plan D001-26003-03 (2 Oct 2026), as held on the page (`MASTER_LOC`) |

**Route checked against the one-way Esplanade (OSM way 115940239).** The route is:
1. Gold Coast Hwy southbound over the Gold Coast / Sundale Bridge (OSM way 22915183).
2. Left into Waterways Drive.
3. At the Sea World Drive roundabout, onto MacArthur Parade.
4. Main Beach Parade south about 1.6 km.
5. Keep left onto the Esplanade.

The route is about 3.6 km from the Southport side of the bridge.

## Files

- `Wed14Oct_Esplanade_arrival_plan.pdf`: A4, one page.
- `Wed14Oct_Esplanade_arrival_plan.png`: the same page as an image, for phones.
- `source/`:
  - `build_maps.py`: both maps, built from OpenStreetMap tiles and road data.
  - `build_sheet.py`: the sheet.
  - `render.js`: the PDF and PNG.
  - `osm_roads.json`: the road data used. Map data © OpenStreetMap contributors (ODbL).

The base tiles came from tile.openstreetmap.org: 72 tiles, fetched once with an identifying user agent. They're kept in the session scratchpad, not in the repo.

## Next (after Andrew's yes)

Add the plan to the page as a release built by Claude and published by Codex. It shows on:
- the 14 Oct Timeline day;
- the 14 Oct daily run sheet and driver PDFs;
- the four drivers' texts and Full details, as the ordered sequence "truck n of 4 … out of order = no entry", the same way the 14 Sep Macintosh Island sequence works (`ORDER782`).

No record changes.
