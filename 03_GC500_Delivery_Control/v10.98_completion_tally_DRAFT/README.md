# Completion-only scope

Author: Andrew Fisher

DRAFT component for the combined v10.98 release. This component excludes privately specified water-barrier references from completion totals and percentages. It does not cancel a reference or change a status, quantity, charge, pin, record history or arrival requirement.

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
