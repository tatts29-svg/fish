@echo off
rem =====================================================================
rem  COATES | CHECK THE WAY AROUND MY GEAR
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Opens all four My Gear pages in a real browser, on a phone-sized
rem  screen, and walks them the way a bloke at the window does: in,
rem  deeper, back out, and off to the next page.
rem
rem  It proves the BACK button is never dead, the MENU reaches every
rem  page in two taps, the bar says where you are, and the phone's own
rem  Back button steps back one screen instead of leaving the app.
rem
rem  It also proves every page's script actually PARSED - a page can
rem  build perfectly, be the right size, and be stone dead.
rem
rem  Run it after 04_RUN_MY_GEAR, before the phones see it.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

%PYCMD% TEST_MY_GEAR_NAV.py %*
echo.
pause
