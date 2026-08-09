@echo off
rem ==========================================================
rem  COATES | MY GEAR over HTTPS
rem  Serves My Gear securely so the SCAN button works on
rem  phones - a bloke scans his own ID card instead of typing
rem  his number. Plain http (button 05) can never do this:
rem  browsers block the camera on unsecured pages.
rem  Leave this window open while the store is running.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" SERVE_GEAR_HTTPS.py
pause
