**Published in v10.36 on 16 Oct 2026 at 06:41 AEST.** Page `d72e7f6198111f51…` (18,024,035 bytes), read back byte for byte by the view link; the stack v10.32 → v10.36 went up together on the live v10.31. Author: Andrew Fisher.

# v10.34 — the water barriers picture on Today (LIVE)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Water barriers need their picture done for the today data plate."

Every group card on Today's Work progress board carries a rendered picture of its equipment behind the lights and the
figures (v9.07: buildings, toilets, fencing, generators, lighting, VMS boards, equipment, and the yard behind the
overall plate). The Water barriers card v10.30 added had none — a plain dark card. This gives it one.

| Change | Effect |
|---|---|
| One picture, `assets/a93fee4f….webp` (1376 × 768, 165,666 bytes) | A row of orange Coates water-filled barriers on the asphalt, the black mesh fence, palms, the grandstand, a light tower and the Gold Coast skyline — the same scene and style as the other cards. A rendered illustration, not a photograph of this job (the basis fold already says so for all of them). |
| The page's media table and the scene's `ATLAS` | The picture is named by its SHA-256 like every hosted picture; `ATLAS.barriers` names it, so the scene's one stylesheet paints it behind `#tw840-card-barriers .tw846-summary` exactly as the others. The media manifest hash in `hostedMedia` is recomputed (`b98761ab…` → `a07be34596efafc4…`) and written beside the build as `media_manifest_v1034.json`. The patch first proves the page's current hash is the one it would compute, so the scheme has not moved. |
| Footer | v10.33 → v10.34 |

Nothing else in DATA changes; no record, quantity, money or navigation change.

## Checks

| Check | Result |
|---|---|
| `check_page.py` | PASS |
| `tests/test_plates1034.cjs` (page from the build, the picture from `assets/`, every write aborted) | ALL 11 PASSED — atlas, media entry, manifest hash, footer; desktop and phone: the barriers card paints the picture from the hosted media route, toilets and generators keep theirs |
| `harness/sweep.js` desktop and phone | see STATUS |

Build `build/GC500_v10.34/` sha256 `cf68d2b32f4efb32…` (18,023,653 bytes), chain v10.32 + v10.33 + v10.34 on the live
v10.31 (`e592f9f5…`). Goes live on Andrew's "Upload".

## Upload order — the picture first, then the page

The service refuses a page whose media manifest it does not hold, so on "Upload" the order is:

```sh
toolchain/build.sh v10.34 v10.32_all_today_LIVE/patch_v1032.py v10.33_seven_symbols_LIVE/patch_v1033.py v10.34_barriers_picture_LIVE/patch_v1034.py
PAGE=build/GC500_v10.34/GC500_Delivery_Control_hosted.html node v10.34_barriers_picture_LIVE/tests/test_plates1034.cjs
python3 v10.34_barriers_picture_LIVE/upload_media1034.py build/GC500_v10.34/media_manifest_v1034.json v10.34_barriers_picture_LIVE/assets --dry-run
python3 v10.34_barriers_picture_LIVE/upload_media1034.py build/GC500_v10.34/media_manifest_v1034.json v10.34_barriers_picture_LIVE/assets
python3 toolchain/upload_page.py build/GC500_v10.34/GC500_Delivery_Control_hosted.html
```

`upload_media1034.py` is v8.96's media step as it is: it sends only the files the service does not hold (one here),
checks each against its SHA-256 name, registers the manifest last, and takes the edit key from the environment only.
