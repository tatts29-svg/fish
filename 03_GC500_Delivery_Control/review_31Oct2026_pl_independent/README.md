# Independent audit of the live P&L

Author: Andrew Fisher

31 Oct 2026. Direct approval: Andrew told Codex “U need to do the p&l audit” and “Talk to claude. I appproved thsi”. This is the read-only review requested in PR #1 comment 6532839873, applied to the current live v12.69 rather than its historical predecessor.

Audited release: `1f671b9bef777b61578a7c01db4ccce66ba64ffd`; full public page SHA256 `038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb`. Private source snapshots, amounts, models, screenshots and financial evidence are excluded from this report.

## Result

The main P&L's arithmetic reconciles to the cent on the pinned current record. **175 independent Decimal checks passed**, including row totals, main branch sums and subtraction, labour-hire hour/rate arithmetic, supplier splits and the allowance appearing once. This checks calculation and presentation consistency; it does not certify every original invoice, rate card or historical business exception. No operational write or production change was made by the audit.

## Must address before sharing with management

1. **The actual P&L Print button produces a warning-only PDF.** The read-only reproduction opened Workings and clicked `#printCosts` using the native `window.print`. A4 output contained the twin-steer warning instead of the P&L. The current guard's `armed()` returns true, but print CSS still hides content unless the root has `ts1053-armed`, which the normal path does not set. Reconcile the allowed print state and CSS; retain the current requirements for transport paperwork. Test the actual button through to the final PDF, including complete values and headings. This is not a recommendation to bypass a required safety confirmation.
2. **Supporting cost breakdowns round away cents without a rounding label.** `v12.69_pl_one_cut_LIVE/pl1267_src.js` uses `money0` in `byWords` and supplier notes. Those rounded components do not necessarily add to their two-decimal row totals. Use `money` for the financial breakdowns, or explicitly label any intentionally approximate display. No underlying rate or amount needs changing for this display correction.
3. **Management allocation and invoicing-branch allocation need an explicit reconciliation.** The main P&L applies the workforce-to-KINP management rule locally; the Finance handover and its CSV retain their contract-branch/weighted basis. Whole-job totals agree, but corresponding branch figures differ. Preserve original contract and invoice branches. Clearly name both bases and provide the bridge, or use one management-allocation projection wherever the management basis is intended. Do not change raw branch attribution merely to make two views appear identical. Confirm intended Finance output semantics before altering it.

## Should improve

- Put a short estimate/invoice-pending qualification beside headline costs, using existing evidence. Keep known, forecast and intentionally unpriced inputs distinct; never invent a final value.
- Retain the three headline figures, the So far/Job end distinction and the existing Coates presentation. Avoid a broad redesign.
- Check the density of supplier notes and branch cards at phone width. Keep financial labels and values readable before adding more prose.
- Reconciliation tests should compare cents exactly and distinguish branch basis; passing only whole-job checks cannot detect different allocations.

## Business calls

Keep labour hire in Difference so far exactly once; keep So far prominent with Job end below; keep Transport visible as its own row. Existing grouping and source branch attribution remain intact.

## Handover

Codex completed the independent read-only audit. Findings are handed to Claude as the P&L implementation owner; no correction is claimed implemented or live. The separate v12.70 original-photo card preview remains Codex-owned and has its own pre-publication visual review. Private evidence is retained for authorised review; no financial originals or detailed records are published here.

## Joint follow-up

Andrew subsequently instructed, “I want you both working kn p&l”. Claude retains the v12.71 implementation claim; Codex provides the [independent verification pack](tests/README.md) to check exact arithmetic, preserve existing financial projections and branch attribution, exercise desktop/phone presentation, and follow the actual Print button into the PDF. The expanded baseline checks detect the existing presentation defects; they are not a claim that the correction is ready or live.
