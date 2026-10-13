# v10.07 rendered contrast audit

Author: Andrew Fisher

Final candidate: `b5d99de88886d9f03aad7af2177b68b1239919542f6c27e2d80be7ec9a89bdfb`.

The scoped rendered contrast checks pass, with zero browser errors and zero attempted operational writes. Evidence is in [contrast-matrix1007.json](evidence/contrast-matrix1007.json).

- All 22 routes, expanded details, seven finance views and three asset drawers were checked at 1138 × 1280 in both OS colour schemes.
- Today, Build, Demob, Equipment, Sub-hired and Costs were additionally checked at 390 × 844 and 1440 × 1000 in both schemes. Finance views and drawers were also expanded at these sizes.
- The safe local edit-capability harness checked field focus, Build Rules, Make it Load 1, Navigate and Delete controls without saving or clicking destructive actions. Read-only and disabled text were checked separately in the tablet cases.
- The embedded map's field style appears exactly once on initial load and reload; searching WC69 still works.
- Global header/navigation/footer checks cover all six viewport/scheme combinations on the final candidate. The search placeholder's measured minimum contrast against actual background pixels is 8.59:1; the overlaid phone Close button is excluded from background sampling.

Three earlier matrix cases were retained at hash `826ce44a…` and three at `e2c02b78…`. Exact byte comparison proves the final changes only add paired danger-button colours and the scoped header search placeholder rule. All scripts, records and markup are identical. Affected Delete states were rechecked on three drawers at phone dark and desktop light/dark; the final header was rechecked at all six combinations. The evidence records each tested hash rather than claiming every full matrix ran on final bytes. Navigation evidence uses the same explicit equivalence proof.

Text/control thresholds are 4.5:1 normally and 3:1 for large text. Alpha and inherited backgrounds are composited; layered gradients use representative stop colours supported by screenshot review. Image/canvas surfaces are not assigned an automatic numeric pass. Private screenshots were reviewed for the Build Rules table, action buttons, finance handover, asset drawers and header. This is targeted rendered coverage, not a claim that every possible record, animation frame or future state has been tested.

A separate existing phone layout defect remains assigned to v10.08: the 640px Build Rules table exceeds its 340px details container and is clipped by `main {overflow-x:hidden}`. Scrolling the table into view can shift `main.scrollLeft` by 27px. The document itself remains 390px wide. Finance handover already has a correctly contained horizontal scroll area. No layout change was made in this contrast release.

Raw reports and screenshots remain private under `/workspace/private-gc500-contrast1007`; compact committed evidence contains no copied operational records.
