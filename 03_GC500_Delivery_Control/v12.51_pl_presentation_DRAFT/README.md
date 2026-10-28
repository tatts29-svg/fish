# P&L presentation preview — not a release

Author: Andrew Fisher

**PREVIEW ONLY.** This folder prepares Andrew's review of a bounded P&L presentation clean-up. It is not READY, published, or an operational record update. The preview retains the v12.50 footer and adds a visible Preview label.

The exact input is verified v12.50, SHA-256 `7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404`. `build_preview.py` rejects any other predecessor and verifies that removing its one appended block restores every original byte. The generated page, actual screenshots and record snapshots stay private; they are not repository artifacts.

## Review scope

- Keep the existing Coates GC500 header, weather, Build cards and navigation. The addition is confined to the P&L summary.
- Show the complete native revenue and direct-cost ledger, overheads and priced wages, with full cent amounts. Current-record amounts and job forecasts remain separate.
- Show a branch column on every ledger line for both the current record and job forecast. Each row and branch total reconciles to the existing native P&L, with cents retained. Contract/reference and supplier cost branches are preserved. Event people retain the existing responsible-branch allocation. Transport, overhead and wage allocations remain explicitly labelled with their existing Finance basis; they are not certified as supplier-coded actual costs.
- Keep estimates and unpriced Coates wage hours visible as uncertainty. Missing allocation codes are labelled Unassigned; aggregate overhead and wage codes are labelled Multiple.
- Fold the existing detailed source cards, reconciliation checks and controls together, preserving their actual nodes, original handlers and saved open/closed state. Omit the requested accruals area from this presentation only. Its native model and export functions are unchanged.
- Preserve the existing Print, Email, customer pricing and other finance views. The print stylesheet prevents a duplicate preview statement in the native report.

The headline preserves the existing native revenue, cost and difference amounts. Its cost and difference are explicitly labelled before wages. The ledger exposes direct costs and overheads followed by that exact cost subtotal; priced wages and the native after-wages totals remain separately visible, together with the native branch summary. This presentation does not resolve existing source gaps or make unknown costs final.

## Build and checks

Build into a private output directory:

```sh
python3 03_GC500_Delivery_Control/v12.51_pl_presentation_DRAFT/build_preview.py /private/exact-live50.html /private/preview51.html
python3 03_GC500_Delivery_Control/toolchain/check_page.py /private/preview51.html --base /private/exact-live50.html
```

`tests/preview.cjs` uses the existing read-only candidate harness, a frozen record snapshot and one fixed clock. Set `BASE`, `CANDIDATE`, `STATE`, `OUT`, `NODE_PATH` and `CHROMIUM_PATH`, then execute under the shared browser lock:

```sh
flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v12.51_pl_presentation_DRAFT/tests/preview.cjs
```

`pl1251_branches.js` reads existing contract, reference, supplier-category and Finance allocation outputs. It does not change rates, ledger codes, business rules or records. Unknown native amounts display as Unpriced on each branch. A new unmapped category, an offsetting category gap or a mismatch with native branch totals leaves the original P&L in place. In particular, a future nonzero R&M row requires its own source mapping before this preview is used.

The test compares all native documents, customer charges, ledger/branch/finance models, Build equipment values and preserved native function bodies between the exact input and candidate, on desktop and phone. It checks displayed row amounts and totals to integer cents, source/control preservation, render and navigation re-entry, fold-state persistence, absence of unfurled native source cards ahead of the summary, phone overflow, zero browser errors and zero write attempts. Screenshots and detailed assertions are private. Each run opens a fresh exact-input baseline and candidate; the evidence binds the page and record-snapshot hashes and fixed time.

Before any later release, Andrew must review the actual preview, the agreed owner must reconcile any newer source or record changes, and the guarded release and live read-back process must be completed. This preview script is deliberately separate from the production publication toolchain.

## First-pass preview validation — 28 October 2026

The private review candidate is SHA-256 `24ba02af7099b19b65b0f4ac458a0226b1ac6db16435361663662f22d222f271`, 16,111,471 bytes. The shared checker passed all 218 inline scripts and found no added credentials. Fresh baseline and desktop/phone candidate sessions used the same current frozen record and fixed clock; all captured native financial values and documents matched exactly. Displayed rows and totals reconciled to cents, native navigation and source-fold persistence passed, and all three sessions reported zero browser errors and zero write attempts. Actual desktop and phone screenshots were visually inspected privately. This validates the review preview; it is not a live-release assertion or a measured speed improvement.

## Branch-matrix revision

The first-pass candidate above is superseded for review by the branch-matrix revision. Both periods are displayed on each branch cell: current record in bold, job forecast beneath. The phone layout stacks the same labelled amounts without horizontal clipping. The full native source cards and controls remain folded below the P&L. No new source amount, percentage split, fuel charge or branch transfer is introduced.

Independent source review compared every current revenue row and both periods of every cost row with separately derived native-route oracles, then checked all branch totals. The existing proportional transport and overhead allocations remain a qualification, not a new source fact. Exact branch arithmetic does not certify missing supplier invoices or unpriced Coates wages.

`tests/projection.cjs` also checks that the projection cannot mutate inputs, conceal a one-cent branch difference, create a ledger row from an unexpected source, or hide a missing source behind offsetting category gaps. It accepts a private JSON capture of `PL1251Branches.inputs(PL1251Preview.snapshot())` through `INPUT`; no operational fixture is committed.

### Branch-matrix candidate checks

The review candidate is SHA-256 `55926dbde250ea8d197d4bec8426e592ca093325da04585a7ad7ea7845087fdd`, 16,123,989 bytes, on the same exact v12.50 input. The shared checker passes all 218 inline scripts. Fresh baseline, desktop and phone sessions on one frozen record and clock preserve the complete captured native documents, financial models, charges, Build outputs and shared control functions. Every displayed ledger row and branch total reconciles for both periods. Unknown-amount rendering, source-fold persistence, native navigation and horizontal fit pass, with zero browser or console errors and zero write attempts. Independent source review provides 117 separate route/oracle checks.

Three bounded direct Costs-render observations in that run were 12.465–14.944 s for the native desktop baseline, 2.101–2.399 s for the desktop preview and 2.114–2.371 s for the phone preview. These are diagnostic direct function calls: the live navigation and render paths already run inside the native asset-cache scope, whereas a direct call to the baseline Costs renderer does not. The difference therefore does not establish faster user navigation, loading or production performance. The preview reuses native cache scope and computes the matrix only during the Costs render, with no new polling or network requests.

`tests/phone_rows.cjs` provides actual phone viewport captures of full ledger rows and hit-tests the current/forecast cents, with unchanged native documents and denied writes. The final candidate passed these full-row viewport checks for Hire Revenue, Installation and Transport costs, including every current/forecast amount; the actual screenshots were visually inspected. Run it with the same `PAGE`, `STATE`, `OUT`, browser variables and shared lock, plus `MOB=1`.

This remains an isolated visual-review candidate, not READY or live. A production successor still needs Andrew's review, source reconciliation and the required guarded release checks.
