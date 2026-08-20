@echo off
rem ==========================================================
rem  COATES | HVAC & POWER CATALOG - what we can get, one page
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Builds HVAC_POWER_CATALOG.html from the register
rem  HVAC_POWER_EQUIPMENT_CATALOG.xlsx: packaged air cons,
rem  fluid chillers, air handlers, and the 150-1250kVA diesel
rem  gensets - the MODEL code to order each by, the pricing
rem  group it bills under (a code, not a rate - no dollars on
rem  the page), and what's already on K2 read live from the
rem  newest RENTAL_STOCK export.
rem
rem  Add or fix a model IN THE REGISTER, run me again, done.
rem  Ctrl+P on the page prints it A4 for the counter.
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

python build_equipment_catalog.py
if errorlevel 1 (
    echo.
    pause
    exit /b 1
)

start "" "HVAC_POWER_CATALOG.html"

echo.
pause
