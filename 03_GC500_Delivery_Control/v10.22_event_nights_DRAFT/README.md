# v10.22 — Event nights run sheet: a new tab, the per-night record, the printable sheet, three issued PDFs

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 02:20 AEST in Claude's chat: for the event weekend the Event Portables team (4 pump trucks,
1 water truck, 1 cleaner's vehicle, 12 staff; "these costs have already been covered as part of what we pay event
portables") services everything on nights, 19:00 to about 03:00, managed and audited by Kyle; "we need to create a tab
for this. This will be a run sheet." Friday and Saturday night: meet the team, issue updated site maps from the previous
night's recorded fill levels, run through the service order and allocate areas, spot checks that units are pumped out
and refilled, respond to relocation requests. Sunday night: final check no pump-out missed, equipment off roadways
before roads reopen, relocate WC46, WC55, WC24, WC25, WC23, WC26, WC62, WC35, WC65, WC72 and WB14 ×2 to accessible
collection points. "These are to be filled as complete and signed. Do not fill as unsigned drafts." About 04:20 AEST:
"Update and go live."

## What the patch does (`patch_v1022.py`, `nights1022.js`, `nights1022.css`)

- **A new tab, Event nights (`#nights`)**, phone first. It shows in the bar while open and sits in Tools otherwise (the
  primary bar keeps its one phone row). Three nights: Friday 23, Saturday 24, Sunday 25 Oct 2026.
- **Per night**: the night's tasks in Andrew's words (Friday/Saturday the five service tasks; Sunday the final check,
  roads and the relocation list); the **service order** of every toilet unit on the register (WC references in number
  order, cancelled and deleted ones left out — WC32 cancelled, WC66 deleted) with area allocated, pumped out, water
  refilled, fill level found (empty, ¼, ½, ¾, full), spot check and a note on each line; **relocation requests** added and
  ticked off; the **night manager's end-of-shift sign-off** (name, start, finish, notes, signed) and **the project
  manager's audit**. Saturday and Sunday show what the previous night recorded (how many fill levels, pumped, refilled)
  so the updated maps go out from it. The Map explorer is one button away.
- **The record**: every tick, level, note, request, sign-off and audit is its own document on the shared `loads`
  collection, `kind: "nights1022"`, keyed `nights1022/<night>/<part>/<id>` (e.g. `nights1022/2026-10-23/unit/WC23`),
  written through the page's own path — `mayWrite` (edit link only), `whoAmI` (the name recorded on this device),
  `stampIt`, `save`, `bump` — so each line carries who and when, two phones never overwrite each other, and the
  truck-load code ignores them (no `keys`, no `card`). A view link shows everything and can change nothing.
- **The run sheet on the day-document print path**: `#print/nights/<date>` opens the tab with the print bar
  ("Event night run sheet · <date> · 1 page", Print / Save as PDF, Close), one A4 sheet in the pre-start's own print
  style (`PS7_CSS`): header, team line, tasks, the service order in two columns, the relocation requests block, the
  sign-off and audit boxes, and "Issued and signed: Andrew Fisher, Shutdown Manager · 15 Oct 2026". With a night's record
  on it the sheet prints the ticks, levels, notes, requests and sign-off as recorded.
- Nothing is pre-ticked. No cost lines. No staff names invented: the night manager is "Kyle", Andrew's word; the
  night team is described by its vehicles and count, as Andrew gave them.
- Footer ` · v10.21` → ` · v10.22`. Nine anchors in the main script, each matched exactly once (tab list, glyph, pane,
  render dispatch, the print deep link, the print bar document and words, hash-to-tab), plus the script and style blocks
  before `</body>`.

## The three issued PDFs (`generate_nights.cjs` → `pdfs/`, `manifest.json`, `evidence/build.json`)

Made from the page's own renderer (the built page opened through the harness, read only, every write aborted; the
sheet HTML and the page's print CSS taken from it; Chromium print to A4), one per night, blank, nothing ticked, with the
issued-and-signed line. Uploaded with `upload_nights.py` (the pre-start uploader with crew `nights`; no removals) as
kind `pack`, by Andrew Fisher; they list on the tab under "Issued run sheets on the record" and in Documents → Packs.
Their titles do not say "pre-start", so the Pre-starts tab does not pick them up.

| file | night |
|---|---|
| `GC500_EventNights_RunSheet_2026-10-23_Issued.pdf` | Friday 23 Oct 2026 |
| `GC500_EventNights_RunSheet_2026-10-24_Issued.pdf` | Saturday 24 Oct 2026 |
| `GC500_EventNights_RunSheet_2026-10-25_Issued.pdf` | Sunday 25 Oct 2026 |

Hashes and sizes are in `evidence/build.json` and the upload report.

## Checks (`tests/test_nights1022.cjs`, read only through the harness; results in `tests/test_nights1022_result.json`)

```sh
toolchain/build.sh v10.23 v10.22_event_nights_DRAFT/patch_v1022.py v10.23_map_pin_accuracy_DRAFT/patch_v1023.py
PAGE=build/GC500_v10.23/GC500_Delivery_Control_hosted.html node v10.22_event_nights_DRAFT/tests/test_nights1022.cjs
PAGE=build/GC500_v10.23/GC500_Delivery_Control_hosted.html node v10.22_event_nights_DRAFT/generate_nights.cjs
```

| check | result |
|---|---|
| view link, phone: the pane, three nights, five Friday tasks, 64 units in number order (WC32 cancelled and WC66 deleted left out), every tick disabled, nothing pre-ticked, no page errors, no writes | pass |
| edit practice, phone (capability overridden; every PUT aborted by the harness): a unit tick and level, a task, a request and the sign-off accepted, a wrong night refused; one document each with stamp and name; the page tried exactly the planned 12 PUTs (loads, stamps, by × 4 keys), nothing else; the unit document as sent carries the record | pass |
| print path, desktop: `#print/nights/2026-10-25` → the tab, the bar ready, one sheet, 64 rows, 11 relocation marks, form id, issued line, zoom 1, Close restores the page | pass |
| the other tabs still route (Today, Pre-starts, Fencing, Map), no errors | pass |
| desktop sweep / phone sweep | see STATUS.md top entry |
| phone screenshots looked at | `tests/shots/phone_nights_view.png`, `phone_nights_units.png`, `phone_nights_edit_practice.png`; the printed sheet `desktop_print_sunday.png`; the PDFs read back page by page |

## Source

| file | sha256 |
|---|---|
| live v10.21 (base) | `06d6e6b0956c793299c99b5e48a7ee1c3fe16616f20a60ff0696d410f111848d` |
| candidate (v10.22 then v10.23) | see STATUS.md top entry |
