@echo off
title Coates Ampol - 01 Gas Monitor Report
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  01 - GAS MONITOR REPORT (K2-style PDF + email draft)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% generate_k2style_gas_monitor_report.py %*
%PYCMD% generate_k2style_email.py
echo.
echo  Done. Today's output: Reports\(today's date)\Gas_Monitors
echo  The email is a DRAFT - read it, then press Send yourself.
echo.
pause
