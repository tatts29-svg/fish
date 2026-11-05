@echo off
rem =====================================================================
rem  COATES | MAKE ONE OUTLOOK DRAFT PER COMPANY
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Optional. Button 2 writes, for every company that touched the
rem  counter, an email draft (.eml) in Reports\<today>\By_Company with
rem  that company's page of the pack attached - their position, their
rem  people and what each holds, the ask. Each .eml opens as a draft on
rem  its own. Press me instead to put ALL of them into Outlook > Drafts
rem  as native drafts, where the To field searches the address book.
rem  Nothing sends by itself - you add the address and press Send.
rem
rem  Needs Outlook on this computer, opened at least once. Run button
rem  2 first, so there is a report for today to draft from.
rem =====================================================================
cd /d "%~dp0"
if not exist "%~dp0MAKE_OUTLOOK_DRAFT.ps1" (
    echo  MAKE_OUTLOOK_DRAFT.ps1 is missing - extract the zip again.
    pause
    exit /b 2
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAKE_OUTLOOK_DRAFT.ps1" -Companies %*
echo.
pause
