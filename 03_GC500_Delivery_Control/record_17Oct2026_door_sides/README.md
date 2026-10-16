# Door sides: P06, P08, P09, P38, P39 and P42 to driver

Author: Andrew Fisher · 17 Oct 2026, 06:53 AEST · record 9562 → 9568, VERIFIED

Andrew, 17 Oct 2026, in chat, as typed: "Po6 door to driver  p08 door to driver p09 door to driver  p38 door to driver
p39 door to driver p42 door to driver".

None of these six had a door side recorded. Each has one unit, and each unit now carries driver side through the
page's own door-side control (`loading872Set`):

| Building | Unit | Door side |
|---|---|---|
| P06 | 1097453 | driver |
| P08 | 421138 | driver |
| P09 | 1268824 | driver |
| P38 | 1327218 | driver |
| P39 | 1327216 | driver |
| P42 | 1327221 | driver |

- Dry run first, read-only: it staged these 6 documents and nothing else.
- Apply: whole-record backup `backup_state_20261016T205341Z.json`; public page sha `0cfe02f8…` checked; 6 PUTs, all 200.
- Fresh read-back: every side holds, and every other document is unchanged in value. Report:
  `report_20261016T205341Z.json`.

## P41 to driver · 06:54 AEST · record 9568 → 9569, VERIFIED

Andrew, 17 Oct 2026: "P41 door ro driver" (door to driver). P41 unit 1189412 → driver (`doors_p41_spec.json`;
backup `backup_state_20261016T205447Z.json`; 1 PUT 200; report `report_20261016T205447Z.json`).

## P44 to passenger · 06:57 AEST · record 9569 → 9570, VERIFIED

Andrew, 17 Oct 2026: "P44 door to passenger". P44 unit 198481 → passenger (`doors_p44_spec.json`; backup
`backup_state_20261016T205655Z.json`; 1 PUT 200; report `report_20261016T205655Z.json`).

## P63 to driver, P62 and P60 to passenger · 07:02 AEST · record 9570 → 9573, VERIFIED

Andrew, 17 Oct 2026: "P63 door to driver  p62 door to passenger p60 door to passenger". P63 unit 960719 → driver,
P62 unit 1189409 → passenger, P60 unit 1015699 → passenger (`doors_p63_p62_p60_spec.json`; backup
`backup_state_20261016T210156Z.json`; 3 PUTs 200; report `report_20261016T210156Z.json`).

## P57 to passenger · 07:02 AEST · record 9573 → 9574, VERIFIED

Andrew, 17 Oct 2026: "P57 is door to passenger". P57 unit 1268888 → passenger (`doors_p57_spec.json`; backup
`backup_state_20261016T210243Z.json`; 1 PUT 200; report `report_20261016T210243Z.json`).

## P46 to driver · 07:04 AEST · record 9574 → 9575, VERIFIED

Andrew, 17 Oct 2026: "P46 door to driver". P46 unit 1327215 → driver (`doors_p46_spec.json`; backup
`backup_state_20261016T210433Z.json`; 1 PUT 200; report `report_20261016T210433Z.json`).

## P51 to driver · 07:05 AEST · record 9575 → 9576, VERIFIED

Andrew, 17 Oct 2026: "P51 door to driver". P51 unit 1322579 → driver (`doors_p51_spec.json`; backup
`backup_state_20261016T210524Z.json`; 1 PUT 200; report `report_20261016T210524Z.json`).

## T0266 not applicable · 07:06 AEST · record 9576 → 9577, VERIFIED

Andrew, 17 Oct 2026: "T0266 can be what ever". The side does not matter for the fridge container, so it is recorded as
not applicable, as T0258's container is. T0266 has no unit number; its one row is the item "6.0m Refrigerator Cont"
(`doors_t0266_spec.json`; the runner now also takes an `item:` row id for a building with no number; backup
`backup_state_20261016T210626Z.json`; 1 PUT 200; report `report_20261016T210626Z.json`).

Still no door side on record, and not guessed: P58.

    node doors.cjs            dry run (default)
    node doors.cjs --apply    needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA
