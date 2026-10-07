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

The pins were re-read off the 2 Oct sheet: the label on the unit, as v6.85 did. They were converted to GPS through the 12 nearest unit tags, as v7.82 did; every fit holds within 0.12 m.

| Ref | Change | Moved on the ground |
|---|---|---|
| P45 (St John First Aid, Building 6m) | Now in the supply compound beside MED and P69 | about 85 m west |
| WC51 | Further west along the esplanade path | about 18 m |
| WC38 | Within its Commodore compound | about 13 m |
| WC39 | Within its Commodore compound | about 9 m |
| WC10 | New on this issue; gets a master position, section and pin | — |
| WC69 | One tag now, so the stale second tag is dropped | 0 |
| WC40 | The second tag (WC40a) is gone from the 2 Oct issue | 0 |
| WC32 | Not drawn on the 2 Oct issue. **The pin stays, marked as from the 17 Sep issue, until Andrew says otherwise.** | 0 |
| CP1, T0265, WC81 | The bottom-right inset did not move on the paper; their sheet position moves 28 px with the picture | 0 |

What follows from the new positions:
- **Directions:** drive, walk and Earth links, the day list and satellite pins all follow `MASTER_LOC`, so P45's directions now go to the new spot.
- **Thumbnails:** the moved and new references get fresh close-up and context thumbnails from the 2 Oct sheet, matching the originals' 6.4× and 1.64× crops and the red ring.

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
  - the manifest hash, which must equal the page's own media list.
- **Page test:** `tests/test_master889.cjs` (16 checks, laptop and phone) covers:
  - the sheet, the register entry and every pin;
  - P45's map fix and its drive/walk links;
  - WC10, WC32 and the single-tag references;
  - the inset;
  - the new pictures, which load at their sizes when served locally;
  - Map tab, no errors, no live writes.
- Results from the full regression suite are recorded in `evidence/`.

See also `explorer_findings.md` (why the map explorer is clunky).
