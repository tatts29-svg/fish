# v12.97 Demob and Build equipment locations

Author: Andrew Fisher.

Andrew requested plan-shaped equipment at its recorded position on the Demob card maps, and retained pickup-location maps after collection. His clarification is that the mark must look like the equipment as drawn on the map. He then requested the same treatment on Build maps. This release preserves the cards, stamps, weather, map modes and native quantities.

The patch is bound to live v12.96 SHA-256 `636519966750489d9f2e8313ea016e8e3aad9bb2169aa6744dd6aa1002b31018`. Claim source `4b4342038607ff69d6cce2e91459bd3a6ae1f9ac`; shared branch `ccr-061f77e8-ivjhrv`. Later board updates are retained, including the Build scope extension in `8a33da31`.

Demob's existing close, wide and whole-site picture pipeline now accepts map-only equipment context. Exact sourced plan outlines and door strokes stay at their original coordinates and orientation. Multiple unit outlines are a qualified, neutral reference layout; no individual asset is assigned to an arbitrary outline. Missing, moved, approximate or ambiguous geometry is not replaced with a fabricated equipment shape. Driver/load location resolution is unchanged. Cache keys include physical card, status, location and geometry; the existing three-job visible-card queue and bounded URL cache remain.

Build uses the same whole-reference source layouts in its existing close, wider-area and master-plan panels, with neutral colouring and its native Map Explorer click action. The drawing uses the same canonical point as the other two panels.

Picked-up cards keep their map pictures alongside the existing stamp. Older pickup events contain no saved map position; these show the current recorded/plan location with that limitation stated. Newly confirmed native departures retain an immutable, qualified position snapshot for the selected physical units and/or reference. The saved-map timestamp is distinct from actual departure time. No older records are backfilled. New metadata follows the native arrival cycle and identity checks, and is invalidated by a changed form location source. Unit pins and VMS identities must match explicitly; reporting points are not equipment positions.

The change does not edit commercial data, current operational records or the machine bundle. Tests block network writes. Source evidence, screenshots and native record captures remain outside the public repository.

Validation commands (from this directory):

```sh
node test_demob_shapes.cjs
node test_build_shapes.cjs
node test_pickup_locations.cjs
node test_vms_locations.cjs
node test_pickup_roundtrip.cjs /path/to/candidate.html
python3 check_scope.py /path/to/live96.html /path/to/candidate.html
PAGE=/path/to/candidate.html OUT=/private/demob-evidence flock -x /tmp/gc500-browser.lock node check_ui.cjs
PAGE=/path/to/candidate.html OUT=/private/build-evidence flock -x /tmp/gc500-browser.lock node check_build_ui.cjs
```

Use the shared build/check/upload tools. The exact candidate must pass static checks, focused native phone checks and desktop/phone route sweeps before READY. Publish only after pushing source/tests and READY; the guarded uploader checks the unchanged live base and exact public byte read-back. Fresh live UI verification is required before recording LIVE.

READY: 224 inline scripts checked; 127 shape, location, identity and native round-trip checks pass. Native Demob phone and Build phone/desktop checks, plus both final 27-tab/seven-deep-link/Back sweeps pass with zero runtime/console errors or attempted record writes. Candidate SHA-256 `567b19b3b767b66a273d0956aced913b942808f98e8f0c1f6075114c17f87261` (17031757 bytes). Detailed evidence remains private.
