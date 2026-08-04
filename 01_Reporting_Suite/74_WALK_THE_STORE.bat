@echo off
rem =====================================================================
rem  COATES | WALK THE STORE - the shelf sheet
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  SiteIQ carries no shelf and no bin. So My Gear can tell a bloke
rem  the AISLE and then has to stop - one step short of the question
rem  he is actually being asked at the window.
rem
rem  This prints the store in AISLE ORDER with a box beside every line.
rem  Walk a bay, write the rack in the box, then type them into
rem  RACKS.txt as   CODE ^| RACK   and run 04. The shelf appears on
rem  every phone in the store, in orange, beside the aisle.
rem
rem  One bay at a time:  74_WALK_THE_STORE.bat "Rigging"
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

%PYCMD% RACK_WALK_SHEET.py %*
echo.
pause
