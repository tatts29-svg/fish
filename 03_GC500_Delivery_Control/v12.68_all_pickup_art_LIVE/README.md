# Matching orange artwork across picked-up cards

Author: Andrew Fisher

LIVE — 31 Oct 2026 09:22 AEST. Exact public SHA256 `fd7b26e9bb750d5ad6f630c00ecf1ee844324589a140c87ec67c743b4c630547`, 16,520,784 bytes. Implementation `d421430b52c884fd984e936a95274c606d43c9d5`; final test source `3aff05cd77aedd7b3733df531afb80fde7bd3017`; READY evidence `f4df1f5e067034df73d502efe38d52c89ed47f64`. The guarded upload and separate cache-busted full public read-back both match the tested candidate byte for byte. Every embedded atlas, helper, style and footer matches; the operational record is unchanged. External live review is pending.

Andrew directly asked for all cards, then said: “Make them thats what you were meant to be dojng”. This completes the same approved decorative stamp job beyond the first light-tower release. Existing dark cards, green status stamps, wording, metadata, weather, dimensions and controls remain the basis of the page.

Thirty equipment-type illustrations are stored in five transparent WebP atlases, 257,536 bytes combined. Replacing the earlier single-type artwork adds 328,264 bytes (about 2.03%) to the self-contained page. They cover main machinery, sanitary equipment, buildings and containers, barriers and furniture, plus distinct accessories, a toilet trailer and a refrigerated container. The illustration is a type cue, never identification of a numbered asset. Each is mapped from the unit's own item, with explicit departure types passed into reference stamps. Known mixed groups use a small collage of their own types; a block with a tank uses the paired illustration. Genuinely unknown types keep their readable plain stamp rather than receiving a misleading picture.

The shared renderer covers picked-up cards, their daily/grouped/filter/refresh views, and the existing departure stamps in reference details, Build and supplier cards. No operational decision, record write, quantity, date, asset identity or financial calculation is changed. The former single-type helper is replaced; artwork is embedded once per atlas in CSS, with no image network request, added animation, observer or runtime 3D renderer. Foreground wording stays above noninteractive decorative images; print omits the decoration. Atlas metadata and reviewed source windows are in `assets/manifest.json`.

Exact verified predecessor: v12.66 `7a745c28b0f66d3d0062255cde90e15b393b111d3b54df8c7dbff18479935e1c`. The patch refuses a different predecessor and repeated application. Any newer live release must be incorporated and affected checks repeated before publication. v12.67 remains separately owned under its own release gate.

Build from `03_GC500_Delivery_Control`:

```bash
bash toolchain/build.sh v12.68 v12.68_all_pickup_art_LIVE/patch_v1268.py
```

Validation: shared page checker (222 scripts); 63 mapping, 11 reference-context and 28 caller-contract checks; independent source review proving all 13 guarded edits reverse to the exact predecessor; full native phone (147 checks) and desktop (190 checks); all-reference stamp coverage with no unresolved or mismatched existing completed stamps; both navigation sweeps (27 routes, seven deep links and Back, including ten existing aliases). All pass with zero runtime/console errors and operational writes. Actual phone and desktop previews were inspected. Original card models, financial outputs, text, controls, geometry and every persisted document are preserved. This verifies unchanged financial outputs, not an audit of all business inputs.

The phone comparison reused a fully completed baseline after verifying its capture/page/state hashes, fixed clock, viewport and error/write results; desktop used a fresh complete baseline/candidate pair. Final successful screenshots needed no retry. The test-only non-square atlas ratio check uses intrinsic CSS dimensions rather than the tilted stamp's transformed bounding box. Neither recovery changed the candidate.

Public-safe evidence is in `evidence/`; detailed records, financial outputs and screenshots stay private. Publication completed using the existing guarded uploader without an override. A separate full public GET verified the exact content at 31 Oct 2026 09:22 AEST. The separately owned v12.67 candidate must now be rebased on these v12.68 live bytes, preserve the artwork and take the next free release number. Record runners must set `GC500_EXPECTED_PAGE_SHA` to the complete live hash above. The publication/read-back is verified by the publisher; external live review has not yet been received. Wider work and hourly automation remain paused after this bounded directly authorised job.
