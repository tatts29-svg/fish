# v6.89 — triple check of every master position, with corrections (LIVE)

Author: Andrew Fisher
Live: 27 Sep 2026, 07:58 AEST. Asked for by Andrew: "Make live. Have we found them all. Please double check and triple check this 100% accurate".

## The three checks

| Check | What it tests | Result |
|---|---|---|
| 1. Master words | Raw PDF text on D001 rev 03 at each stored point. Also the stored GPS against the stored sheet point. | All 112 tag positions have their own tag within 10 m. GPS matches the sheet point to 0.15 m. All 42 gates and entry points sit on their G/E.P words. |
| 2. Each unit's own sheet | D022 buildings, D023 toilets, D024 gensets. K zone pages lined up against the master's linework. | 118 units cross-checked, median 4 m apart. All 11 zone pages overlay the master linework at a median of 0.03–0.4 pt (about 0.3 m). |
| 3. Andrew's on-site pins | 60 pins on 33 references | Median 8 m, worst 18 m |

## Corrected (live in v6.89)

- **WC69** had the wrong one of its two master tags (about 80 m out). D023 and zone page K228 both put it at the other tag. It is now on that tag, with new pictures.
- **T0243 "Toilet Block 6m · WC-TV"** is the WCTV toilet on D023. It is now a unit on the master, beside the master's WC block near TV Overflow.
- **Big screens** now sit on the BSxx tag printed on each screen on the master. D024's arrows had stopped in the road, 10–20 m off.
  - BS07 has no tag on any sheet, so it stays at D024's arrow, next to the HINO box.
- **"Drawn, not on our schedule"** now covers everything drawn with no schedule row: WC18, WC-BSF, P24, P50, P61, CHL, P68.
- **"Drawings differ" notes.** Where a unit's older sheet (rev 02) disagrees with the newer master (rev 03), the master is used and the drawer says so, without folding it away:
  - WC33: about 45 m
  - WC20: about 31 m
  - P27/P29: about 20 m
  - P56: about 16 m

## For Andrew to decide (not changed)

- **LTC01–LTC14, the "circuit light towers".** No schedule row names them. They were made from blue fans on D024.
  - Each fan's number (01–14, with no 13) sits 1–11 m from the big screen with the same number (BS01–BS14, also with no 13).
  - The D024 legend has no symbol for the fans.
  - So the fans look like the screens' viewing areas, not light towers.
  - They carry no dollars but add 13 to the light-tower counts. Remove them? Needs Andrew's yes.
- **P27 and P29 are cancelled on the register.** They show on the master with the cancelled mark.
- **GN25:** D024's side box reads "025 SEAWAY CARPARK", so it is off the master.
- **Generator 028:** D024 keys it to "BSF STORAGE YARD - MOLENDINAR". No row on our schedule carries it.
- **Gensets GN01–GN24:** D024's arrow tips, within about 10 m of the generator symbol.

## Still not placeable (no drawing places them)

| Reference | Why |
|---|---|
| WC10, WC66, WC85, WC100 | On no sheet |
| WB01, WB05, WB06 | Not named on the zone pages |
| LT01–06, T0002, NVLT | Molendinar yard (off site) |
| T0003/T0004/FL01/FL02 | Phillip Park |
| T0021, T0022, T0023 | No place given (Andrew has pinned T0022 and T0023 on site) |
| T0089, T0162, T0176, T0268, GN? | No place given |
| VMS rows T0001/T0103/T0128/T0158/T0159/T0169/T0170 | The 19 D025 boards are on the map, but the schedule doesn't say which row is which board |

## Build and checks

Build chain: `v684 + 685 (master_loc_689) + 686 (new_media_689, manifest 459) + 681 + 687 + 688 (master_extra) + 689`.

Local tests, all pass:
- `deep_data680`: no issues
- `fix_test681`
- `map_test_master`
- `search_test`
- `rs_test`
- `t687`, `t689`, `t689f`
- `nav_test`
- `axe_slow`: none

Live checks (GET only):
- The live page is identical to the build, byte for byte.
- Labour charged $12,809.50.
- Hours 2,003.5 worked, 1,909 paid.
- No errors.
