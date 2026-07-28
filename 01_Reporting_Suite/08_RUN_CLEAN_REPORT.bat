@echo off
rem ==========================================================
rem  COATES | K2 CLEAN REGISTER (v11.5 CLEAN)
rem  Builds Cement_Australia_Report_2026_K2_v11_5_CLEAN.xlsx
rem  Barcode-free - ITEM_NUMBER + Plant ID - never touches
rem  your live workbook. Re-run any time to refresh.
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem ==========================================================
cd /d "%~dp0"
where python >nul 2>nul || (echo Install Python 3 from python.org ^&^& pause ^& exit /b 1)
python -c "import openpyxl" >nul 2>nul || python -m pip install openpyxl
python build_clean_report.py %*
echo.
pause
