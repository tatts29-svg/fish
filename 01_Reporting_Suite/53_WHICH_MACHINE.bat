@echo off
rem ==========================================================
rem  COATES | WHICH MACHINE IS THIS
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  WHY (Andrew, 28 Jul 2026): "lets name, on your system as
rem  Andrews Laptop and Work Laptop, so when we work on both
rem  we know which one is which."
rem
rem  Run me ONCE on each laptop. Pick the name, and this
rem  writes MACHINE.txt with the real paths on that machine -
rem  where the suite sits, where Downloads is, where the
rem  reports land, how much disk is left.
rem
rem  Send MACHINE.txt up from both and there is nothing left
rem  to guess about which machine is which.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" MACHINE_ID.py
echo.
pause
