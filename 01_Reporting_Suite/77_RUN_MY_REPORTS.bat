@echo off
rem =====================================================================
rem  COATES | YOUR OWN REPORTS - build every idea you saved
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Every report you designed with 76_DESIGN_A_REPORT and chose to
rem  keep, rebuilt off this morning's numbers.
rem
rem  They live in REPORT_RECIPES.txt, one line each. Delete a line and
rem  it stops building. It is your file - an update never touches it.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

%PYCMD% report_designer.py --all
echo.
pause
