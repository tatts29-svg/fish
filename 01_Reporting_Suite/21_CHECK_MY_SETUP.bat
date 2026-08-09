@echo off
rem ==========================================================
rem  COATES | CHECK MY SETUP - run me first on a new computer
rem  Says in plain words what is missing or not downloaded.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" CHECK_MY_SETUP.py
pause
