@echo off
rem =====================================================================
rem  COATES | MAKE A NATIVE OUTLOOK DRAFT
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Optional. The .eml in Reports\<today>\ opens as a draft on its own.
rem  Press me instead when you want the SAME email saved as a NATIVE
rem  Outlook draft - the kind where the To field searches the address
rem  book and autocompletes. It lands in Outlook > Drafts, with the
rem  workbook and the company pack attached. Nothing sends by itself.
rem
rem  Needs Outlook on this computer, opened at least once. Run button
rem  2 first, so there is a report for today to draft.
rem =====================================================================
cd /d "%~dp0"
if not exist "%~dp0MAKE_OUTLOOK_DRAFT.ps1" (
    echo  MAKE_OUTLOOK_DRAFT.ps1 is missing - extract the zip again.
    pause
    exit /b 2
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAKE_OUTLOOK_DRAFT.ps1" %*
set "RC=%errorlevel%"
echo.
pause
exit /b %RC%
