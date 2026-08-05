@echo off
title COATES ^| SITE PLANT UTILISATION
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python
echo.
echo  How hard the site plant actually worked, what the idle cost,
echo  and what to do differently on the next job.
echo.
%PYCMD% build_plant_utilisation.py
echo.
echo  COATES INTERNAL - it carries rates. Do not send it to a
echo  contractor: it names what their idle gear cost.
echo.
pause
