# v7.96 — Plant and Inventory as one Equipment tab

Author: Andrew Fisher · 2 Oct 2026 · **READY TO UPLOAD** (Claude), not live. This release carries v7.91, v7.93 and v7.95 with it.

## What Andrew asked for

- "I asked earlier to merge plant and inventory together. They are basically the same thing. Keeping th same look as inventory i think."
- "We need to start to tidy up things now to ensure we dont double up on information. Layout needs to be perfection now."
- Shown the mock-up on the real page: "Lets do it".
- Also, while this was being built: "why isnt the info of fencing in today. I need you up to date". Today's Fencing card is back; the fix is in the v7.93 patch, so every candidate from v7.95 up carries it.

## What changes

**The tab.**
- Plant is now called **Equipment**. Its address stays `#plant`, so links and bookmarks still open it.
- The page's own wording follows: "open Equipment", "Equipment on the job", and so on.

**Top of the tab.** One Equipment heading with:
- one row of trade buttons, names only (the Ordered column carries the counts);
- List/Cards;
- Share PDF.

**The Inventory, in its own look,** for the trade chosen:
- on site now by type;
- press a number for its locations;
- still to come, with maps and QR codes;
- spares.

Its own trade buttons are gone: the heading's buttons drive it. Plant's trade names are kept, and the Inventory's matching trade is found from the references themselves, so "VMS boards" finds "Variable message signs".

**Every reference** folds to one line, saying how many references there are and how many asked-for lines are recorded.
- Opened, it is Plant's colour code, lights filter and reference rows, as they were.
- Repeats left off: the "Plant — what was asked for" heading, and, when one trade is shown, that trade's own heading and progress line.

**At the bottom:** Rental contracts, then **Branches** folded to one line.

**First visit opens on the first trade**, so the light counts are that trade's and not a second copy of Today's lights.
- This doesn't happen if a light, a search or a trade was asked for on the way in.
- Pressing "116 no record" on Today still lists every trade.

**Change deliveries no longer carries the Inventory.** Its Inventory button opens Equipment.

**Print** opens every fold for the paper, then closes them again. The fold lines don't print.

## Size

- Equipment at 1,440 px is **3,726 px long**, against about 23,400 px for Plant before.
- Every reference row is still there, one press away.

## Build

```
bash toolchain/build.sh v7.96 v7.91_today_tidy_full_width_DRAFT/patch_v791.py v7.93_one_tab_today_DRAFT/patch_v793.py v7.95_today_packed_DRAFT/patch_v795.py v7.96_equipment_tab_DRAFT/patch_v796.py
```

- Base: live v7.92 `476f0dcc…`.
- Candidate: **8,906,474 bytes, SHA-256 `c0056535f95cdff1f2b018e2a02ee59db23cf5abb8c4567dfdd3daa929fbce30`**.
- `check_page` passes.
- The patch refuses a second run, and refuses a page without v7.95.

## Checks on the final candidate (all read-only; every write aborted)

**`evidence/equipment_tests.js`: 22/22 desktop, 22/22 phone.** It covers:
- Arrival:
  - a light on Today keeps every trade;
  - the first visit opens on the first trade.
- Layout:
  - the tab is named Equipment;
  - one heading, with name-only buttons, List/Cards and Share PDF;
  - the Inventory in its look, without its own buttons;
  - the order is heading, Inventory, Every reference, contracts.
- Folds:
  - Every reference is folded, with its line, and with no repeats inside;
  - Branches is folded;
  - opened, the rows show, and an open fold stays open through a redraw.
- Trade buttons:
  - one button moves both parts together;
  - VMS boards finds Variable message signs;
  - All shows every trade in both parts.
- Features:
  - pressing a number shows its locations;
  - Share PDF opens;
  - Change deliveries has no Inventory, and its button opens Equipment.
- Print, editing link and page:
  - Print opens and closes the folds;
  - on an editing link the spares can be typed;
  - there's no overflow and there are no page errors.

**Regression suites:**

| Suite | Result |
|---|---|
| Sweeps (21 tabs / 7 links) | 0 page errors, 0 console errors, desktop and phone |
| v7.95 `packed_tests.js` | 20/20 desktop, 14/14 phone |
| v7.76 navigation | 21/21 |
| v7.84 rules | 45/45 |
| v7.75 fresh-after-save | 11/11 |
| v7.93 `one_tab_tests.js` | 22/24 desktop and phone, as intended |

The two v7.93 misses look for the By branch and Money headings in the open, and v7.95 folds those away. Its repeat check now allows exactly one overlap: Today's Fencing card's dollars, kept on Andrew's word.

Screenshots stay out of the repo because "Who to call" shows phone numbers.

## Implementation and review

Claude implemented and tested this. Codex has not reviewed it. Uploading v7.96 makes uploading v7.95 unnecessary, unless v7.95 goes up first. If the live page changes, rebuild with the command above and rerun the checks.
