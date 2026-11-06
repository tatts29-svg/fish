> VERIFIED LIVE — 15 Oct 2026 02:34 AEST as part of reviewed combinedv10.21 page06d6e6b0 and machineeb8a01ff. See `../release_review1021/README.md` for final fixes, checks and source limitations. This declaration covers the app only; native P/O checks and pre-start PDF uploads were not applied. Author: Andrew Fisher.

# v10.20 — Gate 6 compound moved as iEDM drew it (P60, P62, P63, WC49, GN06)

Author: Andrew Fisher. Built 15 Oct 2026, about 01:40 AEST. DRAFT: built and tested read-only; not published.

## What Andrew asked

15 Oct 2026 about 00:50 AEST, with a photo of John Brett's (iEDM) email "Gate 6 Compound" of 14 Oct 2026:
"There has been a change i need you to adjust and fix in maps."

John's email: "Attached is a screenshot of the gate 6 compound – this is I think will work and is hopefully a more
accurate representation of what we discussed, P63 will most likely sit closer to the pathway. Doing it this way
condenses the compound a little bit but if we want additional acreage at the south end then we can also absorb the
council balance beam within the compound fencing."

## What changes on the page

Data only. Nothing else on the page is touched (the tests prove it).

| Ref | Was (sheet pt) | Now (sheet pt) | Move | New pin (lat, lon) |
|---|---|---|---|---|
| P60 Gate 5 Ticket Box | 2141.4, 253.2 | 2070.3, 254.4 | 50 m north, 1 m west | -27.993601, 153.430601 |
| P62 Gate 5 QFES Office | 2118.8, 254.4 | 2086.9, 255.0 | 22.5 m north | -27.993707, 153.430597 |
| P63 Gate 5 Volunteer Sign On | 2108.5, 254.9 | 2111.8, 255.9 | 2 m south, 1 m west | -27.993866, 153.430592 |
| WC49 Toilets (3) | 2129.2, 244.2 | 2103.4, 255.2 | 18 m north, 8 m west (into the row) | -27.993812, 153.430597 |
| GN06 Generator | 2129.8, 252.3 | 2091.0, 249.2 | 27 m north, 2 m east (approximate) | -27.993733, 153.430640 |

The row now runs from the north end: P60, P62, GN06 (on the east fence), WC49, P63, then OP54 (not a Coates item,
no pin) at the south end, inside a fence about 43 m long that stops just short of the council fitness station.

1. `MASTER_LOC`: pin (`pt`, `ll`), "how to find it", "beside", "near Gate 6 (~m)" and the two master-plan picture
   keys for the five references.
2. `MASTER_SHAPES926_DATA`: the five footprints moved rigidly (size, angle and door side unchanged); the script tag's
   `data-sha256` re-hashed.
3. `DETAILS1002` WC49 driver destination: "The Esplanade · Gate 6 compound · between P62 and P63", new coordinates.
4. Eight master-plan pictures (close and wide for P60, P62, P63, WC49) carried in the page as data URIs
   (`MASTER_IMG1020`, merged into the hosted-media table after it is built). They are the master's own vectors with
   the new layout in orange and the superseded compound faded, captioned with where the layout came from. Files and
   their sha256 keys are in `media/`.
5. Footer v10.20.

## How the positions were derived (a drawing position, not a survey)

`compute_gate6_1020.py` documents every step and number:

- John's screenshot (a CAD view of the revised layout) was deskewed from the phone photo and measured in pixels.
- Four fixed features present in both John's screenshot and the master fix the along-the-row scale and offset:
  the northern council fitness pad, the small pole south of it, the middle fitness pad (the balance-beam station) and
  the southern pad. Least-squares fit, residuals within 2.5 m, rms 1.7 m. Public satellite imagery (Esri World
  Imagery z20, `gate6_new_on_aerial.png`) confirmed those grey polygons on the master are the three blue-floored
  fitness pads and that John's screenshot has the same orientation as the master (north to the left).
- Across the row, each point is placed in proportion between the tree-canopy edge and The Esplanade pavement edge,
  and never drawn through the compound's west fence (held 0.35 m inside it).
- Latitude and longitude come from the explorer's georeferencing (`sheet_to_z18px`), the same transform that
  produced the live pins (P60 reproduces to 1e-7 degrees).
- GN06: only its red tag is visible on John's dark screenshot; the symbol is placed 2 m west of the tag as the master
  draws it. Flagged "approximate" in its card text.
- "BIKE" and the four queue lines are event items that moved with the layout, not fixed features; the fence shown is
  John's fence, read off his screenshot.

Figures: `gate6_before_after_master.png` (master with the new layout in orange, grey lines old to new) and
`gate6_new_on_aerial.png`.

## Build

```
toolchain/build.sh v10.20 v10.19_po_values_prestarts_signed_DRAFT/patch_v1019.py v10.20_gate6_compound_DRAFT/patch_v1020.py
```

Base: live v10.18 `2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d`. `patch_v1020.py` accepts the
exact live v10.18 page or the v10.19 candidate `c7e698c9c4e42f3d00088383e4bb032e5ccfd296907900ec888a8f1440e07679`,
so the two releases can go up as one page or separately.

Candidate (v10.19 + v10.20): `build/GC500_v10.20/GC500_Delivery_Control_hosted.html`
SHA256 `806800df57e8ac7d82dfec9233db0d70e9dcbfcd0b42ea5c25e7bd453293ed29`, 15,893,405 bytes, 119 inline scripts,
`check_page.py` PASS (the pictures add about 600 KB).

## Tests (read-only)

- `tests/test_patch1020.py` on the live v10.18 copy and on the v10.19 candidate: 130/130 PASS. A wrong base and a
  repeat are refused; every pin, footprint, card text, destination and picture is exactly what
  `gate6_positions_1020.json` and `media/index.json` say; footprints keep size, angle and door side; every other
  footprint is byte-identical; the shapes `data-sha256` hashes the new data; nothing outside the listed edits changed;
  footer v10.20.
- `tests/browser_check1020.cjs` (toolchain harness, candidate served locally at the live address, every write aborted):
  the running page's `MASTER_LOC`, footprints and the two pictures per reference resolve as computed, 8 pictures in
  the table, footer v10.20, 0 page errors, 0 writes reached the service. Screenshots `tests/map_desktop1020.png`,
  `tests/day15_desktop1020.png`. Result in `tests/browser_check1020_result.json`.

## Not in this release, for the owner of each

- Publication needs `GC500_EDIT_TOKEN` (`toolchain/upload_page.py` with the exact live base check).
- The machine explorer under `/w/Coates-GC500-2026/explorer/` draws its own copy of the plan items; it needs its
  usual rebuild from the page data so the Gate 6 pins match there too (Codex's machine build).
- The eight pictures can later move from the page into the hosted media store (upload the `media/*.webp` files;
  their sha256 are the keys, so `MASTER_LOC.img` already points at them) and `MASTER_IMG1020` dropped.
- `arrival_plan_14Oct2026_DRAFT/source/osm.json` carries the old WC49 coordinate; Codex's arrival plan to refresh if
  it is reissued.
- The master D001-26003-03 has not been reissued by iEDM. When it is, re-trace the compound from it and retire the
  orange overlay pictures.

## Open points for Andrew

- Confirm with John Brett that the queue lines and the bike parking move with P60 (the pictures assume so).
- P62's door faces west (the Esplanade side); with the buildings now hard against the west fence as John drew them,
  the installers may need that fence line a metre further out. The footprint keeps its door side; the fence line on
  the page is a picture only.
