# v7.64 — Costs correct and complete, and Costs to job end (DRAFT · built and tested)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct: "All costs must be correct and accurate. And forecast as much as we can. Clean data, tidy, presentable —
all in on GC500." The audit behind this is `../costs_audit_01Oct2026/README.md`. Applied after v7.60, v7.61, v7.62 and
v7.63 — one build, five patches, on the live v7.59.

## Corrections (every figure on the page keeps one meaning)

- **C1 — every load by its docket.** The P&L took the first transport figure per reference, so WC05, which went in on two
  trucks on 14 Sep (dockets 26067317 and 26067323, $290+ each), lost one. Every schedule row with a figure is now a load:
  **37 loads, $22,011.39** (was 36, $21,721.39). Direct costs known rise $290 to **$235,371.76**. The P&L and the
  Accruals section now agree.
- **C2 — relocation costed once.** Three dockets (F010, F025, F027) carry relocation metres charged to the V8s at the
  card's $8.65/m; Advanced bill relocation by the hour, which is the green book ($1,250). The fencing cost note says so,
  so the three no longer read as uncosted. No figure moves.
- **C4 — the undated docket.** The workbook's Week 6 row 3 ($2,475 at Advanced's sheet, $3,757 at the card) is dated to
  its week's last day on the Accruals section's cost side, as the charge side already dated it. It leaves "no day to put
  it in".

## Costs to job end — the new card under the Forecast P&L

| Direct cost | To date (known) | Still to come (forecast) | Job forecast | Basis |
|---|---|---|---|---|
| Fencing — Advanced (STPS) | $77,122 | **$138,980** | **$216,101** | 63 dockets at Advanced's sheet + the green book; to come: the 2026 fencing programme's quantities for the weeks not yet docketed (CON WK3 in progress, CON WK2, CON WK1, EVENT WEEK) × Advanced's rates — clean $10/m, scrim $24.40/m, CCB $5.40/m, V gates $50, ped gates $36. Not rated: relocation 692 m (by the hour), removal 968 m, hoarding 137 m, flat feet 256 m, WPF 135 m; the demob weeks still carry 2025 dates and are not forecast |
| Toilets — Event Portables (KINP) | $118,575 | — | $118,575 | the four approved quotes ex GST, counted whole; no invoice yet; Q6846 has no hire dates |
| Transport (cartage) | $22,011 | $22,364 | $44,376 | 37 loads with a figure (35 "and more"); to come: the card's transport cost for the references still without a figure + the loads with no reference or card line at the average so far ($595 a load) |
| Accommodation | $15,564 | $6,585 | $22,149 | every priced night on the tracker (70 nights: $5,948 to today, $9,616 booked ahead); to come: 31 nights with no rate at Alfie Harris's own priced rates |
| Meals, expenses, equipment R&M | $2,100 | — | $2,100 | to date on the tracker |
| **Direct costs — the P&L's eight categories** | **$235,372** | **$167,929** | **$403,300** | known today = the P&L's direct costs known, to the cent |
| Labour — wages (own line, not in the P&L's known) | $6,925 | $24,899 | $31,824 | the running sheet's paid hours at the rates on the record (Job Connect); 1,626 h of Coates people have no rate |

Revenue to job end: **$756,478** = $555,930 on the record + **$200,548** of fencing still to come at the 2026 card
(clean $16.16, scrim $25.53, relocation $8.65, ped gates $36.18, CCB event $7.51, demarcation $13.08; removal and V gates
inside the metre; hoarding, flat feet and WPF have no card line and are named). The P&L's own figures do not move.

A second table shows the fencing programme week by week (state, cost, revenue, the quantities still to come and what is
not rated); a third lists what is **not priced yet and who can price it** (relocation hours and the unrated fence types,
Event Portables' dates and invoice, the three sub-hired lines' supplier cost, the 50 loads without a figure, the 31
nights, the 1,626 labour hours, the fence team of six).

## Figures the card is built from (the record on 1 Oct 2026, version 3283)

Fencing programme still to come at Advanced's rates: CON WK3 (in progress, plan less dockets) $29,112 · CON WK2 $20,916 ·
CON WK1 $54,523 · EVENT WEEK $34,428. At the card: $33,627 · $29,440 · $86,296 · $51,185.

## Files

- `patch_v764.py` — guard `cj764Model`; C1 in `moneySummary` (the `tRows` loop reads every schedule row with a figure);
  C2 via `cj764RelocNote()` on the fencing category line; C4 in the v7.62 model (`cj764WeekEnd`); helpers
  `cj764Fencing`, `cj764Model`, `cj764Card` before `fin745Bind`; the card mounted after `pl752Card()`; styles.
- `evidence/practice_tests.js` — C1 (every load with a figure counted; WC05 has two; the P&L's transport = every load),
  C2 (the note), C4 (no undated docket in the Accruals' cost rows); the card's known = the P&L's known to the cent; job
  = known + to come; fencing to come = the weeks; what is not rated is named; revenue to job end = the record + fencing
  to come; wages on their own line; the gaps listed; read-only; v7.63's and v7.60's reconciliations still hold; no
  overflow on the phone; 0 errors. `practice_results*.json`, `shot764_job_end*.png`, the sweeps.

## Build and evidence

`build/GC500_v7.64/GC500_Delivery_Control_hosted.html` — v7.60 → v7.61 → v7.62 → v7.63 → v7.64 on the live v7.59:
**8,593,221 bytes**, check_page PASS, key grep clean. Practice test desktop 20/20 and phone 20/20 (no overflow); v7.63's test 33/33 and v7.60's reconciliation on the same build; sweeps desktop 21 tabs, 0 errors, 0 console; phone 21 tabs, 0 errors, 0 console. Pictures `evidence/shot764_job_end.png` and `shot764_job_end_phone.png`.

Not for upload until the four-patch Costs release is live and Codex has reviewed; then one build, five patches in order.
