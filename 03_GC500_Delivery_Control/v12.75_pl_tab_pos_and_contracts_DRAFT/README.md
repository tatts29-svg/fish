# v12.75 — the P&L tab names every PO and every hire contract, and everything ties (pack v1.15) (DRAFT)

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat): "Please make sure we mentioned purchase order numbers. And hire contract numbers.
Everything must talk to each other. And all add up and match. We have the buisness that have eyes on this p&l billing and we need to
ensure everything aligns." The tab follows the pack (`../review_31Oct2026_october_month_end/`, pack v1.15).

Built on the live v12.74 (`58695330689cd54cbb1bfa48b9b4a0489ca56398d6c08913a011daf1be635bc4`, BASE pinned).

Candidate: **`0b32aebda051d1e48ef5e2319b589a2acd0afeff97418a05ff7c365606b891dc`**, 16,641,763 bytes.

```
PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.75 v12.75_pl_tab_pos_and_contracts_DRAFT/patch_v1275.py
```

## What changes on the Costs & P&L tab

No figure changes: pack v1.15 has v1.14's figures to the cent. The patch holds no figure; the pack data is pinned by SHA-256
(`31b9a283…`) and refused if it doesn't tie.

- **Every cost line** now names the hire contract it is charged on, beside its PO and invoice or receipt. Every line names a PO or says
  there is none, and so does every line under Costs by branch.
- **New fold, "Revenue by invoice":** the 18 invoices, each with its date, hire contract, branch, the V8s' PO and our POs against it;
  the November forecast line (9961976 L61); the total charged; the invoice not in the revenue (25124396) with why.
- **New fold, "By hire contract":** each of the 18 contracts with the V8s' PO, invoice and what we charged, every cost and PO against it
  and its total; then the costs not tied to one contract; then the job (tied + not tied = the job cost).
- **New fold, "Every purchase order in the costs":** the 27 POs at their amounts in the P&L, with supplier, what, status, hire contract
  and branch; then every cost with no PO on the record and why; with a PO + no PO = the job cost.
- **The open items say how Event Portables' 51 block cleans tie:** 18 tank-block and 6 WC31 cleans on 9968955 L142; 24 on the eight
  sewer-connected blocks (WC09, WC15, WC16, WC17), which is L143 as keyed (billed 0.00); 3 on the WC-TV block, on 9973977.
- **On a phone,** the words in the detail tables keep a readable width and the figures scroll sideways inside the table.
- **Footer:** v12.74 → v12.75.

Nothing is typed; nothing is written to the record.

## Checks on the candidate (live record 12729)

| Check | Result |
|---|---|
| `toolchain/check_page.py` (build) | PASS |
| `tests/test_v1275.cjs` desktop | 41/41: v12.74's checks, plus every invoice, contract, cost, PO and no-PO row against the pack's data, to the cent, and the ties (the 27 POs are exactly the cost lines' POs; POs + no PO = job cost; tied + not tied = job cost; the contracts carry the invoices; every branch line names its POs or none) |
| `tests/test_v1275.cjs` phone | 41/41 |
| `tests/print_v1275.cjs` | 16/16: 21 pages A4 landscape; every figure, every PO number, invoice, hire contract and the V8s' PO, and every section heading on the paper |
| `toolchain/harness/sweep.js` desktop | running |
| `toolchain/harness/sweep.js` phone | running |
| `toolchain/upload_page.py --dry-run` | to follow |

## State

Built and tested; the sweeps and the upload dry run are still to come. Upload on Andrew's word.
