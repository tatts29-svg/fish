@echo off
rem =====================================================================
rem  COATES | ON-HIRE WORKBOOK - every tab, from today's exports
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Rebuilds the shutdown on-hire workbook for whichever job this
rem  computer is running (57_SWITCH_JOB.bat tells you which). Twelve
rem  tabs, all of them filled, off the SiteIQ exports in the job's
rem  data folder.
rem
rem  Coates Labour and Cost Breakdown are YOUR typing. They are read
rem  out of the last workbook and written straight back - never
rem  recalculated, never overwritten.
rem
rem  Your original .xlsm is never written to. A clean dated workbook
rem  lands in the job's Reports folder for today.
rem =====================================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" build_onhire_workbook.py %*
echo.
pause
