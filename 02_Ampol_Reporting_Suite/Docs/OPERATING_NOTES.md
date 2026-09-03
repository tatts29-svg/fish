# Ampol tool store - operating facts the reports rely on

Source: Andrew Fisher, 03 Sep 2026. Change this file and the CONFIG lines it
names when the store changes; the reports print these facts as rules.

## Shifts and opening
- Two shifts: 04:00 to 12:30 and 09:00 to 17:30.
- The store opens for business at 07:00.
- Before opening, the first shift bumps the gas monitors, scans the
  previous day's monitors out of the return box (04:00 to 05:30) and
  scans monitors to make up the pre-made packs.
- In the reports: `txn_insights.SHIFTS` (rhythm pages, exec and radio);
  `gasmon_engine.RULES["return_box_scan_until"]` = 05:30 - a return
  scanned from the box by then counts as returned on the day it went out
  (disclosed on the gas data page, counted as "via the return box").

## Sighting standard
- Gas monitors, radios, radio batteries, Milwaukee tools and Milwaukee
  batteries are sighted every 2 days. Everything else follows the 30-day
  SOP cycle.
- In the reports: `build_stocktake_compliance_tool.TIERS` (gas 2, radio 2,
  milwaukee 2, general 30). Was 7 / 7 / 14 before 03 Sep 2026.

## The after-hours booking account
- Draws outside opening hours are booked in SiteIQ to one account named
  "AFTER HOURS HIRE - GAS MONITORS & RADIO BATT.". It is an account, not
  a person, and its name describes the account, not the gear on the row -
  a gas monitor booked to it is still a gas monitor.
- In the reports: `ampol_names.hirer_label` prints it as "After Hours
  Hire account" wherever a hirer is named (gas, radio, stocktake
  worklist); the gas data page traces the label back to the SiteIQ name.
  Matching and counting always use the raw name.

## The double scan
- Issuing and returning follow CIS-PST-002 and CIS-PST-003 (Docs/SOP):
  scan, look, scan, look on every item; nothing leaves or returns
  unscanned. The scan itself leaves no trace in the exports; the reports
  measure its outcomes (missed returns, short hires, bin-then-shelf
  sightings) and name who scanned from the STOCKTAKE export.
