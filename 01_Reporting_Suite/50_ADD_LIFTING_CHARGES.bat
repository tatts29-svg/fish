@echo off
rem ==========================================================
rem  COATES | ADD LIFTING CHARGES - slings & shackles
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Records the 17 approved lifting consumable lines (round
rem  slings + shackles, approved by David Moore) in the charge
rem  register - $2,825.11 total, matching the ONE service
rem  charge "Lifting Consumables" keyed into SiteIQ.
rem
rem  Register is backed up first. Safe to run twice - it will
rem  never double-charge.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py ADD_LIFTING_CHARGES.py %*) || (python ADD_LIFTING_CHARGES.py %*)
echo.
pause
