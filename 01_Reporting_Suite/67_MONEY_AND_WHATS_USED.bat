@echo off
title COATES ^| THE MONEY AND WHAT IS GETTING USED
cd /d "%~dp0"
python build_whats_used.py
echo.
echo   COATES INTERNAL. This page carries the forecast, the rates and
echo   the revenue, so it is written to Reports\ with the other
echo   internal reports - never on the store Wi-Fi, never to the client.
echo.
echo   Two numbers on it are NOT the same thing:
echo     STOPPABLE TODAY   on hire, on charge, nobody using it. A saving.
echo     NOT CHARGING      on site, Available for Hire. NOT a bill.
echo.
pause
