@echo off
title COATES ^| UTILISATION CONTROL - Andrew's hub
cd /d "%~dp0"
python build_control_hub.py
echo.
echo   Your hub - the page-2 design. Shutdown clock, the two
echo   performance bars, the tiles, the day-by-day timeline of the
echo   shut, what needs attention, and the aisle bars.
echo.
echo   It opens itself in the browser when built, and its top row
echo   links your other three pages: Utilisation Intelligence,
echo   Money and What's Used, and Fleet Details.
echo.
echo   COATES INTERNAL - it carries revenue. It lives in Reports\
echo   with the other internal pages and is never linked from any
echo   page on the store Wi-Fi.
echo.
pause
