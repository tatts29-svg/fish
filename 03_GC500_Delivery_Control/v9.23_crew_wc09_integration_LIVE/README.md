# Crew, race call, WC09 units and VMS plan notes

Author: Andrew Fisher

State: VERIFIED LIVE within v9.28 — 9 Oct 2026 03:28 AEST. Public page SHA256 `592e73b38e8c5fb1d5bf98d00915c49550ab860b322f82fb957a99acc0369093` (12,262,425 bytes). The guarded upload verified the full served bytes. Combined evidence is in `../v9.28_finance_attribution_LIVE/evidence/combined_release.json`.

All five focused desktop and phone suites passed before the combined publication.

This integrates the remaining five parts of the handed-over v9.09 work on v9.22: the added fencing crew member, the approved replacement race-call take, split-delivery progress, WC09's separate Coates toilet blocks, and the VMS plan's document/cross-reference notes. It preserves the existing daily staff picker and Showcase stability code.

The private crew input and approved audio were received through the encrypted handover at `6bcbcc78`; the patches bind each input by checksum. Neither input is committed here. The broadcast changes one take and regenerates the media manifest from the current page, preserving the v9.21 pin pictures. Upload that take before the page.

WC09's two Coates numbers belong to the two six-metre blocks; each block receives its native individual labour/loading controls. Explicit recorded “counts as” choices still win. Split-delivery progress does not count the later supplier items complete from a tick made for the earlier Coates delivery.

The original 17-page VMS001 plan was read after the private handover. It supplies cross-reference words only; governing-drawing and relocation differences stay open. Two questions in the older draft are now answered by the approved VMS register, so R30 records those answers instead of asking them again. The board 21 Staghorn/Ocean Avenue and board 17* T10/T11 caption conflicts stay explicit; board 18* remains assigned to Roadtek in the plan. No new VMS position or board count is inferred from the plan.

Source parts are copied from frozen upstream `822b06a8`, with the narrow R30 reconciliation in `patch_v900_vms.py`. Focused browser comparisons preserve the surrounding record, navigation and money models, except the explicitly approved WC09 unit/count behavior. No operational record has been changed.

The split, line and VMS tests compare against a page with just that part omitted, retaining the final footer and other parts. `tests/build_baselines.py <candidate>` regenerates those comparison pages with the same private inputs as the build. Broadcast testing follows the natural end of the new take and checks that the v9.18 reusable player advances to the next slot.

The ten focused suites pass: crew 28/28, broadcast 18/18, split 28/28, WC09 lines 43/43 and VMS 56/56 on both desktop and phone. Runtime checks used the immutable first combined v9.27 candidate (`3d2c6985…`). `evidence/source_scope_chain.json` carries the checks through the isolated accessory editor fix and finance/Transport changes to combined v9.28 (`592e73b3…`); DATA, styles and the v9.23 feature scripts are identical. Final combined navigation and finance checks remain with release coordination. Full portable totals and comparison hashes are in `evidence/validation.json`.

`tests/build_combined_baselines.py` first requires a byte-identical replay of the complete supplied patch chain, then produces one comparison page for each omitted part while preserving all later changes. The VMS test reads models and document collections inside the same `holdAssets` scope as native rendering; this avoids repeating the full asset build for each document.
