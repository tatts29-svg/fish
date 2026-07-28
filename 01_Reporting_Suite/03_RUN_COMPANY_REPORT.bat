@echo off
rem ==========================================================
rem  COATES | K2 COMPANY ON-HIRE REPORT
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me. Pick a company. Reports land in
rem  Reports\<today's date>\  - one folder per day
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

python build_company_onhire_report.py %*

echo.
pause
