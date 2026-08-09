@echo off
rem ==========================================================
rem  COATES | PACK FOR CLAUDE - reconcile pack, one click
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Gathers the current copies of the version-reconcile files
rem  on THIS machine into one zip in Downloads, named after
rem  the machine. Upload that zip to the chat. Run me on BOTH
rem  laptops - two zips, two uploads, done.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" PACK_FOR_CLAUDE.py %*
echo.
pause
