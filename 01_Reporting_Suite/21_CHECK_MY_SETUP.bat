@echo off
rem ==========================================================
rem  COATES | CHECK MY SETUP - run me first on a new computer
rem  Says in plain words what is missing or not downloaded.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py CHECK_MY_SETUP.py) || (python CHECK_MY_SETUP.py)
pause
