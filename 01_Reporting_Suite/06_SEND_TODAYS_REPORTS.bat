@echo off
rem ==========================================================
rem  COATES | SEND TODAY'S REPORTS - the automatic send-out
rem  Builds native Outlook emails for every report generated
rem  today (from Reports\<today>\), addresses them from
rem  Coates_Report_Recipients.xlsx, and SENDS every one that
rem  has a To address in the book. Reports with no address yet
rem  are left in your Drafts folder for review instead - the
rem  kit never guesses an email address.
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem ==========================================================
cd /d "%~dp0"
echo.
echo  This will SEND today's reports to everyone in the
echo  recipients book (Include = Yes). Reports with no address
echo  in the book stay in Drafts instead of sending.
echo.
echo  ------------------------------------------------------------
echo  NOTE - TWO ADDRESS SOURCES, AND THEY ARE NOT THE SAME BOOK
echo.
echo   This button uses Coates_Report_Recipients.xlsx.
echo   The company email packs use K2_Daily_Email_Report_Allocation.xlsx
echo   and are checked before they are called ready.
echo.
echo   For the daily company and Cement emails, send from the packs:
echo   K2 DAILY REPORTING\01 COMPANY REPORTS\(company)\(today)
echo   Open Email Draft - (today).eml, read it, press Send.
echo  ------------------------------------------------------------
echo.
set /p CONFIRM=Type YES to send now (anything else cancels):
if /i not "%CONFIRM%"=="YES" (
    echo.
    echo Cancelled - nothing was sent.
    pause
    exit /b 0
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAKE_OUTLOOK_DRAFTS.ps1" -Send -Force %*
echo.
pause
