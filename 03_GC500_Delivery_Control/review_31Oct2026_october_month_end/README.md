# Review: October month-end, 31 Oct 2026 (Claude, read only, not live)

Author: Andrew Fisher. Nothing on the record changed. Andrew, in the Claude chat: "we want to know what is from each month ... whats in
sept. oct november", "this needs to be 1000% Accurate Advise of invoice numbers and P/O Numbers and we need to align Labour ... right up to
13/11/2026", and on the fencing: "we need to know what is still owing and what has not been Invoiced as this need to be journled".

From the live record (12640) through page v12.69 (`038bd277…`), the 19 invoices and the purchase orders. `build_monthend.py` writes the
page and CSV sent to Andrew (`GC500_October_month_end.*`, private); `build_final_pl.py` the final P&L sheet (now with the record's branch
names: KINP Brisbane Portables, STPS Brisbane Traffic, NVAC North Power and HVAC, MEAD Brisbane Mechanical Specialist; the names used
before were guesses and wrong) and its fencing journal section.

## Costs by month of work (ties to the P&L's 544,097.23)

September 135,278.94 · October 383,094.78 · November 25,723.51. Fencing by each docket, note and sheet line's date (Sep 99,664.50;
Oct 193,745.20); labour hire by the running sheet's day; Premiair by each line's hire days; Royal Wolf on site 13–30 Oct; Event
Portables Q6846 by its days (14 Sep–25 Oct, quoted 4,850.00), the rest October; consumables by PO date; accommodation and meals by date;
the salary allowance (no dates) by the salaried hours (198 · 256 · 110 h).

## To accrue at 31 Oct: 213,008.60 (work done, not invoiced)

Advanced 79,184.70 (event week 71,159.70 on PO 4647522, demob week 1 8,025.00 on PO 4647523; both this year's orders, open, nothing
invoiced on either yet: Andrew, 31 Oct, "4647522 and 4647523 are this years P/O these are still open") · Event Portables 101,747.00 (no PO or invoice on the record;
September's 1,963.10 as a catch-up) · Job Connect 24,348.75 (w/e 11 Oct 2,539.92 PO 4665091; w/e 18 Oct 6,198.75 POs 4667755/4668970;
w/e 25 Oct 11,774.71 POs 4670882/4671825; w/e 1 Nov 3,835.37 no PO) · Premiair 3,806.31 · Royal Wolf 1,364.23 · Alfie Harris's 12 nights
2,557.61. Accruals reverse on 1 Nov; the invoices land against them. Job Connect w/e 4 Oct: the running sheet is 178.00 over invoice
15294 (3,052.60).

## Labour to 13 Nov (hours; Coates wages and salary hours only)

Coates wages: KINP 391 · 385.5 · 215; STPS 12 · 78; NVAC 6 · 102 (Frank Devilles and Ludwig Chee, 36 h each over the event weekend,
moved from KINP to NVAC on Andrew's word, 31 Oct; see pack v1.2 below). Salary: KINP 198 · 256 · 110. Labour hire: KINP 110.5 · 380.3 · 52.5,
STPS 8 (Oct); cost 6,284.23 · 25,618.71 · 3,023.85 = 34,926.79.

## Revenue

All 19 invoices are dated 27–30 Oct (1,003,037.12). Their dated hire lines with the waiver on them, by the days on hire: September
57,202.81 · October 343,496.87 · November 196,636.68; lines with no dates (services, sales, transport) 405,700.77 (the 1 cent is rounding).
Revenue basis: the invoice month (October). Andrew's call is still open on moving the November hire days; the pack defaults to October as invoiced and shows the hire days by month for information only. Invoice 25124396 carries a 500.00 transport
line (2 × 250.00) the line parser missed; the invoice total was right.

## Not dated on the record

Transport: 14,647.65 of the load figures to date and 12,990.03 of the loads to come; Alfie Harris's 12 nights; the salary allowance; the
service lines on the invoices (405,700.77) until each is matched to the record.

## Staff hours by contract (added 31 Oct, on Andrew's ask)

Andrew: "can we mention Labour Hire their costs have been Coded to Installs . can we mention Contract Numbers where staff hours go to",
then "anything outside of KINP we mention the Contract. rest is KINP we dont need to mention contracts Nos". Labour hire is shown as
coded to Installs. Outside KINP the contract is named, from the hours on the running sheet's notes: water barriers 9972648 (STPS) 98 h
(Sep 12, Oct 86); generators 9961976 (NVAC) 108 h (Sep 6, Oct 102: the generators' 36 h and, from 31 Oct, Frank Devilles's and
Ludwig Chee's 72 h over the event weekend). Everything else is KINP with no contract number: 2,098.8 h (Sep 699.5, Oct 1,021.8,
Nov 377.5). By person in the sheet's sections 2b and 2c and the CSV.

Event Portables, Premiair and Royal Wolf (Andrew: "i cant find any invoices for them either"): none has an invoice on the record.
Event Portables 101,747.00 is the four unsigned quotes at the received and counted quantities (Q6845 42,175.00; Q6844 51,372.00;
Q6846 4,850.00; Q6847 3,350.00); checks: 51 block cleans at their rate against 33 charged to the V8s; 702 FWF services against 195 FWF
hired from them; Q6846's tank line printed 1 × 350.00 = 2,100.00. Premiair 3,806.31 is the contract's keyed cost rate (53.61 a day,
the same as the V8s' rate) × the hire days; it still costs line 15, which Baseplan (12) no longer has (536.10); VMS19 and VMS20 are
billed to the V8s at 0.00. Royal Wolf 1,364.23 is 9974042's keyed cost rate for the refrigerated container (line 2, 13–30 Oct),
billed to the V8s at 1,428.00 plus 1,000.00 delivery and 1,000.00 pickup.

## Accruals beside what we charged the V8s (added 31 Oct, on Andrew's ask)

Andrew: "we need to understand what we charged v8s for to do with this and state we are still waiting for invoice and this is the
esitimate cost. And we do same with fencing". Section 1b of the sheet: Event Portables charged 140,661.07 (25122322 FWF hire for their 195 units at 90.07,
L98, L141, L142 and the toilet transport lines L147–L149, L162, L167; 25123999 L18, L19) against an estimated 101,747.00 (no invoice;
Andrew: "We charge the v8s for transport for toilets"; the transport covers our own toilets too, whose carrier cost is in transport); Advanced charged 370,888.55 on 25122628
against 214,225.00 invoiced plus an estimated 79,184.70 (POs 4647522, 4647523); Premiair 2,787.72 against an estimated 3,806.31;
Royal Wolf 2,428.00 (L2 and its delivery and pickup share) against an estimated 1,364.23.

## The final P&L pack v1 (31 Oct, on Andrew's "Lets go over the P&L again ... accurate to the cent")

`build_monthend.py` now writes the pack: `GC500_PL_final.xlsx` (Summary, Revenue by invoice, Costs by supplier, Costs by branch,
Accruals vs charges, Journals, Labour by person, Open items) and `GC500_PL_final.html` (private). It supersedes the separate final
P&L sheet (`build_final_pl.py`). Every sheet cross-foots to the cent: revenue 1,003,876.19 (19 invoices 1,003,037.12 + November
forecast 839.07); costs 543,382.98 (Sep 135,187.78 · Oct 382,488.71 · Nov 25,706.49 after the salary allowance fix; KINP 229,400.58 · STPS 302,809.37 · NVAC 9,935.80 ·
MEAD 1,237.23); difference 460,493.21; accruals at 31 Oct 212,472.50 = the journals.

Defaults applied and told to Andrew (his call to reverse): Job Connect w/e 20 Sep and 4 Oct at their invoices (−0.15, −178.00 against
the running sheet); Premiair line 15 (536.10) out of the estimate (not on 9961265 in Baseplan (12)); Frank Devilles and Ludwig Chee on
KINP until he confirmed their event roles (settled 31 Oct: NVAC, see pack v1.2); revenue kept in October as invoiced. The concert sync PO 4670270 sits on NVAC by its GL code
(201.NVAC.2144.0); Kyle Gover's 8 h of labour hire on the water barriers (460.78) is journaled to STPS. Codex asked to audit
independently, PR1 6541369248.

## Basis and status, labelled once (31 Oct, after Codex's 6541370424)

- Revenue: invoice month (October) for all 19 invoices, on Andrew's word (31 Oct: "Yes they should. But we can still mention novembwr but invoiced in october"). The November hire days on them (196,636.68) are named as invoiced in October, not moved. The 839.07 generator pick-up charge is a November forecast, not invoiced.
- Advanced: 214,225.00 invoiced and receipted; 79,184.70 an ESTIMATE (our dockets and notes at their rates) until invoices on POs 4647522 and 4647523; 750.00 a forecast for demob week 2.
- Event Portables 101,747.00, Premiair 3,270.21, Royal Wolf 1,364.23, Job Connect w/e 11 Oct to 8 Nov, Alfie Harris's 12 nights: ESTIMATES, no invoice seen.
- Defaults applied pending Andrew: Job Connect at its invoices where received; Premiair line 15 out; revenue in October.
- `build_final_pl.py` is superseded by the pack in `build_monthend.py`; its fencing note no longer says "nothing estimated".

## Pack v1.2: Frank Devilles and Ludwig Chee on NVAC (31 Oct)

Andrew, asked which roles they did over the event weekend: "Mechanic and electrician." On 29 Oct he had asked "So labour costs for
nvac for my mechanic and electrician should this go to nvac over event ?" (answered yes: NVAC bills the Event Gen Tech). Both
people's 36 h (23–25 Oct, 12 h a day, on KINP before) now sit on NVAC 9961976. The record doesn't say which of them is the
mechanic and which the electrician, and the pack doesn't need it. Hours only, so costs, accruals and journals are unchanged. NVAC
bills one Event Gen Tech, the event labour scope's one a day (31 h on 25121022; 4 h on KINP's 25123999). Open: Ludwig Chee's three
event nights (655.71) stay in KINP's accommodation unless Andrew moves them with his hours.

The page (`GC500_PL_final.html`) had printed sections 2, 3 and 4's tables and amounts as raw code since v1, because the segments
after the inserted tables weren't evaluated. That's fixed, and the sections are numbered once each (4 the undated items, 5 the
journals, 6 the open items). The workbook is built separately and was right throughout.

## Pack v1.3: the hire contract and PO on every line; Ludwig Chee's nights on NVAC; November named (31 Oct)

Andrew: "Yes they should. But we can still mention novembwr but invoiced in october. We need to make sire we mention hire contract
nos.and p/o numbers so we know where things maych up." Asked where Ludwig Chee's three event nights should sit: "Move to NVAC".

- **November:** revenue stays in October, the invoice month. The November hire days on those invoices (196,636.68) are named on
  the revenue tile, in section 3 and on the revenue sheet as "invoiced in October". The open decision is closed.
- **Ludwig Chee's nights:** his three event nights (23–25 Oct, 218.57 each, 655.71, checked on the live record with
  `inputs/ludwig_nights.cjs`) move from KINP's accommodation to NVAC with his hours. KINP is now 228,744.87 and NVAC 10,591.51.
  A branch-move journal sits beside Kyle Gover's (460.78 KINP → STPS).
- **Contracts and POs:** every cost line carries the hire contract and V8s invoice it's charged on, beside its PO (CSV, workbook,
  page section 1). The journals carry the contract too. Section 3 and the revenue sheet list the POs against each contract.
- **Match-up:** new section 3b and workbook sheet "Match-up by contract". It lists every invoiced contract, what's on it (the
  invoice's biggest lines), and the POs and costs against it. Costs that nothing ties to one contract are listed apart, with the
  reason. Tied to a contract 420,322.07 + not tied 123,060.91 = 543,382.98 (asserted).
- **Carriers:** tied to contracts by each load's delivery docket, through Baseplan (12)'s docket list. That covers 15,546.12 of
  the 33,150.09 to date: 9968862 8,670.72, 9968955 4,350.00, 9972648 1,380.00, 9961976 870.00, 9974042 275.40. Another 17,033.97
  has no docket on the record, and docket 26095295 (570.00) isn't in Baseplan (12).
- **How each PO is linked:** all 23 POs on the record are in the pack, and none carries a contract field. A contract is named only
  where the record ties it:
  - the PO itself says so: 4663216 "for the GC500 fencing" → 9990776; 4670270's note → 9994954;
  - the work is that contract: Advanced → 9990776;
  - the V8s are charged for it on that contract's lines: Event Portables → 9968955 and 9994954; Premiair → 9961265; Royal Wolf
    → 9974042.
  POs 4655573, 4666720, 4669481 and 4670876 name no contract, and the pack says so.
- **Totals unchanged:** revenue 1,003,876.19, costs 543,382.98, accruals 212,472.50.
