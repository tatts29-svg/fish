# Test expectation maintenance — 18 Oct 2026

Author: Andrew Fisher

Two test-only corrections on source `2c011038d43e963a06da6c0b1ae02d0b727f28fa` (ownership at `bba5f73e3ecfa1d96f69c46dec2d1f87d0c35583`). No production page or operational record change.

- The v10.53 no-twin-steer footer check now compares numeric major/minor versions instead of accepting only v10.53–59. It accepts numeric patch versions, including v10.60.2.
- The v10.57 Demob locked-order heading now expects the 45 distinct references already published in v10.60. There are 46 sequence entries because two share one reference; the existing 11 groups and one constraint remain unchanged.

Validation used the captured live v10.65 page, SHA-256 `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8`, 18,302,611 bytes, with the shared GET-only browser harness. All non-GET record requests are aborted.

- Exact footer assertion: 14 boundary cases pass (old, current, patch, future and malformed versions).
- `test_twinsteer1053.cjs`: **36/36** pass, desktop and phone, no page errors.
- `test_part1.cjs`: **72/72** pass, desktop 36/36 and phone 36/36, no page errors.
- Both scripts parse; `git diff --check` passes.
- Independent source review confirmed both expectations against current published source and the sequence data; no concerns. Claude did not review these edits.

Raw browser logs remain private because they contain site details. These corrections are ready for the v10.66 standing checks.

## Further standing-test maintenance — saved draft, not yet browser-verified

The day-card suite now enters Build explicitly after hydration (cold hash routing has its own boot tests), accepts numeric later footer versions, and uses the already-published v10.58/v10.59 on-time/category presentation instead of superseded per-arrival rows. The exact unchanged-v10.65 comparison previously failed on these historical assertions. The changed test has passed syntax checks only; desktop/phone reruns remain required before v10.66 READY. The standing runner omits v10.57 part3 because v10.59 documents its own suite as the replacement; that replacement remains required. No production page or recorded quantities were changed for test maintenance.
