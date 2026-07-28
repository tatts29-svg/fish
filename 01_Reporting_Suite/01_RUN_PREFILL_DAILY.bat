@echo off
rem ==========================================================
rem  COATES | K2 DAILY TRACKING PREFILL
rem  Fills today's shift-day Actuals (5am to 5am) in the K2
rem  workbook's Daily Tracking from live SiteIQ data.
rem  Close the K2 workbook in Excel before running.
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem ==========================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0PREFILL_DAILY_TRACKING.ps1" %*
echo.
pause
