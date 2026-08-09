@echo off
rem ==========================================================
rem  COATES | IS IT WORKING?
rem  Run me in a SECOND window while the align is going.
rem  Tells you if Excel is busy, thinking, or actually stuck.
rem  I only watch - I never touch Excel or your files.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" IS_IT_WORKING.py
pause
