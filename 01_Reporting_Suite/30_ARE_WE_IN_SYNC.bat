@echo off
rem ==========================================================
rem  COATES | ARE WE IN SYNC?
rem  One screen: how fresh the exports are, when the reports
rem  were built, when the workbook was aligned - and whether
rem  anything was built off older data than it should be.
rem  Run me before you send the day's emails.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" ARE_WE_IN_SYNC.py
pause
