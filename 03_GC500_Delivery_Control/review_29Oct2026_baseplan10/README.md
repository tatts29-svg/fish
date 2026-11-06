# Source review, 29 Oct 2026: Baseplan SuperCars (10) against (9) and the site record

Author: Andrew Fisher · 29 Oct 2026 14:31 AEST · read only (no import, no page release, no record change). Live
page v12.54.1 (`20a81f75…`), record 11983.

Andrew: "please see the updated baseplan."

| Source | Private file (not committed) | SHA256 | Size |
|---|---|---|---|
| Baseplan SuperCars (10), 20 contract sheets + Delivery Dockets | `09fa801a-Baseplan_SuperCars.xlsx` (staged as `Baseplan_SuperCars_10.xlsx`) | `b98caacf…` | 146,273 bytes |
| Compared with Baseplan (9), 29 Oct 05:50 | `7591f515-Baseplan_SuperCars.xlsx` | `1abf56d6…` | 148,490 bytes |

Method: the (8) tools in `review_29Oct2026_baseplan9/` (`to_json.py`, `diff67.py`) on both exports; the record as
read today (runs 66–75 and the departures of 26–29 Oct).

## The numbers

| | (9) | (10) | Change |
|---|---|---|---|
| Contract sheets | 22 | 20 | 9973079 and 9994996 gone |
| Lines | 674 | 661 | 0 added · 13 gone · 70 changed (39 billing columns only) |
| Delivery Dockets | 258 | 258 | unchanged |
| Prebill total (ex the stray 9974042 self-amount row) | $968,878.23 | $936,016.32 | **−$32,861.91** |
| KINP | $441,597.99 | $436,947.36 | −$4,650.63 |
| STPS | $454,037.28 | $425,400.70 | −$28,636.58 |
| NVAC | $49,115.23 | $49,008.01 | −$107.22 |
| MEAD | $24,127.73 | $24,660.25 | +$532.52 |

By contract: 9961265 VMS +$4,230.90 · 9973079 Trakmat −$8,714.95 (gone) · 9987005 forklifts +$741.60 · 9992300
access −$209.08 · 9994954 pee panels −$3,310.38 · 9994996 WFB labour and transport −$25,600.00 (gone).

The page's charge to the V8s stands at $1,007,518.57 on the record (job end $1,034,040.97). The gap between the
page and Baseplan was $38,640 at (9); it is $71,502 at (10), all of it charges taken off.

## Gone: $38,214.48 of charges for work on the record

| Line | Was | Our record | Verdict |
|---|---|---|---|
| 9994996/1 Labour Charge WFB Install & Removal $7,700.00 (STPS-INS) and /2 Transport Charge WFB Delivery & Removal $17,900.00 (STPS-FRI) — the whole contract | $25,600.00 Pending | 19 water-barrier groups WB01–WB19 delivered 14 Sep and removed 27–28 Oct by our crew and carriers; the page charges these two lines | **Ask Andrew / the branch: $25,600 of charge is off the book.** 9972648 (the barrier hire) did not pick it up: its lines 19 Labour Charge WFB $7,700 and 20 Transport Charge WFB $17,900 are the page's own copies of the same scope and are still on (9) and (10) — if 9994996 duplicated them, the removal is right and the page's "to align" card settles; if not, $25,600 goes back on |
| 9973079 — Trakmat 2.4 × 1.1 m: 20 from 14 Sep $6,000; 20 from 16 Oct $707; 25 from 19 Oct $883.75; 12 from 19 Oct $424.20; transport $150 + $275 + $275 (the whole contract) | $8,714.95 | the record has TM01, ten track mats on site from 16 Oct for the broadcast compound, on 9992300 line 6 (which stays). No reference carries the 14 Sep twenty or the 19 Oct thirty-seven | Ask Andrew: did 77 mats go out on 9973079, or was it a duplicate of 9992300/6? If they went, $8,714.95 goes back on |
| 9994954/20 Labour Charge Pee Panel 6 × … $3,310.38 (KINP-INS) | Delivered | six sub-hired pee panels installed at WC09 (confirmed 9 Oct); line 19 Pee Panels hire 6 × $672.17 stays | Ask Andrew: the install labour for the six panels is off while the hire stays |
| 9961265/15 VMS11 467T Premiair SUB-17093, 16–26 Oct, $589.71 (KINP-SUB) | Off Rent | 467T on site 16 Oct, left 29 Oct 12:30 (run 70) | **Baseplan: the line is gone, the board was out there 13 days** |
| 9961265/16 VMS12 1211646, from 16 Oct, $696.93 (STPS-HIR) | Delivered | 1211646 on site since 16 Oct, Ready for pick-up today (run 75) | **Baseplan: the line is gone, the board is still on site** |
| 9974042 — a row with no line number carrying the contract number as an amount | — | — | the stray row is off; agrees |

## Changed: VMS boards (9961265), $48,592.98 → $52,823.88

| Line | (9) → (10) | Our record | Verdict |
|---|---|---|---|
| /4 1211354 (VMS01), /6 1191877 (VMS04), /7 1211359 (VMS06) | Delivered, no term, expected 13 Nov; prebill $2,787.72 → $3,645.48 each | the three stay in place to 15:00 Fri 13 Nov (Andrew's post-event plan, run 74) | agrees — billed on to 13 Nov |
| /32 1191957 (VMS13), /35 1211348 (VMS15), /37 1211376 (VMS16), /39 1211364 (VMS17) | **Rate 1 $53.61 → $428.94, prebill $536.10 → $428.94 each, no term, expected 26–27 Oct** | all four stay in place to 15:00 Fri 13 Nov as VMS #2, #3, #8, #7 (run 74) | **Baseplan: these four now carry a flat $428.94 (eight days) with the hire stopping 27 Oct, while the boards run to 13 Nov like lines 4, 6, 7. At $53.61 a day, 19 Oct – 13 Nov is $1,340.25 each: $3,645.24 under across the four** |
| /12 1211404 (VMS09), /13 120T (VMS10) | Delivered → Off Rent, term 27 Oct 14:00, pickup 29 Oct; $1,125.81 → $1,072.20 each | both still on site 29 Oct, Ready for pick-up (run 75); 120T with Andrew | Baseplan: off rent two days before they leave; $107.22 each at the day rate if the branch bills to the pick-up |
| /24 472T (VMS18) | Off Rent, term 26 Oct 14:00; $536.10 → $428.88 | left Mon 26 Oct (run 72); off hire 29 Oct (run 73) | agrees on the day; Andrew's off-hire is 29 Oct |
| /25 487T (VMS19), /34 1201864 (VMS14) | Off Rent, term 26 Oct 14:00; $536.10 → $428.88 each | both left 29 Oct (12:40 and 12:00, runs 67–68) | Baseplan: three days early each ($160.83 at the day rate) |
| /28 97T (VMS21), /29 445T (VMS22), /31 450T (VMS24) | Off Rent, term 26 Oct 14:00; $375.27 → $268.05 each | 97T and 445T left 29 Oct 12:00 (run 66); 450T off hire 29 Oct (run 73) | Baseplan: three days early each ($160.83 at the day rate) |
| /26 475T (VMS20) | return docket 26159416, pickup 29 Oct; term 26 Oct unchanged | left Mon 26 Oct (run 72) | agrees |
| /30 453T (VMS23) | Off Rent, term 24 Oct 06:00; $536.10 → $268.05 | left Fri 23 Oct 12:00 (run 69) | agrees within a day |
| /40 Labour Charge 24 → 20 boards ($4,247.28 → $3,539.40); /41 Transport Charge 48 → 40 legs ($7,200 → $6,000) | −$1,907.88 | 24 boards on the register, every one placed and collected by us | **Baseplan: four boards' install labour and eight transport legs are off — which four?** |
| /3, /5, /8, /9 (the 7 Sep boards 1211370, 1182999, 1211383, 1271129) | unchanged from (9): Return Pending, term 28 Oct | left 28 Oct (08:30 and 14:30) | agrees |

## Changed: the rest

| Line | (9) → (10) | Our record | Verdict |
|---|---|---|---|
| 9972648/1 WB01 (12 barriers) | **Off Rent, term 29 Oct → Delivered, no term** | WB01 left 28 Oct 16:32 (run of 28 Oct) | **Baseplan: the off-rent has been undone; it should read off rent 28 Oct** |
| 9972648/15 WB19 | start 2 Nov → 3 Nov | not on site yet | note only (a post-event delivery) |
| 9973977/1 WCTV toilet block 1311144 $2,476.85 (KINP-HIR) | **start 14 Sep → 17 Oct; expected term and pickup 13 Nov → 27 Oct; billed to 27 Oct**; labour and transport billed 28 Oct | the whole-event charge is unchanged; the block's hire window on Baseplan is now 17–27 Oct | Ask Andrew: is the cyclone-rated block's hire 17–27 Oct, and has it left? The record has no departure for it |
| 9974042/1 container 1134386, /2 refrigerated container SUB-2131 (Royal Wolf) | Delivered → Off Rent, term 29 Oct 16:00, pickup 30 Oct | T0266 refrigerated container 920584 on site since 13 Oct; no departure recorded | agrees if they go tomorrow; record the departure when they do |
| 9987005/1 5.0 t forklift and /2 extension | Off Rent, term 28 Oct 16:00, pickup 2 Nov | EQ0004 (3.5 t supply forklift, 9961976) still on site; the 9987005 forklift's reference is not on the record by that contract — only EQ0006 laser plane (line 8) | Ask Andrew: which forklift is 9987005/1 and has it gone |
| 9987005/7 2.5 t rough-terrain forklift | Off Rent, term 30 Oct; $2,595.60 → $3,337.20 | as above | note: billed to 30 Oct |
| 9992300/1 5.0 t RT forklift, /2 2.5 t RT forklift, /3 extensions, /6 trakmat | Off Rent, term 27 Oct 13:00, pickup 2 Nov | EQ0001 scissor, EQ0005 extensions, TM01 trakmat on site with no departure; EQ0002/EQ0003 booms left 26 Oct (lines 5, 12 Returned, unchanged) | Ask Andrew: did the two forklifts, the extensions and the mats leave 27 Oct? Nothing on the record says so |
| 9992300/4 scissor lift | Off Rent, term 26 Oct 13:00; $1,881.72 → $1,672.64 | EQ0001 on site, no departure | as above |
| 9961976/6 GN20-A, /38 GN21 | Off Rent → Return Pending | both left 28 Oct | agrees (paperwork state only) |
| 9994954 (23 lines), 9992300 (8), 9961265 (3), 9973977 (2), 9974042 (2), 9987005 (1) | billing columns only (billed to date, billed amount, units) | — | no change to rate, quantity or date |

## What this means for the page

Nothing moves on the page from this review: the rulings stand (match Baseplan on the contracts Andrew named; the
site record is truth for what was on site and when). The open questions above are the branch's to answer; the
dollar effect of each is in the table. Two of them are not questions: VMS11 and VMS12 were on site and their
lines are gone ($1,286.64), and WB01's off-rent was undone.

Still unruled from the (9) review: 9990776 (fencing) is unchanged in (10); 9973079 and 9994996 have been deleted
rather than ruled.
