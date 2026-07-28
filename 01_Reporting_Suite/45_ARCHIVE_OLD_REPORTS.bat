@echo off
rem ==========================================================
rem  COATES | ARCHIVE OLD REPORTS
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  WHY (Andrew, 28 Jul 2026): "previous days can go."
rem
rem  Puts every report day older than today into ONE zip,
rem  checks that zip opens and holds every file, and only
rem  then clears the folders out.
rem
rem  Settings are not reports - the email routing in
rem  "02 EMAIL CONTROL" and "03 CONTACTS & SETTINGS" stays
rem  put whatever date is on it.
rem ==========================================================
cd /d "%~dp0"
python ARCHIVE_OLD_REPORTS.py
if errorlevel 1 (
    echo.
    echo  Nothing was deleted.
)
echo.
pause
