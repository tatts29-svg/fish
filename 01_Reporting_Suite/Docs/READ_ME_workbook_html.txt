================================================================
 COATES | K2 WORKBOOK -> HTML MIRROR
 Cement Australia K2 Shutdown 2026 - Gladstone
 Author: Andrew Fisher | POWERED BY SITEIQ
================================================================

WHAT THIS IS
------------
Every tab of your K2 workbook, turned into its own clean, dark
Coates web page - all 27 tabs, linked together with a Home hub and
a side menu. Open one, click around, share the folder with the team.

  * index.html         = the Home hub (grouped tiles for all tabs)
  * tab_*.html         = one page per workbook tab
  * a side menu on every page jumps you to any tab or back home
  * the K2 Dashboard page redraws its Forecast vs Actual chart

WHAT EACH PAGE SHOWS
--------------------
Tabs that are clean data tables get a visual layer built straight from
their own numbers: KPI tiles up top (records + key $ totals) and a
chart where it helps - a bar chart of the top items, or a line over
time for the daily tabs. Every figure is labelled with its source
column, so nothing is invented or guessed.

Complex or multi-section tabs (e.g. Shutdown Costing) and the backend
config tabs are shown as clean tables only - no auto-totals - because
summing across stacked sub-tables would be misleading. Honest beats
flashy.

IMPORTANT - YOUR REPORT IS NEVER TOUCHED
----------------------------------------
This only READS the workbook. It does not open, edit or save it, so
your working .xlsm stays exactly as it is. The HTML is just a
point-in-time picture of the last time you SAVED the workbook.

HOW TO RUN IT (daily)
---------------------
1. Keep build_workbook_html.py and 11_RUN_WORKBOOK_HTML.bat in the same
   folder as your workbook (the main kit folder).
2. Save your workbook after your daily refresh (so the latest numbers
   are baked in).
3. Double-click 11_RUN_WORKBOOK_HTML.bat.
4. Open K2_Workbook_Pages\index.html.

That's it. Re-run any time - it just rebuilds the pages.

Only needs Python 3 + openpyxl (the same library your other tools
use). The .bat installs openpyxl automatically if it's missing.

TIES IN WITH YOUR OTHER REPORTS
-------------------------------
When you run this from your kit folder, the Home hub automatically
adds a "Featured live reports" row linking to your Plant Dashboard,
Site Plant Report, Plant Audit and Executive Summary (the ..._LATEST
files in Output_Company_Reports\), so everything lives under one roof.

NOTES
-----
* Values are shown as they were last calculated & saved in Excel
  (dates as 11 Jul 2026, money with $ and thousands separators).
* Wide tabs scroll sideways inside their card.
* Backend/config tabs (Dashboard Data, Control Config/Data, Controls
  & Exceptions) are grouped under "Data & Config" so the menu stays tidy.
* Pages are self-contained (no internet needed) - safe to email the
  whole K2_Workbook_Pages folder or drop it on a shared drive.

================================================================
