@echo off
title COATES ^| FLAME OFF - SITE PLANT UTILISATION
cd /d "%~dp0"
python build_flame_off_plant.py
echo.
echo   COATES INTERNAL. Scope is whatever has been on the Site Plant
echo   Equipment account - wherever it sits now. Gear that has left
echo   site shows as DEPARTED, not as idle plant.
echo.
pause
