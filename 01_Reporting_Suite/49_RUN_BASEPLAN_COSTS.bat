@echo off
rem ==========================================================
rem  COATES | SEPARATE INVOICE TRACKER - the second stream
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  The separate invoice - radios, gas monitors, welders,
rem  forklift, crib gear - tracked SEPARATE to SiteIQ, with
rem  its own transport, split by invoice month (it bills
rem  calendar months).
rem
rem  Save the Baseplan pull (any .xlsx starting "Baseplan")
rem  into Downloads or this folder, double-click me. It files
rem  itself into Data_Baseplan\ and keeps the previous pull.
rem  Run it again the morning an invoice lands and compare.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py build_baseplan_costs.py %*) || (python build_baseplan_costs.py %*)
echo.
pause
