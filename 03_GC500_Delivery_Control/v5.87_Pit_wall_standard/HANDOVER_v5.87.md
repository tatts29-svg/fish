# v5.87 handover — the pit-wall standard on the banner and Today

Date: 25 Sep 2026. Built by Claude Code for Andrew Fisher from the v5.86 page and builder. Not yet uploaded: Andrew
decides when it goes up (v5.85 transport and v5.86 search views are also waiting on the same yes).

## What is in this folder
| File | What it is |
|---|---|
| `patch_v587.py` | The change set. Exact-once string replacements; nothing is written unless every one matches. Runs on the builder (`print/build_asset_app.py`) or on a built page (then it needs `car_26.webp` and `hz_backdrop.jpg` as the next two arguments). |
| `build_asset_app_v5.86_to_v5.87.diff` | The builder diff for reading. |
| `web/hz_backdrop.jpg` | The circuit at dusk, graded once (2048 × 499). Put it at `print/web/hz_backdrop.jpg` in the source tree so the builder ships the same picture the stills show; the builder only makes its own if this file is missing. |
| `CHANGELOG_v5.87_entry.md` | The CHANGELOG entry to paste in. |
| `stills/` | What it looks like: 1920, 1440 and phone, from the live record over the https stand-in. |

## How to apply
```
python3 patch_v587.py print/build_asset_app.py
cp web/hz_backdrop.jpg print/web/hz_backdrop.jpg
python3 print/build_asset_app.py        # the normal build, then the gate and the seal as usual
```
Or on the built v5.86 hosted page, without a rebuild:
```
python3 patch_v587.py GC500_Delivery_Control_hosted.html print/web/car_26.webp web/hz_backdrop.jpg
```
The page grows by about 500 KB (the two pictures ride inline as data URIs, so no media import is needed).

## The parts, so the next tab can use them
Everything is CSS classes in one block (search the stylesheet for `v5.87 - THE PIT-WALL STANDARD`) and three JS
functions. Use these on the next tabs rather than inventing new ones.

| Part | Where | Notes |
|---|---|---|
| Scene | `header.top` + `.hzscene` | the graded photograph, a grade, a flare; print turns it off |
| Cluster | `.hzcluster` | carbon twill (8 px SVG cell), a shift light `#hzshift` lit by seconds in `tpodPaint()` |
| Pod | `.hzpod`, also `.tpcard > .face` and `.recstrip` | bezelled dark glass; `.lab` caption, `.num` race numeral, `.sub` line |
| Countdown | `#hzcd`, `hzCountdown()` | days to race day; the rail `--p` is the calendar position; cached per day |
| Record pod | `recStrip()` | three lamps `.rslamps`, state word; steady, never pulsing |
| LED tile | `.tsq` | the Today strip's tiles; caption above, race numeral, caption below |
| Island | `.card.island` | carbon card with four screws; `.lights`, `.dialcard`, `.racecard` variants |
| Signal head | `signalHead(t)` | SVG, three lenses, one lit; sits first inside `.hublights` |
| Chrome dial | `completionDial()` | `girim` chrome stops, `.gikn` knurl, `.gired` red zone, `.giring`, `.giglass` |
| Card | `.hubcard` | white, orange top edge, race numerals in `.hubbig b` |
| Instrument row | `.inst` | 400 px + the rest; the programme spans both; one column under 900 px |

## Rules kept
- No figure invented; every reading is the one the page already computed.
- The record is not touched; no server change.
- Nothing deleted: the hero and the brief moved below the cards; the old bar's parts are still in the markup.
- Keys stay out of files. None are in this folder.
- Tests: rendered and measured at three widths with no console errors (see the CHANGELOG entry). The gate and suite are
  PENDING until the handover tree is complete (parts 20 to 23 still missing).

## Next
1. Andrew's yes → upload the page (the v5.85 and v5.86 changes are already in it: the v5.87 page was patched on top of
   the v5.86 page, which carries v5.85).
2. Roll the same parts to Where we are, Timeline, Costs & charges, Fencing, Register, Map, Documents, Coates Way and
   About: stills first for each, then the patch.
3. When parts 20 to 23 arrive: rebuild from the builder, run the gate, seal, kits.
