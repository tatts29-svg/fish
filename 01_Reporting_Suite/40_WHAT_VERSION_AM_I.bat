@echo off
rem ==========================================================
rem  COATES | WHAT VERSION AM I
rem  Tells you whether THIS machine has the latest scripts.
rem
rem  If SUITE_VERSION_MASTER.txt is in this folder (Claude
rem  sends it with updates) it says straight out which files
rem  are missing or out of date.
rem
rem  If not, it writes SUITE_VERSION.txt - upload that file
rem  into the chat and you'll get back a zip with only the
rem  files this machine actually needs.
rem
rem  Use this on the work laptop, where the chat is the only
rem  way in and out.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" VERSION_CHECK.py
pause
