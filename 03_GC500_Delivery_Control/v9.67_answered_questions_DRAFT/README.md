# Answered Questions reconciliation — v9.67

Author: Andrew Fisher

Andrew asked us to close questions already answered by his decisions or the supplied documents. This is a source-only Questions projection after v9.66; it does not alter records, prices, actuals or forecasts.

The projection uses current typed fleet identities, quantity-only records and traced VMS moves; marks the supplied drawing set, current build/charge basis, approved lighting scope, current fencing removal programme and pick-up monitoring as answered; and replaces the blanket customer-install-rate reconfirmation with only specific missing quantities/rates. Measured but unclassified CCB keeps its measured metres. Original records and question text remain in the source/history. Changed or unavailable evidence leaves the relevant question open.

The current source basis is Schedule 7, master D001-26003-03, issued drawings and recorded changes for equipment and positions; contracts, supported card estimates and the confirmed supplier-cost floor for Revenue. It does not declare one BOQ approved. Pricing differences and the specific VMS source disagreement remain visible.

Source explanations and introductory guidance sit in closed More info disclosures. Existing titles, numeric rows, needed actions, notes and source buttons remain; the native Questions fold state survives redraw and navigation.

The review keeps real unresolved facts: P36's two building identities have no supported retirement; office/lunchroom source rows still need matching and date reconciliation; missing agreed contract rates, actual supplier/carrier costs and labour costs are not manufactured from customer rates. The original 9 October Baseplan workbook explicitly calls its 13 November field **Booked Pickup Date**, separately from Expected Term Date, so the 12 November unpaired demob rows cannot be silently explained away as a hire-window difference.

## Evidence and checks

- Original fencing programme SHA-256 `836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db`: three active 2026 demob weeks, with held historical rows retained.
- Original card SHA-256 `60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6`: Pee Panel installation row 22; original printed heading retained.
- Current Schedule 7 SHA-256 `485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac`.
- Original current Baseplan SHA-256 `eb4a224fadbe1350d031adf8a1b12760d3dd748a2f0643119ea103d1df9b5b21`: contract 9968929, sheet rows 2–3, Booked Pickup Date is 13 November for both units. Private originals and native captures stay outside Git.
- `node test_questions967.cjs`: 37 passing checks for identity scope, source guards, reopened questions, unknown measures/rates, monitoring semantics and record preservation.
- `node test_questions967_dom.cjs`: 11 local-only DOM checks for closed source folds, visible actions/numbers, idempotency and retained note/navigation handlers.
- `python test_patch_v967.py`: 10 passing strict patch checks, including embedded print HTML and duplicate/wrong predecessor refusal.
- Final native comparison on composed v9.69 SHA `a271015a9cf6d099b1665d3bcef71bb6fe5b2671d7081739c91b0f04d52205b5`, record 5167: 39 Questions/presentation checks; 15 financial models exactly unchanged from live v9.64; 153 financial invariants, 17 native ties and 23 preservation checks pass. Questions shows 13 open, five pending and 40 answered/history. Full native record preserved; zero browser errors or operational writes. External map-session requests are locally fulfilled in the financial harness, without external POST; final navigation review covers the actual map graphics. Sanitised counts are in `evidence/final969-native-checks.json`.

Source and focused/native checks complete; frozen for the root's combined release. Not independently published. Root owns final navigation/phone sweeps and publication.

## Combined release acceptance

Author: Andrew Fisher

READY TO UPLOAD — combined v9.65–v9.69, 9 Oct 2026. Final SHA-256 `a271015a9cf6d099b1665d3bcef71bb6fe5b2671d7081739c91b0f04d52205b5`, 12,815,042 bytes; exact live v9.64 base `82d23168b4df656016bc8be2e7da74e58ac09a585eaebca3418f87bc4656291f`. All five sources frozen and independently reviewed. Desktop and phone each pass 22 routes, seven deep links and Back with zero errors; final phone journey passes 20 checks and screenshots are inspected. Known sizes/weights stay visible; supporting detail uses closed More info disclosures. Item photos/notes and mixed supplier labels preserve item scope. 34 source rows resolve to 29 existing links and five additional tasks; 14 genuine destination/association facts remain explicitly identified. Seven stale Questions prompts closed; 13 open, five pending, 40 answered/history. Native record 5167 unchanged; Today 254 planned/138 received/138 installed/116 without recorded installation. Financial 153 invariants, 17 native ties and 23 preservation checks pass; all 15 models unchanged. The strict phone fixture intentionally blocked one external Google tile-session POST; both standard sweeps passed actual map loading. No operational writes. The release owner owns guarded upload and fresh actual-public proof. Superseded 7ad8abcb candidate was not published.
