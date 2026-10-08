# v9.45 — Map popup lifecycle

Author: Andrew Fisher

READY for parent integration; not published. Apply once to the v9.44 combined release (v9.41 also accepted for focused testing). Footer advances to v9.45.

Map callout and choice popups previously remained over other tabs after leaving Map. Replacing a callout removed its DOM but left its Escape listener installed. A small shared helper now invokes each popup’s existing Close button when the tab changes or another popup replaces it. The native handler removes both the popup and its keyboard listener.

No popup layout, marker selection, map state, records or native save functions change. Escape and Close remain the existing actions; the header’s visible Back and browser Back return normally and clear the old map popup.

Checks completed:

- 34 actual-page checks at 390 and 1440 pixels: all three popup types, Close/Escape, 24 replacements per viewport with one listener remaining then zero on close, native reference selection, visible Back, browser Back and tab departure.
- Native record unchanged; zero operational writes and zero runtime errors. Strict harness blocks all non-GET requests; the pre-existing Google tile-session POST was blocked.
- Seven guarded-patch/source-boundary checks; 43 scripts parsed; no new keys.
- Phone screenshot inspected: Today is unobstructed after leaving the map popup. Detailed screenshots remain private under `/workspace/private-popup945/evidence/`.
- Independent source read-through confirmed the existing selection and native Close handlers remain intact.

Reproduction:

```sh
python3 tests/test_patch945.py /path/to/combined-v9.41.html
PAGE=/path/to/candidate.html POPUP_OUT=/private/evidence CHROMIUM_PATH=/usr/bin/chromium flock /tmp/gc500-browser.lock node tests/test_popup_actual945.cjs
```

Exact tested hashes and sanitised counters are in `evidence/checks.json`. Parent owns final combined checks and publication.
