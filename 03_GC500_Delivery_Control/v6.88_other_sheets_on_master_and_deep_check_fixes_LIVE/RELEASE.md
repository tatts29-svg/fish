# v6.88: other sheets on the master, plus the deep-check fixes (LIVE)

Author: Andrew Fisher
Live: 27 Sep 2026, 07:28 AEST. Approved by Andrew: "Do the fixes / If they are on other sheets lets add to the master".

## What went live

1. **The v6.81 deep-check fixes** (approved). All 12 are in `patch_v681.py`:
   - relocated units in the labour plan;
   - stable question ids;
   - typed hours kept;
   - clearing accommodation removes the night;
   - duplicate-name check;
   - the edge cases for equal times, rates and breaks;
   - salaried detection;
   - hours to 2 decimals;
   - the pay-rule text;
   - usable filters.
2. **The one-map master (v6.87)**:
   - the master opens by default;
   - trade and stand filters;
   - two master pictures per unit, plus one site photo, one aerial photo, or a stock picture.
3. **What the other sheets draw is now on the master (v6.88).** A new **Show** bar on the Map has these buttons:

   | Button | Count | Source |
   |---|---|---|
   | VMS boards | 19 | D025 (on by default, as before) |
   | Water barriers | 20 runs | Zone pages K221–K231. Each page is lined up with the master using the words both share; the colour gives traffic management or HVM, and the page's own counts go with it. |
   | Gates | 19 | D001 (approach and fence line, plus the Cypress inset) |
   | Entry points | 23 | D001 E.P marks |
   | Big screens | 13 | D024, each leader line followed to its arrow |
   | Other gensets | 9 | D024: EE (Eventelec, direct hire) and TV (SC Television, self supply). Not ours. |
   | Interface areas | 4 | D022: EVL, GEM, TAL, COO, marked "not in BOQ" |
   | Toilets not on our schedule | 3 | D023: WC18, WCBS, WCTV |

   Pressing a place shows what it is and which drawing it came from, with Drive / Walk / Earth links.
   When Water barriers is shown, our WB references stay lit. When VMS is shown, our VMS references stay lit.
4. **P27 and P29 are now on the master** (both 51 buildings were missing before; there are now 164 master positions).
   - The master (rev 03) tags them in the block "P34/24/26/27/28/29", so that tag is what the page uses.
   - D022 (rev 02) drew their arrows about 20 m west, beside T&S. That disagreement is written in the drawer.
   - Each has a close and a wide master picture.
5. **Tidy-ups:**
   - The map search now lights master markers. It used to dim everything on the master.
   - Area markers now fade with the filters.
   - The master is left out of the "callout with nothing at it" list, the breakdown form sheets and the Edit sheet list.

## How the barrier pages were placed

| Pages | How they were matched | Fit |
|---|---|---|
| K221, K222, K226, K227, K228, K229, K231 | Shared words (tags such as WC32, P51, OP62, G2) matched to the master | rms 0.03–1.5 pt, about 0–1 m |
| K223, K224, K225, K230 | Only one or two shared words. Scale taken from the font size and checked on a second word (G4; FOCUS/5A; PINE AVE; T2/T3). | Within about 1 pt |

- Three runs fall past the edge of the master: two in Zone 8 (west of Helen Park) and one in Zone 5 (east of Norfolk Ave). They stay on their zone pages in Documents.
- K220 is the zone overview and is not used for positions.
- Each run is shown as one marker at its middle. The popup gives the run length and the page's counts.
- The page does not link runs to WB references. The drawings do not say which WB number each run is.

## Still not on the master

These can't be placed from the drawings:
- **P24:** no schedule row carries it.
- **GN25:** listed in a side box on D024 with no leader.
- **LT01–06:** in the Molendinar yard box.
- **WC10, WC66, WC85, WC100:** on no sheet.
- **WB01, WB05, WB06:** the zone pages don't name them.
- **FL01/02, NVLT and the T-numbers:** no drawing.

## Build

`v684 + patch_v685 (master_loc_688.json) + patch_v686 (new_media_688.json, media manifest 455 files) + patch_v681 + patch_v687 + patch_v688 (master_extra.json)`

## Checks

**Run locally and on live (live checks were GET only):**
- `t688.js` at desk and phone widths. All 8 Show buttons work, the popup and links work, P27 shows its pictures, no errors.
- Live page identical to the build, byte for byte (6,872,147 bytes).
- Live figures unchanged:
  - labour charged $12,809.50;
  - hours 2,003.5 worked, 1,909 paid, 159 on race days.

**Run locally only:**
- `deep_data680`: no issues.
- `fix_test681`, `map_test_master`, `search_test`, `rs_test`, `t687`, `nav_test`: all pass.
- `axe_slow`: no violations.
