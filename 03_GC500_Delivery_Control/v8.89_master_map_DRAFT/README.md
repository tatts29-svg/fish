# v8.89 — the master is D001-26003-03 issued 2 Oct

Author: Andrew Fisher. Claude build. Andrew, 7 Oct: "the attached is the latest map document this is to over write the current master so we need to remove the current and use this one instead and update all records". He approved on 8 Oct at 00:20 ("Approved and get everything done").

Page data only: the master picture, its register entry, the pins the new issue moves, and the media list. There are no record writes and no other-tab changes.

## How the swap is done

- **Source:** the 2 Oct sheet, `D001-26003-03-MASTER.pdf` (sha256 `8753d875…`, 12,189,113 bytes). It is held encrypted in `../inputs_07Oct2026/`.
- **Same scale:** it renders at exactly the live picture's 2600 × 1837 px.
- **One shift lines it up.** The whole drawing sits 9 mm (28 px) further left on the new paper. Phase correlation gives (28, 0) for:
  - the whole sheet;
  - the drawing area;
  - the left half;
  - the centre.

  Shifting the new render 28 px right puts it exactly over the live picture; `make_master889.py` asserts (0, 0) after the shift.
- **What that keeps valid:**
  - the fencing geometry traced on the 17 Sep issue;
  - the 62 D001 markers;
  - the shared plan frame used by Plan on satellite;
  - 158 of the 165 pins; the 7 others are in the table below.

## Pins that change

**Navigation pins do not move.** Andrew, 8 Oct 2026 ~04:00 AEST: "All navigation pin points are correct." Every unit that already had a navigation pin keeps it exactly. The test proves it for all of them. That includes:
- the `ll` value behind the drive, walk and Earth links;
- the directions text;
- the day list;
- the satellite pins.

What follows the 2 Oct sheet is where the drawing prints each label (`pt`) and its pictures. The labels were re-read off the 2 Oct sheet, the label on the unit, as v6.85 did. Where a label moved, the card says how far the drawing now puts the unit from its confirmed pin. The distance is measured through the 12 nearest unit tags, as v7.82 did, and every fit holds within 0.12 m.

| Ref | On the 2 Oct drawing | Navigation pin |
|---|---|---|
| P45 (St John First Aid, Building 6m) | Drawn in the supply compound beside MED and P69, about 85 m west of its pin | Unchanged |
| WC51 | Drawn about 18 m west along the esplanade path | Unchanged |
| WC38 | Drawn about 13 m away, within its Commodore compound | Unchanged |
| WC39 | Drawn about 9 m away, within its Commodore compound | Unchanged |
| WC10 | New on this issue; gets a master position, section and pin | New, read off the drawing; not yet checked on site |
| WC69 | One tag now, so the stale second tag is dropped | Unchanged |
| WC40 | The second tag (WC40a) is gone from the 2 Oct issue | Unchanged |
| WC32 | Not drawn on the 2 Oct issue. Already cancelled on the record; the pin stays, marked as from the 17 Sep issue | Unchanged |
| CP1, T0265, WC81 | The bottom-right inset did not move on the paper; their sheet position moves 28 px with this picture (v8.93 re-makes the picture so the inset needs no shift) | Unchanged |

What follows:
- **Directions:** unchanged for every existing unit. P45, WC51, WC38 and WC39 still navigate to their confirmed pins. If Andrew later says a unit has moved to where the 2 Oct drawing shows it, that is a one-line change.
- **Thumbnails:** the moved and new references get fresh close-up and context thumbnails from the 2 Oct sheet. They match the originals' 6.4× and 1.64× crops and the red ring, and show where the drawing prints the label.

## Also changed

- **D001 sheet:**
  - its picture is now the 2 Oct render (`fa5081d4…`, webp, 652,414 bytes);
  - its subtitle adds "issued 2 Oct".
- **Drawing register entry:**
  - it shows the 2 Oct sheet (sha and bytes) and when it was issued;
  - it names what it replaces: the 17 Sep issue `37792f0a…`.
- **Media list:**
  - 11 pictures added: the sheet plus ten thumbnails;
  - 9 no longer used removed: the old sheet and the moved pins' old thumbnails;
  - the page's media manifest moves to `1aa4a3b1ac15…` (1,958 files).

The service refuses a page whose media list differs from a registered manifest. My recalculation of the live manifest matches the page's `7155f6eb…` exactly.

## The western edge of the 2 Oct sheet

The drawing moved 9 mm on the paper, but its viewport did not. The 2 Oct sheet therefore shows 9 mm less of the Main Beach end.
- **On the aligned picture,** that strip (columns 53–70 of 2,600) is blank.
- **Labels only in the strip on 17 Sep:** G7, G8, MAIN BEACH TOWER, CRONIN AVE, PEARL, ER, OP11, WC69's other tag and seven HOUSE labels. They are not on the 2 Oct sheet.
- **Pins:** none of the page's 165 pins lies in the strip (checked). WC69's pin is on the tag the 2 Oct sheet keeps, at (168, 1143) pt.

If the strip matters, iEDM would need to reissue the sheet with the viewport back where it was. Found while building v8.90 (the Map explorer's drawing).

## Left as it is, on purpose

- **Fencing tracing records:** 193 `master_sha256` and 6 anchor `source_sha256` fields still name the 17 Sep issue. They record which drawing the fence lines were traced on, which remains true, and the alignment keeps those lines exact on the new sheet.
- **Map explorer tiles:** the explorer draws D001 from its own tiles in the machine bundle, and its fencing layer checks the old drawing hash. The new tiles must be cut from the same aligned render (`new_aligned_2600` at the explorer's zooms) and ship with the machine bundle release (v8.87 explorer work).

## Build and publish

```
toolchain/build.sh v8.89 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.89_master_map_DRAFT/patch_v889.py
```

The patch accepts any footer from v8.85 to v8.88, so it chains after v8.86–v8.88. It also writes `media_manifest_v889.json` beside the build.

Publish in this order. Each step needs the edit key:
1. Decrypt `media889.zip.enc` with the papers password into a folder. It holds the 11 new pictures, named by their SHA-256.
2. `python3 v8.89_master_map_DRAFT/upload_media889.py <folder> build/GC500_v8.89/media_manifest_v889.json --dry-run`, then the same without `--dry-run`. It uploads only missing files, checks each one's hash, then registers the manifest.
3. `python3 toolchain/upload_page.py build/GC500_v8.89/GC500_Delivery_Control_hosted.html`, as usual.

`make_master889.py` regenerates the picture, thumbnails and `changes889.json` from the PDF and the live picture.

## Candidate, on live v8.83 with v8.84 + v8.85 chained

- `8522cbfd84372ed90e28b93951de656cc4a727ff67e0328fa3305b4dc80fb289`, 11,168,214 bytes.
- Media manifest: `1aa4a3b1ac15fab6…` (1,958).
- Encrypted media: `media889.zip.enc`, sha256 `e83a8d10…`, 1,395,760 bytes.

## Checks

- **Data identity:** `tests/test_identity889.py` proves only these changed:
  - the picture, the register entry, the media list (+11/−9) and the 11 listed pins;
  - the manifest hash, which must equal the page's own media list;
  - no existing navigation pin (`ll`) moves (added 8 Oct, after Andrew's "All navigation pin points are correct").
- **Page test:** `tests/test_master889.cjs` (16 checks, laptop and phone) covers:
  - the sheet, the register entry and every pin;
  - P45's navigation pin and drive/walk links unchanged;
  - WC10, WC32 and the single-tag references;
  - the inset;
  - the new pictures, which load at their sizes when served locally;
  - Map tab, no errors, no live writes.
## Results (8 Oct 2026 ~00:55 AEST, candidate `8522cbfd…`)

All logs are in `evidence/`.

| Check | Laptop | Phone |
|---|---|---|
| Data identity (`test_identity889.py`) | PASS: +11/−9 media, the 11 listed pins, manifest = media list | — |
| New master (`test_master889.cjs`, new pictures served locally) | 16/16 | 16/16 |
| Where we are card (v8.85) | 24/24 at 2560, 1600 and 1440 | 24/24 |
| Today wide layout (v8.84) | 21/21 at 2560, 1600 and 1440 | 21/21 |
| Layout 876 · VMS 874 · Equipment 873 | 18/18 · 18/18 · 40/40 | 18/18 · 18/18 · 40/40 |
| Crew 883 | 34/34 | 34/34 |
| Finance 866 · Loading 872 · Unloading 881 · Paired 881 | 24/24 · 26/26 · 34/34 · 18/18 | 24/24 · 26/26 · 34/34 · 18/18 |
| v8.71 · Supplier 870 · KINP 869 | 12/12 · 17/17 · 17/17 | — |
| 15-tab sweep | 15 shown, 0 errors, 0 blocked | 15 shown, 0 errors, 0 blocked |
| Handling 875 · Paired 879 (out of date) | 22/28 · 17/18 | 22/28 · 17/18 |

**Handling 875 and Paired 879 are out of date, not regressions.** They give the identical result on live v8.83:
- v8.81 renamed "Franna required" to "Franna crane unloading";
- Andrew recorded P52 as Franna.

No test attempted a live write.

See also `explorer_findings.md` (why the map explorer is clunky).
