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
  - **Category** (all, or one of the pack's ten reporting categories, not GL codes: Fencing, Toilets and water, Rehire, Transport,
    Labour hire, Salary allowance, Accommodation, Meals and expenses, Consumables and services (POs), Forklift rehire), **Branch** (all, KINP, STPS, NVAC, MEAD), **Month**
    (job end, September, October with November's labour, November forecast), a **search** and **Clear**.
  - **The choices alone:** Revenue, Costs and Difference so far for the choice, each a sum in whole cents of the pack's own parts
    (each cost line split by branch and month; each invoice and the November forecast by branch and month). The pack's build and
    `audit_pack.py` prove that the parts add to every total the pack prints. Revenue is not split by cost category (a dash with a
    category). The difference is shown at job end for the job or a branch only: the revenue is booked in the invoice month (all
    18 invoices are dated October), so a month's difference would not be one. Below: by category (each category opens its lines),
    or the category's lines; and the labour journals for a branch or the Labour hire or Salary category.
  - **The search gives a thing's own figure** (the independent review found that matching whole lines and invoices by their text
    gave, for example, a PO's whole line instead of the PO's amount, so the search works this way):
    - a **PO** gives its amount, as in "Every purchase order in the costs", and the line it is on (a line can carry more than one
      PO, so the note says the line's total is not the PO's amount);
    - a **hire contract** gives what we charged on it and the costs tied to it, as in "By hire contract" (the November forecast on
      9961976 is named under the table, not added to the charge);
    - an **invoice** gives its own amount, with a button to its hire contract; the invoice not in the revenue says why;
    - the **V8s' PO** (as keyed, e.g. P028604, P0 07.04, P28607) gives only the invoices keyed with it;
    - a **person** (full name or first name) gives their labour journal rows; costs are carried by week and supplier, not by
      person, so Revenue and Costs show a dash rather than a figure that is not theirs;
    - a **branch code** or **category name** typed acts as that choice and says so;
    - **any other words** give the cost lines that mention them, as "Matching cost lines" (whole lines: a line can be shared with
      other items, so the figure is not one item's cost), with no revenue.
    With an identifier, a month, branch or category that does not apply gives the reason (e.g. "a PO's amount is for the job, not
    by month: choose Job end"; "this PO is on STPS"; "the invoice is dated October"), never a different figure.
  - The choice and the typed search stay when the record syncs and the tab is drawn again. The panel is for the screen; the print
    is unchanged.
  - It works on the view-only link: the page's read-only lock disables every field, and this panel is marked `data-ro` (as the
    fencing filters are) because it filters what is shown and writes nothing.
- **Every cost line names its category.**
- **A fold "Labour journals: where everyone's hours go"**: each person and type, home branch, the branch the hours are journaled to
  (and the contract outside KINP), September and October hours (November's, to 13 Nov, in October), labour hire $ (the running
  sheet's), the hours on each branch and in all. Then **the labour hire bridge**: the running sheet beside the costs, week by week,
  so the journals' labour hire dollars and the Labour hire category tie to the cent.
- **The P&L's print button reads "Print full P&L"** (the finder is for the screen; the folds below are the full pack).
- **Footer:** v12.76 → v12.77.

The category names follow the independent recheck of the candidate (PR #1, 1 Nov 2026): Coates says "Rehire"; the salary line
is the allowance, not the full salary cost; the PO suppliers include services (a crane, an electrician).

The labour journals name each person. `toolchain/scrub_attributions.py` keeps who-fields on the record's data, but it reads this
block as code, so the one name it would otherwise rewrite is written with a JSON escape (as the page already does elsewhere). The
patch refuses the data if the name appears anywhere but a who-field.

Nothing is typed; nothing is written to the record.
