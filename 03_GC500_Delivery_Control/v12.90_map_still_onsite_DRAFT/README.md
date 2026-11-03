# Still on site — Map Explorer v12.90

Author: Andrew Fisher

DRAFT — final visual corrections and verification in progress. No new release is claimed.

A visible Still on site button highlights equipment remaining to collect using the native departure projection. Partly collected groups retain their remaining quantities; missing quantities and review cases stay explicit. It preserves the source plan footprints and recorded door geometry introduced in v12.88. The toggle changes presentation only, with no operational or financial writes.

Base: v12.89, SHA-256 `89993cbd62c29f0a28b3dc5edc4365e8baab03a0af4858633441acc6faacab40`, 16,958,973 bytes. Source `a46705013397cf92d634ab374a5ba8dfdf26a586`. The preceding fencing release was completed before this build and is retained.

Machine: `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`, intended unchanged. Existing map modes, records and financial calculations remain authoritative.

Before release: verify native inclusion/exclusion and quantities, partial/unknown/review cases, actual orange map ink and button behaviour, source geometry, location/list handling, refresh, mode changes and restoration; inspect actual phone/tablet screenshots; run the existing departed-map regression plus full desktop/phone sweeps. Use the shared read-only harness and guarded release toolchain. Keep private operational evidence outside Git.

## Using the view

Open Map Explorer and press **Still on site**. Orange highlights identify recorded arrivals still to collect; the button fits the view once. Press it again to return to the previous map selection. **List** provides the full reference list, including quantities or positions that need confirmation. The toolbar counts references, not individual units.

Partly collected groups retain the original plan footprints and their remaining quantity at reference level. The source does not link every collected unit to an individual polygon, so this view never chooses which unit footprint remains. Door strokes come from the existing source. Unknown positions are listed rather than guessed. VMS boards use their native on-site state; arrival totals and historical position associations do not prove current location.

The filter is read-only. It reuses the normal shared-record refresh without adding a polling or drawing loop. Refresh updates the highlighted set without repeatedly moving the camera. Installation completion retains its original meaning in the 3D equipment model.

## Checks

Run `tests/check_model1290.cjs` for synthetic source-model cases and `tests/check_scope1290.py <base> <candidate>` for exact rebuild, base/duplicate guards and the two-script/footer change boundary. The latter also proves that the preceding fencing fix and all financial code remain unchanged.

Run `tests/check_onsite1290.cjs` through the shared browser harness with `PAGE`, `EXPECTED_SHA` and a private `OUT`. For live verification use `LIVE=1`, remove `PAGE`, and use a new private fetch cache. The script observes actual rendered map paths, native remaining data, touch controls, refresh and restoration; all operational writes are blocked. Detailed results and screenshots stay outside the repository.
