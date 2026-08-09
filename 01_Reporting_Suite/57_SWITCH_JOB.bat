@echo off
rem =====================================================================
rem  COATES | WHICH JOB IS THIS COMPUTER RUNNING?
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  One suite, more than one shutdown. This says which job this
rem  computer is on. Everything follows it - which exports get read,
rem  where the reports land, and the customer name on every heading.
rem
rem  Nothing is deleted and nothing is mixed. Each job keeps its own
rem  folders, so you can switch back and forth as often as you like.
rem =====================================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" SWITCH_JOB.py %*
echo.
pause
