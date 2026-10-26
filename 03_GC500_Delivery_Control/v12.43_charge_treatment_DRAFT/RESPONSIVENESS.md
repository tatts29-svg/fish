# Measured responsiveness corrections — DRAFT

Author: Andrew Fisher

Andrew asked for GC500 to be smooth and quick. The current live v12.41 still stalls during navigation. This bounded extension removes repeated work without changing data, rates, financial allocation, the navigation order or CSS.

## Changes

- Navigation no longer measures the old pane before replacing its contents. Existing arrival classes, motion preferences, focus and native tab scroll memory remain.
- Costs avoids refresh-only scroll measurements during a tab arrival. The generation, route, pane and user-intent guards still protect refresh scroll restoration.
- Item-identity queries reuse a number-owner index under the native hold/carry lifecycle. Native save, hydration and context invalidation refresh it. The original per-reference query handles exceptional sources; the former four-second cache is removed.
- Each labour-line calculation resolves its aggregate unit list lazily once. Public unit projections still return independent mutable copies.
- The Finance PO map reuses the branch choices already calculated in that model call. Explicit PO branch overrides retain priority; no selection is retained for a later call.
- A view-only customer-charge control with no saved decision exits before resolving an unused source. Existing decisions and edit-mode eligibility still resolve and validate their current source.
- The small per-piece tick aggregate uses the native hold/carry lifecycle. Each caller receives independent nested groups; the original calculation runs fresh outside a hold and after native invalidation. No full asset model is cached by this change.
- Each event-window calculation reads the current frozen event days once instead of asking the same proxy five times. Configuration is still checked on every invocation.

Run the native lifecycle checks with `BASE=/path/to/reviewed/live-base.html python3 -m unittest discover -s tests -p 'test_*.py'` from this draft folder; the tick/identity checks require the exact pre-patch native source. Run `node tests/test_control1239.cjs` for the no-decision control differential checks.

The configuration fingerprint itself is unchanged. A more elaborate comparator was benchmarked, found slower, and rejected.

## Verification

Focused navigation: 22/22. Identity: three tests cover 15 synthetic and eight exact-native lifecycle scenarios. Local calculations: 39/39 differential/refusal checks. Event-window: two tests cover eight scenarios; an independent review added 14 native-configuration differential checks. The no-decision control fast path passes 21 native-source differential checks. The tick aggregate passes 13 native arithmetic/lifecycle scenarios plus exact-patch refusal checks, independently reviewed. The existing 88 resolver, 71 native API, 28 aggregate and eight CLI checks pass. Independent code review found no remaining blocker; it does not substitute for browser checks.

Current combined diagnostic candidate, built from verified live v12.41: `13cfeb20458d097ffbb148ec5f9c0b2ba3f61c02cd2a99f9e5b95d3c4e002fa3` (15,649,400 bytes; 213 scripts checked).
Base: `e106502b347cb51519f6aaed1eec5b6ba20a301b06490df04e3d29569d55b422`.

The prior combined candidate `758ac245916c0aab52bdc1c5b51c63f4af8e26d21964e05d92fcee71483be4bb` passed 34 full-page preservation, eight phone navigation/motion and 36 native edit-rehearsal checks. The edit rehearsal required correcting its private polling fixture to retain edit access; no production record was changed.

Repeated uninstrumented phone comparisons did **not** establish smooth performance: Costs paint times ranged from 5.0–13.7 seconds on the baseline and 5.8–30.1 seconds on that candidate. These results remain a failed performance sign-off, not a speed claim. Later diagnostic profiles identified repeated tick aggregation and layout measurement. The current candidate adds only the source-preserving aggregate reuse and no-decision fast path; fresh native verification is running. The following matched comparison includes the final helper set. KPI sizing, table accessibility and layout scheduling remain unchanged because moving a forced layout alone would not prove less work.


## Latest matched phone comparison

Uninstrumented ABBA order, two fresh contexts per version, the same frozen record, 390 × 844 viewport and no concurrent browser/compute tests. Times below are seconds; all four runs had zero runtime/console errors and no attempted service writes. These are local pinned-page measurements, not field-device performance.

| Phase | Live v12.41 observations | Current draft observations |
| --- | --- | --- |
| First hydrated screen | 10.29, 6.24 | 46.07, 10.66 |
| Costs navigation | 13.03, 4.07 | 3.14, 3.43 |
| Demob navigation | 8.58, 6.39 | 3.51, 3.55 |
| Today navigation | 4.22, 3.10 | 2.09, 1.70 |

Navigation improved in this sample. Startup remains unresolved, and neither the sample size nor the outlier supports calling GC500 smooth or fast overall. The slow start used substantially more browser/renderer/GPU CPU; fast resource replies alone do not distinguish script work from layout, decoding or rasterisation. A startup timeline is the next diagnostic. The older CPU trace belongs to the prior candidate and cannot explain the final candidate's outlier by itself.

## Release boundary

Not READY and not live. Claude retains v12.42 Demob and v12.45 map ownership. The queued-sync correction is independently verified offline at source `586747291637334c1957b3f200f6b60bb8a2586d`, candidate `70488134c46faf565bf396ffeeeb057b4d62f461962220001e5edd99ef30f83f` (19/19). Claude retains its browser and release checks. The requested v12.43 publication hold remains until that corrected release is verified live. Final v12.43 must rebuild on the corrected, independently verified v12.42 successor and repeat the relevant record/financial checks, phone validation, timings and both navigation sweeps before guarded publication.
