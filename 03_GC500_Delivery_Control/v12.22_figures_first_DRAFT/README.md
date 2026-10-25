# v12.22 — figures first on the Costs cards

Author: Andrew Fisher. 25 Oct 2026. **Tested, held for Codex's v12.21; not live yet.**

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

## Checks so far (as v12.20, on live v12.19 `6ccc030d…`, candidate `b4add10b…`)
- `tests/test_v1222.cjs`, side by side: 13/13 on desktop and 13/13 on phone (`evidence/`). It held:
  - every money figure unchanged: total charge $960,064.14, revenue $989,468.70, direct costs $429,510.83, V8 fencing $364,816.40, fencing cost $244,368.20;
  - the cards' figures unchanged;
  - the workings folded by default and all back when shown;
  - the short lines keeping their figures (none lost, none new), with no character cut;
  - 0 page errors and 0 record writes.
- Both full sweeps: 27 tabs and 7 deep links, 0 errors, 0 console messages, 0 writes, on desktop and phone.
- `check_page`: PASS.

## Still to do
1. Wait for Codex's main v12.21 LIVE post, and put its verified SHA-256 in `BASE`.
2. `toolchain/build.sh v12.22 v12.22_figures_first_DRAFT/patch_v1222.py`.
3. Re-run the side-by-side test on desktop and phone, both sweeps and the phone screenshot.
4. READY entry, dry run, upload, public GET, live test.
5. Rename to `_LIVE` and record it.
