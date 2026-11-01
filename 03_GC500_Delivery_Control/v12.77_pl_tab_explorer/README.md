# v12.77 — find in the P&L (category, branch, month, search) and the labour journals (pack v1.17)

Author: Andrew Fisher. Andrew, 1 Nov 2026 (this chat): "Make sure the P&l has a professional feel. And search function that makes
sense. If you want to search by category you can or by branch. Or by month have these options available. And its accurate to the
cent. And we need to know labour where everyone needs to be jornled to ... No stone unturned the finance want 0 mistakes and wrong
numbera ... And layout is to be clean and tidy".

Built on the live v12.76 (`30ab13155c21c7284cde18a4d9752fad7b07cb3d703114948162833d62d9fcc9`, BASE pinned), on pack v1.17
(`../review_31Oct2026_october_month_end/`, "Pack v1.17"):

```
PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.77 v12.77_pl_tab_explorer/patch_v1277.py
```

## What changes on the Costs & P&L tab

No figure changes: pack v1.17 has v1.16's figures to the cent. The patch holds no figure; the pack data is pinned by SHA-256 and
refused unless it ties (the parts included).

- **Find in the P&L**, under the four tiles, on one quiet panel:
  - **Category** (all, or one of the pack's ten: Fencing, Toilets and water, Sub-hire, Transport, Labour hire, Salary,
    Accommodation, Meals and expenses, Consumables (POs), Forklift re-hire), **Branch** (all, KINP, STPS, NVAC, MEAD), **Month**
    (job end, September, October with November's labour, November forecast), a **search** (supplier, PO, hire contract, invoice,
    the V8s' PO, person; every word must match) and **Clear**.
  - **Revenue, Costs and Difference** for the choice. Each is a sum in whole cents of the pack's own parts: each cost line split by
    branch and month, and each invoice and the November forecast by branch and month. The pack's build and `audit_pack.py` prove
    that the parts add to every total the pack prints. Revenue is not split by cost category, so with a category it shows a dash.
    With a search, revenue is the invoices the search names. The difference is shown at job end for the job or a branch only,
    because the revenue is booked in the invoice month (all 18 invoices are dated October), so a month's difference would not be one.
  - Below: **by category** when no category or search is chosen (each category opens its lines), else **the matching cost lines**,
    each at its parts in the choice. A search shows **the invoices to the V8s that match**. A branch, a search, or the Labour hire
    or Salary category shows **the labour journals** for it.
  - The choice stays when the record syncs and the tab is drawn again. The panel is for the screen; the print is unchanged.
  - It works on the view-only link: the page's read-only lock disables every field, and this panel is marked `data-ro` (as the
    fencing filters are) because it filters what is shown and writes nothing.
- **Every cost line names its category.**
- **A fold "Labour journals: where everyone's hours go"**: each person and type, home branch, the branch the hours are journaled to
  (and the contract outside KINP), September and October hours (November's, to 13 Nov, in October), labour hire $ (the running
  sheet's), the hours on each branch and in all. Then **the labour hire bridge**: the running sheet beside the costs, week by week,
  so the journals' labour hire dollars and the Labour hire category tie to the cent.
- **Footer:** v12.76 → v12.77.

The labour journals name each person. `toolchain/scrub_attributions.py` keeps who-fields on the record's data, but it reads this
block as code, so the one name it would otherwise rewrite is written with a JSON escape (as the page already does elsewhere). The
patch refuses the data if the name appears anywhere but a who-field.

Nothing is typed; nothing is written to the record.
