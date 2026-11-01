# v12.76 — the P&L tab as the dated job position; all the labour in October; no twin-steer rule on the P&L's print (pack v1.16)

Author: Andrew Fisher. The tab follows the pack (`../review_31Oct2026_october_month_end/`, pack v1.16), which takes in:

- the independent recheck of pack v1.15 and live v12.75 (`../review_31Oct2026_pl_independent/PACK_v115_RECHECK.md`, 1 Nov 2026),
  items 1–7 (the item-to-fix map is in the pack's README, "Pack v1.16");
- the elite check's findings that were verified against the source files (the pack's README lists each);
- Andrew, 1 Nov 2026 (this chat): "We want all labour costs. As in all hrs to all fall into october does that make sense from
  november for. Coates wages. Salary. Job connect"; "I dont want the no twin steer.on here"; "Eric is only a part of.that. that was a
  total invoice. He didnt work at v8s other days"; "Update go live".

Built on the live v12.75 (`0b32aebda051d1e48ef5e2319b589a2acd0afeff97418a05ff7c365606b891dc`, BASE pinned).

```
PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.76 v12.76_pl_tab_job_position/patch_v1276.py
```

## What changes on the Costs & P&L tab

The job's totals are unchanged to the cent: revenue, job cost, difference, the accruals through 31 Oct and every branch's costs are
v1.15's. What moves is the month of November's labour (below). The patch holds no figure; the pack data is pinned by SHA-256 and refused
if it doesn't tie.

- **The heading is the job position at 31 Oct 2026**, not "final".
- **Tiles:** "Charged to the V8s" shows the 18 invoices and the November forecast apart; "What it costs us" names the estimates and that
  Coates wages are not yet costed; **"Difference so far"**, not a margin yet; **"Accruals through 31 Oct"**, the journals prepared for
  Finance.
- **The note under the suppliers** says what the accruals are (work to 31 Oct with no invoice yet, including September's part of a
  line as a catch-up, worked out from the data) and what is not in them (carrier loads, the consumables and forklift POs: Finance to
  confirm); that some costs are estimates and Coates wages are hours only, so the difference so far is not a margin yet; and that **all
  the labour is in October**, with November's to 13 Nov (the Coates wages hours, the salary allowance and Job Connect), as the revenue
  for those days is invoiced in October.
- **Columns and folds** say "Accruals"; the journals fold is "Journals prepared for Finance, through 31 Oct".
- **The P&L's print carries no twin-steer rule** (Andrew). On the page's other prints the rule now prints whole: it starts 3 mm above
  the bottom of the printable area and runs up the edge, 1.5 mm in from it (it was a box 12 mm in from top and bottom that cut the end
  of the rule off); with "Checked by" added it wraps to a second line rather than cutting off. Its words, size and colour are unchanged.
- **Footer:** v12.75 → v12.76.

Nothing is typed; nothing is written to the record.

## Checks on the candidate

See the LIVE entry in `../STATUS.md` for the candidate's hash, the test counts and the live readback.
