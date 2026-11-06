# Readable controls and arrived-charge coverage

Author: Andrew Fisher · 13 Oct 2026

Status: VERIFIED LIVE — 13 Oct 2026, 21:34 AEST. Public view serves the exact final build.

Andrew supplied screenshots 21639/21637 showing pale text on white tables and buttons inside dark Build panels. He asked to fix this everywhere and audit whether all applicable charges have been included.

## Changes

- Pair foreground and background colours across existing light panels and dark race cards, including OS dark mode, expanded tables, form values/placeholders, links, buttons and disabled controls. Layout, animation and operational behaviour remain intact. The separate map search field gets its colour correction through the existing same-origin frame load event.
- Classify the existing six installed WC09 pee panels’ $4,033.01 customer hire as actual KINP Rehire Revenue (1010). Remaining forecast falls by the same amount; whole-job Revenue and supplier Direct costs are unchanged. Costs, P&L, branch totals and October Finance use the same allocation. Partial receipts split the existing total; later contract coverage suppresses the fallback.
- Show unpriced work scope for WC100 trailer toilets, T0258 container and WB01–WB03 barriers. Missing service mappings are not represented as free work. Explicit included/zero prices and Coates own-use equipment remain excluded from these warnings.

No operational records, card rates, supplier costs, physical completion or manual stairs selections are changed. No BOQ prices or damage waiver were added.

## Audit scope and limits

The fresh read-only audit covers 185 reference/item groups, including 117 with received quantities. Applicable priced install, levelling, cleaning and demob charges are included automatically for received quantities; every arrived group has a branch. Charge inclusion is separate from whether future cleaning, demob or pickup has physically happened.

Completeness remains partial: 32 transport legs across 17 arrived references need a rate or existing-contract allocation; ten hire quantity/type/linkage holds and five work-scope holds remain explicit. Several hire holds are already charged under another reference, so adding another charge would duplicate Revenue. Payroll Direct costs separately have missing hours/rates. The private two-tab workbook identifies the existing charges and concrete corrections. See evidence/coverage-review.md for the verified final counts and distinctions.

## Source and validation

Base public v10.06 SHA256: `fc7995c79cd5df18c47de4f2c05f1499382ba0313ae8b27dd23d783606a59068`.

Final candidate: `b5d99de88886d9f03aad7af2177b68b1239919542f6c27e2d80be7ec9a89bdfb`, 15,046,568 bytes, 95 inline scripts. Exact rebuild, wrong-base/repeat guards and unchanged embedded DATA pass. Original source-rate review passed 107 comparisons. Both navigation sweeps pass, with the final CSS-only delta explicitly proved. Six responsive light/dark pane cases plus six final header cases cover 26,583 text/control groups; the affected Delete states and header placeholder were rechecked after their corrections. The finance adapter tests, 124 independent finance/coverage/reconciliation checks and original 107 source-rate comparisons pass. Upload dry run and phone visual review pass. Actual-public charge coverage and reconciliation passed all 17 controls at 21:35 AEST against record 5796; zero browser errors, record mutations or attempted writes. See CONTRAST_AUDIT.md for exact tested hashes and coverage limits. The existing narrow-screen Rules-table containment defect is assigned to the next release.

Root owns integration, review and publication. Separate scoped implementation, rendered-contrast and financial reviews were used; no claim of an external agent review. Private snapshots and screenshots stay outside Git.
