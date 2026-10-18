# v10.66 speed and smoothness — ready

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

## READY TO UPLOAD — 18 Oct 2026

Final upload candidate: SHA256 `9724e2a644833e7b6e56139b7954add2f639e348f03c6b6c9d109e0229cc821a`, 18,322,580 bytes. Built by the official toolchain from the exact live base above; 141 scripts parse. Production source is preserved in commit `4ac9fb2`; final validation and the later diagnosis are preserved together on the shared branch.

All release correctness gates pass: 171/171 semantic comparisons per viewport; 21/21 boot/deep-link/offline/recovery cases per viewport; actual native Print and browser PDF parity; source/cache invalidation contracts; standing regressions including the corrected 154/154 receipt fixture and both five-case Costs scroll checks. Both final canonical sweeps pass 24 tabs, seven exact destinations, Back and intentional aliases, zero page/console errors and zero attempted writes. Their observation probes also recorded zero failed network responses. The settled phone presentation was inspected. Evidence: `tests/validation/RESULTS.md`, `tests/validation/SWEEP_STATUS.md`, `tests/standing/results.json`.

A transient execution-network outage interrupted the final checks. Its failures were retained, then only the affected jobs were rerun on the same candidate after recovery. No assertions or production errors were suppressed.

This is a measured incremental speed release. One controlled A/B pair per viewport showed first Build about 47% faster and Today about 45–49% faster. Full phone load/tab/idle goals remain unmet; the extended three-pair benchmark and remaining animation/polling work are follow-up. No claim of zero lag or complete performance remediation is made. Full numbers and limits are in the validation evidence. No operational record, rate or calculation changed.

The new idle/merge-plan handover was compared against this frozen source. Existing clock, observer, folded-ring and unchanged-record protections are included. Stronger cache invalidation remains intentional. Equipment pump-budget and visible animation refinements remain follow-up; the handover adds no correctness blocker or ownership hold.

Publication must use the guarded uploader, then exact public read-back and unchanged-record/retained-server verification. A LIVE entry will record the actual result.

The service safely refused the original candidate because its early loading CSS moved the first GC500 identifier beyond the existing upload envelope check. The final upload adds only the 32-byte HTML comment `<!-- GC500 Delivery Control -->` after the doctype. Removing that single comment reproduces the complete previously tested 4b5b727b page byte-for-byte: every script, style, data value and visible element is unchanged. Official rebuild/static checks and the existing server envelope expression pass. This is an identity-envelope correction, not a bypass or server change. Evidence: `tests/page_envelope_result.json`.
