# v10.66 speed and smoothness — draft

Author: Andrew Fisher

The release consolidates the measured loading, Build, idle, header and read-index
changes handed over on 18 Oct 2026. It starts only from exact live v10.65 page
SHA256 `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8`.
The v10.64/v10.65 shapes layer and pinned map integrations are retained. The
existing map completion read uses the native held snapshot; geometry, saved pins
and completion formulas are unchanged.

`patch_v1066.py` applies the 61 selected, non-overlapping replacements in
`speed1066_hunks.json`, hardens the carried reads, applies the guarded history
and Today work reductions, and changes the footer. Each
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
- `history1066.py` reuses the sorted audit history inside the existing asset
  hold and finds its latest qualifying event without copying and filtering four
  arrays for every historical read. Public `histOf` callers still receive fresh
  arrays. The committed/local merge, deduplication and stable event ordering are
  unchanged. Raw histories do not depend on event pricing configuration.
- `build_reads1066.py` uses that same raw-history snapshot for the private Build
  category readers, removing duplicate event-configuration checks and array
  copies. Every caller only reads the rows. The older arrival formatting and
  all category error/fallback paths are retained.
- `today1066_hunks.json` omits a Costs card that the existing Today presentation
  always removes, plus unused calculations left behind by that removal. All
  financial model functions and all final visible Today figures remain intact.
- `dom_batch1066.py` reads control/masonry geometry before changing attributes
  or row spans, and skips unchanged control writes. The existing layout rules
  and visible-target decisions remain.
- `today_models1066.py` lets the whole-job plate reuse the completed Today board
  models only inside their existing unchanged asset hold. Hidden VMS banners
  skip fitting/painting and redraw on opening, resize and print.
- `today_report1066.py` defers the existing screen-hidden Today report instrument
  until printing. The native report functions, header/actions and date remain;
  native Print and browser printing synchronously prepare the full current report.
- `boot_sync1066.py` keeps early network reads but waits until all inline
  extensions exist before applying their first snapshots. A failed collection
  callback no longer consumes the version or announces Live. The next poll
  retries that version through the native merge path.
- The isolated `build_art1066.py` / `build_art1066_src.js` diagnostic prototype
  is **not applied**. It deferred only decorative weather SVGs and passed its
  source checks, but the CPU×4 phone sample did not establish a tab-speed gain.
  The production patch retains eager artwork rather than adding unproven
  lifecycle complexity.

The two intended navigation changes are that a normal link opens Today instead
of accidentally opening Map explorer, and a background Build refresh preserves
the swiped strip position. Explicit day navigation continues to recenter it.

## Release gates

This is not READY or LIVE. The owner must build through `toolchain/build.sh`, run
the frozen-record/clock pane, day and drawer parity checks at both sizes, standing
suites, both 24-tab sweeps, boot/failure/deep-link and cache-invalidation checks,
inspect phone screenshots, and measure desktop plus CPU×4 phone A/B performance.
Only that checked candidate may use the guarded uploader and exact live read-back.

Direct source contract checks currently pass: 41 carried-cache assertions,
109 history assertions, 27 native Build-reader parity assertions,
31 DOM-batch assertions, 42 artwork lifecycle assertions
for the excluded prototype, 22 native boot delivery assertions, four Today model/report tests,
and three patch refusal tests. The history tests exercise
the new helper against controlled histories; browser parity and native hydration
checks are separate required gates. Initial combined CPU×4 phone measurement
still misses the agreed speed targets. These passing source checks do not make
the draft ready for publication.

The current private assembled draft is 18,322,548 bytes, SHA256
`4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6`.
It passes the static page check for all 141 inline scripts against the exact
live base. This identifies the source under validation; it is not a new live
release or an approval of its performance. Final desktop and phone parity,
native hydration/recovery, print and standing regressions remain gates.
The coordinated server v5.90 switch is recorded live on the shared board and
its publication hold is lifted. Page publication still requires the final
candidate's correctness checks and exact guarded read-back.

A diagnostic CPU×4 phone sample of the preceding `08a8d9c1` draft reached Today in 11.898 s.
Measured tab completion was Build 6.282 s, Today 3.701 s, Equipment 2.314 s,
Map 1.092 s and a Build revisit 3.120 s; selecting another Build day took
2.229 s. The busy indicator had a frame opportunity within 13–32 ms, but
the content completion times still fail the 500 ms target. This single sample
is diagnostic, not a completed A/B performance gate. Raw records, logs and
profiles remain private and are not committed with the patch.
The timing targets remain improvement goals; they are not reported as met.
A release decision must distinguish measured improvements from remaining
performance work and still pass the functional, data-parity and safety gates.
