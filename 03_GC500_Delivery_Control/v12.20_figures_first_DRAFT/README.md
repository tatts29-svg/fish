# v12.20 — figures first on the Costs cards

Author: Andrew Fisher. 25 Oct 2026. **Built and tested; not live yet.**

Andrew (Claude's chat): "i want this the amount of info shortened no one is going to read all this we just want Figures", on these cards:
- the Forecast P&L's Revenue and Direct costs;
- "Not in it yet";
- Transport Revenue;
- Rehire by Revenue branch.

And: "OUR DATA MUST BE CLEAN. OUR DATA IS TRUTH. ITS DEMOB TOMMORROW SO ALL COST NEED TO BE VERY CLEAR".

## What changed
- **Figures first.** Forecast P&L, Transport Revenue and Rehire by Revenue branch show their figures. The explanations fold away under a **Show the workings** button on each card, and the page remembers the choice for the visit.
- **"Not in it yet" is 10 lines, not 23.**
  - The 13 water-barrier lines are one line: 13 × TL2 (WB01–WB07, WB13–WB18).
  - Each line keeps its first clause, then any clause that carries a figure.
  - Quotes, who-said-it notes and bracketed lists with no figure move to the full list, under the workings.
- **Presentation only.** No figure changes, and every word is still on the page.

| Card | Text showing by default |
|---|---|
| Forecast P&L | about a quarter of before |
| Rehire by Revenue branch | a fifth of before |
| Transport Revenue | unchanged (already figures) |

## Checks
- `tests/test_v1220.cjs` (base = live v12.19, side by side):
  - every money figure is unchanged: total charge $960,064.14, revenue $989,468.70, direct costs $429,510.83, V8 fencing $364,816.40, fencing cost $244,368.20;
  - the cards' figures are unchanged;
  - the workings are folded by default and all come back when shown;
  - the short lines keep their figures (none lost, none new), and no character is cut;
  - 0 page errors and 0 record writes.
- `check_page`: PASS.

Build: `toolchain/build.sh v12.20 v12.20_figures_first_DRAFT/patch_v1220.py`, on live v12.19 `6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16` → `b4add10bd3ac0f3b0b61f5930188bfd79486412b894cf3e88e7023f5239e3d38`, 15,375,168 bytes.
