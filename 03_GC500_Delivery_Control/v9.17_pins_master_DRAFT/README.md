# v9.17 — every navigation pin on the unit the 2 Oct master draws (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT, second round: the 23 moves, plus GN18 and GN13 ("follow the master")
and 28 near moves toward 10/10 — 53 pins in all. Rebuilt on live v9.18 and every test rerun (results at the end). Waiting
on Andrew's yes. Not uploaded, not committed.** The publisher uploads once Andrew says yes and sets the next free footer
(this patch leaves the footer alone).

## What Andrew asked

Andrew, 8 Oct 2026 about 15:25 AEST: "i need you to work on pin locations on the master your pinned locations and where you
have things needs to be 100% accurate with locations are so when people navigate your information is 100 % accurate at all
times workimhg off the new master sheet we need toi pin things right to where things need to go", and about 15:30: "Continue
with the pin fix … needs to be 10/10".

The pin audit (read only, `wf_7b2231c9-64c`) is finished. This release applies its verified moves, after each one was worked
out again from the PDF here. **WC09 delivers Fri 9 Oct.** Its pin today sits on the WC09 label, outside the compound fence,
6.6 m from the toilets. This release puts it between the two toilet blocks.

Then, the same evening (recorded on `STATUS.md`):
- about 18:05, on the generators the 2 Oct master moved: **"follow the master"** — GN18 and GN13 are added;
- toward **10/10**: the 28 pins that sit on their printed tag 1.3–2.9 m from the toilets the master draws (the near list,
  checked two ways) are added. The ones that need his word (WC57/WC59, WC13, WC69) are held.

## What moves, and why

Source: `D001-26003-03-MASTER.pdf`, issued 2 Oct, sha256 `8753d875…`, read with pymupdf. The registration is
`v8.93_maps_aligned_DRAFT/assets_small/georeferencing.json`: the main transform for the main plan, and the inset transform
for the Cypress car park inset (CP1, WC81). The 12-tag fit is never used in the inset.

**Why they were off.** v8.89 read 165 pins off the master's **labels**. A label is printed beside the unit, usually 3–7 m
away. CP1 and T0243 were read off the arrow tips of the older rev 02 sheets (D022, D023). Each of the 23 now goes to the
**unit the master draws**. A single unit gets the centre of its outline. A group gets the middle of its footprint (the area
centre of all its drawn parts).

| Ref | Drawn on the master | Pin now | New pin | Moves (audit table → measured on the page) | New pt (MASTER_LOC frame) | PDF check |
|---|---|---|---|---|---|---|
| WC09 | 2 toilet blocks, 4 toilets, 6 pee panels | -27.984740, 153.427965 | -27.984717, 153.428026 | 6.6 → 6.51 m north-east | 0.28309, 0.36190 | 0.07 m / 0.01 pt |
| CP1 | P68 building (the Signevent crib room), inset | -27.997490, 153.428257 | -27.997497, 153.428419 | 15.9 → 15.92 m east | 0.90691, 0.74989 (inset) | 0.06 m / 0.01 pt |
| T0243 | WC-TV toilet block (the master prints WC on it) | -27.987554, 153.428221 | -27.987534, 153.428271 | 5.4 → 5.39 m north-east | 0.46865, 0.34230 | 0.05 m / 0.01 pt |
| WC24 | toilet | -27.990988, 153.429651 | -27.991038, 153.429656 | 5.6 → 5.58 m south | 0.69952, 0.22861 | 0.01 m / 0.01 pt |
| WC35 | toilet | -27.981848, 153.427746 | -27.981799, 153.427761 | 5.6 → 5.64 m north | 0.09098, 0.38321 | 0.01 m / 0.01 pt |
| WC81 | toilet, inset | -27.997491, 153.428510 | -27.997509, 153.428455 | 5.7 → 5.76 m west | 0.90777, 0.74687 (inset) | 0.06 m / 0.01 pt |
| WC65 | toilet | -27.981482, 153.426352 | -27.981478, 153.426408 | 5.5 → 5.52 m east | 0.06965, 0.49494 | 0.02 m / 0.01 pt |
| WC26 | toilet | -27.988840, 153.429563 | -27.988803, 153.429594 | 5.2 → 5.12 m north-east | 0.55233, 0.23323 | 0.05 m / 0.01 pt |
| WC68 | toilet | -27.981453, 153.424445 | -27.981498, 153.424438 | 5.1 → 5.05 m south | 0.07069, 0.65768 | 0.04 m / 0.01 pt |
| WC86 | accessible toilet | -27.987660, 153.428216 | -27.987704, 153.428229 | 5.1 → 5.06 m south | 0.47980, 0.34581 | 0.00 m / 0.00 pt |
| WC25 | toilet | -27.990016, 153.428841 | -27.990061, 153.428838 | 5.0 → 5.01 m south | 0.63504, 0.29600 | 0.04 m / 0.00 pt |
| WC34 | toilet | -27.982349, 153.425863 | -27.982306, 153.425877 | 5.0 → 4.98 m north | 0.12406, 0.53895 | 0.05 m / 0.00 pt |
| WC70 | toilet | -27.981683, 153.424001 | -27.981659, 153.424041 | 4.8 → 4.75 m north-east | 0.08120, 0.69052 | 0.06 m / 0.01 pt |
| WC19 | toilet | -27.988201, 153.428261 | -27.988240, 153.428267 | 4.4 → 4.38 m south | 0.51508, 0.34275 | 0.05 m / 0.00 pt |
| WC16 | 2 toilet blocks | -27.985974, 153.427681 | -27.985938, 153.427692 | 4.1 → 4.15 m north | 0.36349, 0.38981 | 0.06 m / 0.00 pt |
| WC17 | 2 toilet blocks (inside the compound fence) | -27.986530, 153.428137 | -27.986529, 153.428095 | 4.1 → 4.13 m west | 0.40243, 0.35660 | 0.03 m / 0.01 pt |
| WC44 | 2 toilets | -27.988994, 153.428226 | -27.988968, 153.428254 | 4.0 → 3.99 m north-east | 0.56304, 0.34401 | 0.03 m / 0.01 pt |
| WC39 | 2 toilets | -27.983602, 153.423968 | -27.983626, 153.423993 | 3.6 → 3.61 m south-east | 0.21069, 0.69494 | 0.04 m / 0.01 pt |
| WC62 | 2 toilets | -27.981644, 153.429238 | -27.981667, 153.429218 | 3.2 → 3.22 m south-west | 0.08252, 0.26278 | 0.03 m / 0.00 pt |
| WC04 | toilet | -27.983871, 153.426545 | -27.983857, 153.426516 | 3.2 → 3.25 m north-west | 0.22627, 0.48648 | 0.05 m / 0.01 pt |
| WC02 | toilet (inside the P41 compound fence) | -27.983601, 153.425725 | -27.983618, 153.425700 | 3.1 → 3.10 m south-west | 0.21045, 0.55392 | 0.05 m / 0.01 pt |
| WC28 | toilet | -27.983376, 153.429175 | -27.983401, 153.429161 | 3.1 → 3.10 m south-west | 0.19664, 0.26785 | 0.02 m / 0.01 pt |
| WC50 | toilet | -27.989762, 153.429836 | -27.989786, 153.429821 | 3.1 → 3.05 m south-west | 0.61709, 0.21476 | 0.06 m / 0.00 pt |

"Moves" gives the audit table's figure, then the distance measured on the built page between the old and the new Navigate point (haversine, R = 6371 km, as the page computes it). Every one is within 0.1 m of the table. "PDF
check" is how far the listed point is from my own derivation off the PDF. The limits are 0.2 m and 0.3 pt; the worst is
0.07 m / 0.01 pt. Each pin's `how` now says what it is. For example, WC09: "the middle of the compound drawn on the master
D001 issued 2 Oct, between its two toilet blocks: 2 toilet blocks, 4 toilets and 6 pee panels; its WC09 tag is printed about
7 m from it". For CP1 and T0243 the drawer also shows a "Drawings differ" line, naming the older rev 02 arrow and how far
off it is.

**Pictures.** The 46 close-up and area pictures for the 23 pins are re-made from the PDF with the red ring on the unit. They
use the same windows, sizes, ring and WebP settings as today's pictures. The 46 old pictures leave the media list.

## Second round — GN18, GN13 and the 28 near moves

Each point below was worked out again from the PDF before it was written (`tests/derive917_add.py` →
`evidence/derive917_add.json`), with the same limits as the 23 (0.2 m and 0.3 pt):

- **Toilets (28).** Every outline the near list names must be a shape in the PDF (vertex for vertex, ≤ 0.3 pt), all
  1.2 m toilet symbols and as many as the list says. The same-size shapes touching the group are counted too, so a group
  cannot be cut short (WC73's two toilets are each painted twice on the PDF; the copies are the same toilets, not more).
  The point is the area centre of the toilets drawn (a single toilet: its centre). Worst: 0.006 m / 0.012 pt.
- **Generators (2).** The master draws 19 orange generator symbols (a 2.5–2.9 m by 1.0–1.2 m rectangle with its
  diagonal). The point is the centre of the symbol's outline. **The master carries no generator tags**, so which symbol is
  GN18 or GN13 follows Andrew's "follow the master"; each one's "how" says so on the page. GN18: the only symbol within
  25 m of the old pin is this one, 17.1 m south-east, beside P08 and WC38; the old spot now has a 2.5 × 6.1 m container
  drawn on it. GN13: the only symbol within 25 m, 11.6 m north on the same fence, with nothing drawn at the old spot. No
  other generator pin is within 5 m of either symbol (the next nearest are 160 m and 210 m away). Listed vs PDF: GN18
  0.18 m / 0.22 pt, GN13 0.13 m / 0.15 pt — inside the limits; the listed points sit about 0.2 pt west of the symbol's
  outline centre, which is a little under the registration error (0.7 m).
- **The near list's `to_pt`** is written in a slightly different y frame (y17 / 1684) from the page's (y17 × 2600/2384 /
  1837). The page frame value (`to_pt_page_convention`) is the one written; the two differ by 0.05–0.28 pt.

| Ref | Drawn on the master | Pin now | New pin | Moves (list → measured) | New pt (MASTER_LOC frame) | PDF check |
|---|---|---|---|---|---|---|
| GN18 | generator symbol (no tag; follow the master) | -27.983493, 153.424075 | -27.9836203, 153.4241719 | 17.1 → 17.06 m south-east | 0.21036, 0.68031 | 0.18 m / 0.22 pt |
| GN13 | generator symbol (no tag; follow the master) | -27.988495, 153.430095 | -27.9883906, 153.4300864 | 11.6 → 11.64 m north | 0.52527, 0.19253 | 0.13 m / 0.15 pt |
| WC06 | 2 toilets | -27.984688, 153.426541 | -27.9846989, 153.4265318 | 1.5 → 1.51 m south-west | 0.28171, 0.48539 | 0.00 m / 0.01 pt |
| WC10 | 3 toilets | -27.984503, 153.427704 | -27.9844829, 153.4277142 | 2.4 → 2.39 m north-east | 0.26767, 0.38765 | 0.01 m / 0.01 pt |
| WC11 | 2 toilets | -27.984901, 153.426559 | -27.9848882, 153.4265754 | 2.1 → 2.15 m north-east | 0.29418, 0.48183 | 0.00 m / 0.01 pt |
| WC12 | 4 toilets | -27.985457, 153.427346 | -27.9854611, 153.4273218 | 2.4 → 2.42 m west | 0.33201, 0.42028 | 0.00 m / 0.01 pt |
| WC21 | 6 toilets | -27.989162, 153.428592 | -27.9891589, 153.4286192 | 2.7 → 2.69 m east | 0.57564, 0.31388 | 0.01 m / 0.01 pt |
| WC23 | 5 toilets | -27.989492, 153.429184 | -27.9895044, 153.4291988 | 2.0 → 2.00 m south-east | 0.59847, 0.26607 | 0.00 m / 0.01 pt |
| WC29 | 7 toilets | -27.983537, 153.428563 | -27.9835607, 153.4285729 | 2.8 → 2.81 m south | 0.20708, 0.31650 | 0.01 m / 0.00 pt |
| WC30 | 8 toilets | -27.982388, 153.427844 | -27.9823908, 153.4278300 | 1.4 → 1.41 m west | 0.12995, 0.37763 | 0.00 m / 0.01 pt |
| WC33 | 17 toilets | -27.986092, 153.429504 | -27.9861074, 153.4295240 | 2.6 → 2.61 m south-east | 0.37488, 0.23846 | 0.00 m / 0.01 pt |
| WC38 | toilet | -27.983598, 153.424110 | -27.9835934, 153.4241296 | 2.0 → 1.98 m east | 0.20859, 0.68364 | 0.01 m / 0.01 pt |
| WC40 | 5 toilets | -27.983644, 153.424458 | -27.9836590, 153.4244496 | 1.9 → 1.86 m south-west | 0.21295, 0.65721 | 0.00 m / 0.00 pt |
| WC41 | 10 toilets | -27.984821, 153.426070 | -27.9848352, 153.4260544 | 2.2 → 2.20 m south-west | 0.29062, 0.52486 | 0.01 m / 0.01 pt |
| WC42 | toilet | -27.983295, 153.424824 | -27.9832804, 153.4248399 | 2.2 → 2.25 m north-east | 0.18808, 0.62489 | 0.01 m / 0.01 pt |
| WC43 | 10 toilets | -27.986363, 153.427238 | -27.9863713, 153.4272242 | 1.6 → 1.64 m south-west | 0.39192, 0.42854 | 0.01 m / 0.00 pt |
| WC45 | 7 toilets (the schedule has 8) | -27.990704, 153.428409 | -27.9907105, 153.4283913 | 1.9 → 1.88 m south-west | 0.67776, 0.33305 | 0.00 m / 0.01 pt |
| WC46 | toilet | -27.992227, 153.429399 | -27.9922233, 153.4293799 | 1.9 → 1.92 m west | 0.77751, 0.25169 | 0.00 m / 0.01 pt |
| WC47 | toilet | -27.990189, 153.428359 | -27.9901828, 153.4283807 | 2.2 → 2.24 m east | 0.64302, 0.33381 | 0.00 m / 0.01 pt |
| WC48 | 4 toilets | -27.993745, 153.430484 | -27.9937499, 153.4304576 | 2.6 → 2.65 m west | 0.87818, 0.16297 | 0.01 m / 0.01 pt |
| WC49 | 3 toilets | -27.993970, 153.430693 | -27.9939764, 153.4306756 | 1.9 → 1.85 m south-west | 0.89312, 0.14501 | 0.01 m / 0.00 pt |
| WC53 | 3 toilets | -27.992683, 153.430294 | -27.9926637, 153.4302899 | 2.2 → 2.18 m north | 0.80664, 0.17659 | 0.00 m / 0.01 pt |
| WC54 | 6 toilets | -27.991578, 153.430438 | -27.9915876, 153.4304584 | 2.3 → 2.27 m south-east | 0.73581, 0.16244 | 0.00 m / 0.01 pt |
| WC55 | toilet | -27.991245, 153.429848 | -27.9912419, 153.4298320 | 1.6 → 1.61 m west | 0.71296, 0.21412 | 0.01 m / 0.00 pt |
| WC56 | 12 toilets (two rows of 6, the point in the gap) | -27.989820, 153.430057 | -27.9898200, 153.4300769 | 2.0 → 1.95 m east | 0.61938, 0.19358 | 0.00 m / 0.01 pt |
| WC61 | 8 toilets | -27.984129, 153.429805 | -27.9841222, 153.4298238 | 2.0 → 1.99 m east | 0.24422, 0.21326 | 0.01 m / 0.01 pt |
| WC67 | 2 toilets | -27.981388, 153.424153 | -27.9813908, 153.4241664 | 1.3 → 1.35 m east | 0.06359, 0.68013 | 0.00 m / 0.01 pt |
| WC71 | 8 toilets | -27.981269, 153.423502 | -27.9812828, 153.4234837 | 2.4 → 2.36 m south-west | 0.05638, 0.73651 | 0.01 m / 0.01 pt |
| WC72 | toilet | -27.982154, 153.423999 | -27.9821291, 153.4240067 | 2.9 → 2.87 m north | 0.11217, 0.69347 | 0.01 m / 0.01 pt |
| WC73 | 2 toilets | -27.986964, 153.428121 | -27.9869615, 153.4281016 | 1.9 → 1.93 m west | 0.43090, 0.35617 | 0.00 m / 0.01 pt |

**What each says on the page** (`how`, read after "Read off the master plan D001-26003-03:"): a toilet group reads "the
middle of the N toilets drawn on the master D001 issued 2 Oct; its WCnn tag is printed about 2 m from it" (the tag phrase
only where the tag is 1.5 m or more away, as for the 23). What the old text said beyond "tag on the unit" is kept: WC10
"(new on this issue)", WC38 "(moved about 13 m from the 17 Sep issue)", WC40 "the 2 Oct issue drops the second tag
(WC40a)", and WC33's "Drawings differ" line, now measured from the new point: "the older D023 (rev 02) arrow points
about 47 m away" (47.3 m on the page's own registration; it said 45 m from the old pin). GN18: "the orange generator
symbol drawn on the master D001 issued 2 Oct, at its centre, beside P08 and WC38; the master tags no generator, so this
symbol is GN18 on the project manager's instruction to follow the master (8 Oct); a container is drawn where the pin
was". GN13 reads the same way ("on the same fence about 12 m north of the old pin").

**Pictures.** Two per moved pin, the same windows, sizes, ring and WebP settings as before, ring on the unit: 106 in all
(the 23's 46 come out byte for byte as in the first round; two runs give the same bytes). The 51 pins that had pictures
lose their old 102. **GN18 and GN13 had no pictures**; they now carry the same two, ringed on the generator symbol, so
their drawer shows the symbol like every other moved pin. That is the one addition beyond moving a point.

## Part 2 — one point per reference

Navigate (`dest782`) was already the single destination for the Navigate button, the SMS and drop text, the job sheet,
`dpPos` and the driver card. Some other surfaces still handed out a second point:

- the drop email's **Sat nav** line, read from the rev 02 drawing callout (`aerialPointFor`). On 127 references it was more
  than 1 m from Navigate, and 20 of those by more than 10 m (GN06 by about 1 km);
- the drawer's **satellite panel**: Approx. position, Copy, Street View, Google Earth, From Coates Kingston (same source).
  Since v8.16 the drawer's folds keep only five rows of the record section, so this panel is not on screen today; its
  function (`satelliteBlock`) is still in the page and is fixed so it cannot hand out a second point if it comes back;
- for the 13 **big screens** (LTC01–LTC14), the drawer's "Where it is" Drive / Walk / Earth, the drop email's button and
  the map pin / search spot. They went to the D024 arrow, while Navigate sends the driver to the pit lane (no drop-off is
  set for them).

Now all of these read `navPoint917(a)` = `dest782(a)`. Where Navigate goes somewhere other than the drawn spot (the big
screens' pit lane), the drawer says so in one line. The coordinates it shows stay the master's. The Sat nav line now says
"the same point as the button below (master plan)". The satellite panel says "the same point as Navigate (master plan)".
**No Navigate point changes because of Part 2.**

### Part 2, after the review (8 Oct, about 21:00 AEST)

The review found two places still printing the old rev 02 callout as a point: the **printed drop sheet** ("How to get there
→ Sat nav: … it drops you at the area, not on the spot") and the drawer's **driver card** ("Ground position"). On the
base they were off Navigate on 131 references (GN06 by 1,018.6 m, WC09 by 5.1 m). Both now print Navigate's point and
say so: "Sat nav: -27.984717, 153.428026 — the same point as Navigate (master plan)." The review's own fix was folded into
the patch, then the rest of the same family was closed:

- **Pictures and map pins that ring "where it goes"** now ring Navigate's point too, through one helper,
  `aerialNav917(a)`: the callout's aerial frame point with Navigate's point put in its place. That covers the drop sheet's
  four pictures (and the steps' "from that gate, head …" bearing), the drop email's pictures, the driver page picture of
  each load, Today's day card map and "From the air" picture, the banner map pins (hidden since v6.22, fixed anyway), the
  search's aerial view, the drawer's satellite window, the 3D fly-to, and the gate bearing in the two mail-outs. A
  reference with no callout still gets no picture (nothing is added where there was none). The words beside each picture
  say "the same point as Navigate" instead of "the callout's point".
- **The pit lane is not where the thing goes.** For the 13 big screens Navigate goes to the pit lane (no drop-off set).
  Their pictures keep ringing the drawn spot, because a picture of the pit lane would show the wrong place to set a
  screen down; the Sat nav, the QR and every link still go to the pit lane.
- **The drop email's "Pinned on site" no longer offers the big screens' unverified master position** as a second place
  to drive or walk to. It was a drawing position listed as a phone pin. The email now says, without a second coordinate:
  "LTC01 also has a drawing position that is not verified on the master plan, so it is not offered here: the Sat nav line
  and the button go to the pit lane …". The drawer still shows that position, with its note, so nothing on the record is
  hidden. Per-building phone pins (T0022) are unchanged.
- **CP1's drop sheet** used to say "No aerial photo and no sat nav point for this one", which became untrue once its Sat
  nav line printed Navigate's point. It now says "No aerial photo for this one … The Sat nav point below is the one
  Navigate uses (master plan)."

## Part 3 — wording

The master's legend reads "E.P = EMERGENCY EGRESS POINTS". The 23 E.P items on the map layer were labelled "Entry point".
They now read **"Emergency egress point (E.P)"**. The layer button is unchanged. Each item's `note` still reads "Pedestrian
entry point (E.P) drawn on the master." This was left alone because the release changes labels only (see the open questions).

## What is not touched

- **WC57 and WC59 — on hold.** The record has WC59 on site since 1 Oct with 7 Event Portables units, while the master
  draws the 7-toilet row under the WC57 label. Andrew is asked which (below). Neither pin moves and no count changes.
- **WC13 and WC69 — need his word** (below).
- **The 7 left as they are** (each pin already inside the drawn unit, within drawing precision): P08, P44, P51, WC20, P27,
  P29, P34.
- WC51, WC01, P26 and P28: left as they are.
- The T0022 and T0023 pins (phone pins on the record), P47 and WC32.
- The 51 live references the master does not draw.
- Every other pin (within 1 m of its unit already).
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

GN18 and GN13 are answered ("follow the master") and applied in this build (second round, above).

1. **WC57 / WC59 — on hold.** The record has WC59 on site since 1 Oct with 7 Event Portables units recorded; the master
   draws the 7-toilet row under the **WC57** label and a 2-toilet pair under WC59. By the labels, WC59 is the pair (5.3 m
   from its pin); by the schedule and the record (WC59 = 7, WC57 = 2), WC59 is the row under the WC57 label, and WC57
   would then be 11.8 m from its unit. Where do WC59's 7 toilets stand, in the row or in the pair? Until he answers,
   neither pin moves and no count changes. Both deliver Tue 13 Oct.
2. **WC13.** The master draws 3 toilets in one row; the schedule has 2. The centre of the 3 and the centre of the 2
   nearest the tag differ by 0.7 m (0.96 pt, outside the 0.3 pt limit). The pin is on the label, 2.0 m from the
   3-toilet centre. Which 2 toilets, or is it 3?
3. **WC69.** The master draws a row of 9 toilets under the WC69 label; the schedule has 12. Three more stand in a column
   on the fence about 6.5 m north-west, nearest the WC-BSF label. The two centres differ by 2.2 m. The pin is on the
   label, 2.3 m from the 9-row centre. Are the 3 on the fence part of WC69?
4. **T0022's two pins.** T0022 is not on the master. Its drawer lists two phone pins, its own (-27.983238, 153.426491,
   where Navigate goes) and a per-building pin 13.4 m away (-27.983131, 153.426427). Which is the drop? Neither was touched.
   (T0023 has its own pin, about 17 m from T0022's.)
5. **P27, P29 and P34 — optional.** One block tag ("P34/24/26/27/28/29") sits over four 6 m buildings and the master
   does not say which building is which. The three pins are 1.5 m from the block centre (-27.984782, 153.426560), inside
   the drawn buildings, so they are left. One point per block would move them there; say if wanted. (P26 and P28 are
   7.3 m and 5.3 m from that centre, on their D022 leader lines, and are left as they are by the same instruction.)
6. **Is LTCnn = BSnn?** The page's big screens LTC01–LTC14 sit 5–29 m from the master's BS01–BS14 symbols. If they are the
   same screens, their drops can come off the master instead of the pit lane.
7. **The 51 not on the master.** 51 live references (generators GN25 and the Concert set, light towers, the pit garages,
   most T-numbered transport and plant jobs, the water barriers from their descriptions) have no unit on the 2 Oct master.
   They go to the pit lane, a described spot or a pin. Does iEDM draw them on a later issue, or do they stay as they are?
8. **The explorer (machine bundle).** `plan_items.json` in the machine set carries its own copy of each pin's `pt`, so
   the Map explorer will draw the 53 at their old spots until the machine set is rebuilt. Navigation is not affected:
   every link reads the page. That needs a machine release, which is the publisher's call.
9. **E.P notes.** The 23 E.P items' notes still say "Pedestrian entry point". Should they also read emergency egress?

## Also found, not in this release

- **The Map tab's live (Mapbox) board** draws a separate "drawn" layer at each reference's drawing callout, beside the
  pins layer (which already carries the master positions). It is a drawing-callout layer by design and hands out no
  link, so it is left alone; it would need a design decision to merge or drop it.
- **Console 404s in the sweeps** come from `/w/Coates-GC500-2026/explorer/assets/vt/L*.bin` on the service (the
  machine set's assets). The base v9.18 shows them the same way, so they are not this release's; that is for the
  publisher.
- **Map explorer (machine set).** `plan_items.json` in the machine bundle carries its own copy of each pin's `pt`, so the
  explorer will still draw the 53 at their old spots until the machine set is rebuilt. Navigation is not affected: every
  link reads the page. That needs a machine release, which is the publisher's call.

## Files

| file | what |
|---|---|
| `patch_v917_pins.py` | the patch (refuses a second run; refuses a base whose 53 pins are not as audited, a held reference in the move list, or evidence that does not pass) |
| `tests/derive917.py` | re-derives the 23 from the PDF → `evidence/derive917.json` (needs the audit's outlines `pins/geom/geom.json`, read only) |
| `tests/derive917_add.py` | second round: re-derives GN18, GN13 and the 28 near moves from the PDF → `evidence/derive917_add.json`, `.log` (needs the near list `near37.json` and the audit's outlines `rows.json`, read only) |
| `tests/make_thumbs917.py` | the 106 pictures for the 53 → `evidence/media917/` + `evidence/thumbs917.json` (deterministic: two runs, same bytes; the 23's 46 unchanged) |
| `tests/test_identity917.py` | test 1, identity → `evidence/identity917.log`, `evidence/identity917_code.diff` |
| `tests/collect_pins917.cjs` + `tests/compare_pins917.py` | tests 3 and 4, every row, laptop and phone, including (after the review) the printed drop sheet, the driver card's Ground position, the email's pins, the aerial pictures and every load's driver page picture → `evidence/compare917_*.json/.log` |
| `tests/shots917.cjs` | phone screenshots of the WC09, GN18, WC56 and CP1 drawers ("Where it is") and the WC09 and CP1 printed drop sheets → `evidence/phone_*.png`, `shots917_phone.json` |
| `evidence/sweep_*917.json` | the sweeps on the candidate, and on the base v9.18 (`sweep_base_*`) for comparison |
| `evidence/rings917_WC09_GN06.png` | base ring, v9.17 ring and Navigate's point on the page's aerial |
| `evidence/media917/` | the 106 pictures, named by sha256. They are view-scope crops of the master the page already shows. Not encrypted: the papers password is held by Andrew and is not in this session; encrypt them like `media893.zip.enc` before committing if wanted |

## Build and publish (publisher, on Andrew's yes)

```
toolchain/build.sh v917 v9.17_pins_master_DRAFT/patch_v917_pins.py    # plus the footer step the publisher uses
python3 v8.89_master_map_DRAFT/upload_media889.py v9.17_pins_master_DRAFT/evidence/media917 build/GC500_v917/media_manifest_v917.json --dry-run
python3 v8.89_master_map_DRAFT/upload_media889.py v9.17_pins_master_DRAFT/evidence/media917 build/GC500_v917/media_manifest_v917.json
python3 toolchain/upload_page.py build/GC500_v917/GC500_Delivery_Control_hosted.html
```

`upload_media889.py` is generic: it uploads only the files the manifest names that the service does not already hold,
checks each one's hash, then registers the manifest. Media goes first, because the service refuses a page whose media list
has no registered manifest. If live has moved past v9.18, rebuild: the patch refuses if any of the 53 pins is no longer
where the audit found it.

## Results, first round (8 Oct 2026, about 21:50 AEST, after the review) — superseded by the second round below

**Base.** Live was still v9.18 (`c547a6de…`, 11,605,879 bytes) when this build fetched it at about 21:40 AEST: a
code-only change from v9.11 (the first build's base), with DATA, MASTER_LOC, MASTER_LAYERS and the media manifest the
same. The PDF re-derivation was rerun against v9.18 and is identical apart from the page hash it records.

- **Candidate:** `f60f582201cd1b669b01b53e8d62f1d2bc833a2556ce21473db17511755d3354`, 11,612,460 bytes, on live v9.18
  `c547a6debe1dea9009b50466d3c1028ec9c3a800e6c591ea258b61490b14b762`. `check_page`: PASS (27 inline scripts parse, no new
  keys, author line present). Footer unchanged (` · v9.18`); the publisher sets the next free one. It replaces the
  first candidate `565b3b8a…`, which carried the review's blocking finding.
- **Media manifest:** `eb7d2fa3478557ba…`, 1,975 assets (46 in, 46 out), file `media_manifest_v917.json` sha256
  `46f5dc07…` — unchanged by the review fixes.

| # | Check | Laptop | Phone |
|---|---|---|---|
| 1 | Identity (`test_identity917.py`): DATA only media +46/−46 and the manifest; MASTER_LOC only the 23 (ll, pt, how, img); MASTER_LAYERS only the 23 labels; code 38 lines out, 64 in, every one named as Part 2; footer unchanged | PASS | — |
| 2 | PDF re-derivation (`derive917.py`, rerun on the v9.18 base): 23/23 within 0.2 m / 0.3 pt (worst 0.067 m / 0.013 pt) | PASS | — |
| 3 | Every row (200 references; record 4581 before and after every run; 0 writes): the 23 move by the table's metres ±0.1 m on Navigate, the button, the drop message, the job sheet, dpPos and the driver card, and stay "master plan"; every other reference 0.0 m and the same kind; CP1 and WC81 stay in the inset | PASS | PASS |
| 4 | Part 2: **5,388 surface points, 0 off Navigate** (to 0.0 m; Today's day card map to 0.1 m, the page's own 4-decimal rounding). Now includes the printed drop sheet's Sat nav (199) and picture rings (360), the driver card's Ground position (199), the email's "Pinned on site" rows (393), the aerial point (120), the 3D fly-to (120), Today's day card map (115), and the driver page picture of 30 loads (0 off; all 30 were off on the base). On the base, 1,593 points on 133 references were off it; the drop sheet Sat nav and the Ground position were each off on 133 (GN06 1,018.6 m; WC09 11.1 m from the base's own pin) | PASS | PASS |
| 4a | The words beside each point say it is Navigate's ("the same point as Navigate (master plan)"): drop sheet and Ground position, every reference | PASS | PASS |
| 5 | Sweeps: 21 tabs (15 shown on the view link), 0 page errors, 0 console errors, 0 deep-link errors, 0 blocked writes. The base v9.18, swept in the same session, is the same (0 console errors) | PASS | PASS |
| — | The patch refuses a second run ("already applied") | PASS | — |
| — | Phone: WC09 and CP1 drawers ("Where it is", the re-made close-ups load) and their printed drop sheets (`phone_*_dropsheet_go.png`: Sat nav = Navigate to the printed 6 decimals; `phone_CP1_dropsheet_pics.png`: the no-photo words). No dollar figures in any frame; 0 writes | — | PASS |

Listed, not counted in test 4, by design: the 13 big screens' pictures keep ringing the drawn spot (their Navigate is
the pit lane); T0022's second, per-building pin (13.4 m, the open question above).

`evidence/rings917_WC09_GN06.png` draws, on the page's own aerial, where the base's ring was (blue), where v9.17's is
(red) and Navigate's point (+), for WC09 and GN06.

## The 8 Oct review, finding by finding

| Finding | Outcome |
|---|---|
| **Blocking:** printed drop sheet "Sat nav" and the driver card's "Ground position" read the rev 02 callout (131 references off Navigate) | **Fixed.** Both read Navigate's point and say so; 199 references each, 0 off, laptop and phone. The collector now opens the drop sheet and reads the Ground position (tests 4 and 4a) |
| Should fix: Today's aerial map pins (`hzMapPins`, `dayCardMap`) and the drop sheet's aerial pictures (`dropCrop`) at the callout | **Fixed**, through `aerialNav917` (Navigate's point turned into the aerial frame with the page's own `frameOf`), plus the rest of the same family: the drop email and driver page pictures, Today's "From the air", the search aerial, the drawer's satellite window, the 3D fly-to and the gate bearings. The banner map is hidden (since v6.22) and was fixed anyway. Pit-lane references keep the drawn spot (see Part 2) |
| Should fix: the big screens' drop email lists "Pinned on site: LTCnn <D024 symbol>" beside the pit-lane Sat nav | **Fixed.** That unverified master position is no longer listed as a pin or linked; one line says it is not offered and where the Sat nav goes. The drawer keeps it, with its note |
| Note: 80–88 console 404s from the explorer's `vt/L*.bin` | **Not this release's, and not seen tonight:** 0 console errors on the candidate and on the base v9.18, laptop and phone, in this session's sweeps |
| Note: GN18 and GN13 in the README vs the board | **Reconciled.** The README now records Andrew's "follow the master" (about 18:05 AEST); they stay out of this build by its scope and go next |
| Note: the 46 pictures in `evidence/media917/` are not encrypted | **Not done here:** the papers password is not in this session. They are view-scope crops already served on the view link |
| Also found while fixing: CP1's drop sheet said "no sat nav point" and "the spot on the ground is not on it" while printing Navigate's point | **Fixed** (drop sheet and email) |
