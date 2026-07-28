@echo off
rem ==========================================================
rem  COATES | K2 CHARGE REPORTER
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me. Opens the form in your browser to log a
rem  Damage, Consumables, Fuel or Transport charge. Runs only
rem  on this computer (127.0.0.1). Close the black window when
rem  you are finished.
rem ==========================================================
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo.
    echo Python 3 was not found on this machine.
    echo Install Python 3 from python.org, tick "Add to PATH",
    echo then run this again.
    echo.
    pause
    exit /b 1
)

python -c "import openpyxl" >nul 2>nul || python -m pip install openpyxl

python charge_reporter.py %*

echo.
pause
