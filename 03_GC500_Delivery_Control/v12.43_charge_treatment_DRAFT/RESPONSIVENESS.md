# Measured responsiveness corrections — DRAFT

Author: Andrew Fisher

Andrew asked for GC500 to be smooth and quick. The current live v12.41 still stalls during navigation. This bounded extension removes repeated work without changing data, rates, financial allocation, the navigation order or CSS.

## Changes

- Navigation no longer measures the old pane before replacing its contents. Existing arrival classes, motion preferences, focus and native tab scroll memory remain.
- Costs avoids refresh-only scroll measurements during a tab arrival. The generation, route, pane and user-intent guards still protect refresh scroll restoration.
- Item-identity queries reuse a number-owner index under the native hold/carry lifecycle. Native save, hydration and context invalidation refresh it. The original per-reference query handles exceptional sources; the former four-second cache is removed.
- Each labour-line calculation resolves its aggregate unit list lazily once. Public unit projections still return independent mutable copies.
- The Finance PO map reuses the branch choices already calculated in that model call. Explicit PO branch overrides retain priority; no selection is retained for a later call.
- Each event-window calculation reads the current frozen event days once instead of asking the same proxy five times. Configuration is still checked on every invocation.

The configuration fingerprint itself is unchanged. A more elaborate comparator was benchmarked, found slower, and rejected.

## Verification

Focused navigation: 22/22. Identity: three tests cover 15 synthetic and eight exact-native lifecycle scenarios. Local calculations: 39/39 differential/refusal checks. Event-window: two tests cover eight scenarios; an independent review added 14 native-configuration differential checks. The existing 88 resolver, 71 native API, 28 aggregate and eight CLI checks pass. Independent code review found no remaining blocker; it does not substitute for browser checks.

Combined diagnostic candidate, built from verified live v12.41: `758ac245916c0aab52bdc1c5b51c63f4af8e26d21964e05d92fcee71483be4bb`.
Base: `e106502b347cb51519f6aaed1eec5b6ba20a301b06490df04e3d29569d55b422`.

Full-page preservation, phone navigation/animation and repeated uninstrumented comparisons are in progress. Earlier single-run timings varied and are not a release-level speed claim.

## Release boundary

Not READY and not live. Claude retains v12.42 Demob and v12.45 map ownership. The queued-sync review finding and requested v12.43 publication hold still apply. Final v12.43 must rebuild on the corrected, independently verified v12.42 successor and repeat the relevant record/financial checks, phone validation, timings and both navigation sweeps before guarded publication.
