# Coverage: every physical unit against the v9.15 master shapes

Author: Andrew Fisher · built 9 Oct 2026 · read only (live page v9.18 DATA, record v4581, v9.15 shapes_v915.json, 2 Oct master D001-26003-03)

## Totals

| | units (all) | units (active refs) |
|---|---|---|
| TRACED | 294 | 293 |
| MISSING_BUT_DRAWN | 8 | 8 |
| NOT_ON_MASTER | 91 | 85 |
| **total** | **393** | **386** |

Counted as pieces, one row per reference (not in the unit totals): **15 water-barrier references, 375 TL2 pieces** (9 references / 226 pieces MISSING_BUT_DRAWN, 6 / 149 NOT_ON_MASTER); **trakmat 20 pieces** (T0025, NOT_ON_MASTER).

Waste tanks (6) are NOT_ON_MASTER by design: each sits under its toilet block and takes the block's traced footprint (the project manager, 9 Oct).

## By type and status (units)

| type | TRACED | MISSING_BUT_DRAWN | NOT_ON_MASTER | total | of which cancelled/deleted | owners |
|---|---|---|---|---|---|---|
| accessible_toilet | 4 | 0 | 0 | 4 | 0 | Coates 2, unknown 2 |
| building_12 | 6 | 0 | 0 | 6 | 0 | Coates 6 |
| building_3.6 | 1 | 0 | 0 | 1 | 0 | Coates 1 |
| building_4.8 | 11 | 0 | 2 | 13 | 0 | Coates 13 |
| building_6 | 27 | 0 | 1 | 28 | 2 | Coates 26, unknown 2 |
| building_9.6 | 3 | 0 | 0 | 3 | 0 | Coates 3 |
| container_3m | 0 | 0 | 1 | 1 | 0 | Coates 1 |
| distribution_board | 0 | 0 | 1 | 1 | 0 | Coates 1 |
| forklift | 0 | 0 | 6 | 6 | 0 | Coates 6 |
| fwf | 207 | 5 | 19 | 231 | 4 | Event Portables 188, Coates 40, unknown 3 |
| fwf_trailer | 0 | 0 | 2 | 2 | 0 | Coates 2 |
| generator_100 | 0 | 0 | 1 | 1 | 0 | Coates 1 |
| generator_150 | 1 | 0 | 0 | 1 | 0 | Coates 1 |
| generator_20 | 1 | 0 | 1 | 2 | 0 | Coates 2 |
| generator_200 | 0 | 0 | 3 | 3 | 1 | Coates 2, unknown 1 |
| generator_30 | 2 | 0 | 0 | 2 | 0 | Coates 2 |
| generator_350 | 1 | 0 | 0 | 1 | 0 | Coates 1 |
| generator_45 | 0 | 1 | 0 | 1 | 0 | Coates 1 |
| generator_50 | 1 | 1 | 0 | 2 | 0 | Coates 2 |
| generator_60 | 3 | 0 | 0 | 3 | 0 | Coates 3 |
| generator_80 | 1 | 0 | 0 | 1 | 0 | Coates 1 |
| light_tower | 0 | 0 | 24 | 24 | 0 | unknown 17, Coates 7 |
| other | 0 | 0 | 1 | 1 | 0 | Coates 1 |
| pee_panel | 6 | 0 | 0 | 6 | 0 | Event Portables 6 |
| refrigerated_container | 0 | 1 | 0 | 1 | 0 | Coates 1 |
| ticket_box | 2 | 0 | 0 | 2 | 0 | Coates 2 |
| toilet_block_16pan | 2 | 0 | 0 | 2 | 0 | Event Portables 1, unknown 1 |
| toilet_block_6m | 15 | 0 | 0 | 15 | 0 | Coates 15 |
| vms_board | 0 | 0 | 23 | 23 | 0 | unknown 14, Coates 8, PremAir Hire 1 |
| waste_tank | 0 | 0 | 6 | 6 | 0 | Coates 6 |

## MISSING_BUT_DRAWN (the master draws it; v9.15 has no component)

| reference | type | units / pieces | where on the master | confidence |
|---|---|---|---|---|
| GN13 | generator_45 | units 1 of 1 | orange generator symbol on the 2 Oct master (drawing 162244); the pins release in flight moves GN13 here ("follow the master", the project manager) · pt [0.52527, 0.19253] | high |
| GN18 | generator_50 | units 1 of 1 | orange generator symbol on the 2 Oct master (drawing 162600); the pins release in flight moves GN18 here · pt [0.21036, 0.68031] | high |
| WB01 | water_barrier_tl2 | schedule 12 pieces | R03 GC Hwy at PB3 / OP62: 11 pieces drawn, 22.0 m, centre [0.15731, 0.66474] | high |
| WB04 | water_barrier_tl2 | schedule 14 pieces | R06 Breaker St, west edge of Helen Park: 13 pieces drawn, 26.0 m, centre [0.05028, 0.71804] | medium |
| WB05 | water_barrier_tl2 | schedule 13 pieces | R04 GC Hwy south of WC72, by the light rail station: 11 pieces drawn, 22.0 m, centre [0.12725, 0.70903] | medium |
| WB06 | water_barrier_tl2 | schedule 154 pieces | R01 GC Hwy, S11-S13 (west part of the one grandstand run): 65 pieces drawn, 132.2 m, centre [0.32981, 0.4865]; R02 GC Hwy, S14/S01/S02 behind the precinct fence (east part): 92 pieces drawn, 291.8 m, centre [0.41628, 0.41547] | high |
| WB13 | water_barrier_tl2 | schedule 10 pieces | R08 single pieces along the precinct fence behind S15 (by WC45): 7 pieces drawn, 50.2 m, centre [0.68199, 0.32707]; R09 alternating run below S15 by BAR 16 / FOOD (may be part of WB13 or another run): 10 pieces drawn, 23.4 m, centre [0.65857, 0.34415] | low/medium |
| WB14 | water_barrier_tl2 | schedule 2 pieces | R07 MP 4.0 / EEP 6, Turn 4 drivers right: 2 pieces drawn, 4.0 m, centre [0.76142, 0.26213] | high |
| WB16 | water_barrier_tl2 | schedule 13 pieces | R05 Commodore Park, by WC40 / accessible parking: 13 pieces drawn, 29.2 m, centre [0.22067, 0.63229] | medium |
| WB17 | water_barrier_tl2 | schedule 6 pieces | R10 T8 kerb: row of yellow pieces (no white alternation): 11 pieces drawn, 13.7 m, centre [0.34465, 0.20621]; R11 T9 kerb: row of yellow pieces (no white alternation): 11 pieces drawn, 13.7 m, centre [0.32454, 0.21129] | low |
| WB18 | water_barrier_tl2 | schedule 2 pieces | R12 T2 kerb: row of yellow pieces (no white alternation): 11 pieces drawn, 15.5 m, centre [0.6395, 0.31936] | low |
| WC59 | fwf | units 3,4,5,6,7 of 7 | the master draws 7 FWF under the WC57 tag (v9.15 gave all 7 to WC57) and 2 at WC59; the schedule and record give WC57 2 and WC59 7 (7 Event Portables numbers) - the tags or the schedule are swapped; to confirm | medium |
| T0266 | refrigerated_container | units 1 of 1 | untagged 6.1 x 2.4 m container outline at Helen Park beside P55/P56 (the schedule row says Helen Park); not proven to be this unit · pt [0.05709, 0.70761] | low |

## Every reference with a gap (any unit not TRACED)

| reference | state | type | not traced | status | why / where |
|---|---|---|---|---|---|
| FL01 | active | forklift | 1 of 1 | NOT_ON_MASTER | mobile plant; not drawn on the master |
| FL02 | active | forklift | 1 of 1 | NOT_ON_MASTER | mobile plant; not drawn on the master |
| GN13 | active | generator_45 | 1 of 1 | MISSING_BUT_DRAWN | see the table above |
| GN18 | active | generator_50 | 1 of 1 | MISSING_BUT_DRAWN | see the table above |
| GN23 | active | distribution_board | 1 of 1 | NOT_ON_MASTER | not drawn on the master (no legend entry) |
| GN25 | active | generator_20 | 1 of 1 | NOT_ON_MASTER | not drawn on the 2 Oct master: no D024 callout with a leader; callout 025 sits in the storage-yard list box (top left of D024), no symbol on the master tied to it |
| GN? | active | generator_200 | 2 of 2 | NOT_ON_MASTER | not drawn on the 2 Oct master: "Concert" 200 kVA - no reference number, no callout, no tag |
| LT01 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LT02 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LT03 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LT04 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LT05 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LT06 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC01 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC02 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC03 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC04 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC05 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC06 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC07 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC08 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC09 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC10 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC11 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC12 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| LTC14 | active | light_tower | 1 of 1 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| NVLT | active | light_tower | 5 of 5 | NOT_ON_MASTER | no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard |
| P47 | Cancelled 06 Oct 12:27 by the project ma | building_6 | 1 of 1 | NOT_ON_MASTER | cancelled/deleted: Cancelled 06 Oct 12:27 by the project manager — No longer needed |
| PG01 | active | fwf | 1 of 1 | NOT_ON_MASTER | not drawn on the 2 Oct master: master prints PIT LANE only; garage numbers are not printed, no unit drawn |
| PG03 | active | fwf | 1 of 1 | NOT_ON_MASTER | not drawn on the 2 Oct master: master prints PIT LANE only; garage numbers are not printed, no unit drawn |
| PG05 | active | fwf | 1 of 1 | NOT_ON_MASTER | not drawn on the 2 Oct master: master prints PIT LANE only; garage numbers are not printed, no unit drawn |
| PG29 | active | fwf | 1 of 1 | NOT_ON_MASTER | not drawn on the 2 Oct master: master prints PIT LANE only; garage numbers are not printed, no unit drawn |
| T0001 | active | vms_board | 7 of 7 | NOT_ON_MASTER | VMS boards are not drawn on the master (no legend entry); positions are on VMS001-26003-01 and D025 |
| T0005 | active | forklift | 2 of 2 | NOT_ON_MASTER | mobile plant; not drawn on the master |
| T0019 | Taken off its day 14 Sep 20:13 by the pr | generator_200 | 1 of 1 | NOT_ON_MASTER | cancelled/deleted: Taken off its day 14 Sep 20:13 by the project manager — the row’s own note: WAS GN22 NOW 350KVA GN22-GN20 BEING DEL WEEK 3 SEPT 30. The schedule carries that set as GN20 (350 kVA, asset 1276701) on 30 Sep, row T0075. |
| T0021 | active | building_4.8 | 1 of 1 | NOT_ON_MASTER | no symbol or tag for this unit on the master |
| T0022 | active | building_4.8 | 1 of 1 | NOT_ON_MASTER | no symbol or tag for this unit on the master |
| T0023 | active | other | 1 of 1 | NOT_ON_MASTER | no symbol or tag for this unit on the master |
| T0024 | active | fwf | 1 of 1 | NOT_ON_MASTER | not drawn on the 2 Oct master: no tag or unit shape on the master; current pin is an area/place label |
| T0025 | active | trakmat | 20 pieces | NOT_ON_MASTER | trakmats are not drawn on the master (no legend entry) |
| T0085 | active | forklift | 1 of 1 | NOT_ON_MASTER | mobile plant; not drawn on the master |
| T0089 | Taken off its day 07 Oct 05:23 by the pr | fwf | 1 of 1 | NOT_ON_MASTER | cancelled/deleted: Taken off its day 07 Oct 05:23 by the project manager — no reason on the row |
| T0103 | active | vms_board | 2 of 2 | NOT_ON_MASTER | VMS boards are not drawn on the master (no legend entry); positions are on VMS001-26003-01 and D025 |
| T0109 | active | forklift | 1 of 1 | NOT_ON_MASTER | mobile plant; not drawn on the master |
| T0128 | active | vms_board | 2 of 2 | NOT_ON_MASTER | VMS boards are not drawn on the master (no legend entry); positions are on VMS001-26003-01 and D025 |
| T0158 | active | vms_board | 9 of 9 | NOT_ON_MASTER | VMS boards are not drawn on the master (no legend entry); positions are on VMS001-26003-01 and D025 · page rows disagree: 8 boards (orphan_rows) vs 9 (unreferenced); 9 used |
| T0162 | active | fwf | 1 of 1 | NOT_ON_MASTER | no symbol or tag for this unit on the master |
| T0169 | active | vms_board | 2 of 2 | NOT_ON_MASTER | VMS boards are not drawn on the master (no legend entry); positions are on VMS001-26003-01 and D025 · page rows disagree: 1 board (orphan_rows) vs 2 (unreferenced); 2 used |
| T0170 | active | vms_board | 1 of 1 | NOT_ON_MASTER | VMS boards are not drawn on the master (no legend entry); positions are on VMS001-26003-01 and D025 |
| T0176 | active | fwf | 2 of 2 | NOT_ON_MASTER | no symbol or tag for this unit on the master |
| T0258 | active | container_3m | 1 of 1 | NOT_ON_MASTER | not drawn on the 2 Oct master: no tag or unit shape on the master; current pin is an area/place label |
| T0266 | active | refrigerated_container | 1 of 1 | MISSING_BUT_DRAWN | see the table above |
| T0268 | active | generator_100 | 1 of 1 | NOT_ON_MASTER | no symbol or tag for this unit on the master |
| WB01 | active | water_barrier_tl2 | 12 pieces | MISSING_BUT_DRAWN | see the table above |
| WB02 | active | water_barrier_tl2 | 34 pieces | NOT_ON_MASTER | no white-and-yellow barrier run drawn at this place on the 2 Oct master (or the run is outside the masters dates) |
| WB03 | active | water_barrier_tl2 | 30 pieces | NOT_ON_MASTER | no white-and-yellow barrier run drawn at this place on the 2 Oct master (or the run is outside the masters dates) |
| WB04 | active | water_barrier_tl2 | 14 pieces | MISSING_BUT_DRAWN | see the table above |
| WB05 | active | water_barrier_tl2 | 13 pieces | MISSING_BUT_DRAWN | see the table above |
| WB06 | active | water_barrier_tl2 | 154 pieces | MISSING_BUT_DRAWN | see the table above |
| WB07 | active | water_barrier_tl2 | 17 pieces | NOT_ON_MASTER | no white-and-yellow barrier run drawn at this place on the 2 Oct master (or the run is outside the masters dates) |
| WB13 | active | water_barrier_tl2 | 10 pieces | MISSING_BUT_DRAWN | see the table above |
| WB14 | active | water_barrier_tl2 | 2 pieces | MISSING_BUT_DRAWN | see the table above |
| WB15 | active | water_barrier_tl2 | 4 pieces | NOT_ON_MASTER | no white-and-yellow barrier run drawn at this place on the 2 Oct master (or the run is outside the masters dates) |
| WB16 | active | water_barrier_tl2 | 13 pieces | MISSING_BUT_DRAWN | see the table above |
| WB17 | active | water_barrier_tl2 | 6 pieces | MISSING_BUT_DRAWN | see the table above |
| WB18 | active | water_barrier_tl2 | 2 pieces | MISSING_BUT_DRAWN | see the table above |
| WB19 | active | water_barrier_tl2 | 34 pieces | NOT_ON_MASTER | no white-and-yellow barrier run drawn at this place on the 2 Oct master (or the run is outside the masters dates) |
| WB20 | active | water_barrier_tl2 | 30 pieces | NOT_ON_MASTER | no white-and-yellow barrier run drawn at this place on the 2 Oct master (or the run is outside the masters dates) |
| WC05 | active | waste_tank | 1 of 1 | NOT_ON_MASTER | under block 1097377 (the only block at this reference); same as the block it serves: [6.01, 2.99] m (v9.15 traced block) |
| WC100 | active | fwf_trailer | 2 of 2 | NOT_ON_MASTER | on no drawing (FWF trailers at The Spit and S18) |
| WC20 | active | waste_tank | 2 of 2 | NOT_ON_MASTER | under block 1311341 (record units/WC20 set labels); same as the block it serves: [6.0, 3.01] m (v9.15 traced block) |
| WC27 | active | waste_tank | 1 of 1 | NOT_ON_MASTER | under block 1119484 (the only block at this reference); same as the block it serves: [6.0, 2.98] m (v9.15 traced block) |
| WC32 | Cancelled 03 Oct 20:11 by the project ma | fwf | 1 of 1 | NOT_ON_MASTER | cancelled/deleted: Cancelled 03 Oct 20:11 by the project manager — Cancelled by the project manager — confirmed in GC500 chat on 3 Oct 2026. |
| WC45 | active | fwf | 1 of 8 | NOT_ON_MASTER | no symbol or tag for this unit on the master |
| WC59 | active | fwf | 5 of 7 | MISSING_BUT_DRAWN | see the table above |
| WC60 | active | waste_tank | 2 of 2 | NOT_ON_MASTER | under block unit None (tank-to-block pairing not recorded - to confirm); same as the block it serves; both WC60 blocks trace [6.02, 2.99] and [6.0, 3.01] m (v9.15 components [0, 1]), so the footprint is the same whichever block |
| WC66 | Deleted 01 Oct 15:23 by the project mana | fwf | 2 of 2 | NOT_ON_MASTER | cancelled/deleted: Deleted 01 Oct 15:23 by the project manager — Not on this job |
| WC67 | active | fwf | 2 of 4 | NOT_ON_MASTER | no symbol or tag for this unit on the master · second schedule row T0262 (Event Portables load plan); the master draws 2 at WC67 and 4 under a separate WC-BSF tag beside it - not proven to be these |
| WC69 | active | fwf | 3 of 12 | NOT_ON_MASTER | no symbol or tag for this unit on the master |
| WC85 | active | fwf | 1 of 1 | NOT_ON_MASTER | not drawn on the 2 Oct master: on no drawing |

## Waste tanks (under their blocks)

| reference | tank | block it sits under | block traced (v9.15 component) | footprint | pairing |
|---|---|---|---|---|---|
| WC05 | 1328978 | 1097377 | 0 | same as the block it serves: [6.01, 2.99] m (v9.15 traced block) | the only block at this reference |
| WC20 | 1327228 | 1311341 | None | same as the block it serves: [6.0, 3.01] m (v9.15 traced block) | record units/WC20 set labels · which of the two traced WC20 blocks (v9.15 component 0 "tag inside it", component 1 "3.0 x 6.0 m") is set 1 and which is set 2 is not recorded - to confirm |
| WC20 | 1328982 | 1327225 | None | same as the block it serves: [6.0, 2.99] m (v9.15 traced block) | record units/WC20 set labels · which of the two traced WC20 blocks (v9.15 component 0 "tag inside it", component 1 "3.0 x 6.0 m") is set 1 and which is set 2 is not recorded - to confirm |
| WC27 | 1328979 | 1119484 | 0 | same as the block it serves: [6.0, 2.98] m (v9.15 traced block) | the only block at this reference |
| WC60 | 1328980 | unit None | None | same as the block it serves; both WC60 blocks trace [6.02, 2.99] and [6.0, 3.01] m (v9.15 components [0, 1]), so the footprint is the same whichever block | tank-to-block pairing not recorded - to confirm |
| WC60 | 1328981 | unit None | None | same as the block it serves; both WC60 blocks trace [6.02, 2.99] and [6.0, 3.01] m (v9.15 components [0, 1]), so the footprint is the same whichever block | tank-to-block pairing not recorded - to confirm |

## Water-barrier runs drawn on the master (white-and-yellow, legend "WATER-FILLED BARRIER")

Pieces = drawn segments (alternating #ffbf00 / #fafafa quads, 2.0 m each as drawn at 1:2000). The schedule's TL2 piece length is not in any source read: size to confirm. Kerb rows (T2, T8, T9, T10) are all-yellow pieces with no white alternation and are low confidence.

| run | candidate ref | confidence | where | pieces drawn | length m | centre (MASTER_LOC frame) |
|---|---|---|---|---|---|---|
| R01 | WB06 | high | GC Hwy, S11-S13 (west part of the one grandstand run) | 65 | 132.2 | [0.32981, 0.4865] |
| R02 | WB06 | high | GC Hwy, S14/S01/S02 behind the precinct fence (east part) | 92 | 291.8 | [0.41628, 0.41547] |
| R03 | WB01 | high | GC Hwy at PB3 / OP62 | 11 | 22.0 | [0.15731, 0.66474] |
| R04 | WB05 | medium | GC Hwy south of WC72, by the light rail station | 11 | 22.0 | [0.12725, 0.70903] |
| R05 | WB16 | medium | Commodore Park, by WC40 / accessible parking | 13 | 29.2 | [0.22067, 0.63229] |
| R06 | WB04 | medium | Breaker St, west edge of Helen Park | 13 | 26.0 | [0.05028, 0.71804] |
| R07 | WB14 | high | MP 4.0 / EEP 6, Turn 4 drivers right | 2 | 4.0 | [0.76142, 0.26213] |
| R08 | WB13 | medium | single pieces along the precinct fence behind S15 (by WC45) | 7 | 50.2 | [0.68199, 0.32707] |
| R09 | WB13 | low | alternating run below S15 by BAR 16 / FOOD (may be part of WB13 or another run) | 10 | 23.4 | [0.65857, 0.34415] |
| R10 | WB17 | low | T8 kerb: row of yellow pieces (no white alternation) | 11 | 13.7 | [0.34465, 0.20621] |
| R11 | WB17 | low | T9 kerb: row of yellow pieces (no white alternation) | 11 | 13.7 | [0.32454, 0.21129] |
| R12 | WB18 | low | T2 kerb: row of yellow pieces (no white alternation) | 11 | 15.5 | [0.6395, 0.31936] |
| R13 | - | unmatched | Breaker St south / by WC71 | 22 | 44.2 | [0.04048, 0.751] |
| R14 | - | unmatched | GC Hwy at Helen Park / G1, light rail side | 55 | 143.4 | [0.07599, 0.7463] |
| R15 | - | unmatched | T10 kerb: row of yellow pieces | 11 | 13.9 | [0.29681, 0.21627] |
| R16 | - | unmatched | single piece near BS03 | 2 | 4.0 | [0.51111, 0.36122] |
| R17 | - | unmatched | single piece on the road edge south of S15 | 1 | 2.0 | [0.68223, 0.35481] |
| R18 | - | unmatched | GC Hwy side-street closure (Brit Ave / Ocean Ave area) | 14 | 26.0 | [0.80688, 0.37109] |
| R19 | - | unmatched | GC Hwy side-street closure (Norfolk Ave area); drawn again in the inset | 11 | 18.0 | [0.91404, 0.38399] |
| R20 | - | unmatched | GC Hwy side-street closure (Pine Ave area); drawn again in the inset | 8 | 16.0 | [0.96413, 0.39243] |
| R21 | - | unmatched | inset only: GC Hwy side-street closure | 8 | 16.0 | [0.79882, 0.8222] |

Schedule against drawing: WB06 154 vs R01+R02 157 (zone 1 on K220/K221 says 154 Coates WFB); WB01 12 vs 11; WB16 13 vs 13; WB04 14 vs 13 (iEDM table read 12); WB05 13 vs 11 (iEDM table puts WB05 at Commodore Park / Gate 2, so R04 may instead be the 12 "ADD TO FMS" barriers at Main Beach Light Rail bus stop); WB14 2 vs 2; WB13 10 vs 7 on the fence (+10 in R09, low; iEDM read 13); WB17 6 vs 11+11 kerb pieces; WB18 2 vs 11 kerb pieces.

Not drawn: WB02 and WB19 (S08 pathway: in and out 21-27 Sep, and again in demob), WB03 (Turn 2, out 19 Oct) and WB20 (Turn 2, demob), WB07 (Admiralty Dr: no run drawn; iEDM quantity read as 0 or blank), WB15 (Turn 11: no run drawn; zone 6 is HVM).

## v9.15 components with no scheduled unit

- WC13 component 2 (toilet): v9.15 component with no scheduled unit of that kind at this reference
- WC57 component 2 (toilet): v9.15 component with no scheduled unit of that kind at this reference
- WC57 component 3 (toilet): v9.15 component with no scheduled unit of that kind at this reference
- WC57 component 4 (toilet): v9.15 component with no scheduled unit of that kind at this reference
- WC57 component 5 (toilet): v9.15 component with no scheduled unit of that kind at this reference
- WC57 component 6 (toilet): v9.15 component with no scheduled unit of that kind at this reference
- WC57: the master draws 7 FWF under the WC57 tag and 2 at WC59; the schedule says WC57 2, WC59 7 (and the record holds 7 Event Portables numbers for WC59). WC59 units 3-7 are listed MISSING_BUT_DRAWN against those symbols.
- WC13: the master draws 3; the schedule says 2.

## Drawn on the master with no reference

- **generator symbol**: orange generator-shaped symbols (5-stroke box + diagonal) on the 2 Oct master with no reference; candidates for GN? (Concert 200 kVA x2), GN25, the spare 100 kVA trailer (T0268) or another party - to confirm by the dark triangle mark and D024 (161944, 161947, 161952, 162084, 170370, 188571, 188675, 188693, 189694)
- **FWF symbols**: WC-BSF and WC18 are not references on the schedule; the others carry no tag (119323, 122593, 122603, 122613, 121709, 119253, 120686, 118060, 119313, 141725)
- **water barrier runs**: white-and-yellow runs drawn on the master that no schedule WB reference was matched to (side-street closures on the GC Hwy, Helen Park/G1, T10 kerb, singles). DATA.barriers: iEDM table rows WB08-WB12 and "ADD TO FMS" (12 at Main Beach Light Rail bus stop) are on no Coates schedule row (R13, R14, R15, R16, R17, R18, R19, R20, R21)

## Left out

- P26 Fridge Lge x1: furniture delivered into a building (not placed outside); the building itself is the shaped item
- P28 Fridge Lge x1: furniture delivered into a building (not placed outside); the building itself is the shaped item
- P34 Pad Chair x2: furniture delivered into a building (not placed outside); the building itself is the shaped item
- T0265 Fridge x4: fridges ("OP42 Fridge"); where they stand (inside or outside) is not said - excluded, to confirm
- T0001 VMS x1: board 1211404 is VMS09 on T0103 by the project manager (8 Oct, v9.13 README); listed once there. The record still lists it on T0001 (vms5).
- T0234: not a placed unit (Passes)
- T0159: VMS "Relocate" row: moves boards already listed, adds none
- T0222: demob removal of a unit already listed (T0021/T0022/T0023/FL01/FL02/T0005)
- T0223: demob removal of a unit already listed (T0021/T0022/T0023/FL01/FL02/T0005)
- T0224: demob removal of a unit already listed (T0021/T0022/T0023/FL01/FL02/T0005)
- T0227: demob removal of a unit already listed (T0021/T0022/T0023/FL01/FL02/T0005)
- T0228: demob removal of a unit already listed (T0021/T0022/T0023/FL01/FL02/T0005)
- T0229: demob removal of a unit already listed (T0021/T0022/T0023/FL01/FL02/T0005)

## How to read this

- One row per unit in inventory.json (`units`), unit_index 1..qty per item at the reference; barriers and trakmats one row per reference with `pieces`.
- TRACED means a v9.15 component of the right kind was assigned in component order; which drawn symbol carries which asset number is not known unless `number_basis` says so.
- Quantities are the peak on the ground from the schedule place/remove rows; a blank quantity counts as one unit per reference.
- Cancelled or deleted references are kept and marked in `ref_state` (P47, P53, WC32, WC66, T0019, T0089).
