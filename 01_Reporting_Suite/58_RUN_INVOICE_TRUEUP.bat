@echo off
rem ==========================================================
rem  COATES | INVOICE TRUE-UP - the monthly invoice, proven
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Drop the invoice PDF into Invoices\ and the Baseplan
rem  charges export into Baseplan\ (both folders make
rem  themselves on first run - newest file wins), then
rem  double-click me. Every line is recomputed from its own
rem  dates, quantity and rate, tied against what was billed,
rem  the streams re-added, GST checked, and the radio/gas fleet
rem  counts crossed against the rental stock register.
rem
rem  Out comes Invoice_TrueUp_<date>.xlsx - the bottom line to
rem  hold against the printed PDF, and a CHECKS sheet with the
rem  questions worth asking. This is the separate monthly
rem  stream; 54 covers the SiteIQ daily invoice.
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

python INVOICE_TRUEUP.py %*
for /f "delims=" %%f in ('dir /b /o-d Invoice_TrueUp_*.xlsx 2^>nul') do (
    start "" "%%f"
    goto opened
)
:opened

echo.
pause
