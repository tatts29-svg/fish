# Documents — independent release audit

Author: Andrew Fisher · 3 Oct 2026 AEST.

**Latest finding and correction:** candidate665f53fe is held for the selected-row redraw race described in [the reproduction](evidence/selected_row_refresh815.md). The isolated selection proposal builds35ab1366, passes 70 CPU checks and 80 focused actual-browser checks. All 15 final standing runs also pass: 248 assertions plus both 21-tab/seven-link/Back sweeps, zero page/console errors. The integrated owner source8c821da matches exactly; final owner handover remains. Claude is holding source edits for verbatim integration. Earlier passing results remain valid for their named scope/candidate; they do not waive this newly reproduced defect. See [the correction report](evidence/followup_c1f6989_selection_positive.md).

**Current state:** the original five findings below are fixed. Further review found and corrected public-search disabling, lost category keyboard focus and stale categorisation after incoming records. The owner integrated the bounded correction verbatim in `c1f6989`; its candidate exactly matches `665f53fef3bd685260771c2d8e2867531263f3af7e9c84d870c316797f4c15fb` (9,116,658 bytes) on v8.14 base `6365fd09`. Independent source/CPU 43/43 and supplemental desktop/phone browser 60/60 pass. All 15 standing runs now pass:248 assertions plus both 21-tab/seven-link/Back sweeps, zero page/console errors and all browser contexts closed. A fresh public-base rebuild matches the same candidate. The owner's final Documents/layout gates and frozen handover remain. This is not READY or LIVE. The early findings and failed historical runs remain evidence, not current unresolved defects.

## Original draft findings

**Early draft feedback; not READY.** Review source is `968aefba33abd387b7b646b71340d41775679b25`, recovered privately with `git archive`. No implementation file, browser, network resource or live record was changed. The implementation owner retains the moving v8.15 draft.

Compared with the exact v8.13 page `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec` (9,079,773 bytes). Frozen `docs815_src.js` SHA-256: `4e482531fca0aac3859966ab3bf4bf29bc42f179764eb171c10b00a9ab1ae5dc`; patch: `b1efdd24395bd70d06e19f5da98452a443f30b43b30e2f4292147626b69e6a6b`.

## Corrections needed before release

### 1. Ordinary Print produces an empty document list from the default view

**Location:** `docs815_src.js:234–243` and `349–354`; `v815.css:37–40`.

On the initial Documents view, `bodyHtml815()` renders only Recent because no category is selected. Print CSS hides Recent, the category tiles and the search box. `docPrint815` is set only by the dedicated “Print the list” handler; there is no Documents `beforeprint` preparation. The retained page's existing `beforeprint` listeners also do not set this flag or generate the new catalogue body.

The extracted real body function produced five default rows, all inside Recent; the print selector hides all five. Native browser Print/Ctrl+P therefore has no document rows to print. With a category or search active, it prints only that partial body. This regresses the prior ordinary Documents print, where the main catalogue was already rendered.

Prepare the complete list for native printing as well as the button, then restore category, query and fold state after printing/cancellation. Test the actual native-print path from the initial view and a filtered/folded view. No PDF was generated in this source-only audit.

### 2. Map/invoice rows lose their recorded reference and its drawer action

**Location:** `docs815_src.js:92–104` and `132–146`; upload still offers these associations at `345–346`.

`row815()` computes a reference only for `Photographs`. `meta815()` does not render `d.ref`. A map or invoice filed against a reference therefore loses both its “filed against” information and the action that opens that reference, while the upload form and unchanged `docUpload()` still accept and save that association.

The same supported map fixture, `ref: 'WC60'`, was passed to the exact old `docCard()` and new `row815()`. Old output contains WC60 and `data-open="WC60"`; new output contains neither WC60 nor a reference action. Both retain the original file URL. This is a reproduced supported-data regression, not a claim that the saved file-index fixture currently contains an affected map/invoice.

Preserve the recorded reference and its existing drawer action for all document kinds that support it. Verify both map and invoice rows, including a reference that does not resolve to a current asset.

### 3. The plan link opens signed dockets instead of plans

**Location:** `docs815_src.js:23–24`. Existing callers remain in v8.13 `planUpdateCardBefore803()` and the Fencing `.planupd [data-go]` handler at HTML line 16036.

The existing button explicitly says **“Open the plan on the Documents tab”** and sets `state.docsec = 'fencing'`. The new alias sends `fencing` to the **Fencing dockets** category. The actual v8.13 data still uses this caller for Construction Week 5 and Construction Week 3 plans; only the newer Week 2 card uses the separate direct source link.

Route these plan links to Drawings and the fencing-plan group, or directly to the named source plan. Keep the explicit `dockets` route for signed docket papers. The current browser test at `v815_tests.js:122–123` expects the incorrect destination and should instead verify the actual plan button's requested source.

### 4. Header selection loses the selected document after catalogue deduplication

**Location:** `docs815_src.js:32–45` and `234–243`; `patch_v815.py` changes only the header document limit. The unchanged `finderIndex()`, `finderRow()` and `finderPick()` remain bound to catalogue IDs.

The five Advanced Fencing pre-starts correctly merge to the uploaded ATF IDs in `docCollection()`. The header finder still indexes the old catalogue IDs, checks those IDs with `docHref()` and reports them unavailable. Selecting such a result falls back to `go('docs')` without setting a category, query or selected document. Previously that destination rendered the catalogue; now it renders the default tiles and Recent, or the user's previously selected unrelated category.

Using the exact catalogue plus the saved 2 Oct file index, all five twins have a valid uploaded URL and a null old-ID URL. Executing the real `finderPick()` for the 14 Sep catalogue result left `docTile815` and `docQ815` unset; the subsequent real Documents body did not contain the selected uploaded pre-start. The same new default-view problem affects truly unavailable header results.

Resolve header document results through the merged collection/alias, and preserve the selected document in the fallback destination. Retain page anchors for `docday` results. Exercise a merged pre-start, a genuinely unavailable document and an available original through actual header selection, not only `finderMatches()` counts.

### 5. Merging a twin drops its catalogue note

**Location:** `docs815_src.js:43–45`.

The merge copies six selected metadata fields, then removes the catalogue item. It does not copy `note`. All five reproduced pre-start pairs have a catalogue note and no uploaded note; after merging, that note is absent from the collection, row tooltip and new local search. For 14 Sep, the lost note identifies the ATF pre-start basis, its SWMS revision, scope and attendance context. It is not one of the empty explanatory placeholders the draft proposes removing.

Retain the catalogue note when the uploaded item has none, and verify the retained contextual metadata is reachable. No stored record is deleted by this in-memory merge; the finding concerns its loss from the displayed/searchable collection.

## Source checks and test limitations

The new source parses and its real collection, row, body and header-selection functions execute in a bounded CPU fixture. The five intended twins merge only when a missing catalogue entry and ready upload match the normalised ID and category; their uploaded IDs and open URLs are retained. Upload, original-file opening, sheet printing and two-press deletion continue to use the existing underlying functions. Open anchors retain `target="_blank"` and `rel="noopener"`; photo previews reuse `docPhotoPreview()` and do not introduce automatic original-photo downloads.

Source CSS provides two category columns below 640 px, single-column file rows at that width, and both system/application reduced-motion rules. This review does **not** establish phone overflow, touch reach, keyboard focus after DOM replacement or final visual quality; those need the owner's browser checks on a final source.

The supplied browser tests do not close the findings above:

- `v815_tests.js:78` checks uniqueness after `seen` was already constructed as a Set; duplicate rendered rows cannot fail that assertion.
- Lines 106–107 label a count of uploaded collection items as proof that uploaded files are searched; they do not assert that a search returned a chosen uploaded file.
- Lines 124–125 claim empty invoices “says so” but assert only the active tab.
- Lines 145–150 manually set `docPrint815`; they do not exercise the button, native print, cancellation or state restoration.
- Header search checks a SWMS result count, without selecting a merged/missing document or checking its destination.
- `run_all.sh` has no fail-fast setting or aggregate failure status, so a later successful command can mask a failed earlier suite. Use the individual exit codes and completed results as the release gate.

No saved final browser results or screenshots are present in the nine-file frozen draft. Their absence from this handover is not a claim that the owner has never run the tests.

## Reproduction evidence

The checked-in [portable probe and instructions](evidence/README.md), [baseline source excerpts](evidence/baseline_v813.json) and [results](evidence/results_968aefb.json) reproduce all five findings in seven checks from the exact frozen commit using synthetic data only. They require no private files, browser, network or operational data. Source paths are explicit CLI arguments; source/CSS/patch and excerpt hashes are checked before execution. Exit 0 means the defects reproduced, not that the candidate is ready.

The earlier private inspection used the exact v8.13 catalogue and a saved GET `/api/files` response from 2 Oct 2026 to confirm the affected pre-start pairs; it was not a fresh service read. No part of that private index or its document contents is included in the portable evidence. The checked-in probe uses invented equivalents, including both map and invoice fixtures and merged/missing header selections. Classification and geometry remain outside this bounded reproduction.

This feedback neither changes the authorised layout nor approves publication. The v8.14 release remains separately owned; v8.17 stays parked.
