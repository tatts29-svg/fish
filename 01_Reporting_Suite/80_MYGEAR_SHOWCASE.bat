@echo off
title COATES ^| MY GEAR - THE SHOWCASE
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python
echo.
echo  Building the showcase FROM your live board, so it can never
echo  drift away from what the store is actually serving.
echo.
%PYCMD% build_mygear_showcase.py
echo.
start "" "MYGEAR_SHOWCASE.html"
echo.
echo  ONE FILE - MYGEAR_SHOWCASE.html. Copy it to a memory stick and
echo  it opens on any machine. No network, no server, nothing to
echo  install, and not a dollar figure on it.
echo.
echo  TIP: run 04_RUN_MY_GEAR first if you want today's shelf.
echo.
pause
