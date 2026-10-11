# Compact Today and Build load details

Author: Andrew Fisher

Approved for publication by Andrew: **“Make live”** in the current chat. READY TO UPLOAD. Final desktop and phone focused checks pass (45 each). Both navigation sweeps pass: 22 routes, seven deep links and Back, zero browser/console errors. Phone screenshot inspected. Upload dry run passes. Not yet published.

Today uses compact controls with Date and Showcase visible, and the original Email, Print and section shortcuts under Actions. Available staff remains connected to the native daily roster. An unrecorded roster uses a dated disclosure rather than a large empty panel; confirmed zero and known staff stay distinct. The disclosure survives native roster and footer refreshes, and the actual staff date stays clear when viewing historical progress.

Build cards retain the native five progress lights and qualified measurements. Saved reference unloading methods appear beside the description; schedule fallback is labelled. Unknown methods and legacy crane exclusions do not create blank fields or inferred instructions. Native Details, photos, delivery records, navigation, motion controls and permissions remain available.

Andrew approved the reviewed preview at source `45049e36`. The production page differs only by replacing the design-preview footer with v9.93. The suggested two-column desktop arrangement is not in this release.

## Build and checks

Base v9.92 SHA256: `0460e6f2306946c0e7262600414ff65b0824b0a086e618dbce28d7c66669e890`.

Candidate SHA256: `3da4e17980eead5cbf886dbbfab54f60c18aacd48405d92822869a7ce3637205`; 14,770,433 bytes; 79 inline scripts.

```sh
bash toolchain/build.sh v9.93-final v9.93_animated_load_preview_DRAFT/patch_v993.py
```

The patch refuses the wrong base and repeated application. Native source is byte-for-byte unchanged outside the three presentation injections and version footer. Syntax, attribution and secret checks pass. Focused release checks use `tests/browser993.cjs`; actual-public verification uses `PUBLIC=1` without `PAGE`. Navigation uses the shared sweep through `v9.80_showcase_sound_LIVE/tests/navigation980.cjs`, with explicit Google map fixtures; it does not certify map imagery. All browser runs use `/tmp/gc500-browser.lock` and block operational writes.

Independent narrow source review found no production blockers. Native data, refresh paths, original control bindings and unloading updates are retained. No review of unrelated financial or operational correctness is claimed by this presentation release.

Private screenshots and detailed evidence remain outside Git under `/workspace/private-gc500-release993/`. Initial preview evidence is retained in `tests/iteration2.json`; release evidence is recorded separately and bound to the production hash. The earlier animated preview's motion checks remain applicable because release presentation sources are unchanged.

## Building specification review

The latest supplied Baseplan workbook, sheet `9968862-KINP`, rows 71/73/74/76 (contract lines105/108/110/113), records 6.0 × 3.0 m footprints for P25/P67/P65/P66. It supplies no height or mass. The current loading model likewise provides only the contract-listed footprint for those four references; the presentation is not hiding a known height or weight.

P25 has current asset1189408; P66/P65/P67 have no number in the current reference-number API. P25’s schedule says4.8m while that asset’s contract footprint says6.0 × 3.0m. Neither source was silently overwritten. The supplied restraint guide’s5,000kg maximum is a method scope, not an actual building mass. Exact matching unit/model specifications are still needed for height and mass.
