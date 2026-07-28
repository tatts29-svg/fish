@echo off
REM ==========================================================
REM  COATES | BUILD MY GEAR - one click
REM  Rebuilds Gear_Lookup\index.html (the scorecard page)
REM  from the ON_HIRE / TRANSACTIONS exports in this folder.
REM  Then serve it with 05_START_GEAR_LOOKUP.bat as usual.
REM ==========================================================
cd /d "%~dp0"
python BUILD_MY_GEAR.py
pause
