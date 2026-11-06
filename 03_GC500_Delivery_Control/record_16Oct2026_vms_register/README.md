# VMS board register filled — plates, delivery references, VMS11 fleet number, 16 Oct 2026 — APPLIED, VERIFIED

Author: Andrew Fisher. Andrew, 16 Oct 2026, with the contract rows (VMS13 1191957, VMS14 1201864, VMS15 1211348, VMS16
1211376, VMS17 1211364): "ensure we update the VMS boards that came in are matched to the correct VMS number" — and the
plates he gave earlier the same day.

The units were already on T0128 and T0158 (`record_16Oct2026_vms_boards/`), but the VMS boards tab and the Equipment
tab's board register read the v9.13 register (`S.vmsboard`), which held only the contract's fleet numbers — no plates,
no delivery reference, and no fleet number for the Premiair board. Saved through the register's own save
(`vms913Save`, the form's save), checking each Coates board's contract fleet number first:

| Board | Whose | Fleet / asset no. | Plate | Came in on |
|---|---|---|---|---|
| VMS11 | Premiair | 467T | TE97G | T0128 |
| VMS12 | Coates | 1211646 | TF59LR | T0128 |
| VMS13 | Coates | 1191957 | EN3803 | T0158 |
| VMS14 | Coates | 1201864 | TD98VJ | T0158 |
| VMS15 | Coates | 1211348 | ER9217 | T0158 |
| VMS16 | Coates | 1211376 | ES3211 | T0158 |
| VMS17 | Coates | 1211364 | ER9410 | T0158 |

Record 7312 → 7333, verified, other documents unchanged; `report_20261016T020932Z.json`, backup beside it. Runner
`vms_register.cjs`, spec `vms_spec.json`.
