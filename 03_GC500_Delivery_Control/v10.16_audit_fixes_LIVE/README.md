# GC500 audit corrections — live

Author: Andrew Fisher

Ten reproduced defects are corrected: cold shared-reference links, background map history, current accessory-number search, source-only supplier scope in Today, moved VMS stock identity, PDF overflow, failed source-document recovery, manual-charge branch allocation, the optional waiver hold and a clipped narrow-phone timestamp. The existing design and operational records are preserved. Full findings and optional improvements are in `../audit_14Oct2026_afternoon/README.md`.

Implementation source: `eba14380`. Exact base v10.15: `bc7885b1bed08bafd75353ec3666ca9a4c52a59d17ad3bb0eb5896f011586f67`. Final candidate: `3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c`, 15,238,166 bytes, 113 scripts. The frozen component source reproduces those exact bytes.

All final combined checks in `evidence.json` pass. Both navigation sweeps cover 22 routes, seven direct links and Back. No application exceptions or operational write attempts occurred. The strict read-only harness deliberately blocks the separate Google map-session POST; this is recorded explicitly. Focused actual map rendering/performance remains separate work.

Financial, P&L, branch, Finance, generator and supplier-run baseline comparisons match. Manual customer charges retain their selected branch, including after edits/removal; the unselected waiver is uncharged. Current VMS stock follows reviewed movement without changing original delivery/charge history. Historical replacement events are not invented. Known missing rates/source allocations remain visible.

Fresh phone screenshots and both supplier PDF continuation pages were inspected. A4 portrait, full destinations, QR codes and 24-per-day planning are retained. Overflow uses clearly labelled continuation pages. Individual component guards and independent review passed; two VMS historical edge cases were corrected during review.

Root owns integration/publication. No external combined review is claimed. Native version6075 is unchanged. Published 14 Oct 2026 at 16:39 AEST from READY commit `0c2b29f2`. The guarded uploader verified exact public bytes; 20 fresh actual-public checks passed on unchanged native6075, with no page substitution, browser errors or operational write attempts. Private raw evidence is `/workspace/private-gc500-audit14Oct2026/combined/`; public files contain only sanitised results.

The separately supplied 3D fencing prototype is not part of this release. Its demonstrated visual behaviours and integration defects are reviewed separately.

Shared handover posted for Claude and Argon: https://github.com/tatts29-svg/fish/pull/1#issuecomment-6162537343. Receipt is not yet acknowledged.
