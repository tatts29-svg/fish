@echo off
rem =====================================================================
rem  COATES K2 - PAGE FLOW STRESS TEST
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Proves the reports still lay out properly as the fleet grows and
rem  more Plant IDs get filled in. Builds pages at 1x, 3x, 10x and 25x
rem  the current fleet with every badge lit and the longest descriptions
rem  we hold, then measures every page that comes out.
rem
rem  It FAILS if any page has a column off the sheet, anything cut, a
rem  heading stranded at the foot of a page, a blank page, or a page
rem  missing the tool store team.
rem
rem  Run it after any layout change, or any time you have added a lot of
rem  gear and want to be sure the packs still print clean.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python
%PYCMD% PAGE_FLOW_STRESS_TEST.py
echo.
pause
