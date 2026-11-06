# Source review, 16 Oct 2026: Baseplan SuperCars (5) — extra charges checked against site

Author: Andrew Fisher · 16 Oct 2026

Status: **READ AND COMPARED — no record changes, no import, no page release.** Live page v10.48 `43c1c13b…`, record
8077 (GET only). Andrew, 16 Oct 2026: "not saying this is correct as my data is truth on site, but we need to catch out
when data is wrong especially when they try to charge other costs."

| Source | Private file (not committed) | SHA256 |
|---|---|---|
| Baseplan SuperCars (5), 12 contract sheets + Delivery Dockets | `740be303-Baseplan_SuperCars.xlsx` | `a424e52d5e21c86d51f0919d006ff9528dc8b6082280fc1a4fd39e91479f6498` |
| Compared with Baseplan (4), 15 Oct | `892b9fab-Baseplan_SuperCars.xlsx` | `ba246d4a…` |

Deliverable: `GC500_Baseplan5_Charges_Check_16Oct2026.xlsx` — Summary; Install & dismantle (45 buildings, one row
each); Transport; Other changes vs (4). Built by `build_check.py` from the export and `evidence/page_buildings.json`
(the site record read from the live page). `diff_baseplan.py` is the line-by-line diff with (4); output in
`evidence/diff.json`.

## The new charges: $79,912.35 on 9968862, all dated 16 Oct

| Line | Baseplan | Site record supports now | Not done yet | Charged, not recorded on site |
|---|---|---|---|---|
| 133 Installation & Dismantling, 45 × $655.83 | $29,512.35 | $19,987.20 | $6,558.30 (demob) | **$2,966.85** |
| 134 Transport up to 6 m, 72 × $500 | $36,000.00 | $18,000.00 | $18,000.00 (return) | $0 |
| 135 Transport 9.6 m & 12 m, 18 × $800 | $14,400.00 | $7,200.00 | $7,200.00 (return) | $0 |
| **Total** | **$79,912.35** | **$45,187.20** | **$31,758.30** | **$2,966.85** |

- **$655.83 is the whole card labour package for one building**: Install 145.74 + Steps 156.15 + Levelling 52.05 +
  Cleaning 104.10 + Fire extinguisher 52.05 + Demob 145.74. Baseplan charges it on every building whether or not
  each piece was done.
- On site (record 8077): install, levelling and cleaning on all 45; **steps on 41 (none on P06, P38, P39, P42 =
  $624.60)**; **fire extinguisher on none (45 × $52.05 = $2,342.25)**; demob still to come ($6,558.30).
- Transport: rates match the card ($500 each way up to 6 m, $800 for 9.6/12 m) and the counts match the buildings on
  site (36 + 9, two trips each). Half is the return trip, which is not done until demob.
- So: **$2,966.85 is charged for work the site has not recorded**, and **$31,758.30 is charged before the work is
  done** (demob and return transport). Fine to bill once done; not before.

## Other changes since (4) that matter

- **GN10 (9961976 line 15) — wrong unit and size.** Baseplan now puts a 60 kVA generator, asset 1283681, on GN10 at
  $1,142.96/wk from 19 Oct. Our record: GN10 is a 20 kVA, asset 1197355, not on site yet, due 19 Oct. 1283681 is the
  spare we took off GN06.
- **GN06 (line 48)** — the same unit as ours (1320828), delivered 15 Oct, but described as 60 kVA at $1,184.82/wk; we
  have it as 50 kVA. Check the plate; a 50 kVA should be on the 50 kVA rate.
- **Straight Boom Lift 60 ft (9992300 line 12) — new**, $459.55/wk from 21 Oct (prebill $2,417.94), TV compound. Not on
  our record; neither are the knuckle boom (line 5) and the scissor lift (line 4). There is only one boom transport line.
  Extra, or a swap for the knuckle boom?
- **WB22 (9972648 line 18) — new**, 4 barriers from 18 Oct. No WB22 on our schedule.
- **WB07 (17) and WB13 (10) removed** from Baseplan, still on our schedule for 18 and 19 Oct: if they go out they will
  not be billed.
- **WB04/WB05**: labels swapped since (4); 13 + 12 billed against 14 + 13 on site — two fewer billed.
- Labels only, no money: P19, P21, P25 described 6.0 m but billed at the 4.8 m rate (they are 4.8 m); line 59 labelled
  P44 is P58's building (1273656).
- Agrees with the record: WC51 delivered 15 Oct (1197174 — a number to add once seen); the old TV order 9968726
  removed; the two spare generator lines removed; TV compound forklifts and Trakmats delivered 16 Oct; P41 rate 10c.

## Not changed

No record writes; the page's own labour charges already follow the ticks (they give the same $19,987.20 for these 45
buildings). Nothing has been sent to the branch.
