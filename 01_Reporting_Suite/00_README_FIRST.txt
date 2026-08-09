==============================================================
 COATES | K2 REPORTING SUITE
 Cement Australia K2 Shutdown 2026 - Gladstone
 Author: Andrew Fisher | POWERED BY SITEIQ
==============================================================

WHAT'S NEW IN THIS PACKAGE (26 Jul 2026)
----------------------------------------
1. COMPANY EMAILS NOW SEND THE ACTIVITY & ACCOUNTABILITY REPORT -
   company position first, then one page per hirer. Subject reads
   "DGH Engineering | Daily On-Hire Report | 26 July 2026", from
   "Coates Tool Store", greeting above, sign-off below.
2. THE DAILY EMAIL PACKS (buttons 17 + 18). Every address comes from
   K2_Daily_Email_Report_Allocation.xlsx - nothing typed into code.
   One folder per company per day with the addressed draft, the
   safety PDF, and the record. Open the .eml, check it, press Send.
   14 checks hold anything doubtful. 203-check prover on button 18.
3. THE LOOK: orange rounded border on every report page (HTML + PDF)
   and baked into every email - snug on the black, no gaps, cannot
   break in any mail client. Email pages captured 3x sharper and
   smaller than before.
4. MY GEAR: front page rebuilt off the A3 poster (cabinets, scan
   panel, OPEN MY GEAR), and a Print A4 button that prints a proper
   branded document on the store laptop - every column labelled,
   sign-off boxes, Coates border on every printed page.
   Full notes: WHATS_NEW_DAILY_EMAIL_PACKS.md and
   WHATS_NEW_COMPLIANCE_UPGRADE.md

RUN THEM IN NUMBER ORDER (updated 26 Jul 2026)
----------------------------------------------
The buttons are numbered - anyone can run the morning by counting.
First: save today's fresh SiteIQ exports into Data_SiteIQ\
(RENTAL_STOCK, ON_HIRE, TRANSACTIONS, SALES_STOCK, STOCKTAKE,
DAILY_SUMMARY), and have Outlook open. Then:

   THE MORNING, IN ORDER
   01_RUN_PREFILL_DAILY.bat      - fill today's Daily Tracking actuals
                                   into the K2 workbook (close Excel first)
   02_RUN_COST_SNAPSHOT.bat      - client cost story + plant dashboard
                                   + the COATES INTERNAL billing forecast
                                   (SiteIQ hire; the last day of a month
                                   invoices into the NEXT month), emails
                                   drafted into Outlook
   03_RUN_COMPANY_REPORT.bat     - pick from the menu: company reports,
                                   exec summary, demob, consumables, daily
   04_RUN_MY_GEAR.bat            - rebuild the My Gear scorecards page
   05_START_GEAR_LOOKUP.bat      - serve the QR page at the window
                                   (leave this one open all day)
   06_SEND_TODAYS_REPORTS.bat    - check your Drafts folder first, then
                                   type YES and the day's reports go out

   WHEN YOU NEED THEM
   07_RUN_PLANT_DASHBOARD.bat    - plant dashboard on its own (02 already
                                   makes it each morning)
   08_RUN_CLEAN_REPORT.bat       - barcode-free v11.5 CLEAN register
   09_RUN_BILLING_RECONCILIATION.bat - billing v SiteIQ invoiced check
   10_RUN_GEAR_UTILISATION.bat   - gas monitor & radio right-size check
   11_RUN_WORKBOOK_HTML.bat      - workbook tabs as pages -> K2_Workbook_Pages\
   12_MAKE_OUTLOOK_DRAFTS.bat    - rebuild ALL of today's Outlook drafts
                                   fresh (reports draft themselves as they
                                   run - this is the do-over button)
   13_ALIGN_EXCEL_DATA.bat       - ONE STORY, BOTH PLACES: backs up the
                                   K2 workbook, refreshes it from THIS
                                   folder (writes the folder path into
                                   the workbook's own SOURCE_PATH
                                   override - kills the SharePoint https
                                   refresh errors). Refresh runs in the
                                   FOREGROUND and every connection is
                                   also refreshed one-by-one - a
                                   connection unticked from Refresh All
                                   can't hide. Then trues up: refresh
                                   stamp, master prices + names FIRST,
                                   day-counts recomputed to today
                                   ((today - on-hire) + 1, the reports'
                                   counting), radio/battery rows,
                                   accountability rebuilt live with
                                   manual notes kept (exposures from
                                   mastered prices), sensitivity. Then
                                   the cell-by-cell parity check prints:
                                   the Excel v the report logic, 58
                                   checks. Queries and layouts never
                                   change; formulas never change except
                                   ONE repaired tile (critical returns
                                   counted radio batteries as critical -
                                   the reports never have; fixed once,
                                   stays a live formula). A refused
                                   write never kills the run - refresh
                                   and save always land, refusals print.
                                   Close the workbook in Excel first.
   14_RUN_STORES_TEAM_PACKS.bat  - JUST the two stores-team packs (the
                                   team report + the consumables watch)
                                   without building everything else
   15_RUN_COMPLIANCE_FLAGS.bat   - flag new gear in the master file so
                                   its blue tag, logbook and return line
                                   show on every report (--dry-run to
                                   preview, --force to redo from rules)
   17_BUILD_DAILY_EMAIL_PACKS.bat - the day's company email packs: one
                                   folder per company, dated, the report
                                   that goes in the body, the PDFs that
                                   go on the paperclip, a ready-addressed
                                   draft and the record. Addressed ONLY
                                   from K2_Daily_Email_Report_Allocation
                                   .xlsx. Nothing sends - you press Send.
   18_CHECK_DAILY_EMAIL_PACKS.bat - proves today's packs without building
                                   anything: reads the routing workbook
                                   for itself, opens every draft the way
                                   Outlook opens it, and feeds four
                                   routing mistakes through on purpose to
                                   be sure they'd be caught
   57_SWITCH_JOB.bat             - which job is this computer running?
                                   K2 or Rio Weipa. Everything follows it
                                   - exports read, reports written, the
                                   customer name on every heading
   58_RUN_ONHIRE_WORKBOOK.bat    - the shutdown on-hire workbook, all
                                   twelve tabs, off today's exports. Your
                                   typed Labour and Cost tabs carry over
                                   untouched
   59_CHECK_EVERY_BUTTON.bat    - presses nothing, changes nothing,
                                   and tells you whether every button
                                   on this computer would work. Run it
                                   after an update or on a new machine

   Two stores-team packs also build with the one button (or by flag):
   Stocktake TEAM report          - the people turning the wheel: counts
     (--stocktake-team)            logged, by whom, day v night shift,
                                   the pace, day-by-day trend, where
                                   we're heading, and a fair split of
                                   what's left per shift. Positive by
                                   design, every figure computed from
                                   the STOCKTAKE export, methods printed
                                   on the page.
   Store Consumables WATCH        - the shelf behind the counter: lines
     (--store-health)              stocked, what's moving, days of cover
                                   at this week's pace, the watch list
                                   (order today / watch), stock-check
                                   coverage with counted-v-system calls
                                   that allow for draws after the check,
                                   and the three-glances watch method.

THE DAILY EMAIL PACKS - where they live, and the one rule
---------------------------------------------------------
   K2 DAILY REPORTING\
     00 MASTER DAILY REPORTS\<date>\    the six site-wide masters
     01 COMPANY REPORTS\<Company>\<date>\
          <Company> - On-Hire Report - <date>.html   goes in the body
          Daily Safety & Compliance Report - <date>.pdf   attached
          Email Draft - <date>.eml     addressed, ready, NOT sent
          Email Record - <date>.txt    who, what, and all the checks
     02 EMAIL CONTROL\                  the day's status board + register
     03 CONTACTS & SETTINGS\            the workbook that did the routing

THE ONE RULE: the company name ties the data, the folder and the
recipient list together. A DGH report can never go out on the Cleanaway
list. Every pack is checked before it is called ready, and if any check
fails it stays held - it is never quietly sent.

Statuses, and only these: Not Generated, Generated, Checked, Draft Ready,
Sent, Failed - Review Required.

Nothing is ever overwritten. A dated folder that already holds a report
is left exactly as it is. Fix the workbook, run again, and a changed
record is written beside the first as (2) - never over the top of it.

ONE HOME - where the suite lives
--------------------------------
The LIVE suite is ONE folder: Desktop\Cement 2026 Correct\01_Reporting_Suite
- the workbook, Data_SiteIQ, Reports history and the master file all live
there. Run every button from there, always.
COMPLETE zips are archive copies - they deliberately do NOT contain the
K2 workbook, so unzipping one into a NEW folder gives you a suite that
says "no K2 workbook found" (by design - it can never overwrite yours).
To update the live suite: use a CODE UPDATE zip (scripts/README/poster
only - no data, no exports, no workbook, no master) and unzip it OVER
the live 01_Reporting_Suite, replacing when asked. Nothing of yours can
be lost that way. Spare unzipped folders: delete them - one home only.

WHERE THE EXCEL SITS (and the folder it refreshes from)
-------------------------------------------------------
The K2 workbook (Cement_Australia_Report_2026_K2_v11_4.xlsm) lives HERE,
in this 01_Reporting_Suite folder, beside the numbered buttons. Its
queries read the six SiteIQ exports from THIS folder - copies sit here
beside it, and 13_ALIGN re-syncs them from Data_SiteIQ\ automatically
every run (newest wins, Data_SiteIQ\ stays the drop folder).

If Excel ever shows "K2 source folder not found": close the workbook and
run 13_ALIGN_EXCEL_DATA.bat - it writes this folder's path into Control
Config B23 for you and refreshes. Doing it by hand instead: copy this
folder's path from File Explorer's address bar into B23 with a trailing
backslash. If the folder is under OneDrive with AutoSave ON, the auto
path breaks - the script's written path fixes that; manually, turn
AutoSave off and reopen.

THE ONE BUTTON - 00_RUN_EVERYTHING.bat
--------------------------------------
Save fresh SiteIQ exports into Data_SiteIQ\ (over the top, same names),
close the K2 workbook, double-click 00_RUN_EVERYTHING.bat. It runs the
whole morning in order: align Excel -> prefill actuals -> billing recon
-> gear utilisation -> cost snapshot -> every company/exec/demob/
consumables/daily/store/stocktake/safety/returns/lookup report -> My
Gear -> CLEAN register -> all Outlook drafts. Everything lands in
Reports\<today>\ (Pages, PDF, Emails, Excel_Backups). Nothing sends
without YES at step 06.

THE MASTER EQUIPMENT FILE - K2_MASTER_EQUIPMENT_PRICING.xlsx
------------------------------------------------------------
ONE tab, keyed on ITEM_NUMBER (the asset number - "use the item number
for everything"), with PLANT_ID where allocated. Columns: storage unit,
item number, plant ID, original description, product variant, NEW
description, replacement cost (AUD), price source, equipment category.
Add or edit a row and the next run updates EVERYTHING - every report
shows the new description and price, and 13_ALIGN trues the same into
the Excel's on-hire tabs. Originals are kept beside the renames so
SiteIQ matching and billing rules can never break. Prices: master by
item number first, the Tooling_Replacement_Costs schedule second, TBC
last - never guessed. The daily Replacement_Costs_GAP_LIST names
whatever still has no price (336 plant-side lines at handover).

EVERY REPORT EMAIL: PAGES PASTED IN THE BODY, PRE-ADDRESSED
-----------------------------------------------------------
Every report run now FINISHES by creating NATIVE Outlook drafts: the
report pages pasted straight into the compose body, in order, right
where you type - addressed from the recipients book, sitting in your
Drafts folder ready to send. (Outlook needs to be installed; the kit
says so plainly if it can't reach it.) Real pages, never sliced: every
section starts a new page, and in the demob pack every company starts
a new page. Nothing rides on the paperclip - the PDF print copy lands
in the day's Reports folder instead.

The .eml files in Reports\<date>\ are the same emails as portable
backup copies. Note: the NEW Outlook app shows .eml files poorly
(images as attachments) - use the drafts in your Drafts folder, or
open .eml files with classic Outlook. Reports drafted once aren't
drafted again on later runs the same day; 12_MAKE_OUTLOOK_DRAFTS.bat
rebuilds the whole day fresh whenever you want.

PERSONAL GEAR EMAILS (03 -> M): everyone with gear on hire AND an email
in the recipients book's People (Email) sheet (Hirer Name exactly as
SiteIQ shows it + Email + Send OK = Yes) gets their OWN one-page gear
scorecard drafted to them - their list oldest first, the bring-it-back
ask, and anything recorded in their name. No email = skipped, never
guessed; nothing sends without the 06 YES. Reports = ALL never joins
someone's personal email - it goes to them alone.

Emails also pre-address themselves from Coates_Report_Recipients.xlsx:
add a person once (Email + Include = Yes; Add As To/CC; Company = ALL
or a company name; Reports = ALL or tags like COMPANY, EXEC, DEMOB,
CONSUMABLES, DAILY, SAFETY, COST, PLANT, STORE, REQUESTS, BILLING) and
every matching report email comes out already addressed to them.
BILLING is the COATES INTERNAL billing forecast: Reports = ALL only
adds @coates.com.au addresses to it - anyone else must be given the
BILLING tag deliberately. A client contact on ALL still gets every
client report and never the internal one.

THE AUTOMATIC SEND-OUT
----------------------
Once the recipients book has real addresses, double-click
06_SEND_TODAYS_REPORTS.bat: it asks you to type YES, then builds native
Outlook emails for everything generated today and SENDS the ones that
have a To address from the book. Anything without an address stays in
your Drafts for review - the kit never guesses an email address, and
nothing sends without that YES.

WHERE EVERYTHING LIVES - THE CLEAN STRUCTURE (24 Jul 2026)
----------------------------------------------------------
  01_Reporting_Suite\
    Data_SiteIQ\        <- SAVE THE FRESH SITEIQ PULLS HERE each morning
                           (RENTAL_STOCK, ON_HIRE, TRANSACTIONS,
                            SALES_STOCK, STOCKTAKE, DAILY_SUMMARY).
                           Saving them in the suite root still works -
                           the kits check both, newest file wins.
    Reports\<date>\     <- one folder per day, organised:
       Emails\           the Outlook .eml drafts, their page images
                          and draft manifests - everything email
       PDF\              the print copies of every report
       Pages\            the reports as framed HTML pages
       DATA_SOURCES.txt   which exports fed the day, and how fresh
       (working registers like the Replacement Costs GAP LIST also
        land at the day root)
    Coates_K2_Charge_Reporter\   the charge register + its records
    Gear_Lookup\                 the QR page served at the window
    _Archive\                    old and superseded files
  The workbook, rates file, Plant_ID_Register.csv, recipients book,
  SDS register and CONSUMABLE_REQUESTS.xlsx stay in the suite root -
  they are registers you maintain, not daily pulls.
  Rerunning a report on the same day refreshes that day's folder -
  nothing scatters around the suite.

==============================================================
 THE COMPANY ON-HIRE REPORT KIT (03_RUN_COMPANY_REPORT.bat)
==============================================================

WHAT THIS DOES
--------------
Builds a branded per-company on-hire report you can print or
email to that company's site rep: items on hire (oldest first -
that's the chase list), aging bands, replacement cost exposure,
and the consumables that company has taken. Company reports show
REPLACEMENT COSTS ONLY - no hire rates or hire spend. Hire
economics (daily value, spend to date, and the radio fleet
charge of $12.81 per handset per day from 17 Jul 2026, on hire or not - batteries and covers excluded)
appear only on the internal all-companies summary produced with
"A" / --all. It reads the SiteIQ exports already in this folder
and NEVER touches the K2 Excel workbook.

SETUP - 3 STEPS
---------------
1. Unzip everything into the Cem2026 folder (the same folder
   that holds RENTAL_STOCK.xlsx, SALES_STOCK.xlsx, ON_HIRE.xlsx,
   the contracted rates file and the replacement cost schedule).
   The script reads from its OWN folder - no input subfolder.
   ON_HIRE.xlsx is the SiteIQ per-person export: its EXTERNAL_ID
   column is the number on each person's ID card - the ONLY
   person identifier the kit ever uses. It feeds the Hirer ID
   column on every report and builds the QR gear lookup page.
2. Make sure Python 3 is installed (python.org, tick
   "Add to PATH" during install) with the openpyxl package
   (pip install openpyxl - one-off, needs internet).
3. Double-click 03_RUN_COMPANY_REPORT.bat.

HOW TO RUN
----------
Double-click 03_RUN_COMPANY_REPORT.bat. It lists every company
with gear on hire and how many items each has. Type the number
for one company, A for all companies (plus a combined ranking
summary), P for the Site Plant report, E for the Executive Summary
(the whole K2 story: forecast v actual, movement, stocktake
coverage, standards), L for the printable Plant Audit List
(idle assets with tick boxes - the yard-walk compliance check
and the mechanic's maintenance window), D for the Gear Return
/ demob push pack (everything still out by company and person -
run it daily from 3-4 days before the shut ends), C for the
consumables report, T for the Cement Store stock & reorder
report (their shelf: on hand, used, low, what to order - built
for the store team), N for the consumable requests log (crew
asks jotted at the counter in CONSUMABLE_REQUESTS.xlsx), K for
the Stocktake Scorecard + Daily Run Sheet (every storage unit
scored on the 3-day sighting cycle for the client, plus the
printable tick-box worklist of today's due items - print it,
walk it, scan the counts into SiteIQ; on-hire gear counts as
sighted at issue, departed gear is never shown, and site plant
belongs to the Plant Audit List), B for
the Daily One-Pager, S for Safety Assurance, R for Returns
Performance, W for the Weekly Roll-Up, U for Plant Right-Size,
F for the Close-Out pack, G to rebuild the Gear Lookup page,
or Q to quit.

GEAR LOOKUP (QR AT THE WINDOW)
------------------------------
G (or --lookup) builds Gear_Lookup\index.html from ON_HIRE.xlsx:
a person scans the window QR poster, types the ID number off
their card (their EXTERNAL_ID), and sees ONLY their own on-hire
list. Each list is encrypted with a key made from that person's
own ID - a wrong number shows nothing. Double-click
05_START_GEAR_LOOKUP.bat to serve it on the site Wi-Fi and print
the QR poster. It is a snapshot of your last refresh - rerun G
after each morning's exports.

The Site Plant report (P) shows plant in use by your register
categories (Misc, Welders, Booms, Forklifts...), who has it and
for whom, then the not-in-use fleet - true utilisation and the
Coates mechanic's preventative maintenance window - and any
plant on hire to Site Plant Equipment (Coates), which is by
site convention sitting available and still being charged: the
potential cost saving, priced per day. Categories are read
(read-only) from the K2 workbook's Plant Equipment register in
this folder.

Command line (for automation):
   python build_company_onhire_report.py --company "BELTEC"
   python build_company_onhire_report.py --all
   python build_company_onhire_report.py --plant
   python build_company_onhire_report.py --exec
   python build_company_onhire_report.py --audit
   python build_company_onhire_report.py --demob

Outputs land in Reports\<today's date>\ next to this script,
date-stamped so runs never overwrite each other:
   Coates_OnHire_Report_<COMPANY>_<date>.pdf   - print / attach
   Coates_OnHire_Report_<COMPANY>_<date>.html  - browser copy
   Coates_OnHire_Report_OUTLOOK_<COMPANY>_<date>.eml

HOW TO EMAIL A REPORT
---------------------
Double-click the .eml file - it opens in Outlook as an unsent
draft with the PDF already attached and the message written.
Add the site rep's address in To and hit Send. The wording asks
them to flag anything they believe has already come back, so we
can put it through the double-check return process same day.

COMPANY NAME CLEANUP
--------------------
Some companies appear in SiteIQ under more than one spelling
(BELTEC / BELTECH, DAWSONS / DAWSONS ENGINEERING...). The
COMPANY_ALIASES table at the top of the .py script merges
them. To add one, open the script in Notepad and copy the
pattern - "WRONG NAME": "RIGHT NAME", - one line per alias.

PDF NOTES
---------
The kit uses WeasyPrint if it's installed, otherwise Microsoft
Edge (already on every Coates Windows laptop). If neither is
available it says so plainly and produces HTML only - open the
HTML in a browser and print to PDF from there.

HONEST LIMITS (also printed on every report)
--------------------------------------------
- Company reports carry replacement costs only. Hire rates and
  spend live on the internal summary; there, items with no
  contracted rate are EXCLUDED from value totals - the kit
  never estimates or fills in $0. Radio handsets are the one exception:
  $12.81 each per day, on hire or not, from 17 Jul 2026 (batteries and covers excluded).
- Spend to date is charged inclusive of the on-hire day.
- Consumables are QUANTITIES ONLY - there is no consumables
  price feed, so no dollar values are shown for them.
- Replacement costs join on the item description; items not in
  the replacement schedule show TBC and are excluded from
  the exposure total.
- Every report carries a data-as-at stamp taken from the
  RENTAL_STOCK file's modified time. The report is a snapshot -
  if the export is stale, the report says so honestly.
- Hirer ID comes from the ON_HIRE export's EXTERNAL_ID, matched
  by exact item barcode first, then by hirer name. No match (or
  two people sharing a name) shows a dash - never a guess. If
  ON_HIRE.xlsx is missing, the column shows dashes and the
  report footer says so.

IF SOMETHING GOES WRONG
-----------------------
The kit fails in plain English - it names the file it looked
for and the folder it looked in. The usual fixes: drop the
missing export into this folder, or close the file if it's
open in Excel, and run again.

Care Deeply - Customer Focused - Be Our Best - One Team -
Competitive Spirit
==============================================================
