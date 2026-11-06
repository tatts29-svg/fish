# v12.76 — the P&L tab as the dated job position; November's labour in October; no twin-steer rule on the P&L's print (pack v1.16)

Author: Andrew Fisher. The tab follows the pack (`../review_31Oct2026_october_month_end/`, pack v1.16), which takes in:

- the independent recheck of pack v1.15 and live v12.75 (`../review_31Oct2026_pl_independent/PACK_v115_RECHECK.md`, 1 Nov 2026),
  items 1–7 (the item-to-fix map is in the pack's README, "Pack v1.16");
- the elite check's findings that were verified against the source files (the pack's README lists each);
- Andrew, 1 Nov 2026 (this chat): "We want all labour costs. As in all hrs to all fall into october does that make sense from
  november for. Coates wages. Salary. Job connect"; "I dont want the no twin steer.on here"; "Eric is only a part of.that. that was a
  total invoice. He didnt work at v8s other days"; "Update go live".

Built on the live v12.75 (`0b32aebda051d1e48ef5e2319b589a2acd0afeff97418a05ff7c365606b891dc`, BASE pinned).

```
PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.76 v12.76_pl_tab_job_position_LIVE/patch_v1276.py
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
  confirm); that some costs are estimates and Coates wages are hours only, so the difference so far is not a margin yet; and that costs
  are by month of work, except **November's labour** (to 13 Nov: the Coates wages hours, the salary allowance and Job Connect), which
  is **in October** with October's; the rest of November is forecast.
- **Columns and folds** say "Accruals"; the journals fold is "Journals prepared for Finance, through 31 Oct".
- **The P&L's print carries no twin-steer rule** (Andrew), by its Print button or the browser's own print while the tab is showing;
  on screen, the red twin-steer banner above the tabs is hidden on the Costs & P&L tab (every other tab keeps it). On the page's other prints the rule now prints whole: it starts 3 mm above
  the bottom of the printable area and runs up the edge, 1.5 mm in from it (it was a box 12 mm in from top and bottom that cut the end
  of the rule off); with "Checked by" added it wraps to a second line rather than cutting off. Its words, size and colour are unchanged.
- **Footer:** v12.75 → v12.76.

Nothing is typed; nothing is written to the record.

## Checks

The candidate `build/GC500_v12.76c/GC500_Delivery_Control_hosted.html`, 16,647,547 bytes,
`30ab13155c21c7284cde18a4d9752fad7b07cb3d703114948162833d62d9fcc9`, on pack v1.16 data
`797f99b9be5a98bf0dbd778e7a1b5f812c6c14b8b23d444d0833a5e34ad2e253` (`audit_pack.py` 511/511):

- `tests/test_v1276.cjs` 46/46 desktop and 46/46 phone (every figure of the pack on the tab, the job-position wording, the banner
  hidden on Costs & P&L and shown on Today, no write);
- `tests/print_v1276.cjs` 20/20 (21 pages A4 landscape: every figure and open item on the paper, no twin-steer strip on the P&L's
  print by its button or by Ctrl+P on the tab, the strip whole on the Today print with and without "Checked by");
- `toolchain/harness/sweep.js` desktop and phone: 27 tabs, 0 errors, 0 console messages, 0 writes.

LIVE 1 Nov 2026 14:16 AEST (on Andrew's word "Update go live" and "I approve.you to sign off"): the public view serves the build
byte for byte; the same tests on the live bytes 46/46, 46/46 and 20/20.
