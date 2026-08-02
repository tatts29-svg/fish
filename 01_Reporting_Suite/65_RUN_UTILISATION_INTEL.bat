@echo off
title COATES ^| MY GEAR HQ - UTILISATION INTELLIGENCE
cd /d "%~dp0"
python build_utilisation_intel.py
echo.
echo   COATES INTERNAL. This page carries revenue for every asset, so it
echo   is written to Reports\ with the other internal reports - it never
echo   goes on the store Wi-Fi and it never goes to the client.
echo.
pause
