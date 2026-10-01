**LIVE — 1 Oct 2026 15:04 AEST, within v7.67.** Author: Andrew Fisher. Deployed and verified byte for byte; final release evidence is in the v7.67 folder. Earlier draft notes below are historical.

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
| Fencing — Advanced (STPS) | $77,122 | **$180,090** | **$257,212** | 63 dockets at Advanced's sheet + the green book; to come: the 2026 fencing programme's quantities for the weeks not yet docketed (CON WK3 in progress, CON WK2, CON WK1, EVENT WEEK) × Advanced's rates, **plus $41,111 behind the programme** — CON WK6, WK5 and WK4 ended with metres still on the plan and no docket for them (still to do, or done under another week; Advanced to confirm) — clean $10/m, scrim $24.40/m, CCB $5.40/m, V gates $50, ped gates $36. Not rated: relocation 692 m (by the hour), removal 968 m, hoarding 137 m, flat feet 256 m, WPF 135 m; the demob weeks still carry 2025 dates and are not forecast |
| Toilets — Event Portables (KINP) | $118,575 | — | $118,575 | the four approved quotes ex GST, counted whole; no invoice yet; Q6846 has no hire dates |
| Transport (cartage) | $22,011 | $22,364 | $44,376 | 37 loads with a figure (35 "and more"); to come: the card's transport cost for the references still without a figure + the loads with no reference or card line at the average so far ($595 a load) |
| Accommodation | $15,564 | $6,585 | $22,149 | every priced night on the tracker (70 nights: $5,948 to today, $9,616 booked ahead); to come: 31 nights with no rate at Alfie Harris's own priced rates |
| Meals, expenses, equipment R&M | $2,100 | — | $2,100 | to date on the tracker |
| **Direct costs — the P&L's eight categories** | **$235,372** | **$209,039** | **$444,411** | known today = the P&L's direct costs known, to the cent |
| Labour — wages (own line, not in the P&L's known) | $6,925 | $24,899 | $31,824 | the running sheet's paid hours at the rates on the record (Job Connect); 1,626 h of Coates people have no rate |

Revenue to job end: **$804,885** = $556,076 on the record + **$248,810** of fencing still to come at the 2026 card (of which $48,262 is the behind-the-programme metres)
(clean $16.16, scrim $25.53, relocation $8.65, ped gates $36.18, CCB event $7.51, demarcation $13.08; removal and V gates
inside the metre; hoarding, flat feet and WPF have no card line and are named). The P&L's own figures do not move.

A second table shows the fencing programme week by week (state, cost, revenue, the quantities still to come and what is
not rated); a third lists what is **not priced yet and who can price it** (relocation hours and the unrated fence types,
Event Portables' dates and invoice, the three sub-hired lines' supplier cost, the 50 loads without a figure, the 31
nights, the 1,626 labour hours, the fence team of six).

## Figures the card is built from (the record on 1 Oct 2026, version 3283)

Fencing programme still to come at Advanced's rates: behind — CON WK6 $1,735 · CON WK5 $25,812 · CON WK4 $13,563; CON WK3 (in
progress, plan less dockets) $29,112 · CON WK2 $20,916 · CON WK1 $54,523 · EVENT WEEK $34,428. At the card: $1,711 · $26,291 ·
$20,260 · $33,627 · $29,440 · $86,296 · $51,185.

## Codex's review, 1 Oct 14:00 — two corrections

- **A programme week that has ended is not dropped.** The first build skipped any rolled week whose end had passed ("the
  dockets are the truth"), which silently lost the metres the plan still carried undocketed for CON WK6, WK5 and WK4.
  Those are now carried as **behind the programme** on both sides ($41,111 at Advanced's rates, $48,262 at the card),
  named on the card and listed under not priced for Advanced to confirm — still to do, or done under another week.
- **A reference whose transport is on our typed line is not forecast again.** The P&L gives our own transport line
  precedence over the schedule's figure; the to-come forecast now skips those references too (none today, so no figure
  moves; the test holds the count equal to the P&L's).

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

Built and tested within `build/GC500_v7.67d` — v7.64 → v7.65 → v7.66 → v7.67 on the live v7.63 (8,572,884 bytes): **8,624,985
bytes**, check_page PASS, key grep clean. Practice test desktop 22/22 and phone 22/22 (no overflow). Sweeps recorded in
`../v7.67_priced_by_us_DRAFT/README.md`. Pictures `evidence/shot764_job_end.png` and `shot764_job_end_phone.png`.
