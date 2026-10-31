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

Coates wages: KINP 391 · 457.5 · 215; STPS 12 · 78; NVAC 6 · 30. Salary: KINP 198 · 256 · 110. Labour hire: KINP 110.5 · 380.3 · 52.5,
STPS 8 (Oct); cost 6,284.23 · 25,618.71 · 3,023.85 = 34,926.79.

## Revenue

All 19 invoices are dated 27–30 Oct (1,003,037.12). Their dated hire lines with the waiver on them, by the days on hire: September
57,202.81 · October 343,496.87 · November 196,636.68; lines with no dates (services, sales, transport) 405,700.77 (the 1 cent is rounding).
Andrew's call pending: keep revenue in October as invoiced, or move the November hire days. Invoice 25124396 carries a 500.00 transport
line (2 × 250.00) the line parser missed; the invoice total was right.

## Not dated on the record

Transport: 14,647.65 of the load figures to date and 12,990.03 of the loads to come; Alfie Harris's 12 nights; the salary allowance; the
service lines on the invoices (405,700.77) until each is matched to the record.

## Staff hours by contract (added 31 Oct, on Andrew's ask)

Andrew: "can we mention Labour Hire their costs have been Coded to Installs . can we mention Contract Numbers where staff hours go to",
then "anything outside of KINP we mention the Contract. rest is KINP we dont need to mention contracts Nos". Labour hire is shown as
coded to Installs. Outside KINP the contract is named, from the hours on the running sheet's notes: water barriers 9972648 (STPS) 98 h
(Sep 12, Oct 86); generators 9961976 (NVAC) 36 h (Sep 6, Oct 30). Everything else is KINP with no contract number: 2,170.8 h
(Sep 699.5, Oct 1,093.8, Nov 377.5). By person in the sheet's sections 2b and 2c and the CSV.

Event Portables, Premiair and Royal Wolf (Andrew: "i cant find any invoices for them either"): none has an invoice on the record.
Event Portables 101,747.00 is the four unsigned quotes at the received and counted quantities (Q6845 42,175.00; Q6844 51,372.00;
Q6846 4,850.00; Q6847 3,350.00); checks: 51 block cleans at their rate against 33 charged to the V8s; 702 FWF services against 195 FWF
hired from them; Q6846's tank line printed 1 × 350.00 = 2,100.00. Premiair 3,806.31 is the contract's keyed cost rate (53.61 a day,
the same as the V8s' rate) × the hire days; it still costs line 15, which Baseplan (12) no longer has (536.10); VMS19 and VMS20 are
billed to the V8s at 0.00. Royal Wolf 1,364.23 is 9974042's keyed cost rate for the refrigerated container (line 2, 13–30 Oct),
billed to the V8s at 1,428.00 plus 1,000.00 delivery and 1,000.00 pickup.

## Accruals beside what we charged the V8s (added 31 Oct, on Andrew's ask)

Andrew: "we need to understand what we charged v8s for to do with this and state we are still waiting for invoice and this is the
esitimate cost. And we do same with fencing". Section 1b of the sheet: Event Portables charged 93,446.07 on the like-for-like lines
(25122322 FWF hire for their 195 units at 90.07, L98, L141, L142; 25123999 L19) against an estimated 101,747.00 (no invoice; their
delivery and pickup sit inside our toilet transport lines, 45,215.00 for ours and theirs); Advanced charged 370,888.55 on 25122628
against 214,225.00 invoiced plus an estimated 79,184.70 (POs 4647522, 4647523); Premiair 2,787.72 against an estimated 3,806.31;
Royal Wolf 2,428.00 (L2 and its delivery and pickup share) against an estimated 1,364.23.
