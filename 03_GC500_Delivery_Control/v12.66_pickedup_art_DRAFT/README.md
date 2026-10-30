# Faded equipment artwork in picked-up stamps

Author: Andrew Fisher

DRAFT — implementation built; final native/release checks are in progress. No live claim.

Andrew approved a faint equipment render behind the current green PICKED UP stamp in the Codex conversation, then specifically corrected the equipment colour: "Coates is orange dont show me something white". The equipment body is therefore orange, with the existing green status stamp retained. The direct approval covers this visual change only. The general pause and disabled hourly coordination remain in place.

The initial artwork set contains one generic light-tower illustration: `assets/light-tower.webp` (320 × 350 pixels, 17,942 bytes, SHA256 `f8e2cc2851b3b45fa2e67be363952ecb5adef46147a94ae794110210582a6981`). It is a generated equipment-type render, not a photograph or identification of a numbered asset. The approved private mock-up and its source screenshot are not committed. No suitable per-type raster library exists in the page; other equipment keeps its current clear stamp. The template requires both the existing native `tower` icon and an exact normalised light-tower type in the unit’s own item field, so category fallback does not assign unrelated artwork.

`patch_v1266.py` adds a read-only decorative helper to the existing `singles1238` renderer, inserts its image only inside the already-selected picked-up stamp, appends scoped CSS and changes the release footer. Native status decisions, original wording/tick/date/recorded-by, card dimensions, metadata, controls and all models remain unchanged. `.stamp1232` is outside scope. The image is absolute, noninteractive, hidden from assistive technology and behind the original foreground text. It keeps its orange hue at 20% opacity, with softly masked edges. Existing pulse/glow and reduced-motion rules remain. The decorative image is omitted from print.

The small WebP is embedded once in the source and reused by matching cards; no external image fetch, runtime 3D scene, new observer or additional event listener is introduced. Page size increases by 25,248 bytes (approximately 0.16% of the predecessor).

Required exact predecessor: live v12.65 SHA256 `10e8e8c23468d593a40c7ca7b88abb0ceceba203cffc4f9956933e193f1d0f64`, 16,167,272 bytes. The patch refuses another predecessor and repeated application. Current candidate: `7a745c28b0f66d3d0062255cde90e15b393b111d3b54df8c7dbff18479935e1c`, 16,192,520 bytes; shared build and 221-script page checker pass.

From `03_GC500_Delivery_Control`:

```bash
bash toolchain/build.sh v12.66 v12.66_pickedup_art_DRAFT/patch_v1266.py
```

The focused `tests/native_art1266.cjs` compares the exact base and candidate on one pinned private record, including all card text/controls, native financial outputs, persisted documents, matching/fallback/current cards, actual picked-up filtering and repeated draws. It captures actual desktop/phone views and tests image decoding, foreground legibility geometry, untouched card dimensions, zero runtime errors and denied operational writes. Set private `BASE`, `CANDIDATE`, `STATE`, `OUT` and the exact `EXPECTED_PAGE_SHA`; run under `/tmp/gc500-browser.lock`, with `MOB=1` for the phone pass. Detailed captures and record/financial evidence stay private.

Before publication, finish these native checks, inspect actual phone and desktop previews, run both shared navigation sweeps, recheck current source/live/record and use the guarded uploader with full public-byte read-back. Claude has handed this one job back and retains live review. No separate P&L audit or redesign is included.
