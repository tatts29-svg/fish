**LIVE — 2 Oct 2026 14:08 AEST.** Guarded upload verified the public view serves SHA-256 `dd16fa3bd21d9e2b3f7e412e56855670dae7ebe5d5b03954b5951ba699c7f43c`, 8,907,669 bytes. Approved consolidation and functional fixes published; stricter layout/performance follow-ups below remain open. This is not a claim that all quality targets are met. Codex independently reviewed and published Claude's implementation with the documented corrections.

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
bash toolchain/build.sh v7.96 v7.91_today_tidy_full_width_DRAFT/patch_v791.py v7.93_one_tab_today_DRAFT/patch_v793.py v7.95_today_packed_DRAFT/patch_v795.py v7.96_equipment_tab_LIVE/patch_v796.py
```

- Base: live v7.92 `476f0dcc…`.
- Candidate: **8,907,669 bytes, SHA-256 `dd16fa3bd21d9e2b3f7e412e56855670dae7ebe5d5b03954b5951ba699c7f43c`** (independently corrected candidate; see review below).
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

Claude implemented and tested the original layout. Codex independently reviewed it, reproduced and corrected the reference-navigation findings below, and tested the corrected candidate. The timing and section-space targets below remain unmet; this is not a blanket 10/10 sign-off. Uploading v7.96 makes uploading v7.95 unnecessary, unless v7.95 goes up first. If the live page changes, rebuild with the command above and rerun the checks.


## Independent review and bounded corrections — 2 Oct 2026

Author: Andrew Fisher

The official four-patch build first reproduced the original READY candidate `c0056535…` byte for byte on live
v7.92 `476f0dcc…`. Independent actual-control checks found three related reference-navigation defects:

- Today's **116 no record** shortcut left the filtered rows inside the closed Every reference fold.
- After a routine first Equipment visit, that shortcut kept the default Toilets trade and showed only 45 of the
  116 references. It now clears that trade selection, opens the existing fold and lands it 12 px below the work-area top.
- A reference drawer used the raw product name (`Portable Building`) instead of the existing group alias
  (`Portable buildings`). The page showed all 201 references with an inappropriate single-trade summary. It now
  uses the existing alias and shows the 56 Portable buildings references.

Explicit reference and filter navigation opens the existing fold. A new search does the same. A later record redraw
respects a fold the person has closed. Routine first visits remain folded. The existing Inventory already schedules
its QR/image hydration; a redundant immediate call was removed so it creates one observer pass, not two.
No component was restyled and no shared record was changed.

Final candidate: **8,907,669 bytes; SHA-256 `dd16fa3bd21d9e2b3f7e412e56855670dae7ebe5d5b03954b5951ba699c7f43c`**.

Independent final-candidate checks (`evidence/review796_*`):

| Check | Desktop | Phone |
|---|---|---|
| Reference shortcuts, search, drawer alias, fold preference and one hydration pass | 9/9 | 9/9 |
| Equipment practice | 22/22 | 22/22 |
| Packed Today practice | 20/20 | 14/14 |
| Sweep | 21 tabs / 7 links; no page or console errors | 21 tabs / 7 links; no page or console errors |
| Navigation regression | 21/21 | — |
| Rules, including comparison with the live base | 45/45 | — |
| Fresh after save | 11/11 | — |

The final phone and desktop pictures were inspected. Inventory maps and QR codes render; the corrected status
shortcut shows all 116 rows in its open fold. Page width equals viewport width at 1,440 px and 390 px. Pictures stay
in `/workspace/private-v796-review/` because the Today card contains contact details.

### Measured limits — kept explicit

At 1,440 px, default Today empty card area falls from **19.9% to 12.6%**. Today's work falls from **40.1% to 11.9%**.
Instruments measure 3.5%, By group 19.1%, By branch when opened 33.2%, and Money when opened 13.5%.
**By group and By branch therefore still miss the under-15% section target.** All-open Today totals 17.4%; the default
phone view totals 4.1%. The chosen components and approved layout were preserved.

The work-area scroll height on desktop is **3,237 → 3,949 px for Today**, which now contains Where we are, and
**23,144 → 3,487 px for Plant/Equipment**. Phone Today measures 10,966 px; Equipment 4,699 px. These are the actual
scroll-area measurements, so they should not be mixed with the earlier full-document picture heights.

Paired desktop median of six synchronous `go()` calls, one browser at a time, reduced motion and the GPU test idle:

| Tab | Live v7.92 | Corrected v7.96 |
|---|---|---|
| Today | 145.3 ms | 259.7 ms |
| Plant / Equipment | 44.3 ms | 81.3 ms |

**The no-slower-than-live target is not met.** This is a shared-host measurement, not a first-paint benchmark. Profiling
found one Today render plus one embedded Progress render, and one Equipment render plus its Inventory HTML. There
is no duplicate main render. Removing the duplicate hydration pass does not eliminate the cost of the added content.

Reproduce the browser matrix with the usual `NODE_PATH` and `CHROMIUM_PATH` configured:
`python3 v7.96_equipment_tab_LIVE/evidence/review796_run_checks.py`.
The separate layout, profile and timing scripts sit beside it. `review796_summary.json` records the exact candidate,
checks and remaining targets. Publication remains a separate coordinated step.
