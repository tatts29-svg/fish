# v6.81 — DRAFT from the deep check of live v6.80 (26 Sep 2026). NOT LIVE — awaiting Andrew's yes

Author: Andrew Fisher

## Deep check of live v6.80 (read-only)

**Clean:**
- **Hours and pay, shift by shift:**
  - all 204 shifts: worked = finish − start, and paid = worked − break;
  - every normal / ×1.5 / ×2 split follows the rules and adds back to the paid hours.
- **Running sheet:** all 68 days draw with no errors. Days add to the job total: 2,162.5 h worked = 2,003.5 h + 159 h race.
- **Totals that agree across tabs:**
  - accommodation $13,865.06 over 101 nights;
  - meals and misc;
  - labour by branch and by charge type;
  - charges $398,541.22 and known costs $217,098.24, both summing line by line.
- **Behaviour, desktop and phone:**
  - no page errors or failed requests;
  - no NaN, undefined or broken images on any tab;
  - search works, with no sideways overflow.
- **Accessibility:** no WCAG A/AA violations once the pages have settled. The Documents warning on the first run was caught mid fade-in and is clean on a re-run.
- **Machine and satellite explorer:** both load.

**Data gap (needs the branch, not code):**
- 26 labour lines on 9 KINP units (P09, P13, P14, P15, P16, P41, P44, P58, WC05 toilet block) are ticked as done.
- Their schedule line has no quantity, so they can't be valued and are not in the charged total.
- At one building each, that is about $3,081.

## Fixes in patch_v681.py (tested on the local copy; fix_test681.js)

| # | Fix |
|---|---|
| M1 | Ticked labour on relocated or moved units gets its own row, so the rows add to the Charged total (latent: no gap today) |
| M2 | Answers on the Questions page stay with their question when the list changes (ids no longer by position) |
| M3 | Typing a break or one time no longer wipes hours typed without times |
| M4 | Clearing a night's amount removes the night (meals already did this) |
| L5 | "aaron.zelvis" is recognised as Aaron Zelvis, so there is no silent type change |
| L6 | The same start and finish is not a 24-hour shift |
| L7 | A pay rate that is not a number, or is below nought, is ignored and refused |
| L8 | A break as long as the shift pays nought |
| L9 | "Salaried" reads as Salary; people with no type are pointed out on the sheet |
| L10 | Hours are shown to 2 decimals, so the ×1.5 and ×2 cells add to the paid hours |
| L11 | The pay rule quoted on Costs is the running sheet's editable rule (CNA and labour hire) |
| L12 | Running totals leave out the same unusable lines Costs does |

**Regression:**
- scripts OK; deep data audit shows no issues;
- 68 days clean, with hours unchanged (2,003.5 worked, 1,909 paid, 159 race);
- navigation clean on desktop and phone;
- accessibility clean;
- running-sheet editor test passes.
