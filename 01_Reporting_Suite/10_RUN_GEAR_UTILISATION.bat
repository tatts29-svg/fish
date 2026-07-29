@echo off
rem ==========================================================
rem  COATES | UTILISATION - PLANT, TOOL STORE, CONSUMABLES
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me.
rem
rem  How hard everything on this site is working: what is out
rem  right now, what has never moved once since the shut
rem  started, and for consumables - what is on the shelf, what
rem  the count found, and what has to be ordered before the
rem  finish date in shutdown_end.txt.
rem
rem  The old gas-monitor-and-radio version is still on disk as
rem  REFRESH_GEAR_UTILISATION.ps1 and still runs. Radios and
rem  gas monitors are storage units inside this bigger report
rem  now, so nothing was lost by pointing this button here.
rem
rem  Output lands in Reports\<today's date>\  - one folder per day
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

python build_utilisation_report.py %*

echo.
pause
