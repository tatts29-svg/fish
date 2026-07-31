@echo off
rem ==========================================================
rem  COATES | BUSINESS UTILISATION - TU & ROC, Coates eyes only
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me.
rem
rem  The Coates-as-a-business view of the fleet on this job:
rem  TU (time utilisation - of the days the gear has stood on
rem  site, how many did it spend in a worker's hands, occupied
rem  and billed both shown) and ROC (revenue earned against the
rem  replacement value of the fleet deployed - an estimate,
rem  labelled with its coverage).
rem
rem  COATES INTERNAL - this page never joins the client packs.
rem  The client's view of the invoice is 54; this is ours.
rem
rem  Output lands in Reports\<today's date>\
rem ==========================================================
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo.
    echo Python 3 was not found on this machine.
    echo Install Python 3 from python.org, tick "Add to PATH",
    echo then run this again.
    echo.
    pause
    exit /b 1
)

python build_business_utilisation.py %*
for /f "delims=" %%f in ('dir /b /o-d /s Reports\*Business_Utilisation*.html 2^>nul') do (
    start "" "%%f"
    goto opened
)
:opened

echo.
pause
