# v7.86 — a Fence blocks line (READY TO UPLOAD)

Author: Andrew Fisher · 2 Oct 2026 · one patch on the live v7.85 (`2e73ac04…`)

## Why

Hire agreement 36566 (rear of the pit building / rear of the Puppet Theatre, 30 Sep): "Brace existing fence. Not
scrimmed." - 216 bases, 216 clamps, 108 braces and no metres. Andrew, 2 Oct 2026: "charge as per what was used", then
"continue with your logic please" on the proposal.

## What it does

- Adds **Fence blocks** to the fencing lines: counted each, at the 2026 street rate card's own line "Fence Blocks( per
  block)", **$3.02**. 36566 as used = 216 × $3.02 = **$652.32**.
- Clamps and braces have no line on the card; on every other docket they sit inside the per-metre fence rate, so they
  are not charged separately.
- Advanced's price sheet has no per-block price, so the paid side stays "not known" until their invoice - never
  estimated.
- The line appears wherever the page already lists fencing lines (the record-a-paper form, the rates table, docket,
  week and area totals). No existing docket's figure moves.

## Build

```
bash toolchain/build.sh v7.86 v7.86_fence_blocks_line_DRAFT/patch_v786.py
```

On the live v7.85 (`2e73ac04d3c8f8105db6ff801998bbd8016a0e60b70374acfe9e4dad3e09c297`): **8,838,431 bytes, SHA-256
`3e1612dd0b0227d8243448337fbce83fa2b5cdf3cbf5df21c00b54fbe8d62e06`**. check_page PASS, no keys; the attribution scrub
changes nothing. Explorer unchanged.

## Results on 3e1612dd

| Suite | Result |
|---|---|
| Fence blocks (`evidence/fence_blocks_tests.js`) | 8/8 desktop and phone - $652.32 for 216 blocks, paid side left for the invoice, form offers the line, tab draws, 63 existing dockets unchanged, no open rate question |
| Rules (v7.84 copy), print check, one destination, ways in, inventory, explorer, fencing, fresh-after-save, P&L practice | all pass, desktop and phone (rules 45/45, ways in 10/10) |
| Inventory PDF | 9/9 desktop and phone |
| Both 21-tab/7-link sweeps, navigation | pass |
| v7.79 text checks | 16/23, the same intended misses as v7.84 |

Pre-check on the earlier live v7.84 is in `evidence/precheck_on_v784/`.

## A fault caught on the way

The first build named a person in the page code (`settled_by`). The attribution scrub then ran over the whole script and
collapsed every double space, breaking the indented order lines in Full details - rules R7 failed 44/45. The patch now
says "the project manager" and the scrub is a no-op.

## After it is live

Codex enters 36566 on the Fence blocks line (216), as in `record_02Oct2026_fencing_papers_36564_36568/papers.json`.

## Who checked what

Claude built it and ran everything above. A second audit is optional under the 2 Oct arrangement.
