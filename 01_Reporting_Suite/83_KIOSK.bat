@echo off
rem =====================================================================
rem  COATES K2 - KIOSK MODE (the screen on the counter)
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem
rem  A bloke walks up, scans his card, sees his gear. Then the screen
rem  forgets him before the next bloke arrives.
rem
rem  A USB hand scanner is all you need - it types the card number and
rem  presses Enter, and this page is always listening for exactly that.
rem
rem  The screen clears itself after 30 seconds of quiet, counting the
rem  last 6 down so a bloke reading his list can touch it and keep it.
rem  Want longer or shorter? Change ?kiosk to ?kiosk=45 below (8 to 600
rem  seconds).
rem
rem  Start 05_START_GEAR_LOOKUP first so the store server is running.
rem  Press F11 in the browser for full screen.
rem =====================================================================
cd /d "%~dp0"
start "" "http://localhost:8000/index.html?kiosk"
