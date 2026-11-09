# The client copy - companies left out on request (v2.0, 06 Nov 2026)

Source: client feedback, 06 Nov 2026 - "an option to remove companies out of
reports if needed, as well as an Excel format of each report".

## What you do
1. Open `Data\Editable\REPORT_OPTIONS.txt` in Notepad.
2. One `hide_company:` line per company, spelt as the reports show it
   (the display name - `Wood`, `Contract Resources`, `Universal Cranes`).
   The match is made on the suite's display rule, so the raw SiteIQ
   spellings of that customer all go with it.
3. `client_copy: yes`. Save. Press the button as usual.

## What you get
- The full internal set, exactly as before.
- A second set, every file with ` - Client` before its extension:
  `Coates_Ampol_Gas_Monitors_06Nov2026 - Client.pdf`, `.xlsx`,
  `_OUTLOOK.eml`, `_PositionCard.png`, `.html`.
- In the client set the hidden companies are removed **before anything is
  counted**: their rows are dropped from RENTAL_STOCK and TRANSACTIONS as
  they are read, so every total, chart, league table and trend on every
  page is the position without them. Nothing is blanked out afterwards.
- The data page (and the Cover of the workbook) carries one line: that
  companies were left out of this copy at the client's request. The
  company names are not printed.

## What does not change
- The movement scoreboard (`History\report_history.json`), the daily
  position page and button 13's truth table read the internal set only.
  A client-view build never writes the scoreboard.
- `hide_in_internal: yes` makes the internal set leave them out as well.
  Use it only if that is really the intent - it changes the figures the
  scoreboard records.

## How it is wired
- `ampol_options.py` reads the file; `is_hidden(company)` is asked by
  every loader (`gasmon_engine`, `txn_insights`, `pull_diff`, the radio,
  tooling, stocktake, calibration and rigging loaders).
- `client_pass.py <script> [args]` runs the script once as normal and
  once more with `AMPOL_CLIENT_VIEW=1` when the options ask for a client
  copy. Every numbered button calls it.
- `ampol_names.report_stem()` adds ` - Client` to every file name in the
  client view; `ampol_options.disclosure()` is the line on the data page.
