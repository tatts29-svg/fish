# Source-linked equipment counts

Author: Andrew Fisher

Status: source frozen. Component tests, native replay and independent review passed. Ready for the combined standard build and its final release checks; not published independently. This folder does not publish a page or write a native record.

FL01 and T0003 describe the same scheduled 5 t forklift at Phillip Park. FL02 and T0004 describe the same scheduled 2.5 t forklift (asset 1197839). The added references explicitly name their original schedule rows; each source row has the same item, single-machine quantity, location and scheduled date. Inventory and Today type details previously counted the added references again.

The shared physical-count projection now counts each proven pair once under its original schedule row. Equipment and Inventory use that projection; Today type groups use the same matching rules. The native aliases and their full histories remain available through links in Equipment's existing reference disclosure. Source coverage includes both references, with the relationship recorded separately. Contracts, financial comparisons, rates and native records are unchanged. The main Forklifts & access reading remains 6 of 6; the duplicate two-machine Other reading is removed.

Matching is deliberately limited to one added reference pointing to one active scheduled plant row for one machine. A changed item, quantity, scheduled start, location, movement, source row, or conflicting recorded identity retains both references and shows a reconciliation issue. Duplicate keys, competing aliases, source chains and missing evidence also retain both. A similar name or a repeated number on its own never removes a count. The canonical source supplies arrival, completion and ownership; an alias does not overwrite these.

Today's Equipment instrument now explicitly names Forklifts & access. The top gauge is labelled Tracked category progress, with its equal weighting across seven categories explained. Furniture, water-filled barriers, track mat and other equipment retain separate type details and are identified as outside that index. An existing animation timing fault could briefly show a negative percentage when the first frame timestamp preceded the render start; elapsed progress is now clamped to zero without changing the final reading or animation design.

Validation:

- `test_counts963.cjs`: 36 native-source and conflict-guard checks; inputs stay unchanged.
- `test_patch963.py`: correct predecessor, atomic rejection of repeated/wrong/incomplete inputs, unchanged source of eight financial/source functions, and bounded animation at early/end/zero frames.
- `test_native963.cjs`: frozen native state, actual unit and supplier identity readers, exact two aliases, Inventory quantities reduced by two, 6/6 main reading, complete source coverage, unchanged native record and financial comparisons, linked histories and phone screenshots. Every non-GET request is blocked.
- Native replay passed with record 5155: exactly FL01 → T0003 and FL02 → T0004, ordered and on-site Inventory totals each reduced by two, main Forklifts & access 6/6, all source references accounted for, unchanged Equipment financial comparisons and native record, zero page errors. Changed index and linked reference disclosure inspected at 390 px with no horizontal overflow. The visible index was non-negative and matched its model.
- Independent review replayed all 36 helper checks and 13 patch/source checks; no blocking findings.
- Root runs the combined standard build, native/sync checks, navigation sweeps, final financial comparison and publication checks.

Patch predecessor: v9.62, with `function toiletItem962(`. New marker: `function physicalCountAssets963(`. Apply `patch_v963.py` once to the predecessor file. The patch writes only after every exact anchor passes.

Frozen source hashes: `counts963.js` is `a58b2443fd4272c7cd9142f1dfdc951b9bf975a135d9f9264cb939e22c441f7a`; `patch_v963.py` is `52d37d3a8c27669eb7282e2827c6ac1af3330d5945e89bab58ecfb529836c2e8`. The component candidate was `d464385d2975d0c1a2c631d042efec36ff610965dd4568882f4bfd81e6abfece`; the final standard build must record its own hash after every predecessor is frozen.

## Combined release verification

READY TO UPLOAD as part of v9.58–v9.63, 9 October 2026. Final standard-build SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes; exact live v9.57 base `1f04615f0c941e1c6c2b45e0656fc92e2bd816998a7b5f2d428f1e1b0e4a6cb0`. All 48 scripts parse. Final source checks (214 programme, 50 fencing and 65 toilet), 153 financial checks and 17 native ties pass. Both desktop and phone sweeps pass 22 routes, seven deep links and Back. All 21 incoming-record scenarios across seven tabs pass, with native record 5155 and actual charges/costs unchanged. Final phone layouts were inspected. Sixteen signed papers link to 17 original photographs. Detailed sanitised combined evidence is in the v9.63 release folder.

The final update replay exposed an intermediate WC09 partial-receipt regression. It was corrected and independently reviewed before rebuilding and repeating final checks; the superseded candidate was never published. Missing receipts and conflicting source scopes remain explicit.
