# v7.23: Questions cleaned up (LIVE)

Author: Andrew Fisher

Andrew, 28 Sep 2026: "revisit all questions … close off some of these yourself … easy to understand … why and what info we need". This release also works through the Questions review handover from the same morning (`handover_questions_review_28Sep2026.md`).

**Result: 49 open → 18 need an answer, 5 for later, 23 answered or history.** Nothing is deleted; each old question keeps its original wording under "Original wording".

Before relying on the handover, I checked its facts against the record:
- WC05, P09, the seven buildings, GN20 and GN23;
- the office and lunchroom sizes, and the concert generators;
- VMS 22 (8 delivered, 14 to come);
- the P20/P21 double load links, and the R29 dockets.

All matched.

## How the page works now
- Each question shows three things: what it is, **Why it matters**, and **What we need**.
- A typed note is kept with the person's name and Brisbane time, but it **doesn't close** the question. A question only goes away when the record settles it (handover defect 1).
- The 34 imported questions come from a checked list, not the old `/closed|resolved/` text match, which also matched "unresolved" (defect 2).
- The four fencing catch-up questions are now one, with a row per line.
  - It's measured to the end of yesterday, so today's work isn't counted as late (defect 5).
  - It's worded as a gap in the record, not proof the work is behind.
- The fencing closure question now asks the three real unknowns: what each colour group means, whether marks with the same order number act together, and whether a time means "closed at" or "clear by" (defect 3).
- Accommodation counts each night with no price, so pricing one night can't hide the rest (defect 8).
- Pay rates move to "Later". The labour workbook is hours only, so the costs exclude wages.
- A check that fails to run shows a warning instead of quietly dropping questions (defect 9).

## The 34 imported questions

| Status | IDs |
|---|---|
| Answered | R01, R02 (+TX04), R03, R04, R05 |
| Merged | R15 → R27; R17 → R09; R18 → R06; R25 → R23; TX04 → R02; TX05 → TX03 |
| Out of date / history / rule | R07, R08, R12, R13, R14, R19, R20, R21, R22, R24, TX01, TX02 |
| Still need an answer (reworded) | R06, R11, R16, R23, R26, R27, R29, TX03 |
| Later | R09, R10 (the size is answered; only the 12 vs 13 Nov date is left), R28 |

## Not done in this release (from the handover; these touch other pages)
- A contract-rate fix path. At the moment a price typed on Pricing sets the card price, not the contract rate (defect 4).
- Separating planned and actual shifts on the Running sheet. Today, `runTotals` counts today's scheduled hours as worked from midnight (defect 7).
- A transport load/leg ledger, so the $21,721 and $10,532 transport totals are labelled and reconciled (defect 10).
- Labels for "planned pick-up" vs "off hire" (defect 11), and the rate-card label clash on Pricing (defect 12).

## Andrew's rule vs the handover
The handover says "no blanket blank→1 rule". Andrew said on 28 Sep: "Buildings with no qty. Its qty 1". His word stands (v7.17). The seven buildings now also show their asset numbers, so every "one" can be traced.

## Tested
- 0 errors on desktop and phone.
- Every "Open where it lives" button goes to a real tab.
- A typed note leaves the count unchanged (18 → 18).
- The money probe matches exactly.
- Pre-starts still print one page each.
- The sweep shows 0 errors on all tabs.

**LIVE: 28 Sep 2026 04:58 AEST**, byte for byte on the view link.
