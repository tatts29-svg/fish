<!-- Author: Andrew Fisher -->

# Control contrast review — v10.12

The live source was `a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557` (`/workspace/private-argon-review-14Oct2026/live.html`). This review changes presentation only; loading/selection Save behaviour is owned by the separate modules in this release.

## Findings and correction

- Build's Loading and Unloading Clear buttons had a white background with inherited pale text, measured at **1.18:1**. The shared `.btn` rule supplied a paper background but no corresponding text colour. The loading editors had moved outside the dark `.tl841-actions` region covered by the older specific button rule. There were 23 rendered instances on the audited day.
- The existing dark loading/action/progress-dialog surfaces now declare paired paper, text, border and native-control palette tokens. The light delivery record and asset drawer keep their light palette.
- Shared native button and field defaults now pair foreground/background at low specificity. Existing primary, danger, status, staff, traffic and Save rules retain their explicit colours. Disabled values remain readable without altering disabled or read-only behaviour. Keyboard focus and selected input text have explicit contrasting pairs.
- Cancelled rows in the legacy Edit table reduced all cell contents to 62% opacity, making correction actions and hints approximately **3:1**. Removing that opacity retains the existing written **cancelled** status and all native actions.
- Coates Way’s modal Back button used white text on bright orange (about **2.87:1**). A single scoped text-colour pair retains its orange face with dark lettering. The existing ghost navigation buttons keep their own palette.
- No source prices, quantities, dates, branches, asset records, selectors for native events or Save handlers are changed. The CSS is screen-only; existing printing rules are preserved.

`patch_control_contrast1012.py` is an isolated CSS-only test helper. Root's `patch_v1012.py` includes the same CSS in the combined release; do not apply both helpers to a release build.

## Verification

`check_control_contrast1012.cjs` checks rendered controls, field labels, input values/placeholders and table text across the 22 native routes, each finance subview, map controls, three asset drawers and the dark delivery-progress dialog. It opens collapsed controls and load details for the audit, checks Clear default/hover/keyboard-focus/disabled states, and saves phone/desktop screenshots. All test changes are DOM-only; the service harness permits GET reads and map tile-token requests only, traps native setters and blocks operational writes.

The numerical audit composites solid colours and representative gradient stops. Image backgrounds are recorded separately and require screenshot inspection. A numerical contrast scan does not prove the correctness of underlying records.

The immutable combined UI preview `c5685d83f0fafb71cdf18868c6123f9b9b2a9ffc9a15db71aa0a1cb341866572` passed **50 checks across 43 expanded audits on each of phone and desktop**, both with the operating-system dark preference. Both runs had zero page errors, native writes and blocked operational requests. Build, drawer and machine-header screenshots were inspected. The preceding isolated CSS-only phone/light run passed 46 checks across 39 audits.

Clear measures **12.78:1** in its normal, hover and keyboard-focus states and **6.20:1** while disabled. The generic Save status pairs measure between **7.97:1 and 10.54:1** across the six states. CSS-only status fixtures use the actual dark Build, light drawer and dark dialog hosts; they do not simulate a successful record save. The machine check covers its native modal header, not animation loading or playback.

Final CSS SHA-256 is `7a39d43d5d5666106ef4238515966f8018f22cc13633b69194ef712e994bfc07`. Sanitised results and private evidence paths are in `control-contrast1012-source-checks.json`. Root verified this exact CSS is embedded in final candidate `cde0aae3`, alongside the final described-item quantity rule and Save restoration hooks. Those later changes do not change the audited colour pairs. Actual-public verification follows publication.
