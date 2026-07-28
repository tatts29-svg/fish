@echo off
REM =====================================================
REM  COATES | GEAR LOOKUP - QR AT THE WINDOW (one click)
REM  Serves the lookup page on YOUR OWN router's network
REM  and builds the printable QR window poster.
REM  Leave this window open while the store is open.
REM =====================================================
cd /d "%~dp0"
if not exist "START_GEAR_LOOKUP.ps1" (
  echo.
  echo PROBLEM: START_GEAR_LOOKUP.ps1 is not in this folder:
  echo    %~dp0
  echo.
  echo Fix: extract the kit zip fully, then copy START_GEAR_LOOKUP.ps1
  echo into the SAME folder as this .bat file. Don't run files from
  echo inside the zip window - extract first.
  echo.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_GEAR_LOOKUP.ps1"
pause
