@echo off
rem =====================================================================
rem  COATES | CHECK TODAY'S EMAIL PACKS
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Proves the packs without building anything. Reads the routing
rem  workbook for itself, opens every draft the way Outlook opens it,
rem  and compares the two - then deliberately feeds four routing
rem  mistakes through the builder to be sure they'd be caught.
rem
rem  Run it any time you want to be certain before you send.
rem =====================================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" TEST_DAILY_PACKS.py %*
echo.
pause
