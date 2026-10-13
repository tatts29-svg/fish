<!-- Author: Andrew Fisher -->

# Control contrast review — v10.12

The live source was `a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557` (`/workspace/private-argon-review-14Oct2026/live.html`). This review changes presentation only; loading/selection Save behaviour is owned by the separate modules in this release.

## Findings and correction

- Build's Loading and Unloading Clear buttons had a white background with inherited pale text, measured at **1.18:1**. The shared `.btn` rule supplied a paper background but no corresponding text colour. The loading editors had moved outside the dark `.tl841-actions` region covered by the older specific button rule. There were 23 rendered instances on the audited day.
- The existing dark loading/action/progress-dialog surfaces now declare paired paper, text, border and native-control palette tokens. The light delivery record and asset drawer keep their light palette.
- Shared native button and field defaults now pair foreground/background at low specificity. Existing primary, danger, status, staff, traffic and Save rules retain their explicit colours. Disabled values remain readable without altering disabled or read-only behaviour. Keyboard focus and selected input text have explicit contrasting pairs.
- Cancelled rows in the legacy Edit table reduced all cell contents to 62% opacity, making correction actions and hints approximately **3:1**. Removing that opacity retains the existing written **cancelled** status and all native actions.
- No source prices, quantities, dates, branches, asset records, selectors for native events or Save handlers are changed. The CSS is screen-only; existing printing rules are preserved.

`patch_control_contrast1012.py` is an isolated CSS-only test helper. Root's `patch_v1012.py` includes the same CSS in the combined release; do not apply both helpers to a release build.

## Verification

`check_control_contrast1012.cjs` checks rendered controls, field labels, input values/placeholders and table text across the 22 native routes, each finance subview, map controls, three asset drawers and the dark delivery-progress dialog. It opens collapsed controls and load details for the audit, checks Clear default/hover/keyboard-focus/disabled states, and saves phone/desktop screenshots. All test changes are DOM-only; the service harness permits GET reads and map tile-token requests only, traps native setters and blocks operational writes.

The numerical audit composites solid colours and representative gradient stops. Image backgrounds are recorded separately and require screenshot inspection. A numerical contrast scan does not prove the correctness of underlying records.

Final candidate/public results and exact hashes are added after the combined build is frozen.
