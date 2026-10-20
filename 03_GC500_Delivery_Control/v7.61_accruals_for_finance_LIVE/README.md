**LIVE — 1 Oct 2026 13:57 AEST, released within v7.63.** Author: Andrew Fisher. Approved four-patch build verified byte for byte. See v7.63 release evidence. Earlier draft/review notes below are historical.

# v7.61 — Accruals for Finance, on the Costs tab (DRAFT · built and tested · awaiting Andrew's yes)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "Finance will want accrual info from me. No branches have billed for October, but we have paid for
fencing. We need this clean info in the Costs section for the finance team to look at if needed." And: "With the labour
I need to know what the forecast labour is." And, sending the Baseplan export: "Sub-hired will normally be MISCITEM or SUB
— you literally have a lot of info."

## What it adds

A section **Accruals for Finance** sits under Month-end control on the Costs tab. Pick a work month (it opens on the last
complete month — September 2026 on 1 Oct) and it works out, from the record alone:

1. **Revenue earned in the month, not yet billed** (accrued revenue / WIP). Every Baseplan contract line is priced the way
   the P&L prices it (`contractCharge`) and put in its month: a line charged by the day (VMS, forklifts, water barriers)
   pro rata over its days on hire; a whole-event rate in the event's month; a transport or delivery charge line in the
   month it went in; the toilet lines named as the Event Portables rehire at our rates; the SUB lines as Rehire Revenue.
   Plus the fencing dockets dated in the month at the 2026 card (STPS), the labour ticked per piece on references that went
   in during the month, and — in the event's month — the toilets' servicing and the event labour scope. **Added across
   every month the revenue is the P&L's Revenue to the cent** ($555,929.95 against $555,929.94).
2. **Costs incurred in the month — invoice in, or still to come** (accrued expense): Advanced's dockets at their own sheet
   less the invoices recorded on the purchase orders (the PO's programme week gives its month); the Event Portables quotes
   (approved, no invoice, no PO) with a day-share the page marks as Finance's call; the carriers' charges on the loads dated
   in the month (the schedule's TPORT COST column); Job Connect's hours at their rates; accommodation, meals and expenses on
   the tracker; Coates people's hours for information only (payroll, no accrual — no wage rate on the record).
3. **Paid ahead of the revenue — the WIP question**: the fencing invoices in hand against the fencing charge not yet billed
   by STPS, put to Finance in one line: accrue the revenue, or hold the paid cost as WIP.
4. **Labour — the forecast, both sides** (whole job): labour to charge by kind (Labour Install = install, steps, levelling,
   demob; Cleaning; Fire extinguishers) × state (ticked so far · expected on site, not ticked · to come · later), plus the
   event labour scope; and labour cost as the running sheet's hours by month and kind of person, priced where a rate exists.
5. Four tiles, **Copy for Finance** (plain text for an email or note), **Export accruals CSV**, and a six-line glossary
   (accrual, unbilled revenue/WIP, accrued expense, deferral, reclass, reversing accrual and cut-off) in plain English.

Baseplan's own billing columns are read from the record's export: **0 of 307 contract lines billed** (export 24 Sep 2026)
— the evidence for "no branch has billed yet". Nothing is written to the record and no P&L figure moves.

## September 2026, as the record has it on 1 Oct 2026

| Revenue earned, not yet billed | branch | amount |
|---|---|---|
| Fencing — Rehire Revenue, dockets at the 2026 card (59 dockets) | STPS | $120,913 |
| Hire charged from the day it goes in (23 lines: water barriers, VMS) | STPS | $26,316 |
| Labour ticked per piece (161 ticks on 49 references) | KINP | $16,458 |
| Hire charged from the day it goes in — from the card (6 forklift lines) | NVAC | $11,656 |
| Transport Revenue — the delivery and transport lines | KINP | $2,000 |
| Labour ticked per piece (4 ticks) | NVAC | $625 |
| **Revenue earned, not yet billed** | | **$177,968** |

| Cost incurred in September | incurred | invoiced | to accrue | Finance |
|---|---|---|---|---|
| Fencing — Advanced, 62 dockets at their sheet + green-book labour share | $74,606 | $42,662 (invoices 4918492, 4922398) | $31,944 | Accrue |
| Toilets — Event Portables Q6845, 17 of 42 hire days in September | $21,950 day-share | — | $21,950 | Finance's call |
| Transport (cartage) — 37 loads with a TPORT COST figure (35 "and more") | $22,011 | not on the record | $22,011 | Check the invoice |
| Labour hire — Job Connect, 105 paid hours | $6,285 | not on the record | $6,285 | Check the invoice |
| Accommodation · meals · other expenses on the tracker | $5,476 · $1,381 · $719 | — | $7,576 | Check the claims |
| Coates people — 565 paid hours, no wage rate on the record | — | — | — | Payroll, no accrual |
| **To accrue** | | **$42,662** | **$67,815** (+ $21,950 Finance's call) | |

WIP question: Advanced's invoices in hand $42,662 against the fencing charge to the V8s $120,913, none of it billed by STPS.

October 2026 carries the event: the toilets at our rates $69,092 (KINP), the hire over the three race days, the servicing
$85,102, the scope $55,817 — $362,591 in all; November $15,371 (the barriers still out).

## The labour forecast (whole job)

| | ticked so far | expected on site, not ticked | to come | later — demob, cleaning | forecast |
|---|---|---|---|---|---|
| Labour Install (install, steps, levelling, demob) | $17,083 | $5,278 | $20,279 | $27,222 | **$69,862** |
| Cleaning (not labour) | — | — | — | $8,484 | $8,484 |
| Fire extinguishers (a hire charge) | — | $1,666 | $937 | — | $2,603 |
| Per piece, from the card (687 lines) | $17,083 | $6,943 | $21,216 | $35,706 | **$80,948** |
| Event labour — the scope (368.9 h) | | | $55,817 | | **$55,817** |
| **Labour to charge, all in** | | | | | **$136,765** (Labour Install + the scope $125,678) |

Labour cost, the running sheet's hours: September 670 h ($6,285 priced), October 1,028 h ($19,134), November 405 h
($6,406); whole job 2,103 h, priced $31,824 (labour hire only), 1,626 h with no wage rate — PARTIAL until Coates wage
rates are set. The per-piece forecast equals the page's labour plan to the cent (`labourPlan()`, 687 slots); the earlier
"straight card count" of $32,854 in the v7.60 README was a partial count and is withdrawn.

## Andrew's Baseplan export (1 Oct 2026)

`sources/Baseplan_SuperCars_2026-10-01.xlsx` (sha256 `4042835a…`). Compared with the export already in the record
(24 Sep 2026, 307 lines): the same 307 lines plus **one new line — 9961976-NVAC line 41, GN23 Distribution Board
Lifeguard 17 (Del Req, 30 Sep, no rate)**. The record already reads the Sales Analysis Code (KINP-HIR, STPS-SUB, KINP-FRI…),
the Item (SUB-2131, SUB-2527, MISCITEM), the Supplier Sub Rental code (ROY002, QUE011) and the billing columns from that
export; that is how the page already knows the SUB lines and the toilets' MISCITEM lines. All 308 lines carry no Last Bill
Date and Billed Amount 0. Not folded into the record here — a record rebuild is Codex's, and one line does not change a
figure on this page.

## Files

- `patch_v761.py` — guard `acc761Model`; helpers `acc761Model`, `acc761Labour`, `acc761Text`, `acc761Csv`, `acc761Html`,
  `acc761Bind` in front of `fin745Bind`; the section mounted after `fin745Html()` on the Costs pane; bound in
  `renderCosts`; styles after `.fin745-basis`. The month picker carries `data-ro` so the view link can change it (it
  changes nothing on the record).
- `evidence/practice_tests.js` — every month adds to the P&L's Revenue; the September fencing revenue, cost, invoices and
  accrual tie to the record; the labour forecast equals the plan; month switch; CSV and Copy captured (nothing leaves the
  page); no overflow on the phone; 0 errors. `practice_results*.json`, `copy_for_finance*.txt`, `GC500_Accruals_2026-09*.csv`,
  `shot761_*.png`, the sweeps.

## Build and evidence

`build/GC500_v7.61/GC500_Delivery_Control_hosted.html` on the live v7.59 (8,489,105 bytes), only `patch_v761.py`:
8,518,751 bytes, check_page PASS, key grep clean. With v7.60 before it (`build/GC500_v7.61b`): 8,527,820 bytes, PASS.
Practice test: desktop 16/16 and phone (MOB=1) 16/16 — every month adds to the P&L's Revenue, the September fencing figures tie to the record, the labour forecast equals the plan, month switch, CSV and Copy captured, no phone overflow, 0 errors. Sweeps on the build: desktop 21 tabs, 0 errors, 0 console; phone 21 tabs, 0 errors, 0 console. Pictures: `evidence/shot761_accruals.png` (desktop, full height) and `shot761_accruals_phone.png`.

Andrew, 1 Oct: "some of the toilets may not have MISC next to them too, so keep that in mind" — kept: the page classes every toilet line on the KINP contracts as the Event Portables rehire (family toilet, not only the MISCITEM ones — 37 MISCITEM lines and the rest carrying asset numbers), the same rule the P&L's By branch table uses.

Not for upload until Andrew says yes.
