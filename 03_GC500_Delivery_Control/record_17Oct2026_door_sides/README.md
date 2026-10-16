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

Still no door side on record, and not guessed: P41, P44, P46, P51, P57, P58, P60, P62, P63 and T0266.

    node doors.cjs            dry run (default)
    node doors.cjs --apply    needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA
