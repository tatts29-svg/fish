# v12.79: the Costs & P&L tab made clean for Finance, on pack v1.19, with the elite Find in the P&L

Author: Andrew Fisher.

**LIVE 2 Nov 2026, 02:03 AEST** on Andrew's word "Upload". The view link serves the build byte for byte (`cmp` identical). Built on the live v12.78
`7bf7904784fa7e150bc92c252e987d07cb7cdc96e79e22824d8dbcf3f2b69de0` by `toolchain/build.sh` from commit `c7b5526c`:
`build/GC500_v12.79/GC500_Delivery_Control_hosted.html`, **`73df88aeb79bd4c3dccdeafd01a9d23f72aa3d7d87257220919b0464cb6be95f`**,
16,946,654 bytes, on pack v1.19 `fd38abeacaacf8983901a222427bdba01e5c96a8d153851a76e31c7889f482cc` (audit_pack.py 573/573).

Andrew, 1 Nov 2026: "Please make sure the costs/p&l tab is very clean and organised. I have the finacial team is looking at it
tommorrow"; "We want the search feature in here to be elite. Search anything. And bring up data and costs."

## What changes

### Pack v1.19 (`../review_31Oct2026_october_month_end/`, audit 573/573)

- Forklift rehire under Rehire; the rehire categories are **Rehire – fencing**, **Rehire – toilets and water** and
  **Rehire – VMS, container and forklifts**, each saying what is in it, with a **Rehire, all** subtotal.
- Costs by GL account (2126 Rehire, 2142 Installation, 3325 Toilet pump-outs, and the rest as coded).
- The transport estimate of 1 Nov: trucks that ran by 31 Oct with no figure (October, a manual accrual candidate) and pick-ups
  still to come for Coates gear on site (November); the four October pick-ups of gear still on site moved to November.
  Revenue and the accruals are unchanged; costs and the difference move by exactly the estimate (the patch checks it).
- The tab's data (`GC500_PL_final.json`, private):
  - Job Connect's supplier code and registered name only on its accrual journal, where Finance posts;
  - the tab's own fold names in place of the pack's section numbers;
  - each cost line's **state**, one of eight (Invoiced; Accrued at 31 Oct; Not accrued: manual accrual candidate;
    November labour, carried in October (not accrued); PO raised, not invoiced; On the tracker: how paid to check; Allocated (payroll); November forecast);
  - **monthEnd**: October by state, adding to October to the cent, with November's labour in it;
  - the open items in four groups. No figure moves (the builder checks every number against the pack before writing).

### The tab (`plf1279_src.js`, `plf1279.css`)

- Face, top to bottom: the tiles; Find in the P&L; By branch (names in full); **Costs by category and month** (prints);
  Costs by supplier; the transport estimate named, with a link to its fold; **October costs at 31 Oct, where each stands**; the note.
- Folds, month-end first: Journals prepared for Finance; Open items (four groups); Every cost line (Job end column, the state
  first in Status); Transport estimate; Costs by GL account; Costs by branch; Revenue by invoice; By hire contract; Every
  purchase order; Labour charged to the V8s and every labour line; Labour journals; Transport checked against Schedule 17.
- Total rows tinted across; the job's totals stronger than subtotals; one name for every cost grand row, **Total costs**.
- Print: white paper, 10 mm margins, a footer on every page (what it is, and Page n of N), readable PO, invoice and
  hire contract lines, headings kept with their tables, and a line saying what the paper leaves out. Ctrl+P on the tab gives
  the same paper as **Print full P&L**.
- On a phone each table's first column stays in view while the figures scroll.

### The working figures (outside the block, words only: `WORKING` in `patch_v1279.py`)

The live model, its ledger lines, fencing and the workings move into one closed fold, **Working figures from the live
record**, below the P&L. Every card and figure in them is kept. Their words no longer read as a second P&L:

- "Finance's lines … gross margin" becomes "The live model on the ledger codes (working figures)";
- "margin" on the fencing card becomes "difference";
- the month-end accruals block says it is superseded by the journals in the P&L and must not be posted from;
- the handover view becomes "PO receipts and handover (working figures)", with a banner pointing to the P&L, and its Copy and CSV
  open with the superseded line;
- the month-end accruals block's Copy for Finance and Export review CSV open with the superseded line and read as what the record
  showed before invoicing, not as an accrual to post;
- the Transport view says its figures are the live model's and points to the P&L's Transport, the transport estimate and Schedule 17;
- dated facts replace attributions ("as set on 29 Oct 2026").

209 of these pairs are in `working_v1279.json` (each anchor exactly once outside the block; the patch checks the facts they state
against the pack). The Costs & P&L sub-views keep the View only notice, the Back to P&L summary button and the customer line; the
stray cards stay in the working figures on the summary, and the onsite charges card shows in Customer rates & charges only.

### Find in the P&L (`plf1279_find.js`, `plf1279_find.css`)

One box that answers a finance question in plain words, from the P&L's own data, to the cent. Every result gives an answer line,
the three cards (revenue, costs, difference, or a dash with the reason), the item's own tables, then grouped results (purchase orders,
costs with no PO, accrual journals and branch moves, invoices and the forecast, hire contracts, labour, transport legs and Schedule 17,
open items, branch lines) with counts, totals only where the rows add, highlights, a link that opens the right fold at the row,
**Export CSV** and **Copy**.

- **Look-ups:** PO, hire contract, invoice, V8s PO, person, supplier (with aliases), receipt and supplier invoice numbers (to their PO),
  quote, docket, asset reference, GL code (and the 201.BRCH.CODE.0 form), week (w/e 18 Oct), date, amount, range (over / under /
  between), branch codes and names, months, categories and Rehire, all, and combinations (STPS October, transport KINP).
- **Views:** accruals (as journaled, after the branch move, by account), manual accrual, margin, month end (31 Oct), received not
  invoiced, no PO, actual vs estimate (by state, adding to the cent), revenue, November forecast, extra revenue, credit, open items,
  labour recovery, running sheet, overtime, wages, journaled, Schedule 17, pick-ups and the transport estimate, carrier invoice,
  consumables sold, own use, quotes, receipts, GL overview, estimate, GST, budget (says what is not held), meta.
- With nothing chosen and nothing typed it waits (the face carries the tables) and offers suggestions; a category on the face's
  table opens its lines here. Keyboard: / or Ctrl/Cmd+K to the box, Enter, Escape.
- Read only: no writes, no network, no storage; every string through the page's escape; money in whole cents.
- Not built: invoice line references (L143) and asset numbers as their own look-ups (they fall to the word search).

## Build

```
PLF_JSON_OLD=<pack v1.18>/GC500_PL_final.json PLF_JSON=<pack v1.19>/GC500_PL_final.json \
  toolchain/build.sh v12.79 v12.79_pl_rehire_pack_v119_LIVE/patch_v1279.py
```

`patch_v1279.py` refuses unless the live block is the v12.77 module on pack v1.18 byte for byte, the v1.19 data ties, and the
costs moved by exactly the transport estimate. The finder file is spliced into the module at `/*__PLF1279_FIND__*/`.

## Checks

All on the release build above (73df88ae…), the live record read only:

| Check | Result |
|---|---|
| `tests/test_v1279.cjs`, desktop / phone | 89/89 · 89/89 |
| `tests/test_v1279_find.cjs` (the search, every figure worked from the pack), desktop / phone | 155/155 · 156/156 |
| `tests/print_v1279.cjs` (40 pages A4 landscape, footer and page number on every page) | 25/25 |
| `v12.78_finance_fingerprint_LIVE/tests/test_v1278.cjs` | 10/10 |
| `review_01Nov2026_pl_deeper/test_caret_focus.cjs` on the spliced module | 9/9 |
| Sweeps, desktop and phone | 27 tabs, 0 errors, 0 console, 0 writes |

Three independent pre-upload checks ran (1 Nov 2026): the first found the working views still read as a second P&L and their
exports offered revenue to accrue (fixed: 210 word pairs, CSS); the final one found the search calling November's labour a manual
accrual candidate and a GL answer mislabelled under a category (fixed, with tests). Every figure on the face and in the search tied to
the pack to the cent in each check.

## Open (not in this release)

- Pack v1.20: the GL code for 'Installs (as coded)' (Job Connect's journal and branch move: Finance to confirm 2143 or Temporary
  Staff); open item 10's scrim figure (4,230.40 against invoices adding to 4,380.40); Alfie Harris's 5 Oct night (accrued; no shift on
  the record).
- Search: Export CSV holds the grouped rows, not every result's own table; some plain questions ('what is not accrued') fall to the
  word search; invoice line references and asset numbers are not look-ups of their own.
- Attributions kept in record notes shown on the Fencing and Customer rates sub-views (record data, changed only through the page's
  own functions on Andrew's word); fewer than on live v12.78 (no 'ruling').
- Schedule 17's GN26 row shows NVAC with the net change; the by-branch note gives the split (KINP −651.56, NVAC +580.00).
