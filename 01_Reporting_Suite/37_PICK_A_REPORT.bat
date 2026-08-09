@echo off
rem ==========================================================
rem  COATES | PICK A REPORT
rem  Shows every report in the suite as a numbered list.
rem  Type the number you want - or a few, like  1 2 5  - and
rem  it builds only those.
rem
rem  Then asks: emails only, or pages and PDFs on file too.
rem
rem  Use this instead of 00_RUN_EVERYTHING when you just want
rem  today's hit list or one company's report. Nothing sends.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" PICK_REPORT.py %*
pause
