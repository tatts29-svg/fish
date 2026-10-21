# Confirmed servicing location update — draft

Author: Andrew Fisher.

Moves one explicitly named existing servicing reference to a confirmed private destination. The panel and crew
card receive the same source update. Existing reference and line IDs, units, assets, service days, plans, task
groups, contact template, controller and unrelated page bytes remain unchanged. It can place the reference in
a new servicing area without implying that the destination appears on the master drawing.

This patch requires the exact v10.97 hosted page SHA-256
`d584e292ec8647532ef7e93e3873dd41a48efd5890a4a9e32435318e7871b1dc` and changes its footer to v10.98.
It reuses the checked-in v10.97 validation and production crew-data projection; it does not modify those sources.

Set the three private input paths:

```sh
GC500_SERVICING_BASE_DATA=/private/current-full-source.json \
GC500_SERVICING_DATA=/private/proposed-full-source.json \
GC500_SERVICING_SCOPE=/private/movement-scope.json \
  bash toolchain/build.sh v10.98 v10.98_servicing_location_DRAFT/patch_v1098.py
python3 -B -I v10.98_servicing_location_DRAFT/test_patch.py
```

The scope is `{"add_refs": [], "move_refs": ["EXISTING_REFERENCE"]}`. Use the current full private source;
the older public source snapshot is no longer the complete dataset. Keep per-line map positions in the full
source; the crew download intentionally omits them. Private names, pins, input data and QR bundles stay outside
GitHub. A missing, stale or changed base stops the patch.

The patch only prepares the hosted page. The owner must separately back up and use the page's native functions
for the authorised operational change, update the existing tracker without re-keying, preserve all earlier
codes/completions, rebuild bounded print-map metadata and verify the new PDF. An off-plan pin must lose its old
drawing marker and remain available through its directions code; it must not be plotted at an old plan label.
Physical paper-scan readiness is a separate check. The paused map draft is not incorporated or released here.

Local validation: all 11 focused tests pass. Applying the patch to the exact live v10.97 base with the
current and proposed private source also passes; masking the two JSON values and release footer leaves
an identical page. Wrong bases, stale source, missing pins, extra scope and unrelated metadata changes
are refused. No publication performed by this patch task.

## Composed release

The release entry point is `patch_release.py`. It applies the exact-base servicing movement first, then the separately tested completion-scope, native date-only installation and board-arrival components. All operational inputs remain private. The current official candidate is SHA-256 `6a1d77fe216ab6a1088a89e75ebd4602bb24e084342881a5aa963448adc34e64` (18,637,777 bytes). The page checker passes all 149 inline scripts. Final cumulative desktop/phone25-route, seven-link and Back checks pass with zero page/console errors or writes. Bounded native captures on this exact candidate pass, including the guarded apply runners. Independent source review passes. READY TO UPLOAD; live read-back and authorised operational actions remain pending.

Independent component review found and resolved factual milestone totals being narrowed by a completion-only exclusion, placement being confused with arrival, and loss of historical board states. Completion exclusions now affect only completion. Supplied installation days retain date-only metadata and the actual audit time. Board arrival/installation stays distinct from Finished and keeps history. Existing contract identities and prices are preserved; a missing delivery-reference association remains an explicit billing limitation.

The generic print renderer also clears a stale drawing marker when the current supplied pin lies outside the sheet. Its synthetic four-edge regression passes. The separate next-version print presentation and live servicing map are not part of this candidate.
