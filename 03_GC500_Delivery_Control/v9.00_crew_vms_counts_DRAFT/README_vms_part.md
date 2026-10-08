# v9.00 part D (publishes in v9.05): the iEDM VMS plan VMS001-26003-01, words only (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT**. Not uploaded, and not committed by this part.

## What Andrew sent

Andrew sent the iEDM VMS plan VMS001-26003-01 at about 11:00 AEST on 8 Oct 2026, about the VMS boards: "please see
attached update of vms boards". The source is STATUS.md, SYNC 11:08 AEST 8 Oct. It is 17 pages, a PowerPoint export dated 2 Sep 2026, with no title block or revision box printed
on it. It was reconciled board by board against D025 Rev 02, the schedule rows and the record. Three independent reviews
checked that work, and where a review refuted the reconciliation, the review wins. Andrew has **not yet said whether the
plan replaces D025 Rev 02**, so this part changes words only. It moves no position, count or money, and writes nothing to
the record.

The PDF itself stays private and is not in git. Its photographs show the phone numbers on the trailers, and its file
details carry a personal name.

## Base

The task named live v9.04 (`d0d63004…`, 11,450,666 bytes). **Live moved twice during the work:**

- **v9.07**, the Today clean-up: `25826d5e…`, 11,466,903 bytes. Its only DATA changes from v9.04 are `media` and
  `hostedMedia`.
- **v9.08**, the Timeline correction and drop map: `aa1480bdd43260ada39324bce0427c856edc07feccca26a5448baa9bb29b0c07`,
  11,502,176 bytes, footer ` · v9.08`. It makes no DATA change.

This part is built and tested on **v9.08**. It also applies cleanly to v9.04 and to v9.07 and passes `check_page` on
each, and the full test passed on v9.07 too.

The patch doesn't assert a base hash. It reads the base's own text: the anchors must each match exactly once, the D025
markers and the open items must be as found, and the base must contain `GC500Refresh904` (v9.04 or later). It refuses to
run twice (`vmsPlan905`). The footer is not touched.

## What changes (`patch_v900_vms.py`)

1. **Documents.** `DATA.docs.docs` gets one entry, placed straight after D025 under Drawings › "As issued — project
   26003":
   - **Title:** `VMS001-26003-01 · 2026 Gold Coast 500 VMS Plan (iEDM) · 17 pages · received 8 Oct 2026`.
   - **Hosting:** it is a catalogue entry with no file: no href, file, checksum, size or thumbnail. That is how the page
     already shows a paper the service doesn't hold (the red "not uploaded" light, as for the A3 map plates).
   - **Details** says it was received (with Andrew's words), that it is under review (open item R30) and that it is not
     hosted, and why.
   - **Key:** the catalogue key is the attachment's own file name, `VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf`.
   - **Count:** `DATA.docs.counts.map` goes from 40 to 41.

2. **The D025 sheet.** Seven markers gain a `note`, the marker field the sheet's tooltip already shows:

   | marker | note |
   |---|---|
   | 2A | `plan 02a` |
   | 5A | `plan 05a` |
   | 7A | `plan 07a` |
   | 04A | `plan: 03a (the plan moves 03 to this spot; it has no 04a)` |
   | 15 | `plan 15* — installed at the conclusion of track activity, stored T2 runoff` |
   | 18 | `plan 18* — Roadtek to remove/install Fri/Sat/Sun` |
   | 1O | `D025 itself types 1O` |

   - **1O shows as 10.** It also gains `face: "10"`. The reviews found that D025's own text layer types the letter O, so
     the page copied D025 faithfully. Only the display changes; the stored label stays `1O`, so the record form, the
     add-an-asset prefill and search are unchanged.
   - **The sheet note.** The sheet gains a `note`, shown once under the map. It lists the boards that are only in the
     plan, in the plan's printed words, which both transcriptions of pages 7 and 17 read identically: `In the iEDM plan,
     not on D025: 21 "STAGHORN AVE / SURFERS PARADISE BOULAVARD INTERSECTION (EAST BOUND)"; 22 "SOUTH OF SUNDALE BRIDGE
     (NORTHBOUND TRAFFIC) IN THE TRAFFIC SWITCH LANE AT TEDDER AVE INTERSECTION"; 23 "GC HIGHWAY (NORTH OF SUNDALE BRIDGE)
     ON THE EASTERN SIDE OF THE ROAD FOR SOUTHBOUND TRAFFIC"; 24 "THE ESPLANADE BEFORE STAGHORN AVE INTERSECTION (NORTH
     BOUND)". The plan's words as printed; no marker is drawn for them (iEDM VMS plan VMS001-26003-01, under review as
     R30).`
   - **What is left out.** No board is tied to a schedule row: the reviews refuted "T0103 = 22/23" and "the starred
     boards come with T0158". No interpretation such as "at Sundale Bridge" is added either.
   - **Code changes.** Each is a `rep()` that must match once:
     - the sheet note renders before the map hint in `renderMap_held`;
     - a marker with a face of its own, other than a master-plan layer marker, heads its tooltip and accessible name with
       that face;
     - `emptyCallout`, the card a tap on an unclaimed callout opens, shows the marker's face and its note. A phone has no
       tooltip, so this is where the cross-reference is read.

3. **Today, the VMS boards card.** One line is added to the card's notes: `Schedule 24 · iEDM plan VMS001-26003-01: 24
   boards + 4 moves · BOQ 23 · the project manager's 1 Oct answer: 22`.
   - **Inputs.** The schedule total and the BOQ figure are read where v8.75's note reads them (the group summary, and
     `DATA.schedule_review875.vms_boq`).
   - **Mechanism.** It is a wrap of `todayGroupDetails841`, as v8.75 and v8.94 do.
   - **Where it shows.** On v9.04, v9.07 and v9.08, v8.75's note still lives in the VMS card's "View details" fold
     (`details[data-tw841-group-card="vms"] ul.tw841-group-notes`). Neither v9.02's widescreen Today nor v9.07's clean-up
     moved it, so the new line sits directly under it.

4. **Open items and Questions.**
   - **R30.** `DATA.open_items` gets R30, the next free R number (TX is the carrier list's own series): `VMS plan
     VMS001-26003-01 vs D025 Rev 02 — to confirm`. It carries the six open points:
     1. which drawing governs;
     2. 03a vs 04A;
     3. 4 or 5 moves on 19 Oct;
     4. boards 21–24;
     5. which boards T0103 brings today;
     6. the 1211404 two-line question.

     Its priority line is "The project manager's answer on each point. Until then D025 Rev 02 stays the drawing the page
     works to."
   - **R16 and R23** each gain one sentence. R16 notes that the plan shows 24 boards plus 4 moves against the 1 Oct answer
     of 22. R23 notes that the plan is from the same day as D025 Rev 02 and differs from it.
   - **Where they show.** The About tab's open-items table shows all three. On Questions, R30 is asked under "Needs an
     answer". This comes from a wrap of `questionsList_753` that asks any open item the 1 Oct review table (QHIST) doesn't
     carry; on this base that is R30 alone, with "Open where it lives" going to Documents. R16's and R23's sentences show in
     their "Original wording" fold, which reads `DATA.open_items`.

## What does not change

- **Positions:** marker fx/fy/ax/ay on every sheet, including the master plan's VMS layer and its `VMS_TIPS` arrow tips;
  every `MASTER_LOC` entry; every navigation point.
- **Counts and money:** the Today counts (VMS 24 total, 8 done, 16 left); the T0159 relocation; Equipment's and Pricing's
  "VMS requirement confirmed: 22 boards"; every money model.
- **Records and driver cards:** the T0001 units; T0103's driver card and meet point; the record.

The patch asserts that every DATA key other than `docs`, `sheets` and `open_items` is unchanged, and that inside those
only the entries above change.

## Build

```bash
cd 03_GC500_Delivery_Control
toolchain/build.sh v905_vms v9.00_crew_vms_counts_DRAFT/patch_v900_vms.py
```

The build on live v9.08 gives `build/GC500_v905_vms/GC500_Delivery_Control_hosted.html`,
`5957f2f5cf9a0bc84cf697664bded64bdeee83ee844eb588dbc027f7d76ddd0a`, 11,508,262 bytes. The attribution scrub left it
unchanged, and `check_page` gives PASS: 25 inline scripts parse and no new keys were found. The earlier build on v9.07
was `d80c7ca7…` (11,472,989 bytes).

## Checks

- **Applies once only:** run a second time it refuses ("already applied") and leaves the page byte for byte as it was
  (checked on the v9.07 and v9.08 builds).
- **Applies to v9.04:** on `live_now.html` (`d0d63004…`) it applies and `check_page` passes.
- **Composes with part C:** the split part and this part apply in either order on v9.07 and on v9.08, and `check_page`
  passes. Their anchors don't overlap; part C edits the inside of the Today model functions, while this part wraps one
  and edits the map.
- **`tests/test_vms900.cjs`,** laptop and phone, through the shared browser lock, at the live address, with every write
  aborted. It reads the base and the build twice, back to back; if the live record moves between the two reads, it reads
  the pair again once. Results:
  - **Phone:** 56/56.
  - **Laptop:** 55/56 on the first run. The one fail was the live record moving between the base and candidate reads;
    every model comparison still matched. The test now rereads the pair once in that case. The laptop rerun is recorded
    in the handover.

  The test checks:
  - each of the four changes in DATA and on screen: the Documents row with its light and Details; the seven D025
    tooltips, accessible names and tap cards; 10 for 1O; the sheet note; the Today line, once, beside v8.75's note; R30 on
    Questions and About; R16 and R23;
  - base against build: no marker position on any sheet, no `MASTER_LOC` entry, no navigation point, no Today count or
    group detail (bar the one line), no progress, money, P&L, finance or labour model, and no other question changed;
  - every DATA key that carries money, counts, positions or joins is unchanged;
  - no dollar figure, email or phone number in the added words, and "the project manager", not the name;
  - no page errors, no console errors and `counts.blocked` 0.

  Run it like this:

  ```bash
  PAGE=build/GC500_v905_vms/GC500_Delivery_Control_hosted.html [MOB=1] node v9.00_crew_vms_counts_DRAFT/tests/test_vms900.cjs
  ```

  On an integrated build, set `BASE` to the same build without this part, because the other parts change their own
  figures (part C changes WC09's count). The keys the other v9.00 parts own (`team`, `broadcast`, `media`, `hostedMedia`)
  may differ (`PARTS_KEYS`).

## Open points

- **Edit mode shows an upload prompt.** It shows the page's generic "Not on the service yet — upload it with + Add" under
  every not-uploaded catalogue entry, this one included. The entry's Details says it is listed by name only. If the file
  is ever uploaded under its own name, the entry turns "Available" and its "Not hosted" sentence would need updating.
- **The Drawings tile count goes up.** It now reads 3 not uploaded instead of 2, because the plan is deliberately not
  hosted.
- **The Today line repeats two figures.** It repeats the schedule total and the BOQ figure from v8.75's line just above
  it, because the line asked for puts all four figures side by side.
- **R16's and R23's "Original wording" folds now include the 8 Oct sentence.** The fold reads `DATA.open_items`.
- **The Questions count goes up by one,** for R30.
- **Still for Andrew** (in R30): whether the plan replaces D025 Rev 02; 03a or 04A; 4 or 5 moves on 19 Oct; boards
  21–24; which boards T0103 brings today; and the 1211404 two-line question.
