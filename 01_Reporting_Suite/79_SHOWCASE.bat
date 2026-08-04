@echo off
title COATES ^| THE SHOWCASE
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python
%PYCMD% build_showcase.py
echo.
echo  Opening it...
start "" "K2_SHOWCASE.html"
echo.
echo  ONE FILE - K2_SHOWCASE.html. Copy it anywhere, open it on any
echo  machine. No network, no server, nothing to install.
echo.
pause
