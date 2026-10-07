# v8.85 — Where we are: the whole job

Author: Andrew Fisher. Claude build. Andrew, 7 Oct, with a screenshot of the "Where we are on the programme" panel: "this needs to almost be above the lighting tower and vms etc. and set up the same. where are we at. like as a whole percentage also utilising the 5 lights this needs to be much larger. animation is a must. this is where we are at and what percentage obviously still use data that is relevant".

Presentation only. No data, record, Finance or other-tab changes.

## What changes on Today

- **One "Where we are" card directly above the group cards**, in the same housing as the group cards: orange top edge, teal panel, the same dark gauge.
- **Large gauge.** Five race lights, "WHOLE JOB" and the whole-job percentage. The lights are about twice the size of the group lights: 85 px on a 1600 px laptop and about 118 px on a wide screen, against the group cards' 44–58 px.
- **The programme panel moves into the card unchanged**, with its own controls:
  - programme day and days to race weekend;
  - the rail, next milestone and key dates;
  - its week buttons and its "Open Where we are" link.

  The old copy below the cards is gone, so nothing is shown twice.
- **Seven group readings along the bottom.** Each one matches its card exactly. Tap one to go to that card.
- **Animation:**
  - **Intro:** as the card comes into view, the figure counts up and each light comes on as the count passes its 20% step. The bars fill, then the reflection sweeps the lit lights, the same as the group gauges.
  - **Pause and Play:** Pause stops it; Play replays it.
  - **Reduced motion:** with reduced motion, or the page's Motion off, the final figure shows with no movement.
  - **Record refresh:** a refresh does not replay the animation, and keeps the scroll position and the focused control.

## The figure

Whole job is the average of the seven group readings, each counting one seventh: Buildings, Toilets, Fencing, Generators, Lighting, VMS boards and Equipment.
- **Source:** the same records the cards use. The equipment groups use confirmed completion; Fencing uses recorded Build + Event programme metres. Metres are never added to unit counts.
- **Minimums:** if any group shows a minimum (≥), the whole job does too, rounded down.
- **Lights:** one red light per 20% reached. All five turn green only at a confirmed 100%.
- **Selected day:** the figure follows the day picked on Today and says "As of …" when that isn't today.

On 7 Oct 2026 at 23:55 the card shows **≥53.86%**, with 2 of 5 lights. Toilets is a minimum (≥50%) and Fencing is a provisional programme, so both are named as provisional under the figure.

The equal weighting comes from the agreed design in the staged model. Equipment at 6/6 counts as much as Fencing at 20 km. The basis is spelt out in the card's "How the whole-job figure is worked out" fold.

## Source

- **Model:** `progress881_model.js` is the seven-group model staged in `v8.81_progress_scene_DRAFT`, used unchanged with its 12 tests (`tests/test_model881.cjs`).
- **Not taken from that draft:** the banner moved into a fold, the weather art, the 2.7 MB equipment picture and the card restyling. Andrew did not ask for those here.
- **Card code:** `where885.js` and `where885.css`. The card mounts inside the Today redraw, before scroll and focus are restored, so a record refresh never jumps the page.

## Build

v8.84 is not live yet, so the build chains both patches:

`toolchain/build.sh v8.85 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py`

Once v8.84 is live: `toolchain/build.sh v8.85 v8.85_where_we_are_DRAFT/patch_v885.py`.

Candidate on live v8.83 `88a3584e` (v8.84 included): `6f97528f169fc83af8109e9e1ae6040e199a142dec659e0c9100cf2cc835aff5`, 11,166,740 bytes.

## Checks

`tests/test_where885.cjs` (24 checks), at `W=` widths and `MOB=1` for phone:
- **Placement:** the card sits above the group cards, and the programme panel moves inside once, with its controls.
- **Figures:** the whole job matches an independent calculation from the seven group records. The lights match the 20% steps, and each group reading matches its card.
- **Size:** the lights are at least 1.6 times the group lights.
- **Motion:** pause settles the figure; play replays the count and the lights; the intro ends on the exact figure. Reduced motion shows the final figure.
- **Links and redraws:**
  - a group tap reaches its card;
  - a redraw keeps scroll, focus, data and money and does not replay;
  - the selected day drives the figure and says "As of".
- **Print and safety:** print keeps the figure; no errors; no live writes.

Results are recorded in `evidence/` and on the board when the suite finishes.
