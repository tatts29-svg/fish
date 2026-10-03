# v8.14 Today source review

Author: Andrew Fisher

Reviewed 3 Oct 2026 AEST. Scope: the frozen `dd83f06` patch, applied without alteration to the verified live v8.13 page. No browser, network mutation, operational record change or original-patch edit was performed by this review.

- Frozen patch SHA-256: `255a548a259bc747d975b79f2a1f4d8c23851b7b7014b51eae2b5e318a33cddf`.
- Base SHA-256: `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec`.
- Direct patch output SHA-256: `2595f1cd8bde0b4e0fd65733ab063404ad32ecd944912eb0d523103897cb4730`. This is a source-review fixture, before the release toolchain's attribution/version handling; it is not a release claim.

## Finding requiring correction

**The visible unexported-change count is overwritten during the same tab render.** `patch_v814.py` inserts `exportBadge814(att.export)` at the beginning of `renderTabs()`. The unchanged Export block later in that function (base lines 9770–9772) assigns `eb.innerHTML = 'Export' + ...` and replaces its title. Consequently, the promised `Export · 5 new` finishes as `Export` plus the existing dot. The red `due814` class survives and the old tooltip still contains the count, but the visible replacement for the removed card's count does not.

`source_cpu_checks.cjs` executes the actual candidate `renderTabs()` and badge function using a minimal isolated DOM fixture. With counts 5, 1 and 2, all finish with text `Export`. Zero correctly clears the warning class. Move the new badge write after the existing writer, or replace that writer, and verify nonzero, zero and subsequent nonzero changes through `renderTabs()`. The existing `v814_tests.js` check only requires `/^Export/`, which misses this defect.

Frozen-source CPU result: **28/31 passed**, with the three failures all proving this same finding. The log is retained as evidence of the original source, not as an accepted final check.

## Removal scope and remaining data paths

The exact diff removes the six named Today cards and the future-day form of the programme card, adds the Export label helper and two CSS rules, and changes no `DATA` bytes. No collection, calculation, save function, export payload, import function or destination view is deleted.

- Map sheets remain on Map; Documents' catalogue, upload availability and file actions remain on Documents.
- Fencing's docket, quote, weekly quantities and financial calculations remain on Fencing. The previously exceptional duplicate Fencing card on Today is explicitly authorised for removal by the later instruction.
- Unreferenced schedule rows remain on their exact Timeline day, including `unrefBlock()` and its “Give it a reference” action. `programmeDays()` and `programmeDaysBefore801()` are unchanged.
- Export and Import remain in Tools. `attention()` uses the same device-local change count. Every native save calls `renderTabs()`, including persistence-failure reporting; successful Export calls it after updating the export bookkeeping. Export's protection for changes made while the save dialog is open remains byte-identical.
- The old Your records card's last-export timestamp and last-import summary no longer have a visible panel. Their metadata remains in `S` and the exported record. This is part of the requested card removal; the release should describe it plainly and avoid asserting that every old display survives elsewhere. Operational record content still has its destination views.
- The historic roads snapshot is no longer rendered on Today; no live routing or map function is removed.

## Dates and printing

The condition is `dayNow`, meaning an existing programme entry on the current Brisbane date. It is not `deliveries.length > 0`: a removal-only, notes-only or unreferenced-row programme date still shows the current-day card, as it already did. This preserves current-day access and suppresses only the future-day fallback. Release wording should say “current programme day”, not promise a strict deliveries-only predicate.

The actual `isoIn()` and Today template expression passed tests immediately before and at Brisbane midnight, a gap day, a later scheduled day, the final scheduled day and the day after it. Rendered links point to the current date. Date helpers and programme calculations are unchanged. These source checks establish conditional/date behaviour; final browser checks still establish real layout and interaction.

Removed cards are absent from the template for screen and paper. The added advice-card widening is under `@media screen`, leaving paper layout rules unchanged. Existing lazy print hydration and fold-open/fold-restoration handlers are byte-preserved. Final publication still needs the owner’s print and responsive checks on the final candidate.

## Standing checks and permitted expectation changes

Retire only expectations invalidated by the authorised content removal:

1. `one_tab_tests.js` requires the Fencing card and roads card on Today. Replace those presence checks with absence plus surviving destination checks. Keep the Costs-card absence half of the combined Fencing/Costs assertion.
2. `same_figures.js` requires every Today text line to match the base. Compare retained Today components and keep the equality checks for unchanged destination tabs.
3. `v799_tests.js` requires the same Today Ctrl+P page count. Removed paper content can legitimately reduce that count; retain full report content, print hydration, fold restoration and other-tab isolation checks. Do not waive an unrelated report-print regression.

The supplied `v814.log` passes the static-date removal checks but does not exercise nonzero Export counts or a delivery-day card. The supplied `v799_desktop.log` and `v799_phone.log` stop after eight PASS lines and have no completion summary, so they do not establish full-suite completion. `run_all.sh` is a convenience launcher, not a reliable pass gate: it lacks failure aggregation, and its old v7.99 `_DRAFT` path differs from this checkout's `_LIVE` path. Use the release owner's final checks and their actual summaries.

## Verdict

The authorised removals and data/print source preservation pass this bounded review. Correct the one demonstrated Export-label overwrite and rerun the affected check before publication. No other source-level release blocker was found. Browser, screenshot, final build and guarded upload ownership remain with the release owner.
