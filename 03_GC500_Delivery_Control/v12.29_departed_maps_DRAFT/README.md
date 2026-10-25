# v12.29 — a departed icon on the main maps

Author: Andrew Fisher

Andrew, 26 Oct 2026, after GN10's generator 1283681 was recorded as left site at 07:40: "And we want a departed icon now too on the main maps too please".

The Map explorer already marked LEFT SITE (v12.11). The other maps showed nothing once equipment had gone: GN10 stood on the satellite map of VMS boards, generators and gates as if it were still there.

| Map | What it shows now |
|---|---|
| Satellite map: Map tab "VMS, generators & gates", and the VMS tab's board map | A departed generator or board is faded with a ↗ on a green disc. Its label reads "GN10 · LEFT SITE" (a part pick-up: "3 LEFT"), and its title gives the time. Its list row says "↗ Left site · 26 Oct 07:40". One line under the buttons names everything that has left on that map. |
| Drawing sheets (master plan, D024 and the rest) | The pill gets the same ↗ disc on its free corner (bottom left). It is dashed once everything on it has left, and its title and accessible name say "left site" with the time. |
| Map explorer card | It read "Left site · Qty 0" (the quantity still to leave) and "In transit … Still to come: On site → At location → Installed → Finished". It now reads "Left site · Qty 1" and "Left site 26 Oct 07:40 · nothing still to come on site". |

**Where it reads from.** Everything comes from the page's own departure record: `Departure1211`, the typed collection quantities with the actual time.
- `Departed1229` (in `departed1229_src.js`, inserted before the satellite map's script) reads it once per record change, and only for the references whose delivery history holds a collection entry.
- The satellite card is built once and kept across redraws. A redraw of the tab brings its key line, rows and pins up to the record.
- Read only: no record, charge, count or hire changes.

**Base and build.**
- Base: live v12.28 `c8057284f1b0f42f7eef336a4def584574e7baea8146239c5273fbcee0c497d3`.
- Candidate: `a4d611111a0ab0dd89f7effa753a52502fae661d39afc3bded2d98beeddc4276`, 15,465,834 bytes, 205 inline scripts.
- Build with `bash toolchain/build.sh v12.29 v12.29_departed_maps_DRAFT/patch_v1229.py`. Each of the 14 edits must find its text exactly once, and the patch refuses any other base.

**Checks.**
- `tests/test_v1229.cjs`: 27/27 on desktop and on phone (`evidence/test_v1229_*.txt`).
  - Part A reads the live record (GN10 left site 26 Oct 07:40) on the satellite map, the VMS tab, drawing D024 and the Map explorer card.
  - Part B rehearses, through the page's own Record departure form with the sync held in the page: a part pick-up (the pill gets the icon but is not dashed), and a whole VMS delivery leaving (its board's pins get the icon on both satellite maps). Writes are captured in the page and none reach the network.
- Both sweeps: 27 tabs, 19 panes shown, 7 deep links and Back; 0 errors, 0 console messages, 0 writes (`evidence/sweeps.json`).
- `check_page`: PASS.
- Phone pictures are in `evidence/`.
