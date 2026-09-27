# GC500 Delivery Control v7.00: the day's documents on the Timeline

Coates Industrial Solutions · GC500 2026 · Author: Andrew Fisher

## Files

| What | Where |
|---|---|
| Patch | `scratchpad/patch_v700.py` (`python3 patch_v700.py <page.html> [dayprint700_src.js] [dayprint700.css]`) |
| Code | `scratchpad/dayprint700_src.js` (inserted ahead of `function dayPrint(iso){`) |
| Style | `scratchpad/dayprint700.css` (added to the page's own `<style>`, never inside a script, so the attribution scrub cannot fold a selector) |
| Built page | `scratchpad/GC500_Delivery_Control_hosted_v700.html` = v6.96 live + patch + `scrub_attributions.py`; all 3 inline scripts pass `node --check` |
| Also applies to v6.99 | `stage8/v699_plus_v700.html` (built the same way; 3 scripts, 0 errors) |
| Build (no upload) | `stage8/build.sh <base.html> <out.html>` |
| Samples | `stage8/samples/GC500_{Driver,Installer}_{2026-09-28,2026-10-07}.pdf` |
| Previews (150 dpi) | `stage8/shots/GC500_*_p1.png` and one other page each (`_p4` for 28 Sep, `_p8` for 7 Oct) |
| Day row | `stage8/shots/row_desktop.png`, `row_desktop_email_open.png`, `row_phone.png`, `row_phone_email_open.png`, `row_phone_with_fifth.png` |
| Emailed-link view | `stage8/shots/link_drivers.png`, `link_install.png`, `link_prestart.png` |
| Tests | `print700.js` (PDFs and fit), `row700.js` (row, email, copy, link routes), `mail700.js`, `ps700.js` (Pre-start states), `gaps700.js` (record gaps), `qrcheck.py` (QR decode) |
| G-Link spot check | `stage8/glink/` (16 Oct, the only day with a reference in the light rail corridor) |
| Earlier worker's first version | `stage8/prev/` (kept for reference only) |

## The day row

Each Timeline day card's row is exactly **[Pre-start] [Drivers] [Install] [Email ▾]**, in a container `div.daynav.dprow.tlday-ctl` whose content is the single expression `${dpDayButtons(d)}`.

- **Pre-start** calls the existing `ps7Print(iso)` (v6.97). It is enabled when `ps7State(ps7Day(iso)).state === 'ready'`. On a later day it is greyed (`aria-disabled`) with the title "Prefilled automatically on <batch day>", for example "Sun 04 Oct 2026" for 7 Oct; a click only shows that message. It is hidden on past days and on days with no pre-start. Checked with `ps700.js`.
- **Drivers** calls `dpPrint(iso, 'drv')` and produces GC500-DRV-01.
- **Install** calls `dpPrint(iso, 'ins')` and produces GC500-INS-01.
- **Email ▾** is a drop-down with Pre-start, Drivers and Install. Each opens a `mailto:` and has "Copy the email text" beside it. The Pre-start entry follows the Pre-start button's state.
- **Removed from the row:** Add an asset to this day, Delivery advice, Email the advice, Email this day, Print the day, Copy link. Their functions (`addToDayDialog`, `adviceSheet`, `adviceMailto`, `dayMailto`, `dayPrint`, `copyLink`) and their wiring lines are still in the page; the test confirms they are functions.
- **Phone (390 px):** `.tlday-ctl` becomes one row of equal columns (`grid-auto-flow:column`), however many controls it has. With a stand-in fifth "Edit" button after Email, all five sit on one line, 63 px each. The Email menu repositions itself to stay on screen (left 8 px, right 348 px of 390).
- **For the v7.02 Edit button:** add it after `${dpDayButtons(d)}` inside `.tlday-ctl`. No CSS change is needed.

## The two documents

The documents are one A4 page per load, and every page is measured and fitted to that one page before printing. The page's text scales down (to 0.80–0.86 on these samples) before the photo band drops below 52 mm. Only then does the photo grid lose its lowest-priority picture, and nothing ever runs onto a second sheet.

### Load rule

A load is a truck:

1. rows on the schedule with the **same load time and the same carrier**, or
2. the references a load on the carrier's **transport plan** names as its candidates.

Otherwise each reference has its own page. The page says which in the "Load" line: "One truck · 3 refs · same time and carrier", "One truck · load N on the transport plan", or "Own page · no shared load recorded".

- **Mon 28 Sep, 7 pages:** P38 (09:00 SFL), P39 (09:30 SFL), P42 (10:00 SFL), GN01 + WC01 + WC42 on one truck (10:30 SFL BOGIE), P06 (10:30 "SFL", a different carrier from "SFL BOGIE" as written, so it gets its own page), then WC41 and WC43 (carrier "TORRENS 1" with no load time, so they are not assumed to share a truck).
- **Wed 7 Oct, 13 pages:** the schedule gives no load time or carrier for any of the 13 references, so each has its own page.
- **Across the programme:** 234 references make 226 loads; 20 of those come from the load-time and carrier rule and 206 are single references.

### Page layout (both documents)

1. **Header:** the Coates wordmark (orange), "Delivery driver sheet · GC500 2026" or "Install team sheet · GC500 2026", "Delivery · Mon 28 Sep 2026", the document ID (GC500-DRV-01 or GC500-INS-01) and "LOAD X OF Y".
2. **Hero:** the reference in Barlow Condensed bold (the page's embedded face). It is sized by measurement to fill its band: 120 pt for one reference, and about 50 pt each for three on one truck (limited by width; the band then gives its spare height to the photos). Under it is one line: "1 × Building 6m → Green Room 1". Beside it are Date, Load time (Truck leaves on the installer sheet), Carrier, On site and Load.
3. **On the truck:** what (quantity × item), asset numbers, and accessories (tick boxes on the installer sheet).
4. **Where it goes:** location, sector, next to, beside, near. The driver sheet adds "From gate" (compass and distance), "Way in" and "Escort"; the installer sheet adds the drawing callout with its sheet and "Door faces". Beside these is the position box: a navigate QR, the coordinates, and either "Phone pin · <who> · <when>" or "From master plan D001 · not a phone pin".
5. **Photos:** an even grid with short captions. The driver sheet shows Whole site, From the road, Close-up and Master plan; the installer sheet shows Master plan, Close-up, Around it and The product. Further pictures (Master plan · area, Drawing · callout, On site photos) are used when they fit. A multi-reference load shows "Every drop on this load" plus each reference's master-plan crop.
6. **Install list** (installer sheet only): the crew's own work list (`WORK` / `PS7.work`) for what is on the truck, plus arrival, photos and asset numbers recorded in the page.
7. **Safety**
   - Driver sheet: a one-line site-rules summary (PPE, site hours); a red **JSEA REQUIRED** box, word for word: "The driver must complete a Job Safety and Environmental Analysis (JSEA) before unloading. This applies to every load. No JSEA, no unload."; and the **TAKE 5** box.
   - Installer sheet: the TAKE 5 box only, with no JSEA anywhere.
   - Both: **COATES LIFE SAVING RULES — read and followed on every task**, all six rules word for word from `LIFE_RULES` in the card's order and colours (#c8463c, #8a8352, #3c4247, #ef6b1e, #4d7141, #1f3a5f).
8. **Documents:** a QR code, the title, the reference and the page count for each.
9. **Contacts:** the Coates site lead, the Coates office (driver) or the three installers (installer), the iEDM safety and traffic coordinator, the iEDM site manager, and Emergency 000.
10. **Footer:** "Coates Industrial Solutions · GC500 2026 · Author: Andrew Fisher", one provenance line ("From the GC500 record, <time> · A ruled line means not yet recorded"), and "GC500-DRV-01 · <date> · Load X of Y".

There is no sign-off anywhere, and no explanatory sentences on the page.

### Documents by page

| Page | Documents (each a QR to `location.origin + /f/Coates-GC500-2026/<id>`) |
|---|---|
| Driver, every load | SEQ-SWMS-009.01g Loading and unloading at third party sites (34 pages) |
| Driver, when the load has a portable building, container or toilet block (not a portaloo) | SAF-PRO-075 Safe Transport of Portable Buildings (6 pages); TRAN-WI-R1.2 Pre-Transit Checklist — Site Accommodation Work Instruction (10 pages); Help Sheet 81 Guidance sheet for lifting portable buildings (1 page). All three are looked up by id; the register files them as `kind: 'transport'`. |
| Driver, only where the record puts the location or route in the light rail corridor | SEQ-RM-010d G-Link light rail work (15 pages). This is only WB05, on 16 and 27 Oct. |
| Installer, every load | SEQ-SWMS-x TSV500.1 Portable buildings and toilets, installation and removal (20 pages); SEQ-SWMS-009.01g Loading and unloading at third party sites (34 pages). No fencing, no G-Link. |

The HSEQ plan is optional and has been left off both documents to keep them simple.

### Where each field comes from

| Field | Source |
|---|---|
| Reference, item, quantity, accessories, notes | the schedule rows (`events`) and the asset (`item_types`, `accessories`, `asset_notes`) |
| Asset numbers | `asset_numbers` plus the rental system's machines on hire, minus numbers taken off |
| Load time, carrier | the schedule row (`load_time`, `carrier`) or the transport plan's load |
| On site | `DATA.transport.arrival.after` ("after 07:00") |
| Location | `whereText(a).main` (the schedule's location, never an origin) |
| Sector, next to, beside, near | `MASTER_LOC` (`sec`, `next`, `beside`, `near`) |
| Callout | `drawing_links[0]` (label and sheet) |
| Door faces | only a schedule note that mentions orientation, a door or facing; otherwise a ruled line |
| Position | a phone pin first (`S.fixes`, the latest by time, never a master-plan fix), then the master-plan position, then the placed or drawn position |
| Way in, from gate | `heavyGate()` (Tedder Ave access point, gate G10) and `bearingBetween` |
| Escort, PPE | `DATA.driver_rules` |
| Site hours | `DATA.site` |
| Photos | the aerial (`AERIAL_SRC`), the master-plan crops (`MASTER_LOC.img`), the drawing (`sheetSrc`), `productPhoto`, drop photos on the record |
| Life Saving Rules, install list | `PS7.life` and `PS7.work` (from `render_prestart.py`) |
| Contacts | `TEAM.people` and `DATA.site.contacts` |
| Documents | `DATA.docs.docs` by id (reference, title, pages) |

## What the record lacks

Where the record has no value, the page prints a ruled line. Nothing is filled in by guesswork.

Counts across all 41 programme days (234 references):

| Missing | References or loads |
|---|---|
| Load time | 206 of 226 loads (all 13 on 7 Oct) |
| Carrier | 180 of 226 loads |
| Sector | 122 references (P38 included) |
| Next to | 132 |
| Beside | 127 |
| Near | 73 |
| Door or orientation note | 232 of 234 |
| Coates asset number | 122 |
| Drawing callout | 79 |
| Any position at all | 35 |

Positions: 41 references have a real phone pin, 122 a master-plan unit position and 36 a master-plan area. No reference on 28 Sep or 7 Oct has a phone pin, so their sheets say "From master plan D001 · not a phone pin".

## Email (the Email ▾ drop-down)

- `mailto:` with **no recipient**.
- Subject: "GC500 — Delivery drivers — Mon 28 Sep 2026", "GC500 — Install team — …" or "GC500 — Daily pre-start — …".
- Body, in plain Australian English:
  - a greeting and one line about the document;
  - **one view link** to that day's document, `https://gc500-production.up.railway.app/v/Coates-GC500-2026#print/drivers/2026-09-28` (built from `location.origin` + `/v/Coates-GC500-2026`, never the page's own token);
  - the loads, one line each ("09:00 SFL: P38 Building 6m, Green Room 1");
  - the SWMS and procedures by title, each with its `/f/Coates-GC500-2026/<id>` view link;
  - a safety line (JSEA before unloading on the drivers' email; Take 5 on all);
  - "Coates Industrial Solutions, GC500 2026".
- **Length:** kept to 1,800 characters or fewer by dropping load lines from the end and adding "and N more — all on the linked sheet".

| Email | 28 Sep | 7 Oct |
|---|---|---|
| Pre-start | 1,328 chars, 7 of 7 loads | 1,460 chars, 13 of 13 |
| Drivers | 1,735 chars, 4 of 7 (four document links) | 1,797 chars, 7 of 13 |
| Install | 1,309 chars, 7 of 7 | 1,442 chars, 13 of 13 |

**Copy the email text:** calls `navigator.clipboard.writeText` inside the click handler and copies the subject plus the full list, uncut. If the clipboard is refused, it opens a panel with the text in a selected textarea. Both paths were tested.

**Link routes:** `#print/drivers/<iso>`, `#print/install/<iso>` and `#print/prestart/<iso>` open the day on the Timeline. The route waits for the shared record, builds the document and tries to print. A dark bar at the top carries "Print / Save as PDF" (always usable once built; it calls `window.print()` inside the click, and for the pre-start it re-runs `ps7Print`) and "Close". The pages stay on screen for a browser that will not open the dialog itself. Close restores the page and leaves the address at `#day/<iso>`. All three were tested: 7, 13 and 1 pages, with no errors.

## QR decode results

Every QR in the printed PDFs was found by its vector square, rendered at 400 dpi and decoded with OpenCV (`qrcheck.py`, results in `qrcheck.json`).

| Sample | Pages | Codes | Decoded correctly |
|---|---|---|---|
| Driver 28 Sep | 7 | 28 (9 navigate, 7 unload, 4 × 3 transport) | 28 |
| Driver 7 Oct | 13 | 47 (13 navigate, 13 unload, 7 × 3 transport) | 47 |
| Installer 28 Sep | 7 | 23 (9 navigate, 7 buildings and toilets SWMS, 7 unload) | 23 |
| Installer 7 Oct | 13 | 39 | 39 |
| G-Link check, 16 Oct | 7 + 7 | 30 (G-Link once, on WB05's driver page only) | 30 |

- Every document code decodes to `https://gc500-production.up.railway.app/f/Coates-GC500-2026/<the right id>`.
- Every navigate code decodes to a Google Maps route to exactly the coordinates printed beside it.
- No code carries an edit link or a token.
- The six document URLs were checked live with GET: each returns `application/pdf`.

## Notes

- **JSEA wording on collections:** the JSEA text is word for word as asked ("before unloading … No JSEA, no unload") on every driver page, collections included. Nothing links the JSEA to the site team.
- **Attribution scrub:** the patch refuses a source that would put a space before a class selector (`" .dp…"`) inside a script. The only "Andrew Fisher" left in the code is the author-credit fallback the scrub keeps.
