# The VMS boards of 16 Oct 2026 — PREPARED, dry run passed, not applied

Author: Andrew Fisher. Andrew, 16 Oct 2026 (rental extract rows): "VMS for today are" lines 15 and 16 of contract
9961265, VMS11 (SUB-17093, Premiair) and VMS12 (1211646, Junior); "Ones come in today for Monday are" lines 32, 34, 35,
37 and 39, VMS13 1191957 Senior, VMS14 1201864 Junior, VMS15 1211348 Senior, VMS16 1211376 Senior, VMS17 1211364 Senior.

The page already holds those seven contract lines (register type VMS, booked 16 Oct for VMS11–12 and 19 Oct for
VMS13–17, delivery numbers 26129008, 26129024, 26134263 and 26134314) but none of them matched a register line, because
the schedule's VMS references carry no unit identities yet: T0128 "VMS × 2" is the 16 Oct Build-week row, T0158 "VMS × 9"
the 19 Oct Event-week row.

## The regos, as Andrew read them off the boards (16 Oct, 10:30 AEST)

| Board | Asset / fleet | Rego | Contract line |
|---|---|---|---|
| VMS11 | Premiair fleet **467T** (sub-hire line SUB-17093) | TE97G | 15 |
| VMS12 | 1211646 Junior | TF59LR | 16 |
| VMS13 | 1191957 Senior — Andrew wrote **1191657**; the contract line reads 1191957, one digit apart, to be checked on the plate | EN3803 | 32 |
| VMS14 | 1201864 Junior | TD98VJ | 34 |
| VMS15 | 1211348 Senior | ER9217 | 35 |
| VMS16 | 1211376 Senior | ES3211 | 37 |
| VMS17 | 1211364 Senior | ER9410 | 39 |

The rego goes into each unit's note and the reference's delivery note; the sub-hired board is recorded under its
Premiair fleet number 467T, owner `prem-air-hire`, not under the sub-hire line number.

## What goes on the record, through the page's own controls

| Reference | Boards | Owner | What the runner writes |
|---|---|---|---|
| T0128 (plan 16 Oct, asks 2) | VMS11 SUB-17093, VMS12 1211646 | Premiair sub-hire; Coates | unit identity per board (`unit925Save`, the drawer's save), supplied 2 of 2, delivery note, light **on site** (`setLight`); the date is the plan day, so the page keeps no override date (`setDate` on the plan day means "on plan") |
| T0158 (plan 19 Oct, asks 9) | VMS13 1191957, VMS14 1201864, VMS15 1211348, VMS16 1211376, VMS17 1211364 | Coates | unit identity per board, supplied 5 of 9 (partial), delivery note "Came in 16 Oct 2026 for Monday 19 Oct …"; no date, light unchanged |

Nothing is ticked: no install tick, no complete tick. Those are Andrew's ("If I have unticked it don't go ticking it
again"), and the boards go to their positions Monday. The owner on VMS11 is `prem-air-hire` (the page's own owner key for
Premiair), so the sub-hired board is never counted as Coates fleet.

## Runner

`vms_arrived.cjs`, built from the Event Portables arrival runner (`record_15Oct2026_wc30_event_portables/ep_arrived.cjs`,
partial mode): dry run on the live page with every write aborted, `--apply` with `GC500_EDIT_TOKEN` and
`GC500_EXPECTED_PAGE_SHA`, backup of the whole record first, held sender, a write gate that allows exactly the planned
PUTs once each, settle, read back, verify, `report_<UTC>.json`. The key is never printed, logged or stored. Spec:
`vms_spec.json`.

Dry run on the live page (record 6699, page `d72e7f6198111f51…`): the stage produced exactly the thirty-three documents
expected (two delivery records, two supplied records, seven unit records, and their stamps and by), the page tried
thirty-three writes and the harness aborted every one, no page errors — DRY RUN PASSED.

## Not applied yet

The apply writes the live record. This session's permission gate refused record writes on 16 Oct (the 36592 swap in
`record_16Oct2026_hire_agreements_36601_36616/` was refused twice), so this one waits for Andrew: either run

```
GC500_EXPECTED_PAGE_SHA=<sha256 of the public page> node vms_arrived.cjs --apply
```

with the edit key in the environment, or type the boards in by hand on the Equipment tab (T0128 and T0158 drawers: add
each board's number and owner, the supplied count, the note; T0128's light to on site).
