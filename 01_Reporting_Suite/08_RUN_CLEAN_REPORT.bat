@echo off
rem ==========================================================
rem  COATES | K2 CLEAN REGISTER (v11.5 CLEAN)
rem  Builds Cement_Australia_Report_2026_K2_v11_5_CLEAN.xlsx
rem  Barcode-free - ITEM_NUMBER + Plant ID - never touches
rem  your live workbook. Re-run any time to refresh.
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" build_clean_report.py %*
echo.
pause
