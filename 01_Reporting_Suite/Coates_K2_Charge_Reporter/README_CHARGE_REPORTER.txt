============================================================
 COATES | K2 CHARGE REPORTER
 Cement Australia K2 Shutdown 2026 - Gladstone
 Author: Andrew Fisher - Shutdown Manager, QLD & NT
 POWERED BY SITEIQ
============================================================

WHAT THIS IS
------------
One local tool to log a chargeable shutdown event - Damage,
Consumables sold to the client, Fuel, or Transport - fill a
short form, submit, and get:

  * a professional Coates PDF record with the story behind it
  * a row in CHARGE_REGISTER.xlsx (a sheet per type)
  * the charge dropped into the right Costing line (Costing Feed)
  * an unsent Outlook draft to check and send

Everything runs on your own computer (127.0.0.1). Nothing is
uploaded and no internet is needed once Python + openpyxl are in.

This supersedes the single Damage Reporter - Damage is now just
one of the four types it handles.

HOW TO RUN IT
-------------
1. Keep the whole folder together (desktop, OneDrive, USB - all fine).
2. Double-click START_CHARGE_REPORTER.bat.
3. The browser opens the form. Click the type at the top
   (Damage / Consumables / Fuel / Transport), fill in the detail,
   attach photos or a docket if you have them, and submit.
4. Links appear for the record, the PDF, the Outlook draft and the register.
5. Close the black window when finished.

Mac / Linux:  python3 charge_reporter.py

THE FOUR TYPES AND WHERE THEY GO IN THE COSTING
-----------------------------------------------
  Type              Cost line (Costing Feed)   Amount that flows
  ----------------  -------------------------  --------------------------
  Damage/Breakdown  Damage Recovery            Approved recoverable cost
  Consumables sold  Consumables Sales          Total charge
  Fuel              Fuel                        Total charge
  Transport         Transport                   Total charge

"Consumables" here means consumables SOLD / charged to the client -
not the stock you look after for them.

HOW IT REACHES THE K2 COSTING (WORKBOOK UNTOUCHED)
--------------------------------------------------
Every submission also writes a line to the "Costing Feed" sheet in
CHARGE_REGISTER.xlsx: Date, Charge ID, Category, Cost Line, Company,
Description, Amount, Status, Reference, PDF. That sheet is the bridge
to your K2 report - it rolls up by date and cost line into Daily
Tracking (Damage Recovery, Transport, and the new Fuel / Consumables
Sales lines). Your main K2 workbook is never edited by this tool, so
nothing can break the query/refresh in it.

Only charges at status Approved or Invoiced should be treated as firm
in the costing; Estimate / Quote / For approval are provisional.

A FEW GROUND RULES
------------------
- Damage keeps its "request for direction" advice and the discipline
  that only an APPROVED recoverable cost flows to costing. Exposure and
  repair quotes are reference figures, not a charge.
- Fuel, Consumables and Transport are direct charges - enter the total,
  set the status, and it flows once Approved / Invoiced.
- One record per event. Never guess - leave a field blank if unknown.
- Any injury or safety concern runs through the safety process separately.

OPTIONAL LOOKUP FILES (same as before)
--------------------------------------
Drop these in this folder and the Damage form offers known details as
you type an asset number - all optional:
  RENTAL_STOCK.xlsx            on-hire items, hirer, status
  PLANT_ID_REGISTER.xlsx       plant ID cross-reference

IF SOMETHING GOES WRONG
-----------------------
"Python was not found"   Install Python 3, tick "Add to PATH", retry.
No PDF produced          Edge/Chrome not found. The HTML record is still
                         complete - open it and print to PDF from the browser.
Register open in Excel   Close CHARGE_REGISTER.xlsx before submitting.
Port already in use      Another copy is running. Close it, or run:
                         py charge_reporter.py --port 8769

Back up this folder like any other site record. The register is the
source of truth for every charge.
============================================================
