# Record: VMS21's identity and pinned position (Premiair fleet 97T, rego T16922, GPS fix)

Author: Andrew Fisher. Applied 22 Oct 2026 11:08 AEST on the live v11.16 page (`8a19fcce…`), record version 10494 → 10499,
by Andrew Fisher via Claude. Backup of the whole record before: `backup_state_20261022T010811Z.json`. Report:
`report_20261022T010811Z.json`.

Andrew, 22 Oct 2026, by message: "VMS 21 is in location Asset No 97T Rego T16922 PremiAir", then "gps location is
-27.995097971010587, 153.42930565620875".

| What | Before | After |
|---|---|---|
| VMS register, VMS21 (contract 9961265 line 28, Premiair Senior board SUB-2631) | no document: fleet and rego "added later" | fleet **97T**, rego **T16922**; company stays as the contract names it (Premiair) |
| VMS plan position 21 (Staghorn Ave / Surfers Paradise Blvd, eastbound) | planned position only, -27.9952, 153.4293 | pinned at **-27.995098, 153.429306** (six decimals, the page's own rounding), "GPS location sent by Andrew Fisher on site, 22 Oct 2026" — about 11 m north of the planned spot |

In place and Complete (set 08:08 today) are untouched. Everything went through the page's own functions: the register
form's one writer (`vms913Save`, fleet then rego) and the VMS plan's `setPosition`, via `vms21.cjs` (the record runner,
unchanged from `record_22Oct2026_barriers_vms/barriers.cjs`; the ops already existed). Dry run first with every write
aborted; then `--apply` with the public page's SHA-256 checked, exactly the five planned documents allowed through once
each (`vmsboard/VMS21`, `loads/vms1024/21` and their stamps and by documents), every other document verified unchanged
in value, every op verified on the service. The delivery the board came in on is not named, so that field is left alone.

Today after: VMS boards 24 of 24 (unchanged). Positions: 15 of the 24 boards now carry a location pinned or confirmed on
site (VMS05, 07, 11, 13–22, 24); the other nine (VMS01–04, 06, 08, 09, 10, 12, 23 and the session positions 02a/03a) sit
on the plan's position, placed to the metre against the page's landmarks.
