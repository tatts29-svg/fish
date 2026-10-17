# Servicing sheets: the laminated print pack (DRAFT)

Author: Andrew Fisher · 18 Oct 2026 · DRAFT: test QR codes, not live. Nothing here was uploaded, deployed or written to the
live service.

Andrew, 18 Oct 2026 (servicing tracker brief): "Carried by crews" · "Just times" · "Waste tanks too" · "We can have
multiple printed off for each. I can even laminate them" · "Remember must show a percentage complete off that area" ·
"Lets have qr code for pinned location. The asset numbers associated with that refernce. And a picture of location on the
master map. With a circle around the area. And even a master map with a print of the different areas" · "There is a
compmetion qr code for their refernece. They scan. It whe all done. And click tap. This only alows them to complete the
refernce qr code. Must shows percentage complete for the area. And again for everything" · "must state. Reference number
and how many in each one" · "each refernce needs to have 3 ticks Water fillled. Pumped out Restock/Cleaned With correct
termellogogy with wording ... Waste tanks is only a pump out ... Sunday night will need a extra. locked and confirmed
empty. No water will be needed". Earlier: "purely just a track"; WC81 stays in area 11; WC100's trailers have no
location yet.

## What the pack is

`GC500_servicing_sheets_DRAFT.pdf`: A4, 55 pages, built from `../tracker_data.json` (the one data file the tracker uses)
and the master-plan pictures in `maps/`.

| page | what |
|---|---|
| 1 | **Master map** (A4 landscape): the D001 master plan with the 13 areas outlined in their colours and numbered, a dot per location; legend with every area's name, locations and units (Teams Area and "No location yet" say "not on the map"); totals (75 locations, 263 units) and jobs a night (760 on Thu 22 if needed, Fri 23 and Sat 24; 777 on Sun 25 night). North arrow, approximate scale bar, drawing credit. |
| 2-55 | **Each area**: a cover sheet, then its locations two to a page. Areas in Andrew's order 1-13, then "No location yet". |

Page ranges for printing one area's pack several times (make_sheets.py prints them after every build):
1 Pit Lane & Paddock 2-6 · 2 Island North / Freight 7-11 · 3 Island West / Merch 12-14 · 4 Commodore Park 15-17 ·
5 Median Strip — Race Admin & Merch 18-19 · 6 Median Strip — FOAM / Other Toilets 20-22 · 7 Main Beach Parade / Seaside
North 23-25 · 8 Main Beach Seaside — Supply / North 26-30 · 9 Main Beach Seaside — Mid-South 31-35 · 10 Main Beach
Seaside — South 36-39 · 11 Surfers Paradise / Cypress 40-43 · 12 Helen Park / The Hill 44-49 · 13 Teams Area 50-53 ·
No location yet 54-55.

**Area cover**: number and name in the area's colour; "8 locations · 12 units: 10 × FWF · 2 × Toilet block 6 m"; jobs a
night; the area map from the master plan with every location circled and labelled (locations at the same spot share one
circle); a location drawn far from the rest gets its own small map with how far (T0024 in area 1, WC81 in area 11);
locations with no place on the map are named in red; the table of locations (ref, how many, where / drop point, pin
yes/no, the page its sheet is on); "How to use" in five plain steps.

**Each location (reference)**: the REF big; its area; where / drop point; "location 3 of 8"; HOW MANY per line ("20 ×
FWF", "2 × Toilet block 6 m", "2 × Waste tank") with every asset number; the jobs grid per line in the tracker's own words
(Pumped out · Fresh water refilled · Cleaned & restocked · Locked & confirmed empty) with a dot for each service day it
applies (Thu 22 if needed · Fri 23 · Sat 24 · Sun 25 last night) and the Sunday line spelt out ("Sun 25 night: extra:
Locked & confirmed empty · no water."); a master-plan crop centred on it with a circle round it; the orange **COMPLETION
QR** "Scan when done - tick your jobs" ("Ticks only WC12 · shows the area % and the overall %"); the **LOCATION QR**
"Scan for directions" (Google Maps pin), or "No pin on the record - ask on site"; three "when the jobs are done" steps
where there is room.

**Every page**: "Track only - nothing here ticks the job record or changes a charge", the NO TWIN-STEER TRUCKS short
form word for word (v10.53 `WORDING.md`, every print-out; the 18 Oct review asked for it on these sheets), "Author:
Andrew Fisher", page n of 55, printed time, the data version and hash, the page the maps came from. Every map carries
"Drawing © iEDM · D001 rev 03 · issued 2 Oct". The draft also has a red DRAFT ribbon, a see-through DRAFT watermark and
"TEST CODE - NOT LIVE - opens nothing" under each completion QR.

The jobs and counts come only from `tracker_data.json` (plans by line kind, days, tasks, quantities). It changed three
times while this was built (Andrew's final job rules: every toilet block Pumped out + Cleaned & restocked, tanks Pumped
out, FWFs cleaned on Sunday); the generator reads it at run time and refuses a line kind or task the file does not word.
Percentages are on the phone (the tracker card), never on paper.

## Files

| file | what |
|---|---|
| `make_sheets.py` | builds the PDF (python3, reportlab; Liberation Sans and Carlito if present, Helvetica if not) |
| `render_maps.cjs` | renders the master-plan pictures read only from the live page's Map explorer |
| `layout.json` | the map boxes (mm) both scripts share |
| `maps/` | 80 pictures (master, 12 areas, 2 far groups, 65 location spots) and `maps.json` (positions, crop rectangles, north, metres per sheet unit, where they came from) |
| `urls.json` | DRAFT placeholders: `https://gc500-production.up.railway.app/d/TEST-TOKEN-NOT-LIVE#r=REF.0000` for each of the 75 references |
| `test_sheets.py` | the checks below; `test_sheets_results.txt` is the last run |
| `evidence/` | page previews (pdftoppm, 80 dpi) and a 300 dpi QR detail |
| `.gitignore` | second guard against a live pack or links file landing in the repo |

## Build it

```bash
python3 -I make_sheets.py                 # the draft from urls.json -> GC500_servicing_sheets_DRAFT.pdf
python3 -I make_sheets.py --placeholder   # rewrite urls.json with the placeholders first
```

### Going live (after server v5.89 is deployed and the tracker card is made on the edit link)

The completion links exist only then. The edit link's answer carries the card token and `tracker.links` = {REF: sig}.

1. Save `{"token": "<card token>", "links": {"PG01": "<sig>", ...}}` to a private file **outside the repository**
   (the QR text never goes into the repo or the record; the edit key is never involved).
2. `python3 -I make_sheets.py --links /private/tracker_links.json --out /private/GC500_servicing_sheets.pdf`
   (or `--urls` with a {REF: url} file). A live run refuses to write the PDF or read the links inside the repository,
   refuses any link that is not `/d/<token>#r=REF.<16-character code>` on the service (never `/e/`, never `/v/`), a link
   naming another reference, two tokens, or a missing reference. No DRAFT marks; the token is never printed as text.
3. Pre-flight (design spec): print one sheet, scan its completion QR with an iPhone and an Android camera app, check the
   `#r=` part survives and opens that reference's jobs on the right day, and scan the location QR. Then print the area
   packs (page ranges above) and laminate.
4. The links stay good as long as the card is never withdrawn (re-posting with the same token keeps them). A new card
   means a new token: reprint everything.

### Re-render the maps (only if positions or areas change)

```bash
rm -rf /tmp/gc500-fetch-cache
NODE_PATH=/opt/node22/lib/node_modules node render_maps.cjs           # about 4 minutes; ONLY=master,area5,WC12 for a few
```
It opens `build/GC500_v10.60p1/GC500_Delivery_Control_hosted.html` (v10.60.1, sha256 `92c91a82…`; set `PAGE=` for
another) with the shared harness: the page is served locally at the live address, every other request is a GET to the
live service, and every write the page tries is aborted (this run: 853 GETs, 0 writes attempted). In the explorer it
switches to **Original plan** (the D001 drawing, no satellite imagery), sets the camera on each place (rotation 0, as
drawn: north is to the left) and uses the explorer's own PNG export (the plan's vectors at 3840 px), then crops to the
box in `layout.json`. Positions are what the explorer draws: the master plan's place for the reference (master plan wins,
v6.85). A crop that would run off the drawing is slid back onto it. make_sheets.py stops if the data has a reference or
an area grouping the pictures were not cut for.

## Checks (`test_sheets.py`, local only)

`TMPDIR=<scratch> ZXING=<folder with zxing-cpp> python3 -I test_sheets.py`: **38 passed, 0 failed** (see
`test_sheets_results.txt`). It builds into a temporary folder and reads the PDFs back with pdftotext and, for the QR
codes, pdftoppm at 300 dpi and zxing-cpp:
- 55 pages (1 + 14 covers + 40 location pages), page 1 A4 landscape, the rest A4 portrait;
- every page: the track-only line, the twin-steer short form word for word, the DRAFT ribbon, Author: Andrew Fisher;
  every page with a map: the drawing credit;
- master legend: every area, its locations and units; the totals; every cover: name, counts, jobs a night, every
  reference;
- every reference: REF, each "how many" line, every asset number, its job words, both QR labels; FWF blocks state the
  Sunday extra and no water;
- all 75 completion QRs decode to exactly their link, each on its own page and in its own half; all 63 pinned location
  QRs decode to exactly their Google Maps pin; the 12 unpinned references have none; no stray QR; no `/e/` or `/v/`;
- a live-format run (a made-up 32-character token and 16-character codes made the way the server makes them, in a
  temporary folder): no DRAFT, token never printed, all 75 denser QRs (98 characters) decode at 300 dpi; the live run
  refuses to write inside the repository;
- refusals: an `/e/` link, a `/v/` link, a missing reference, a link naming another reference, two tokens, an unknown
  reference.

Looked at by eye (pdftoppm, `evidence/`): master map, area 1, 6, 11, 12 covers, the shared PG spot, WC20 (block + tank),
WC07 (20 FWF), WC09 (FWF + blocks), WC31, the Teams Area (no pin) and "No location yet".

## Notes for Andrew (nothing here changes the record)

- **T0024** (area 1 in your workbook, no pin on the record): the master plan draws it in the Main Beach SUPPLY compound,
  about 360 m from the pit lane. Its sheet circles that spot and the area 1 cover shows it as a separate small map. Worth
  a look on site.
- **Not on the map** (no pin and no place on the master plan): SPARE (0164), the Teams Area five (BJR01, SVP01, T0162,
  T0176, WC85) and WC100. Their sheets say "No pin" / "ask on site" and still carry asset numbers, jobs and the completion
  QR.
- **Pit garage FWFs** PG01, PG03, PG05, PG29 share one spot on the master plan; one circle, "shared spot".
- **WC81** is drawn in the plan's inset (Surfers Paradise); by the pins it is about 1.6 km from the rest of area 11.
- **Location QR** uses the record's pin only (the tracker contract). Locations placed on the master plan without a pin
  (PG01-PG29, T0024) get the map but no location QR.
- **QR links**: the completion QR is the tracker card's own link (`/d/<card token>`), the same kind the drivers' drop
  cards already use (server v5.56/v5.63); never the edit key, never the view link.
- **QR size**: live links are about 98 characters (QR version 6, level M), printed 36 mm square, about 0.7 mm a module;
  they decode at 300 dpi here. The phone pre-flight above is still needed on real paper and lamination.
- **Size**: the PDF is about 22 MB and `maps/` about 17 MB (the plan's own aerial background does not compress much).
