@echo off
rem =====================================================================
rem  COATES | THE PRINT HUB - every report you have, on one page
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  "Reports are endless." They are - 62 pages and 54 PDFs before
rem  breakfast, in two folders, named the way a computer names things.
rem
rem  37_PICK_A_REPORT lists what you can BUILD. This lists what you
rem  HAVE: every report built, grouped by who it is for, what each one
rem  answers in your words, when it was built, and one tap to open it
rem  or print the PDF.
rem
rem  And what is NOT there - anything that has built before and did not
rem  build this morning, in red, with the button that makes it.
rem
rem  COATES INTERNAL. It names the money reports and links straight to
rem  them, so it lives in Reports\ and never in Gear_Lookup.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

%PYCMD% build_print_hub.py %*
echo.
pause
