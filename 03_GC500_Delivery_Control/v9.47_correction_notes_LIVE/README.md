LIVE as part of combined v9.48 — 9 Oct 2026 08:48 AEST. Exact public page SHA256968cd3a850584736fcfa28b403e9b7fd2d280557e86984c8be87c2b5bf8c0ca1. Component notes below retain their implementation history.

# Readable correction notes

Author: Andrew Fisher

The retained WC20 correction evidence was displayed as one long paragraph in the
read-only equipment drawer. The human note now stays readable, with the exact
original JSON available under **Original correction evidence**.

Only a line beginning with the exact existing evidence marker, followed by a
valid JSON object or array, is folded. Human text before and after it remains
visible. Unrecognised or malformed content retains the original plain display.
Rendering uses text nodes throughout.

The complete stored note, editable text area and native Save handler are unchanged.
No record, photograph, work or financial data is migrated or written.

The release patch requires v9.46 and advances to v9.47. The explicit
`--preview-base-941` option is for focused testing only. Root owns the combined
release and publication.

Validation is recorded in `evidence/checks.json`. Detailed operational notes and
screenshots remain private. **READY for final integration**, not published.
Seventeen synthetic checks, exact patch/edit-preservation checks, all43-script
parse, and actual1440px/390px checks pass. Both screenshots were inspected.
The native full-note Save was captured with the shared record unchanged.
The only console warning is the existing iframe allow/allowfullscreen warning;
the one Google map setup POST per view was deliberately blocked. Final combined
release verification and publication remain with the parent task.
