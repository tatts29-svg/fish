# v10.23 — Map pin accuracy review: every position recomputed; WC57 and WC59 footprints put on their own units

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 03:35 AEST in Claude's chat: "Also review maps. Everything should be 100 % accurate to the
metre of location and pinned. Pinned location should be 10/10 with location. We have exact location on maps so needs
to be perfection." About 04:20 AEST: "Update and go live." About 05:40 AEST: "We are not waiting on a new master from
iEDM" — so nothing on this page waits for a reissued D001; the Gate 6 positions John Brett sent on 14 Oct are the
positions of record, and anything still outside the metre is for a measured point on site.

## What was reviewed (read only, `audit_1023.py`, findings in `findings_1023.json`)

Every reference's position was recomputed from the page's own data on live v10.21 `06d6e6b0…`:

| check | result |
|---|---|
| `MASTER_LOC.ll` recomputed from `MASTER_LOC.pt` through the explorer's registration (the page's `GENERATOR_GEO1017` matrices, main plan and Cypress inset) | 166 references, median 0.05 m, worst 0.24 m (WC81, in the inset). The navigation and QR destinations agree with the sheet points. |
| `DETAILS1002` reviewed-destination coordinates against `MASTER_LOC.ll` | 32 of 32 agree to 6 decimals (the reviewed text shows for every one of them). |
| GN13 guard in `generatorDestination994` against `MASTER_LOC.GN13.ll` | agree. |
| `MASTER_LAYERS` marks (95) | unchanged, not touched. |
| v6.85 `master_loc.json` (27 Sep) against today | 162 shared, 92 within 0.5 m; 29 moved more than 5 m since, every one by a later release on Andrew's word (v8.89, v9.17/v9.21 pins onto the drawn units, generators, Gate 6). P27, P29, T0243 and WC10 are new since. |
| `locations_from_master_27sep/resolved.json` against today | 162 shared, 91 within 0.5 m, 30 moved since, the same releases. |
| the 33 places written to the native record on 29 Sep | five now sit 2.4–4.2 m from today's master (WC16, WC17, WC04, WC02, WC12). They are shadowed: the master position wins for every `prec:'unit'` reference, so nothing shows them. Left alone. |
| footprint anchors (`MASTER_SHAPES926_DATA`) against `MASTER_LOC.pt` | 163 footprints; the one swap: **WC57's anchor sat on WC59's unit and WC59's on WC57's (9.4 m each)**. The rest over 2 m are explained: WC07 26.6 m (one tag for a 20-toilet group, the tag is the second of two), P26/P28 5–7 m (one block tag for four buildings), WC01, WC51, WC20 2–3 m (tag beside the outline). |

## What the patch changes (`patch_v1023.py`, data only)

- `MASTER_SHAPES926_DATA.shapes.WC57` becomes the pair of toilets inside the SUPPLY fence (2 parts) with its anchor on
  WC57's own master position; `…shapes.WC59` becomes the row of 7 with its anchor on WC59's. Both use the base page's own
  traced polygons, nothing redrawn; the tracer's "drawn as WC59" and medium-confidence flags come off the parts they
  belonged to. The block's `data-sha256` is re-hashed (`15a7a888…` → `d5b6f25a…`).
- Why WC57 is the pair and WC59 the row: `MASTER_LOC` reads "the middle of the 2 toilets drawn inside the SUPPLY fence"
  for WC57 and "the middle of the 7 toilets drawn on the master, the long row" for WC59; the register has WC57 ×2 and
  WC59 ×7; the 14 Oct Event Portables arrival record has WC57 ×2; Andrew confirmed the navigation pins on 8 Oct and the
  v9.21 moves on 9 Oct. The v9.26 footprint tracer had matched them the other way round, five of its seven parts at
  medium confidence.
- A one-line provenance note (`footprint1023`) on the two `MASTER_LOC` entries.
- Footer ` · v10.22` → ` · v10.23` (applied after `patch_v1022.py`; `--footer-from v10.21` applies it straight onto live v10.21).
- No lat/lon, sheet point, navigation destination, QR, card text, quantity, rate or charge changes; no other footprint moves.

## What the repo cannot settle (not waiting on anyone — for a measured point on site if it matters)

- The master D001 PDFs (17 Sep, 2 Oct) are not in the repo, so no tag or symbol centre can be re-derived here; the
  positions stand as the earlier releases read them from the drawing.
- Gate 6 (P60, P62, P63, WC49, GN06): drawing positions from John Brett's 14 Oct layout, fit rms 1.7 m, worst residual
  about 2.5 m. They are the positions of record (Andrew, 05:40 AEST); the page's "approximate" wording stays until a
  measured point says otherwise.
- The explorer registration's held-out error is up to 1.6 m and the two registrations on the page (explorer satellite
  and the 2022 aerial) disagree by up to 0.85 m; the phone pins on the record are ±3–6 m. "To the metre" on the ground
  needs a measured point, not a drawing.
- Which generator symbol is which GN (the master has no generator tags), which building of the P26/P28 block is which,
  and the 13 LTC towers marked `unverified` need a site answer.

## Source

| file | sha256 |
|---|---|
| live v10.21 (base) | `06d6e6b0956c793299c99b5e48a7ee1c3fe16616f20a60ff0696d410f111848d` (15,901,228 bytes, 120 scripts) |
| candidate with v10.22 then v10.23 | see STATUS.md top entry |

## Checks

```sh
toolchain/build.sh v10.23 v10.22_event_nights_DRAFT/patch_v1022.py v10.23_map_pin_accuracy_DRAFT/patch_v1023.py
python3 v10.23_map_pin_accuracy_DRAFT/audit_1023.py build/GC500_v10.23/GC500_Delivery_Control_hosted.html
python3 v10.23_map_pin_accuracy_DRAFT/tests/test_patch1023.py <v10.22 stage> build/GC500_v10.23/GC500_Delivery_Control_hosted.html
```

| check | result |
|---|---|
| check_page on the candidate | PASS (121 scripts, no new keys, author line) |
| `test_patch1023.py` (v10.22 stage vs candidate) | PASS: every pt and ll unchanged; only WC57 and WC59 footprints changed; block re-hashed; outside the block, the two notes and the footer byte for byte the stage |
| `audit_1023.py` on the candidate | WC57 and WC59 anchors 0.0 m from their positions; everything else as on live |
| repeat guard | `patch_v1023.py` on the candidate: "refuses a repeat" |
| desktop sweep | 23 tabs, 0 errors, 0 console errors |
| phone sweep | see STATUS.md top entry |
