@echo off
rem ==========================================================
rem  COATES | GAS MONITOR & RADIO FLEET UTILISATION
rem  Right-sizing check for the fleet: how many gas monitors
rem  and radio handsets, how many on hire, and how many times
rem  each individual unit has actually gone out.
rem  Close the K2 workbook in Excel before running.
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem ==========================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0REFRESH_GEAR_UTILISATION.ps1" %*
echo.
pause
