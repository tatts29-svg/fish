# v12.22 — figures first on the Costs cards

Author: Andrew Fisher. 25 Oct 2026. **LIVE 18:34 AEST**: the view link serves `d286f3a53f56574a016cb8505d8164b7631b70ec9cc038f9ebe8cb3591afa7e4` byte for byte (15,387,177 bytes). Checked by the guarded upload, then a separate public GET at 18:34:34. `tests/test_v1222.cjs` passed 13/13 against the live page on desktop and on phone (`evidence/test_live*.txt`).

- Built and tested as v12.20 on live v12.19.
- Renumbered v12.22 at Codex's request (PR #1 6395053671), so the footer never goes backwards: servicing's v12.21 goes first.
- It is rebuilt and retested on the verified v12.21 live page before upload. `patch_v1222.py` refuses any other base.

Andrew (Claude's chat): "i want this the amount of info shortened no one is going to read all this we just want Figures", on these cards:
- the Forecast P&L's Revenue and Direct costs;
- "Not in it yet";
- Transport Revenue;
- Rehire by Revenue branch.

And: "OUR DATA MUST BE CLEAN. OUR DATA IS TRUTH. ITS DEMOB TOMMORROW SO ALL COST NEED TO BE VERY CLEAR".

## What changes
- **Figures first.** Forecast P&L, Transport Revenue and Rehire by Revenue branch show their figures. The explanations fold away under a **Show the workings** button on each card, and the page remembers the choice for the visit.
- **"Not in it yet" is 10 lines, not 23.**
  - The 13 water-barrier lines are one line: 13 × TL2 (WB01–WB07, WB13–WB18).
  - Each line keeps its first clause, then any clause that carries a figure.
  - Quotes, who-said-it notes and bracketed lists with no figure move to the full list, under the workings.
- **Presentation only.** No figure changes, and every word is still on the page. The script's ids keep the `1220` suffix it was written with.

| Card | Text showing by default |
|---|---|
| Forecast P&L | about a quarter of before |
| Rehire by Revenue branch | a fifth of before |
| Transport Revenue | unchanged (already figures) |

## Checks (on live v12.21 `f06ddbdf…`, candidate `d286f3a53f56574a016cb8505d8164b7631b70ec9cc038f9ebe8cb3591afa7e4`, 15,387,177 bytes)
- `tests/test_v1222.cjs`, side by side with the live page: 13/13 on desktop and 13/13 on phone (`evidence/test_*.txt`). It held:
  - every money figure unchanged: total charge $960,064.14, revenue $989,468.70, direct costs $429,510.83, V8 fencing $364,816.40, fencing cost $244,368.20;
  - the cards' figures unchanged (18 P&L amounts, 14 transport groups, 98 rehire cells);
  - the workings folded by default and all back when shown;
  - "Not in it yet" at 10 lines (from 23), keeping their figures (none lost, none new), with no character cut;
  - 0 page errors and 0 record writes.
- Both full sweeps: 27 tabs and 7 deep links, 0 errors, 0 console messages, 0 writes, on desktop and phone (`evidence/sweeps.json`).
- Phone screenshots (`evidence/phone_*.png`, staff names blurred). The cards sit in the P&L pane's "More info" folds; the screenshots open them.
- `check_page`: PASS.
- First tested as v12.20 on live v12.19: the same 13/13 on both, with both sweeps clean.

Build: `toolchain/build.sh v12.22 v12.22_figures_first_DRAFT/patch_v1222.py`, on live v12.21 `f06ddbdfca7b13394e1477d32f54813f7866b5e371160dd876aa94639712bab7` → `d286f3a53f56574a016cb8505d8164b7631b70ec9cc038f9ebe8cb3591afa7e4`, 15,387,177 bytes.
