@echo off
rem =====================================================================
rem  COATES K2 - ALIGN EXCEL DATA (one story, both places)
rem  Backs up the K2 workbook, refreshes it from THIS folder, trues up
rem  the stale cells to the same figures the reports carry, then runs
rem  the cell-by-cell parity check. The Excel's queries, formulas and
rem  layouts are never changed. Close the K2 workbook in Excel first.
rem =====================================================================
cd /d "%~dp0"
py _align_prep.py 2>nul || python _align_prep.py
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ALIGN_EXCEL_DATA.ps1"
echo.
py verify_excel_alignment.py 2>nul || python verify_excel_alignment.py
echo.
pause
