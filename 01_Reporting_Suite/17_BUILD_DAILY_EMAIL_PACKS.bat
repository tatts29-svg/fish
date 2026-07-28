@echo off
rem =====================================================================
rem  COATES | BUILD TODAY'S EMAIL PACKS
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Takes today's reports and lays out the day's email packs:
rem
rem    K2 DAILY REPORTING\01 COMPANY REPORTS\<Company>\<today>\
rem       <Company> - On-Hire Report - <today>.html   goes in the body
rem       Daily Safety & Compliance Report - <today>.pdf  attached
rem       Email Draft - <today>.eml       addressed, ready to send
rem       Email Record - <today>.txt      who, what, and the checks
rem
rem  Every address comes from K2_Daily_Email_Report_Allocation.xlsx.
rem  Change the workbook, run this again, the packs follow it.
rem
rem  NOTHING SENDS. Open the .eml, read it, press Send yourself.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

%PYCMD% BUILD_DAILY_EMAIL_PACKS.py %*
echo.
echo  Now proving them...
echo.
%PYCMD% TEST_DAILY_PACKS.py
echo.
echo ---------------------------------------------------------------
echo  The day's status board:
echo  K2 DAILY REPORTING\02 EMAIL CONTROL\Daily Email Control.html
echo ---------------------------------------------------------------
echo.
pause
