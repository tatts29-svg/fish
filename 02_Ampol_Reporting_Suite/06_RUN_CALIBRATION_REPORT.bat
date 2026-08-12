@echo off
title Coates Ampol - 06 Calibration Report
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  06 - CALIBRATION REGISTER REPORT
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% build_calibration_report.py %*
echo.
echo  Done. Today's output: Reports\(today's date)\Calibrations
echo.
pause
