@echo off
rem ==========================================================
rem  COATES | K2 BILLING RECONCILIATION
rem  Checks Daily Tracking Plant+Tooling Actual against SiteIQ's
rem  real invoiced HIRE total (DAILY_SUMMARY export), day by day.
rem  Close the K2 workbook in Excel before running.
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem ==========================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0REFRESH_BILLING_RECONCILIATION.ps1" %*
echo.
pause
