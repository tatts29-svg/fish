LIVE as part of combined v9.48 — 9 Oct 2026 08:48 AEST. Exact public page SHA256968cd3a850584736fcfa28b403e9b7fd2d280557e86984c8be87c2b5bf8c0ca1. Component notes below retain their implementation history.

# Selected Timeline day visibility — v9.37

Author: Andrew Fisher

Frozen and ready for final integration. No upload performed by this task. Claimed scope: a fresh Timeline must show its selected current day, while explicit date links and the native Prev/Next/Today controls keep their meaning.

The initial Timeline render runs while the current-record loading gate hides the panes. The strip and selected card both measure zero pixels; the old calculation incorrectly considers the card already visible. Once the gate reveals the pane, the strip remains at September's first day even though October's day is selected.

The same instant horizontal calculation now runs only on a visible, measurable Timeline strip. It runs at the original render point and when the native refresh gate reveals either the current record or a saved copy. Resize and pageshow re-query the current selected card. There are no observers, timers, cached nodes or deferred callbacks. The helper changes only the strip's horizontal position; date selection, focus, page scrolling, records and costs remain native. A selected card already in view stays where it is.

## Checks

- **32/32 actual-page checks**, on fresh 390px mobile and 1440px desktop sessions: initial Timeline, refresh, a fresh explicit date link, Prev/Next/Today, rapid Next, return from Today, selected-card visibility, focus and document/main scroll preservation, and resize after departure.
- **11/11 model/native-reveal checks**: zero dimensions, already-visible state, replaced strips, inactive panes, programme boundaries, missing elements, scroll fallback, pageshow, saved-copy reveal and ready reveal.
- Shared page check passes: **41 inline scripts parse**, no new keys/tokens.
- Guarded patch accepts v9.34 or the v9.35/v9.36 integration chain, advances the footer to v9.37, and refuses duplicate/unsupported input without modifying it.
- Native record unchanged, zero native save attempts, zero runtime errors. Strict tests block every non-GET request; map-provider setup POSTs remain denied.
- Inspected actual mobile and desktop screenshots with 9 October visibly selected. Detailed operational screenshots remain private, outside Git.
- Independent source review found no remaining blocking issue.

A short event day has less page content: desktop main scrolling correctly clamps to its new maximum (200px becomes 75px where 75px is the maximum). The helper itself preserves main/document position and focus; the test distinguishes native content clamping from an unintended scroll.

Tested live base: `b881e8890e8a590fea79ac63657fd43254c5ccdd11735d7f70a1b4874773c33c`.
Focused candidate: `8cb0f776869f04a638d5da9603768c64efabdac1d1e359e00688daaaa9f73c57`.

```sh
python3 patch_v937.py /private/path/candidate.html
PAGE=/private/path/candidate.html node tests/test_timeline937.cjs
BASE=/private/path/live-v934.html python3 tests/test_patch937.py
CHROMIUM_PATH=/usr/bin/chromium PAGE=/private/path/candidate.html TIMELINE_OUT=/private/path/results \
  flock /tmp/gc500-browser.lock node tests/test_timeline_actual937.cjs
python3 ../toolchain/check_page.py /private/path/candidate.html --base /private/path/live-v934.html
```

Final combined all-tab sweeps and guarded publication belong to the integrating release owner.
