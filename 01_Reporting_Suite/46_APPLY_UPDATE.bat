@echo off
rem ==========================================================
rem  COATES | APPLY UPDATE - improvements in one double-click
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  HOW TO GET AN IMPROVEMENT DONE:
rem    1. Ask Claude in the chat for what you want changed.
rem    2. Download the K2_UPDATE zip it sends back.
rem    3. Double-click me. That's it.
rem
rem  I find the zip myself (Downloads, this folder, Updates).
rem  Everything I replace is backed up first. Your address
rem  book, charge register and SiteIQ data are never touched.
rem  If the update is broken I put everything back myself.
rem  Safe to run twice - I won't apply the same zip again.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" APPLY_SUITE_UPDATE.py %*
echo.
pause
