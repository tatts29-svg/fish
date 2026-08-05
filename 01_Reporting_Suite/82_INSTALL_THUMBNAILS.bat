@echo off
rem =====================================================================
rem  COATES K2 - INSTALL A THUMBNAIL DROP (safely, or not at all)
rem  Drop the delivery zips into Data_Thumbnail_Drops\ first.
rem  A real photo is never overwritten by a render.
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python
%PYCMD% INSTALL_THUMBNAIL_DROP.py
pause
