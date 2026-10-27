# Source review, 27 Oct 2026: Baseplan SuperCars (8) against (7) and the site record

Author: Andrew Fisher · 27 Oct 2026 · read only (no import, no page release, no record change). Live record 11588.

Andrew: "lets review this majority should match now i have canelled a couple and have emnetined this".

| Source | Private file (not committed) | SHA256 |
|---|---|---|
| Baseplan SuperCars (8), 21 contract sheets | `93ea586a-Baseplan_SuperCars.xlsx` | `13f57669…` |
| Compared with Baseplan (7), 25 Oct | `535e04ad-Baseplan_SuperCars.xlsx` | `0cf90af6…` |

Method: `../review_25Oct2026_baseplan7/to_json.py` and `diff67.py` on both exports; Off Rent / Returned / Return Pending lines
and changed start dates matched to references by asset number or the reference at the start of the description, then
checked against the live record (first on-site stamp, Record departure entries, bookings, VMS board records).

## Since (7): 32 lines added, 53 changed, none removed

- Off Rent 22 → 33, Returned 2 → 4, Return Pending 0 → 3. No line is marked Cancelled; the "cancelled" ones are the new Off Rent lines.
- New contracts: 10000523 KINP (P68 hydration station, water, trakmats 20 + 20 + 37 with transport, container shift),
  10000506 KINP (toilet paper 55, hand towel 21), 9997711 KINP (fridges 1129733 and 1157786, start 20 Oct), 9997710 STPS
  (1.8 m fence 144, shade cloth 144), 10000484 and 10000475 (scrim rolls 12 + 10 + 28, keyed STPS-CON on a KINP sheet).
- Added on existing contracts: light tower labour 7 and transport 14, 350 kVA labour (NVAC); WFB labour $7,700 and
  transport $17,900 (STPS); weed mat 40 + 10, scrim transport, fence event labour 213 h (9990776); a WB17 line.
- New lines total $81,367.86 prebill (STPS $55,217.38, KINP $22,378.40, NVAC $3,772.08); changed lines +$924.06.

## Now matches the site record

- Every off-rent generator, boom and building that has left matches a Record departure: GN04, GN06, GN10, GN13, GN24,
  EQ0002, EQ0003, P25, P60, P62, P63, P65, P66, P67 (term dates are the off-hire day, a day or so before the truck).
- Start dates fixed to the day they turned up: GN06 15 Oct, WB06 15 Oct, VMS22 and VMS24 22 Oct.
- Light towers: 7 units, labour 7 and transport 14 = 7 × 2 legs.

## Still to settle

| # | Line | Baseplan (8) | Our record | Who acts |
|---|---|---|---|---|
| 1 | 9972648/3 WB02 | Off Rent, term **25 Sep 2026** | on site since 21 Sep, no departure | Baseplan: almost certainly 25 Oct; as keyed it stops a month of hire |
| 2 | 9997711 FR01/FR02 fridges 1129733, 1157786 | start 20 Oct | on site 17 Oct, still on site | Baseplan: start 17 Oct (3 days each) |
| 3 | 10000523 trakmats | 20 from 15 Sep, 20 from 16 Oct, 37 on 27 Oct | TM01: 10 received 16 Oct | Ask Andrew |
| 4 | 9994954/10–11 GN26, GN27 (200 kVA concert) | start 12 Oct (was 23 Oct) | photos and install 13 Oct 13:43 | Ask Andrew: delivered 12 or 13 Oct |
| 5 | VMS11 (467T, T0128), VMS20 (475T, T0158), VMS05a (1211356, T0001) | Off Rent 26 Oct | boards on site, no departure | Andrew: record the pick-ups when they go |
| 6 | Water barriers WB13 (26 Oct), WB05/WB06/WB17 (27 Oct), WB01/WB03 (29 Oct) | Off Rent | on site, no barrier departures recorded | Andrew: record the pick-ups when they go |
| 7 | 9968862/132 P46 fridge | Off Rent 26 Oct | P46 on site | Ask Andrew: has the fridge gone? |
| 8 | 9968955/111 WC51 accessible 1197174 | Off Rent 26 Oct | on site (Andrew: stays) | Off-hire called ahead; record when it goes |
| 9 | P45, P69, GN03, GN25, LT05, LT06 | Off Rent 25–28 Oct | on site, booked out 28 Oct | Off-hire called ahead; matches |
| 10 | 10000484 / 10000475 scrim | STPS-CON on KINP sheets | — | Baseplan: branch, sign to STPS sheet |
| 11 | WFB labour $7,700, transport $17,900; fence event labour 213 h $19,412.82 | new | P&L check pending | Next pass |
