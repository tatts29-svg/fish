@echo off
rem ==========================================================
rem  COATES | CHARGE REPORTER
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me. Opens the form in your browser to log a
rem  Damage, Consumables, Fuel or Transport charge. Runs only
rem  on this computer (127.0.0.1). Close the black window when
rem  you are finished.
rem ==========================================================
cd /d "%~dp0"

call "%~dp0..\_RUN.bat" Coates_K2_Charge_Reporter\charge_reporter.py %*

echo.
pause
