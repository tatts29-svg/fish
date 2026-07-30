@echo off
rem ==========================================================
rem  COATES | ONE-OFF FIX - remove the 28 Jul lifting charges
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me ONCE.
rem
rem  Deletes the seventeen lifting-consumable charge records
rem  (CON-20260728-004 .. -020) that were removed in SiteIQ on
rem  30 Jul, so the register matches SiteIQ again. Backs up the
rem  register first; safe to run twice; then run 00 to rebuild.
rem
rem  A one-off tool, not a numbered button - once it has run
rem  clean you can delete both FIX_DELETE_LIFTING_CHARGES_28JUL
rem  files, or leave them for 51_TIDY to sweep.
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

python FIX_DELETE_LIFTING_CHARGES_28JUL.py %*

echo.
pause
