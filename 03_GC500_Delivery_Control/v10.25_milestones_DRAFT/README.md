# v10.25 — Milestones: a 100% celebration and a generated start-to-finish summary per area

Author: Andrew Fisher · 15 Oct 2026

Andrew, 15 Oct 2026 about 09:15 AEST in Claude's chat: "when something reaches 100% we need to do an animation
almost like a celebration fireworks over it. I don't know. And a summary on start to finish from 0-100% keep in mind
for future this needs to be automated no stories just generated data based on what has happened in that area. Purely
just an idea. Example now. Buildings is now at 100%"; then "Build it same way".

## What is on the page (`patch_v1025.py`, `ms1025.js`, `ms1025.css`)

- **The areas** are the Today tab's Work progress board's own — Buildings, Toilets, Generators, Lighting, VMS boards,
  Equipment — with Done and Left by the board's own rule (`todayWorkMetrics840`: recorded complete ticks across the
  whole active scope). Fencing is metres of docketed work, not references, and is left out. An area is **at 100%**
  when the board says every unit is done and nothing is left, and it has at least three references (an area of one
  or two is listed with its percent, never celebrated).
- **The badge**: on the area's card, beside its name, `100%` and the day it got there — the day of the last complete
  tick on the record — with the hover telling which reference and when.
- **The burst**: a canvas over the card, six bursts of coloured particles with trails and an orange glow, about four
  seconds, pointer-events none, placed in the part of the card that is on the screen (a tall card on a phone is
  mostly below the fold). It plays **once per browser per moment** (`localStorage` `ms1025_seen`, keyed by the
  area and the time of the last tick, so a re-reach after an un-tick plays again), only when the board shows today,
  never again on a redraw. With reduced motion asked for, the glow alone. "Celebrate again" under the summary
  replays it.
- **The summary** (`#ms1025`, under the board): every area with its percent; the reached ones open with the facts —
  references on the job / on site / complete, the board's unit count, first on site, first complete, the last
  complete (the 100%), days start to finish, levelled and steps, asset numbers and which references have none,
  accessories, who ticked complete and who set on site **as recorded** (the names exactly as the record holds them,
  "andrew fisher" and "Andrew Fisher via Codex" included), lights that moved more than once, un-ticked and ticked
  again, on site with no dated history, the item mix — and a by-day table of on-site and complete counts with bars.
  Every line is a count or a stamp off the delivery documents and the asset list as at the board's day; nothing is
  written by a person or a model, and the section says so.
- **Print**: `#print/milestone/<area>` (buildings, toilets, generators, lighting, vms, equipment) one A4 sheet in the
  pre-start's print style — the orange 100%, the facts table, the by-day table, the source line with the time the
  page generated it; `#print/milestone/all` one sheet per area at 100% with a page break before each. An unknown
  area says so on the bar.
- **No record document.** The 100% moment is derived from the last complete tick, so a view link shows the same as
  an edit link and nothing is written anywhere. The Progress email is unchanged (not done this version).
- Footer ` · v10.24` → ` · v10.25`. Six anchors in the main script (the Today tab's redraw, the print deep link, the
  print bar document and words, hash-to-tab) each matched once; the style and script blocks go before `</body>`.

## Checks (`tests/test_ms1025.cjs`, read only through the harness; results in `tests/test_ms1025_result.json`)

```sh
toolchain/build.sh v10.25 v10.25_milestones_DRAFT/patch_v1025.py
PAGE=build/GC500_v10.25/GC500_Delivery_Control_hosted.html node v10.25_milestones_DRAFT/tests/test_ms1025.cjs
```

| check | result |
|---|---|
| view link, phone: the board and the section; the badge with its day on every area at 100% (Buildings, Equipment) and on no other; the burst once on first sight, remembered, gone after, not again on a redraw; every area listed with a percent, the reached ones open with 15 fact rows, the by-day table, a print link and a replay; the Buildings facts agree with an independent read of the delivery documents (52 of 52 complete, the 100% moment P60 15 Oct 2026 08:56 AEST); no agent names, no undefined/NaN; footer v10.25; no errors; no writes | PASS |
| print path, desktop: `#print/milestone/buildings` one fitted sheet (zoom 1) with the facts and 15 by-day rows; `#print/milestone/all` 2 sheets, 1 break; an unknown area says so; Close restores | PASS |
| the other tabs route; the section is back on `#today` | PASS (19 of 19) |
| desktop sweep / phone sweep | 24 tabs each, 0 errors, 0 console, 0 writes |
| screenshots looked at | `tests/shots/` (phone badge, phone burst, phone section, desktop print) |

## Source

| file | sha256 |
|---|---|
| live v10.24 (base) | `681da5c7c631a5ccefe25a0f294020feb79a204e2e89211ebb7ff191a9e73dac` |
| candidate `build/GC500_v10.25/GC500_Delivery_Control_hosted.html` | `66878d12b8f4a98c177b3bf07f30efcce501da46f56b3244b92da94e458b320f` (17,774,683 bytes, 126 scripts) |
