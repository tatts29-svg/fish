@echo off
rem ==========================================================
rem  COATES | ADD NEW CONTACTS - John Pickels' list, 28 Jul
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  One double-click:
rem   - the four contractor contacts John sent (Industec &
rem     Filtercare, IRET, Bosch, Cutrite) go into the
rem     recipients book, switched OFF until you 34 them on
rem   - John Pickels joins Thomas, Cody, Ben and David in the
rem     fixed CC block, so all five ride on every company email
rem
rem  Both workbooks are backed up first. Safe to run twice.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" ADD_NEW_CONTACTS.py %*
echo.
pause
