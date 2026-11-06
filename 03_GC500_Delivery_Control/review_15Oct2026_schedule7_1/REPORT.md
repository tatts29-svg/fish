# Schedule 7.1 and the iEDM infrastructure programme — source review, 15 Oct 2026

Author: Andrew Fisher

State: **READ AND COMPARED.** Live page v10.18 (`2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d`) is unchanged. A draft page patch, `v10.21_schedule7_1_DRAFT`, records the review and shows three programme "Complete" marks as evidence; it is built and tested in the scratchpad only and **not uploaded**. No operational record, rate, charge, quantity, position or date was changed.

Andrew, 15 Oct 2026 (this chat), with `GC500_26_Schedule_7_1.xlsx`: "Please check and look. And update accordingly with anything that is relevant or missing. Transport. Or references." Then with `P003-26003-01_Programme_-_Coates_Inf_V1_14.8.26_1.xlsx`: "This is also the excel that iEDM updates. So access and ensure we have everything covered as well as references."

## The short answer

1. **The "Schedule 7.1" file is the 30 Sep 2026 schedule, not a new one.** Its 12 sheets are identical, cell for cell, to Schedule 2 (reviewed for transport costs on 1 Oct; the page already held all but about $300 of it then). It was last saved on 30 Sep 2026 at 15:59 AEST by Krystal Stephens. The page holds Schedule 7 of 9 Oct 2026 plus the site record, which are later: every row in 7.1 is already on the page, and the page carries 83 rows of later facts (dockets, carriers, load times, transport costs, four fencing semi loads, two WAU requests, generator numbers) that 7.1 does not have. **Nothing from 7.1 should go on the page**, and nothing in it is missing from the page. Question for Andrew: is there a newer file (a real 7.1, or Schedule 8 of 12 Oct) that should be sent? Schedule 8 was reviewed on 12 Oct and never applied.
2. **The iEDM programme file is the same programme the page holds (issue (2), 9 Oct), plus three cells.** Its `Base information (4)` sheet matches the page's issue exactly. The only new cells are `CON WK 2!I101:I103`, which mark GN13, P69 and P45 "Complete" with no date. The same three cells were read on 14 Oct (v10.10 document review) but never put on the page. The draft v10.21 shows them as source evidence in each reference's drawer, under the fold the 9 Oct issue already uses. It imports no completion: GN13, P69 and P45 are already received on the site record.
3. **References:** every reference 7.1 names is on the page. Of the programme's 141 referenced rows, four names are not register keys but are covered by aliases (LT 9/10/11 = the five Molendinar light towers T0002; P68 = CP1; WCTV = T0243; GN22 is "NOT APPLICABLE ANY MORE"). Six programme references are on the register but have **no map position**: WC100, WC66, GN25, LT05, LT06, WC85.
4. **Transport:** 7.1 carries less transport than the page (no TPORT COST column on Week 3, no dockets, load times or carriers on Weeks 2 and 1). The programme carries delivery notes ("Morning Delivery", "Needs to be before 10am", "Pushed to when the Franna is available"), not carriers or loads; those notes are not on the page (question 4 below).
5. **Conflicts to settle with Andrew:** WC57 / WC59 quantities (the programme swaps 7 and 2 between them), WC67 total (2 or 4), the six map positions, whether the programme's 38 delivery and site notes should show, and 28 install dates that differ from the schedule the page follows (the site record stands).

## 1. What Schedule 7.1 is

| | Schedule 7.1 as sent | What the page holds |
|---|---|---|
| File | `196709b7-GC500_26_Schedule_7_1.xlsx` (260,263 bytes) | Schedule 7, `GC500 26 Schedule (7).xlsx` |
| SHA-256 | `98b6db43c734fc0d6ea4c02efccc1c5b2b1071f83b6a85b33df07843b9183fe4` | `485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac` (applied in v9.50, 9 Oct 2026) |
| Last saved | 30 Sep 2026 15:59 AEST (`docProps/core.xml` modified 2026-09-30T05:59:45Z) by Stephens, Krystal (North); created 20 Aug 2026 by Meek, Brenden (North) | Schedule 7 reviewed 9 Oct 2026; Schedule 6 (its base) saved 8 Oct 2026 12:23 AEST |
| Revision text in the workbook | none — no title, revision or version cell; the sheet names are BOQ, Labour, Week 6, Week 5, Week 4, Week 3, Week 2, Week 1, Event Week, Demob Week 1, Demob Week 2, Demob Week 3 | — |
| Content | 12 sheets, 2,809 stored cells, no formulas, no comments, no hidden sheets | — |
| Identical to | **Schedule 2** (`d65d5f7acd486c97b693555d8ea2be893fa2b06b2ccdc4473b11b6257b9c1a88`, upload `b6dd3886-GC500_26_Schedule_2.xlsx`): 0 cells differ across all 12 sheets | Schedule 2 was reviewed on 1 Oct (`review_01Oct2026_schedule_2_transport`): the page already held all but about $300 of its transport costs |

The lineage, by the files in this environment and the release folders:

| Issue | Saved (AEST) | SHA-256 | On the page |
|---|---|---|---|
| Schedule (12 Sep) | 11 Sep 2026 14:43 | `28ba3d27…` | register built from it |
| Schedule 2 | 1 Oct 2026 02:32 (upload copy); **7.1 is this content, saved 30 Sep 15:59** | `d65d5f7a…` | 1 Oct transport review (nothing to change) |
| Schedule 3 | 1 Oct 2026 14:32 | `ed10b89d…` | `review_01Oct2026_schedule_3` (three cells against Schedule 2) |
| Schedule 4 | 6 Oct 2026 12:00 | `129d2729…` | v8.71 (dockets, carriers, load times, TPORT COST, four fencing semis, generator numbers) |
| Schedule (5) | 7 Oct 2026 | `6383ebdd…` | v8.75 (17 cells, VMS BOQ) |
| Schedule 6 | 8 Oct 2026 12:23 | `228801df…` | v9.27 (40 cells: Concert sets, GN13, P69, P45, Helen Park container) |
| Schedule 7 | 9 Oct 2026 | `485f5d88…` | v9.50 (P45 docket 26122823, container docket 26121442, Events forklift tynes, WAU fridge and air-con rows) — **the page's current schedule source** |
| Schedule 8 | 12 Oct 2026 13:53 | `df43938f…` | **read and compared only** (`review_12Oct2026_schedule8_baseplan`: 27 field changes, three new rows, no deletions); its workbook and comparison register are in the other agent's private area, not here |

Sheets that differ between 7.1 and Schedule 7: **Week 3, Week 2, Week 1 and Event Week**. BOQ, Labour, Week 6, Week 5, Week 4 and the three Demob sheets are identical. Every difference is in the one direction: 7.1 lacks something Schedule 7 (and the page) has, or carries the older value where a later schedule or Andrew's record changed it.

## 2. Diff, sheet by sheet (7.1 against Schedule 7 as the page used it)

Rows were matched by date, product, item, quantity and reference. Schedule 7 is reconstructed from Schedule 6 (which is here) plus the four cell changes and two rows that v9.50 verified against the Schedule 7 original (Week 1: P45 docket, Events forklift asset and dockets, container docket; Event Week rows 45–46). "Page holds" is the live register (DATA) for the matched task.

| Sheet | Rows in 7.1 | Rows in Schedule 7 | Same | Changed | Only in 7.1 | Only in Schedule 7 |
|---|---|---|---|---|---|---|
| Week 6 | 5 | 5 | 5 | 0 | 0 | 0 |
| Week 5 | 42 | 42 | 42 | 0 | 0 | 0 |
| Week 4 | 19 | 19 | 19 | 0 | 0 | 0 |
| Week 3 | 25 | 28 | 8 | 17 | 0 | 3 |
| Week 2 | 28 | 30 | 2 | 26 | 0 | 2 |
| Week 1 | 36 | 35 | 10 | 25 | 1 | 0 |
| Event Week | 49 | 51 | 34 | 15 | 0 | 2 |
| Demob Week 1 | 42 | 42 | 42 | 0 | 0 | 0 |
| Demob Week 2 | 2 | 2 | 2 | 0 | 0 | 0 |
| Demob Week 3 | 12 | 12 | 12 | 0 | 0 | 0 |
| **Total** | | | **176** | **83** | **1** | **7** |

### Rows only in one of the two

| Sheet | Where | Row | What the row says | Page task | What it means |
|---|---|---|---|---|---|
| Week 1 | only in 7.1 | 3 | 2026-10-12 \| Access \| 3.5T Forklift Std \| qty 1 \| Supply \| 1210921ex eags -SL 1262224 ex mead | T0085 | Schedule 6 moved this 3.5 t forklift (1.8 m extensions, 1210921 ex EAGS / 1262224 ex MEAD) from Week 1 (12 Oct) to Week 2 (6 Oct) with DD 26109954; the page has it as T0085 on 6 Oct with 1272166 (Andrew's record). |
| Week 3 | only in Schedule 7 | 18 | date=2026-09-30 \| product=fencing \| item=fencing \| qty=2 \| local=fencing \| notes=2 x semi of fencing \| carrier=teams \| tport=$1152.62+ | T0269 | Fencing semi load to Phillip Park (Schedule 4): on the page as a fencing transport row with its TEAMS cost. |
| Week 3 | only in Schedule 7 | 27 | date=2026-10-01 \| product=fencing \| item=fencing \| qty=2 \| notes=2 x semi of fencing \| activity=philip park \| carrier=teams \| tport=$1152.62+ | T0270 | Fencing semi load to Phillip Park (Schedule 4): on the page as a fencing transport row with its TEAMS cost. |
| Week 3 | only in Schedule 7 | 28 | date=Friday 2nd October \| product=fencing \| item=fencing \| qty=1 \| local=fencing \| notes=semi of fencing \| activity=philip park \| carrier=teams \| tport=$576.31+ | T0271 | Fencing semi load to Phillip Park (Schedule 4): on the page as a fencing transport row with its TEAMS cost. |
| Week 2 | only in Schedule 7 | 4 | date=2026-10-06 \| product=Access \| item=3.5T Forklift Std \| qty=1 \| local=Supply \| notes=1.8m Extensions \| customer=scars \| asset=1210921ex eags -SL 1262224 ex mead \| dd=26109954 | T0085 | The forklift row after Schedule 6 moved it to 6 Oct (page T0085). |
| Week 2 | only in Schedule 7 | 10 | date=2026-10-06 \| product=fencing \| item=fencing \| qty=1 \| local=fencing \| notes=philip park \| carrier=teams \| tport=$576.31+ | T0272 | Fencing semi load to Phillip Park (Schedule 4): on the page as a fencing transport row with its TEAMS cost. |
| Event Week | only in Schedule 7 | 45 | date=2026-10-21 \| product=Furniture \| item=Fridge \| qty=1 \| local=Fridge \| customer=WAU | T0273 | WAU request added by Schedule 7 (page T0273 fridge / T0274 portable air-con, planning only, no load, no charge). |
| Event Week | only in Schedule 7 | 46 | date=2026-10-21 \| product=Furniture \| item=Air Con \| qty=2 \| local=Portable Aircon \| customer=WAU \| dd=Rehire | T0274 | WAU request added by Schedule 7 (page T0273 fridge / T0274 portable air-con, planning only, no load, no charge). |

### Week 3 — 17 changed rows (17 fields)

| 7.1 row | S7 row | Reference / location | Item | Field | 7.1 says | 7.1 cell | Schedule 7 says | S7 cell | Page task | Page holds |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 3 | P06 - Wilclean Crib Room | Building 6m | transport cost (TPORT COST) | — | — | $290+ | M3 | T0059 | $290+ |
| 4 | 4 | WC01 - Toilets | Accessible Toilet | transport cost (TPORT COST) | — | — | $570+ | M4 | T0060 | $570+ |
| 5 | 5 | WC01 - Toilets | FWF | transport cost (TPORT COST) | — | — | na | M5 | T0061 | na |
| 6 | 6 | WC41 - Toilets | FWF | transport cost (TPORT COST) | — | — | na | M6 | T0062 | na |
| 7 | 7 | WC42 - Toilets | FWF | transport cost (TPORT COST) | — | — | na | M7 | T0063 | na |
| 8 | 8 | WC43 - Toilets | FWF | transport cost (TPORT COST) | — | — | na | M8 | T0064 | na |
| 9 | 9 | GN01 - Generator  | 60kva | transport cost (TPORT COST) | — | — | na | M9 | T0065 | na |
| 10 | 10 | P38 - Green Room 1 | Building 6m | transport cost (TPORT COST) | — | — | $290+ | M10 | T0066 | $290+ |
| 11 | 11 | P39 Green Room 2 | Building 6m | transport cost (TPORT COST) | — | — | $290+ | M11 | T0067 | $290+ |
| 12 | 12 | P42 - Production | Building 6m | transport cost (TPORT COST) | — | — | $290+ | M12 | T0068 | $290+ |
| 13 | 13 | WC50 - Toilet | FWF | transport cost (TPORT COST) | — | — | na | M13 | T0247 | na |
| 15 | 15 | GN20 S01 | 350kva | transport cost (TPORT COST) | — | — | $570+ | M15 | T0075 | $570+ |
| 16 | 16 | GN21 - Generator  | 60kva | transport cost (TPORT COST) | — | — | $290+ | M16 | T0076 | $290+ |
| 17 | 17 | GN23 - Generator  | 150kva | transport cost (TPORT COST) | — | — | $290+ | M17 | T0077 | $290+ |
| 18 | 19 | GN03 - Generator  | 30kva | transport cost (TPORT COST) | — | — | $290+ | M19 | T0078 | $290+ |
| 24 | 25 | WC60 - Toilets (Tank Mounted) | — | transport cost (TPORT COST) | — | — | $290+ | M25 | T0248 | $290+ + $580+ |
| 25 | 26 | WC60 -  (Tank  | — | transport cost (TPORT COST) | — | — | $580+ | M26 | T0248 | $290+ + $580+ |

### Week 2 — 26 changed rows (77 fields)

| 7.1 row | S7 row | Reference / location | Item | Field | 7.1 says | 7.1 cell | Schedule 7 says | S7 cell | Page task | Page holds |
|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 5 | P08 Security | Building 6m | load time | — | — | 4th | K5 | T0249 | — |
| 5 | 5 | P08 Security | Building 6m | transport cost (TPORT COST) | — | — | $290+ | M5 | T0249 | $290+ |
| 6 | 6 | P46 - QPS Command Post | Building 12m | asset number | 1327213 | I6 | 1322579 | I6 | T0086 | 1327213 |
| 6 | 6 | P46 - QPS Command Post | Building 12m | load time | — | — | 1st | K6 | T0086 | — |
| 6 | 6 | P46 - QPS Command Post | Building 12m | transport cost (TPORT COST) | — | — | $290+ | M6 | T0086 | $290+ |
| 7 | 7 | P47 - QPS Amenities Crib Room | Building 6m | load time | — | — | 2nd | K7 | T0087 | — |
| 8 | 8 | P51 - Security Sign On | Building 12m | load time | — | — | 3rd | K8 | T0088 | — |
| 8 | 8 | P51 - Security Sign On | Building 12m | transport cost (TPORT COST) | — | — | $290+ | M8 | T0088 | $290+ |
| 10 | 11 | WC20 - Toilets (Tank Mounted) | Toilet Block 6m | delivery docket (DD) | 8th | J10 | 8th  26112783/ 26112786 | J11 | T0250 | 26112783 / 26112786 |
| 10 | 11 | WC20 - Toilets (Tank Mounted) | Toilet Block 6m | load time | — | — | 0900/0900 | K11 | T0250 | 0900/0900 |
| 10 | 11 | WC20 - Toilets (Tank Mounted) | Toilet Block 6m | carrier | — | — | sfl/sfl | L11 | T0250 | SFL/SFL |
| 10 | 11 | WC20 - Toilets (Tank Mounted) | Toilet Block 6m | transport cost (TPORT COST) | — | — | $580+ | M11 | T0250 | $580+ |
| 11 | 12 | WC20 | Waste tank | delivery docket (DD) | 7th | J11 | 7th  26112769/ 26112776 | J12 | T0251 | 26112769 / 26112776 |
| 11 | 12 | WC20 | Waste tank | load time | — | — | 630/0700 | K12 | T0251 | 0630/0700 |
| 11 | 12 | WC20 | Waste tank | carrier | — | — | kev/sfl | L12 | T0251 | KEV/SFL |
| 11 | 12 | WC20 | Waste tank | transport cost (TPORT COST) | — | — | $290+ | M12 | T0251 | $290+ |
| 12 | 23 | WC86 - Toilet | Accessible Toilet | asset number | — | — | with container | I23 | T0252 | — |
| 12 | 23 | WC86 - Toilet | Accessible Toilet | delivery docket (DD) | — | — | 4th 26112797 | J23 | T0252 | 26112797 |
| 12 | 23 | WC86 - Toilet | Accessible Toilet | load time | — | — | 530 | K23 | T0252 | 0530 |
| 12 | 23 | WC86 - Toilet | Accessible Toilet | carrier | — | — | irwins | L23 | T0252 | IRWINS |
| 12 | 23 | WC86 - Toilet | Accessible Toilet | transport cost (TPORT COST) | — | — | na | M23 | T0252 | na |
| 13 | 13 | GN18 - Generator  | 50kva | asset number | 1276501 | I13 | 1261273 ex  REED | I13 | T0090 | 1261273 |
| 13 | 13 | GN18 - Generator  | 50kva | delivery docket (DD) | — | — | 26112495 | J13 | T0090 | 26112495 |
| 13 | 13 | GN18 - Generator  | 50kva | load time | — | — | 0930 | K13 | T0090 | 0930 |
| 13 | 13 | GN18 - Generator  | 50kva | carrier | — | — | kev | L13 | T0090 | KEV |
| 13 | 13 | GN18 - Generator  | 50kva | transport cost (TPORT COST) | — | — | na | M13 | T0090 | na |
| 14 | 14 | WC38 - Toilet | FWF | carrier | — | — | NA | L14 | T0091 | — |
| 15 | 15 | WC39 - Toilets | FWF | carrier | — | — | NA | L15 | T0092 | — |
| 16 | 16 | WC40 - Toilets | FWF | carrier | — | — | NA | L16 | T0093 | — |
| 17 | 17 | P52 - Gate 1 Volunteer Check-In | Building 12m | delivery docket (DD) | 6th | J17 | 6th  26112762 | J17 | T0253 | 26112762 |
| 17 | 17 | P52 - Gate 1 Volunteer Check-In | Building 12m | load time | — | — | 0830 | K17 | T0253 | 0830 |
| 17 | 17 | P52 - Gate 1 Volunteer Check-In | Building 12m | carrier | — | — | readys | L17 | T0253 | READYS |
| 17 | 17 | P52 - Gate 1 Volunteer Check-In | Building 12m | transport cost (TPORT COST) | — | — | $652.37+ | M17 | T0253 | $652.37+ |
| 18 | 18 | P54 - Accred Centre BOH | Building 6m | delivery docket (DD) | 3rd | J18 | 3rd  26112733 | J18 | T0254 | 26112733 |
| 18 | 18 | P54 - Accred Centre BOH | Building 6m | load time | — | — | 0530 | K18 | T0254 | 0530 |
| 18 | 18 | P54 - Accred Centre BOH | Building 6m | carrier | — | — | readys | L18 | T0254 | READYS |
| 18 | 18 | P54 - Accred Centre BOH | Building 6m | transport cost (TPORT COST) | — | — | $310.70+ | M18 | T0254 | $310.70+ |
| 19 | 19 | P55 - Gate 1 Ticket Box | Ticket Box 6m | delivery docket (DD) | 1st | J19 | 1st  26112709 | J19 | T0255 | 26112709 |
| 19 | 19 | P55 - Gate 1 Ticket Box | Ticket Box 6m | load time | — | — | 0500 | K19 | T0255 | 0500 |
| 19 | 19 | P55 - Gate 1 Ticket Box | Ticket Box 6m | carrier | — | — | sfl | L19 | T0255 | SFL |
| 19 | 19 | P55 - Gate 1 Ticket Box | Ticket Box 6m | transport cost (TPORT COST) | — | — | $290+ | M19 | T0255 | $290+ |
| 20 | 20 | P56 - Gate 1 Ticket BOH | Building 3.6m | delivery docket (DD) | 2nd | J20 | 2nd 26112730 | J20 | T0256 | 26112730 |
| 20 | 20 | P56 - Gate 1 Ticket BOH | Building 3.6m | load time | — | — | 0500 | K20 | T0256 | 0500 |
| 20 | 20 | P56 - Gate 1 Ticket BOH | Building 3.6m | carrier | — | — | sfl | L20 | T0256 | SFL |
| 20 | 20 | P56 - Gate 1 Ticket BOH | Building 3.6m | transport cost (TPORT COST) | — | — | $290+ | M20 | T0256 | $290+ |
| 21 | 21 | P57 - Radio Distribution Office | Building 9.6m | delivery docket (DD) | 5th | J21 | 5th 26112756 | J21 | T0257 | 26112756 |
| 21 | 21 | P57 - Radio Distribution Office | Building 9.6m | load time | — | — | 0830 | K21 | T0257 | 0830 |
| 21 | 21 | P57 - Radio Distribution Office | Building 9.6m | carrier | — | — | readys | L21 | T0257 | READYS |
| 21 | 21 | P57 - Radio Distribution Office | Building 9.6m | transport cost (TPORT COST) | — | — | $652.37+ | M21 | T0257 | $652.37+ |
| 22 | 22 | Helen Park | 3.0m Cont | asset number | — | — | with toilet | I22 | T0258 | — |
| 22 | 22 | Helen Park | 3.0m Cont | delivery docket (DD) | 4th | J22 | 4th 26112749 | J22 | T0258 | 26112749 |
| 22 | 22 | Helen Park | 3.0m Cont | load time | — | — | 530 | K22 | T0258 | 0530 |
| 22 | 22 | Helen Park | 3.0m Cont | carrier | — | — | irwins | L22 | T0258 | IRWINS |
| 22 | 22 | Helen Park | 3.0m Cont | transport cost (TPORT COST) | — | — | $275.40+  | M22 | T0258 | $275.40+ |
| 23 | 24 | WC61 - Toilets | FWF | activity | — | — | event p | G24 | T0095 | — |
| 23 | 24 | WC61 - Toilets | FWF | carrier | — | — | NA | L24 | T0095 | — |
| 24 | 25 | WC31 - Toilets  | Accessible Toilet | delivery docket (DD) | — | — | 26115307 | J25 | T0096 | 26115307 |
| 24 | 25 | WC31 - Toilets  | Accessible Toilet | load time | — | — | 1000 | K25 | T0096 | 10:00 |
| 24 | 25 | WC31 - Toilets  | Accessible Toilet | carrier | — | — | kev | L25 | T0096 | KEV |
| 25 | 26 | WC31 - Toilets  | 16Pan Block | activity | — | — | event p | G26 | T0097 | — |
| 25 | 26 | WC31 - Toilets  | 16Pan Block | carrier | — | — | na | L26 | T0097 | — |
| 27 | 28 | WC34 - Toilets | FWF | activity | — | — | event p | G28 | T0099 | — |
| 27 | 28 | WC34 - Toilets | FWF | carrier | — | — | na | L28 | T0099 | — |
| 28 | 29 | WC33 - Toilets | FWF | activity | — | — | event p | G29 | T0100 | — |
| 28 | 29 | WC33 - Toilets | FWF | carrier | — | — | na | L29 | T0100 | — |
| 29 | 30 | WC09 - Toilets  | FWF | activity | — | — | event p | G30 | T0101 | — |
| 29 | 30 | WC09 - Toilets  | FWF | load time | — | — | reduced from 10  | K30 | T0101 | — |
| 29 | 30 | WC09 - Toilets  | FWF | carrier | — | — | na | L30 | T0101 | — |
| 30 | 31 | WC09 - Toilets  | Pee Panel | activity | — | — | event p | G31 | T0259 | — |
| 30 | 31 | WC09 - Toilets  | Pee Panel | carrier | — | — | na | L31 | T0259 | — |
| 31 | 32 | WC09 - Toilets  | Toilet Block 6m | delivery docket (DD) | — | — | 26115312/26115316 | J32 | T0102 | 26115312 / 26115316 |
| 31 | 32 | WC09 - Toilets  | Toilet Block 6m | load time | — | — | 0930/1000 | K32 | T0102 | 09:30 / 10:00 |
| 31 | 32 | WC09 - Toilets  | Toilet Block 6m | carrier | — | — | sfl/sfl | L32 | T0102 | SFL/SFL |
| 32 | 33 | — | VMS | asset number | — | — | premiair hire | I33 | T0103 | — |
| 32 | 33 | — | VMS | delivery docket (DD) | — | — | 26115373 | J33 | T0103 | 26115373 |
| 32 | 33 | — | VMS | load time | — | — | 900 | K33 | T0103 | 09:00 |
| 32 | 33 | — | VMS | carrier | — | — | kev | L33 | T0103 | KEV |

### Week 1 — 25 changed rows (42 fields)

| 7.1 row | S7 row | Reference / location | Item | Field | 7.1 says | 7.1 cell | Schedule 7 says | S7 cell | Page task | Page holds |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | 2 | GN? Concert | 200kva & cables | delivery docket (DD) | — | — | 26121298 & 26121310 | J2 | T0260 | 26121298 / 26121310 |
| 2 | 2 | GN? Concert | 200kva & cables | load time | — | — | 1100 & 1130 | K2 | T0260 | 11:00 / 11:30 |
| 2 | 2 | GN? Concert | 200kva & cables | carrier | — | — | sfl | L2 | T0260 | SFL |
| 4 | 4 | GN13 - Generator  | 45kva | asset number | 1261273 EX REED | I4 | 1261271 | I4 | T0105 | 1261271 |
| 4 | 4 | GN13 - Generator  | 45kva | load time | — | — | 700/800 | K4 | T0105 | — |
| 4 | 4 | GN13 - Generator  | 45kva | carrier | — | — | sfl | L4 | T0105 | SFL |
| 5 | 5 | P69 - Supply Building | Building 6m | activity | — | — | D2D | G5 | T0106 | D2D |
| 5 | 5 | P69 - Supply Building | Building 6m | delivery docket (DD) | — | — | 2nd 26120550 | J5 | T0106 | 26120550 |
| 5 | 5 | P69 - Supply Building | Building 6m | load time | — | — | 930 | K5 | T0106 | 09:30 |
| 5 | 5 | P69 - Supply Building | Building 6m | carrier | — | — | sfl | L5 | T0106 | SFL |
| 6 | 6 | P45 St John First Aid | Building 6m | delivery docket (DD) | — | — | 1st 26122823 | J6 | T0261 | 26122823 |
| 6 | 6 | P45 St John First Aid | Building 6m | load time | — | — | 830 | K6 | T0261 | 08:30 |
| 6 | 6 | P45 St John First Aid | Building 6m | carrier | — | — | sfl | L6 | T0261 | SFL |
| 7 | 7 | WC59 - Toilets | FWF | activity | — | — | event p | G7 | T0107 | — |
| 7 | 7 | WC59 - Toilets | FWF | load time | — | — | na | K7 | T0107 | — |
| 8 | 8 | WC57 - Toilets | FWF | activity | — | — | event p | G8 | T0108 | — |
| 8 | 8 | WC57 - Toilets | FWF | load time | — | — | na | K8 | T0108 | — |
| 9 | 10 | WC67 - Toilets | FWF | activity | — | — | event p | G10 | T0262 | — |
| 9 | 10 | WC67 - Toilets | FWF | load time | — | — | moved from 1/10 | K10 | T0262 | — |
| 10 | 11 | WC69 - Toilets | FWF | activity | — | — | event p | G11 | T0263 | — |
| 10 | 11 | WC69 - Toilets | FWF | load time | — | — | moved from 1/10 | K11 | T0263 | — |
| 11 | 12 | WC70 - Toilet | FWF | activity | — | — | event p | G12 | T0264 | — |
| 11 | 12 | WC70 - Toilet | FWF | load time | — | — | moved from 1/10 | K12 | T0264 | — |
| 12 | 9 | Events | 2.5T Forklift STD | asset number | 1214298 | I12 | 1274555 STRP plus forklift tynes. | I9 | T0109 | 1214298 |
| 12 | 9 | Events | 2.5T Forklift STD | delivery docket (DD) | — | — | 26120976 STRP & 26122181 EAGS | J9 | T0109 | — |
| 14 | 14 | Helen Park | 6.0m Refrigerator Cont | delivery docket (DD) | — | — | rehire 26121442 | J14 | T0266 | 26121442 |
| 14 | 14 | Helen Park | 6.0m Refrigerator Cont | load time | — | — | 1200 | K14 | T0266 | 12:00 |
| 15 | 15 | P25 - Support Category Stewards | Building 4.8m | delivery docket (DD) | Not Torrens | J15 | traffic control | J15 | T0110 | Not Torrens |
| 16 | 16 | P67 - Gate 6 Security Office | Building 6m | delivery docket (DD) | Not Torrens | J16 | traffic control | J16 | T0111 | Not Torrens |
| 17 | 17 | P65 - Support Categories Race Secretary | Building 6m | delivery docket (DD) | Not Torrens | J17 | traffic control | J17 | T0112 | Not Torrens |
| 18 | 18 | P66 - Support Category Scrutineers | Building 6m | delivery docket (DD) | Not Torrens | J18 | traffic control | J18 | T0113 | Not Torrens |
| 18 | 18 | P66 - Support Category Scrutineers | Building 6m | load time | — | — | used | K18 | T0113 | — |
| 20 | 20 | P60 - Gate 5 Ticket Box | Ticket Box 4.8m | load time | — | — | 3rd | K20 | T0115 | — |
| 21 | 21 | P62 - Gate 5 QFES Office | Building 6m | load time | — | — | 2nd | K21 | T0116 | — |
| 22 | 22 | P63 - Gate 5 Volunteer Sign On | Building 6m | load time | — | — | 1st | K22 | T0117 | — |
| 23 | 23 | WC49 - Toilets | FWF | activity | — | — | event p | G23 | T0118 | — |
| 24 | 24 | WC48 - Toilets | FWF | activity | — | — | event p | G24 | T0119 | — |
| 25 | 25 | WC53 - Toilets | FWF | activity | — | — | event p | G25 | T0120 | — |
| 26 | 26 | WC51 - Toilets | Accessible Toilet | activity | — | — | Coates | G26 | T0121 | — |
| 27 | 27 | WC51 - Toilets | FWF | activity | — | — | event p | G27 | T0122 | — |
| 28 | 28 | WC54 - Toilets | FWF | activity | — | — | event p | G28 | T0123 | — |
| 29 | 29 | WC56 - Toilets | FWF | activity | — | — | event p | G29 | T0124 | — |

### Event Week — 15 changed rows (15 fields)

| 7.1 row | S7 row | Reference / location | Item | Field | 7.1 says | 7.1 cell | Schedule 7 says | S7 cell | Page task | Page holds |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 3 | GN04 - Generator  | 30kva | asset number | — | — | 1277400 EX EAGS | I3 | T0133 | 1277400 |
| 5 | 5 | GN19 - Generator  | 60kva | asset number | 1261271 | I5 | 1276416 80KVA EAGS | I5 | T0267 | 1276416 |
| 6 | 6 | GN24 - Generator  | 80kva | asset number | — | — | 1276412 EX GYMP TRYING TO GET MEAD | I6 | T0136 | — |
| 7 | 7 | GN25 - Generator  | 20kva | asset number | 1182021 EX ROCL | I7 | 1244536 EX NVAC | I7 | T0137 | 1244536 |
| 28 | 28 | — | VMS | quantity | 8 | D28 | 9 | D28 | T0158, T0159 | 9 / 5 |
| 32 | 32 | Blanchard Race | FWF | activity | — | — | event p | G32 | T0162, T0176 | — |
| 34 | 34 | PG01 - Toilet (Pit Garage) | FWF | activity | — | — | event p | G34 | T0164 | — |
| 35 | 35 | PG03 - Toilet (Pit Garage) | FWF | activity | — | — | event p | G35 | T0165 | — |
| 36 | 36 | PG05 - Toilet (Pit Garage) | FWF | activity | — | — | event p | G36 | T0166 | — |
| 37 | 37 | PG29 - Toilet (Pit Garage) | FWF | activity | — | — | event p | G37 | T0167 | — |
| 38 | 38 | WC85 - Toilets | FWF | activity | — | — | event p | G38 | T0168 | — |
| 41 | 40 | — | VMS | quantity | 1 | D41 | 2 | D40 | T0169, T0170 | 2 / 1 |
| 47 | 47 | Brad lones | FWF | activity | — | — | event p | G47 | T0176 | — |
| 48 | 48 | Shell V power | FWF | activity | — | — | event p | G48 | T0176 | — |
| 49 | 49 | Redbull | FWF | activity | — | — | event p | G49 | T0176 | — |

Reading the tables: "—" in the 7.1 column means the cell is empty in 7.1. The Week 3 differences are the TPORT COST column (M), which Schedule 4 added; Week 2 and Week 1 differences are the dockets, load times and carriers Schedules 4–7 added; the Event Week differences are generator numbers Schedules 4–6 changed and two VMS counts (8→9 on 19 Oct, 1→2 on 21 Oct).

## 3. What the page already has, what is missing, what conflicts

- **Already on the page:** all 176 rows that are the same, all 83 rows where the page carries more, and the one row only in 7.1 (the forklift, as T0085 on its later date). Every reference 7.1 names (153 keys) is a register key; none is new, renamed or dropped.
- **Missing from the page:** nothing. There is no cell in 7.1 whose value the page lacks.
- **Conflicts** (7.1 carries a different value from Schedule 7): these are the older values, and in each case the page keeps the later schedule or Andrew's record:

| Where (7.1 cell) | 7.1 says | Schedule 7 says | Page holds | Why the page is right |
|---|---|---|---|---|
| Week 2!I6 (P46) | 1327213 | 1322579 | P46 1327213 | Andrew's matches win (v8.71): his number stays on P46; the Schedule 4–7 number was set aside. |
| Week 2!I13 (GN18) | 1276501 | 1261273 ex REED | GN18 1261273 (EX REED) | Schedule 4 renumbered GN18; docket 26112495, KEV, 09:30 on the page. |
| Week 1!I4 (GN13) | 1261273 EX REED | 1261271 | GN13 1261271 | Schedule 4 moved 1261273 to GN18 and gave GN13 1261271; Baseplan (2) says GN13 Delivered. |
| Week 1!I12 (Events forklift) | 1214298 | 1274555 STRP plus forklift tynes | T0109 1214298, note "Schedule 7 adds forklift tynes; DD 26120976 (STRP) and DD 26122181 (EAGS)" | v9.50 kept the known on-site forklift and held the source fleet discrepancy. |
| Week 1!J15:J18 (P25, P67, P65, P66) | Not Torrens | traffic control | dd "Not Torrens" | v9.27 held: traffic-control source requirements do not overwrite operational status. |
| Week 3!J23 (WC60) | Torrens 26104410, 08:30, TEAMS, "moved from 7/10" | same, plus M "$290+" / "$580+" on the SFL rows | T0248 DD 26104424, SFL, 08:30, $290+ + $580+ | The page reads the SFL dockets and costs Schedule 4 added. |
| Event Week!I3 (GN04) | — | 1277400 EX EAGS | GN04 1277400 (EX EAGS) | Schedule 4. |
| Event Week!I5 (GN19) | 1261271 | 1276416 80KVA EAGS | GN19 1276416 (80 kVA EAGS) | Schedule 4; 1261271 is GN13. |
| Event Week!I6 (GN24) | — | 1276412 EX GYMP TRYING TO GET MEAD | GN24 no number (held) | Open on the board: GN24 1276412 vs line 40's 1276416. |
| Event Week!I7 (GN25) | 1182021 EX ROCL | 1244536 EX NVAC | GN25 1244536 (EX NVAC) | Schedule 4. |
| Event Week!D28 (VMS 19 Oct) | 8 | 9 | T0158 VMS ×9 | Schedule (5) VMS scope (v8.75). |
| Event Week!D41 (VMS 21 Oct) | 1 | 2 | T0169 VMS ×2 | Schedule (5) VMS scope (v8.75). |

## 4. Proposed page data changes from Schedule 7.1

**Clear-cut, apply:** none. The draft v10.21 only records the review (`DATA.schedule_review1021`: file, hash, saved time, "identical to Schedule 2", applied nothing) so the next person does not re-read it.

**Needs Andrew's answer:**

1. Is `GC500_26_Schedule_7_1.xlsx` really the latest issue? Its content is the 30 Sep schedule (Schedule 2), cell for cell. If Krystal or the branch has a newer file called 7.1, please send that one; the page holds the 9 Oct Schedule 7.
2. Schedule 8 (12 Oct 2026, 27 field changes and three new rows against Schedule 7) was read and compared on 12 Oct but never applied, and its workbook is not in this environment. Should it go on the page, and can the file be put in the inputs?

## 5. Transport and references in 7.1 — what is missing from the page

- **Loads, carriers, dates, times, truck types:** nothing in 7.1 is missing from the page. The reverse is true: 7.1 has no TPORT COST on Week 3 (17 rows the page prices: P06, WC01 accessible $570+, P38, P39, P42, GN20 $570+, GN21, GN23, GN03 $290+ each, WC60 $290+ and $580+, and the "na" rows) or on Week 2 (P08, P46, P51 $290+; WC20 $580+ and $290+; P52 and P57 $652.37+; P54 $310.70+; P55, P56 $290+; Helen Park container $275.40+; fencing $576.31+; GN18 and WC86 "na"), no load times or carriers on Week 2 (P52 READYS 08:30, P54 READYS 05:30, P55 SFL 05:00, P56 SFL 05:00, P57 READYS 08:30, WC20 SFL/SFL 09:00 and KEV/SFL 06:30/07:00, WC86 IRWINS 05:30, GN18 KEV 09:30, WC31 KEV 10:00, WC09 SFL/SFL 09:30/10:00, Helen Park container IRWINS 05:30, VMS KEV 09:00), no dockets on Week 2 (26112762, 26112733, 26112709, 26112730, 26112756, 26112783/26112786, 26112769/26112776, 26112797, 26112495, 26115307, 26115312/26115316, 26112749, 26115373) and none on Week 1 (Concert sets 26121298 & 26121310 SFL 11:00/11:30, GN13 SFL 07:00/08:00, P69 26120550 SFL 09:30, P45 26122823 SFL 08:30, container 26121442 12:00, Events forklift 26120976 STRP & 26122181 EAGS). It also lacks the four fencing semi loads to Phillip Park that the page carries as T0269–T0272 (TEAMS: 30 Sep two semis $1,152.62+, 1 Oct two semis $1,152.62+, 2 Oct one semi $576.31+, 6 Oct one semi $576.31+).
- **Truck types:** 7.1 carries none, and no schedule issue does; the page's truck information comes from the carrier delivery plan (Brendan Gill, 7 Sep) and the bookings, so nothing is missing from the page here.
- **References:** no new, renamed or dropped references. 7.1 names 153 register keys; all exist on the page. The three rows 7.1 has without a reference (Supply forklift, Helen Park container, Events forklift) are the page's T0085, T0266 and T0109.

## 6. The iEDM infrastructure programme (P003-26003-01)

### 6a. What the file is, against what the page holds

| | This file | What the page holds |
|---|---|---|
| File | `6579a510-P003-26003-01_Programme_-_Coates_Inf_V1_14.8.26_1.xlsx` (137,377 bytes) | `P003-26003-01 Programme Coates Inf V1 14.8.26 (2).xlsx` |
| SHA-256 | `078dd52a9c0680fd5ace780332fd4d5b5a5d9f8fdf8e83a9e3f110f276abb96b` | `fc39ba08ded1f6c6d4823b755b44d1463cf72262829b11dce4fa65f87506bcb7` (applied in v9.51, 9 Oct 2026, as `DATA.infrastructure_review951`) |
| Last saved | 15 Oct 2026 01:04 AEST (2026-10-14T15:04:19Z); no last-modified-by recorded; created 12 Aug 2026 by Rachel Switzman (iEDM) | (2) reviewed 9 Oct 2026; the 7 Oct file before it was `fd522077…` |
| Revision text | none in the workbook; "V1 14.8.26" is in the file name only | — |
| Sheets | `Base information (4)`, `CON WK 6`, `CON WK 5`, `CON WK 4`, `CON WK 3`, `CON WK 2`, `CON WK 1`, `RACE WEEK`, `DEMOB WK 1`, `DEMOB WK 2`, `DEMOB WK 3` (eleven copies of the one programme, A1:K173, 1,028 cells each; `CON WK 2` has 1,031) and a hidden `DEMOB WK 1` (B2:L30, 28 buildings) | same 12 sheets |
| Content | 11,529 stored cells, no formulas, no comments | — |
| `Base information (4)` against the page's issue | **identical.** Aligned by facility, the differences from the 7 Oct file are exactly the 12 rows `infrastructure_review951` already records: P10/P11/P12 complete date 16th→17th September; P52, P54, P55, P56, P57, WC20, WC86, GN18 Complete 7th October (GN18 "Dropped but needs to be put into final location"); P45 added at row 103. Nothing else. | — |
| New against the page's issue | **three cells**: `CON WK 2!I101` GN13 "Complete", `CON WK 2!I102` P69 "Complete", `CON WK 2!I103` P45 "Complete" — on the `CON WK 2` copy only, with no Date Complete (column J); the base sheet and the other copies do not carry them | not on the page. The same three cells were read on 14 Oct in `v10.10_charge_persistence_LIVE/document_review` (file `1-P003-26003-01-Programme-Coates-Inf-V1-14.8.26.xlsx`, `501d229b…`, modified 2026-10-13T10:37:35): "three cells only … each already has one received unit and an on-site/complete record in snapshot version 5796". That review did not change the page. |
| Hidden `DEMOB WK 1` | 28 buildings (P01–P42) with their September install dates and Complete marks; identical to the 7 Oct file. It is a leftover snapshot, not a demob plan: no pickup dates | the page's demob dates come from the schedule's Demob sheets, which 7.1 does not change |

So the programme has **no new install dates, quantities, locations or notes** against what the page already read on 9 Oct; the only movement is the three Complete marks.

### 6b. Every programme reference, checked against the page

The 142 programme rows carry 141 references (one row, `Base information (4)!A21` "Trackmat Delivery - S18", has none; the page has it as T0025, 20 track mats to S18).

**Not a register key (covered by an alias):**

| Programme name | Cell | On the page as |
|---|---|---|
| LT 9,10,11 - WK6 Night Works (5x light towers, Delivery to Molendinar, 11 Sep) | Base information (4)!A4 | T0002 "Light Tower × 5 · Delivery to Molendinar" (plant line); LT01–LT04 label four of the five Molendinar towers (Baseplan 2 review). The names LT09/LT10/LT11 appear nowhere else. |
| CP1 (P68) - Signevent Crib Room | Base information (4)!A10 | CP1 (register and master position). P68 is the programme's own alias. |
| GN22 - Generator, 200 kVA, "NOT APPLICABLE ANY MORE" | Base information (4)!A20 | Not on the register — correct; the schedule's 200 kVA row is T0019 (Week 5, unreferenced). |
| WCTV, "UNSURE OF SPECS - SUPERCARS ORDER DIRECT" | Base information (4)!A52 | T0243 "Toilet Block 6m · WC-TV (sewer connect)" (plant line, master position). |

**On the register but with no map position (not in MASTER_LOC):**

| Reference | Programme row | What the page knows |
|---|---|---|
| WC100 | Base information (4)!A16 — 2x trailer-mounted single toilets, "Delivered to The Spit & S18" | register WC100, FWF Trailer ×2 (14 Sep); no pin |
| WC66 | Base information (4)!A71 — 2x single toilets, Helen Park Contractors, "I THINK ALREADY DELIVERED" | register WC66, FWF ×2 (1 Oct); no pin |
| GN25 | Base information (4)!A128 — 20 kVA, 19 Oct | register GN25 1244536; destination Seaway Carpark by the D024 label (v9.73); no coordinates |
| LT05, LT06 | Base information (4)!A149 — 2x light towers, 20 Oct | register LT05/LT06; Seaway Car Park Transporter Compound by label (v9.73); no coordinates |
| WC85 | Base information (4)!A154 — 1x single toilet, 20 Oct | register WC85, FWF ×1 (19 Oct); destination unsupported (v9.73) |

All other 131 referenced rows resolve to a register key with a master position.

### 6c. Rows that conflict with the page

By Andrew's rule (12 Oct 2026: "My data is truth") the site record stands; these are listed so he can see where iEDM's sheet differs.

**Quantities and descriptions**

| Reference | Programme cell | Programme says | Page holds |
|---|---|---|---|
| WC57 | Base information (4)!F104 | 7 x Single Toilets (Was previously 2) | T0108 FWF ×2 (9 Oct); two Event Portables units received 14 Oct |
| WC59 | Base information (4)!F77 | 2 x Single Toilets (was in as 7) | T0107 FWF ×7 (12 Oct) |
| WC67 | Base information (4)!F73 and G73 | 2x Single Toilets; CHECK NUMBERS - 4 x UNITS | T0081 FWF ×2 (1 Oct) and T0262 FWF ×2 (13 Oct, moved from 1/10) |
| WC09 | Base information (4)!F99 | 1x Sewer - Female, 1x Sewer - Male, 10x Single toilets | T0102 Toilet Block 6m ×2, T0101 FWF ×4 (reduced from 10 in the schedule), T0259 Pee Panel ×6; native WC09 FWF planned 10 per the 14 Oct record update |
| P13, P14, P15, P16 | Base information (4)!D40:E43 | install dates written as 21 Sep 2029 | 21 Sep 2026 (the year is a typing slip in the programme) |
| P69, P45 | Base information (4)!E102:E103 | install end 12 Oct 2025 (before the 12 Oct 2026 start) | single 12 Oct 2026 delivery each; already held as an invalid end year in v9.51 |

All other quantity notes in column F match the page (checked for 69 rows: single toilets, sewer and tanked pairs as 6 m toilet blocks, 16-pan blocks, accessible units, fridges, chairs, trailer toilets, light towers).

**Install dates (programme column D against the first Build/Event date on the page)** — 28 rows:

| Reference | Programme cell | Programme install start | Page date | Page events |
|---|---|---|---|---|
| P13 | Base information (4)!D40 | 2029-09-21 | 2026-09-21 | T0041 2026-09-21 Building 4.8m (qty not stated) |
| P14 | Base information (4)!D41 | 2029-09-21 | 2026-09-21 | T0042 2026-09-21 Building 4.8m (qty not stated) |
| P15 | Base information (4)!D42 | 2029-09-21 | 2026-09-21 | T0043 2026-09-21 Building 4.8m (qty not stated) |
| P16 | Base information (4)!D43 | 2029-09-21 | 2026-09-21 | T0044 2026-09-21 Building 4.8m (qty not stated) |
| WC02 | Base information (4)!D44 | 2026-09-22 | 2026-09-21 | T0239 2026-09-21 FWF ×1 |
| WC04 | Base information (4)!D45 | 2026-09-22 | 2026-09-21 | T0240 2026-09-21 FWF ×1 |
| WC06 | Base information (4)!D47 | 2026-09-22 | 2026-09-21 | T0241 2026-09-21 FWF ×2 |
| WC50 | Base information (4)!D51 | 2026-09-23 | 2026-09-28 | T0247 2026-09-28 FWF ×1 |
| WC31 | Base information (4)!D55 | 2026-09-25 | 2026-10-08 | T0096 2026-10-08 Accessible Toilet ×1, T0097 2026-10-08 16Pan Block ×2 |
| WC67 | Base information (4)!D73 | 2026-10-13 | 2026-10-01 | T0081 2026-10-01 FWF ×2, T0262 2026-10-13 FWF ×2 |
| WC33 | Base information (4)!D75 | 2026-10-01 | 2026-10-08 | T0100 2026-10-08 FWF ×17 |
| P53 | Base information (4)!D84 | 2026-10-07 | 2026-09-29 | T0070 2026-09-29 Building 6m ×1 |
| WC38 | Base information (4)!D92 | 2026-10-07 | 2026-10-09 | T0091 2026-10-09 FWF ×1 |
| WC39 | Base information (4)!D93 | 2026-10-07 | 2026-10-09 | T0092 2026-10-09 FWF ×2 |
| WC40 | Base information (4)!D94 | 2026-10-07 | 2026-10-09 | T0093 2026-10-09 FWF ×5 |
| WC61 | Base information (4)!D95 | 2026-10-07 | 2026-10-09 | T0095 2026-10-09 FWF ×8 |
| WC34 | Base information (4)!D98 | 2026-10-08 | 2026-10-09 | T0099 2026-10-09 FWF ×1 |
| WC57 | Base information (4)!D104 | 2026-10-12 | 2026-10-09 | T0108 2026-10-09 FWF ×2 |
| WC29 | Base information (4)!D139 | 2026-10-19 | 2026-10-13 | T0148 2026-10-13 FWF ×7 |
| WC46 | Base information (4)!D142 | 2026-10-19 | 2026-10-15 | T0151 2026-10-15 FWF ×1 |
| WC55 | Base information (4)!D143 | 2026-10-19 | 2026-10-15 | T0152 2026-10-15 FWF ×1 |
| WC68 | Base information (4)!D146 | 2026-10-19 | 2026-10-13 | T0155 2026-10-13 FWF ×1 |
| WC72 | Base information (4)!D147 | 2026-10-19 | 2026-10-13 | T0156 2026-10-13 FWF ×1 |
| PG01 | Base information (4)!D150 | 2026-10-20 | 2026-10-19 | T0164 2026-10-19 FWF ×1 |
| PG03 | Base information (4)!D151 | 2026-10-20 | 2026-10-19 | T0165 2026-10-19 FWF ×1 |
| PG05 | Base information (4)!D152 | 2026-10-20 | 2026-10-19 | T0166 2026-10-19 FWF ×1 |
| PG29 | Base information (4)!D153 | 2026-10-20 | 2026-10-19 | T0167 2026-10-19 FWF ×1 |
| WC85 | Base information (4)!D154 | 2026-10-20 | 2026-10-19 | T0168 2026-10-19 FWF ×1 |

Most are one working day apart or are the programme's planning date where the schedule later moved the load (WC67, WC29, WC68, WC72 moved to 13 Oct; WC46, WC55 to 15 Oct; WC38–WC40, WC61, WC34 to 9 Oct; PG01–PG29 and WC85 to 19 Oct). P13–P16 are written as 2029 in the programme. P53 is "Not in Coates Scope" (programme G84), which agrees with the page treating P47/P53 as cancelled.

**Delivery and site notes the page does not show** — 38 rows. The page shows programme evidence only for the 12 rows whose cells changed in the 9 Oct issue; the rest of columns G and K have never been put on the page:

| Reference | Cell | Delivery note (G) | Site note (K) |
|---|---|---|---|
| LT09, LT10, LT11 | Base information (4)!G4 | Delivery to Molendinar | — |
| P01 | Base information (4)!G6 | Morning Delivery  | Needs Levelling and aligning |
| P03 | Base information (4)!G7 | Morning Delivery  | Needs Levelling and aligning |
| P04 | Base information (4)!K8 | — | Needs Levelling and aligning |
| P05 | Base information (4)!K9 | — | Needs Levelling and aligning |
| CP1, P68 | Base information (4)!G10 | Morning Delivery  | Drawing to be updated to accurately reflect where it needs to go |
| WC21 | Base information (4)!G13 | S05 | — |
| WC16 | Base information (4)!K14 | — | Need to be levelled and aligned |
| P33 | Base information (4)!K15 | — | Need to be levelled and aligned |
| WC100 | Base information (4)!G16 | Morning Delivery  | Delivered to The Spit & S18 |
| GN22 | Base information (4)!G20 | NOT APPLICABLE ANY MORE | — |
| — | Base information (4)!G21 | Morning Delivery - early  | — |
| P27 | Base information (4)!G29 | NOT IN COATES SCOPE | — |
| P29 | Base information (4)!G30 | NOT IN COATES SCOPE | — |
| WC50 | Base information (4)!K51 | — | Onsite - Needs dropping into final location |
| WC27 | Base information (4)!K53 | — | TO BE LEVELLED? |
| WC15 | Base information (4)!K54 | — | TO BE CONNECTED |
| WC31 | Base information (4)!K55 | — | Dropped into position, needs to be levelled and connected.  |
| P06 | Base information (4)!K57 | — | TO BE PUT IN FINAL LOCATION & LEVELLED |
| WC01 | Base information (4)!K58 | — | Accessible not delivered |
| P38 | Base information (4)!K60 | — | TO BE PUT IN FINAL LOCATION & LEVELLED |
| P39 | Base information (4)!K61 | — | TO BE PUT IN FINAL LOCATION & LEVELLED |
| P42 | Base information (4)!K62 | — | TO BE PUT IN FINAL LOCATION & LEVELLED |
| GN20 | Base information (4)!K66 | — | NEED TO REVIEW DATE TO ALIGN BETTER WITH HTH |
| GN21 | Base information (4)!K67 | — | NEED TO REVIEW DATE TO ALIGN BETTER WITH HTH |
| GN23 | Base information (4)!K68 | — | NEED TO REVIEW DATE TO ALIGN BETTER WITH HTH |
| WC66 | Base information (4)!G71 | I THINK ALREADY DELIVERED | — |
| WC71 | Base information (4)!G72 | NEED TO BE DROPPED IN FINAL LOCATION | — |
| WC67 | Base information (4)!G73 | CHECK NUMBERS - 4 x UNITS | — |
| WC60 | Base information (4)!G74 | Needs to be before 10am | — |
| P08 | Base information (4)!G82 | PENDING APPROVAL | — |
| P53 | Base information (4)!G84 | Not in Coates Scope | — |
| WC20 | Base information (4)!G89 | Pushed to when the Franna is available to install | — |
| WC86 | Base information (4)!G90 | Can be pushed later in the programme | — |
| GN18 | Base information (4)!K91 | — | Dropped but needs to be put into final location |
| WC31 | Base information (4)!G96 | NEED TO CHECK ON WHAT IS CONFIRMED - 16 PAN OR SINGLE TOILETS | — |
| P45 | Base information (4)!G103 | NEW THIS YEAR | — |
| WC69 | Base information (4)!G105 | NEED TO THINK ABOUT DELIVERY DATE AS BUILDINGS HAPPENING LATER IN THE PIECE | — |

These are iEDM's words as written on 7 Oct or earlier; several are already overtaken by the site record (levelling done, final locations, WC01 accessible delivered later, WC66 delivered 1 Oct).

### 6d. Proposed page changes from the programme

**Clear-cut, apply (in the draft v10.21):**

1. Record the 15 Oct issue in `DATA.infrastructure_review1021` (file, hash, saved time, base sheet unchanged, three changed cells) and show the three Complete marks as documentary evidence in the drawer of GN13, P69 and P45, under the same fold the 9 Oct issue uses ("Infrastructure workbook evidence · GN13 · 15 Oct 2026 issue: Source status Not stated → Complete (CON WK 2 sheet only …); Source completion date Not stated; current site records remain authoritative"). Evidence: `CON WK 2!I101`, `CON WK 2!I102`, `CON WK 2!I103`. Nothing is imported: no receipt, completion, date, quantity or position changes, and every other drawer renders exactly as before.

**Needs Andrew's answer:**

1. WC57 / WC59 in the Supply compound: the programme says WC57 is now 7 (was 2) and WC59 is now 2 (was 7); the page has WC57 2 (two received 14 Oct) and WC59 7. Which is right?
2. WC67: programme says 2 but "CHECK NUMBERS - 4 x UNITS"; the page has 2 on 1 Oct plus 2 on 13 Oct. Is the total 4?
3. Six references the programme names have no map position on the page (WC100, WC66, GN25, LT05, LT06, WC85). Where are they?
4. The programme carries delivery and site notes for 38 rows (levelling, final location, before 10am, Franna, pending approval) that the page does not show. Do you want them on each reference drawer as source notes?
5. Twenty-eight install dates differ between the programme and the schedule the page follows (listed). The site record stands; say if any of these should move the plan.

## 7. The draft v10.21 and how it was checked

`v10.21_schedule7_1_DRAFT/`: `patch_v1021.py` (BASE_SHA = live v10.18; three exact replacements: the two review blocks appended to the end of the `const DATA` line, the `programme1021.js` script inserted after the v9.51 programme script, footer ` · v10.18` → ` · v10.21`), `programme1021.js` (first line `/* Author: Andrew Fisher. … */`; wraps `infrastructure951Html` so the drawer hook from v9.51 adds the 15 Oct fold for the three references and nothing else), `programme1021.json` (the two review blocks), `tests/test_patch1021.py` (exact-source guards: wrong base and repeat refused, every anchor once, every earlier DATA key byte for byte unchanged, script parses, footer, built page carries each change), `tests/test_programme1021.cjs` (runs the script under node with a stub renderer), and `README.md`.

Built in the scratchpad from the saved copy of the live page (`live_now.html`, SHA-256 `2d09fa44…`), then the standard `scrub_attributions.py` and `check_page.py --base`. Results are in `tests/test_v1021_result.json` and `tests/build_check.txt`. **Not uploaded**; no edit token was used or looked for. No browser sweep was run here: the toolchain's Chromium is not installed in this environment, so the 22-tab desktop and phone sweeps and a phone screenshot of a GN13 / P69 / P45 drawer remain for whoever publishes.

## 8. Files

- `review_15Oct2026_schedule7_1/REPORT.md` — this report.
- `review_15Oct2026_schedule7_1/diff.json` — the machine-readable diff: both workbooks' identity, the row comparison per sheet (every changed field with its 7.1 cell, Schedule 7 cell and page task), the programme reference check, conflicts, notes and the proposed changes.
- `v10.21_schedule7_1_DRAFT/` — the draft patch, source, tests and README.
- Working copies (scratchpad only, not committed): the two workbooks under `scratchpad/sched71/in/`, the XML cell dumps, `rowdiff.json`, `progcheck.json`, the build under `scratchpad/sched71/build/GC500_v10.21/`.

Not in this environment and therefore not read: the Schedule 7 original (`485f5d88…`), Schedule 8 (`df43938f…`), the programme (2) original (`fc39ba08…`) and the 13 Oct programme (`501d229b…`); their recorded hashes and cell facts in the release folders were used instead, and the Schedule 7 reconstruction relies on the four cells and two rows `v9.50_schedule7_LIVE/tests/original950.py` verified.
