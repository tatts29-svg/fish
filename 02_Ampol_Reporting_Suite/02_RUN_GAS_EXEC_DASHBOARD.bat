@echo off
title Coates Ampol - 02 Gas Executive Dashboard
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  02 - GAS EXECUTIVE DASHBOARD (V18 email dashboard)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% generate_v18_gas_monitor_report.py %*
echo.
echo  Done. Today's output: Reports\(today's date)\Gas_Monitors
echo.
pause
