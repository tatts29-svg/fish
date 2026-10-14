# Presentation and interaction audit — 14 Oct 2026

Author: Andrew Fisher

Audited exact live v10.15 source `bc7885b1bed08bafd75353ec3666ca9a4c52a59d17ad3bb0eb5896f011586f67` against the current shared record. Browser tests substitute those verified page bytes at the public view address and allow only GET requests. No operational records were changed. Financial screenshots and raw results remain in private evidence storage.

## Confirmed finding

The shared-record timestamp loses its final digits at a 360 px viewport. The status text ends at x345.48 while its clipping pod ends at x340. The existing ellipsis does not help because the text's own box is wider than its parent. The same timestamp fits at 390, 768 and 1440 px.

The bounded v10.16 presentation patch caps the status container and permits wrapping at spaces inside the existing card. It changes no source data, times, event calculations, financial calculations or operational records. Root owns integration and publication.

## Checks completed

- Today, Build, Demob, Sub-hired, Costs and Fencing at 360, 390, 768 and 1440 px: 24 combinations, no document-level horizontal overflow, no application errors or attempted operational writes. Local tables and weather strips intentionally scroll.
- Expanded controls and tables on six routes in isolated edit preview: 813 representative contrast groups / 17,760 rendered text nodes, no measured contrast failures. Image backgrounds remain a visual-review limit; gradient averages are paired with screenshots.
- Build loading selections have Save, Clear and Reload. Clear is readable against its actual dark background; the reported white-on-white issue did not reproduce.
- P33 has Back and Close. Reverse Tab wraps to the last drawer control; forward Tab wraps back. Escape closes the drawer and releases background inertness.
- Purchase-order numbers and amounts are visible. Tables retain local horizontal scrolling.
- Selected tabs and supplier controls retain their highlight/glow.

## Optional improvements, not defects

- The Fencing tab has no glyph while neighbouring phone tabs do. Its bounds do not overlap Tools; this is visual polish, not a broken hit target. No glyph or navigation redesign was made.
- When received and onsite quantities agree, a single primary quantity with the other in More info could reduce repeated wording. Both are separate underlying facts and must remain visible when they differ.
- At single-item locations, the header, identified count and unit card repeat the same quantity. A future compact presentation could remove the redundant standalone count without changing data.
- The phone P/O table could show an explicit horizontal-scroll cue so its remaining columns are easier to discover. No columns should be silently removed.

Private evidence: `/workspace/private-gc500-audit14Oct2026/presentation/`. `audit.cjs` is the viewport scan; `controls.cjs` checks actual computed contrast and keyboard behaviour; `sync_label.cjs` reproduces the timestamp issue. `deep.cjs` is exploratory and uses a temporary edit preview that may return to view-only when the capability poll runs; it is not the final Save proof.
