@echo off
rem ==========================================================
rem  COATES | CHECK DATA SOURCES
rem  Shows where the workbook's queries are actually looking.
rem  Safe to run while a refresh is going - I only read.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py CHECK_DATA_SOURCES.py) || (python CHECK_DATA_SOURCES.py)
pause
