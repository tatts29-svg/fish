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

call "%~dp0_RUN.bat" build_workbook_html.py %*

echo.
echo Done. Open K2_Workbook_Pages\index.html
pause
