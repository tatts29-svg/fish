# Measured responsiveness corrections — DRAFT

Author: Andrew Fisher

Andrew asked for GC500 to be smooth and quick. The current live v12.41 still stalls during navigation. This bounded extension removes repeated work without changing data, rates, financial allocation, the navigation order or CSS.

## Changes

- Navigation no longer measures the old pane before replacing its contents. Existing arrival classes, motion preferences, focus and native tab scroll memory remain.
- Costs avoids refresh-only scroll measurements during a tab arrival. The generation, route, pane and user-intent guards still protect refresh scroll restoration.
- Item-identity queries reuse a number-owner index under the native hold/carry lifecycle. Native save, hydration and context invalidation refresh it. The original per-reference query handles exceptional sources; the former four-second cache is removed.
- Each labour-line calculation resolves its aggregate unit list lazily once. Public unit projections still return independent mutable copies.
- The Finance PO map reuses the branch choices already calculated in that model call. Explicit PO branch overrides retain priority; no selection is retained for a later call.
- The alignment decoration waits until Costs is displayed. Its existing observer builds the same report on first opening/refresh; drawer handling and explicit scans remain eager. The default startup trace measured 369.6 ms in the former hidden scan. This does not explain the worst startup outlier.
- A view-only customer-charge control with no saved decision exits before resolving an unused source. Existing decisions and edit-mode eligibility still resolve and validate their current source.
- The small per-piece tick aggregate uses the native hold/carry lifecycle. Each caller receives independent nested groups; the original calculation runs fresh outside a hold and after native invalidation. No full asset model is cached by this change.
- Each event-window calculation reads the current frozen event days once instead of asking the same proxy five times. Configuration is still checked on every invocation.

Run the native lifecycle checks with `BASE=/path/to/reviewed/live-base.html python3 tests/test_ticks1243.py` and the equivalent `tests/test_identity_index1243.py` command from this draft folder. These require the exact pre-patch native source. Run the standalone CLI suite with `BASE=/path/to/reviewed/live-base.html python3 tests/test_patch1243.py`. Run `node tests/test_control1239.cjs` for the no-decision control differential checks.

The configuration fingerprint itself is unchanged. A more elaborate comparator was benchmarked, found slower, and rejected.

## Verification

Focused navigation: 22/22. Identity: three tests cover 15 synthetic and eight exact-native lifecycle scenarios. Local calculations: 39/39 differential/refusal checks. Event-window: two tests cover eight scenarios; an independent review added 14 native-configuration differential checks. Startup alignment: 20/20 native-module differential/refusal checks, with independent source review. Its 13/13 native phone comparison checks pass: the original hidden report is absent, the active report matches exactly, refresh/return still rebuild it and every native document is unchanged. No runtime/console errors or HTTP writes; screenshot inspected. The no-decision control fast path passes 21 native-source differential checks. The tick aggregate passes 13 native arithmetic/lifecycle scenarios plus exact-patch refusal checks, independently reviewed. The existing 88 resolver, 71 native API, 28 aggregate and eight CLI checks pass. Independent code review found no remaining blocker; it does not substitute for browser checks.

Current combined diagnostic candidate, built from verified live v12.41: `28ea59432b7472bf76c6eba52753fdfdfc74cb4c467ac648390703642dc2c955` (15,649,549 bytes; 213 scripts checked). The final change from `13cfeb20458d097ffbb148ec5f9c0b2ba3f61c02cd2a99f9e5b95d3c4e002fa3` is the two alignment visibility guards; financial/data code is unchanged.
Base: `e106502b347cb51519f6aaed1eec5b6ba20a301b06490df04e3d29569d55b422`.

The prior combined candidate `758ac245916c0aab52bdc1c5b51c63f4af8e26d21964e05d92fcee71483be4bb` passed 34 full-page preservation, eight phone navigation/motion and 36 native edit-rehearsal checks. The edit rehearsal required correcting its private polling fixture to retain edit access; no production record was changed.

Repeated uninstrumented phone comparisons did **not** establish smooth performance: Costs paint times ranged from 5.0–13.7 seconds on the baseline and 5.8–30.1 seconds on that candidate. These results remain a failed performance sign-off, not a speed claim. Later diagnostic profiles identified repeated tick aggregation and layout measurement. The current candidate adds only the source-preserving aggregate reuse and no-decision fast path; fresh native verification has passed: 34/34 existing-financial preservation, 10/10 native phone checks and 36/36 isolated edit-rehearsal checks, with exact state restoration and no runtime/console errors or HTTP writes. Eight standalone CLI checks also pass. Phone screenshots were inspected. Those checks cover `13cfeb20` before the final alignment visibility guard; that guard has its own affected checks. The following timing comparison applies to `13cfeb20`, not to a new timing claim for `28ea5943`. KPI sizing, table accessibility and layout scheduling remain unchanged because moving a forced layout alone would not prove less work.


## Latest matched phone comparison

Uninstrumented ABBA order, two fresh contexts per version, the same frozen record, 390 × 844 view-only viewport and no concurrent browser/compute tests. Times below are seconds; all four runs had zero runtime/console errors and no attempted service writes. These are local pinned-page measurements, not field-device performance.

| Phase | Live v12.41 observations | Current draft observations |
| --- | --- | --- |
| First hydrated screen | 10.29, 6.24 | 46.07, 10.66 |
| Costs navigation | 13.03, 4.07 | 3.14, 3.43 |
| Demob navigation | 8.58, 6.39 | 3.51, 3.55 |
| Today navigation | 4.22, 3.10 | 2.09, 1.70 |

Navigation improved in this sample. Startup remains unresolved, and neither the sample size nor the outlier supports calling GC500 smooth or fast overall. The slow start used substantially more browser/renderer/GPU CPU; fast resource replies alone do not distinguish script work from layout, decoding or rasterisation. Two additional instrumented startup timelines completed without errors or writes: default motion 12.76 seconds and reduced motion 15.67 seconds. Script work was 5.35/6.79 seconds; layout plus style work was about 0.94/1.20 seconds. Neither reproduced the 46-second outlier, and reduced motion did not establish a solution. Default idle scripting was low over the following five seconds. These single traced runs do not identify the outlier’s cause or justify suppressing a required render. The older CPU trace belongs to the prior candidate and cannot explain the final candidate’s outlier by itself. The detailed default timeline shows a 1.739-second initial route callback, a separate 2.611-second hydrated redraw callback, and material parse/evaluation work. Their states differ; neither callback is removed. The 369.6-ms hidden Costs alignment callback is the only further safe avoidance established here.

## Release boundary

Not READY and not live. Claude retains v12.42 Demob and v12.45 map ownership. The queued-sync correction is independently verified offline at source `586747291637334c1957b3f200f6b60bb8a2586d`, candidate `70488134c46faf565bf396ffeeeb057b4d62f461962220001e5edd99ef30f83f` (19/19). Claude retains its browser and release checks. The requested v12.43 publication hold remains until that corrected release is verified live. Final v12.43 must rebuild on the corrected, independently verified v12.42 successor and repeat the relevant record/financial checks, phone validation, timings and both navigation sweeps before guarded publication.
