# GC500 annual plan uploads

Author: Andrew Fisher

Design proposal only. No source, records or release have been changed.

## What stays fixed

The approved **2026 Base** has one immutable identity recording its imagery and 3D content hashes, actual capture dates, coverage, coordinate system and permitted uses. A provider’s upload date or a “2026” filename is not proof of capture year. Every imagery layer must have verified 2026 capture evidence and permission for the intended display, storage, sharing and printing. An annual plan upload cannot replace or silently refresh this base. If permission later expires, disable the affected imagery rather than substitute another capture.

Each **PlanRevision** has a separate identity: event year, revision, issue date, source-file hash, approved sheets, coordinate reference system (CRS), registration/control points and validation status. The selected plan year remains visible alongside “2026 imagery”; a later plan must never imply that the base shows later site conditions. The current year remains 2026 until an approved change is explicitly activated.

## Five-step user flow

1. **Upload the plan.** Select its event year and revision. Show the detected sheets, issue date and source identity for confirmation. Keep the active plan available throughout.
2. **Check its position.** Preview the plan on the fixed base or a neutral background. Confirm CRS, units, scale, rotation, sheet/inset boundaries and well-distributed control points. Show registration residuals against an agreed accuracy tolerance. Exclude any old or undated aerial embedded in the uploaded drawing; require a clean vector/transparent plan when it cannot be reliably separated.
3. **Review what changes.** Show added, removed, moved and unmatched references, revised footprints and door geometry, and any conflicting labels or dimensions. Resolve ambiguous matches explicitly. Mark a reference absent from the new plan as unmatched, without deleting its asset or operational history.
4. **Preview every affected view.** Inspect Explorer, cards, search, shared views, print output and illustrative 3D models against the same candidate PlanRevision. Keep the candidate private and clearly labelled. Show unresolved items and prevent activation where registration or identity remains unsafe.
5. **Activate or return for correction.** Activate the approved revision as one change across all dependent views. Record who activated it, when and the reviewed revision identity. Provide one-step rollback to the preceding approved revision and an explicit archive-year selector.

## Matching and geometry

Asset identity and plan labels are separate. Stable asset/reference identities persist across years; a renamed, reused, duplicated or missing label must not silently attach to another asset. Preserve reviewed cross-year mappings and show conflicts for resolution.

Every footprint and door feature carries its PlanRevision, sheet, geometry version, source location and evidence status. Door hinge, swing and facing require drawing evidence or separately recorded facts. Regenerate the illustrative 3D model only from that selected revision’s validated geometry. Keep truck-loading door side separate from a plan door bearing. Unknown dimensions, elevation or exterior appearance remain visibly unverified; a diagrammatic model is never represented as captured 3D imagery.

## One revision across every view

Explorer maps, card map strips, search results, share previews, printable plans and plan-derived 3D models must identify the same active PlanRevision and 2026 Base. Activate the complete set atomically after it is available; retain the preceding set for rollback. Cache identity includes base identity, plan revision, feature/geometry version and view type so old images cannot appear under new labels. Archived documents and revision-specific shared links retain their original revision; “current” views switch together. Archived years are clearly labelled and cannot become active merely by browsing them.

Plan changes never overwrite asset allocation, branch or finance data, labour, completion, departure/pickup history, confirmed on-site locations or recorded loading-door facts. A new plan position is a planning-layer change. Differences from confirmed on-site locations are displayed for review, not treated as permission to move records.

## When a verified 2026 base is unavailable

Show the approved selected-year plan on a neutral background with useful search, references and plan positions. Explain “Verified 2026 imagery unavailable” briefly. Offer the clearly labelled plan-derived 3D illustration only where geometry is supported. Do not show blank maps or describe older, undated or later imagery as2026. Andrew subsequently authorised keeping the previous satellite and3D views available while the verified replacement is researched. Preserve those views during that transition; do not remove them before a replacement is reviewed. No supplier or future capture availability is assumed.

## Acceptance checks

- Verified capture year, coverage and licence are recorded for every enabled base layer; embedded old imagery is excluded from plan renders.
- Main sheets and insets pass CRS, units, scale, control-point and registration-tolerance checks; unsupported locations fail visibly without invented coordinates.
- Renamed, reused, duplicate and missing references are handled explicitly; unmatched assets retain their history.
- Revised footprints and doors can be traced to the selected revision; stale geometry cannot generate a new-year model.
- All six view families switch together, including cached, shared and printed output; interrupted activation leaves the previous revision usable.
- Rollback restores the preceding plan and derived views. Archive browsing does not change the active year.
- Operational, finance, allocation, completion and confirmed-location records are identical before and after activation or rollback.
- With imagery disabled or unavailable, desktop and phone still show usable plan/search views and clear source labels.

## Clean base and transition — latest direction

Andrew requires genuine2026 imagery of the normal site without temporary GC500 event setup already in the photograph. The event plan is a separate optional overlay. Capture date and off-event visual suitability must both be checked across the site; hiding the overlay cannot remove infrastructure photographed into the base. He explicitly instructed “Restore both while checking2026” after rejecting a plan-only result. Previous views remain available during this authorised transition, with no unsupported2026 claim.
