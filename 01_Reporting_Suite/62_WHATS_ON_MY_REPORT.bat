@echo off
title COATES ^| MY GEAR HQ - WHAT'S ON MY REPORT
cd /d "%~dp0"
python report_legend.py
echo.
echo   The A4 sheet above opens in your browser - print it and pin it
echo   at the counter so the crew can read what their own numbers mean.
echo.
echo   If the report changes, change report_legend.py to match. This
echo   button checks itself against BUILD_MY_GEAR.py and will say so
echo   loudly if the two have drifted apart.
echo.
pause
