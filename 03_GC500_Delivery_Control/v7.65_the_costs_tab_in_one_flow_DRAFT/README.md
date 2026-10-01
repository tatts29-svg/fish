# v7.65 — The Costs tab in one flow (DRAFT · built and tested)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct: "All costs must be correct and accurate. And forecast as much as we can. Clean data, tidy, presentable —
all in on GC500." The audit (`../costs_audit_01Oct2026/README.md`, section 3) found the Costs tab ran twenty blocks,
four of which said the same thing twice. This is the tidy. Applied after v7.60, v7.61, v7.62, v7.63 and v7.64 — one
build, six patches, on the live v7.59. No figure changes; every figure now has one home.

## The flow

| | Section | What it is | From |
|---|---|---|---|
| — | **At a glance** (new) | Four tiles — revenue, direct costs, the difference, the work month for Finance — each the figure on the record today and the same figure carried to job end; then the four steps below as links | v7.65 |
| 1 | **Forecast P&L by branch** | The record as it stands: revenue by line and by branch, direct costs by the eight categories, what is not in it | v7.52–v7.60 |
| 2 | **Costs to job end** | Per stream: to date · still to come · job forecast · basis; the fencing programme week by week; what is not priced and who can price it | v7.64 |
| 3 | **Month-end — for Finance** | Accruals for Finance (what to accrue for the work month) first, then the journals and the month-end controls | v7.61–v7.63, v7.45 |
| 4 | **The working**, folded | Direct costs by the eight categories with our transport lines and the people · Revenue by branch with the 2026 card · Charge lines on the record (with the filters) | v5.83–v7.54 |

Gone from the tab: the v5.83 ledger "Are we making money?" — its streams, branches and categories are all in the
Forecast P&L and the Costs to job end card. The by-branch revenue card and the eight-categories card are folded under
The working rather than shown a second time. The functions stay in the page; nothing else calls them.

## The glance's figures (the record on 1 Oct 2026, version 3288, on the corrected v7.64)

| Tile | Today | To job end |
|---|---|---|
| Revenue | $556,076 on the record | $804,885 (+ $248,810 of fencing still to come at the 2026 card, the behind-the-programme metres among it) |
| Direct costs | $235,372 known | $444,411 (+ wages priced $31,824 Job Connect · 1,626 h of Coates wages not priced) |
| Difference | $320,704 so far | $328,650 to job end, after priced wages — not a margin; 8 items not priced |
| Month-end for Finance | September 2026: $176,968 revenue earned, not yet billed | $70,331 of costs to accrue (proposal) · $21,950 for Finance's call · 5 lines with no day to put them in |

Every one is read from the same functions the cards below are drawn from (`moneySummary`, `cj764Model`,
`acc761Model`/`acc763Sums`), so the glance cannot disagree with them; the test checks each tile against its card.

## Behaviour

- A fold opened stays open through a re-render (a filter press, a saved line), the way the page's other folds do
  (`SFOLD_OPEN`, key `costs765|…`).
- The charge lines open themselves when a filter or a search is on, and stay open when the reader presses All inside
  them.
- The four links on the glance scroll to their section (buttons, not hash links — the page's hash is its tab).
- Print opens every fold first and closes it after, so paper carries the working; the glance prints as four small tiles
  where the old ledger's figures printed.
- Visible text on opening the tab: 33,416 characters, against 61,686 with the folds open (the old tab ran about 53,000
  with nothing folded).

Later drafts add links of their own that use the same jump: v7.66 puts "Rehire by branch" in the glance's list and
v7.67 links the P&L's card-priced line to the card table (and makes a jump open the fold it lands in). The test counts
at least four links, not exactly four.

## Files

- `patch_v765.py` — the pane assembly in `renderCosts_held` (the glance, the order, the two headings, three folds);
  `cj765Glance`, `cj765Fold`, the fold's toggle listener; jump bindings; `printCosts` opens and closes the folds;
  styles `.cj765…`, `.plfold765`.
- `evidence/practice_tests.js` — the order of the sections; each glance tile = its card's figure; the old ledger off the
  tab; the three folds closed with the categories, our transport, the people, the card and the charge-lines table
  inside; visible text < 75 % of the opened text; Finance's month inputs, the editors' forms, the filters and the four
  links reachable; a fold remembers through a re-render; a filter opens the lines; a link reaches its section; v7.64's
  and v7.63's reconciliations still hold; read-only; no overflow on the phone; 0 errors. `practice_results*.json`,
  `shot765_glance*.png`, `shot765_costs_tab*.png`, the sweeps.

## Build and evidence

`build/GC500_v7.65/GC500_Delivery_Control_hosted.html` — v7.60 → v7.61 → v7.62 → v7.63 → v7.64 → v7.65 on the live
v7.59: **8,601,283 bytes**, check_page PASS, key grep clean. Practice test desktop 22/22 and phone 22/22 (no overflow);
v7.64's test 20/20 and v7.63's test 33/33 on the same build. Sweeps desktop 21 tabs, 0 errors, 0 console; phone 21 tabs, 0 errors, 0 console
(`evidence/sweep_desktop.txt`, `evidence/sweep_phone.txt`). Pictures `evidence/shot765_glance.png` and
`shot765_glance_phone.png`.

Not for upload until the four-patch Costs release is live and Codex has reviewed v7.64 and v7.65; then one build, six
patches in order:

```
bash toolchain/build.sh v7.67 v7.64_costs_correct_and_to_job_end_DRAFT/patch_v764.py v7.65_the_costs_tab_in_one_flow_DRAFT/patch_v765.py v7.66_rehire_by_branch_DRAFT/patch_v766.py v7.67_priced_by_us_DRAFT/patch_v767.py   (on the live v7.63; v7.60-v7.63 are live)
```
