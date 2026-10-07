# v8.94: the Lighting basis is stated wherever its reading is shown

Author: Andrew Fisher. Codex raised it in its independent review of the full chain ([PR 6043702034](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6043702034)): "The new overall index consumes the current lighting percentage, so that source basis needs resolving before we can claim the whole-job figure independently verified."

## What the Lighting reading is

The Where we are card (v8.85) takes the Lighting reading unchanged from `todayWorkSummary848`. That is the same reading the live Today Lighting card shows: confirmed completion over the register's lighting towers.

The lighting scope audit (v8.82) checks the lighting plan's symbols against the scheduled quantities and current records. It is still open, because it needs the authorised "Schedule (5)" workbook, which isn't in this session. That audit could change the Lighting total **in either direction**:
- some plan symbols may turn out to be map-only, which would raise the percentage;
- the job may need more lights, which would lower it.

## What v8.94 does (presentation only)

- **Where we are card:** Lighting is listed as provisional. The Lighting chip says "Scope not yet confirmed", and its screen-reader label and tooltip read "Lighting scope not yet confirmed: lighting audit pending". The "How the whole-job figure is worked out" note explains the Lighting basis.
- **Lighting group card:** carries the same line, so both places say the same thing.
- **Lights:** all five can never turn green on an unconfirmed scope.
- **Numbers:** no number changes. Lighting is **not** given a "≥". The audit could move it either way, so a minimum would be the wrong claim. The whole-job figure stays exactly as v8.85 reads it.
- **Nothing else:** no record, DATA, money or navigation change.

When the audit is done, its result replaces the provisional label.

## Build

```
toolchain/build.sh v8.94 <the full chain: patch_v884 … patch_v889> [v8.93_maps_aligned_DRAFT/patch_v893.py] v8.94_lighting_basis_DRAFT/patch_v894.py
```

The footer step accepts the single ` · v8.89`, ` · v8.90`, ` · v8.91`, ` · v8.92` or ` · v8.93` marker.

## Checks

On a trial build of the full chain plus v8.94 (`2e55e2a0…`, 11,261,389 bytes, on live v8.83 `88a3584e`):
- DATA and MASTER_LOC are identical to the full chain without v8.94 (`evidence/data_identity894.log`).
- `tests/test_lighting894.cjs` passes 11/11 on laptop and 11/11 on phone:
  - the Lighting chip and the Lighting card each carry the note once;
  - the basis explains it, and Lighting is listed as provisional;
  - the Lighting reading equals its record, and the chip equals the card;
  - the whole-job number is unchanged;
  - all-green is blocked;
  - redraws keep one note in each place;
  - no overflow, no errors and no writes.
- Regression: RESULTS
