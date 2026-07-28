@echo off
rem ==========================================================
rem  COATES | FIX FILE ACCESS
rem  Run me when Excel or Python says "cannot access the file"
rem  or "Permission denied" on the K2 workbook.
rem  If it says some files needed admin, right-click me and
rem  choose "Run as administrator".
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py FIX_FILE_ACCESS.py) || (python FIX_FILE_ACCESS.py)
pause
