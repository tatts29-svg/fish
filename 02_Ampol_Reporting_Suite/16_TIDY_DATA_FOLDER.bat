@echo off
title Coates Ampol - 16 Tidy the Data folder
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  16 - TIDY THE DATA FOLDER (one-off, safe to run again)
rem       Data\SiteIQ    - the three SiteIQ pulls, never edited
rem       Data\Editable  - Ampol_Master.xlsx (descriptions, pricing,
rem                        serials), the calibration and rigging
rem                        registers, the store layout
rem       Builds the master from the four old files and parks them
rem       in Data\_Archive_workbooks. Moves only - nothing deleted.
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% tidy_data_folder.py
echo.
echo.
pause
