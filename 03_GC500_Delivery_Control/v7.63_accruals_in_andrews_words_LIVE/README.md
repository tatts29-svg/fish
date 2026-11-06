**LIVE — 1 Oct 2026 13:57 AEST, released within v7.63.** Author: Andrew Fisher. Approved four-patch build verified byte for byte. See v7.63 release evidence. Earlier draft/review notes below are historical.

# v7.63 — Accruals for Finance, in Andrew's words (DRAFT · built and tested · READY TO UPLOAD with v7.60, v7.61, v7.62 — one build)

Author: Andrew Fisher · 1 Oct 2026

Applied after v7.60 (Costs in Andrew's structure), v7.61 (Accruals for Finance) and Codex's v7.62 (the month-end review
corrections). One build, four patches, on the live v7.59:

```
bash toolchain/build.sh v7.63 v7.60_costs_in_andrews_structure_DRAFT/patch_v760.py v7.61_accruals_for_finance_DRAFT/patch_v761.py v7.62_finance_review_basis_DRAFT/patch_v762.py v7.63_accruals_in_andrews_words_DRAFT/patch_v763.py
```

## Why

Codex's v7.62 review of v7.61 found three real defects (future rows worded as done work, a UTC date edge, unpriced labour
shown as $0) and fixed them with a stricter model. Built and run here it also introduced two regressions and lost the
brief. Andrew's brief, verbatim: "clean info in the Costs section for the finance team", "easy terms, I'm not an expert",
"with the labour I need to know what the forecast labour is".

## What v7.63 keeps from v7.62

The model: status (planned / to review), unknowns kept as unknowns (never $0), stamps read as Brisbane days, the lists of
work and cost with no day to put it in, the per-person days-and-hours table, the event scope split into the people
($36,715) and the accommodation and travel ($19,102), the workforce outlook by month, no journal created, nothing posted.

## What v7.63 changes

1. **Supplier invoices recorded.** v7.62 dated a purchase order by `o.invoice_date`, a field the record does not carry, so
   every month showed $0.00 beside two confirmed Advanced invoices. A PO's month is the programme week on the order
   ("Construction week 5" → Week 5, 14–18 Sep — a work period on the record); a PO with no week is dated by the Brisbane
   day its invoice was typed, and the basis says which. September: **$42,662** (4918492 $8,992, 4922398 $33,670).
2. **Labour ticks.** v7.62 pushed all 165 ticks ($17,083) out of September into "needing month allocation" because a tick
   carries no work date. The reference's `first_date` is the schedule's delivery day — the day the piece went in — and the
   install labour is the act of putting it in (Andrew's per-piece rule). A tick is dated by that day and the basis says so.
   The entry timestamp is still never used; a reference with no day in stays in the unallocated list.
3. **To accrue, as a proposal.** The fencing row shows incurred less the invoices recorded as "to accrue" — September
   **$30,734.50** (62 dockets at Advanced's sheet $73,396.50 less $42,662) — and the caveat is said once, under the tiles:
   a proposal, matched to the ledger by Finance, no automatic accrual, a paid cost never accrued twice. The green book's
   labour and truck hours are their own dated row (Codex), no longer apportioned.
4. **The words.** The display layer is rewritten in Andrew's words: the badges **Accrue · Finance's call · Check the
   invoice · Payroll · Planned**, "What Finance does" on every row in one sentence, a short basis (a count and the first
   few names, not every contract line), the WIP question asked as a question, the glossary in plain English. A row of the
   current month that runs past today splits into "to date" and "still planned" from Codex's forecast figure; a month
   still to come reads "What is due" / "Costs planned", all Planned.

## September 2026, as the record has it on 1 Oct 2026

| Revenue earned, not yet billed | branch | amount |
|---|---|---|
| Fencing — Rehire Revenue, 59 dockets at the 2026 card | STPS | $120,913 |
| Hire from the day it goes in (barriers, VMS) | STPS | $26,316 |
| Labour Install ticked per piece (dated by the day in) | KINP | $16,458 |
| Hire from the day it goes in — forklifts from the card | NVAC | $11,656 |
| Transport Revenue — container delivery | KINP | $1,000 |
| Labour Install ticked per piece | NVAC | $625 |
| **Total** | | **$176,968** |

| Cost incurred | incurred | invoices recorded | to accrue (proposal) | Finance |
|---|---|---|---|---|
| Fencing — Advanced, 62 dockets at their sheet | $73,397 | $42,662 | $30,735 | Accrue |
| Fencing — Advanced's labour and truck hours (green book) | $1,250 | — | $1,250 | Check the invoice |
| Toilets — Event Portables Q6845, 17 of 42 hire days | $21,950 | — | if accrued | Finance's call |
| Transport — 37 loads with a TPORT COST figure | $22,011 | — | $22,011 | Check the invoice |
| Labour hire — Job Connect, 105 confirmed hours | $6,285 | — | $6,285 | Check the invoice |
| Accommodation · meals · other expenses on the tracker | $7,576 | — | $7,576 | Check |
| Coates CNA and salary — 565 confirmed hours | hours only | — | — | Payroll |
| **To accrue — a proposal** | | **$42,662** | **$67,856** (+ $21,950 Finance's call) | |

Added across every month, plus the $938 of delivery lines with no date, the revenue is the P&L's $555,929.94 to the cent.
On the record with no day to put it in: four delivery charge lines ($938), one fencing docket with no date ($2,475), the
Event Portables quote Q6847 with no hire dates ($4,850).

Labour forecast (whole job): Labour Install $69,862 · Cleaning $8,484 · Fire extinguishers $2,603 · per piece $80,948 ·
event people $36,715 + accommodation and travel $19,102 = the scope $55,817 · **labour-only forecast $106,576** (Labour
Install + the event people) · everything charged for labour, cleaning, fire extinguishers and the scope $136,765. Hours
2,103 (confirmed 670, awaiting 61.5, planned 1,371.5); priced $31,824 (labour hire only); 1,626 h with no wage rate.

## Build and evidence

`build/GC500_v7.63/GC500_Delivery_Control_hosted.html` — the four patches on the live v7.59 (8,489,105 bytes): **8,572,884 bytes**, check_page PASS, key grep clean. Practice test desktop 33/33 and phone 33/33; sweeps on that build desktop 21 tabs, 0 errors, 0 console; phone 21 tabs, 0 errors, 0 console. Pictures `evidence/shot763_accruals.png` (desktop, full height) and `shot763_accruals_phone.png`; `copy_for_finance.txt` and `GC500_Finance_review_2026-09.csv` as the page produced them.

## Tests

`evidence/practice_tests.js` (desktop and `MOB=1`): every month plus the undated rows adds to the P&L's Revenue; the
September invoices are the confirmed POs by programme week; fencing to-accrue = incurred − invoiced; the labour ticks are
dated by the day in; no September row is Planned; October's rows split to date / still planned; November is all Planned;
Codex's labour model checks kept (per-piece = the plan, ticked = the P&L, package reconciles, labour-only excludes the
support, hours classified and equal to the rows); Andrew's words present and the audit phrases absent; the caveat once;
badges, the people table; CSV and Copy captured (nothing leaves the page); read-only (totals and journals unchanged); no
overflow on the phone; 0 errors.

Superseded expectations, and why: v7.62's `automaticAccrualAbsent` and `unknownInvoicesStayUnknown` (a to-accrue figure is
shown as a proposal, and the invoices recorded are known from the POs' weeks); v7.62's `syntheticUnknownNotRenderedAsZero`
expecting the words "Not confirmed" (an unpriced cost reads "hours only, no rate" / "not priced"); v7.61's
`sepFencingCostIncurredIs…PlusLabourShare` (the green book is its own row).

Marked READY TO UPLOAD 1 Oct 2026 11:55 AEST on Andrew's instruction that this information go in the Costs section; one build, the four patches in order, 8,572,884 bytes, SHA-256 `e723a1fb…7fa3` on the live v7.59. Rebuilt and re-tested on Codex's final v7.62 (PR #7 head 7321fb2): same bytes, same results.
