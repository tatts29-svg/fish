@echo off
rem ==========================================================
rem  COATES | CHECK DATA SOURCES
rem  Shows where the workbook's queries are actually looking.
rem  Safe to run while a refresh is going - I only read.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" CHECK_DATA_SOURCES.py
pause
