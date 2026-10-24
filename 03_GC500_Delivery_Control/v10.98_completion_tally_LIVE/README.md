# Completion-only scope

Author: Andrew Fisher

LIVE component of the combined v10.98 release. This component excludes privately specified water-barrier references from completion totals and percentages. It does not cancel a reference or change a status, quantity, charge, pin, record history or arrival requirement.

The Today water-barrier reading, its equipment-type completion instruments, milestones and Showcase share the same scope. References remain available in the register, maps and actual-status filters. The scheduled and on-site totals retain every applicable reference. Completion detail names its exclusions; the arrival comparison retains the full source scope and order. The seven-category Build index already excludes water barriers and is unchanged.

`GC500_COMPLETION_SCOPE_JSON` names a private JSON file with `schema: 1` and an `excluded_references` list. The build rejects duplicate or unknown ids and references outside the supported water-barrier product. The source folder contains no operational reference list. Inputs and built HTML stay outside Git.

Apply `patch_completion1098.py` after the servicing-data component. It adds no footer version change and uses the shared exact-once replacement helper. Root publication ownership, final composed checks and the guarded release process remain required.

Validation commands:

```sh
BASE_PAGE=/private/base.html PAGE=/private/empty-scope-test.html python3 test_patch1098.py
BASE_PAGE=/private/base.html PAGE=/private/empty-scope-test.html node test_model1098.js
GC500_COMPLETION_SCOPE_JSON=/private/scope.json python3 patch_completion1098.py /private/candidate.html
python3 ../toolchain/check_page.py /private/candidate.html --base /private/base.html
GC500_COMPLETION_SCOPE_JSON=/private/scope.json PAGE=/private/candidate.html node test_browser1098.js
MOB=1 GC500_COMPLETION_SCOPE_JSON=/private/scope.json PAGE=/private/candidate.html SCREENSHOT=/private/phone.png node test_browser1098.js
```

The model suite executes the page's native calculation functions with synthetic references: empty-scope parity, both completed and incomplete exclusions, unchanged financial and site facts, historical scope, excluded unknown quantities, no-scope percentages, exact completion and visible exclusion notes. The browser suite uses the public view link, blocks writes, compares full and excluded scope against one hydrated record, and checks native arrival/schedule/financial preservation plus Showcase propagation. No test writes an operational record.

## Verified release

LIVE as part of v10.98, published 21 Oct 2026 at 10:34 AEST (`2026-10-21T00:34:17.108Z`). Release source `954087a8668b904d34e122a5c7532b4e0d945e34`; hosted SHA-256 `6a1d77fe216ab6a1088a89e75ebd4602bb24e084342881a5aa963448adc34e64` (18,637,777 bytes). Guarded publication and independent public read-back match exactly. The final composed page passed all 149 inline-script checks, desktop and phone sweeps (25 routes, seven links and Back), focused tests and independent component review. Claude review is not claimed.

The hosted page, authorised native record actions and existing servicing tracker are verified live. The tracker was updated once through native Manage with the same key; independent read-only recovery confirms the exact served crew card and tracker data match, all prior signatures and completions are preserved, and the full job record/version is unchanged by the tracker update. The refreshed private PDF is still pending; physical paper scans remain unverified. The separate v10.96 map draft remains paused with its owner. v10.99 remains NOT READY TO UPLOAD pending its own final checks.
