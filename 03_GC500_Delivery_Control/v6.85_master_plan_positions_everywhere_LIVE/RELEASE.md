# v6.85 — LIVE 27 Sep 2026, on Andrew's instruction: use the master plan positions for everything, remove pinning where the master has it

Author: Andrew Fisher

Built from v6.84 + `patch_v685.py` + `master_loc.json`. The v6.81 draft fixes are still not in.

## What changed
- **Master positions everywhere.** 139 references take their position from the master plan D001-26003-03: the tag on the unit, or a callout followed along its leader line. That position drives the satellite pins, the drop's live map, Drive / Walk / Earth, the day list and the "where" words.
- **Pin buttons removed** for those references. Pressing pin on one now says it takes its position from the master plan.
- **Area-only references** (23, e.g. water barriers and Helen Park containers) and references the master does not show keep their pin buttons. Their drawer shows the master's area words.
- **Your on-site pins (63 in the record) are not deleted.** They stay in the shared record untouched and are no longer used for master-placed references, so this can be undone by re-uploading v6.84. Three pins with no master position (T0022, T0022/u960634, T0023/u1257261) are still used.
- **WC07:** the master tags it twice. The second tag is used, because Andrew's pin was 3.9 m from it.

## Pins against the master (`pins_vs_master.txt`)
- **Overall:** the average offset is 1.2 m east and 0.2 m south, so there is no bias between the two sources. The individual spread is a median of 8 m.
- **Cause of the spread:** phone GPS (±3–6 m as reported), and some pins taken from one spot for several units. P15 and P16 share an identical fix, as do both P11 units.

## Checks
- **Local:** deep data audit shows no issues; 68 running-sheet days are clean; navigation is clean on desktop and phone; accessibility is clean; every map sheet opens, search works and show-on-map works.
- **Live:** `/v/` equals the build byte for byte; 139 master positions; no page errors on any tab.

## Rollback
Re-upload v6.84. The pins come back in use as they were.
