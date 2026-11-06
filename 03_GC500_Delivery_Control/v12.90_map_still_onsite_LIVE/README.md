# Still on site — Map Explorer v12.90

Author: Andrew Fisher

LIVE — 3 Nov 2026 at 13:31 AEST (`2026-11-03T03:31:06.138Z`), from READY source `98b4847a03865f0a644ab7d198648d4cd5fbed4a`. The guarded upload and independent public read-back match every final byte. Fresh live UI verification passes all 66 checks without a local page substitution.

A visible Still on site button highlights equipment remaining to collect using the native departure projection. Partly collected groups retain their remaining quantities; missing quantities and review cases stay explicit. It preserves the source plan footprints and recorded door geometry introduced in v12.88. The toggle changes presentation only, with no operational or financial writes.

Base: v12.89, SHA-256 `89993cbd62c29f0a28b3dc5edc4365e8baab03a0af4858633441acc6faacab40`, 16,958,973 bytes. Source `a46705013397cf92d634ab374a5ba8dfdf26a586`. The preceding fencing release was completed before this build and is retained.

Machine: `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`, intended unchanged. Existing map modes, records and financial calculations remain authoritative.

Before release: verify native inclusion/exclusion and quantities, partial/unknown/review cases, actual orange map ink and button behaviour, source geometry, location/list handling, refresh, mode changes and restoration; inspect actual phone/tablet screenshots; run the existing departed-map regression plus full desktop/phone sweeps. Use the shared read-only harness and guarded release toolchain. Keep private operational evidence outside Git.

## Using the view

Open Map Explorer and press **Still on site**. Orange highlights identify recorded arrivals still to collect; the button fits the view once. Press it again to return to the previous map selection. **List** provides the full reference list, including quantities or positions that need confirmation. The toolbar counts references, not individual units. On a narrow screen, the first fit can turn the plan to use more of the screen; the compass shows its direction. Background record refresh does not change that view.

Partly collected groups retain the original plan footprints and their remaining quantity at reference level. The source does not link every collected unit to an individual polygon, so this view never chooses which unit footprint remains. Door strokes come from the existing source. Unknown positions are listed rather than guessed. VMS boards use their native on-site state; arrival totals and historical position associations do not prove current location.

The filter is read-only. It reuses the normal shared-record refresh without adding a polling or drawing loop. Refresh updates the highlighted set without repeatedly moving the camera. Installation completion retains its original meaning in the 3D equipment model.

## Checks

Run `tests/check_model1290.cjs` for synthetic source-model cases and `tests/check_scope1290.py <base> <candidate>` for exact rebuild, base/duplicate guards and the two-script/footer change boundary. The latter also proves that the preceding fencing fix and all financial code remain unchanged.

Run `tests/check_onsite1290.cjs` through the shared browser harness with `PAGE`, `EXPECTED_SHA` and a private `OUT`. For live verification use `LIVE=1`, remove `PAGE`, and use a new private fetch cache. The script observes actual rendered map paths, native remaining data, touch controls, refresh and restoration; all operational writes are blocked. Detailed results and screenshots stay outside the repository.

Functional candidate: `89c8edb98f2e6f89ea95dcc90b2f4571d17f88692f3d1fd3c2976f61ef0482f7`, 16,979,763 bytes. The 63 focused browser checks pass, including actual source footprints and doors, physical VMS marker/list picks and card refresh, unavailable/unknown/review cases, a visible 3D model, selection rejection and recovery, and restoration. No runtime/console errors or attempted operational writes.

Final candidate: `ec56ffe5ef53670d286db566bd968366dfc366ad25edf6f2aa753076b10fc3e8`, 16,979,844 bytes. Its only difference from the functional candidate is one active-mode CSS rule that places the toolbar, legend and compass above VMS markers. Removing that exact rule reproduces the functional candidate byte for byte; all JavaScript and inactive presentation are identical. The separate actual phone touch-control check passes on the final bytes: all six toolbar centres receive their own touch events, and a real zoom-out touch changes the camera without selecting equipment. The common build checker parses all 224 scripts, and the scope and exact-base guards pass.

The functional candidate also passes the existing 43-check departed-footprint regression, the retained-map/photographic-3D regression, and desktop/phone sweeps of 27 tabs, seven deep links and Back. All report zero runtime/console errors and zero attempted record writes. The final CSS-only change affects the active filter; those JavaScript and inactive-view checks remain applicable by the exact byte comparison above. The optional third page argument to `check_scope1290.py` verifies this comparison.

Independent source and phone/tablet visual review are complete. Implementation, model review and independent review were split between separate reviewers; no review or receipt by the other publishing agent is assumed. Detailed operational evidence stays private. Shared records can advance during checks; no unchanged-record claim is made for the whole session.

## Live verification and handover

Independent public page: `ec56ffe5ef53670d286db566bd968366dfc366ad25edf6f2aa753076b10fc3e8`, 16,979,844 bytes. The machine hash remains unchanged. The shared record is identical in the immediate before/after-publication reads; no record writes were attempted by any test.

Fresh public-view checks pass 66/66, including actual orange source footprints/doors, shared remaining quantities, VMS picks and refresh, visible 3D equipment, and six matched on/off cycles. Category-only and search-only interactions are checked separately, each against its own pre-activation state; runtime errors, console errors and attempted writes are zero. Actual live phone/tablet screenshots were reviewed. The release is complete; future work starts from these live bytes.
