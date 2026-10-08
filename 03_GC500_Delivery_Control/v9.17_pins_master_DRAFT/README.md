# v9.17 — every navigation pin on the unit the 2 Oct master draws (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT — built and tested, waiting on Andrew's yes. Not uploaded, not committed.**
Codex publishes once Andrew says yes; the publisher sets the next free footer (this patch leaves the footer alone).

## What Andrew asked

Andrew, 8 Oct 2026 about 15:25 AEST: "i need you to work on pin locations on the master your pinned locations and where you
have things needs to be 100% accurate with locations are so when people navigate your information is 100 % accurate at all
times workimhg off the new master sheet we need toi pin things right to where things need to go", and about 15:30: "Continue
with the pin fix … needs to be 10/10".

The pin audit (read only, `wf_7b2231c9-64c`) is finished. This release applies its verified moves, after each one was worked
out again from the PDF here. **WC09 delivers Fri 9 Oct.** Its pin today sits on the WC09 label, outside the compound fence,
6.6 m from the toilets. This release puts it between the two toilet blocks.

## What moves, and why

Source: `D001-26003-03-MASTER.pdf`, issued 2 Oct, sha256 `8753d875…`, read with pymupdf. The registration is
`v8.93_maps_aligned_DRAFT/assets_small/georeferencing.json`: the main transform for the main plan, and the inset transform
for the Cypress car park inset (CP1, WC81). The 12-tag fit is never used in the inset.

**Why they were off.** v8.89 read 165 pins off the master's **labels**. A label is printed beside the unit, usually 3–7 m
away. CP1 and T0243 were read off the arrow tips of the older rev 02 sheets (D022, D023). Each of the 23 now goes to the
**unit the master draws**. A single unit gets the centre of its outline. A group gets the middle of its footprint (the area
centre of all its drawn parts).

| Ref | Drawn on the master | Pin now | New pin | Moves | New pt (MASTER_LOC frame) | PDF check |
|---|---|---|---|---|---|---|
| WC09 | 2 toilet blocks, 4 toilets, 6 pee panels | -27.984740, 153.427965 | -27.984717, 153.428026 | 6.6 m north-east | 0.28309, 0.36190 | 0.07 m / 0.01 pt |
| CP1 | P68 building (the Signevent crib room), inset | -27.997490, 153.428257 | -27.997497, 153.428419 | 15.9 m east | 0.90691, 0.74989 (inset) | 0.06 m / 0.01 pt |
| T0243 | WC-TV toilet block (the master prints WC on it) | -27.987554, 153.428221 | -27.987534, 153.428271 | 5.4 m north-east | 0.46865, 0.34230 | 0.05 m / 0.01 pt |
| WC24 | toilet | -27.990988, 153.429651 | -27.991038, 153.429656 | 5.6 m south | 0.69952, 0.22861 | 0.01 m / 0.01 pt |
| WC35 | toilet | -27.981848, 153.427746 | -27.981799, 153.427761 | 5.6 m north | 0.09098, 0.38321 | 0.01 m / 0.01 pt |
| WC81 | toilet, inset | -27.997491, 153.428510 | -27.997509, 153.428455 | 5.7 m west | 0.90777, 0.74687 (inset) | 0.06 m / 0.01 pt |
| WC65 | toilet | -27.981482, 153.426352 | -27.981478, 153.426408 | 5.5 m east | 0.06965, 0.49494 | 0.02 m / 0.01 pt |
| WC26 | toilet | -27.988840, 153.429563 | -27.988803, 153.429594 | 5.2 m north-east | 0.55233, 0.23323 | 0.05 m / 0.01 pt |
| WC68 | toilet | -27.981453, 153.424445 | -27.981498, 153.424438 | 5.1 m south | 0.07069, 0.65768 | 0.04 m / 0.01 pt |
| WC86 | accessible toilet | -27.987660, 153.428216 | -27.987704, 153.428229 | 5.1 m south | 0.47980, 0.34581 | 0.00 m / 0.00 pt |
| WC25 | toilet | -27.990016, 153.428841 | -27.990061, 153.428838 | 5.0 m south | 0.63504, 0.29600 | 0.04 m / 0.00 pt |
| WC34 | toilet | -27.982349, 153.425863 | -27.982306, 153.425877 | 5.0 m north | 0.12406, 0.53895 | 0.05 m / 0.00 pt |
| WC70 | toilet | -27.981683, 153.424001 | -27.981659, 153.424041 | 4.8 m north-east | 0.08120, 0.69052 | 0.06 m / 0.01 pt |
| WC19 | toilet | -27.988201, 153.428261 | -27.988240, 153.428267 | 4.4 m south | 0.51508, 0.34275 | 0.05 m / 0.00 pt |
| WC16 | 2 toilet blocks | -27.985974, 153.427681 | -27.985938, 153.427692 | 4.1 m north | 0.36349, 0.38981 | 0.06 m / 0.00 pt |
| WC17 | 2 toilet blocks (inside the compound fence) | -27.986530, 153.428137 | -27.986529, 153.428095 | 4.1 m west | 0.40243, 0.35660 | 0.03 m / 0.01 pt |
| WC44 | 2 toilets | -27.988994, 153.428226 | -27.988968, 153.428254 | 4.0 m north-east | 0.56304, 0.34401 | 0.03 m / 0.01 pt |
| WC39 | 2 toilets | -27.983602, 153.423968 | -27.983626, 153.423993 | 3.6 m south-east | 0.21069, 0.69494 | 0.04 m / 0.01 pt |
| WC62 | 2 toilets | -27.981644, 153.429238 | -27.981667, 153.429218 | 3.2 m south-west | 0.08252, 0.26278 | 0.03 m / 0.00 pt |
| WC04 | toilet | -27.983871, 153.426545 | -27.983857, 153.426516 | 3.2 m north-west | 0.22627, 0.48648 | 0.05 m / 0.01 pt |
| WC02 | toilet (inside the P41 compound fence) | -27.983601, 153.425725 | -27.983618, 153.425700 | 3.1 m south-west | 0.21045, 0.55392 | 0.05 m / 0.01 pt |
| WC28 | toilet | -27.983376, 153.429175 | -27.983401, 153.429161 | 3.1 m south-west | 0.19664, 0.26785 | 0.02 m / 0.01 pt |
| WC50 | toilet | -27.989762, 153.429836 | -27.989786, 153.429821 | 3.1 m south-west | 0.61709, 0.21476 | 0.06 m / 0.00 pt |

"Moves" is measured from the page's pin to the new pin with the page's own distance formula (see the browser test). "PDF
check" is how far the listed point is from my own derivation off the PDF. The limits are 0.2 m and 0.3 pt; the worst is
0.07 m / 0.01 pt. Each pin's `how` now says what it is. For example, WC09: "the middle of the compound drawn on the master
D001 issued 2 Oct, between its two toilet blocks: 2 toilet blocks, 4 toilets and 6 pee panels; its WC09 tag is printed about
7 m from it". For CP1 and T0243 the drawer also shows a "Drawings differ" line, naming the older rev 02 arrow and how far
off it is.

**Pictures.** The 46 close-up and area pictures for the 23 pins are re-made from the PDF with the red ring on the unit. They
use the same windows, sizes, ring and WebP settings as today's pictures. The 46 old pictures leave the media list.

## Part 2 — one point per reference

Navigate (`dest782`) was already the single destination for the Navigate button, the SMS and drop text, the job sheet,
`dpPos` and the driver card. Some other surfaces still handed out a second point:

- the drop email's **Sat nav** line, read from the rev 02 drawing callout (`aerialPointFor`). On 127 references it was more
  than 1 m from Navigate, and 20 of those by more than 10 m (GN06 by about 1 km);
- the drawer's **satellite panel**: Approx. position, Copy, Street View, Google Earth, From Coates Kingston (same source);
- for the 13 **big screens** (LTC01–LTC14), the drawer's "Where it is" Drive / Walk / Earth, the drop email's button and
  the map pin / search spot. They went to the D024 arrow, while Navigate sends the driver to the pit lane (no drop-off is
  set for them).

Now all of these read `navPoint917(a)` = `dest782(a)`. Where Navigate goes somewhere other than the drawn spot (the big
screens' pit lane), the drawer says so in one line. The coordinates it shows stay the master's. The Sat nav line now says
"the same point as the button below (master plan)". The satellite panel says "the same point as Navigate (master plan)".
**No Navigate point changes because of Part 2.**

## Part 3 — wording

The master's legend reads "E.P = EMERGENCY EGRESS POINTS". The 23 E.P items on the map layer were labelled "Entry point".
They now read **"Emergency egress point (E.P)"**. The layer button is unchanged. Each item's `note` still reads "Pedestrian
entry point (E.P) drawn on the master." This was left alone because the release changes labels only (see the open questions).

## What is not touched

- GN18 and GN13: the generator symbols moved between issues, so identity is inferred, not proven. Waiting on Andrew.
- WC57 and WC59: waiting on Andrew's word.
- WC51, WC01, P26 and P28: left as they are.
- Every pin within 3 m.
- The 51 live references the master does not draw.
- The T0022 and T0023 pins, P47 and WC32.
- The record: no writes, and the version is the same before and after every test run.
- The footer, money and every other byte of the page (the identity test proves it).

## How to check it on site

1. **WC09 (Fri 9 Oct).** Navigate now ends between the two 6 m toilet blocks inside the new compound, not on the path
   outside the fence. Standing there, the four-toilet row is about 13 m to the west (inside the west fence) and the six pee
   panels about 9 m to the east. Drop a phone pin there with the page's "Pin where it stands"; it should land within a few metres of the new point.
2. **CP1 (P68 crib room).** In the Cypress Ave car park, Navigate goes to the 6 m building, not to the car-park fence about
   16 m west of it. WC81 is the toilet just north of the building.
3. **The others.** Each pin is on the toilet, not on its printed number. The drawer's close-up shows the red ring on the
   unit. WC04: Andrew's 24 Sep phone pin was 11.5 m from this toilet. If the toilet went in somewhere else, his pin is the
   truth on the ground and the master should be corrected.
4. A registration error of about 0.7 m (main plan) and 0.9 m (inset) remains. It is an image registration, not a survey.

## Open questions for Andrew

1. **GN18.** The 2 Oct master no longer draws a generator at GN18's pin; a container is drawn there. One new generator
   symbol appears 17.1 m away, beside P08/WC38. Is that GN18? Generators carry no tag, so the drawing cannot prove it.
2. **GN13.** Same pattern: the old symbol is gone and one new symbol sits 11.6 m west on the same fence. Is that GN13?
3. **WC57 / WC59 swap?** By the labels, WC59 is the 2-toilet pair, 5.3 m from its pin. By the schedule (WC59 = 7 FWF,
   WC57 = 2 FWF), WC59 is the 7-toilet row under the WC57 label, and WC57 would then be 11.8 m from its unit. Which is
   right? Both deliver Tue 13 Oct.
4. **T0022's two pins.** The brief lists this as open. What I can see: T0022 and T0023 are not on the master, and each
   goes to a phone pin (T0022 -27.983238, 153.426491; T0023 -27.983303, 153.426337), about 17 m apart. Which pin is T0022's
   drop? Neither was touched.
5. **Is LTCnn = BSnn?** The page's big screens LTC01–LTC14 sit 5–29 m from the master's BS01–BS14 symbols. If they are the
   same screens, their drops can come off the master instead of the pit lane.
6. **The 51 not on the master.** 51 live references (generators GN25 and the Concert set, light towers, the pit garages,
   most T-numbered transport and plant jobs, the water barriers from their descriptions) have no unit on the 2 Oct master.
   They go to the pit lane, a described spot or a pin. Does iEDM draw them on a later issue, or do they stay as they are?
7. **E.P notes.** The 23 E.P items' notes still say "Pedestrian entry point". Should they also read emergency egress?

## Also found, not in this release

- **Map explorer (machine set).** `plan_items.json` in the machine bundle carries its own copy of each pin's `pt`, so the
  explorer will still draw the 23 at their old spots until the machine set is rebuilt. Navigation is not affected: every
  link reads the page. That needs a machine release, which is the publisher's call.

## Files

| file | what |
|---|---|
| `patch_v917_pins.py` | the patch (refuses a second run; refuses a base whose 23 pins are not as audited) |
| `tests/derive917.py` | re-derives the 23 from the PDF → `evidence/derive917.json` |
| `tests/make_thumbs917.py` | the 46 pictures → `evidence/media917/` + `evidence/thumbs917.json` (deterministic: two runs, same bytes) |
| `tests/test_identity917.py` | test 1, identity → `evidence/identity917.log`, `evidence/identity917_code.diff` |
| `tests/collect_pins917.cjs` + `tests/compare_pins917.py` | tests 3 and 4, every row, laptop and phone |
| `tests/shots917.cjs` | phone screenshots of the WC09 and CP1 drawers |
| `evidence/media917/` | the 46 pictures, named by sha256. They are view-scope crops of the master the page already shows; encrypt them like `media893.zip.enc` before committing if the publisher prefers |

## Build and publish (publisher, on Andrew's yes)

```
toolchain/build.sh v917 v9.17_pins_master_DRAFT/patch_v917_pins.py    # plus the footer step the publisher uses
python3 v8.89_master_map_DRAFT/upload_media889.py v9.17_pins_master_DRAFT/evidence/media917 build/GC500_v917/media_manifest_v917.json --dry-run
python3 v8.89_master_map_DRAFT/upload_media889.py v9.17_pins_master_DRAFT/evidence/media917 build/GC500_v917/media_manifest_v917.json
python3 toolchain/upload_page.py build/GC500_v917/GC500_Delivery_Control_hosted.html
```

`upload_media889.py` is generic: it uploads only the files the manifest names that the service does not already hold,
checks each one's hash, then registers the manifest. Media goes first, because the service refuses a page whose media list
has no registered manifest. If live has moved past v9.11, rebuild: the patch refuses if any of the 23 pins is no longer
where the audit found it.

## Results

(filled in below)
