AMPOL REPORTING SUITE - COMPLETE COPY FOR ANOTHER LAPTOP v2.0 (06Nov2026)
Author: Andrew Fisher | POWERED BY SITEIQ

Everything the suite needs is in here: every button and script, docs,
fonts, and the data already in place -
  Data\SiteIQ\     RENTAL_STOCK, TRANSACTIONS, STOCKTAKE as pulled on
                   03 Sep 2026, and the 02 Sep copies in previous  Data\Editable\   Ampol_Master.xlsx, Ampol_Calibration_Register.xlsx,
                   Rigging Register.xlsx, store_layout.template.json

Setting it up (five minutes):
  1. Unzip so you get a folder called 02_Ampol_Reporting_Suite (for
     example C:\Coates\02_Ampol_Reporting_Suite). Not under OneDrive
     unless the folder is pinned "Always keep on this device".
  2. Windows 10 or 11 with Python 3.9 or newer (3.12 recommended) and
     two libraries, once per laptop, no admin rights needed:
         py -m pip install --user openpyxl pillow
     Microsoft Edge prints the PDFs (it comes with Windows). Classic
     Outlook makes the drafts; without it, double-click the .eml files.
     Keep the _lib folder - it carries the library the covers need.
  3. Double-click 10_CHECK_MY_SETUP - it clears Read-only, checks Python
     and every file, and says what is missing.
  4. Double-click 00_RUN_EVERYTHING. Reports land in Reports\(today).
  5. Each morning: 12_PULL_SITEIQ_EXPORTS with fresh SiteIQ pulls in
     Downloads, then 00.

Not in this zip, on purpose: Reports\ (rebuilt in minutes) and History(the movement scoreboard is per machine - the day-on-day arrows appear
on this laptop after its second morning). START_HERE.txt is the manual.

New in v2.0 (06 Nov 2026): one look across every report (the Rio / MMG
pack page), an Excel twin beside every PDF, the client copy switched on
in Data\Editable\REPORT_OPTIONS.txt, and the non-return trend pages -
gas monitors first. SUITE_VERSION.txt has the detail; START_HERE.txt
has the two-minute version under NEW IN v2.0.
