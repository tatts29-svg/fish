@echo off
rem ==========================================================
rem  COATES | BASEPLAN CHARGES TRACKER - the OTHER invoice
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  The gear billed out of Baseplan - radios, gas monitors,
rem  welders, forklift, crib gear - tracked SEPARATE to
rem  SiteIQ, with its own transport, split by invoice month
rem  (Baseplan bills calendar months).
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
