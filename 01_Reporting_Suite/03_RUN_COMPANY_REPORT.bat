@echo off
rem ==========================================================
rem  COATES | K2 COMPANY ON-HIRE REPORT
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me. Pick a company. Reports land in
rem  Reports\<today's date>\  - one folder per day
rem ==========================================================
cd /d "%~dp0"

call "%~dp0_RUN.bat" build_company_onhire_report.py %*

echo.
pause
