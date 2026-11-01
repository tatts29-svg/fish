# P&L deeper audit: search, presentation and response time

Author: Andrew Fisher

Independent Codex review, 1 November 2026. Claude retains v12.77 implementation and publication. This directory contains source-only review patches and synthetic tests. It changes no active module, private input, operational record or live page.

## Current reviewed source

- Source: `33a16c51a14809662490e0462adfc259dddcdb83` on `ccr-061f77e8-ivjhrv`.
- Data: `75d54b573767929aa09855977f334fedd85b75cf3836cefc1c296d26b52bfaf2`.
- Independently rebuilt owner candidate: `42ffac66e136cb1dc4f6cd4e716df9da646db1bf63f1076140cba9bf10b5ed99`, 16,692,115 bytes. This matches Claude's handover; it is not a live claim.
- Last separately read live v12.76: `30ab13155c21c7284cde18a4d9752fad7b07cb3d703114948162833d62d9fcc9`, 16,647,547 bytes.

PR #1 handovers reviewed: `6553329258`, `6553580953`, `6553603518`, `6553719748`. Codex check-in: `6553542579`. Private financial examples and source qualifications stay with Andrew.

## Findings addressed in the owner candidate

The original `3a15258a` search matched entire shared cost lines for a single identifier. The owner successors now obtain PO, contract and invoice figures from the dedicated structures; person results show supported journal rows without an invented supplier-invoice allocation. Free text is clearly a match of whole cost lines. Reporting categories use the revised Coates terminology and are distinguished from GL codes.

The `33a16c51` successor incorporates unsupported category/branch guards, complete-reference scope labels, customer-PO aliases, and stable keyboard drill-through. It also adds the workbook's management-month explanation. The earlier broad Codex proposal against `3dc8e6aa` is superseded and must not be applied over these changes.

Independent financial work covers integer-cent cost facts, category/branch/month partitions, branch and job totals, the reporting-month labour move, home/receiving branch journals and the labour-hire bridge. The data pin is unchanged by the latest owner changes. Actual source-rebuilt HTML and workbook prints retain their checked rows, figures and long notes. This establishes arithmetic of the included evidence, not complete payroll valuation, invoice receipt, or ledger posting. No delivered v1.17 binaries were supplied for an independent delivered-binary identity claim.

## Narrow remaining review patches

### Search focus and caret

At the reviewed source, a full same-tab Costs redraw preserves the query and focus but moves a middle caret to the end. `caret-focus-only.patch` changes only focus state and the search events in `xBind`, against exact `33a16c51`. It keeps every owner entity/branch/person lookup, category, scope label and CSS unchanged.

The patch snapshots caret/range and selection direction. It restores them only when the focused old field has been replaced on the active Costs tab, the query is unchanged, the document has focus and no deliberate click, keyboard focus move or navigation has taken precedence. It does not restore hidden Search focus or override another control.

The nine synthetic tests exercise these lifecycle cases; they use no private financial inputs. The unpatched source passes two of nine and the proposal passes all nine. Diagnostic candidate: `75585a8eda5e4c58b3320cf75e7b812476bd7a0217e907dddbb3e470817f1e63`, 16,693,690 bytes. Embedded data and every byte outside the P&L script are unchanged. Shared scrub and all 223 script/security checks pass.

### Workbook note pagination

The owner's full category-sheet basis note prints alone on a continuation page, increasing the workbook from 30 to 31 pages. Numeric and text content is intact; this is a presentation defect. The accompanying `category-print-basis.patch` preserves the full worksheet note and uses a concise repeated print header with the original table print area. The tested alternative returns to 30 pages. All existing workbook cells/formats and JSON/HTML/CSV are unchanged. Actual LibreOffice output retains every checked numeric value and long text, with a complete 11-point header and no overlap or clipping.

### Applying the patches

Only the owner should integrate these into the combined candidate after checking current source:

```sh
git apply --check 03_GC500_Delivery_Control/review_01Nov2026_pl_deeper/caret-focus-only.patch
git apply 03_GC500_Delivery_Control/review_01Nov2026_pl_deeper/caret-focus-only.patch
node 03_GC500_Delivery_Control/review_01Nov2026_pl_deeper/test_caret_focus.cjs 03_GC500_Delivery_Control/v12.77_pl_tab_explorer/plf1277_src.js
```

Check/apply the workbook patch in the same way. Neither patch requires changing the private data pin. A new combined build still needs the guarded release process and exact public read-back; the diagnostic hashes are not release declarations.

## Response time

Nine warmed finder input-to-result updates took 120.6–124.4 ms, including its intentional 120 ms debounce. Complete native Costs redraws took 9.81 and 11.24 seconds on the prior successor; identical live-v12.76 baseline probes took 11.03 and 10.08 seconds. Same audit machine, browser, frozen state and serialized browser lock.

This identifies an existing full-render bottleneck, with no measured regression caused by the finder. It is not a generalized live-user latency claim. The broader renderer needs a separately coordinated performance fix; the focus patch does not claim to accelerate it.

## Evidence boundaries and follow-up

The current private data pin is reproduced exactly. One newly added original-source declaration was absent from the previously supplied handover; the owner's audit therefore has one provenance check that cannot be independently certified here. No declaration was fabricated to force a pass. Detailed original-source, estimated-period and accounting-completeness qualifications remain in the private report.

Keep remaining supplier rate-extension explanations evidence-based. Do not invent a higher-precision rate or change a system total to make an unexplained source difference disappear. Keep uncosted payroll, selected accrual scope and Finance's posting/provision decisions explicit. Preserve the existing cards, details and financial amounts.
