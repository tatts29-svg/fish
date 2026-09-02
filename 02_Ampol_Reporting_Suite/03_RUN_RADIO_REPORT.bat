@echo off
title Coates Ampol - 03 Radio Report
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  03 - SITE RADIO ON-HIRE REPORT
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% build_radio_report.py %*
echo.
echo  Done. Today's output: Reports\(today's date)\Radios
echo.
pause
