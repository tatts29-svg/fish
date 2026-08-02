@echo off
title COATES ^| MY GEAR HQ - HIDDEN ITEMS
cd /d "%~dp0"
python hidden_stock.py
echo.
echo   To change the list, open HIDDEN_ITEMS.txt in Notepad.
echo   Add a line to hide something, delete a line to bring it back.
echo   Then run 04_RUN_MY_GEAR.bat to rebuild.
echo.
pause
