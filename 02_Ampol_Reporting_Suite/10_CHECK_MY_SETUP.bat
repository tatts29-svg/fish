@echo off
title Coates Ampol - 10 Check My Setup
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  10 - CHECK MY SETUP (new machine doctor - run this first on any new laptop)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% CHECK_MY_SETUP.py %*
echo.
echo  Done.
echo.
pause
