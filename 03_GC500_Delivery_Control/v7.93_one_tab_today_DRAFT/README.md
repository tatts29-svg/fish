# v7.93 — Today and Where we are on one tab (Example A)

Author: Andrew Fisher · 2 Oct 2026 · **READY TO UPLOAD** (Claude), not live

## What Andrew asked for

- "we really need to merge both today and where we are into one. but we need to lay this out good please"
- "We are professional your taking away all the good work we did"
- "Do more examples make sure we dont double up info"

Andrew was shown three examples, all built from the page's own components with nothing redrawn. He picked **A**: Today's instruments lead, and every fact shows once.

## What changes

**Today now carries Where we are underneath its own cards.** From top to bottom:

1. the banner;
2. a "Today" heading with Where we are's date control, Email this, Print and Start showcase;
3. the lights and the Deliveries panel, then the programme card (with its key dates);
4. "Today's work": Next programme day, Delivery updates, Also on the schedule, Who to call, Map, Documents and Roads;
5. By group, By branch, Money, On site, and the detail trade by trade.

It is still Where we are's own code drawing into its own pane, which sits inside Today. Every plate, link, Email, Print and showcase works as before. Print still produces the A4 Where we are report, and Today's cards are left off the paper. The date control replays Where we are's figures for the chosen day. Today's cards always show today.

**Where we are leaves the tab row and Tools.**
- `#progress`, a bookmark, and "Open the summary →" / "Open Where we are →" all open Today at the By group heading, and the address becomes `#today`.
- The "due in and not on site" dot moves onto Today.

**Repeats left off.** These are screen rules only. Nothing is redrawn, and paper prints as before.

| Left off | Why it is a repeat |
|---|---|
| The big dial panel (delivery, fencing, revenue) | The Deliveries panel reads delivery against the plan; By group carries the fencing and Money the revenue |
| The milestone strip | The programme card carries the key dates |
| Where we are's "As at" line and Today's date line | The header carries the date; the programme card carries the day count. "Recording as" still shows on an editing link. |
| Today's Fencing card and its Costs & charges card | By group and Money carry those figures |
| Where we are's chicane picture and its second "View only" line | Today already has one of each |

**v7.91 is folded in.** That was the Today tidy-up: Back in the header row, picture bands capped at 1,400 px, Deliveries filling its panel, and cards filling each row. It is not uploaded separately.

**Found while testing.** On live v7.92, the Open line on each Today instrument did nothing when pressed: "Open the register →", "Open the summary →" and "Open Where we are →". The page wired them with `.island.hubgo`, a selector no element matches. v7.93 wires `.card.island .hubgo[data-go]`, and the tests now press each one.

## Build

```
bash toolchain/build.sh v7.93 v7.91_today_tidy_full_width_DRAFT/patch_v791.py v7.93_one_tab_today_DRAFT/patch_v793.py
```

- Base: live v7.92 `476f0dcc…` (8,883,495 bytes).
- Candidate: **8,889,991 bytes, SHA-256 `2aeecb8ca3287511b4dcdff6d2db02612fd3d02ef784e4fc49076ac9a1f3564b`**.
- `check_page` passes.
- The patch refuses a second run, a page without v7.92, and a page without v7.91.

## Checks on the final candidate (all read-only; every write aborted)

| Check | Result |
|---|---|
| `evidence/one_tab_tests.js` | **24/24 desktop, 24/24 phone** — see below |
| Sweeps (`harness/sweep.js`) | **21 tabs / 7 links**, 0 page errors and 0 console errors, desktop and phone |
| v7.76 navigation regressions | **21/21**, including the original navigation body left unchanged; the redirect lives in the `go()` wrapper |
| v7.84 rules tests | **45/45** |
| v7.75 fresh-after-save | **11/11** |
| Editing link (`evidence/speed_and_edit.js`) | Your records and "Recording as" still show; the date line stays hidden |
| Speed: open Today, median of 6, headless desktop | Live v7.92: Today 205 ms, Where we are 254 ms. v7.93: Today 319 ms (both in one). |

What `one_tab_tests.js` covers:
- the layout order, one banner, one "View only" line and one set of buttons;
- the instruments are kept and the repeats are left off;
- no figure is doubled between Today's cards and Where we are;
- Where we are is off the tab row and Tools;
- "Open the summary" goes to By group, and "Open the register" goes to Plant;
- `#progress` lands on `#today`;
- a round trip through four tabs comes back whole;
- the date control replays Where we are;
- a By group plate opens Plant filtered;
- Print produces the report and paper leaves Today's cards off;
- Start showcase opens;
- no overflow and no page errors.

Logs and JSON are in `evidence/` and `evidence/regress/`. The screenshots stay out of the repo because "Who to call" shows phone numbers.

## Implementation and review

Claude implemented and tested this. Codex has not reviewed it. Upload with `toolchain/upload_page.py`. If the live page changes first, rebuild with the command above and rerun the checks.
