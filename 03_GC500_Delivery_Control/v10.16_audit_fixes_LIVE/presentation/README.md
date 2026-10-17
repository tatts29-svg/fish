# Narrow-phone record timestamp

Author: Andrew Fisher

At 360 px, the shared-record timestamp extended beyond the record pod and its last digits were clipped. The status container now respects the available width and wraps at spaces. The existing pod, clock, live indicators, font sizes and desktop presentation are retained.

`patch_presentation1016.apply(html)` installs one CSS block and refuses repeated application or missing current record-pod dependencies. `check_presentation1016.cjs` checks full timestamp visibility, separation from the live label, unchanged pod height and no document overflow at 360, 390, 768 and 1440 px. All service traffic is GET-only; test status strings change the rendered DOM only.

Root owns the combined release and publication. Private evidence remains under `/workspace/private-gc500-audit14Oct2026/presentation/fix/`.

Validation: 19 browser checks pass on the final scoped candidate, with no operational requests or browser errors. Original and patched pod heights match at all four widths. A fresh 360 px screenshot confirms the original Record label, three green lamps and LIVE word remain visible above the full two-line last-confirmed time. Repeated application, missing dependency and exact CSS-only delta checks pass.
