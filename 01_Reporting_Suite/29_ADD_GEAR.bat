@echo off
rem ==========================================================
rem  COATES | ADD GEAR
rem  New machine on site (sub-hire, swap, extra)? Run me and
rem  answer the questions. I update the master, the rate card
rem  and the Plant ID register - backing each one up first.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" ADD_GEAR.py
pause
