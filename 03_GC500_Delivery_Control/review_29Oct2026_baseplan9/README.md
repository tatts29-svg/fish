# Source review, 29 Oct 2026: Baseplan SuperCars (9) against (8b) and the site record

Author: Andrew Fisher · 29 Oct 2026 · read only (no import, no page release, no record change). Live page v12.50
(`7ea8e4d2…`), record as read 29 Oct 2026 05:50 AEST.

Andrew: "we need to go through each one again and review and adjust where we need to please see the attached."

| Source | Private file (not committed) | SHA256 | Size |
|---|---|---|---|
| Baseplan SuperCars (9), 21 contract sheets + Delivery Dockets | `7591f515-Baseplan_SuperCars.xlsx` (staged as `Baseplan_SuperCars_9.xlsx`) | `1abf56d6…` | 148,490 bytes, 674 lines |
| Compared with Baseplan (8b), 27 Oct 20:39 | `89356b40-Baseplan_SuperCars.xlsx` | `18ef76c9…` | |

Method: the (8) tools (`to_json.py`, `diff67.py`) on both exports; fresh reads of the live page (`dump_site.cjs`,
`dump_lines.cjs`, `dump_service.cjs`, `dump_vms.cjs`, `dump_fence.cjs`); `build_review9.py` (the (8) build pointed at
(9), scrim pair moved from line 10 to the new line 15). Deliverable: **`GC500_Baseplan9_vs_Site_29Oct2026.xlsx`**
(fix list of 143 rows, every line, branch tie-out, start dates, since 25 Oct, fencing, generators, charge lines).

## Since (8b): 6 lines added, 3 gone, 260 changed, dockets unchanged

Contract prebill total $971,026.23 → $968,878.23 (−$2,148.00; the stray row on 9974042 that carries its own contract
number as an amount is left out of both). By sales code: KINP −$3,366.09, STPS +$1,834.64, NVAC +$107.22, MEAD −$723.77.

215 of the 260 changed lines moved only the billing columns (billed to 13 Nov, billed amount, units): no rate, quantity
or date changed on them. The 45 that matter:

**Added**

| Line | (9) | Our record | Verdict |
|---|---|---|---|
| 9990776/15 Scrim, 3,143 × $9.34 = $29,355.62 (STPS-CON, Pending) | replaces line 10 Shade Cloth 2,775 × $9.37 = $26,001.75 | fence + scrim is now $16.16 + $9.34 = $25.50 a metre against the card's $25.53 (3 c under) | Baseplan: rate; quantity below |
| 9997710/3 CCB 30 for the straight boom, Returned 28 Oct, $225.30 | new | EQ0003 left 26 Oct; a week minimum | agrees |
| 9968955/167 Transport Charge Trailer Toilets 4 × $150 = $600 (KINP-FRI) | new | WC100: two trailer toilets × 2 legs | agrees |
| 9968955/166 WC66 Toilet FWF × 2 at $90.07, Delivered from 28 Oct | new | no WC66 on the record; nothing arrived 28 Oct (demob) | Ask Andrew |
| 9968862/142 P29 Fridge, /143 P53 Fridge, $46.84 each, Pending from 28 Oct | new | P29 and P53 were cancelled buildings; no fridge arrived 28 Oct | Ask Andrew |

**Gone**

| Line | Was | Our record | Verdict |
|---|---|---|---|
| 9968862/136 Site Shift for Supply $500 (KINP-MIS) | duplicated 1000052/11 Site Shift Supply Container $500 (KINP-FRI), which stays | — | agrees: the duplicate is off. On the P&L this is the "Contract services — ledger allocation pending $500" line: it goes when (9) loads, the $500 stays in Transport |
| 9990776/10 Shade Cloth 2,775 × $9.37 | replaced by line 15 above | — | agrees |
| 9961976/27 SUPPLY-Forklift 3.5t 1210921 (NVAC, $0) | taken off | **EQ0004 1210921 is on site since 22 Oct** (no departure) | Baseplan: the forklift still needs its line — or Andrew rules it Coates' own at no charge (the open forklift decision) |

**Changed: status, dates, rates, quantities**

| Line | (8b) → (9) | Our record | Verdict |
|---|---|---|---|
| 9961976/6 GN20-A, /38 GN21, /9 and /41 GN23 | Off Rent / Returned, term 28 Oct 09:00 | left 28 Oct (15:38, 15:38, 10:05) | agrees |
| 9961976/10 GN03, /14 GN04, /18 GN25, /44 GN13 | → Return Pending / Returned | left 28 Oct, 26 Oct, 28 Oct, 26 Oct | agrees |
| 9992300/5 knuckle boom, /12 straight boom | → Returned, $1,554.75 each | EQ0002, EQ0003 left 26 Oct | agrees |
| 9972648/1 WB01, /4 WB05, /6, /16, /17 WB06, /12 WB17 | Off Rent 27 and 29 Oct (unchanged) | all four groups left 28 Oct 16:32 | **now agrees** (was open item 6) |
| 9961265/3 VMS02, /5 VMS07, /8 VMS08, /9 VMS03 (the 7 Sep boards) | Delivered → Return Pending, term 28 Oct; $3,591.87 → $2,734.11 / $2,787.72 each | the page's VMS record never had these four on site | Ask Andrew: were they out there 7 Sep – 28 Oct? If yes the record needs them on; (9) is charging them |
| 9961265/43 VMS05a 1211356 | Off Rent → Return Pending, term 26 Oct, $107.22 → $375.27 | not on site on the VMS record | week minimum now charged; agrees |
| 9968955/12, /13 WC100 trailer toilets | **Rate 1 $237.71 → $945.00 each** (+$1,414.58) | the page charges $237.71 once each as the whole-event bill | Ask Andrew: which rate is the trailer toilet's |
| 9968955/143 Cleaning & Restock Sewer Connect 24 × $260.25 | Pending $6,246 → **Delivered $0** | the page has never counted it (no Rate 1 on the line — "unknown, not nought"); the P&L's Cleaning $8,484.15 is per piece from the card | Ask Andrew: is the sewer-connect clean charged on the contract or not; as keyed it is $0 |
| 9968955/84 WC67 | 2 → 4 (+ line 140 × 1 = 5 on hire) | WC67 has 4 FWF (arrived 1 Oct) | Baseplan: one too many — take line 140 off |
| 9968955/141–165 charge lines | Pending → Delivered (delivery 26157122) | billed, no amounts moved except /143 above | agrees |
| 9990776/2–9, /14 | Pending → Delivered (delivery 26157283), pickup 28 Oct | — | agrees |
| 9990776/3 clean fence | 8,778 → 8,609.5 m | dockets to 25 Oct: 9,325 m clean (13,302.5 less the 3,977.5 under scrim) + 110 m hoarding on line 5 | Baseplan: 9,215 m on line 3 (+605.5 m, +$9,784.88) |
| 9990776/6 scrim fence, /15 scrim | 2,775 → 3,143 m on both | 3,977.5 m on the dockets | Baseplan: 3,977.5 on both (+834.5 m, +$21,279.75 at $25.50) |
| 9968862/17–23 CP1, /79–91 P52 P54 P55 P56 P57, 9968955/47–50 WC20 | Off Rent, term 13 Nov, return dockets issued, pickup booked 30 Oct | on site, demob to come | agrees (whole-event hire to 13 Nov) |
| 9968862/63 P41 | Off Rent, term 28 Oct 06:02 | on site, no departure | Andrew: record it when it goes |
| 9968862/103–131 P69 P25 P67 P65 P66 P60 P62 P63 P45 (+fridges), /132 P46 fridge, 9968955/111 WC51 | pickup booked 26–28 Oct → 13 Nov; term dates unchanged | the buildings left 27–28 Oct; P46 fridge and WC51 on site | note only: the term dates still match |
| 9997710/1 1.8 m fence 144 m | → Returned 28 Oct 12:50 (+$17.28) | — | agrees |

## Now matches the record (new since the (8) review)

- Every generator, boom, building, light tower and water barrier off rent in (9) has a Record departure: GN03, GN04,
  GN06, GN10, GN13, GN20-A, GN21, GN23, GN24, GN25, LT05, LT06, EQ0002, EQ0003, P25, P45, P60, P62, P63, P65, P66, P67,
  P69, PG03, PG05, PG29, WB01, WB05, WB06, WB17 and the 37 toilets that left 26–28 Oct. 66 of the 68 "Not on site"
  rows in the workbook's fix list are these — references that have **left** — not errors; the two real ones are WC66
  (item 5 below) and 1000052/1 "P68 Hydration Station" (the water station on the hydration contract, not a building).
- The (8) review's items 6 and 9 (barriers and the 27–28 Oct pick-ups) are closed by the record.
- WFB labour $7,700 and transport $17,900 (9972648/19–20) are in the P&L as charge lines ($25,600) — item 11 closed.
- Accommodation and travel: (9) still carries ACCOM / MEALS 50% × 2 = $27,700, the same as the C004 scope and the P&L.
- The site-shift duplicate is off.

Read the fix list with these corrections (the build predates the demob and some rulings): the scrim-roll "code KINP"
rows (1000047, 1000048, 9997710/2) are the opposite — fencing is STPS on the P&L, the fix is the STPS scrim on KINP
sheets moving to an STPS contract; "Missing line: Fence team" is **done** as 9990776/14 (the build matches a
different description); "no water on any contract" is settled — water sits inside the pump-out charge (Andrew, 28 Oct);
"Coates forklifts at $0" waits on Andrew's ruling (the P&L carries them at $0 since v12.45.1).

## Still to settle

| # | Line | Baseplan (9) | Our record | Who acts |
|---|---|---|---|---|
| 1 | 9961976/27 forklift 1210921 | line removed | EQ0004 on site since 22 Oct | Andrew: Coates' own at no charge, or NVAC line from 22 Oct |
| 2 | 9968955/12–13 WC100 | $945.00 each (was $237.71) | page $237.71 once each | Andrew: which rate |
| 3 | 9968955/143 sewer-connect clean | $0 (was $6,246) | page: no rate, not counted | Andrew: charged or not |
| 4 | 9961265/3, 5, 8, 9 VMS02/07/08/03 | charged 7 Sep – 28 Oct | not on our VMS record | Andrew: were they out |
| 5 | 9968955/166 WC66 × 2; 9968862/142–143 P29, P53 fridges | new 28 Oct lines | not on the record | Andrew: what are they |
| 6 | 9990776/3, 6, 15 fence quantities; /2 gates 32 vs 22; /4 relocation 1,520 vs 137.5 to date; /7 CCB 2,350 vs 2,195; /8 flat feet 220 vs 270 at $7.51 vs $9.65; /9 demarc 4,603 vs 5,062.5; no blocks (216 × $3.02) or labour (8.5 h × $142) lines | as keyed | the signed dockets | Baseplan (the 9990776 keyer); unchanged since (8) |
| 7 | 9972648/3 WB02 | Off Rent, term **25 Sep** | on site since 21 Sep, 34 barriers | Baseplan: almost certainly 25 Oct |
| 8 | 9997711/1, 3 fridges FR01/FR02 | start 20 Oct | on site 17 Oct | Baseplan: start 17 Oct |
| 9 | 1000052/4, 6, 8 trakmats 20 + 20 + 37 | from 15 Sep, 16 Oct, 27 Oct | TM01: 10 received 16 Oct | Ask Andrew |
| 10 | 9994954/10–11 GN26, GN27 | start 12 Oct, $2,005.08 / $2,551.92 | install 13 Oct; P&L $6,455.75 each | Ask Andrew (date); rate as ruled |
| 11 | 9961976 generator rates (13 lines) and light towers (7 lines); labour and transport quantities (52–55) | as keyed | the card the P&L charges | Baseplan; unchanged since (8) |
| 12 | 1000047, 1000048 scrim rolls | STPS-CON on KINP sheets | — | Baseplan: move to an STPS contract |
| 13 | 9968955/84 + 140 WC67 | 5 on hire | 4 on site | Baseplan: take line 140 off |
| 14 | 9968862/63 P41; /132 P46 fridge; 9968955/111 WC51; WB03, WB04 (13 vs 14), WB07 (no line, 17 on site), WB13 | Off Rent / Delivered | on site | Andrew: record each when it goes; WB07 line and WB04 count to Baseplan |
| 15 | 9994954/12–14, 25 cable, sync labour, generator transport, Gen Tech | KINP codes | NVAC work on the P&L | Baseplan: NVAC codes |

| Branch | P&L revenue (job total) | Baseplan to move on the fixes with a figure | Waiting on a decision |
|---|---|---|---|
| KINP | $452,300.34 | +$9,045.18 (T0243 clean $780.75, GN26/27 rates) | WC100 +$1,414.58; clean $6,246; WC66, fridges |
| NVAC | $52,947.08 | +$4,733.36 (generator rates net of light towers, transport legs) | forklift 1210921 and the Coates forklifts at $0 |
| STPS | $504,949.81 | about +$45,064 (fence quantities to the signed dockets, flat feet rate, blocks and labour lines, VMS starts) | the four 7 Sep VMS boards |
| MEAD | $27,621.20 | $0 (plant start dates to confirm) | — |

## For the page (Codex): loading (9) as the successor to v12.42.7's (8) import

Money that moves if (9) loads as keyed, before any ruling above: Contract services $500 off (the duplicate; Transport
unchanged), 9961265 −$3,967.14 (VMS term dates), WC100 +$1,414.58, WC67 +$180.14, WC66 +$180.14, fridges +$93.68,
9968955/143 $0 (already $0 on the page), 9990776 lines stay held out of Hire (fencing is charged from Advanced's
dockets at the card since v12.19), forklift 1210921 line gone (EQ0004 still on site at $0). Hold WC100, WC66, the
fridges and the four VMS boards at the (8) treatment until Andrew rules; load the rest.
