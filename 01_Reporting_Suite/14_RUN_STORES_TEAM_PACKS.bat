@echo off
rem ==========================================================
rem  COATES | K2 STORES TEAM PACKS - the crew's two reports
rem  1. Stores Stocktake - Team Report (the people turning
rem     the wheel: counts, shifts, scoreboard, 24-hour split)
rem  2. Store Consumables - Stock Watch (cover, checks,
rem     watch list, when the shelf gets hit)
rem  Builds from the freshest exports every run. Outputs land
rem  in Reports\<today>\PDF and Pages; Outlook drafts wait on
rem  the 06 button as always. Also built by 00_RUN_EVERYTHING.
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem ==========================================================
cd /d "%~dp0"
where python >nul 2>nul || (echo Install Python 3 from python.org ^&^& pause ^& exit /b 1)
python -c "import openpyxl" >nul 2>nul || python -m pip install openpyxl
python build_company_onhire_report.py --stocktake-team --store-health %*
echo.
pause
