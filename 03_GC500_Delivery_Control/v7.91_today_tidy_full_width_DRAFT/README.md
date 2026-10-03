# v7.91: Today tidy-up after full width (READY TO UPLOAD)

Author: Andrew Fisher · 2 Oct 2026. One patch on the live v7.89 (`0d165f5f…`):

```
bash toolchain/build.sh v7.91 v7.91_today_tidy_full_width_DRAFT/patch_v791.py
```

That build gives **8,862,008 bytes, SHA-256 `a942bebe86fabc53d905e8267b526a9a1d54699adf5243fb9314ee6bf65d05e6`**.
- The scrub changes nothing.
- `check_page` passes.

## What Andrew asked

On 2 Oct 2026 he sent screenshots of Today on a wide screen after v7.89, with the note: "this is how today looks now this needs some work to clean up".

## What it changes (desktop only)

The phone is not touched.

| On a 2,000 px screen | Before (v7.89) | After |
|---|---|---|
| Back button | Dropped onto a row of its own: a dead band, also when slim | In the header row, beside the lockup |
| Today banner | 1,968 × 723 px | 1,400 × 528 px, centred. Same picture, same crop, so the board's words are never cut. The race strips on the other tabs get the same cap |
| Deliveries block | 1,060 px wide in a 1,526 px panel | Fills the panel (1,526 px) |
| Cards under the day | Second row 646 px of 1,968 | Every row fills the width |

On a 1,333 px laptop, everything measures the same as before, because the caps only bite on wide screens.

## Checks

| Check | Result |
|---|---|
| `evidence/today_tidy_tests.js` before and after (wide, laptop, phone) | Figures as in the table above; no sideways scroll; 0 errors |
| 21-tab / 7-link sweeps | Desktop and phone both clean: 0 errors, 0 console errors |
| v7.76 navigation | 21/21 |
