@echo off
rem ==========================================================
rem  COATES | FLEET FINDER - "can we get one?" - INTERNAL
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | MY GEAR HQ
rem  Double-click me.
rem
rem  A client wants a machine the store doesn't have? Search
rem  the whole branch network instead of phoning around:
rem  what's Available, where, how long it has sat, cost & WDV.
rem
rem  Feed me: drop the MyBranch export
rem  "Fleet Listing by Availability Status" (.xlsx)
rem  into the Fleet folder. Newest file wins.
rem
rem  COATES INTERNAL - cost and WDV are on the page. It never
rem  joins a client pack and never goes on the store Wi-Fi.
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

python build_fleet_finder.py
for /f "delims=" %%f in ('dir /b /o-d /s Reports\*Fleet_Finder_INTERNAL*.html 2^>nul') do (
    start "" "%%f"
    goto opened
)
:opened

echo.
pause
