# Wed 14 Oct 2026: Esplanade arrival plan (driver how-to). DRAFT for Andrew's yes

Author: Andrew Fisher

**State: DRAFT.** It goes to Andrew for his yes on the look. It's not on the page yet. Once he says yes, it becomes part of the 14 Oct run sheet and driver sheets as a page release.

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
