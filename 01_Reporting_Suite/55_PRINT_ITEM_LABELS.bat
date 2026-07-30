@echo off
rem ==========================================================
rem  COATES | PRINT ITEM LABELS - QR stickers on the Zebra
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Prints QR item labels straight to the store's Zebra ZT230
rem  over the store Wi-Fi router - no driver, no install, no IT.
rem  The QR is the item number, same as the sheets, so scanner
rem  and phone read shelf, gear and paperwork the same way.
rem
rem  FIRST TIME: plug the Zebra into YOUR store router, hold its
rem  FEED button till the light flashes (it prints its IP), put
rem  that IP into zebra_printer.txt, then run me and pick the
rem  TEST LABEL before any batch.
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

python ZEBRA_LABELS.py %*

echo.
pause
