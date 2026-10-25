# GC500 asset and off-hire register (26 Oct 2026)

Author: Andrew Fisher · 26 Oct 2026

Andrew, 26 Oct 2026: "I need full detailed list grouped. All assets. Map location. Description off hire date and time.
Buildings will have more info and in that will include assets inside. Group these too please. Include subhire. As things go
I'll let you know and update it to make it better."

**`GC500_Asset_Offhire_Register_26Oct2026.xlsx`**, from the live site record (version 10993, read 07:46 AEST on page v12.28; the same data as the first read on v12.27):

| Sheet | What it holds |
|---|---|
| Summary | Counts by group, off-hire by day (demob plan) with how firm each day is, what the columns mean, gaps on the record |
| All assets | Every reference grouped by type, every unit under it, and under each building what is inside it. Folds with the 1 · 2 · 3 outline buttons |
| Buildings | The 52 buildings with more detail: building asset no, contract line, levelled, steps, fire extinguisher, count of things inside. Contents fold under each building |
| Subhire | By supplier: Event Portables (203 units, 55 references, on Andrew's pins), Premiair Hire (9 VMS boards), United Rentals / Royal Wolf (1 refrigerated container), Advanced Temporary Fencing (167 dockets and week rows, 25 collections) |
| Flat list | One row per unit and per item inside a building, for filtering and sorting (for example by off-hire date) |
| Contract lines | The 311 rental contract lines on the record, with expected off-hire date and time, actual off-rent date and the reference each matches |

**Totals:** 184 references, 798 units (210 subhire), 158 items inside 49 buildings, 24 VMS boards.

**Off-hire columns.**
- **Off-hire (demob plan)** is the site demob plan's day. Its source says how firm the day is:
  - Confirmed: typed.
  - Plan: a schedule removal row.
  - Contract: the rental off-hire date.
  - Proposed: the demob rule, not yet confirmed.
- **Contract off-hire date / time** is the matching rental contract line: the actual off-rent date once there is one, else the expected date and the time where the contract has one.
- **Status on site** comes from the page's left-site record: still to leave until a departure is recorded with its date and time.

**Map location.**
- Each row has the location wording, the meet-point area, the plan section, latitude and longitude, a Google Maps link and the pin basis.
- Pin basis is one of: master plan position, phone pin, Andrew's pin, placed on the map, from the description, or report point only (no drop-off set).
- VMS boards use their board position on the VMS register.

**Blank means the record does not say.** Nothing is filled in by guess. Record notes are shown as written, without agent attributions or machine timestamps. Gaps today:
- 27 references have a report point only (no drop-off position) and 2 have no position.
- 2 references are not in the demob plan.
- 114 off-hire days are proposed by the demob rule, not yet confirmed.
- 13 units have no unit number.
- 188 contract lines have no off-hire time.
- 3 VMS boards are on the board register but on no reference.

```
node register_26Oct2026_assets_offhire/read_assets.cjs assets_live.json     # read-only, GET only (from 03_GC500_Delivery_Control/)
python3 -I register_26Oct2026_assets_offhire/make_register.py assets_live.json GC500_Asset_Offhire_Register_26Oct2026.xlsx
```

The record snapshot (`assets_live.json`) stays private, outside the repository. The reader opens the live page through the harness, which aborts any write: 0 page errors, 0 writes.

Next: Andrew's changes as demob goes, one version at a time, rebuilt from the live record each time.
