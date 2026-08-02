@echo off
title COATES ^| MY GEAR HQ - DAYS FROM FLAME OFF
cd /d "%~dp0"
python shutdown_day.py
echo.
echo   Flame Off and the named days are set in shutdown_day.py.
echo   Change them there and every report follows.
echo.
pause
