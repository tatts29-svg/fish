@echo off
REM ============================================================
REM  COATES | MY GEAR - TEMPORARY TEST (serve on EVERY network)
REM  Serves the page on every connection at once, like the old
REM  launcher did. Use it to test the phones, then close this
REM  and go back to 05_START_GEAR_LOOKUP.bat for normal running.
REM ============================================================
cd /d "%~dp0"
if not exist "Gear_Lookup\index.html" (
  echo PROBLEM: run this from the 01_Reporting_Suite folder - it
  echo needs the Gear_Lookup folder next to it.
  pause & exit /b 1
)
echo Your laptop's addresses right now (try each on the phone):
ipconfig | findstr /i "IPv4"
echo.
echo Serving on ALL of them - phones try  http://ADDRESS:8123
echo Watch below: a phone that gets through prints a new line.
echo Close this window when done testing.
cd Gear_Lookup
python -m http.server 8123 --bind 0.0.0.0
pause
