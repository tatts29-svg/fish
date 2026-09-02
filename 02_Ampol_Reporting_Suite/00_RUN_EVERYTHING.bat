@echo off
title Coates Ampol - Run Everything
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  00 - RUN EVERYTHING (the whole morning in one button)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

echo.
echo  [1/8] Gas monitor report (K2-style PDF)...
%PYCMD% generate_k2style_gas_monitor_report.py
echo.
echo  [2/8] Gas monitor email draft...
%PYCMD% generate_k2style_email.py
echo.
echo  [3/8] Gas executive dashboard (V18)...
%PYCMD% generate_v18_gas_monitor_report.py
echo.
echo  [4/8] Radio report...
%PYCMD% build_radio_report.py
echo.
echo  [5/8] Tooling reports (all of them)...
%PYCMD% build_ampol_tooling_report.py --everything
echo.
echo  [6/8] Stocktake report...
%PYCMD% build_stocktake_house_style.py
echo.
echo  [7/8] Calibration register report...
%PYCMD% build_calibration_report.py
echo.
echo  [8/8] Rigging register report...
%PYCMD% build_rigging_report.py
echo.
if exist NO_OUTLOOK.txt (
  echo  NO_OUTLOOK.txt found - skipping Outlook drafts on this machine.
) else (
  echo  Making Outlook drafts - nothing sends without you pressing Send...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAKE_OUTLOOK_DRAFTS.ps1"
)
echo.
echo  Final check - sweeping today's pages for blanks and placeholders...
%PYCMD% CHECK_REPORTS.py
echo.
echo  ============================================================
echo   Everything landed in Reports\(today's date^) - one folder
echo   per report family. Emails are DRAFTS in Outlook - read
echo   them, then press Send yourself. Nothing sends by itself.
echo  ============================================================
pause
