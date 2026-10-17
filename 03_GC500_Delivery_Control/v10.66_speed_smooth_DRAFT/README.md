# v10.66 speed and smoothness — draft

Author: Andrew Fisher

The release consolidates the measured loading, Build, idle, header and read-index
changes handed over on 18 Oct 2026. It starts only from exact live v10.65 page
SHA256 `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8`.
The production map scripts and their exact pins are retained unchanged.

`patch_v1066.py` applies the 61 selected, non-overlapping replacements in
`speed1066_hunks.json`, hardens the carried reads, and changes the footer. Each
replacement uses the shared `toolchain/rep.py` exact-one-match helper. The patch
refuses a repeat, a wrong footer, or any different base bytes.

## Overlap decisions

- Loading's metadata, history and unit-evidence indexes implement the shared
  Build/read-index findings once. Index ordering and fresh return copies remain.
- Loading's milestone hold implements flicker part F once.
- Build F14 implements the field-only Save-bar observer once; idle keeps the
  live-field refresh set and all the clock/fold/glow work.
- Build's record signature memo and the day-work snapshot stack: reset also
  removes the held snapshot.
- Both proposed EventConfig signature caches are omitted. One caches within a
  task and the other within an asset hold; each can hide a same-task event-date
  change. Native immediate signature validation remains. The resulting speed
  must be measured on this final candidate; prototype results are not its results.
- Equipment fill and past-card progress may carry their read-only asset/memo
  snapshot across batches. Reuse now additionally requires identical record object, day, event
  configuration, document revision/state/files, sync health and viewing state.
  Save, received-record hydration and event-date changes invalidate the epoch.
  A change or exception during a read prevents retaining that snapshot.
- No new money formula, quantity, operational record, rate or schedule is added.

The two intended navigation changes are that a normal link opens Today instead
of accidentally opening Map explorer, and a background Build refresh preserves
the swiped strip position. Explicit day navigation continues to recenter it.

## Release gates

This is not READY or LIVE. The owner must build through `toolchain/build.sh`, run
the frozen-record/clock pane, day and drawer parity checks at both sizes, standing
suites, both 24-tab sweeps, boot/failure/deep-link and cache-invalidation checks,
inspect phone screenshots, and measure desktop plus CPU×4 phone A/B performance.
Only that checked candidate may use the guarded uploader and exact live read-back.
