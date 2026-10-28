# P&L presentation preview — not a release

Author: Andrew Fisher

**PREVIEW ONLY.** This folder prepares Andrew's review of a bounded P&L presentation clean-up. It is not READY, published, or an operational record update. The preview retains the v12.50 footer and adds a visible Preview label.

The exact input is verified v12.50, SHA-256 `7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404`. `build_preview.py` rejects any other predecessor and verifies that removing its one appended block restores every original byte. The generated page, actual screenshots and record snapshots stay private; they are not repository artifacts.

## Review scope

- Keep the existing Coates GC500 header, weather, Build cards and navigation. The addition is confined to the P&L summary.
- Show the complete native revenue and direct-cost ledger, overheads and priced wages, with full cent amounts. Current-record amounts and job forecasts remain separate.
- Show the native branch totals. Individual ledger lines are explicitly whole-job / all-branch scope; the preview does not invent a supplier or ledger-code branch split.
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

It compares all native documents, customer charges, ledger/branch/finance models, Build equipment values and preserved native function bodies between the exact input and candidate, on desktop and phone. It checks displayed row amounts and totals to integer cents, source/control preservation, render and navigation re-entry, fold-state persistence, absence of unfurled native source cards ahead of the summary, phone overflow, zero browser errors and zero write attempts. Screenshots and detailed assertions are private. Each run opens a fresh exact-input baseline and candidate; the evidence binds the page and record-snapshot hashes and fixed time.

Before any later release, Andrew must review the actual preview, the agreed owner must reconcile any newer source or record changes, and the guarded release and live read-back process must be completed. This preview script is deliberately separate from the production publication toolchain.

## Preview validation — 28 October 2026

The private review candidate is SHA-256 `24ba02af7099b19b65b0f4ac458a0226b1ac6db16435361663662f22d222f271`, 16,111,471 bytes. The shared checker passed all 218 inline scripts and found no added credentials. Fresh baseline and desktop/phone candidate sessions used the same current frozen record and fixed clock; all captured native financial values and documents matched exactly. Displayed rows and totals reconciled to cents, native navigation and source-fold persistence passed, and all three sessions reported zero browser errors and zero write attempts. Actual desktop and phone screenshots were visually inspected privately. This validates the review preview; it is not a live-release assertion or a measured speed improvement.
