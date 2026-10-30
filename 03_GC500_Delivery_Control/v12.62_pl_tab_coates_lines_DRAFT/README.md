# v12.62 — the P&L tab cleaned up: Coates P&L lines, whole job and by branch, figures first

Author: Andrew Fisher. 30 Oct 2026. **READY TO UPLOAD** on Andrew's word. Built on the live v12.61 (`ddd1bd7a…`, 16,143,727 bytes);
candidate `32f6950bc133c72f31ed809724fba7af1e8d43d9fac6ab3ce297b5842655b0d7`, 16,166,756 bytes. `patch_v1262.py` refuses any other base.

Andrew, 30 Oct 2026 (this chat), 06:05 AEST: "We need to clean up the p&L tab layout. Needs improving. Think terminology with
coates p&l layout and what belongs in and against each branch. And then also as a whole.."; 12:0x AEST: "I want the p&l tab
cleaned up for the 1000th time". The proposal is `review_29Oct2026_pl_cleanup/LAYOUT_v1260.md`; this is that layout built.

## What the Costs & P&L tab shows now (the "P&L summary" view)

1. **P&L · whole job · Coates P&L lines.** Four figures at the top (Revenue, Cost of sales, Gross margin, Contribution, each to
   job end with the on-the-record figure under it), then one table, On the record and Job end:
   - Revenue: 1005 Hire Revenue · 1010 Rehire Revenue · 1030 · 1031 Transport Revenue · 1032 Toilet Pump-outs · 1047 Installation
     (cleaning inside, as Baseplan bills it — the 29 Oct correction) · 1020 Consumables · the event labour scope's accommodation
     and travel (no code; ledger line for Finance to confirm) · contract services, miscellaneous.
   - Cost of sales: 2126 Rehire cost · 3325 Toilet Pump-out cost · 2120 · 2140 Transport cost, carriers · 2142 Installation,
     external contractors · 2144 Consumables cost. Gross margin with its percentage.
   - Operating costs: Labour hire (Job Connect's people, priced by the run rules) · Salary allowance (job end) · Travel and
     accommodation · Meals and expenses · Coates wages in hours only (no hourly rate — the 23 Oct ruling). Contribution with its
     percentage: the Forecast P&L's difference to job end, after the labour priced.
   - A tick line: revenue and cost of sales tie to the Forecast P&L to the cent; contribution is the P&L's difference to job end.
2. **By branch · job end.** KINP, STPS, NVAC, MEAD and the job: revenue on the record and to job end; the cost streams (Fencing:
   Advanced's orders, gear and crew · Event Portables: toilet hire, servicing, water · sub-hired plant · transport, carriers ·
   labour hire and allowance · travel, accommodation and meals); costs to job end; contribution to job end. The people's event
   labour revenue ($30,520.54 today) and their travel, accommodation and meals sit on KINP — the project manager's ruling of
   29 Oct 2026 ("me an my guys should be kinp"); gear and moves sit on the branch of the gear. A tick says the branches foot to
   the job on every row.
3. **Not in it yet · named, never added**: the Costs to job end card's own gaps, one line each with who can price it.
4. **Fencing, everything included** — the card that sat at the top of the tab, now a closed fold under the P&L, its charge and
   what we pay on the fold's line.
5. **Workings** — one closed fold holding every other card exactly as it was: the hub heading, At a glance, Everything
   reconciles, the whole-job labour card, Charged to the V8s, the Forecast P&L in the business's lines, Costs to job end, the
   event staffing card, Rehire by Revenue branch, month-end for Finance (accruals, journals, controls), the working folds, the
   buildings-lock ticks and Site vs Baseplan. Moved, not removed; every button still bound (the test counts them).

Presentation only: every figure is the page's own model's (`pl770Model`, `moneySummary`, `fh866Model`, `cj764Model`), read after
each render; nothing is recomputed from a different basis, and the face says whether it ties. The other finance views (Customer
rates & charges, Fencing costs & dockets, Workforce costs, Finance handover, Transport, Generators) are untouched.

## How it is built

`pl1262_src.js` wraps `renderCosts` (the last wrapper, so it runs after the fencing card's, the lock's and the align card's)
and, when the P&L summary view is on the pane, builds the face from the models and moves every other card into the two folds;
a MutationObserver on the pane moves any card another script inserts later into its fold, never above the P&L. The folds use the
page's own `plfold765` style and `data-sfold` key, so the page remembers one opened for the visit. `pl1262.css` styles the face
(phone: two tiles a row, the by-branch table scrolls sideways inside its own box). The style and script go in before the closing
`</body>`; footer v12.61 → v12.62.

## Checks (candidate `32f6950b…`, 16,166,756 bytes)

- `tests/test_v1262.cjs`, on the live record, writing nothing: **21/21 desktop and 21/21 phone** (`evidence/test_*.txt`): the face in
  order (P&L, Not in it yet, the folds, Workings last), the folds closed; revenue, cost of sales and gross margin equal
  `pl770Model` to the cent; contribution to job end equals the P&L's difference to job end; operating costs to job end equal the
  wages priced plus travel, accommodation and meals; the branch columns are KINP, STPS, NVAC, MEAD, Job; branch revenue, costs and
  contribution foot to the job and the four branches add to the job column; every old card still on the page inside the folds
  (pl770, recon888, charge1224, lock1049, align1055, the finance folds, the fencing card) with its buttons; "Not in it yet" lists
  the model's gaps; no sentence on the face; no sideways page scroll on the phone; 0 page errors, 0 console errors, 0 writes.
- Both sweeps: 27 tabs and the deep links, 0 errors, 0 console messages, 0 writes, desktop and phone (`evidence/sweep_*.json`).
- `check_page`: PASS (every script parses; no key; author credit present).
- Screenshots: `evidence/pl_desktop.png`, `evidence/pl_phone.png`.

## To upload (on Andrew's word)

```
cd 03_GC500_Delivery_Control
bash toolchain/build.sh v12.62 v12.62_pl_tab_coates_lines_DRAFT/patch_v1262.py
python3 toolchain/upload_page.py build/GC500_v12.62/GC500_Delivery_Control_hosted.html
```
