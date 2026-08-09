@echo off
rem =====================================================================
rem  COATES | CHECK EVERY BUTTON
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Run me after any update, or the first time the suite lands on a
rem  new computer. I press nothing and change nothing - I just check
rem  that every numbered button would work if you pressed it, and say
rem  in plain words what to fix if one would not.
rem =====================================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" CHECK_EVERY_BUTTON.py %*
echo.
pause
