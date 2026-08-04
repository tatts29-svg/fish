@echo off
rem =====================================================================
rem  COATES K2 - RUN EVERYTHING (the one button)
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  The whole morning in one press. Save fresh SiteIQ exports into
rem  Data_SiteIQ\ first (over the top, same names), close the K2
rem  workbook in Excel, then double-click this. It runs, in order:
rem
rem    0. COMPLIANCE      flag any new gear in the master so its blue tag,
rem                       logbook and return line show on every report
rem    1. ALIGN EXCEL     backup, refresh from this folder, true up the
rem                       stale cells, parity-check Excel v reports
rem    2. PREFILL         today's actuals into Daily Tracking
rem    3. BILLING RECON   our ledger v SiteIQ invoiced, into the workbook
rem    4. GEAR UTILISATION radio + gas right-sizing into the workbook
rem    5. COST SNAPSHOT   the flagship pack (+ internal billing forecast)
rem    6. COMPANY KIT     every company + exec + demob + consumables +
rem                       daily brief + store + stocktake + safety +
rem                       returns + gear lookup + ACTIVITY &
rem                       ACCOUNTABILITY (company + per-hirer pages)
rem    7. MY GEAR         personal scorecard page + lookup refresh
rem    8. CLEAN REGISTER  the barcode-free v11.5 CLEAN workbook
rem    9. OUTLOOK DRAFTS  every report email as a native draft
rem   10. EMAIL PACKS     the day's company folders, drafts and record,
rem                       addressed from the routing workbook, then
rem                       every pack proved before you send it
rem
rem  Everything lands in Reports\<today>\ (Pages, PDF, Emails,
rem  Excel_Backups). Nothing sends without YES at step 06.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

echo ===============================================================
echo  COATES K2 - RUN EVERYTHING - %date% %time%
echo ===============================================================
echo.
echo [0/10] COMPLIANCE FLAGS (new gear only - leaves your edits alone)
%PYCMD% SETUP_COMPLIANCE_FLAGS.py
echo.
echo [1/12] ALIGN EXCEL DATA
%PYCMD% _align_prep.py
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ALIGN_EXCEL_DATA.ps1"
%PYCMD% verify_excel_alignment.py
echo.
echo [2/12] PREFILL DAILY TRACKING
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0PREFILL_DAILY_TRACKING.ps1"
echo.
echo [3/12] BILLING RECONCILIATION
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0REFRESH_BILLING_RECONCILIATION.ps1"
echo.
echo [4/12] GEAR UTILISATION (radio + gas right-sizing)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0REFRESH_GEAR_UTILISATION.ps1"
echo.
echo [5/12] COST TRACKING SNAPSHOT
%PYCMD% build_cost_snapshot.py
echo.
echo [6/12] COMPANY KIT - every report
%PYCMD% build_company_onhire_report.py --all --exec --demob --consumables --daily --store --requests --stocktake --stocktake-team --store-health --safety --returns --lookup --activity --hitlist --plant
echo.
echo [7/12] MY GEAR
%PYCMD% BUILD_MY_GEAR.py
echo.
echo [8/12] CLEAN REGISTER
%PYCMD% build_clean_report.py
echo.
echo [9/12] OUTLOOK DRAFTS (rebuild all of today's)
if exist "%~dp0NO_OUTLOOK.txt" (
    echo   SKIPPED - Outlook drafts are switched off on this machine.
    echo   The .eml files are in Reports\(today^)\Emails - open and send.
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAKE_OUTLOOK_DRAFTS.ps1"
)
echo.
echo [10/12] DAILY EMAIL PACKS (company folders, drafts, record)
%PYCMD% BUILD_DAILY_EMAIL_PACKS.py
echo.
echo [11/12] YOUR OWN REPORTS - every idea you saved
%PYCMD% report_designer.py --all
echo.
echo [12/12] THE PRINT HUB - one page listing everything just built
%PYCMD% build_print_hub.py
echo.
%PYCMD% TEST_DAILY_PACKS.py
echo.
echo ===============================================================
echo  DONE. Everything is filed in today^'s Reports folder:
echo  Reports\(today's date)\ - Pages, PDF, Emails, Excel_Backups.
echo  Drafts are sitting in Outlook.
echo.
echo  The day's email packs are in:
echo  K2 DAILY REPORTING\01 COMPANY REPORTS\(company)\(today)
echo  Status board: K2 DAILY REPORTING\02 EMAIL CONTROL
echo  Nothing sends without YES at step 06_SEND_TODAYS_REPORTS.
echo ===============================================================
pause
