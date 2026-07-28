@echo off
rem ==========================================================
rem  COATES | BUILD WORKBOOK HTML PAGES
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me. Reads your K2 workbook (read-only) and
rem  rebuilds an HTML page for every tab into K2_Workbook_Pages\
rem  It never changes your workbook.
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

rem make sure the one library we need is present (same one your other tools use)
python -c "import openpyxl" >nul 2>nul || python -m pip install openpyxl

python build_workbook_html.py %*

echo.
echo Done. Open K2_Workbook_Pages\index.html
pause
