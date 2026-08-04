@echo off
rem =====================================================================
rem  COATES | REPORTS ON YOUR PHONE
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  The server serves ONE folder - Gear_Lookup - and it held four
rem  pages. Everything else the suite builds, 62 pages a morning, never
rem  left the laptop.
rem
rem  This puts them on your phone:
rem    * money-free reports, copied in and readable by any Coates hand
rem      on the store Wi-Fi - the same data the board already shows
rem    * YOUR money reports, scrambled under your manager code. Anyone
rem      who fetches one gets noise. Your code opens them on the phone.
rem
rem  Open it from the stores board: Bay 04 > This morning's reports.
rem  The worker page does not link it and never will.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

%PYCMD% phone_reports.py %*
echo.
pause
