@echo off
rem ==========================================================
rem  COATES | RUN EMAILS ONLY
rem  The whole company kit, but it produces ONLY the emails.
rem
rem  No Pages\ HTML, no print PDFs, no working files left
rem  behind - just the .eml drafts and the Outlook drafts,
rem  ready to read and send.
rem
rem  Use this when you only want to get the day's emails out.
rem  Use 00_RUN_EVERYTHING.bat when you also want the PDFs
rem  and pages on file.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" build_company_onhire_report.py --all --exec --demob --consumables --daily --store --requests --stocktake --stocktake-team --store-health --safety --returns --lookup --activity --hitlist --plant --email-only
echo.
if exist "%~dp0NO_OUTLOOK.txt" (
    echo  Outlook drafts are OFF - the .eml files are in
    echo  Reports\(today^)\Emails - open one and press Send.
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAKE_OUTLOOK_DRAFTS.ps1"
)
echo.
echo  Nothing has been sent. Read the drafts, then send.
pause
