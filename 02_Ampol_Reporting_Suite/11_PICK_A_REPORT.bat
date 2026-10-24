@echo off
title Coates Ampol - 11 Pick A Report
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  11 - PICK A REPORT (numbered menu when you only want one thing)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% PICK_REPORT.py %*
echo.
echo  Done.
echo.
pause
