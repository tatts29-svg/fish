LIVE as part of combined v9.48 — 9 Oct 2026 08:48 AEST. Exact public page SHA256968cd3a850584736fcfa28b403e9b7fd2d280557e86984c8be87c2b5bf8c0ca1. Component notes below retain their implementation history.

# v9.39 — Keyboard traversal and supplier labels

Author: Andrew Fisher

READY for integration; not published. The parent release advances the final footer and owns publication. Source accepts integrated v9.37 or v9.38 once and advances to v9.39.

The equipment drawer previously treated a native expandable summary as focus outside the dialog, looping back to its header before later items. The existing navigation trap now includes native summaries and other keyboard controls, excludes closed details content even where layout boxes remain, and follows positive tabindex/radio group order. One capture handler owns Tab; ordinary interior movement stays with the browser. Existing Escape, visible Back/Close, native clicks and save functions are unchanged. The helper does not store any record or introduce another overlay/history system.

Loading information and its shared paper product renderer use the existing supplier-name formatter. The stored `other:supplier-not-named` identity reads “Supplier Not Named”; supplier ownership and load allocation remain unchanged. Historical unresolved load sheets are not given an invented supplier association.

Verification:

- 18 pure keyboard/supplier checks and 6 guarded-patch/source-boundary checks passed.
- 46 actual-page checks passed at 390 and 1440 pixels: onward and reverse summary traversal, Enter expansion, access to the drawer’s last reachable control, both modal boundaries, nested Text dialog, Timeline progress, Today breakdown, Escape and visible Back/Close.
- Displayed supplier text and shared paper rendering checked; native record identical before/after, zero operational writes or runtime errors. Harness blocks every non-GET request; only the pre-existing Google map session request was attempted and blocked.
- 42 inline scripts parse; no new keys. Phone screenshot inspected privately; no operational screenshots are committed.

The test waits for the original initial drawer redraw to settle before keyboard assertions. The source helper received an independent read-through. Detailed results and phone image remain under `/workspace/private-focus939/evidence/`; sanitised counters and tested hashes are in `evidence/checks.json`.

Reproduction:

```sh
node tests/test_focus939.cjs
python3 tests/test_patch939.py /path/to/combined-v9.37.html
PAGE=/path/to/candidate.html FOCUS_OUT=/private/evidence CHROMIUM_PATH=/usr/bin/chromium flock /tmp/gc500-browser.lock node tests/test_focus_actual939.cjs
```
