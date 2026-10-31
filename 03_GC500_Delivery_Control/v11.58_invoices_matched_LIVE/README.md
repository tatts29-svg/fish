# v11.58 — invoices are matched to dockets as the dockets come in — LIVE

Author: Andrew Fisher. Built on live v11.57 `10d3e9484e7b650b65555dab7b5a0c2db40582897add645f56a84038fe2ff213` (Codex's Showcase
repair). **LIVE 23 Oct 2026 15:35 AEST**, page `50ae2d0ff89b57cf83ed3f896adecb2d6b66d4f3760a3e78d232201d6e9786a7`, 21,570,676
bytes, the view link byte for byte.

## Andrew's words, 23 Oct 2026

> "We match invoices up with dockets as we get dockets. So any not matched means we dont have a invoice for it yet"

## What changed (Fencing tab, Purchase orders card; one sentence on the Costs tab)

1. **Each order says its invoice state, not the week's revenue.** The "Dockets that week" cell used to put the week's revenue
   at the 2026 card against a supplier order — our side against theirs. It now reads the docket count and one of:
   **invoice matched to the cent · $50,154** (an order whose supplier sheet is on the record and adds to the order to the cent:
   4647520, 4647519, 4647515, 4647517), or **invoice not matched yet · 34 dockets so far · about $25,380 at the supplier's
   sheet rates** (the dockets of that week and what they come to at the supplier's rates — the figure the invoice is matched
   against when it arrives; 4647509 week 5, 4647508 week 6), or **invoice not matched yet · no dockets yet** (the event week
   and demob orders). An order whose recorded sheet differs from its value would read "invoice recorded · $… · ±$… against the
   order"; none does today.
2. **The card header counts them**: "6 of 9 pairings confirmed · 4 with a receipt ID · 4 invoices matched to the cent · 5 not
   matched yet". The column reads "Dockets that week · invoice".
3. **The card's note carries the rule**: invoices are matched to dockets as the dockets come in; not matched means the invoice
   is not here yet, nothing more.
4. **The Costs tab's Rehire line** adds, after "Advanced's gear on the dockets at their own sheet $…": "(4 orders invoiced and
   matched to the cent, $171,368; the other dockets await their invoice, counted at the sheet rates)". No figure changes.
5. Footer → v11.58. `invoices1158.js` holds the two helpers (`invoiceState1158`, `invoiceCounts1158`); the card edits are in
   `poCard`'s own template. Weeks are compared by key (the number for construction weeks, E for the event week, D+number for
   demob), because the page names a week three ways. No record change; nothing is written.

## Checks

- `tests/test_v1158.cjs` — 11/11 on the build, desktop and phone; **11/11 live, desktop and phone** (`evidence/live/`): footer;
  the header's counts; weeks 1–4 "matched to the cent" with the sheet total; week 5 "not matched yet" with its 34 dockets and
  the estimate recomputed independently from the dockets and labour notes; week 6 with 6 dockets; the event week "no dockets
  yet"; no revenue figure against an order and the column head; the note's words; the Rehire line's clause; record unchanged;
  no errors; no writes. Screenshot `po_card_*.png`.
- Regressions on the dry page: `v11.52/tests/test_v1152.cjs` 15/16 and `v11.56/tests/test_v1156.cjs` 13/14 — the one miss in
  each is their footer check.
- Sweeps desktop and phone: 27 tabs, 19 shown, 0 errors, 0 console, 0 blocked.
- The first build (on v11.56) was refused at upload time because Codex's v11.57 had gone live; rebuilt on v11.57 (the patch
  reads the footer version from its base), retested, then uploaded.

```
bash toolchain/build.sh v11.58 v11.58_invoices_matched_LIVE/patch_v1158.py
python3 toolchain/upload_page.py build/GC500_v11.58/GC500_Delivery_Control_hosted.html
```
