# v10.66 reproducible validation

Author: Andrew Fisher.

These tests use `toolchain/harness/open_page.js` and its operational-write abort. The adapter replaces only its
read transport with record/replay of API and weather replies. It adds console observation before navigation, a fixed
clock for functional comparisons, and measurement observers. It does not fork production code or the browser harness.
The fixture and all snapshots contain private site data and **must stay outside the repository**. The scripts enforce
that path rule. Commit only the scripts and a sanitised summary with hashes/counts/outcomes.

## Run environment

Use a dedicated private directory, the installed Playwright dependency, and the shared browser lock. Clear inherited
candidate-media/page/mobile overrides. `GC500_CAPTURE=1` records missing read replies; without it an uncaptured API
reply fails closed and is reported. After the baseline, keep capture disabled for the candidate. Check that the frozen
`/api/version` and `/api/state` versions agree before treating a comparison as valid. Do not refresh the fixture between A/B.

```bash
mkdir -p /dev/shm/gc500-v1066-private/{tmp,static-cache,frozen}
export NODE_PATH=/workspace/fish/03_GC500_Delivery_Control/toolchain/node_modules
export CHROMIUM_PATH=/usr/bin/chromium
export TMPDIR=/dev/shm/gc500-v1066-private/tmp
export GC500_CACHE=/dev/shm/gc500-v1066-private/static-cache
export GC500_FIXTURE=/dev/shm/gc500-v1066-private/frozen
unset PAGE MOB NODE_OPTIONS GC500_MEDIA_BASE MEDIA MEDIA893 MEDIA889 ATLAS896
```

From the repository root, take the baseline snapshot with `GC500_CAPTURE=1`, then candidate with capture disabled.
Use the same commands with `MOB=1` for the phone. The four captures are serial, under `/tmp/gc500-browser.lock`.

```bash
GC500_CAPTURE=1 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_LIVE/tests/validation/parity.cjs /dev/shm/gc500-test-maintenance-private-18oct/live.html /dev/shm/gc500-v1066-private/parity-base-desktop.json
GC500_CAPTURE=0 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_LIVE/tests/validation/parity.cjs 03_GC500_Delivery_Control/build/GC500_v10.66/GC500_Delivery_Control_hosted.html /dev/shm/gc500-v1066-private/parity-candidate-desktop.json
node 03_GC500_Delivery_Control/v10.66_speed_smooth_LIVE/tests/validation/compare.cjs /dev/shm/gc500-v1066-private/parity-base-desktop.json /dev/shm/gc500-v1066-private/parity-candidate-desktop.json
GC500_CAPTURE=0 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_LIVE/tests/validation/boot.cjs 03_GC500_Delivery_Control/build/GC500_v10.66/GC500_Delivery_Control_hosted.html /dev/shm/gc500-v1066-private/boot-desktop.json
```

Parity compares ordered visible and folded text of every tab, every third Build day, and every sixth reference drawer.
The unchanged v10.65 baseline can finish initial collection receipt before a later scope adapter has normalized the
record. A diagnostic reproduced a real derived-scope addition on same-record re-delivery; this is not dismissed as
object-key order. Numeric parity therefore explicitly re-delivers the same frozen payload once in **both** arms,
records the exact initial semantic delta privately, and requires a second re-delivery to leave the canonical record
unchanged with all collection receipts complete and quantity scopes consistent. The fully merged record hashes must
match between arms. Only object-key insertion order is ignored for this record comparison; array order and every
value remain significant. This is a transparent fixture setup, not a claim that baseline and candidate initial hydration
are equivalent. Candidate `boot.cjs` independently checks its initial collection/scope merge before any manual re-delivery.
Before each Build snapshot it scrolls each pending past-day card into the real viewport, waits for its native progress
loader, then restores the prior scroll positions. Offscreen cards intentionally remain pending in the baseline, so this
demand sweep is needed to compare completed figures rather than different numbers of transient “Loading…” labels.
For Today, screen-visible text is captured before any print preparation. The candidate's already-hidden report
instrument is then materialized through its existing `TodayReport1066.flush()` solely for exact full/folded text
comparison. Both arms then run the existing `financeOperational857()` screen postprocessor, matching `render()`'s
native render-then-filter order. The baseline intentionally keeps financial prose/columns out of operational panes;
inserting the candidate's hidden report after that filter would create an artificial difference. Costs still compares
its complete figures, and the independent native Print/PDF tests apply no manual finance filter. These helper calls
are not counted as native-print tests. The actual Today gauge must finish its own animation (`data-w885-pct` text equals
its declared target) before capture; an intermediate displayed percentage is never normalized into its final value.
It checks header/footer and same-record re-delivery. Only whitespace/NBSP and the exact v10.65→v10.66 footer token (including its adjacent `Shared record` boundary in textContent) are
normalised. No numbers, prices, percentages, references, descriptions, dates, clock values or row order are discarded.
The fixed clock is 18 Oct 2026 09:30 AEST. The corrected initial Today route and preserved day-strip swipe are tested as
intentional behaviour changes. A genuine delayed reply must show the saved-copy fallback; offline cached data must
stay visible and honestly labelled, then recover to Live. Only the deliberate 503 responses are exempted from the offline
case's console-error check. No live operational write is permitted in any case.

A bounded `focus.cjs PAGE.html PRIVATE.json` recapture covers only Today and the progress alias after these timing/
materialization corrections. `compare.cjs BASE.json CANDIDATE.json BASE_FOCUS.json CANDIDATE_FOCUS.json` accepts those
replacement samples only when source SHA, viewport, fixed clock, record version, complete stable record SHA, method
and exact two-pane scope match the original full captures. Other panes/days/drawers remain bound to their original
captures. The original failed comparison is retained privately; the focused result does not rewrite it.

`print.cjs PAGE.html PRIVATE.json [PRIVATE_BASELINE.json]` independently exercises the actual Today Print button
and browser PDF/beforeprint, each in a fresh context. It compares the complete report text, print-visible text,
instrument text and numeric `WIP.model` against the frozen baseline; actual PDFs and extracted text remain private. The extracted PDF text must include the report rather than the print-refusal page and must match baseline text (apart from the release footer). Both modes first exercise the real mandatory checkbox/name/continue dialog using a synthetic validation name. Native `window.print`
is intercepted only to avoid an OS dialog, then Playwright's real PDF operation emits the browser print lifecycle.
The native handler's folds/styles remain in force for that PDF. After printing, the original route and existing fold
states must return, the temporary print style must disappear, and the complete canonical record must remain unchanged.
Run baseline and candidate at both desktop and phone sizes under the same lock:

```bash
GC500_CAPTURE=0 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_LIVE/tests/validation/print.cjs /dev/shm/gc500-test-maintenance-private-18oct/live.html /dev/shm/gc500-v1066-private/print-base-desktop.json
GC500_CAPTURE=0 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_LIVE/tests/validation/print.cjs 03_GC500_Delivery_Control/build/GC500_v10.66/GC500_Delivery_Control_hosted.html /dev/shm/gc500-v1066-private/print-candidate-desktop.json /dev/shm/gc500-v1066-private/print-base-desktop.json
```

Optional diagnostic only: the unproven artwork deferral is excluded from the production patch. Do not run
`artwork.cjs` as a gate for the eager-artwork candidate. `artwork.cjs CANDIDATE.html PRIVATE.json` adds browser gates
for a future experimental candidate with deferred decorative Build scenes:
cold Timeline and saved-copy reveal, strip swipe demand, far-swiped background redraw, keyboard focus, and full
beforeprint preparation. Repeated print preparation must not duplicate artwork. Card facts must remain identical;
this focused assertion excludes only the explicitly decorative `.wm-card-scene[aria-hidden="true"]`, while the
separate complete pane parity comparison still retains all text. Run it at desktop and phone sizes with capture disabled.

## Performance

Run only while no other browser or CPU-heavy test is running. The extended benchmark alternates baseline/candidate
three times; do not run all baselines first. For the 18 October release, the release owner explicitly scoped the minimum
to one controlled A/B pair at each viewport plus three 60-second candidate phone idle windows. These are single samples,
not medians; the three-pair benchmark remains follow-up. Each invocation has a fresh browser context. The shared static cache and frozen API replies eliminate
record drift and large network variability; these are controlled browser measurements, not a production mobile-network SLA.
For phone use `MOB=1 CPU=4`; desktop `CPU=1` without MOB. `PERF_MODE=load` measures load, real tab-button clicks and a Build
day change; `PERF_MODE=idle IDLE_SECONDS=60` measures Today, Build and Map idle windows. Default `all` measures both.
Both arms are explicitly placed on Today before timing the same tab sequence. The genuine cold-load route is retained
separately: baseline can land on Map while the candidate correctly lands on Today, so those differing-route load times
are not an A/B speed comparison. `performance_minimum.cjs` validates and summarises the five minimum-run files in order:
desktop baseline, desktop candidate, phone baseline, phone candidate, phone candidate idle.

```bash
GC500_CAPTURE=0 MOB=1 CPU=4 PERF_MODE=all IDLE_SECONDS=60 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_LIVE/tests/validation/performance.cjs PAGE.html /dev/shm/gc500-v1066-private/perf-phone-base-1.json
node 03_GC500_Delivery_Control/v10.66_speed_smooth_LIVE/tests/validation/performance_summary.cjs BASE1.json CANDIDATE1.json BASE2.json CANDIDATE2.json BASE3.json CANDIDATE3.json
```

The summary reports every target as met/unmet: usable <8 s phone/<2 s desktop, post-usable tasks ≤250 ms, load/tab CLS
<0.02, tab feedback frame opportunity ≤100 ms, tab completion ≤500 ms, and top-level idle TaskDuration <2%. A successful
measurement does not imply that these aspirational targets passed. First-frame feedback uses a browser frame opportunity,
not a pixel/screencast assertion. Map interaction frame rates are covered by the standing v10.64–65 suites and their
separate probes; these load/idle measurements do not pretend to re-measure map gestures.
When a candidate defers decorative Build artwork, completion also requires every visible `data-bc1066-sky` slot to report
`data-bc1066-ready="true"`. Changing Build day waits for the intended selected card and its artwork. A blank placeholder
or the previous selection cannot satisfy completion; the unchanged baseline has no deferred artwork markers.

For diagnosis before another candidate edit, `profile.cjs PAGE.html /private/prefix` records real Build and Today tab
clicks, their raw CPU profiles, and source-line self/inclusive summaries. Use the same environment and browser lock.
Tracing/profiling changes absolute timing; its results locate expensive functions, not final performance medians.

## Recorded validation state — 18 October 2026

Exact baseline SHA256: `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8`.
Exact candidate SHA256: `4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6`.

- Desktop and phone each pass **171/171** exact text/record comparisons across all 24 panes, 23 sampled Build days,
  31 sampled reference drawers, and header/footer. The complete stable canonical record agrees between both sources
  and viewports. No observed page/console errors, operational write attempts or missing API fixtures.
- The original desktop comparison is retained privately at 167/171. Its four differences exposed gauge-animation
  capture timing, hidden-report screen postprocessing and the exact footer boundary. Only the two affected pane
  samples were recaptured with source/clock/record provenance checked; the other 167 passing checks remain original.
  The final phone capture includes the corrected method. No figures or semantic differences were normalised away.
- The transport fails closed on missing fixtures. Canonical-record tests reject changed quantities, cents, percentages
  and array order. Eleven comparator contract checks reject altered figures and forged focused-capture provenance.
- Independent candidate boot/deep-link/delayed/offline recovery checks pass **21/21 at each viewport**, including
  complete initial hydration before manual redelivery, empty-link Today routing and preserved Build swipe position.
- Actual native Print and browser PDF checks pass against the baseline at desktop and phone sizes. The compulsory
  print confirmation UI is exercised, refusal-page output is rejected, full report and extracted PDF text/model agree,
  and folds/route/record return unchanged. No manual screen-finance filtering is applied to these print checks.
  This is semantic PDF equivalence, not a binary or pixel-identical PDF claim.
- The final settled phone Today screenshot was inspected: readable content, selected Today tab, live status and no
  residual first-load celebration overlay. This inspection does not claim every page is visually perfect.
- Minimum final performance measurement is complete: one A/B pair per viewport plus three 60-second candidate
  phone idle windows. All measured tab transitions improve, but several timing/idle targets remain unmet. See
  [RESULTS.md](RESULTS.md) and `results.json` for exact measurements and limitations. Standing suites, standard
  sweeps and publication are owned separately by the release owner. This file alone is not a LIVE claim.
- Deferred-artwork lifecycle checks remain optional diagnostics only. The unproven production experiment was removed;
  the candidate retains eager original artwork.

All raw records, exact changed paths, snapshots, PDFs, screenshots, traces and logs stay in private storage outside the repository.

Final standard sweeps **pass** at desktop and phone sizes: 24 routes, seven exact destinations, intentional aliases,
Back, zero page/console/early/network errors and zero operational writes. See [SWEEP_STATUS.md](SWEEP_STATUS.md)
for the final results and separately retained earlier outage evidence. Publication is owned by the release coordinator.
