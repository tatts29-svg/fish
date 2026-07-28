@echo off
rem COATES | K2 COST TRACKING SNAPSHOT
rem Output lands in Reports\<today's date>\  - one folder per day
cd /d "%~dp0"
where python >nul 2>nul || (echo Install Python 3 from python.org ^&^& pause ^& exit /b 1)
python -c "import openpyxl" >nul 2>nul || python -m pip install openpyxl
python build_cost_snapshot.py %*
echo.
pause
