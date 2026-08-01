@echo off
rem ==========================================================
rem  COATES | THE OFFLINE DAY - keep trading when the line drops
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | MY GEAR HQ
rem  Double-click me.
rem
rem  SiteIQ lives in the cloud. The store does not.
rem
rem  Almost everything here already works with no internet - the
rem  phone page, the stores board, every report button, the label
rem  printer. The ONE job that needs the uplink is pulling a fresh
rem  SiteIQ export each morning.
rem
rem  So this prints the pack that covers those hours:
rem    * how old the data is, said out loud
rem    * who has what, and what was on the shelf
rem    * ISSUE and RETURN logs to fill in at the window
rem    * the catch-up order for when the line comes back
rem    * emergency numbers and the contact board, on paper
rem
rem  PRINT IT AND PUT IT IN THE DRAWER BEFORE YOU NEED IT.
rem
rem  Output lands in Reports\<today's date>\Pages\
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

python build_offline_day.py
for /f "delims=" %%f in ('dir /b /o-d /s Reports\*Offline_Day*.html 2^>nul') do (
    start "" "%%f"
    goto opened
)
:opened

echo.
pause
