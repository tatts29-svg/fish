# Matching orange artwork across picked-up cards

Author: Andrew Fisher

DRAFT — full implementation and artwork present; final native/release checks are in progress. Nothing published from this folder yet.

Andrew directly asked for all cards, then said: “Make them thats what you were meant to be dojng”. This completes the same approved decorative stamp job beyond the first light-tower release. Existing dark cards, green status stamps, wording, metadata, weather, dimensions and controls remain the basis of the page.

Thirty equipment-type illustrations are stored in five small transparent WebP atlases. They cover main machinery, sanitary equipment, buildings and containers, barriers and furniture, plus distinct accessories, a toilet trailer and a refrigerated container. The illustration is a type cue, never identification of a numbered asset. Each is mapped from the unit's own item, with explicit departure types passed into reference stamps. Known mixed groups use a small collage of their own types; a block with a tank uses the paired illustration. Genuinely unknown types keep their readable plain stamp rather than receiving a misleading picture.

The shared renderer covers picked-up cards, their daily/grouped/filter/refresh views, and the existing departure stamps in reference details, Build and supplier cards. No operational decision, record write, quantity, date, asset identity or financial calculation is changed. The former single-type helper is replaced; artwork is embedded once per atlas in CSS, with no image network request, added animation, observer or runtime 3D renderer. Foreground wording stays above noninteractive decorative images; print omits the decoration. Atlas metadata and reviewed source windows are in `assets/manifest.json`.

Exact predecessor currently pinned: v12.66 `7a745c28b0f66d3d0062255cde90e15b393b111d3b54df8c7dbff18479935e1c`. The patch refuses a different predecessor and repeated application. Any newer live release must be incorporated and affected checks repeated before publication. v12.67 remains separately owned under its own release gate.

Build from `03_GC500_Delivery_Control`:

```bash
bash toolchain/build.sh v12.68 v12.68_all_pickup_art_DRAFT/patch_v1268.py
```

Before READY: final shared page check, mapping and consumer guards, every current picked-up card's coverage, actual phone/desktop card and foreground preservation, all supported artwork decoding/positions, filter/refresh and detail paths, unchanged record/financial readers, zero writes/errors, both navigation sweeps and actual previews. Detailed record, financial and screenshot captures stay private; only safe summaries are committed. Guarded upload and full public byte read-back are required before LIVE. Wider work and hourly automation remain paused after this bounded directly authorised job.
