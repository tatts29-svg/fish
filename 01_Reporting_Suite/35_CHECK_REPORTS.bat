@echo off
rem ==========================================================
rem  COATES | CHECK REPORTS
rem  Reads today's finished report pages the way a person does
rem  and fails on anything that isn't a real value - an
rem  unfilled {placeholder}, a stray None or nan.
rem
rem  A report that is WRONG never looks broken to the machine
rem  that built it. Run this after 00_RUN_EVERYTHING and
rem  before you send anything.
rem
rem  Add --all to check every report ever built, not just today.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" CHECK_REPORTS.py %*
pause
