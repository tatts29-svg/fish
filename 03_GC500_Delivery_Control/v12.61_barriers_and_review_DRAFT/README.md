# v12.61 — the water barriers where the K sheets put them, and three of the night's asks

Author: Andrew Fisher · built 30 Oct 2026 on the live v12.56 (`cb27d7c56a41c0d5b2fcd19294800b5095fe690da0fe3c91937e8ed9babbdc5c`) ·
**PREVIEW, not uploaded** — Andrew to look first; upload only on his word.

No money moves: charge 998,997.00 before and after; nothing on the record changes.

## What Andrew asked for (30 Oct 2026, 01:38 to 02:01 AEST) and what this does

| Andrew | What it was | What v12.61 does |
|---|---|---|
| "Your water barriers look all wrong. All locations look all wrong. Nothing matches correctly." (with the WFB program, updates 29/10/26) | No WB reference has a pin, so every surface fell back to an area-level point taken from a label on the master plan (WB16 at the Commodore Park label, WB03, WB18 and WB20 all on the one Turn 2 marker, WB17 on the T6–T9 markers) or a guess from the description words (WB01, WB05, WB06). The Build strip said "the spot the description names". | Every WB reference's position comes from the customer's water barrier drawings K220–K231 (the page's own Documents copy): the yellow pieces read off each zone sheet, the sheet registered to the K220 master by their shared labels, the master to the site frame by the runs it shares with the page's traced shapes, the frame to the ground by the page's georeference. Navigate, the Build cards' strip, the Demob cards' pictures and plan piece, Find it on the map and the finder all point at the drawn run and say so ("where water barrier drawing K229 puts it (zone 9: Gate 2 - HVM)"). The explorer's barrier shapes are rebuilt from the same runs. Four names follow the programme: WB01 "Gold Coast Highway (Northbound) - PB3 Footing/Stairs", WB05 "Main Beach Light Rail - Bus Stop", WB13 "Fence bracing behind S15 + Ped Crossing", WB16 "Gate 2 - HVM". The programme object carries the 29/10/26 updates (WB19 reinstated 3–6 Nov, 4 days; WB01 median-strip note; WB07 and WB22 "Monday night"). |
| "We cant have last day showing this" (Thu 22 Oct at 99.88%, no completed stamp on his phone) | The whole-build index at Thu 22's close still counted 28 m of event crowd barrier that went in on the Friday morning and 142.5 m of demarcation barrier plus 12 pedestrian gates the programme listed but were never built (the scope settles at the race-weekend cut-off, v11.63). | The last build day card carries the whole build to the race-weekend cut-off: "WHOLE BUILD · TO THE RACE WEEKEND · 100%", the Day completed stamp, and More info says why. Every other day card reads as before. (The stamp was always in the page for Thu 22; the harness draws it. If it is still missing on the phone after this release, that is a phone rendering matter to chase separately.) |
| "The left site icons are really bad... The icon is always the shape of the description... a clear departed pulsation or glow... and qty departed" | A departed reference's mark on the explorer was a grey disc with an arrow glyph, the same for a building, a toilet or a board (and only while the reference was a search hit: the explorer draws no marker for an unsearched reference); the rings were off by default since v12.56, and on their own they were empty circles. | Every departed reference gets one mark, searched or not: the equipment's own symbol (the page's map symbol set, v11.47: building, toilet, generator, board, barrier…) on a dark disc, a green ring that pulses (dashed where only part has gone, red where it needs review) and a badge with how many have gone (n, or n/total for a part). A searched or selected reference keeps its own badge, now with the same symbol, inside the ring. Always on; the v12.56 switch comes off and the key on the map says what the marks mean. |
| "In build can we show 3 maps 1 to include the drawing location" | The v12.47 strip drew one wide picture. | The strip shows three: close up, wider area, and the master plan drawing with the equipment's icon in a neon ring on the spot (the Demob cards' plan piece, v12.36). A reference with no spot on the drawing says so on the third panel. Same lifecycle and caps as v12.47. |

## Where the runs are (what the drawings say)

| Ref | Zone · sheet | Programme location | Qty | On the page now |
|---|---|---|---|---|
| WB01 | 9 · K229 | Gold Coast Highway (Northbound) - PB3 Footing/Stairs | 12 | the 12 inside the HVM box at PB3 / OP62 |
| WB02, WB19 | 11 · K231 | S08 - Pedestrian Pathway along Main Beach Parade | 34 | the 31-piece run along Main Beach Parade by T10/T9 |
| WB03, WB20 | 10 · K230 | Gold Coast Highway (Turn 2) | 30 | 20 in the Turn 2 median box + the 10 moved to Ferny Ave (reinstated Monday PW1) |
| WB04 | 9 · K228 | Helen Park - HVM | 13 | the HVM run on Breaker St at the west edge of Helen Park |
| WB05 | 13 · K220 | Main Beach Light Rail - Bus Stop | 12 | the run by the light rail station (zone 13 has no sheet in rev 02; from the master) |
| WB06 | 1 · K221 | Gold Coast Highway Macintosh Park Turning Lane | 154 | the two long runs along the highway at Macintosh Park |
| WB13 | 10 · K230 | Fence bracing behind S15 + Ped Crossing | 10 | on the S15 fence line in the Turn 2 box (approximate: the rev 02 sheet predates this row) |
| WB14 | 2 · K220 | MP4.0 Turn 4 Drivers Right | 2 | the 2 at Turn 4 |
| WB15 | 6 · K226 | Turn 11 Runoff (Main Beach Parade North) - HVM | 4 | 2 + 2 either side of G7 at OP11 |
| WB16 | 9 · K229 | Gate 2 - HVM | 13 | the 6 + 7 in the HVM box at G2 (not the Commodore Park label) |
| WB17, WB18 | n/a | Racing kerbs T6/7/8/9 · T2 | 6 · 2 | not on the K sheets (Track Services' request): at the turns, marked approximate |
| WB22 | 10 · K230 | Marriot pedestrian crossing closure | 4 | the pieces at the tram crossing island (the sheet shows 3 + 3 + 2; the programme has 4) — not on the register, so no card yet |
| WB07, WB21 | 1 · 13 | Coates quantity 0 (the 17 at Admiralty Drive are Downer's WB08) | 0 | programme rows only |
| WB08–WB12 | Downer | — | 253 | Downer's, not ours: programme rows only, no marks |

The reading: `tools/zone_runs.py` (yellow pieces off each zone sheet, registration by shared labels, two-point fits for K230 and
K231 on T2/T3 and T9/T10), `tools/overlay.py` (the check pictures), `tools/make_wfb1261.py` (the per-reference file
`wfb1261.json`), `tools/shapes_wb1261.py` (the explorer shapes). The drawing PDF itself stays private (the page's Documents
copy, 18,125,184 bytes, `fbfc4ff9…`).

## Proof

- Every WB key on the register: the one destination reads `drawn` with the drawing's words; Find it on the map returns
  the same point with "position: where water barrier drawing K2xx puts it (zone N: …)"; 15 master-plan points placed;
  12 barrier shapes rebuilt; the Demob plan piece for WB16, WB06, WB03 and WB13 sits exactly on the run.
- Thu 22 Oct card: "WHOLE BUILD · TO THE RACE WEEKEND · 100%", Day completed stamp, More info paragraph; Wed 21 unchanged
  at 93.43% (`evidence/desktop-lastday.png`).
- Build strip: WB17 and WB18 cards draw the three-panel picture (`evidence/desktop-strip_wb17.png`).
- Explorer: with nothing searched, every departed reference at the pit lane draws its own symbol on a dark disc inside
  the green ring with its count (`evidence/desktop-explorer_noselect.png`, `evidence/desktop-explorer_area1.png`);
  a selected reference keeps its own badge, now with the symbol, inside the ring (`evidence/desktop-explorer_marks.png`);
  the status object reads shape circle, glyph e100 (toilet) for BJR01 and e10c (barrier) for WB06; the v12.56 switch is
  gone from the Map tools bar (hidden and display none) and the key reads what the marks mean; the same on the phone.
- Programme object: WB19 3 Nov, 4 days, 136; WB01 note; updates line present.
- Page checks: 220 inline scripts parse, no secrets, Author kept — PASS; every existing style block byte-identical except
  the Build strip block. 0 page errors on the probes.

## Build

```
cd 03_GC500_Delivery_Control
bash toolchain/build.sh v12.61 v12.61_barriers_and_review_DRAFT/patch_v1261.py
python3 toolchain/upload_page.py build/GC500_v12.61/GC500_Delivery_Control_hosted.html   # on Andrew's word only
```

`patch_v1261.py` requires the v12.56 footer and modules and refuses to apply twice. Files: `patch_v1261.py`, `wfb1261.js`,
`wfb1261.json`, `three_maps1261.js`, `tools/`, `tests/`, `evidence/`.
