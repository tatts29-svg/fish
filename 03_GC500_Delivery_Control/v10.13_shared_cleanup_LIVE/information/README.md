# Shared information cleanup

Author: Andrew Fisher.

Scoped v10.13 presentation patch, based on exact live v10.12 `cde0aae30d5e528e85c2b16189bf0c0828397b87a7b3d10c1695362b19a58105`. Root owns integration and release.

`patch_information1013.py` exposes `apply(html)`. The patch retains the existing components, source data, operational records and financial calculations.

Changes:

- A partly received reference uses the same amber item-scope summary in chips and the drawer. Its older whole-reference controls remain available under a labelled, persistent More info fold, so a saved red button does not contradict the current received quantities.
- Explicit date-only arrival evidence displays the known date and “time not recorded”. True midnight events without that evidence keep their time. History, Today, Journal, print/email drafts, the on-site list and map progress use the shared formatter. Completion timestamps remain independent.
- Pricing checks show current calculated counts. Earlier setup questions remain in a closed More info fold labelled historical; they are no longer presented as current rules. The card-period caption reads its current source line.
- Coates Way keeps its current issue tables and unknown measures visible. Supporting company guidance is folded using the existing More info component. The provided fencing confirmation is explicitly dated.

The final labour-card wrapper already explains automatic arrived charges correctly. It is preserved. Financial inclusion remains separate from physical completion, and the outstanding Accessible Toilet at WC51 is not marked received.

Validation:

- `tests/test_information1013.cjs` reproduces the original partial red-chip and invented-midnight defects, exercises contextual display cases, parses every script and proves original DATA plus receipt, scope and charge functions are unchanged.
- `tests/test_patch1013.py` proves source/reapplication guards and checks that the historical fold contains no current interpolated counts.
- `tests/check_information1013.cjs` uses the standard write-blocking harness for phone screenshots and actual shared-record display checks. Run serially with `/tmp/gc500-browser.lock`, `CHROMIUM_PATH=/usr/bin/chromium`, `PAGE`, `EXPECTED_SHA` and a private `OUT`. `BASELINE=1` diagnoses the exact original defects. It invokes no native setters.

No emails are sent, operational records changed, external map assets altered or publication performed by this helper. The combined release still requires root’s final checks.

Isolated verification complete: source candidate `cdfb0740876e9dfc73ffbd60816e020847d6d8e0e5556a628763f32e8d2e3960`; 155 source/pure checks, four patch guards, eight baseline browser diagnoses and 15 final phone checks pass. Native versions 6061 and 6064 were read. Both browser runs had zero page errors and no attempted native writes. Phone screenshots were inspected; they remain private in `/workspace/private-information1013-browser/`. Sanitised proof is in `evidence/`. The runtime files are frozen for root integration.
