# Build and Today design preview

Author: Andrew Fisher

**DRAFT — not ready to upload, not published. Live remains v9.92.**

Andrew requested a refined mock-up on the actual page, retaining animation, lights and known dimensions/weights. He then identified the white Available staff area as inconsistent with the page. This folder contains that reviewable preview only.

Iteration 2 responds to the request to show known unloading methods, reduce wasted space and tidy Today’s opening. Date and Showcase remain visible; Email, Print and the original section shortcuts sit under Actions. Available staff uses a compact row. A genuinely unrecorded roster folds to a dated “Staff · Not recorded” line, keeping its native details and permitted edit controls accessible. This state remains distinct from confirmed zero availability. The roster date stays the actual day even when View date shows history.

Load cards show the existing reference unloading instruction beside the load description. Saved instructions take precedence over schedule instructions; schedule fallback is labelled. Unknown methods and the ambiguous legacy “Crane / Franna not required” value do not create blank summary rows. “On-site crane” retains its native “type to confirm” qualification. These are unloading instructions, not a claim that lifting equipment has been booked or unloading completed. The native Details editor and source references remain available.

The preview aligns load number, time, destination and actions; separates native measurements into larger readings; keeps qualification labels visible; and uses compact charcoal panels for Available staff, day More info and Truck flow. The nested white card face is removed. Available staff still uses the shared daily roster and native editing permissions.

Native light stages, current-stage pulse, weather animation, hover feedback, tap sweep and Details transitions remain. Motion controls, reduced motion and offscreen lamp suspension are retained. No continuous animation loop was added. The legacy Navigate pulse now also stops with Motion Off, reduced motion and print. Real loads retain their actual status; the preview does not pretend an Off-site load is in transit to demonstrate a pulse.

Measurement strings are preserved verbatim, including units, ranges and certainty labels. The patch changes presentation only; no operational record, financial model, load state, staff assignment or route is written.

## Reproduce

From `03_GC500_Delivery_Control`:

```sh
bash toolchain/build.sh v9.93-iteration2-reviewed v9.93_animated_load_preview_DRAFT/patch_v993.py
```

The patch requires exact live v9.92 SHA256 `0460e6f2306946c0e7262600414ff65b0824b0a086e618dbce28d7c66669e890` and refuses a second application.

Preview SHA256: `747936f9bc9ffd1151ab812c696f3e377aa4d7b6ba8a9fc2df7eecb4d7609676`.

Preview size: 14,770,461 bytes; 79 inline scripts. Build syntax, attribution and secret checks passed. Duplicate-application and wrong-base guards passed. Removing the three preview injections and restoring the footer returns the exact native v9.92 source.

The capture harness in `preview/` uses the existing read-only shared harness with a local browser-video wrapper. Every browser run requires `/tmp/gc500-browser.lock`. Private screenshots and video remain outside Git in `/workspace/private-gc500-v993-preview/`. Compact preview validation is saved under `tests/`; this is not a release gate or approval to upload.

## Initial preview validation

Initial preview SHA256 `a93c369b91dec0deafb2d677fbbb8a263563c93271f5e57962bd4a330d646308`: desktop (1440 × 960) and phone (390 × 844), 22 focused checks each, zero browser errors and zero operational writes. Checks cover native numeric strings/qualification labels, 19px/18px measurements, roster names/count/access controls, layout and visible lamps, Truck flow/Details/record/progress controls, Motion Off, reduced motion, offscreen lamps and unchanged shared records/P&L. Desktop and phone stills were visually inspected. These checks apply to the first preview scope and source; no full release sweep or publication was performed.

## Iteration 2 validation

Final candidate: desktop 1440 × 960 and phone 390 × 844 each passed 45 focused checks, with zero browser errors and zero attempted operational writes. Native controls, navigation handlers, disclosure state across both availability refresh paths, current staff date versus historical View date, recorded unloading methods, exact measurement strings, statuses, lamps, numeric models and shared records were checked against v9.92. Desktop and phone screenshots were visually inspected. The harness lets native pricing/source annotations initialise before comparing the rendered work board. Today controls reduce from 139 to 74 px high on desktop and from 266 to 122 px on phone; missing-staff panels reduce to 46 px. Larger phone readings use more vertical room than v9.92; they are not claimed to be shorter. This remains a design preview, not a release candidate.

## Building specification review

Andrew asked whether the buildings have heights and weights. The latest supplied Baseplan workbook, sheet `9968862-KINP`, rows 71/73/74/76 (contract lines 105/108/110/113), records 6.0 × 3.0 m footprints for P25/P67/P65/P66. It supplies no height or mass. The current loading model likewise provides only the contract-listed footprint for each of those four references; the preview is not hiding a known height or weight.

P25 has current asset number 1189408; P66/P65/P67 have no asset number in the current reference-number API. P25’s schedule description says 4.8 m while that asset’s contract footprint says 6.0 × 3.0 m. That source discrepancy remains visible; neither value was silently overwritten. The supplied restraint guide’s 5,000 kg maximum is a method scope, not an actual building mass. Exact matching unit/model specifications are still needed for height and mass.

Andrew also questioned the remaining horizontal space in the desktop preview. The tall white introductory panels are reduced, but the full-width load cards retain unused horizontal space. Further arrangement can be previewed before publication; this draft is not presented as the final approved layout.
