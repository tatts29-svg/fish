# Servicing sheets: the laminated print pack (DRAFT)

## Scan layout draft — 21 Oct 2026

Author: Andrew Fisher. Each reference has a full-width scan row with fixed lanes: **Pump out**, **Clean & restock**,
then **Location**. Each card repeats the reference as well as its action; the labels identify the action without relying
on colour. Cards have 8 mm gutters. QR squares are 30 mm on paired sheets and 40 mm on full sheets, with their original
quiet zones and exact destinations preserved. Missing task lanes stay blank; a reference without a pin has no location
code. Normal-size details are measured before pairing; dense references get a full page with a larger, undistorted map.
The existing equipment-shaped symbols, assets, service plans and contact rules are unchanged.

Mode markings render behind content, so opaque white cards keep watermarks out of every QR and its quiet zone.
`test_scan_layout.py` checks exact destinations, lane order despite native JSON key order, measured separation, repeated
labels, and white quiet zones in rasterised output. Validation: scan layout 3/3; readiness 10/10; symbols 12/12; all
existing sheet assertions 49/49, including QR decoding at 300 dpi. Digital checks do not replace the existing physical
phone scan/readiness receipt required before real-mode output and handout.

## Current generator checks — 21 Oct 2026

Author: Andrew Fisher. Signed `--mode test` output is a scan-check copy and explicitly warns against saving test completions. Reference crops show the existing per-line positions where supplied, using the same labels as area maps. The master legend fits complete names, counts and not-on-map warnings without changing its two-row layout. Source data, map coordinates, code destinations and real-mode readiness guards are unchanged.

Validation: `test_readiness.py` 10/10; the complete `test_sheets.py` assertions 49/49 using in-memory PyMuPDF rasterisation at 300 dpi with zxing-cpp. The focused drawing checks cover split-position labels, the unchanged ordinary marker path and full legend text. These are source/tool checks, not physical-phone or lamination readiness. The dated page counts and examples below describe earlier snapshots; use the generator output for the current pack.

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

`GC500_servicing_sheets_DRAFT.pdf`: A4, 68 pages, built from `../tracker_data.json` (the one data file the tracker uses)
and the master-plan pictures in `maps/`.

| page | what |
|---|---|
| 1 | **Master map** (A4 landscape): the D001 master plan with the 13 areas outlined in their colours and numbered, a dot per location; legend with every area's name, locations and units (Teams Area and "No location yet" say "not on the map"); totals (75 locations, 263 units) and jobs a night (760 on Thu 22 if needed, Fri 23 and Sat 24; 777 on Sun 25 night). North arrow, approximate scale bar, drawing credit. |
| 2-68 | **Each area**: a cover sheet, **its own master map** (areas 1-13), then its locations two to a page. Areas in Andrew's order 1-13, then "No location yet". |

Page ranges for printing one area's pack several times (make_sheets.py prints them after every build):
1 Pit Lane & Paddock 2-7 · 2 Island North / Freight 8-13 · 3 Island West / Merch 14-17 · 4 Commodore Park 18-21 ·
5 Median Strip — Race Admin & Merch 22-24 · 6 Median Strip — FOAM / Other Toilets 25-28 · 7 Main Beach Parade / Seaside
North 29-32 · 8 Main Beach Seaside — Supply / North 33-38 · 9 Main Beach Seaside — Mid-South 39-44 · 10 Main Beach
Seaside — South 45-49 · 11 Surfers Paradise / Cypress 50-54 · 12 Helen Park / The Hill 55-61 · 13 Teams Area 62-66 ·
No location yet 67-68.

**Each area's own master map** (Andrew, 19 Oct 2026: "Each 13 sheets should have a master map. A map of the refence
areas"): straight after the area's cover, A4 landscape. It is the same master map as page 1, but with that area in its
colour (thick outline, filled) and the other 12 greyed. The legend rings that area. The heading reads "AREA n · name ·
WHERE IT IS ON THE SITE" with the area's locations and units. Teams Area is not on the master plan, so its copy says so
in red ("ask on site"). The area cover keeps its own map with every location circled, so each area pack carries both
maps. Laminate the cover and its master map back to back. The master map is drawn 5 mm shorter than its box (same shape)
so the legend's second row no longer runs into the footer, which was a fault on page 1 since 18 Oct.

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
Andrew Fisher", page n of 68, printed time, the data version and hash, the page the maps came from. Every map carries
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

### Going live (after server v5.90 and page v10.67 pass their release checks)

1. Create the TEST tracker from Event nights. Download its private QR bundle **outside the repository** and build
   `python3 -I make_sheets.py --links /private/test_links.json --out /private/TEST_sheets.pdf`. The bundle supplies
   its actual rehearsal dates and confirmed contact. Run the rehearsal before making the event tracker.
2. Read back the existing event tracker and download its own bundle. Build a scan-check copy of its sheets with
   `python3 -I make_sheets.py --links /private/event_links.json --out /private/event_scan_check.pdf`. Signed links
   default to `--mode test`, which prints **SCAN CHECK**, **SIGNED TRACKER CODES** and **DO NOT SAVE TEST COMPLETIONS**.
   This print mode does not create a practice tracker or make the signed codes harmless: event codes still open the
   event tracker. Scan the completion and location QRs using both iPhone and Android cameras without saving test
   completions. Verify the correct reference/day and offline preparation; record those checks in the private
   readiness receipt. Do not laminate or hand out this scan-check copy.
3. `python3 -I make_sheets.py --links /private/event_links.json --mode real --readiness /private/readiness.json --out /private/GC500_servicing_sheets.pdf`
   A real run requires the matching receipt, token, data hash and confirmed contact. It refuses a PDF or link file
   inside the repository, links outside `/d/<token>#r=REF.<16-character code>`, a wrong/missing reference or mixed
   tokens. Print the required area packs and laminate after these checks. The token is never printed as text.
4. Same-token updates preserve the completion codes. Withdrawal or deliberate re-keying invalidates old sheets;
   a new token or replacement key requires reprinting. The page does not offer either destructive action.

Legacy `{token, links}` or `--urls` files remain supported, but supply their matching data/contact explicitly.

References with existing per-line map positions use the same asset-labelled markers on their reference crops as on
the area maps. Each marker shows the units at that recorded position. Ordinary references keep their single marker;
the reference-level LOCATION QR is unchanged. This rendering does not move pins or change the source record.
The master-map legend fits complete area names, quantities and location warnings into each existing three-line cell,
reducing text only where it needs room rather than dropping words. Its two-row layout is unchanged.

Area maps and reference crops use vector equipment symbols: toilet, toilet block, pee panel, 16-pan block,
accessible toilet and waste tank. Each area-map key uses the same drawings. A mixed location has one capsule
centred on its recorded coordinate, with a symbol for each distinct equipment type; quantities remain in its label.
Line-specific positions stay separate. Unknown named types use a question mark, not a guessed toilet symbol.
Symbol support does not add records or change servicing eligibility. The master overview retains its area dots
and numbered area boundaries; detailed equipment symbols are on the area and reference maps.
Labels account for the complete mixed-marker footprint and remain within the map margins.

`python3 -B -I test_symbols.py` checks type selection, mixed locations, print-size vector shapes and the key
(requires PyMuPDF). `test_readiness.py` also checks preservation of split-unit positions and QR destinations.

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

`TMPDIR=<scratch> ZXING=<folder with zxing-cpp> python3 -I test_sheets.py`: **44 passed, 0 failed** (19 Oct 2026) (see
`test_sheets_results.txt`). It builds into a temporary folder and reads the PDFs back with pdftotext and, for the QR
codes, pdftoppm at 300 dpi and zxing-cpp:
- 68 pages (1 + 14 covers + 13 area master maps + 40 location pages), master maps A4 landscape, the rest A4 portrait;
- each of the 13 areas has its own master map straight after its cover, with its name, counts and the full legend;
- every How to use box has all five steps (the box shrinks the type to fit rather than drop one; areas 2 and 12 had lost step 5);
- every page: the track-only line, the twin-steer short form word for word, the DRAFT ribbon, Author: Andrew Fisher;
  every page with a map: the drawing credit;
- master legend: every area, its locations and units; the totals; every cover: name, counts, jobs a night, every
  reference;
- every reference: REF, each "how many" line, every asset number, its job words, both QR labels; FWF blocks state the
  Sunday extra and no water;
- all 75 completion QRs decode to exactly their link, each on its own page and in its own half; all 63 pinned location
  QRs decode to exactly their Google Maps pin; the 12 unpinned references have none; no stray QR; no `/e/` or `/v/`;
- a live-format run (a made-up 32-character token and 16-character codes made the way the server makes them, in a
  temporary folder): scan-check labels with no practice/sandbox claim, token never printed, all 75 denser QRs (98 characters) decode at 300 dpi; the live run
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

## Readiness fixes for the next release (18 Oct 2026)

Author: Andrew Fisher. The generator now distinguishes three modes. Placeholder links default to **DRAFT**. Signed
links default to the **scan-check copy** (`--mode test`), with a signed-code/no-test-completions warning on every page;
this print mode does not change the destination tracker or its ability to save. Merely possessing a correctly shaped
token does not label a pack LIVE. `--mode real` is explicit and requires a confirmed contact and private readiness receipt.

Use the same contact as the crew card with `--contact-name` and `--contact-phone`. Every page carries it. Without a
contact, DRAFT/TEST pages say to check with the site supervisor before the run, rather than pointing to absent contact
paperwork. The real mode refuses a missing or partial contact. Offline instructions now require opening a sheet with
signal and waiting for **Ready for offline scans** before relying on later scans without signal; waiting ticks are
clearly separate from the service having saved them.

The current QR bundle supplies its matching TEST dates automatically. For an older link-only file,
pass its matching rehearsal data with `--data`. The event
source file is not relabelled or modified for rehearsal.

A real command is:

```bash
python3 -I make_sheets.py --links /private/tracker_links.json --mode real \
  --contact-name '<confirmed name>' --contact-phone '<confirmed phone>' \
  --readiness /private/readiness.json --out /private/GC500_servicing_sheets.pdf
```

The private readiness JSON is an operator’s evidence receipt, not generated proof. It must contain the same `token`,
`data_sha256` (the generator’s printed data hash, or SHA256 of the exact `--data` file for a legacy bundle), `contact: {name, phone}`, and the following booleans true only after
those checks have actually completed: `test_checks_passed`, `real_tracker_read_back`, `iphone_paper_scan`,
`android_paper_scan`. A mismatched token, data, contact or incomplete check refuses real output. Keep the receipt,
signed links and real/test pack outside the repository. Nothing in this generator sends a message or writes a tracker.

Regression checks added in `test_readiness.py`: seven tests passed, including every receipt-field mismatch. The full
PDF/QR suite also passed 42 checks, including all completion and location QR decoding at 300 dpi. The DRAFT PDF
has been regenerated from these sources. No real tracker or physical phone scan is certified by those local tests.


The Create / update button now downloads a private QR bundle that includes `data_json` (the exact
published card dates, quantities and plans) and its confirmed contact. `--links <bundle>` uses those
values automatically, so a TEST rehearsal prints its actual TEST date rather than the event dates.
An explicit `--data` or contact must match the bundle. A TEST bundle is refused in real mode. The
generator prints the data SHA-256 to use in the private readiness receipt. Older `{token, links}`
files remain supported with explicit matching data/contact where needed. Seven readiness tests pass.
