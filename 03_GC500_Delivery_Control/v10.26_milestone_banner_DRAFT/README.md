# v10.26 — Milestones you can see, Baseplan of 15 Oct and Schedule 9 on the page (DRAFT, ready for Andrew's word)

Author: Andrew Fisher · 15 Oct 2026

Status: **BUILT and TESTED from the live v10.25 page (`66878d12…`), not uploaded.** Candidate
`build/GC500_v10.26/GC500_Delivery_Control_hosted.html`, sha256 `1661d1c17b5099deeab65d359f786fec3761474d8f7d5bf373027aaa43bdcaf9`
(17,892,402 bytes, 126 inline scripts). Andrew, 15 Oct 2026 about 15:50 AEST in Claude's chat: "I need you to update.
And fix anything that is relevant to truth please … ensure all pricing and all numbers are 100% correct please. test.
fix and then permission to go live", and at 15:30: "I don't see any difference with it" (the v10.25 celebration);
then "this data don't go mentioning Codex or AI; I need to know what is missing, levelling or stairs etc".

## 1. The milestone celebration you could not see (`patch_v1026.py`, `ms1026.js`, `ms1026.css`)

v10.25 fired its fireworks over the area card on the Work progress board, which sits 1,290 px down the Today tab on a
desktop and 1,476 px on a phone, then marked the moment seen in that browser. Nobody saw it. Now:

- **A banner at the top of the Today tab**, under the Today header and above Available staff, every time an area
  stands at 100%: the orange 100%, the area, "52 of 52 complete · reached 15 Oct 2026 · 31 days start to finish",
  and three buttons — **Show me** (scrolls to the card and bursts over it), **Summary** (opens the area's facts under
  the board), **Print (A4)**.
- **The first-time burst fills the whole screen** (a canvas fixed to the viewport, pointer-events none, about five
  seconds), and plays only while the Today tab is actually showing. If Today drew while another tab or the startup
  screen was in front, the moment stays unseen and plays within half a second of Today coming in front. Reduced
  motion: the banner glows instead.
- **The summary names people plainly and says what is missing.** "Andrew Fisher via Codex 1" and "andrew fisher 3"
  read as Andrew Fisher; "(as recorded)" is gone from the labels. Levelled and Steps are two rows, each naming the
  references not levelled / with no steps recorded; Accessories names the references carrying none; a reference's
  numbers count its unit records as well as its typed numbers (P63, P65, P66, P67 and T0266 no longer read as
  unnumbered). Buildings today: not levelled P69, T0258, T0266; no steps P06, P38, P39, P42, P58, P69, T0023, T0258,
  T0266; no accessories P12, P15, P16, T0023, T0258, T0266.

## 2. The contract lines and the schedule (`patch_v1026_data.py`, `baseplan1026.py`)

**Baseplan SuperCars, exported 15 Oct 2026** (sha256 `ba246d4a…`; 13 contract tabs, 318 numbered lines, plus the
branch's Delivery Dockets sheet) refreshes the page's contract lines through the v9.49 reader with v8.71's rules:

- 109 lines changed as exported — **21 lines gain the rate they had no figure for** (the five Molendinar lighting
  towers at $643.30, GN20 $6,260.40, GN23 $2,412.54, GN03, GN18, GN06, GN04, GN10, GN01, GN24, GN25, GN21, the two
  concert generators, LT05/06), statuses move to Delivered with their docket numbers, item numbers fill in.
- 39 lines added (the TV compound contract 9992300-MEAD, the fencing contract 9990776-STPS, the second WB06 barrier
  lines, GN13's replacement generator 1276503, GN06's 1320828 line, VMS13–17 and VMS24, two cable lines, the fork
  extension); 41 lines the export no longer has (VMS13–17 old lines, GN13's old line, the P53 shell, the spares) go to
  the source history and out of the active totals — the same rule v9.49 set.
- 14 lines re-join their reference by the number the export filled in (P03, P51, P65, P66, P67, P69, P63 — line
  121 now carries 960719 Delivered, the unit on P63's record — WC21, WC60, WC31, WC09); three joins are set by hand
  from the delivery dockets: line 93 (1189410) → P36, line 108 (P67, 1189410 Pending) → no join, line 64 (1087453)
  → P06.
- Five fleet numbers sit on two priced lines (the superseded 9968726 TV lines against 9992300, and 1211404 Returned
  and re-delivered as VMS09): flagged in the source audit, not removed — Mead to cancel 9968726.
- Rates: every figure is the contract's own Rate 1 as exported; the customer card rule and the supplier footers
  (PremAir $53.61, Royal Wolf $1,364.23) are read from the same cells as before and unchanged.

**Schedule 9** (sha256 `0a684fce…`) moves the page's events from Schedule 7 with the site record kept authoritative:
four quantities (WC60 toilet block 2 → 1, WC67 FWF 2 → 4, WB04 barriers 14 → 12, LT05 towers 1 → 2); eleven days
(WC09 FWF and pee panels 9 → 8 Oct; P26, P28, P34 fridges and chairs 16 → 14 Oct; WB06 16 → 15 Oct; WC46 15 → 19 Oct;
PG01, PG03, PG05, PG29, WC85 19 → 20 Oct); thirteen days held because the reference is already on site and its first
day is history (WC01, WC50, WC38, WC39, WC40, WC61, WC34, WC57, WC29, WC55, WC68, WC72 and WB06's first day); two new
rows (P46 fridge 14 Oct, P53 fridge 15 Oct); the VMS pick-up rows (11–23 on 26 Oct, 9–10 on 27 Oct, 22 on 28 Oct,
1–8 on 13 Nov) stay with the VMS plant line, which has no page reference. The schedule's two typo cells (WC05 "T",
P09 "1097377") are skipped as before (R01, R02).

**The schedule's stray copies of other references' numbers are settled** (`schedule_copies_settled` in the Baseplan
review block): the earlier schedule wrote 1282487 on P63 (it is HRP's crib room, Schedule 9 Week 5; P63 is 960719),
1097343 on P27 (P18's, docket 26076747), 1327222 on P53 and P36 (P66's, docket 26126001), 1327213 on P46 (P04's,
docket 26064087; P46 is 1327215), 1189410 on P67 (P36's, docket 26085104; P67 is unit 421107) and 1283681 on GN06 (a
spare on the 15 Oct export; GN06 is 1320828). Each number comes off that reference's register entry with a note saying
why, so the page no longer has to hide a number that sits on two references.

Two review blocks, `DATA.baseplan_review1026` and `DATA.schedule_review1026`, carry every change, hold and join with
its line or cell; `data_log_1026.json` beside this README is the same log.

## Build

```sh
BASEPLAN1026_XLSX=/private/892b9fab-Baseplan_SuperCars.xlsx \
SCHEDULE9_XLSX=/private/85b798de-GC500_26_Schedule_9.xlsx \
RECORD_JSON=/private/state_after_the_fills.json \
toolchain/build.sh v10.26 v10.26_milestone_banner_DRAFT/patch_v1026.py v10.26_milestone_banner_DRAFT/patch_v1026_data.py
PAGE=build/GC500_v10.26/GC500_Delivery_Control_hosted.html node v10.26_milestone_banner_DRAFT/tests/test_ms1026.cjs
```

The workbooks are customer and branch documents and are not committed; their SHA-256 is checked by the patch. The
record was read at version 6562 (after the three record passes of 15:49, 16:03 and 16:48) for the joins.

## Checks

| Check | Result |
|---|---|
| `check_page.py` against the live base | PASS, no secrets, DATA round-trips byte for byte before the change |
| `tests/test_ms1026.cjs` (phone, desktop, print, routing; every write aborted) | ALL 20 CHECKS PASSED |
| Regression sweep, desktop and phone (`harness/sweep.js`) | 24 tabs, 18 shown (the six not shown are the edit-only and hidden panes, as on the live page), no page errors, no console errors, deep links and back/forward fine |
| Data check on the build (read-only) | 318 active lines, 45 in the source history, 13 contracts; Costs, Pricing, Questions, Equipment, Timeline, Sub-hired and Demob render with no NaN or undefined; the word Codex appears nowhere on the page |
| Milestone facts, Buildings | ticked complete by Andrew Fisher 52; set on site by Andrew Fisher 45; 52 of 52 numbered |

## Not done

No upload: the page waits for Andrew's word. The record fills of 15:49 are in `record_15Oct2026_dockets_fill/`.
