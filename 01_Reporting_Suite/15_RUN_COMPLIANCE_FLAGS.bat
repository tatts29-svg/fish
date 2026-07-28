@echo off
rem =====================================================================
rem  COATES K2 - COMPLIANCE FLAGS
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Fills the four compliance columns in K2_MASTER_EQUIPMENT_PRICING.xlsx:
rem
rem     ELECTRICAL_TAG | RIGGING_TAG | LOGBOOK_REQUIRED | RETURN_REQUIREMENT
rem
rem  Those columns are what put the line UNDER every description on every
rem  report, every email and My Gear - the blue tag, the daily pre-start
rem  and logbook line, and the return-daily note for gas, radios and
rem  battery gear.
rem
rem  Run this when new gear lands in the master. It only fills rows that
rem  are completely blank, so anything you have corrected by hand stays
rem  corrected. Nothing to do? It leaves the file alone.
rem
rem  GOT ONE WRONG? Don't come back here - just open the spreadsheet,
rem  change the cell and run the reports again. Blank means the badge
rem  does not show. The reports read the spreadsheet, every time.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

echo.
echo  Checking the master file for gear with no compliance flags set...
echo.
%PYCMD% SETUP_COMPLIANCE_FLAGS.py %*
echo.
echo  ---------------------------------------------------------------
echo   To preview without changing anything:  15_RUN_COMPLIANCE_FLAGS.bat --dry-run
echo   To redo every row from scratch:        15_RUN_COMPLIANCE_FLAGS.bat --force
echo  ---------------------------------------------------------------
pause
