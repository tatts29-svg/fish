@echo off
title Coates Ampol - 10 Check My Setup
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  10 - CHECK MY SETUP (new machine doctor - run this first on any new laptop)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"
rem WHY (07 Nov 2026): Windows keeps a "python" shortcut that only opens the
rem Microsoft Store - prove a real Python answers before anything starts
%PYCMD% -c "import sys" >nul 2>nul
if errorlevel 1 (
  echo.
  echo  ============================================================
  echo   PYTHON IS NOT ON THIS LAPTOP ^(or it does not start^)
  echo  ============================================================
  echo   Install Python 3.12 from python.org ^(tick "Add python.exe
  echo   to PATH"^) or from the Microsoft Store. On a locked-down
  echo   laptop ask IT for "Python 3.12 from python.org".
  echo   Then run 10_CHECK_MY_SETUP - it checks everything else.
  echo  ============================================================
  echo.
  pause
  exit /b 1
)

%PYCMD% CHECK_MY_SETUP.py %*
echo.
echo  Done.
echo.
pause
