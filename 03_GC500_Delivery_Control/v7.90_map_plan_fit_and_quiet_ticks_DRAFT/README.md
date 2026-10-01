# v7.90 map explorer: the plan fits when you switch to it, and the Done ticks are quiet (READY TO UPLOAD)

Author: Andrew Fisher · 2 Oct 2026. This changes **machine files only**: `explorer/explorer.js` and its entry `explorer/index.html`.
The entry's version query is bumped so a cached script can't mask the change. The dashboard page itself is unchanged.

| File | Bytes | SHA-256 |
|---|---|---|
| `release/explorer/explorer.js` | 128318 | `893f2c65d76e93684d4519a365b8a502549093c7434dc693360e50f325e7c1a1` |
| `release/explorer/index.html` | 23737 | `bc075d658d7de26636d962dac902f688f61928226470c1e863e28b042c686a26` |

Built from the live explorer `dd6256bc…` (the v7.82 release), and the live entry `111e9eab…` is the same as the v7.82 entry.

## What Andrew asked (2 Oct 2026)

> "also please fix maps — you are putting green ticks everywhere"

His screenshot showed the Original plan pushed into the bottom-right, on black.

## The fixes

1. **The plan fits when you switch to it.**
   - Cause: the plan and the satellite views measure in different coordinates, so a camera carried from one into the other lands off the drawing.
   - Fix: switching between the plan and a satellite view now fits the whole view. Switching between the two satellite views keeps where you are.
2. **The Done ticks stay off until you ask for them.**
   - Cause: v7.82 showed a green tick and a beating ring on every finished unit by default. On an edit link that's 70–80 of them over the whole plan.
   - Fix: they now start hidden. The **✓ Done** chip shows them (and says "tap Done to show them") and hides them again. A new storage key means everyone starts clean.

## Checks (`evidence/explorer_tests.js`, the live page with these two files served in place)

**After the fix: 7/7 on desktop and 7/7 on phone.**

| Check | What it confirms |
|---|---|
| X1 | The explorer opens on Satellite + plan |
| X2 | No ticks show until asked for (70 finished units known) |
| X3 | Original plan equals the whole-drawing fit |
| X4 | Back to satellite equals the whole-circuit fit |
| X5 / X6 | Done shows the ticks and hides them again |
| E1 | No errors and nothing written |

**Before, on the live files: 2/7.**
- Back to satellite kept the plan's camera and was off-centre: (1192, 842, 100%) where it should be (1451, 753, 118%).
- The Done layer was on by default.

The pictures are `evidence/before_*` and `evidence/after_*`.
