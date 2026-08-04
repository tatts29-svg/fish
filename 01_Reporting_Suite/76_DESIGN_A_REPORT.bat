@echo off
rem =====================================================================
rem  COATES | DESIGN A REPORT - the endless one
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Twenty-three fixed reports is not endless - it is twenty-three.
rem  Every one of them was somebody's idea once and had to be built.
rem
rem  This is the engine instead. FOUR QUESTIONS:
rem
rem     WHAT is one line?   an asset, a bloke, a company, a product,
rem                         an aisle
rem     WHICH ones?         eighteen filters, stack as many as you like
rem     GROUPED how?        company, bloke, aisle, product, band, status
rem     SORTED how?         longest out, hardest worked, least worked,
rem                         most used, biggest holding, A to Z
rem
rem  "Every socket out past 7 days, by company, worst first" is a
rem  report. So is "products nobody has touched" and "the hardest
rem  worked machines on site". None of them existed five minutes ago.
rem
rem  Name it and it is SAVED into REPORT_RECIPES.txt - your file, an
rem  update never overwrites it - and 77_RUN_MY_REPORTS builds every
rem  saved one each morning.
rem
rem  No money on any of it, by design. Rates live behind the manager
rem  code and nowhere else.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

%PYCMD% report_designer.py %*
echo.
pause
