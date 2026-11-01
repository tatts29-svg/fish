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

- Revenue: invoice month (October) for all 19 invoices, on Andrew's word (31 Oct: "Yes they should. But we can still mention novembwr but invoiced in october"). The hire for days in November on them (196,636.69 from v1.4) is named as invoiced in October, not moved. The 839.07 generator pick-up charge is a November forecast, not invoiced.
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

## Pack v1.4: Codex's code corrections (31 Oct)

Codex reviewed v1.2 against Andrew's originals. The public source-only notes are in
`../review_31Oct2026_pl_independent/PACK_v12_CODE_REVIEW.md` (PR1 6542008260); the detailed private findings went to Andrew for
the handover and have **not reached Claude yet**. v1.4 applies the five public corrections on top of v1.3:

| Codex's note (v1.2 lines) | What v1.4 does |
|---|---|
| Residual policies differ (151, 164, 227, 370) | One revenue model for every output. Each invoice's services stay as sourced (the undated lines plus any remainder the line parser missed). Its hire lines and their waiver are split across the months by days on hire, and the cents are reconciled once, by largest remainder. The page, CSV and workbook all read the same numbers. Every row adds up to its ex GST exactly (asserted), and the 19 invoices add up to exactly 1,003,037.12; v1.3 was 1 cent over. Four invoices move by one cent between a month and services, so November hire is now 196,636.69 (196,636.68 in v1.3). |
| Labour hire cost hardcoded to KINP (225) | Labour hire cost rows now go by the branch that received the hours (KINP, plus STPS 460.78), labelled "running sheet basis" (34,926.79). They stay separate from the P&L's invoice basis (34,748.64, Job Connect's invoices where received). The page and CSV say which basis is which. |
| Month headings say days but show money | The headings read "Sep / Oct / Nov hire $ (with waiver)" and "Services, sales, other $". The day weighting is explained in the text, and the revenue tile says "hire (with waiver) for days in November". |
| No print rules for the page | Added an A4 landscape print layout: full width, no scroll clipping, repeated table headers, light colours. It was checked as a real PDF: 9 pages, no table overflowing in print, all 14 section headings, and every right-hand column present. That PDF is in the zip as `GC500_PL_final.pdf`. |
| Workbook print setup | Narrative cells wrap. Every sheet is set to A4 landscape fitted to width, with the header row repeated, a set print area, and the date, currency and tax basis in the page header with page numbers in the footer. The Summary sheet states the basis, and the wide sheets were narrowed so they print legibly. Checked by printing the workbook to PDF with LibreOffice: 13 pages, median text 7.1 to 11 pt, all right-hand headers present. |

Output hashes (SHA-256, private files not committed): HTML `cd349c63…`, XLSX `2c64624d…` (the XLSX carries build timestamps,
so it changes on every build), CSV `9d59f0a3…`, page PDF `c3ebe852…`. Builder `fd421748…`. Totals unchanged: revenue
1,003,876.19, costs 543,382.98, accruals 212,472.50.

## Pack v1.5: Codex's private audit applied (1 Nov)

Andrew passed Codex's private audit of v1.2 to Claude on 1 Nov. It stays private and is not in this repository. Each finding was
checked against the source before it was applied:

| Finding | v1.5 |
|---|---|
| F01 one cent model | Done in v1.4; unchanged. |
| F02 two invoices are STPS | 25120652 and 25120689 move KINP → STPS. Their invoice headers say "Staplyton (S)" and Baseplan (12)'s Sales Analysis Codes are STPS-CON; only the sheet names say KINP. Job revenue is unchanged. |
| F03 transport dates | Every transport row goes in by its own date on the schedule, each once: the recorded figures, the forecasts on loads with no figure, and the planned loads. No undated transport is left. |
| F04 Alfie's nights | The 8 October nights are accrued and the 4 November nights are forecast. October is taken from the unrounded mean; the balancing cent sits in November (`inputs/alfie_nights.cjs`). |
| F05 salary window | Split by the salaried hours inside the record's window (labourAllowance858, 14 Sep–13 Nov). |
| F06 toilet transport | The comparison now includes 25123999 L24. |
| F07 labour label | Done in v1.4. |
| F08 billed hours | The gen tech hours are now shown exactly as Baseplan prices them. |
| F09 hours precision | The labour CSV keeps the source's two decimals (`inputs/build_sheet.py`), and the pack shows hours at the source's precision. |
| F10 future meals | November's meal lines are labelled "recorded ahead", not "actual". |
| F11 interbranch | The branch moves are a zero-net schedule with both legs shown. |
| F12 print | The page prints landscape by CSS. Also checked at portrait width: no table overflows. |
| F13 units | The revenue columns name AUD ex GST, and the section headings drop "hire days". |
| F14 workbook | Done in v1.4; re-checked through LibreOffice. |
| Retained decisions | Codex's customer-scope and Event Portables reference items are now open items for Andrew. Comparison wording is "no identified matching charge". The fencing comparison says what it leaves out, Royal Wolf's transport is labelled an equal share, and supplier estimates stay estimates. |
| Ludwig's nights | Codex's bundle predates Andrew's ruling (31 Oct: "Move to NVAC"). v1.3's move stands. |

Job revenue, job cost and branch costs are unchanged. The months, the accruals and the KINP/STPS revenue move exactly as in Codex's
bridges, and the builder asserts each figure.

## Pack v1.6: invoice 25124396 out of GC500 revenue (1 Nov)

Andrew, on Codex's customer-scope item: "Good pick up.. remove Invoice 25124396 please." The invoice (contract 9994248) is to Gold
Coast Helitours (customer CASH-STPS), not the V8s. It comes off GC500 revenue, and the pack now has 18 invoices. It stays visible as
a "removed" row on the revenue sheet with no amount, and section 3 says why. No cost on the record ties to it: no Baseplan (12)
docket, no carrier figure and no cost line names 9994248. Costs, months and accruals are unchanged, and STPS revenue and the job's
revenue each drop by that invoice. The builder asserts the 18-invoice totals.

## Pack v1.7: Alfie Harris's nights at his tracker rate; facts only; a full audit (1 Nov)

Andrew: "Just use the accomodation rate we been using for him last week", and "We dont want to see this is based off andrews word.
We need clean nunbers. And fact."

- **Alfie's 12 unpriced nights:** costed at 223.63, the rate on all 8 of his latest priced nights on the tracker (26–29 Oct and
  2–5 Nov). The 8 October nights are accrued (1,789.04) and the 4 November nights are forecast (894.52). Job cost rises by 125.95
  against the earlier mean-rate figure.
- **Facts only in the outputs:** the page, workbook and CSV now state each basis as a fact (rate, date, contract, rule). The
  "your call", "your word" and "Andrew, <date>" wording is gone. The decisions behind them stay in this README and on the board,
  which are the audit trail.
- **`audit_pack.py`:** a new independent audit that recomputes the figures from the private inputs, not from the builder, and
  checks the workbook, page and CSV against them and each other to the cent. It covers:
  - revenue by invoice and branch;
  - carriers by date;
  - accommodation, meals, salary window and Job Connect weeks;
  - every PO amount and the Advanced and Event Portables totals;
  - costs by supplier against costs by branch, the match-up, the journals and the CSV;
  - labour hours and dollars;
  - a facts-only text check.

  Result on v1.7: 159 checks, 159 pass. Run it with `python3 -I audit_pack.py <pack_dir> <progress_dir> [alfie_nights.json]`.

## Pack v1.8: Alfie Harris's 12 nights on the record at 223.63 (1 Nov)

Andrew: "Yes enter 223.63 for Alfie's nights on the record".

- **The record:** the 12 nights now carry 223.63 on the live record. They were written through the page's own `setOurCost`,
  in Andrew's name, with a dry run and a backup first and a fresh read after. Record 12640 → 12676, 36 documents. The run
  is in `../record_01Nov2026_alfie_accommodation/`.
- **The pack:** the figures are unchanged from v1.7:
  - revenue 1,001,902.14;
  - job cost 543,508.93 (Sep 147,015.00 · Oct 379,690.51 · Nov 16,803.42);
  - to accrue 211,703.93.

  The rows now say the nights are on the record from 1 Nov, and every output names record 12676 (page, workbook header,
  CSV).
- **Checked against the record as it now stands:** `inputs/dated_costs.cjs` was run again on 12676 (new `OUT` setting; each
  cost line now carries its person and id) and compared with the 12640 capture:
  - labour, transport and fencing are identical;
  - the cost lines differ only in Alfie's 12 amounts;
  - accommodation on the record is 112 lines, all priced: Sep 6,370.36 · Oct 13,640.93 · Nov 4,696.23. The pack's three
    accommodation rows (97 nights on KINP, Ludwig Chee's 3 on NVAC, Alfie's 12) equal it by month, to the cent.
- **Labour:** the labour register was captured on record 12622 and the labour sheet says so. The two record runs since
  changed no labour line, and each run's read-back found every other document unchanged:
  - six purchase orders, 12622 → 12640;
  - Alfie's nights, 12640 → 12676.
- **`audit_pack.py`:** takes the 12676 capture as a fourth argument and checks all of the above. Alfie's 12 nights must
  now carry 223.63, as the pack says. Result on v1.8: 171 checks, 171 pass. Run on the 12640 reads instead, it fails, as
  it should.
- **Printed:** the page is 9 pages, A4 landscape, with no table overflowing at landscape or portrait width. The workbook
  is 12 pages, A4, through LibreOffice.

Run it: `python3 -I audit_pack.py <pack_dir> <progress_dir> alfie_nights.json dated_costs_now.json`.

## Pack v1.9: two independent audits, Codex's v1.8 recheck, and new facts from Andrew (1 Nov)

Andrew: "Audit again talk to codex". Two independent audits ran; neither used the builder or `audit_pack.py`:
- **Audit A:** revenue re-read from the 19 original invoice PDFs and Baseplan (12), and every figure cross-checked across
  the page, workbook, CSV and printed PDF.
- **Audit B:** costs, accruals and labour rebuilt from record 12676.

Neither found an arithmetic difference. Each finding below was verified against the source before it went in. Codex's v1.8
recheck (`../review_31Oct2026_pl_independent/PACK_v18_RECHECK.md`) asked for four source fixes; all four are in.

**Record change (1 Nov, `../record_01Nov2026_alfie_nights_off/`).** Andrew: "alfie nevere worked 23-25". Alfie Harris's
23–25 Oct nights were taken off through the page's own `removeOurCost`. Record 12676 → 12685; every other document unchanged.

**New sources from Andrew (private, not committed):**
- **Suppliers export:** the sub-hire cost lines in Coates' system for 9961265 and 9974042. These are the only two contracts
  with sub-rental lines in Baseplan (12). 9968955 has none, so Event Portables' cost still waits on their invoice.
- **Job Connect invoice amounts:**

  | PO | Week ending | Invoice amount |
  |---|---|---|
  | 4665091 | 11 Oct | 2,636.56 |
  | 4670882 | 25 Oct | 6,069.48 |
  | 4671825 | 25 Oct | 5,244.91 |

  These are in `jc_pos.json` beside the 12685 captures.

**What changed.** Each item maps to a finding: A = audit A, B = audit B, C1–C4 = Codex.

| Item | Change |
|---|---|
| Alfie Harris | 9 nights: 5 in October, accrued; 4 in November, forecast. Accommodation equals the record's 109 lines by month. |
| Premiair (B3, A3) | The system's cost lines for the eight boards on 9961265 (36.25 a day; VMS24 26.00 on NVAC). VMS11 is billed on 10001927 L1 and has no cost line: estimated at 7 days × 36.25. Replaces the 53.61 customer rate. |
| Premiair comparison (A3) | VMS19 and VMS20 are billed on 10001927 L7–L8, and VMS11 on L1. |
| Royal Wolf | Its cost line confirms the figure: 32 days at 42.63. |
| Job Connect | w/e 11 Oct and w/e 25 Oct are at their invoice amounts and, being invoiced, are not accrued. w/e 18 Oct stays at the running sheet until both its POs' amounts are in (4667755 and 4668970). Eric Lucian's week is 2,435.83 on Job Connect's charge; only his GC500 hours (10.5 h on 14 Oct) are journaled to KINP, as the pack already has them. |
| Transport by branch (B1) | A load with no branch on the record goes by what it carries: the 11 fencing loads to STPS; forklifts to MEAD; VMS moves to STPS; the generator trailer to NVAC; buildings, the event container and a fridge to KINP. Captured by `inputs/transport_loads.cjs` on 12685. The job total is unchanged. |
| Match-up (C1) | Forecast loads whose docket Baseplan (12) ties to a contract sit against that contract and stay forecast. The rest stay untied; nothing is counted twice. |
| Line references (A1) | ACCOM / ETC is 9968862 L140 and 9968955 L163; sync labour is 9994954 L13. These are contract lines, not the invoices' own line numbers. |
| PM labour (A5) | 15.22 h. |
| Labour sheet (A4) | `inputs/build_sheet.py` puts Frank Devilles' and Ludwig Chee's event hours on NVAC by role, so the sheet matches the pack. |
| Accounts (B5, B8) | Accommodation is 3520 only. The Event Portables journal is split 2126 hire and 3325 servicing. |
| Labels (B6, B4, A7) | Q6846 is water deliveries and a drinking-water tank. The transport row labels are corrected. Other wording: the title, the revenue tile, 38 building shells and 4 booths or ticket offices, a site shift listed as equipment, "time on hire". |
| Open items (B7, A2, A7) | Added: the page's unpriced movements, Advanced's hourly relocation and removal, 9974042's billing from 28 Sep, and the unbilled 9968955 L143. The 350 kVA transport is shown as already billed. The accruals not made here are named, for Finance. |
| Outputs (A7) | Total rows on every money sheet. The CSV gets its revenue total, the forecast row and the removed invoice. |
| Hours display (C3) | Hours show two decimals in the workbook. |
| Open items printing (C2) | Row heights are set for wrapped text. Every note prints in full in the LibreOffice PDF, checked line-end to line-end. |
| Section 1b (C4) | The introduction now agrees with the comparison's WB13 exclusion. |

**Defaults, pending Andrew's ruling.**
- **Fencing cartage:** on STPS.
- **Accruals:** carrier loads and consumables POs are not accrued here; named for Finance.
- **Premiair basis:** the system's cost lines, as above.

**v1.9 figures:**
- revenue 1,001,902.14 (unchanged);
- costs 541,726.65 (Sep 147,015.00 · Oct 377,908.23 · Nov 16,803.42);
- difference 460,175.49;
- to accrue 195,970.70;
- branch costs: KINP 215,732.83 · STPS 315,081.00 · NVAC 8,510.62 · MEAD 2,402.20.

**`audit_pack.py`** now also checks:
- Premiair and Royal Wolf against the suppliers export, line by line;
- transport by branch, recomputed from the loads;
- the forecast docket ties;
- the Job Connect PO weeks;
- references, labels, total rows and the hours format.

Result on v1.9: 209 checks, 209 pass. Run on the 12676 reads instead, it fails, as it should.

**Printed:** the page is 10 pages, A4 landscape, with no table overflowing. The workbook is 17 pages through LibreOffice,
and all 13 Open items print in full.

Run it: `python3 -I audit_pack.py <pack_dir> <progress_dir> <12685>/alfie_nights.json <12685>/dated_costs.json`. The 12685
folder also holds `transport_loads.json`, `suppliers.xlsx` and `jc_pos.json`.

## Pack v1.10: Daniel Gough's November POs and the shifts to 13 Nov (1 Nov)

Andrew:
- "New P/o for Daniel 4674224 week Ending 08/11/2026 $3,052.6000";
- "4674225 = $3,052.6000 W/E 15/11/2026";
- "Can we have Daniel Working Monday to Friday Up to 13/11/2026 Same with me and Alfie and Aaron.... and no Aaron on
  30/10/2026 and 06/11/2025 and 13/11/2026 …".

**Record change (1 Nov, `../record_01Nov2026_shifts_to_13_nov/`).** Made through the running sheet's own controls:
- Daniel Gough's ten 06:30–17:00 days from 2 to 13 Nov put back (Put back);
- Alfie Harris's Mondays 2 and 9 Nov to 06:00 (the time boxes);
- Aaron Zelvis's Fridays 6 and 13 Nov taken off (Take off).

Andrew's own days were already 06:00–17:00. Record 12685 → 12715; every other document unchanged.

A fresh capture on 12715 differs from 12685 only in Daniel's ten days at 634.98 each. Accommodation, transport and fencing
are identical.

**New source (private, not committed):** Daniel Gough's POs, in `jc_pos.json` beside the 12715 captures. They are PO amounts
for weeks not yet invoiced:

| PO | Week ending | Amount |
|---|---|---|
| 4674224 | 8 Nov | 3,052.60 |
| 4674225 | 15 Nov | 3,052.60 |

**What changed.**

| Item | Change |
|---|---|
| Job Connect w/e 8 Nov | Daniel at PO 4674224 (3,052.60) plus Kyle Gover at the running sheet (3,023.85) = 6,076.45, November. The running sheet has Daniel at 3,174.90 that week. |
| Job Connect w/e 15 Nov | New row: Daniel at PO 4674225 (3,052.60), November. The running sheet has him at 3,174.90. |
| Labour sheet | Rebuilt on 12715. Daniel +105 h (10 × 10.5 h), Aaron −22 h (Fridays 6 and 13 Nov), Alfie +1 h (Mondays at 11 h). The running sheet's labour hire, job end, is 41,276.59 (was 34,926.79). |
| Open items | Job Connect still needed: the w/e 18 Oct invoices (4667755, 4668970), the PO and invoice for w/e 1 Nov, Kyle Gover's PO and invoice for w/e 8 Nov, and the invoices on 4674224 and 4674225. |

**v1.10 figures:**
- revenue 1,001,902.14 (unchanged);
- costs 547,831.85 (Sep 147,015.00 · Oct 377,908.23 · Nov 22,908.62), up 6,105.20 in November;
- difference 454,070.29;
- to accrue 195,970.70 (unchanged: November is forecast, not accrued);
- branch costs: KINP 221,838.03 · STPS 315,081.00 · NVAC 8,510.62 · MEAD 2,402.20.

**`audit_pack.py`** now also checks:
- record 12715 against 12640: the labour hire shifts plus Daniel's ten days, nothing else;
- the labour sheet against the shifts as set, person by person and day by day for 2–13 Nov:
  - Daniel 10.5 h;
  - Andrew 11 h;
  - Alfie 11 h on Mondays, 10.5 h on other days;
  - Aaron Mon–Thu 11 h, no Fridays;
- w/e 8 Nov = PO 4674224 + Kyle's running sheet;
- w/e 15 Nov = PO 4674225, with Daniel alone on the running sheet;
- both weeks in November and not accrued;
- the P&L labour hire from the running sheet, the invoices and the POs.

Result on v1.10: 247 checks, 247 pass (with the final P&L as data, `GC500_PL_final.json`, checked against the workbook to the cent). Run on the 12685 reads instead, it fails on exactly the four things that changed, as
it should.

**Printed:** the page is 10 pages, A4 landscape, with no table overflowing at landscape or portrait width. The workbook is
17 pages through LibreOffice, and all 13 Open items print in full.

Run it: `python3 -I audit_pack.py <pack_dir> <progress_dir> <12715>/alfie_nights.json <12715>/dated_costs.json`. The 12715
folder also holds `transport_loads.json`, `labour_register.json`, `suppliers.xlsx` and `jc_pos.json`.

## Pack v1.11: Job Connect named as its supplier in Coates' system (1 Nov)

Andrew gave Job Connect's supplier code and registered name in Coates' system (1 Nov 2026, this chat). They sit in the
private `jc_pos.json` beside the 12715 captures, and the builder reads them from there, so neither is written in this
public repository.

**What changed.** Names only; no figure moves. The supplier's code and registered name now appear on:
- every Job Connect line (9);
- the Job Connect accrual journal;
- the match-up row;
- the KINP branch line;
- the Job Connect open item.

This lets Finance post against the right supplier.

Figures are unchanged from v1.10:
- costs 547,831.85;
- to accrue 195,970.70;
- difference 454,070.29;
- branch costs unchanged.

**`audit_pack.py`** now also checks that the supplier's code and name are in the private file and on every Job Connect line,
the accrual and the open item. Result: 250 checks, 250 pass.

**Printed:** the page is 10 pages and the workbook 17, with all 13 Open items in full.

**The live P&L tab** stays on pack v1.10 (v12.72). Its figures are identical; it takes the supplier names with the next tab
rebuild.

## Pack v1.12: labour charged by branch; Alfie's 12–15 Oct nights off; the Event Portables 7 units not mentioned (1 Nov)

Andrew, 1 Nov 2026 (this chat):
- "alfie never worked 12–15";
- "yes to 5" (the labour-charged table onto the P&L tab);
- "the 7 if they are excluded we dont mention";
- "4658653 is job connect".

**Record change (`../record_01Nov2026_alfie_12_15_off/`).**
- Alfie Harris's 12, 13, 14 and 15 Oct nights were taken off through the page's own `removeOurCost`, record 12715 → 12727.
- The backup was kept private.
- A fresh capture on 12727 differs from 12715 only in those four nights. Accommodation is 105 lines, 23,142.11.

**What changed.**

| Item | Change |
|---|---|
| Alfie Harris | 5 nights: 5 Oct (accrued, 223.63) and 9–12 Nov (forecast, 894.52). October and the accrual fall by 894.52. 5 Oct stays an open item (no shift for him that day; confirm against the hotel invoice). |
| Labour charged by branch (new section 2d; workbook sheets "Labour charged" and "Labour lines") | Every line the 18 invoices code LABOUR, as invoiced, on the branch that invoices it: KINP 67,542.02 (16 lines), STPS 38,699.96 (5), NVAC 9,980.59 (5), MEAD nil; 116,222.57 in all. Beside each: the labour hire already coded to Installs in this pack (KINP 40,029.38, STPS 460.78), and what is left for people's cost journaled to Installs (KINP 27,512.64, STPS 38,239.18, NVAC 9,980.59). Notes: Advanced's installation (2142) on STPS is fencing subcontract labour and is not taken off; MEAD's scissor lift with an operator is a hire line; the fence relocation and ACCOM / ETC lines are not coded labour. |
| Event Portables | The 7 units at references an earlier rule leaves out are no longer mentioned (open item removed); nothing in the costs changes, as the cost is their quotes. |
| PO 4658653 | Job Connect's (1,838.10). It is not on the record and matches no week on the running sheet, so it is not in the costs until its week is known (Job Connect open item). |

**v1.12 figures:**
- revenue 1,001,902.14;
- costs 546,937.33 (Sep 147,015.00 · Oct 377,013.71 · Nov 22,908.62);
- to accrue 195,076.18;
- difference 454,964.81;
- branch costs: KINP 220,943.51 · STPS 315,081.00 · NVAC 8,510.62 · MEAD 2,402.20.

**`audit_pack.py`** now also:
- works the labour charged out again from the invoice lines and checks it against the workbook, the labour lines sheet and the tab's data, with what is left equal to charged less the labour hire on Costs by branch;
- checks the Event Portables units are not mentioned;
- has Alfie's checks at five nights on 12727.

Result: 269 checks, 269 pass. Run on the 12715 reads it fails on exactly Alfie's four nights, as it should.

**Printed:** the page is 11 pages and the workbook 20, with all 12 Open items and the four labour notes in full.

Run it: `python3 -I audit_pack.py <pack_dir> <progress_dir> <12727>/alfie_nights.json <12727>/dated_costs.json`.

## Pack v1.13: transport checked against Schedule 17; generators on NVAC and forklifts on MEAD; PO 4669481 at 42.33; the V8s' PO on every contract (1 Nov)

Andrew, 1 Nov 2026 (this chat), on Schedule 17: "lets make sure we double check this for any transports costs in here we may of missed.
obviously you know where things belong to VMS and Generators and forlifts etc belong to their brances". He gave each contract's header
("contract = PO") and the six consumables POs as Coates' system has them ("we alwasy talk in ex gst").

**Schedule 17 against every load on the record (new section 2e; workbook sheet "Schedule 17 transport").**
- 72 rows carry a figure (35,186.85). 57 tie to the record's loads to the cent (29,406.85). WC60 (870.00) and WC01 (570.00) carry the
  same money on other dockets.
- 12 change the costs: +4,340.00 of figures, less 2,513.61 of forecasts they replace, so +1,826.39 (September +570.00, October +1,256.39).
  - Not counted before: GN20's 365 kVA delivery (570.00; its row was lost when GN20 was deleted on 20 Oct and re-added as GN20-A),
    FL03 and FL04 (290.00 each), WC09 (580.00), WB04 and WB05 (290.00 each).
  - A forecast replaced by the figure: GN26, the concert generators (580.00, was 651.56), GN13, P45 and P69 (290.00 each, were 300.39),
    T0128 (290.00, was 480.44), T0109 (290.00, was 480.44).
- Every change is one Schedule 17 row; its docket ties it to the hire contract in Baseplan (12). WC01's 570.00 now ties to 9968955 by
  its own docket, 26102678, so the "docket not in Baseplan (12)" item is gone.
- Kept: the 15 and 17 Sep fencing loads, listed on Schedule 17 with the dollar column blank (1,151.62 each, the 2-semi rate).

**Transport by the equipment it moves.** The concert generators' delivery sits on NVAC (the record had KINP). The three September
forklift deliveries on 9961976 (T0003–T0005, 1,773.08) sit on MEAD (the record had NVAC). Their hire stays where it is invoiced.

**PO 4669481** (siphon hose) is 42.33, not 42.34: 2 × 21.1650 in Coates' system; the printed PO rounds the unit cost to 21.17. The
record still says 42.34 until Andrew says to correct it there.

**The V8s' PO on every contract and invoice**, as keyed (sections 3 and 3b; the Revenue by invoice and Match-up sheets). 9994954 is
keyed "P0 07.04" (and printed so on 25123999), 10000484 "P28607". P029416 is on four contracts and P028613 on two.

**Open items:** the consumables POs' status in Coates' system (4663216 is received in full and not invoiced); the L143 6,246.00 spelt out;
9994954 invoiced to 26 Oct; POs 4647983 and 4654789, in the hire notes on 9961976 but not in the costs.

**v1.13 figures:**
- revenue 1,001,902.14 (unchanged);
- costs 548,763.71 (Sep 147,585.00 · Oct 378,270.09 · Nov 22,908.62);
- to accrue 195,076.18 (unchanged);
- difference 453,138.43;
- branch costs: KINP 220,851.17 · STPS 315,470.56 · NVAC 7,877.14 · MEAD 4,564.84.

**`audit_pack.py`** now also:
- reads Schedule 17 again from the workbook itself (SHA-256 pinned) and works out the 72 rows, the 57 ties, the 12 changes and what each
  replaces on the record, independently of the builder;
- puts generator transport on NVAC and forklift transport on MEAD by rule, and checks Costs by branch against it;
- checks the six consumables POs against Coates' system, and that the record's 4669481 is exactly one cent over;
- checks the V8s' PO on every contract on the page, both sheets and the tab's data.

Result: 388 checks, 388 pass.

**Printed:** the page is 12 pages and the workbook 26 (LibreOffice), no table overflow at landscape or portrait width.

## Pack v1.14: the two forklift POs in the costs; PO 4658653 out; Job Connect carried as it stands (1 Nov)

Andrew, 1 Nov 2026 (this chat), on POs 4647983 and 4654789 (screenshots of both in Coates' system): "these are a cost to Coates".
On PO 4658653: "are we missing one ... if not remove this one then". On Job Connect: "no job connect paperwork i given you what i know".

**The forklift POs (Queensland Forklifts), +3,770.00, ex GST = qty × unit cost.** Both forklifts are on 9961976 at 0.00 as Coates' own
use (L31 and L34), so nothing is charged to the V8s for them. Each sits on the branch it is raised on.

| PO | What | ex GST | Months | Branch | Status in Coates' system (1 Nov) |
|---|---|---|---|---|---|
| 4647983 | 5 t forklift re-hire (1.8 m tynes) for the fencing at Phillip Park, 9961976 L31: 3 weeks 900.00 · 4 weeks 2 days 1,320.00 · 2 weeks 600.00 | 2,820.00 | Sep 900.00 · Oct 1,320.00 · Nov 600.00 | STPS | partly received (900.00), nothing invoiced: an estimate until invoiced |
| 4654789 | AT009 2.5 t RT forklift for Coates' use, 17–18 Sep, 9961976 L34 | 950.00 | Sep | MEAD | completed, received and invoiced |

4647983's lines go in turn from the hire start on L31 (11 Sep), each in the month it mostly falls in (21, 30 and 14 days). Neither PO
is accrued here: like the consumables, their status comes from Coates' system and Finance confirms any manual accrual (the Not
accrued here item names 4647983's 1,920.00 not received).

**PO 4658653 (Job Connect, 1,838.10) is out of the pack.** Every Job Connect week on the running sheet, w/e 20 Sep to w/e 15 Nov, already
has its PO or invoice or is carried at the running sheet, and 1,838.10 matches none of them. It was never in the costs; only its note goes.

**Job Connect, as it stands:** invoices where received; w/e 18 Oct and w/e 1 Nov at the running sheet (accrued); Daniel Gough's
November weeks at his PO amounts; Kyle Gover's w/e 8 Nov at the running sheet. The open item now says so and asks for nothing more.

**v1.14 figures:**
- revenue 1,001,902.14 (unchanged);
- costs 552,533.71 (Sep 149,435.00 · Oct 379,590.09 · Nov 23,508.62);
- to accrue 195,076.18 (unchanged);
- difference 449,368.43;
- branch costs: KINP 220,851.17 · STPS 318,290.56 · NVAC 7,877.14 · MEAD 5,514.84.

**`audit_pack.py`** now also checks, from the private PO file and Baseplan (12), independently of the builder:
- each forklift PO at qty × unit cost, on the branch it is raised on, by month from its own lines' dates, and not accrued;
- 9961976 L31 and L34 at 0.00 (price, rate, billed and prebill);
- the match-up and Costs by branch;
- every Job Connect week on the running sheet has its row;
- PO 4658653 appears nowhere in the outputs;
- the Job Connect open item asks for no further paperwork.

Result: 411 checks, 411 pass.

## Pack v1.15: every PO and every hire contract named, and everything ties (1 Nov)

Andrew, 1 Nov 2026 (this chat): "Please make sure we mentioned purchase order numbers. And hire contract numbers. Everything must talk to
each other. And all add up and match. We have the buisness that have eyes on this p&l billing and we need to ensure everything aligns."

No figure changes: v1.15 carries v1.14's figures to the cent. What's new:

- **Every cost line names its PO, or says there is none.** The two carriers' forecast lines had a blank PO field; they now say "none
  on the record" like the loads to date. Every line also names the hire contract it is charged on, or why none (job-wide, KINP work
  with no contract number, contract not named on the PO).
- **Every line under Costs by branch names its POs, or says there is none** (salary, accommodation, meals, Premiair's VMS24 and
  Ludwig Chee's nights now say so too).
- **Purchase order register (section 3c; workbook sheet "Purchase orders"):** all 27 POs in the costs, each at its amount in this P&L,
  with supplier, what, hire contract, branch and status. Where a line carries two POs, it is split by the weeks or people on each:
  - Advanced's seven receipted orders at their amounts on the record (receipt numbers in the cost line's order); 4647522 and 4647523 at
    the journals' accruals, plus demob week 2's 750.00 on 4647523;
  - Job Connect's w/e 18 Oct by the people the record names on each PO: 4667755 (Daniel Gough and Eric Lucian's GC500 hours) 3,174.90,
    4668970 (Kyle Gover) 3,023.85;
  - the consumables and forklift POs at their amounts and status in Coates' system.
  Then every cost with no PO on the record, line by line, with why. **With a PO 337,897.29 + no PO 214,636.42 = 552,533.71**, the job cost.
- **The P&L data the tab carries** (`GC500_PL_final.json`) now also holds:
  - the 18 invoices, each with its hire contract, the V8s' PO and our POs against it;
  - the November forecast line (9961976 L61) and the invoice not in the revenue (25124396, with why);
  - each hire contract with what we charged on it and the costs and POs against it, then the costs not tied to one contract
    (tied 428,580.11 + not tied 123,953.60 = 552,533.71);
  - the PO register and the costs with no PO.

**Ties the builder asserts:** the 27 PO numbers are exactly the PO numbers on the cost lines, and every PO on the record is among them;
POs + no PO = job cost; the invoices = the 18-invoice revenue; the contracts carry the invoices; tied + not tied = job cost; every cost
line names a PO (or none) and a hire contract (or why none).

**`audit_pack.py`** now also checks, independently of the builder:
- every PO's amount against its source: the record, the journals, Job Connect's invoices and PO amounts, the running sheet by the
  people named on each PO, Coates' system for the consumables and forklifts;
- the register's totals and that every no-PO cost line is listed, supplier by supplier;
- the tab's data against the Revenue, Match-up and Purchase orders sheets, line for line.

**The event-night block cleans tie (open items):** Event Portables' 51 = 18 on the six tank blocks + 6 on WC31's two 16-pan blocks (both
billed on 9968955 L142, 24) + 24 on the eight sewer-connected blocks WC09, WC15, WC16 and WC17 (L143, 24 keyed at the card's 260.25,
billed 0.00) + 3 on the WC-TV block T0243 (asset 1311144), which is on 9973977 with no cleaning line (3 × 260.25 = 780.75). L143's 24 is
8 blocks × the 3 event nights, as keyed.

Result: 465 checks, 465 pass (with every branch line and every journal naming its PO or none, and the block cleans tying to Baseplan (12)
L142, L143 and 9973977 and to Event Portables' Q6844). **Printed:** the page is 14 pages; the
workbook is 31 pages (LibreOffice), with every open item and every PO number in full.

## Pack v1.16: the independent recheck's corrections, the elite check's verified fixes, all the labour in October (1 Nov)

The job's totals are v1.15's to the cent: revenue 1,001,902.14, job cost 552,533.71, difference 449,368.43, accruals through 31 Oct
195,076.18, and every branch's costs. What moves is the month of November's labour (item C below).

**A. The independent recheck of pack v1.15 / live v12.75** (`../review_31Oct2026_pl_independent/PACK_v115_RECHECK.md`), item by item:

| Item | Fix in v1.16 |
|---|---|
| 1. Forklift monthly allocation | 4647983's basis and status say its months are estimated from the PO's approximate durations, not service dates; the invoice will settle them (cost line, PO register, open item). Retained: no service dates are on the record. |
| 2. Royal Wolf rate wording | Described by its system line total, 1,364.23 for 32 days charged; the 42.63 a day the line shows is rounded (32 × 42.63 is 1,364.16). The amount is unchanged. |
| 3. Labour note count | Worked out from the lines with part hours: "Six lines" (was "Five"). |
| 4. Labels | The dated job position, not "final"; "Accruals through 31 Oct", the journals prepared for Finance, with the September catch-up in them (Event Portables' Q6846 water and tank, 17 of 42 days, 1,963.10) and the classes not in them (carrier loads, the consumables and forklift POs: Finance to confirm); "Difference so far", not a margin yet; the invoices and the November forecast shown apart; Coates wages hours only and the estimates named. Same words on the tab (v12.76). |
| 5. Workbook narrative rows | Note rows (Summary, Labour charged, Schedule 17 transport) merge across the table and are sized for its width; every note prints whole (LibreOffice: 12 merged notes, all complete; 597 money cells all found). |
| 6. Print-edge warning | Owner decision (Andrew, 1 Nov): the P&L's print carries no twin-steer rule. On the page's other prints the rule now prints whole (v12.76). |
| 7. Print readability | Body 11 px, tables 10 px (7.5 pt), headings larger; the page prints on 22 pages (was 14), nothing under 7 pt, nothing off the page. |

**B. The elite check of live v12.75** (multi-agent, 1 Nov): the findings below were checked against the source files and fixed. The
rest wait on its adversarial verification and, for the transport loads, on Andrew's word to correct the record (they come from the
record's loads).
- Consumables POs: each cost line's status is what Coates' system says (4666720, 4669481, 4670270 invoiced; 4663216 received in full,
  not invoiced; 4655573, 4670876 nothing received), not "check invoice" for all.
- Advanced's seven orders stay "invoiced and receipted" (the verifier refuted the finding: Advanced's six construction-week invoices
  were checked against the POs to the cent on 29 Oct, `../review_29Oct2026_advanced_invoices/`). Each order now names its invoice and
  receipt: 4647508 GC090926, 4647509 GC220926, 4647515 GC071026, 4647517 GC290926, 4647519 GC141026, 4647520 GC121026, 4658850
  INV 93920. 4658850 is described from the record's note: a partial collection (Advanced INV 93920).
- The Event Portables 2126 journal is "hire, transport and water": Q6845 toilet hire and transport 42,175.00 · Q6846 water
  deliveries and drinking-water tank 4,850.00 · Q6844 water truck and pre-fill 9,600.00 (Finance to confirm 2126 or 3325) · Q6847
  pit-lane trailer 3,350.00 = 59,975.00.
- The no-PO list calls the two forecast carrier rows forecasts (card rate, else the load average; planned loads).
- The Event Portables quotes: "four quotes, approved on 24 Sep (unsigned, with no PO on them)" (the verifier kept "approved": the
  approval of all four on 24 Sep is on the record; all four also carry an empty Signed block and no PO).
- 9994954: Event Portables' lines are L19 (6 pee panels) and L21–L22 (13 FWF) hire, L23 FWF labour and L24 FWF transport (26 × 47.50);
  L18 is the transport of Coates' two WC09 blocks (L15, L16). The toilet-hire charge row names L19, L21–L22.
- Open items, verified: 10000523 L8's 37 track mats were delivered 19 Oct but billed from 27 Oct (8 days, 1,429.68, possible extra
  revenue); 9961976 bills transport for 12 of its 13 generator sets (24 legs; the two large sets need 4 at 600.00, L55 bills 2:
  1,200.00 not billed), replacing "the 350 kVA transport is already billed"; WB03's unbilled stretch is 19–26 Oct, 247.80 (WB20
  already bills 26–29 Oct), not 354.00; the consumables sold to the V8s (toilet paper and hand towels 6,724.40 on KINP, scrim
  4,230.40 on STPS) carry no cost on the record, Finance to confirm.
- Refuted by the verifier, so unchanged: 4669481 stays on NVAC (its GL on the record is 201.NVAC.2150.0); PG29 on 9968955 L154 and WC66
  on L166 are charged as ruled on 29 Oct.
- The scissor lift on 9992300 L4 is "With Operator Protection": no MEAD line supplies an operator.
- The month-end CSV's invoice rows carry the V8s' PO, as the workbook and page do.

**C. November's labour in October** (Andrew, 1 Nov 2026: "We want all labour costs. As in all hrs to all fall into october ... from
november for. Coates wages. Salary. Job connect"; and "There is no other works in novemeber that will include my labour. Thats for
(Coates wages hours, salary, Job Connect"). November's labour, to 13 Nov, moves into October; September's stays in September:
- the salary allowance's November share (110 of the window's 509 salaried hours), 3,176.82, is in October;
- Job Connect's w/e 8 Nov (Daniel Gough's PO 4674224, 3,052.60, and Kyle Gover at the running sheet, 3,023.85) and w/e 15 Nov (PO
  4674225, 3,052.60), 9,129.05, are in October, still estimates until invoiced and not accrued;
- the hours tables (section 2, Labour by person, the month-end CSV) show September and October with November's hours to 13 Nov in it
  (194 h of Coates wages, 110 h of salary and labour hire's November hours);
- costs by month: September 149,435.00 · October 391,895.96 (was 379,590.09) · November 11,202.75 (was 23,508.62); the November column
  now holds no labour, only the forecast hire, transport, accommodation and meals that fall in November.
The accruals through 31 Oct stay 195,076.18: they are work done to 31 Oct. An open item asks Finance whether to provision November's
labour (12,305.87 and the Coates wages hours) at 31 Oct.

**D. Eric Lucian** (Andrew, 1 Nov: "that was a total invoice. He didnt work at v8s other days"): Job Connect's invoice for his week
(w/e 18 Oct), 2,435.83, is the total; he worked for the V8s on 14 Oct only (10.5 h, 634.98 on the running sheet), so only that day is
in the costs (KINP, with Daniel Gough on PO 4667755). The figure is kept with its source in the private Job Connect file.

`audit_pack.py`: 511 checks, 511 pass (510, then the release check's wording findings: November's labour, not all of it; no
unproven reason; Eric Lucian's invoice and PO 4667755 agree; Royal Wolf ex GST; 4658850's receipt as on the record): v1.15's, plus each correction above (the wording, the derived count, the merged and sized note
rows, the print sizes, each elite fix against its source, and the labour move: no salary or Job Connect line in November, each person's
October hours = the register's October and November, the accruals unchanged, the open item's figures).
