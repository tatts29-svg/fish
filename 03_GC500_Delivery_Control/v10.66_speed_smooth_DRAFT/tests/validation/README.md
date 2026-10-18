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
GC500_CAPTURE=1 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_DRAFT/tests/validation/parity.cjs /dev/shm/gc500-test-maintenance-private-18oct/live.html /dev/shm/gc500-v1066-private/parity-base-desktop.json
GC500_CAPTURE=0 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_DRAFT/tests/validation/parity.cjs 03_GC500_Delivery_Control/build/GC500_v10.66/GC500_Delivery_Control_hosted.html /dev/shm/gc500-v1066-private/parity-candidate-desktop.json
node 03_GC500_Delivery_Control/v10.66_speed_smooth_DRAFT/tests/validation/compare.cjs /dev/shm/gc500-v1066-private/parity-base-desktop.json /dev/shm/gc500-v1066-private/parity-candidate-desktop.json
GC500_CAPTURE=0 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_DRAFT/tests/validation/boot.cjs 03_GC500_Delivery_Control/build/GC500_v10.66/GC500_Delivery_Control_hosted.html /dev/shm/gc500-v1066-private/boot-desktop.json
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
It checks header/footer and same-record re-delivery. Only whitespace/NBSP and the exact v10.65→v10.66 footer suffix are
normalised. No numbers, prices, percentages, references, descriptions, dates, clock values or row order are discarded.
The fixed clock is 18 Oct 2026 09:30 AEST. The corrected initial Today route and preserved day-strip swipe are tested as
intentional behaviour changes. A genuine delayed reply must show the saved-copy fallback; offline cached data must
stay visible and honestly labelled, then recover to Live. Only the deliberate 503 responses are exempted from the offline
case's console-error check. No live operational write is permitted in any case.

Optional diagnostic only: the unproven artwork deferral is excluded from the production patch. Do not run
`artwork.cjs` as a gate for the eager-artwork candidate. `artwork.cjs CANDIDATE.html PRIVATE.json` adds browser gates
for a future experimental candidate with deferred decorative Build scenes:
cold Timeline and saved-copy reveal, strip swipe demand, far-swiped background redraw, keyboard focus, and full
beforeprint preparation. Repeated print preparation must not duplicate artwork. Card facts must remain identical;
this focused assertion excludes only the explicitly decorative `.wm-card-scene[aria-hidden="true"]`, while the
separate complete pane parity comparison still retains all text. Run it at desktop and phone sizes with capture disabled.

## Performance

Run only while no other browser or CPU-heavy test is running. Alternate baseline/candidate three times; do not run all
baselines first. Each invocation has a fresh browser context. The shared static cache and frozen API replies eliminate
record drift and large network variability; these are controlled browser measurements, not a production mobile-network SLA.
For phone use `MOB=1 CPU=4`; desktop `CPU=1` without MOB. `PERF_MODE=load` measures load, real tab-button clicks and a Build
day change; `PERF_MODE=idle IDLE_SECONDS=60` measures Today, Build and Map idle windows. Default `all` measures both.

```bash
GC500_CAPTURE=0 MOB=1 CPU=4 PERF_MODE=all IDLE_SECONDS=60 flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v10.66_speed_smooth_DRAFT/tests/validation/performance.cjs PAGE.html /dev/shm/gc500-v1066-private/perf-phone-base-1.json
node 03_GC500_Delivery_Control/v10.66_speed_smooth_DRAFT/tests/validation/performance_summary.cjs BASE1.json CANDIDATE1.json BASE2.json CANDIDATE2.json BASE3.json CANDIDATE3.json
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

- Validation transport rejects an uncaptured API read instead of falling through to the live service. The private
  frozen version/state pair is coherent. Canonical record comparison passed five adversarial checks: object-key order
  is ignored; changed quantities, cents, percentages and array order are detected.
- An unchanged v10.65 desktop sweep reached all 24 panes, 23 sampled Build days and 31 sampled reference drawers,
  plus header/footer, with no observed page/console errors, operational write attempts or missing API fixtures. It is
  **not a passing parity baseline**: its final re-delivery exposed the real scope normalization change described above.
- A short follow-up probe confirmed that first change and then a stable second re-delivery, with all 56 collection
  receipts present and scope consistency passing. The corrected two-stage full desktop/phone captures remain pending.
- The latest single phone CPU×4 diagnostic used experimental source
  `08a8d9c13cf185de9f5c8db39cebb7d4d3f82acf44b15d8f5dc0b0fde3f078b3`: Today usable 11.898 s,
  first Build 6.282 s, return to Today 3.701 s, Equipment 2.314 s, Map 1.092 s, Build revisit 3.120 s, load CLS 0.000126.
  These are diagnostic samples, not three-pair medians, and do **not** meet the load/tab targets.
- Final candidate desktop/phone parity, independent boot/offline gates, standing regressions and three-pair performance
  gates remain outstanding. No production readiness or publication is claimed by this validation directory.
- Deferred-artwork lifecycle checks were written as optional diagnostics but not run; that production experiment was
  removed because its performance gain was not established.

All raw records, exact changed paths, snapshots, traces and logs stay in private storage outside the repository.
