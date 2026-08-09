@echo off
rem COATES | K2 COST TRACKING SNAPSHOT
rem Output lands in Reports\<today's date>\  - one folder per day
cd /d "%~dp0"
call "%~dp0_RUN.bat" build_cost_snapshot.py %*
echo.
pause
